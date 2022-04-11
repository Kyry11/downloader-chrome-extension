(function(){
	
	var PopupTwitch = function(){
		
		var self = this;
		
		// ----------------------------------------------
		this.show = function( item, media ){		
		
			function fbc( className ){
				return item.getElementsByClassName(className)[0];
			}

			var m = fvdSingleDownloader.Media.Storage.getTwitch( media.tabId, media.hash );
			if (m && m.status == 'start') {
				media.status = m.status;				
			}
			
			fbc("info").setAttribute( "twitchHash", media.hash );
			fbc("download_url").setAttribute( "status", media.status );
			if (media.status == 'stop') {
				fbc("text").textContent = 'Start Record';
				fbc("text").parentNode.style['background'] = '-webkit-linear-gradient(90deg, #4da5d8, #58d2fd)';
				if( media.size )  {
					fbc("size").removeAttribute( "loading" );
					fbc("size").textContent = str_download_size(media.size);
				}
				else  {
					fbc("size").setAttribute( "loading", 2 );
				} 
				fbc("download_button").title = "Click Start to record and click STOP to save it.";
			}	
			else {
				fbc("text").textContent = 'Stop Record';
				fbc("text").parentNode.style['background'] = '-webkit-linear-gradient(90deg, #FC2B53, #F9869C)';
				fbc("size").removeAttribute( "loading" );
				fbc("size").textContent = str_download_size(media.size);
				fbc("download_button").title = "Click Stop to save it.";
			}	
			
			extImage = 'images/formats/twitch.png';
			
		};

		// ----------------------------------------------
		this.click = function( item, media ){		
		
			console.log('fvdSingleDownloader.Popup.PopupTwitch', item, media);
			function fbc( className ){
				return item.getElementsByClassName(className)[0];
			}
			
			var e_url =	item.getElementsByClassName("download_url")[0];								
			var e_txt =	item.getElementsByClassName("text")[0];								
			var e_siz =	item.getElementsByClassName("size")[0];								
			var st = e_url.getAttribute( "status" );
			
			if ( st == 'stop') {
				
				fvdSingleDownloader.Media.startRecord( media, function(size) { 
					e_siz.textContent = str_download_size(size);
					media.size = size;
				});
				
				e_url.setAttribute( "status", 'start' );
				e_txt.textContent = 'Stop Record';
				e_txt.parentNode.style['background'] = '-webkit-linear-gradient(90deg, #FC2B53, #F9869C)';
				
				fvdSingleDownloader.Media.Storage.setTwitch( media.hash, 'start', null );
				
				media.status = 'start';
				
				fbc("download_button").title = "Click Stop to save it.";
			}
			else {
				fvdSingleDownloader.Media.stopRecord( media );
				e_url.setAttribute( "status", 'stop' );
				e_txt.textContent = 'Start Record';
				e_txt.parentNode.style['background'] = '-webkit-linear-gradient(90deg, #4da5d8, #58d2fd)';
				
				fvdSingleDownloader.Media.Storage.setTwitch( media.hash, 'stop', null );
				
				media.status = 'stop';
				
				fbc("download_button").title = "Click Start to record and click STOP to save it.";
			}	
			e_siz.removeAttribute( "loading" );
				
		};	

		// ----------------------------------------------
		this.set = function( request ){		

			var container = document.getElementById("download_item_container");
			var elems = container.querySelectorAll('.info');
			for (var i=0; i<elems.length; i++) {
				var t =	elems[i].getAttribute( "twitchHash" );
				if (request.twitchHash == t ) {
					elems[i].querySelector(".size").textContent = str_download_size(request.size);
				}	
			}	

		}	
		
		// ---------------------------------------------- 
		function str_download_size( size ) {
		
			if (size<1073741824)    return fvdSingleDownloader.Utils.bytesToMb(size) + "MB";
			        else return fvdSingleDownloader.Utils.bytesToGb(size) + "GB";
		
		}
		// ---------------------------------------------- 

		
	}
	
	this.PopupTwitch = new PopupTwitch();
	
}).apply( fvdSingleDownloader.Popup );
