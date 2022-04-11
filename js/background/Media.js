if (window == chrome.extension.getBackgroundPage()) {

	(function() {

		var Media = function() {

			var self = this;

			var textFile = null;

			var _onMediaForTabUpdateListeners = [];

			const DETECT_MODULES = ["Sniffer", "DailyMotion", "VKontakte", "BreakCom", "FaceBook", "SitePage",
				"Twitch", "MediaStream", "MediaManifest", /* "MediaCombine" */
			];

			// ===============================================================
			this.init = function() {

				console.log("Media - init ");

				//this.initFileSystem();
				
				self.requestedVideosInfo = {};

				this.Storage.onMediaRemove.addListener(function(tabId) {

					console.log("REMOVE ITEM " + tabId);

					_onMediaForTabUpdateListeners.forEach(function(listener) {

						try {
							listener(tabId);
						} catch (ex) {}

					});

				});

				const removeChars = /[\\\/:*?"<>|"']/g;

				function mediaDetectListener(m) {

					if (!m) return;

					var media = null;

					function f(m) {

						if (m.filename) {
							m.filename = m.filename.replace(removeChars, "")
								.replace(/^\.+/, "").replace(/\.+$/, "")
								.trim();
						}
						if (m.downloadName) {
							m.downloadName = m.downloadName.replace(removeChars, "")
								.replace(/^\.+/, "").replace(/\.+$/, "")
								.trim();
						}

						// имя отображения
						var displayName = m.displayName ? m.displayName : m.downloadName;
						if (!_b(fvdSingleDownloader.Prefs.get("fvd.original_filename")) && m.ext == "swf") {
							displayName = m.filename;
						}
						if (displayName && displayName.length > 50) displayName = displayName.substr(0, 50) + "...";

						// имя файла	
						if (!m.filename) {
							var ff = fvdSingleDownloader.Utils.extractPath(m.url);
							if (ff) {
								if (!m.ext) m.ext = ff.ext;
								m.filename = ff.name;
							}
						}

						var mm = {
							tabId: m.tabId,
							frameId: m.frameId,
							groupId: m.groupId ? m.groupId : 0,
							orderField: m.orderField ? m.orderField : new Date().getTime(),
							priority: m.priority,

							url: m.url,
							downloadName: m.downloadName,
							displayName: displayName,
							format: m.format,
							quality: m.quality ? m.quality : null,
							title: m.title,
							filename: m.filename,
							ext: m.ext,

							playlist: m.playlist ? m.playlist : null,
							initSeg: m.initSeg ? m.initSeg : null,
							videoId: m.videoId ? m.videoId : null,
							status: m.status ? m.status : 'stop',
							hash: m.hash ? m.hash : hex_md5(m.url),

							size: m.size,
							source: m.source,
							metod: m.metod ? m.metod : "download",
							type: m.type,
							dwnl: m.dwnl ? m.dwnl : 1,
							vubor: 0,

						}

						if (m.params) mm.params = m.params;

						return mm;
					}

					var tabId = null;
					fvdSingleDownloader.Utils.Async.chain([
						function(chainCallback) { // преобразуем
							if (m.length) {
								media = [];
								m.forEach(function(item) {
									media.push(f(item));
								});
							} else {
								media = f(m);
							}
							chainCallback();
						},

						function() {
							if (media) {
								if (media.length) {
									media.forEach(function(item) {
										tabId = item.tabId;
										self.Storage.addItemForTab(item.tabId, item);
									});
								} else {
									tabId = media.tabId;
									self.Storage.addItemForTab(media.tabId, media);
								}

								chrome.extension.sendMessage({
									subject: "mediaForTabUpdate",
									data: tabId
								});

								_onMediaForTabUpdateListeners.forEach(function(listener) {

									try {
										listener(tabId);
									} catch (ex) {}

								});
							}
						}
					]);

				};

				// --------------------------- перебираем модули Sniffer, Youtube
				DETECT_MODULES.forEach(function(module) {
					if (self[module]) {
						self[module].onMediaDetect.addListener(mediaDetectListener);
					} else {
					}

				});

				// --------------------------- закрытие вкладки  
				chrome.tabs.onRemoved.addListener(function(tabId) {
					
					self.requestedVideosInfo[tabId] = [];

					if (fvdSingleDownloader.Media.Storage.hasDataForTab(tabId)) {
						fvdSingleDownloader.Media.Storage.removeTabData(tabId);

						_onMediaForTabUpdateListeners.forEach(function(listener) {
							listener(tabId);
						});
					}
				});

				// --------------------------- изменение вкладки
				chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
					if (changeInfo.status === 'loading') {
						self.requestedVideosInfo[tabId] = [];
						if (fvdSingleDownloader.Media.Storage.hasDataForTab(tabId)) {
							fvdSingleDownloader.Media.Storage.removeTabData(tabId);


							_onMediaForTabUpdateListeners.forEach(function(listener) {
								listener(tabId);
							});
						}
					}

				});

				// --------------------------- реакция на SendRequest
				chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {

					if (request.command == "getVideoData") {
						fvdSingleDownloader.Utils.getActiveTab(function(tab) {
							if (tab) {
								var media = fvdSingleDownloader.Media.Storage.getMedia(tab.id);
								media = fvdSingleDownloader.MainButton.filter_Media(media);
								media = fvdSingleDownloader.MainButton.parsed_Media(media);
								sendResponse(media);
							}
						});
					} else if (request.command == "startDownload") {
						self.startDownload(request.media);
					} else if (request.command == "stopDownload") {
						self.stopDownload(request.media);
					}

				});

			}

			// ===============================================================
			this.initFileSystem = function() {

				function onInitFs(fs) {
					//console.log('Opened file system: ' + fs.name);
					var dirReader = fs.root.createReader();
					var readEntries = function() {
						dirReader.readEntries(function(results) {
							if (results.length > 0) {
								results.forEach(function(entry, i) {
									entry.remove(function() {
										console.log('File removed.', entry.fullPath);
									}, self.errorHandler);
								});
							}
						}, self.errorHandler);
					};
					readEntries();
				}

				window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
				var requestedBytes = 1024 * 1024 * 1024;
				navigator.webkitTemporaryStorage.requestQuota(requestedBytes, function(grantedBytes) {
					_grantedBytes = grantedBytes;
					window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, onInitFs, self.errorHandler);
				}, self.errorHandler);

			}

			// -------------------------------------------------------------------
			this.errorHandler = function(e) {

				console.log(e);
				var msg = '';

				switch (e.code) {
					case FileError.QUOTA_EXCEEDED_ERR:
						msg = 'QUOTA_EXCEEDED_ERR';
						break;
					case FileError.NOT_FOUND_ERR:
						msg = 'NOT_FOUND_ERR';
						break;
					case FileError.SECURITY_ERR:
						msg = 'SECURITY_ERR';
						break;
					case FileError.INVALID_MODIFICATION_ERR:
						msg = 'INVALID_MODIFICATION_ERR';
						break;
					case FileError.INVALID_STATE_ERR:
						msg = 'INVALID_STATE_ERR';
						break;
					default:
						msg = 'Unknown Error';
						break;
				};

				console.log('Error: ' + msg);
			}


			// ===============================================================
			this.startDownload = function(media) {

				console.log('MEDIA.startDownload: ', media);

				// настроим скачивание
				var flag_download = ('dwnl' in media && media.dwnl) ? media.dwnl : 0;
				if (flag_download == 1 && !chrome.downloads) flag_download = 5; // по старинке
				var met = _b(fvdSingleDownloader.Prefs.get("fvd.original_filename"));
				var file_name;
				if (met) { // оригинальное
					file_name = media.filename + '.' + media.ext;
				} else {
					file_name = media.downloadName + '.' + media.ext;
				}
				var removeChars = /[\\\/:*?"<>|"']/g;
				file_name = file_name.replace(removeChars, "");

				fvdSingleDownloader.Utils.Async.chain([

					function(chainCallback) { // для мобильной версии

						if (fvdSingleDownloader.noYoutube == false) {
							fvdSingleDownloader.FvdMobile.downloadMedia(media, function(result) {
								if (!result) {
									chainCallback();
								}
							});
						} else {
							chainCallback();
						}
					},

					function(chainCallback) { // скачивание методом открытия в новой вкладке

						if (flag_download == 3) {
							console.log('DOWNLOAD - open');
							chrome.tabs.create({
								url: media.url,
								active: false
							});
							return;
						} else {
							chainCallback();
						}

					},

					function(chainCallback) { // с использованием API

						if (flag_download == 1) {
							console.log('DOWNLOAD - api', file_name);

							fvdSingleDownloader.Downloader.start(media.id, media.url, file_name,
								function(error, downloadId) {

									if (error) {
										console.log(fvdSingleDownloader.Downloader.getError());
									} else {

									}
								}
							);
							return;
						} else {
							chainCallback();
						}
					},

					function(chainCallback) { // по старинке

						fvdSingleDownloader.Utils.getActiveTab(function(tab) {
							fvdSingleDownloader.ContentScriptController.processMessage(tab.id, {
								action: "startDownload",
								media: media
							});
						});
						return;
					}
				]);

			}

			// ===============================================================
			this.stopDownload = function(media) {

				console.log('MEDIA.stopDownload: ', media);

				if (!media) return;

				if (media.downloadId) {

					fvdSingleDownloader.Downloader.stop(media.downloadId,
						function(error) {
							if (error) {
								console.log(fvdSingleDownloader.Downloader.getError());
							} else {}
						}
					);
				} else {
					fvdSingleDownloader.Media.Storage.setData_Attribute(media.tabId, media.id, "status", 'stop');
				}

			}

			// ===============================================================
			this.startRecord = function(media, callback) {
				console.log('startRecord', media)
				fvdSingleDownloader.Recorder.start(media.hash, media.playlist,
					function(error, countTSFiles, sizeOfVideo, status) {
						if (error) {
							console.log(fvdSingleDownloader.Recorder.getError());
						} else {
							fvdSingleDownloader.Media.Storage.setTwitch(media.hash, status, sizeOfVideo);
							callback(sizeOfVideo);
						}
					}
				);

			}
			// ===============================================================
			this.stopRecord = function(media) {
				console.log('stopRecord', media)
				fvdSingleDownloader.Recorder.stop(media.hash, function(error, file, status) {

					if (error) {
						// If true, get error info
						console.log(fvdSingleDownloader.Recorder.getError());
					} else {
						fvdSingleDownloader.Media.Storage.setTwitch(media.hash, status, null);

						var link_href = saveTSFile(file);
						media.url = link_href;
						self.startDownload(media);
						console.log(link_href);
					}
				});

			}

			// ===============================================================
			this.startCombineDownload = function(media, callback) {
				fvdSingleDownloader.Streamer.start(media.hash,
					function(rez) {
						if (rez.msg === 'start') {
							fvdSingleDownloader.Media.Storage.setStream(rez.hash, {
								status: 'start'
							});
							chrome.extension.sendMessage({
								subject: "mediaStream",
								id: media.id,
								streamHash: rez.hash,
								size: -2
							});
						} else if (rez.msg === 'cancel') {
							fvdSingleDownloader.Media.Storage.setStream(rez.hash, {
								status: 'stop'
							});
							chrome.extension.sendMessage({
								subject: "mediaStream",
								id: media.id,
								streamHash: rez.hash,
								size: -3
							});
						} else if (rez.msg === 'finish') {
							fvdSingleDownloader.Media.Storage.setStream(rez.hash, {
								status: 'stop'
							});
							chrome.extension.sendMessage({
								subject: "mediaStream",
								id: media.id,
								streamHash: rez.hash,
								size: -3
							});
						} else if (rez.msg === 'playlist') {
							fvdSingleDownloader.Media.Storage.setStream(rez.hash, {
								size: -2
							});
							chrome.extension.sendMessage({
								subject: "mediaStream",
								id: media.id,
								count: rez.count,
								streamHash: rez.hash,
								size: -2
							});
						} else if (rez.msg === 'progress') {
							fvdSingleDownloader.Media.Storage.setStream(rez.hash, {
								size: rez.size,
								progress: rez.progress
							});
							chrome.extension.sendMessage({
								subject: "mediaStream",
								id: media.id,
								count: rez.count,
								streamHash: rez.hash,
								size: rez.size,
								progress: rez.progress
							});
						}
					},
					function(error, hash, file, size, callback) {
						if (error) {
							console.log(fvdSingleDownloader.Streamer.getError());
						} else {
							saveCombineFileSys(hash, size, file, callback);
						}
					}
				);

			}
			// ===============================================================
			this.stopCombineDownload = function(media) {
				fvdSingleDownloader.Streamer.stop(media.hash);
			}

			// ===============================================================
			function saveCombineFileSys(hash, size, url, callback) {

				var media = self.Storage.getDataForHash(hash);
				if (media) {
					try {
						// настроим скачивание
						var flag_download = ('dwnl' in media && media.dwnl) ? media.dwnl : 0;
						if (flag_download == 1 && !chrome.downloads) flag_download = 5; // по старинке
						var met = _b(fvdSingleDownloader.Prefs.get("fvd.original_filename"));
						var file_name;
						if (met) { // оригинальное
							file_name = media.filename + '.' + media.ext;
						} else {
							file_name = media.downloadName + '.' + media.ext;
						}
						var removeChars = /[\\\/:*?"<>|"']/g;
						file_name = file_name.replace(removeChars, "");

						chrome.downloads.download({
								url: url,
								filename: file_name,
								saveAs: true
							},
							function(downloadId) {
								console.log('DOWNLOAD', downloadId);
								setTimeout(function() {
									//fvdSingleDownloader.Streamer.remove( media.hash );	
									callback();
								}, 1000);
							}
						);
					} catch (e) {
						console.log(e);
					}
				}
			}

			// ===============================================================
			function saveTSFile(data) {
				// If we are replacing a previously generated file we need to
				// manually revoke the object URL to avoid memory leaks.
				if (textFile !== null) {
					window.URL.revokeObjectURL(textFile);
				}

				textFile = window.URL.createObjectURL(data);
				return textFile;
			}

			// ----------------------------------------------------------------------------------------------------
			this.setPlaylist = function(hash, list) {

				fvdSingleDownloader.Streamer.playlist(hash, list);

			}

			// ===============================================================
			this.onMediaForTabUpdate = {
				addListener: function(callback) {
					if (_onMediaForTabUpdateListeners.indexOf(callback) == -1) {
						_onMediaForTabUpdateListeners.push(callback);
					}
				}
			}

		}

		this.Media = new Media();

	}).apply(fvdSingleDownloader);

} else {
	fvdSingleDownloader.Media = chrome.extension.getBackgroundPage().fvdSingleDownloader.Media;
}