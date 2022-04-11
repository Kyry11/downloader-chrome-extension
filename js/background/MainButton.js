if (window == chrome.extension.getBackgroundPage()) {

	(function(){
	
		var MainButton = function(){
		
			var self = this;

			const TRIGGER_VIDEO_SIZE = 1048576;
			const MIN_FILESIZE_TO_CHECK = 100 * 1024;
			
			const YOUTUBE_URL_SIGNS = [
				"//youtube.com",
				"//www.youtube.com",
				"//gaming.youtube.com",
				"//soloset.net",
				"//www.soloset.net",
				"//solosing.com",
				"//www.solosing.com"
			];
			
			const DAILYMOTION_URL_SIGNS = [
				"//dailymotion.com",
				"//www.dailymotion.com",
				"//dmcdn.net"
			];

			const TWITCH_URL_SIGNS = [
				"//www.twitch.tv",
				"//www.periscope.tv",
			];
			
			const STREAM_URL_SIGNS = [
				"//www.ustream.tv",
			];
			
			var isButtonStatus = 0;		// 0 - disabled  1 - enabled  2 - downloader  3 - recorder
			
			this.isGtaSuggestion = false;
			this.isSmartPause = false;
			
			
			// ----------------------------------------------
			function getActiveTab(callback){
				fvdSingleDownloader.Utils.getActiveTab(callback);
			}
			
			// -------------------------------------------- состояние кнопки в панели
			function setMainButtonStatus(can, tabId){
				
				isButtonStatus = can;
				
				var img = null;
				
				switch (can ) {
					case 0: img = chrome.extension.getURL('images/icon_cant_download.png');  break;
					case 1: img = chrome.extension.getURL('images/icon_can_download.png');  break;
					case 2: img = chrome.extension.getURL('images/icon_downloading.png');  break;
					case 3: img = chrome.extension.getURL('images/icon_recording.png');  break;
				}	
				
				chrome.browserAction.setIcon({
										path: img,
										tabId: tabId
									});
			}
			
			// -----------------------------------------  window.addEventListener( "load"
			function refreshMainButtonStatus(){
				
				getActiveTab(function(tab){

								var flag_YT = true;
								var flag_AD = true;
				
								if (fvdSingleDownloader.noYoutube && tab && tab.url)	{
					
									if (self.isYoutubeUrl(tab.url)) {
										//chrome.browserAction.setTitle({	title: _("noyoutube_message"),	tabId: tab.id  });
													
										flag_YT = false;			
									}
								}
								
                    var url = tab && tab.url || '';
                    window.validateUri = window.validateUri || new ValidateUri();
                    window.validateUri.isAdult(url).then(is_adult => {
                        flag_AD = !is_adult;
								if (!tab) 	{
									setMainButtonStatus(0);
									return;
								}
					
								if (fvdSingleDownloader.Media.Storage.hasDataForTab(tab.id) && flag_YT && flag_AD) {

									var items = fvdSingleDownloader.Media.Storage.getMedia( tab.id );
									var items = self.filter_Media( items );

									var flag = 0;
									if (items.length > 0) flag = 1;
									
									for (var i=0; i<items.length; i++) {
										if (items[i].status == 'start') {	
											flag = 2;
											if (items[i].metod == 'record')  flag = 3;	
										}
									}

									setMainButtonStatus(flag, tab.id);
								}
								else {
									setMainButtonStatus(0, tab.id);
								}
                    });
							});
			}
			this.refreshMainButtonStatus = function(){
				refreshMainButtonStatus();
			};

			// -------------------------------------------------------------------------------
			this.filter_Media = function( media )  {
				
				if (!media) return [];

				var rezult = [];

				var x = fvdSingleDownloader.Prefs.get( "fvd.trigger_video_more" );
				var min_filesize = MIN_FILESIZE_TO_CHECK;
				if ( x == 'video_100kb')  min_filesize = 102400;
				else if (x == 'video_1mb') min_filesize = 1048576;
				
				media.forEach(function( item ){

											if (self.checkExtByContentType( item.ext ))
											{
												var size = item.size;
												//if (size && size < min_filesize )  return;
            
												rezult.push( item );
												
											}
										});
										
				return rezult;						
			};	
			
			// -------------------------------------------------------------------------------
			this.parsed_Media = function( media )  {

				var rezult = [];

				media.forEach(function( item ){

											if ( item.priority > 0 )
											{
												rezult.push( item );
											}
										});
										
				return rezult;						
			};	
			
			// -------------------------------------------------------------------------------
			this.checkExtByContentType = function( contentType )
			{
				var name = "fvd.enable_" + contentType;
				var x = fvdSingleDownloader.Prefs.get( name );
				if( x == 'false' )  return false;
				return true;
			};
			
			// -------------------------------------------------------------------------------
			this.isYoutubeUrl = function(url) {
			
				var url = url.toLowerCase();
				
				for( var i = 0; i != YOUTUBE_URL_SIGNS.length; i++ )
				{
					if( url.indexOf( YOUTUBE_URL_SIGNS[i] ) != -1 )		return true;
				}
				
				return false;
			}
			
			// -------------------------------------------------------------------------------
			this.isTwitchUrl = function(url) {

				var url = url.toLowerCase();
				
				for( var i = 0; i != TWITCH_URL_SIGNS.length; i++ )
				{
					if( url.indexOf( TWITCH_URL_SIGNS[i] ) != -1 )		return true;
				}
				
				return false;
			}
			
			// -------------------------------------------------------------------------------
			this.isStreamUrl = function(url) {

				var url = url.toLowerCase();
				
				for( var i = 0; i != STREAM_URL_SIGNS.length; i++ )
				{
					if( url.indexOf( STREAM_URL_SIGNS[i] ) != -1 )		return true;
				}
				
				return false;
			}
			
			// ----------------------------------------
			function read_news_url( url, callback ){

				var ajax = new XMLHttpRequest();
				
				ajax.open('GET', url);
				ajax.setRequestHeader('Cache-Control', 'no-cache');
				
				ajax.onreadystatechange = function()  {
							try
							{
								if  ( (this.readyState == 4) && (this.status == 200))
								{
									var text = ajax.responseText;
									if (text)
									{
										callback(text);
										return text;
									}	
									else
									{
										callback( null );
										return null;
									}	
								}
							}
							catch (e) {}
						};
				ajax.onerror = function(){
							callback( null );
							return null;
						};
				
				ajax.send(null);
			}
			
			// ---------------------------------------------- Состояние кнопки ---------------------------
			this.getButtonStatus = function(  ){		
			
				return isButtonStatus;			
			}
			
			// -------------------------------------------------------------------------------
			
			
			
			chrome.tabs.onUpdated.addListener(function(tabId, info){
			
				getActiveTab(function(tab){
				
					if (!info.status) {
						return;
					}
					
					if (tab && tab.id && tab.id == tabId) {
						refreshMainButtonStatus();
					}
					
				});
				
				
				
			});
			
			chrome.tabs.onActivated.addListener(function(info){
			
				refreshMainButtonStatus();
				
			});
			
			fvdSingleDownloader.Media.onMediaForTabUpdate.addListener(function(tabId){
			
				getActiveTab(function(tab){
				
					if (!tab) {
						return;
					}
					
					if (tabId == tab.id) {
						refreshMainButtonStatus();
					}
					
				});
				
			});
			
		};
		
		this.MainButton = new MainButton();
		
	}).apply(fvdSingleDownloader);
}
else{
	fvdSingleDownloader.MainButton = chrome.extension.getBackgroundPage().fvdSingleDownloader.MainButton;
}
