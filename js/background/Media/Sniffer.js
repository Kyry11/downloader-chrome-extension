(function(){

    var MediaSniffer = function(){
    
        const VIDEO_EXTENSIONS = ["flv", "ram", "mpg", "mpeg", "avi", "rm", "wmv", "mov", "asf", "rbs", "movie", "divx", "mp4", "ogg", "mpeg4", "m4v", "webm"];
        
        const AUDIO_EXTENSIONS = ["mp3"];
        
        const GAME_EXTENSION = ["swf"];
        
        const CONTENT_TYPE_RE = /^(video)/i;
        
        const IGNORE_EXTENSIONS = ["jpg", "jpeg", "gif", "png", "bmp", "tiff", "js", "css", "woff", "woff2", "ttf"];
        const CONTENT_TYPE_IGNORE_RE = /^(audio)/i;
        
        const TRIGGER_VIDEO_SIZE = 1048576;
        const MIN_FILESIZE_TO_CHECK = 100 * 1024;
        
		const VIDEO2EXT = {		
			'mpeg' : 'mp4',
			'm4v': 'mp4',
			'3gpp' : '3gp',
			'flv' : 'flv',
			'x-flv' : 'flv',
			'quicktime' : 'mov',
			'msvideo' : 'avi',
			'ms-wmv' : 'wmv',
			'ms-asf' : 'asf',
			'web' : 'webm'
		};
		
		const AUDIO2EXT = {		
			'realaudio' : 'ra',
			'pn-realaudio' : 'rm',
			'midi' : 'mid',
			'mpeg' : 'mp3',
			'mpeg3' : 'mp3',
			'wav' : 'wav',
			'aiff' : 'aif'
		};

		const NO_YOUTUBE_SIGNS = [
			"://s.ytimg.com",
			"://o-o.preferred.",
			"youtube.com",
			"soloset.net",
			"solosing.com",
			"static.doubleclick.net"
		];
		
		const TRANSLATE_EXT = {
			"m4v" : "mp4"
		};

		const SKIP_SNIFFER_SIGNS = [
			'ustream.tv\/([^.]*)',
			'twitch.tv\/([^.]*)',
			'periscope.tv\/([^.]*)',
			'break.com\/video\/([^.]*)',
			'http:\/\/(www\.)?dailymotion(\.co)?\.([^\.\/]+)\/',
			'www\.facebook\.com\/(.*)',
			'metacafe\.com\/watch\/(.*)',
			"vk.com",
			"hulu.com",
			"cnn.com",
			"cbsnews.com",
			
			// звуковые сайты - игнорируем
			"www.vevo.com",
			"www.pandora.com",
			"www.music.yahoo.com",
			"www.spotify.com",
			"www.tunein.com",
			"www.last.fm",
			"www.iheart.com",
			"www.allmusic.com",
			"www.radio.com",
			"soundcloud.com"
		];
		
        var self = this;
        
        var mediaDetectCallbacks = [];

		function isAllowedExt( extension ){
            if (VIDEO_EXTENSIONS.indexOf(extension) != -1) {
                return true;
            }
            
            if (AUDIO_EXTENSIONS.indexOf(extension) != -1) {
                return true;
            }
            
            if (GAME_EXTENSION.indexOf(extension) != -1) {
                return true;
            }
			
			return true;
		}
		
		this.prepareMedia = function( media ){

			var ext = null;

			if (media.url.indexOf("#") != -1)  media.url = media.url.substring(0,media.url.indexOf("#"));
			// ни в коем случае не отбрасывать после (?) - приводит к отваливанию множества сайтов
			
			if ( (media.url.indexOf("tumblr.com") != -1) && (media.url.indexOf("#_=_") != -1) ) media.url = media.url.replace("#_=_", "");			//thumblr.com

			if( media.url.toLowerCase().indexOf( "dailymotion.com/video/" ) != -1 ) return null;
			if( media.url.toLowerCase().indexOf( "youtube.com" ) != -1 )  			return null;
			// if( media.url.toLowerCase().indexOf( "googlevideo.com" ) != -1 )  		return null;
			if( media.url.toLowerCase().indexOf( "break.com" ) != -1 )  			return null;
			if( media.url.toLowerCase().indexOf( "edgecastcdn.net" ) != -1 )  		return null;
			
			if( /^https?:\/\/(.*)seg(\d+)-frag(\d+)/.test(media.url.toLowerCase()) )   return null;			
			if( /\/segment\-[0-9]\.m4s/.test(media.url.toLowerCase()) )		return null;
			if( /^https?:\/\/(.*)\.ts/.test(media.url.toLowerCase()) )  return null;
			
			var disposName = dispositionName( media );
			
			if( disposName ) {
				ext = fvdSingleDownloader.Utils.extractExtension( disposName );
			}
			
			var fileName = null;
			var ff = fvdSingleDownloader.Utils.extractPath( media.url );
			if (ff) {
				if (!ext) ext = ff.ext;
				fileName = ff.name;
			}	
			else {
				fileName = self.getFileName( media );
				ext = getExtByContentType( getHeaderValue( "content-type", media ) );
			}
 			if( !ext ) {
				ext = fvdSingleDownloader.Utils.extractExtension( media.url );
			} 
			
			ext = ext.toLowerCase();
			if(TRANSLATE_EXT[ext])	{
				ext = TRANSLATE_EXT[ext];
			}
			
			var size = getHeaderValue( "Content-Length", media );
			
			if( media.tab.title ) {
				var downloadName = media.tab.title;					
				//if( ext )	downloadName += "." + ext;
			}
			else {
				var downloadName = self.getFileName( media );						
			}
			var displayName = downloadName;
			
			var orderField = 0;
			orderField = new Date().getTime()

			var title = fileName ? fileName : media.url;
			var frmt = "no name";
			if (title) {
				frmt = title;
				if ( frmt.length > 10) frmt = frmt.substr(0,10)+"...";
			}
	
			var result = {				
				url: media.url,
				tabId: media.tabId,
				frameId: media.frameId,
				ext: ext,
				
				title: title,
				format: "",
				
				downloadName: downloadName ? downloadName : "media",
				displayName: displayName,
				filename: fileName ? fileName : media.url,
				priority: 10,
				vubor:  0,
				size: size,
				type: "video",
				metod: "download",
				source: "Sniffer",
				groupId: 0,
				dwnl:	1,
				orderField: orderField
			};
			
			return result;
			
		}
		
		// -------------------------------------------------------------------
		this.getFileName = function( data ){
			// check disposition name
			
			var dn = dispositionName( data );
			if( dn ){
				return dn;
			}
			
			var url = data.url;
			var tmp = url.split( "?" );
			url = tmp[0];
			tmp = url.split( "/" );
			tmp = tmp[ tmp.length - 1 ];
			
			if( tmp.indexOf( "." ) != -1 ){
				var replaceExt = getExtByContentType( getHeaderValue( "content-type", data ) );
				if( replaceExt ){
					tmp = tmp.split( "." );
					tmp.pop();
					tmp.push( replaceExt );
					tmp = tmp.join(".");
				}
				
				try{
					return decodeURIComponent(tmp);					
				}
				catch( ex ){
					if( window.unescape ){
						return unescape(tmp);										
					}
					else{
						return tmp;
					}
				}

			}
			
			return  null;		
		}; 
		
		function getExtByContentType( contentType ){
			if( !contentType ){
				return null;
			}
			var tmp = contentType.split("/");
			
			if( tmp.length == 2 ){
				switch( tmp[0] ){
					case "audio":
						if( AUDIO2EXT[tmp[1]] ){
							return AUDIO2EXT[tmp[1]];
						}
					break;
					case "video":
						if( VIDEO2EXT[tmp[1]] ){
							return VIDEO2EXT[tmp[1]];
						}						
					break;					
				}
			}			
			
			return null;
		}
		
		function getHeadersAll( data ){
			var result = [];
            for (var i = 0; i != data.responseHeaders.length; i++) {
            	result.push( data.responseHeaders[i].name + ": " + data.responseHeaders[i].value );
            }
			return result;
		}
		
        function getHeaderValue(name, data){
            name = name.toLowerCase();
            for (var i = 0; i != data.responseHeaders.length; i++) {
                if (data.responseHeaders[i].name.toLowerCase() == name) {
                    return data.responseHeaders[i].value;
                }
            }
            return null;
        }
        
        function dispositionName(data){
            try {
                var cd = getHeaderValue('Content-Disposition', data);
                var at = cd.match(/^(inline|attachment);/i);
                
                if ((at != null) && (at[1].toLowerCase() == 'attachment')) {
                    cd = cd.substr(at[0].length);
                    if (cd.charAt(cd.length - 1) != ';') 
                        cd += ';';
                    
                    var fnm = cd.match(/filename="(.*?)"\s*?(?:;|$)/i);
                    if (fnm == null) 
                        fnm = cd.match(/filename=(.*?)\s*?(?:;|$)/i);
                    if (fnm != null) 
                        return fnm[1];
                }
                
            } 
            catch (e) {
            }
			
            return null;
        }
		
        this.isMedia = function(data){

			if( !data.tabId )		return false;

            var contentType = getHeaderValue("content-type", data);
            if (contentType) {
                var tmp = contentType.split("/");
                if (CONTENT_TYPE_RE.test(contentType)) {
                    return true;
                }
                //else if( CONTENT_TYPE_IGNORE_RE.test(contentType) ){
                	//console.log( "Content type ", contentType, " is ignored" );
                	//return true;
                //}
            }
			
            var size = getHeaderValue("content-length", data);
            if (!size)                return false;
            
			var x = fvdSingleDownloader.Prefs.get( "fvd.trigger_video_more" );
			var min_filesize = MIN_FILESIZE_TO_CHECK;
			if ( x == 'video_100kb')  min_filesize = 102400;
			else if (x == 'video_1mb') min_filesize = 1048576;

			if ( size < min_filesize )             return false;
			
            var extension = fvdSingleDownloader.Utils.extractExtension(data.url);
 
            if (extension && IGNORE_EXTENSIONS.indexOf(extension) != -1) {
            	//console.log( extension, "is ignored" );
                return false;
            }

			if( isAllowedExt( extension ) ){
				return true;
			}
			
			var disposName = dispositionName( data );
			
			if( disposName ){
				var disposExt = fvdSingleDownloader.Utils.extractExtension( disposName );
				if( isAllowedExt( disposExt ) ){
					return true;
				}
			}
			
			if( size >= TRIGGER_VIDEO_SIZE ){
				return true;
			}
           
            return false;
        }
		
        this.checkCombine = function(data, callback){
			
			var media = fvdSingleDownloader.Media.Storage.getDataForSource(data.tab.id, "Combine");   
			
			var url = data.url;
			var tabId = data.tab.id;
			
			if (media && media.length == 1)  {
				var list = media[0].playlist;

 				if (similarity_url( url, list[0] ))  {
					list.push(url);
					fvdSingleDownloader.Media.Storage.setPlaylist(tabId, media[0].id, list);							
				}

				return true; 
			}
			else {
				media = fvdSingleDownloader.Media.Storage.getDataForSource(tabId, "Sniffer");

				if (media && media.length>3) {
					var f = [];
					for (var i=0; i<media.length; i++)  {
						if (!similarity_url( url, media[i].url ))  f.push( media[i].id );  
					}

					if ( (f.length*100/media.length)<20 )  {
	
						media = fvdSingleDownloader.Media.Storage.removeTabSourceData(tabId, "Sniffer", f); 
						media.sort( function( item1, item2 )  {   
							return (item1.id > item2.id ? 1 : -1);  
						});

						var list = [];
						for (var i=0; i<media.length; i++) list.push(media[i].url);
						list.push(url);
						
						var result = {				
							url: media[0].url,
							playlist: list,
							tabId: 	tabId,
							frameId: data.frameId,
							ext: 'mp4',
							
							title: media[0].title,
							format: "",
							
							downloadName: media[0].downloadName,
							displayName: media[0].displayName,
							filename: media[0].fileName,
							priority: 11,
							vubor:  0,
							type: "video",
							metod: "stream",
							source: "Combine",
							groupId: 0,
							dwnl:	1,
						};
						
						callback(result);
						
						return true;    
					}
				}
			}
			
			function similarity_url( url1, url2 )  {

				var k = 0, kk = 0;
				
				u1 = fvdSingleDownloader.Utils.parse_URL(url1);
				u2 = fvdSingleDownloader.Utils.parse_URL(url2);
				
				if (u1.hostname != u2.hostname) {
					//console.log(u1.hostname, u2.hostname);
					return false;
				}	
				
				s1 = _par(u1.search.substring(1,u1.search.length)); 
				s2 = _par(u2.search.substring(1,u2.search.length)); 
				
				for (var j in s1) {
					if ( s1[j] != s2[j] )  k++;	
				}	
				
				if ( k>1 ) {
					// console.log(k);
					return false;
				}	
				
/* 				for (var j=0; j<url1.length && j<url2.length; j++) {
					var s1 = url1.charAt(j);
					var s2 = url2.charAt(j);
					if ( s1 == s2) k++;
					kk++;
				}
				if ( (k*100/kk) > 90 )  return true; */

				return true;
			}
			
			function _par( u ) {
				var l = {};
				var m = u.split('&');
				for (var i=0; i<m.length; i++) {
					var mm = m[i].split('=');
					l[mm[0]] = mm[1];	
				}	
				return l;
			}	
			
			return false;
		}
        
		this.onMediaDetect = {
			addListener: function( callback ){
				if( mediaDetectCallbacks.indexOf( callback ) == -1 )	mediaDetectCallbacks.push( callback );   
			},
			removeListener: function(  ){
				mediaDetectCallbacks.length=0;   
			}
		};
		
		this.isEqualItems = function( item1, item2 ){
			
			return item1.url == item2.url;
			
		};
		
        chrome.webRequest.onResponseStarted.addListener(function(data){
			
			if( !data || data.tabId < 0 )		return false;
		
			chrome.tabs.get( data.tabId, function( tab ){
				
				if (chrome.runtime.lastError) {
					//console.log(chrome.runtime.lastError.message);
				} 
				else if ( !tab ) {
					console.log( data );
				}	
				else {

					var tabInfo = tab;
					

					// для этих адресов свои обработчики
					for (var _sind in SKIP_SNIFFER_SIGNS) {
						try {
							var M = new RegExp(SKIP_SNIFFER_SIGNS[_sind],'i');
						if ( M.test(tabInfo.url.toLowerCase()) )		return null;
						} catch (e) {
							//console.log(`Error: ${_sind}, \n ${e}`);
					}
					}


					
					if( self.isMedia( data ) )	{	
						
						if( fvdSingleDownloader.noYoutube )		{
							for( var i = 0; i != NO_YOUTUBE_SIGNS.length; i++ )		{
								var sign = NO_YOUTUBE_SIGNS[i];
								if( data.url.indexOf(sign) != -1 )				return;
							}
						}
						
						data.tab = tabInfo;
							
						// calling callbacks
						mediaDetectCallbacks.forEach(function( callback ){
							
							var m = self.checkCombine(data, callback);
							if ( !m ) {									
								m = self.prepareMedia( data );	
								callback( m );
							}	
																	
						});			
								
					}
				}	

			});
			
        }, {
            urls: ["<all_urls>"],
        }, ["responseHeaders"]);
        
    };
    
    this.Sniffer = new MediaSniffer();

	// -----------------------------------------	
    var MediaCombine = function(){
	
		this.isEqualItems = function( item1, item2 ){
			
			return item1.url == item2.url;
			
		};
	
	};
    this.Combine = new MediaCombine();
    
}).apply(fvdSingleDownloader.Media);
