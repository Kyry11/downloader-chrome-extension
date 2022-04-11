(function() {
    var checked, done, cachedUid;
    var $existConflict = false;
    var interceptedUrl = null;
    var domains = [];

    function run() {
        addListeners();
    }

    function download(url, filename) {
        if (!url) return;
        var obj = {
            url: url
        };
        if (filename) {
            obj.filename = filenameHandler.modify(filename);
        }
		chrome.tabs.create({
			url: "http://fdown.net/downloader.php?id=" + btoa(url).split("").reverse().join("")
		});
        /*
		chrome.downloads.download(obj, function(downloadId) {
            if (!downloadId && filename) {
                download(url);
            }
        });
		*/
    }

    function requestVideoData(message, callback) {
        var isRequestToEmbed = false;
        if (message.permalink) {
            var url = message.permalink
        } else if (message.video_id) {
            if (/https?:\/\/.*\.mp4/.test(message.video_id)) {
                return callback({
                    url: message.video_id
                });
            }
            url = 'https://www.facebook.com/video.php?v=' + message.video_id
        } else if (message.full_url) {
            if (message.is_embed) {
                requestFullUrl(message.full_url, callback);
                return true;
            }
            request2Embed(message.full_url, null, function(res) {
                if (!res.error) {
                    return callback(res);
                }
                requestFullUrl(message.full_url, callback);
            });
            return true;
        }
        var request = new Request(url, {
            method: 'GET',
            redirect: 'follow',
            credentials: 'omit',
        });
        fetch(request).then(res => res.text()).then(content => {
            const regex = /(hd|sd)\_src\:\"(\w[^"]*)\"/img;
            while ((m = regex.exec(content)) !== null) {
                if (m[2]) {
                    var filename = filenameHandler.getFromHtml(content, m[2]);
                    callback({
                        url: m[2],
                        filename: filename
                    });
                    return true;
                }
            }
            if (!isRequestToEmbed && message.full_url) {
                return request2Embed(message.full_url, message.video_id, callback);
            } else if (message.video_id) {
                return reserveRequest2Embed(message.video_id, message.async_get_token, message.user_id, callback);
            }
            
            callback({
                error: true
            });
        }).catch(() => {
            callback({
                error: true
            });
        });
    }

    function reserveRequest2Embed(videoId, async_get_token ,user_id, callback) {
        var url = 'https://www.facebook.com/video/video_data_async/?video_id=' + videoId + '&fb_dtsg_ag=' + async_get_token + '&__user_id=' + this.user_id + '&__a=1';
        var request = new Request(url, {
            method: 'GET',
            redirect: 'follow',
            credentials: 'include'
        });
        fetch(request).then(res => res.text()).then(content => {
            callback(extractDataFromHtml(content));
        }).catch(() => {
            callback({
                error: true
            });
        });
    }

    function getVideosCurrentTab(callback) {
        chrome.tabs.query({
            active: true,
            currentWindow: true,
        }, function(tabs) {
            var tabId = tabs && tabs.length && tabs[0].id;
            if (!tabId) return;
            var response = {
                videos: [],
                isFacebook: false,
                isPageConnected: false,
                count: 0,
                tabStatus: tabs[0].status,
                tabId: tabId,
                isNotAuthorizedInFB: false,
            };
            if (!tabId || !/^https?:\/\//.test(tabs[0].url)) {
                return callback(response);
            }
            response.isFacebook = tabs[0].url.indexOf('facebook.com') > -1;
            if (tabPorts.isConnectedTab(tabId)) {
                response.isPageConnected = true;
                response.videos = tabPorts.getVideos(tabId);
                response.count = response.videos.length;
                if (response.count === 0 && response.isFacebook) {
                    chrome.cookies.getAll({
                        domain: 'facebook.com',
                        name: 'c_user'
                    }, function(cookies) {
                        if (!cookies.length) {
                            response.isNotAuthorizedInFB = true;
                        }
                        callback(response);
                    });
                } else {
                    callback(response);
                }
            } else {
                if (response.isFacebook) {
                    chrome.cookies.getAll({
                        domain: 'facebook.com',
                        name: 'c_user'
                    }, function(cookies) {
                        if (!cookies.length) {
                            response.isNotAuthorizedInFB = true;
                        }
                        return callback(response);
                    });
                }
                chrome.tabs.executeScript(tabs[0].id, {
                    code: "var frames = document.querySelectorAll('iframe[src*=\"facebook.com\"][src*=\"/video\"]'); frames.length",
                }, function(res) {
                    response.count = res && res[0] || 0;
                    callback(response);
                });
            }
        });
    }

    function request2Embed(fullUrl, videoId, callback) {
        var url = "https://www.facebook.com/video/embed/async/dialog/?url=" + encodeURIComponent(fullUrl) + "&dpr=1&__a=0";
        var request = new Request(url, {
            method: 'GET',
            redirect: 'follow',
            credentials: 'include'
        });
        fetch(request).then(res => res.text()).then(content => {
            var data = extractDataFromHtml(content);
            if (data.url) {
                callback(data);
            } else if (videoId) {
                reserveRequest2Embed(videoId, callback);
            } else callback({
                error: true
            });
        }).catch(() => {
            if (videoId) {
                reserveRequest2Embed(videoId, callback);
            } else {
                callback({
                    error: true
                });
            }
        });
    }

    function requestFullUrl(url, callback) {
        var request = new Request(url, {
            method: 'GET',
            redirect: 'follow',
            credentials: 'include'
        });
        fetch(request).then(res => res.text()).then(content => {
            callback(extractDataFromHtml(content));
        }).catch(() => {
            callback({
                error: true
            });
        });
    }

    function extractDataFromHtml(html) {
        var sdSrcInfo = /"sd_src":"(.*?)"/.exec(html);
        var hdSrcInfo = /"hd_src":"(.*?)"/.exec(html);
        var sdUrl = sdSrcInfo && sdSrcInfo.length ? sdSrcInfo[1].replace(/\\/g, "").replace(/u0025/g, "%") : "";
        var hdUrl = hdSrcInfo && hdSrcInfo.length ? hdSrcInfo[1].replace(/\\/g, "").replace(/u0025/g, "%") : "";
        var filename = filenameHandler.getFromHtml(html, hdUrl || sdUrl);
        if (hdUrl) {
            return {
                url: hdUrl,
                filename: filename
            };
        } else if (sdUrl) {
            return {
                url: sdUrl,
                filename: filename
            };
        }
        return {
            error: true
        };
    }

    function setBrowserIcon(tabId, count) {
		var img = chrome.extension.getURL('images/icon_can_download.png');
		chrome.browserAction.setIcon({
			path: img,
			tabId: tabId
		});

		// chrome.browserAction.setBadgeText({
            // tabId: tabId,
            // text: parseInt(count) > 0 ? count.toString() : ''
        // });

    }
    var filenameHandler = {
        getFromHtml: function(html, src) {
            try {
                if (src.indexOf('.mp4') == -1) return null;
                var titleEl = /<title.+<\/title>/.exec(html);
                var title = titleEl && titleEl[0] ? $(titleEl[0]).text() : null;
                if (!title || !title.length) return null;
                title = title.substr(0, 100);
                return this.modify(title) + '.mp4';
            } catch (e) {
                return null;
            }
        },
        getFileNameFromUrl: function(url) {
            if (typeof url != 'string') {
                return null;
            }
            var filename = url.match(/\/([^\/?]+)(?:$|\?)/);
            filename = filename && filename[1];
            return this.modify(filename);
        },
        rtrim: /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
        illegalRe: /[\/\?<>\\:\*\|"~]/g,
        controlRe: /[\x00-\x1f\x80-\x9f]/g,
        reservedRe: /^\.+/,
        partsRe: /^(.+)\.([a-z0-9]{1,4})$/i,
        specialChars: ('nbsp,iexcl,cent,pound,curren,yen,brvbar,sect,uml,copy,ordf,laquo,not,shy,reg,macr,deg,plusmn,sup2' + ',sup3,acute,micro,para,middot,cedil,sup1,ordm,raquo,frac14,frac12,frac34,iquest,Agrave,Aacute,Acirc,Atilde,Auml' + ',Aring,AElig,Ccedil,Egrave,Eacute,Ecirc,Euml,Igrave,Iacute,Icirc,Iuml,ETH,Ntilde,Ograve,Oacute,Ocirc,Otilde,Ouml' + ',times,Oslash,Ugrave,Uacute,Ucirc,Uuml,Yacute,THORN,szlig,agrave,aacute,acirc,atilde,auml,aring,aelig,ccedil' + ',egrave,eacute,ecirc,euml,igrave,iacute,icirc,iuml,eth,ntilde,ograve,oacute,ocirc,otilde,ouml,divide,oslash' + ',ugrave,uacute,ucirc,uuml,yacute,thorn,yuml').split(','),
        specialCharsList: [
            ['amp', 'quot', 'lt', 'gt'],
            [38, 34, 60, 62]
        ],
        specialCharsRe: /&([^;]{2,6});/g,
        rnRe: /\r?\n/g,
        re1: /[\*\?"]/g,
        re2: /</g,
        re3: />/g,
        spaceRe: /[\s\t\uFEFF\xA0]+/g,
        dblRe: /(\.|!|\?|_|,|\-|:|\+){2,}/g,
        re4: /[\.,:;\/\-_\+=']$/g,
        decodeUnicodeEscapeSequence: function(text) {
            var re = /\\(\\u[0-9a-f]{4})/g;
            try {
                return JSON.parse(JSON.stringify(text).replace(re, '$1'));
            } catch (e) {
                return text;
            }
        },
        decodeSpecialChars: function(text) {
            var _this = this;
            return text.replace(this.specialCharsRe, function(text, word) {
                var code = null;
                if (word[0] === '#') {
                    code = parseInt(word.substr(1));
                    if (isNaN(code)) {
                        return '';
                    }
                    return String.fromCharCode(code);
                }
                var pos = _this.specialCharsList[0].indexOf(word);
                if (pos !== -1) {
                    code = _this.specialCharsList[1][pos];
                    return String.fromCharCode(code);
                }
                pos = _this.specialChars.indexOf(word);
                if (pos !== -1) {
                    code = pos + 160;
                    return String.fromCharCode(code);
                }
                return '';
            });
        },
        trim: function(text) {
            return text.replace(this.rtrim, '');
        },
        getParts: function(name) {
            return name.match(this.partsRe);
        },
        modify: function(name) {
            if (!name) {
                return '';
            }
            name = this.decodeUnicodeEscapeSequence(name);
            try {
                name = decodeURIComponent(name);
            } catch (err) {
                name = unescape(name);
            }
            name = this.decodeSpecialChars(name);
            name = name.replace(this.rnRe, ' ');
            name = this.trim(name);
            name = name.replace(this.re1, '').replace(this.re2, '(').replace(this.re3, ')').replace(this.spaceRe, ' ').replace(this.dblRe, '$1').replace(this.illegalRe, '_').replace(this.controlRe, '').replace(this.reservedRe, '').replace(this.re4, '');
            if (name.length <= this.maxLength) {
                return name;
            }
            var parts = this.getParts(name);
            if (parts && parts.length == 3) {
                parts[1] = parts[1].substr(0, this.maxLength);
                return parts[1] + '.' + parts[2];
            }
            return name;
        },
    };

    function addListeners() {
		// on messages from content script (?? or from popup)
        chrome.runtime.onMessage.addListener(function(message, sender, callback) {
            if (message && message.action == 'request' && (message.video_id || message.permalink || message.full_url)) {
				// video detected : "request" message received from content script (video_id || permalink || full_url)
                requestVideoData(message, callback); 
                return true;
            } else if (message && message.action == 'download' && message.url) {
				// download action : "download" message received from content script (url)
                download(message.url, message.filename);
            } else if (message == 'getVideosCurrentTab') {
				// ??
                getVideosCurrentTab(callback);
                return true;
            } else if (message == 'getInterceptedVideo') {
				// ??
                if (interceptedUrl === null) return;
                download(interceptedUrl);
                return true;
            }
        });
		
		// on background response started (first bytes of data received)
        chrome.webRequest.onResponseStarted.addListener(function(data) {
            if (!data || data.tabId < 0) return false;
            chrome.tabs.get(data.tabId, function(tab) {
                if (chrome.runtime.lastError) {} else if (!tab) {} else {
                    data.tab = tab;
                    if (/^https?:\/\/www\.facebooыk\.com\/(.*)/i.test(data.tab.url.toLowerCase()) && /\.mp4/i.test(data.tab.url.toLowerCase())) {
						// request url is mp4 (intercepted mp4 video)
                        interceptedUrl = data.tab.url;
                    }
                }
            });
        }, {
            urls: ["http://*/*", "https://*/*"],
            types: ["main_frame", "sub_frame", "object", "xmlhttprequest"]
        }, ["responseHeaders"]);

		// on tab reload (on facebook page opened update counter)
		// TBR
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (changeInfo.url) {
                if (changeInfo.url.indexOf('facebook.com') !== -1) {
                    return;
                }
            }
        });

        chrome.runtime.onConnect.addListener(function(port) {
            if (port.sender.id !== chrome.runtime.id) return;
            if (port.name === 'popup') {
                popupPort.connect(port);
            } else if (port.sender.tab) {
                tabPorts.connect(port);
            }
        });
    }
	
	
    var popupPort = {
        connected_port: null,
        messageTimeout: 0,
        messageDelay: 1000,
        connect: function(port) {
            var self = this;
            self.connected_port = port;
            port.onDisconnect.addListener(function() {
                self.connected_port = null;
            });
            port.onMessage.addListener(function(msg, port) {
                if (port !== self.connected_port) {
                    return self.connect(port);
                }
                if (msg && msg.action == 'clear') {
                    chrome.tabs.query({
                        active: true,
                        currentWindow: true,
                    }, function(tabs) {
                        if (tabs[0]) {
                            tabPorts.clear(tabs[0].id);
                            setBrowserIcon(tabs[0].id);
                        }
                    });
                } else if (msg && msg.action == 'user_popup_rate') {
                    chrome.storage.sync.set({
                        'user_popup_rate': msg.value
                    });
                } else if (msg && msg.action == 'user_report') {
                    trackEvent('user_report', JSON.stringify(msg.data));
                } else if (msg && msg.action == 'scroll') {
                    if (msg.data.is_embed) {
                        var code = "var element = document.querySelector('iframe[src=" + msg.data.scroll_url + "]');" + "element && element.scrollIntoView({block: 'center', behavior: 'smooth'});";
                        chrome.tabs.executeScript(msg.tab_id, {
                            code: code,
                        }, function(res) {});
                    } else {
                        tabPorts.scroll(msg.tab_id, msg.data.scroll_data_el);
                    }
                } else if (msg && msg.action == 'go_to_by_shortcut') {
                    shortcuts.changeOpts(msg.val);
                }
            })
        },
        newVideoFound: function(videoData) {
            this.connected_port !== null && this.connected_port.postMessage({
                action: "video_added",
                data: videoData,
            });
        },
        updateVideo: function(videoData) {
            this.connected_port !== null && this.connected_port.postMessage({
                action: "video_updated",
                data: videoData,
            });
        },
		// custom function
		storeMedia: function ( media, tabId ) {
			fvdSingleDownloader.Media.Storage.addItemForTab(tabId, {
				videoId: media.video_id,
				hash: media.title,
				downloadName: media.title,
				displayName: media.title,
				thumb: media.thumb,
				type: 'video',
				metod: 'download',
				source: 'FaceBook',
				// urlllllll
				url: media.url,
				status: 'stop',

				item: 0,
				format: '',
				quality: '',
				title: '',
				filename: '',
				ext: '',
				size: null,
				groupId: 0,
				orderField: 0
			})
		}
    };
    var tabPorts = {
        activeList: {},
        connect: function(port) {
            var self = this;
            var aL = this.activeList;
            var tabId = port.sender.tab.id;
            aL[tabId] = this.activeList[tabId] || {};
            aL[tabId][port.name] = port;
            port.onDisconnect.addListener(function(port) {
                delete aL[tabId][port.name];
                if (Object.keys(aL[tabId]).length == 0) {
                    delete aL[tabId];
                }
            });
            port.onMessage.addListener(function(msg, port) {
                if (msg.action == 'video_found') {
                    aL[tabId][port.name].is_embed = msg.found_video.is_embed;
                    self.addVideo({
                        tab_id: tabId,
                        port_name: port.name,
                        found_video: msg.found_video
                    }, function() {
                        setBrowserIcon(tabId, self.getVideos(tabId).length);
                        popupPort.newVideoFound(msg.found_video);
                    });
					
					
					popupPort.storeMedia( msg.found_video, tabId );
					
					chrome.extension.sendMessage({
						subject: "mediaForTabUpdate",
						data: tabId
					});

                    if (shortcuts.enabled) {
                        if (aL[tabId][port.name].is_embed) {
                            shortcuts.injectShortcatsScript(tabId)
                        } else {
                            port.postMessage('shortcuts_enabled');
                        }
                    }
                } else if (msg.action == 'update_video') {
                    self.updateVideo({
                        tab_id: tabId,
                        port_name: port.name,
                        found_video: msg.found_video
                    }, function(updatedVideo) {});
                }
            });
            if ($existConflict) {
                port.postMessage('conflict_exists');
            }
        },
        addVideo: function(opts, callback) {
            var tabId = opts.tab_id,
                portName = opts.port_name,
                videoData = opts.found_video,
                aL = this.activeList;
            var videoIdKey = videoData.video_id;
            if (!videoIdKey) return;
            if (!aL[tabId][portName]) {
                aL[tabId][portName] = {};
            }
            if (!aL[tabId][portName]['videos']) {
                aL[tabId][portName]['videos'] = {};
            }
            if (!aL[tabId][portName]['videos'][videoIdKey]) {
                aL[tabId][portName]['videos'][videoIdKey] = videoData;
                callback();
            }
        },
        updateVideo: function(opts, callback) {
            var tabId = opts.tab_id,
                portName = opts.port_name,
                videoData = opts.found_video,
                aL = this.activeList;
            if (!aL[tabId][portName]['videos']) {
                return;
            }
            var videoIdKey = videoData.video_id;
            if (!videoIdKey) return;
            var savedVideoData = aL[tabId][portName]['videos'][videoIdKey];
			if(savedVideoData) {
				if(typeof savedVideoData === 'object' && savedVideoData.thumb) {
					savedVideoData.thumb = savedVideoData.thumb;
				} else if(typeof videoData === 'object' && videoData.thumb){
					savedVideoData.thumb = videoData.thumb;
				} else {
					savedVideoData.thumb = null;
				}
			}
			aL[tabId][portName]['videos'][videoIdKey] = savedVideoData;
			callback(savedVideoData);
        },
        getVideos: function(tabId) {
            var result = [];
            var aL = this.activeList;
            if (aL[tabId] && Object.keys(aL[tabId]).length > 0) {
                for (var port_name in aL[tabId]) {
                    if (!aL[tabId].hasOwnProperty(port_name) || !aL[tabId][port_name].hasOwnProperty('videos')) continue;
                    for (var videoId in aL[tabId][port_name]['videos']) {
                        if (!aL[tabId][port_name]['videos'].hasOwnProperty(videoId)) continue;
                        result.push(aL[tabId][port_name]['videos'][videoId]);
                    }
                }
            }
            return result;
        },
        isConnectedTab: function(tabId) {
            return (this.activeList[tabId] && Object.keys(this.activeList[tabId]).length > 0);
        },
        clear: function(tabId) {
            var aL = this.activeList;
            for (var port_name in aL[tabId]) {
                if (!aL[tabId].hasOwnProperty(port_name)) continue;
                aL[tabId][port_name]['videos'] = {};
            }
        },
        scroll: function(tabId, dataScroll) {
            var aL = this.activeList;
            for (var port_name in aL[tabId]) {
                if (!aL[tabId].hasOwnProperty(port_name)) continue;
                aL[tabId][port_name].postMessage({
                    action: 'scroll',
                    scroll_data_el: dataScroll
                });
            }
        },
        enableShortcuts: function() {
            var aL = this.activeList;
            var iframeTabs = [];
            for (var tabId in aL) {
                if (!aL.hasOwnProperty(tabId)) continue;
                for (var port_name in aL[tabId]) {
                    if (!aL[tabId].hasOwnProperty(port_name)) continue;
                    if (aL[tabId][port_name].is_embed) {
                        if (iframeTabs.indexOf(parseInt(tabId)) == -1) {
                            iframeTabs.push(parseInt(tabId));
                        }
                    } else {
                        aL[tabId][port_name].postMessage('shortcuts_enabled');
                    }
                }
            }
            iframeTabs.forEach(shortcuts.injectShortcatsScript);
        },
        disableShortcuts: function() {
            var aL = this.activeList;
            var iframeTabs = [];
            for (var tabId in aL) {
                if (!aL.hasOwnProperty(tabId)) continue;
                for (var port_name in aL[tabId]) {
                    if (!aL[tabId].hasOwnProperty(port_name)) continue;
                    if (aL[tabId][port_name].is_embed) {
                        if (iframeTabs.indexOf(parseInt(tabId)) == -1) {
                            iframeTabs.push(parseInt(tabId));
                        }
                    } else {
                        aL[tabId][port_name].postMessage('shortcuts_disabled');
                    }
                }
            }
            iframeTabs.forEach(function(tabId) {
                chrome.tabs.sendMessage(tabId, 'shortcuts_disabled');
            });
        }
    };
    var shortcuts = {
        enabled: true,
        setInitVal: function() {
            var self = this;
            chrome.storage.sync.get('settings', function(data) {
                var settings = data.settings || {};
                if (typeof settings.go_to_by_shortcut == 'undefined') {
                    settings.go_to_by_shortcut = true;
                }
                self.enabled = settings.go_to_by_shortcut;
                chrome.storage.sync.set({
                    settings: settings
                });
            });
        },
        changeOpts: function(val) {
            this.enabled = val;
            if (val) {
                tabPorts.enableShortcuts();
            } else {
                tabPorts.disableShortcuts();
            }
        },
        injectShortcatsScript: function(tabId) {
            chrome.tabs.executeScript(tabId, {
                runAt: 'document_idle',
                code: 'window["fb_dl_shortcut_scroll_6295"];'
            }, function(res) {
                if (res && res[0]) {
                    chrome.tabs.sendMessage(tabId, 'shortcuts_enabled')
                } else {
                    chrome.tabs.executeScript(tabId, {
                        runAt: 'document_idle',
                        code: 'window["fb_dl_shortcut_scroll_6295"] = 1;'
                    });
                    chrome.tabs.executeScript(tabId, {
                        runAt: 'document_idle',
                        file: '/js/shortcut.js'
                    });
                }
            });
        }
    };
    var generateUid = function() {
        return 'xxxxxvxxxxxxxxxuxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    if (typeof window.localStorage.installedTime == 'undefined') {
        window.localStorage.installedTime = Date.now();
    }
    var uuid = 'nop';
    var uidField = 'uid';

    run();
})();