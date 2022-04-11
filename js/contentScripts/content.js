! function() {
    if (-1 !== location.href.indexOf("facebook.com") && !window.ext_inited_fbvdl_7356152) {
        window.ext_inited_fbvdl_7356152 = "1";
        var util = function() {
                return {
                    recursivelyFindParentByChild: function(a, b, c) {
                        return a ? a.querySelector(b) ? a : c && a == c ? null : this.recursivelyFindParentByChild(a.parentElement, b, c) : null
                    },
                    isVideosPage: function() {
                        return /videos\/\d+/.test(location.href)
                    },
                    extendObj: function() {
                        for (var a = arguments[0], b = 1, c = arguments.length; c > b; b++) {
                            var d = arguments[b];
                            for (var e in d) void 0 !== d[e] && (a[e] = d[e])
                        }
                        return a
                    },
                    $getDlBtn: function(a) {
                        return $('<button class="' + sniffer.btnClassName + " " + (a ? sniffer.iframeBtnClassName : "") + ' " type="button">' + this.getButtonText() + "</button>").clone()
                    },
                    getButtonText: function() {
                        // return chrome.i18n.getMessage("download")
                        return 'Download';
                    },
                    restoreText: function(a) {
                        a.html(this.getButtonText())
                    },
                    buttonLoadingState: function(b) {
                        var c = "Loading...";
                        b.html(c), setTimeout(function() {
                            b.data().not_available || util.restoreText(b)
                        }, 3e3)
                    },
                    buttonNotAvailableState: function(a, b) {
                        a.text("Not available");
                        var c = b ? chrome.i18n.getMessage("stream_download_not_available_tooltip") : chrome.i18n.getMessage("not_available_tooltip");
                        a.css({
                            backgroundColor: "rgb(239, 44, 44)",
                            borderColor: "rgb(239, 44, 44)"
                        });
                        var d = tippy(a.get(0), {
                            content: c
                        });
                        d = d && d.instances && d.instances[0], d && d.show && d.show(), a.data("not_available", "1"), a.addClass("dl_disabled")
                    },
                    drawThumbnail: function(c, d) {
                        if (4 == c.readyState) return util.drawCanvasByVideo(c);
                        if (d) {
                            var e = !1,
                                f = setInterval(function() {
                                    if (!e && 4 == c.readyState) {
                                        clearInterval(f);
                                        var g = util.drawCanvasByVideo(c);
                                        g.length > 100 && messenger.mediaUpdateMessage({
                                            video_id: d,
                                            thumb: g
                                        })
                                    }
                                }, 1e3);
                            return c.addEventListener("loadeddata", function() {
                                e = !0, clearInterval(f);
                                var g = util.drawCanvasByVideo(c);
                                g.length > 100 && messenger.mediaUpdateMessage({
                                    video_id: d,
                                    thumb: g
                                })
                            }), null
                        }
                    },
                    drawCanvasByVideo: function(a) {
                        try {
                            var b = document.createElement("canvas");
                            b.width = a.videoWidth, b.height = a.videoHeight;
                            var c = b.getContext("2d");
                            c.drawImage(a, 0, 0, b.width, b.height);
                            var d = b.toDataURL("image/jpeg");
                            return b.remove(), d
                        } catch (e) {
                            return ""
                        }
                    },
                    scrollTo: function(a) {
                        var b = document.querySelector('[data-fb_dl_scroll="' + a + '"]');
                        b && b.scrollIntoView({
                            block: "center",
                            behavior: "smooth"
                        })
                    }
                }
            }(),
            messenger = function() {
                return {
                    instance: null,
                    init: function() {
						// create connection instance
                        this.instance = chrome.runtime.connect({
                            name: Math.random().toString()
                        });
						// add listeneres
						this.addListeners();
                    },
                    addListeners: function() {
                        this.instance.onMessage.addListener(function(b, d) {
                            if ("conflict_exists" == b && (sniffer.btnClassName = "ext_fb_dl_conflict_btn"), "shortcuts_enabled" == b) {
                                if (window.top != window.self) return;
                                sniffer.shortcutsEnabled = !0
                            }
                            if ("shortcuts_disabled" == b) {
                                if (window.top != window.self) return;
                                sniffer.shortcutsEnabled = !1
                            } else b && "scroll" == b.action && util.scrollTo(b.scroll_data_el)
                        })
                    },
                    mediaFoundMessage: function(a) {
                        this.instance.postMessage({
                            action: "video_found",
                            found_video: a
                        })
                    },
                    mediaUpdateMessage: function(a) {
                        this.instance.postMessage({
                            action: "update_video",
                            found_video: a
                        })
                    },
                    sendMessage: function(a) {
                        this.instance.postMessage(a)
                    }
                }
            }(),
            sniffer = function() {
                return {
					async_get_token : "",
					user_id : "",
                    btnClassName: "ext_fb_dl_btn",
                    iframeBtnClassName: "ext_frame",
                    isOldDesign: !1,
                    getVideoIdByHtml: function(a) {
                        var b = /\/videos\/([0-9]+)[^\/?]?/g.exec(a.innerHTML);
                        return b || (b = /\/videos\/[a-z]{2,3}\.[0-9]+\/([0-9]+)\/?/g.exec(a.innerHTML)), b && b[1] ? b[1] : !1
                    },
                    handleVideo: function($video) {
                        var b;
						var d = sniffer.getPostParent($video);
                        if ("1" !== d.dataset.ext_test_fbvdl_7356152) {
                            if ($video.src.match(/\.mp4/) && (b = $video.src), d) {
                                var videoId = sniffer.getVideoIdByHtml(d);
                                videoId && (d.dataset.ext_test_fbvdl_7356152 = "1")
                            }
                            videoId || 1 !== document.querySelectorAll("video").length || /facebook\.com\/watch\/live\/\?v=\d+/.test(window.location.href) && (videoId = window.location.href.match(/live\/\?v=(\d+)/), videoId = videoId && videoId[1]),
							sniffer.handleVideoPost({
                                el: $video,
                                video_id: videoId,
                                parent: d,
                                video_url: b
                            })
                        }
                    },
                    getVideoThumb: function(c, d) {
                        var e = 0,
                            f = null;
                        return c.querySelectorAll('img[src*="//scontent"]').forEach(function(a) {
                            0 === a.width && 4 != a.readyState && d && a.addEventListener("load", function(c) {
                                a.width > 200 && messenger.mediaUpdateMessage({
                                    video_id: d,
                                    thumb: a.src
                                })
                            }), a.width > e && (e = a.width, f = a.src)
                        }), f && e > 200 ? f : util.drawThumbnail(c.querySelector("video"), d)
                    },
                    appendDownloadButton: function(b, c) {
                        var d, e = 0;

						if (this.isOldDesign) {
							var f = $(b.querySelector("video").parentElement);
						} else {
							f = $(util.recursivelyFindParentByChild(b.querySelector("video"), "img", b));
						}

						f.on("mousemove", function() {
                            var a = Date.now();
                            e + 500 > a || (e = a, clearTimeout(d), c.show(), d = setTimeout(function() {
                                c.hide()
                            }, 3e3))
                        });
						f.on("mouseleave", function() {
                            clearTimeout(d), c.hide()
                        }),
						f.append(c);
						c.hide();
                    },
                    getVideoTitle: function(a) {
                        if (this.isOldDesign) return this.getVideoTitleOldDesign(a.querySelector("video"));
                        var b, c, d = null;
                        if (/facebook\.com\/watch\/live\/\?v=\d/.test(window.location.href)) {
							console.log('opolooooooooooooooooooo');
                            b = a.querySelectorAll("span");
                            for (var e = 0; b[e]; e++)
                                if (b[e] && b[e].innerText.replace(/[\.\d\s\t\r\n:,]/g, "").length > 1) {
                                    d = b[e].innerText.trim();
                                    break
                                }
                        } else if (/facebook\.com\/watch/.test(window.location.href)) c = a.querySelector('.n1l5q3vz span'), d = c && c.innerText.trim();
                        else if (/\/videos\/\d+/.test(window.location.href)) c = document.querySelector('[data-pagelet="TahoeRightRail"] > div .n1l5q3vz span span'), c && c.innerText.replace(/[\.\d\s\t\r\n:,]/g, "").length > 1 && (d = c.innerText.trim());
                        else if ($(a).closest("section ul li").length > 0) {
                            a = a.parentElement.parentElement.parentElement, b = a.querySelectorAll('a[role="link"]');
                            for (var e = 0; b[e]; e++)
                                if (b[e] && b[e].innerText.replace(/[\.\d\s\t\r\n:,]/g, "").length > 1) {
                                    d = b[e].innerText.trim();
                                    break
                                }
                        } else if ($(a).closest('[role="article"]').length > 0) a = $(a).closest('[role="article"]').get(0), c = a.querySelector("[data-ad-preview]"), c && c.innerText.replace(/[\.\d\s\t\r\n:,]/g, "").length > 1 && (d = c.innerText.trim()), d || (c = a.querySelector('blockquote [dir="auto"]'), c && c.innerText.replace(/[\.\d\s\t\r\n:,]/g, "").length > 1 && (d = c.innerText.trim()));
                        else if (/facebook\.com\/plugins\/video\.php/.test(window.location.href)) {
                            b = a.querySelectorAll('a[href][target="_blank"]');
                            for (var e = 0; b[e]; e++) b[e] && !b[e].children.length && b[e].innerText.replace(/[\.\d\s\t\r\n:,]/g, "").length > 1 && -1 == b[e].href.indexOf("developers.facebook.com") && (d = b[e].innerText.trim())
                        }
						
						if(d && d.length > 110) {
							d = d.substr(0, 100) + "...";
						} else if(!d || d.length === 0){
							d = 'No Title';
						}
						
                        return d;
                    },
                    getVideoTitleOldDesign: function(a) {
                        if (!a) return null;
                        if ("video" != a.tagName.toLowerCase() && (a = a.querySelector("video")), !a) return null;
                        var b, c, d = "";
                        if (b = $(a).closest("._wyj"), b.length) {
                            var e = b.find(".uiContextualLayerParent.uiPopover");
                            if (e.length && (d = e.prev().text()), !d) {
                                c = b.get(0).querySelectorAll("span > span > div");
                                for (var f = 0; c[f]; f++)
                                    if (c[f] && c[f].innerText.replace(/[\.\d\s\t\r\n:,]/g, "").length > 1) {
                                        d = c[f].innerText.trim();
                                        break
                                    }
                            }
                        }
                        if (d.length || (b = $(a).closest(".userContentWrapper"), b.length && (d = b.find('[data-testid="post_message"] p').text())), !d && /videos\/\d+/.test(window.location.href)) {
                            var g = $('[role="button"][ajaxify*="/ajax/follow/follow_profile.php]').parent().parent().parent().parent().find("span[title]");
                            g.length && g.each(function(a, b) {
                                b.innerText == b.getAttribute("title") && (d = b.innerText)
                            }), d || (d = $("head title").text(), "facebook" == d.toLowerCase() && (d = ""))
                        }
                        return d && d.length > 110 && (d = d.substr(0, 100) + "..."), d
                    },
                    handleVideoPost: function(c) { 
                        if (c.video_id || c.video_url) {
                            var d = c.el || null,
                                e = c.video_id || null,
                                f = c.parent || null,
                                g = this.getVideoThumb(f, e),
                                h = this.getVideoTitle(f),
                                i = Math.round(1e7 * Math.random()).toString();
                            d.dataset.fb_dl_scroll = i;
                            var j = {
                                video_id: e,
                                thumb: g,
                                title: h,
                                is_embed: c.is_embed || !1,
                                scroll_url: c.is_embed && window.location.href,
                                scroll_data_el: !c.is_embed && i
                            };
							chrome.runtime.sendMessage(util.extendObj(j, {action: "request"}, {async_get_token: sniffer.async_get_token, user_id: sniffer.user_id}), function(videoInfo) {
								messenger.mediaFoundMessage(util.extendObj(j, videoInfo));

								var k = util.$getDlBtn(c.is_embed);
								var l = function(b) {
									b.preventDefault();
									b.stopPropagation();
									var d = $(this);

									if (!d.data().not_available) {
										if (c.video_url) {
											return chrome.runtime.sendMessage(util.extendObj({
												action: "download",
												url: c.video_url
											}));
										}
										util.buttonLoadingState(d);
										if(videoInfo && videoInfo.url && videoInfo.url.indexOf(".mp4") > -1) {
											c.video_url = videoInfo.url;
											c.filename = c.filename || videoInfo.filename || null;
											chrome.runtime.sendMessage(util.extendObj({action: "download"}, videoInfo));
											util.restoreText(d);
										}
										else {
											if (videoInfo.error) {
												util.buttonNotAvailableState(d);
											} else {
												videoInfo.url.indexOf(".mpd") > -1 && util.buttonNotAvailableState(d, !0);
											}
										}
									}
								};
								sniffer.appendDownloadButton(f, k), k.get(0).addEventListener("click", l)
							});
                            
                        }
                    },
                    getPostParent: function(b) {
                        var c, d = $(b);
                        return c = d.closest('[data-pagelet="TahoeVideo"]').get(0), c || (c = d.closest('[role="article"]').get(0)), location.href.indexOf("facebook.com/watch") > -1 && (c = b.closest("._6x84")), c || (c = util.recursivelyFindParentByChild(b, 'img[src*="//scontent"]')), c || (c = util.recursivelyFindParentByChild(b, "img")), c
                    },
                    isVideoPage: function() {
                        return /videos\/(\d+)/.test(window.location.href)
                    },
                    find: function() {
						// if current location is https://facebook.com/videos/*
                        if (sniffer.isVideoPage()) {
                            if (sniffer.isOldDesign) {
								a = document.querySelector('[role="dialog"] video:not([data-ext_test_fbvdl_7356152="1"])');
							} else {
								var a = document.querySelector('[data-pagelet="TahoeVideo"] video:not([data-ext_test_fbvdl_7356152="1"])');
							}
							// if <video> element detected
                            if (a) {
								// extract video id
                                var b = window.location.href.match(/videos\/(\d+)/);
								// get parent post of video
                                var d = sniffer.getPostParent(a);
								// flag the post with "ext_test_fbvdl_7356152" data
                                a.dataset.ext_test_fbvdl_7356152 = "1";
								// handle video post
								sniffer.handleVideoPost({
                                    el: a,
                                    video_id: b[1],
                                    parent: d
                                });
                            }
                        } else {
							document.querySelectorAll("video").forEach(sniffer.handleVideo)
						}
                    },
                    handleIframe: function() {
                        var a = document.querySelector("video");
                        if (a) {
                            var b = location.href,
                                c = this.getVideoIdByHtml(document.body);
                            if (!c) {
                                var d = location.href.match(/\?href=([^&]+)/);
                                d = d && decodeURIComponent(d[1]), d && (c = /\/videos\/([0-9]+)[^\/?]?/g.exec(d), c = c && c[1])
                            }
                            this.handleVideoPost({
                                el: a,
                                video_id: c,
                                full_video_url: b,
                                parent: a.parentElement,
                                is_embed: !0
                            })
                        }
                    },
                    clearOld: function() {
                        document.querySelectorAll('[data-ext_test_fbvdl_7356152="1"]').forEach(function(a) {
                            a.dataset.ext_test_fbvdl_7356152 = "0"
                        }), document.querySelectorAll("." + sniffer.btnClassName).forEach(function(a) {
                            a.remove()
                        })
                    },
                    run: function() {
						if(window.top != window.self) {
							this.handleIframe();
						} else {
							this.async_get_token = $("script:contains(\"async_get_token\")").text().split("async_get_token\":\"").pop().split("\"")[0];
							this.user_id = $("script:contains(\"async_get_token\")").text().split("USER_ID\":\"").pop().split("\"")[0];
							this.isOldDesign = !!document.querySelector("#globalContainer");
							this.clearOld();
							this.find();
							setInterval(this.find, 3e3);
						}
                    }
                }
            }();
        messenger.init(),
		$(document).ready(function() {
			
            sniffer.run()
        })
    }
}();