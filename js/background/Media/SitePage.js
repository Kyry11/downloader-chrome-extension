(function(){

	var SitePage = function(){		
	
		var self = this;
		
		const TITLE_MAX_LENGTH  = 96;
        const VIDEO_EXTENSIONS = ["flv", "ram", "mpg", "mpeg", "avi", "rm", "wmv", "mov", "asf", "rbs", "movie", "divx", "mp4", "ogg", "mpeg4", "m4v", "webm"];
	
		var mediaDetectCallbacks = [];
		
		// ----------------------------------------------------------
		function get_JSON_param( name, val ){			
		
			var x = '"' + name + '"\s*:\s*"([^\"]+?)"';
			var rxe = new RegExp( x, 'i');
			var m  = rxe.exec(val);
			if (m)	return m[1];
			return null;
		}
		
		// --------------------------------------------------------------------------
		function prepareMedia( media ){

			var u = fvdSingleDownloader.Utils.convertURL(media.url);
			
			if (u.type)
			{
				if ( !media.type )  media.type = u.type;
				else if ( media.type == "link" )  media.type = u.type;
			}	
			
			if ( !fvdSingleDownloader.Utils.check_enable_type(media.type) )  return null;
			
			var result = {				
				url: media.url,
				ext: u.ext,
				title: media.title,
				format: "",
				downloadName: u.name,
				displayName: u.name,
				priority: 10,
				size: "",
				type: "video",
				groupId: 0,
				dwnl:	1,
				orderField: 0
			};
			
			return result;
		}
		
		// --------------------------------------------------------------------------------
		function storeMedia( media, tabId ){
			
			media.forEach(function( item ){
			
						item.tabId = tabId;
						if (!item.priority) item.priority = 1;
						item.vubor = 0;
						item.metod = "download";
						
						if ( !('source' in item) )	item.source = "SitePage";
				
					});
					
			mediaDetectCallbacks.forEach( function( callback ){
						callback( media );
					} );
					
		}
		// --------------------------------------------------------  
		function parse_str(str){
			var glue1 = '=';
			var glue2 = '&';
			var array2 = str.split(glue2);
			var array3 = [];
			for(var x=0; x<array2.length; x++)
			{
				var tmp = array2[x].split(glue1);
				array3[unescape(tmp[0])] = unescape(tmp[1]).replace(/[+]/g, ' ');
			}
			return array3;
		}
		
		// --------------------------------------------------------------------------------
		function asyncOpen( url, callback ){

			var ajax = new XMLHttpRequest();
				
			ajax.open('GET', url);
			ajax.setRequestHeader('Cache-Control', 'no-cache');
				
			ajax.onreadystatechange = function()  {
							try
							{
								if  ( (this.readyState == 4) && (this.status == 200))
								{
									var text = ajax.response;
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
		
		// --------------------------------------------------------------------------------
		function convertEscapedCodesToCodes(str, prefix, base, num_bits) {
			var parts = str.split(prefix);
			parts.shift();  // Trim the first element.
			var codes = [];
			var max = Math.pow(2, num_bits);
			for (var i = 0; i < parts.length; ++i) 
			{
				var code = parseInt(parts[i], base);
				if (code >= 0 && code < max) 
				{
					codes.push(code);
				} 
				else 
				{
					// Malformed code ignored.
				}
			}
			return codes;
		}

		function convertEscapedUtf16CodesToUtf16Codes(str) {
			return convertEscapedCodesToCodes(str, "\\u", 16, 16);
		}

		function convertUtf16CodesToString(utf16_codes) {
			var unescaped = '';
			for (var i = 0; i < utf16_codes.length; ++i) 
			{
				unescaped += String.fromCharCode(utf16_codes[i]);
			}
			return unescaped;
		}
		
		function unescapeFromUtf16(str)  {
			var utf16_codes = convertEscapedUtf16CodesToUtf16Codes(str);
			return convertUtf16CodesToString(utf16_codes);
		}

		// --------------------------------------------------------------------------------
		function getEmbedFromBreackCom( id, callback ){
			
			var url = 'http://www.break.com/embed/'+id+'/';
			
			// send request to Break.Com
			var ajax = new XMLHttpRequest();
			ajax.open('GET', url, true);
			ajax.setRequestHeader('Cache-Control', 'no-cache');
			
			ajax.onload = function(){
						var content = this.responseText;

						callback( content );
			}
			
			ajax.onerror = function(){
				callback( null );
			}
			
			ajax.send( null );
		
		}
		// --------------------------------------------------------------------------------
		
		
		const DISPLAY_FVDSD_RATE_SHOW = 3600 * 24 * 1 * 1000; // one day
		//const DISPLAY_FVDSD_RATE_SHOW = 1000; // test
		
		// --------------------------------------------------------------------------------
		this.Rate_Message = function( tabId, type, url ){

			var xx = "rate.display_"+type;
			var flag = _b(fvdSingleDownloader.Prefs.get( xx ));
			
			if (flag) {
				var xx = "rate.last_show_"+type;
				var last = parseInt(fvdSingleDownloader.Prefs.get( xx ));

				last += DISPLAY_FVDSD_RATE_SHOW;
				
				var current_dt = new Date();
				var current_time = current_dt.getTime();
				
				if (last > current_time) flag = false;
			}
			
			if (flag)	{
				fvdSingleDownloader.Prefs.set( xx, current_time );
				
				fvdSingleDownloader.ContentScriptController.processMessage( tabId, {
									action: "canShowRateDialog",
									type: type,
									url: url
								} );				
			}
		}
		
		// --------------------------------------------------------------------------------
		this.Dont_Rate_Message = function( type ){
		
			var xx ="rate.display_"+type;
			fvdSingleDownloader.Prefs.set( xx, false );
		
		}
		
		
		// --------------------------------------------------------------------------------
		this.getContentFromYoutubePage = function( videoId, callback ){
			getContentFromYoutubePage( videoId, callback );
		}
		
		// --------------------------------------------------------------------------------
		this.onMediaDetect = {
						addListener: function( callback ){
						
									if( mediaDetectCallbacks.indexOf( callback ) == -1 )
									{
										mediaDetectCallbacks.push( callback );
									}
									
								}
					}
		
		// --------------------------------------------------------------------------------
		this.isEqualItems = function( item1, item2 ){
			
			if(  item1.url == item2.url  )
			{
				return true;
			}	
			
			return false;
			
		}
		
		// --------------------------------------------------------------------------------
		chrome.extension.onRequest.addListener ( function(request, sender, sendResponse) {        
	
						if(request.akce=="dontDisplayRateMessage")		{
						
							self.Dont_Rate_Message(request.type);
							
						}
						
					});
 	
 
	}
	
	this.SitePage = new SitePage();
	
}).apply( fvdSingleDownloader.Media );
