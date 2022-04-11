(function(){
	
	var PopupMediaStream = function(){
		
		var self = this;
		
		// ----------------------------------------------
		this.show = function( item, media ){		
		
			function fbc( className ){
				return item.getElementsByClassName(className)[0];
			}
		
			var m = fvdSingleDownloader.Media.Storage.getDataForHash( media.hash );
			if (m && m.status == 'start') {
				media.status = m.status;				
			}
			
			fbc("info").setAttribute( "streamHash", media.hash );
			fbc("download_url").setAttribute( "status", media.status );
			if (media.status == 'stop') {
				fbc("text").textContent = 'Start';
				// fbc("text").parentNode.style['background'] = '-webkit-linear-gradient(90deg, #4da5d8, #58d2fd)';
				if( media.size )  {
					fbc("size").removeAttribute( "loading" );
					fbc("size").textContent = str_download_size(media.size);
				}
				else  {
					fbc("size").setAttribute( "loading", 2 );
				} 
			}	
			else {
				fbc("text").textContent = 'Stop';
				// fbc("text").parentNode.style['background'] = '-webkit-linear-gradient(90deg, #FC2B53, #F9869C)';
				fbc("size").removeAttribute( "loading" );
				fbc("size").textContent = str_download_size(media.size);
				
			}	
			if (media.chunk > 0) {
				fbc("download_url").setAttribute( "chunk", media.chunk );	
			}
			else {
				fbc("download_url").removeAttribute( "chunk" );	
			}
			
			
			if (media.icons) extImage = 'images/formats/'+media.icons;

			if (media.source == 'Combine') {
				fbc("download_button").setAttribute( "title", _('popup_media_combine_title'));
				document.getElementById("combineNotice").removeAttribute('hidden');	
			}	
			
			
		};

		// ----------------------------------------------
		this.click = function( item, media ){		
		
			console.log('fvdSingleDownloader.Popup.PopupMediaStream', item, media);
			
			var e_url =	item.getElementsByClassName("download_url")[0];								
			var e_txt =	item.getElementsByClassName("text")[0];								
			var e_siz =	item.getElementsByClassName("size")[0];								
			var st = e_url.getAttribute( "status" );
			
			if ( st == 'stop') {
				fvdSingleDownloader.Media.startCombineDownload( media, function(size) { 
					e_siz.textContent = str_download_size(size);
					media.size = size;
				});
				e_url.setAttribute( "status", 'start' );
				e_txt.textContent = 'Stop';
				// e_txt.parentNode.style['background'] = '-webkit-linear-gradient(90deg, #FC2B53, #F9869C)';
				fvdSingleDownloader.Media.Storage.setTwitch( media.hash, 'start', null );
				media.status = 'start';
			}
			else {
				fvdSingleDownloader.Media.stopCombineDownload( media );
				e_url.setAttribute( "status", 'stop' );
				e_txt.textContent = 'Start';
				// e_txt.parentNode.style['background'] = '-webkit-linear-gradient(90deg, #4da5d8, #58d2fd)';
				fvdSingleDownloader.Media.Storage.setTwitch( media.hash, 'stop', null );
				media.status = 'stop';
			}	
			e_siz.removeAttribute( "loading" );
				
		};		
		
		// ----------------------------------------------
		this.set = function( request ){		

			var item = document.querySelector( '[data-id="'+request.id+'"]' );			
			if (!item) return;
			
			var container = document.getElementById("download_item_container");
			var elems = container.querySelectorAll('.info');
			
			for (var i=0; i<elems.length; i++) {
				var t =	elems[i].getAttribute( "streamHash" );
				if (request.streamHash == t ) {
					if (request.size == -1) {
						elems[i].querySelector(".size").textContent = '';
					}	
					else if (request.size == -2) {
						elems[i].querySelector(".size").textContent = 'preparing';
					}	
					else if (request.size == -3) {
						elems[i].querySelector(".size").textContent = 'finish';
					}	
					else {
						elems[i].querySelector(".size").textContent = str_download_size(request.size); 
						elems[i].querySelector(".size").setAttribute('title', (request.progress ? '('+request.progress.toString()+'%)' : '') );
					}	
				}	
			}	

		}
		
		// ---------------------------------------------- 
		function str_download_size( size ) {
		
			if (size == -1) return '';
			if (size == -2) return 'preparing';
			if (size == -3) return 'finish';
		
			if (size == 0) return "";
			if (size<1073741824)    return fvdSingleDownloader.Utils.bytesToMb(size) + "MB";
			      else return fvdSingleDownloader.Utils.bytesToGb(size) + "GB";
		
		}
		// ---------------------------------------------- 

		
	}
	
	this.PopupMediaStream = new PopupMediaStream();
	
}).apply( fvdSingleDownloader.Popup );
