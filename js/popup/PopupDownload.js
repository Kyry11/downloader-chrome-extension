(function(){
	
	var PopupDownload = function(){
		
		var self = this;
		
		// ----------------------------------------------
		this.show = function( item, media ){		
		
			function fbc( className ){
				return item.getElementsByClassName(className)[0];
			}
			
		
			fbc("download_url").setAttribute( "status", media.status );
			
			if (media.status == 'stop') {		// первоначальное состояние
				if( media.size )  {
					fbc("size").textContent = str_download_size(media.size);
				}
				else  {
					fbc("size").setAttribute( "loading", 1 );
					fvdSingleDownloader.Utils.getSizeByUrl( media.url, function( size ){
						
									fbc("size").removeAttribute( "loading" );
									if( size )	{
										fvdSingleDownloader.Utils.getActiveTab( function( tab ){		
												fvdSingleDownloader.Media.Storage.setData_Attribute( tab.id, media.id, "size", size );		
										});
										fbc("size").textContent = str_download_size( size );
									}
						
								} );				
				}
			}	
			else {
				fbc("text").textContent = 'Cancel';
				fbc("text").parentNode.style['background'] = '-webkit-linear-gradient(90deg, #FC2B53, #F9869C)';
				fbc("size").removeAttribute( "loading" );
				fbc("size").textContent = str_download_size(media.progressByte);
				
			}	
			
		};

		// ----------------------------------------------
		this.click = function( item, media ){
			var e_url =	item.getElementsByClassName("download_url")[0];								
			var e_txt =	item.getElementsByClassName("text")[0];								
			var e_siz =	item.getElementsByClassName("size")[0];								
			var st = e_url.getAttribute( "status" );
			
			if ( st == 'stop') {
				fvdSingleDownloader.Media.startDownload( media );
				
				e_url.setAttribute( "status", 'start' );
				e_txt.textContent = 'Cancel';
				e_txt.parentNode.style['background'] = '-webkit-linear-gradient(90deg, #FC2B53, #F9869C)';
				media.status = 'start';
			}
			else {
				fvdSingleDownloader.Media.stopDownload( media );
				
				e_url.setAttribute( "status", 'stop' );
				e_txt.textContent = 'Download';
				e_txt.parentNode.style['background'] = '-webkit-linear-gradient(90deg, #4da5d8, #58d2fd)';
				media.status = 'stop';
			}	
			e_siz.removeAttribute( "loading" );
				
		};		
		
		// ----------------------------------------------
		this.set = function( request ){		

			var item = document.querySelector( '[data-id="'+request.id+'"]' );			
			
			if (!item) return;
			
			var e_url =	item.getElementsByClassName("download_url")[0];								
			var e_txt =	item.getElementsByClassName("text")[0];								
			var e_siz =	item.getElementsByClassName("size")[0];								
			var st = e_url.getAttribute( "status" );
			

			if (request.status == 'start') {
				e_url.setAttribute( "status", 'start' );
				e_txt.textContent = 'Cancel';
				e_txt.parentNode.style['background'] = '-webkit-linear-gradient(90deg, #FC2B53, #F9869C)';
			}
			else if (request.status == 'stop') {
				e_url.setAttribute( "status", 'stop' );
				e_txt.textContent = 'Download';
				e_txt.parentNode.style['background'] = '-webkit-linear-gradient(90deg, #4da5d8, #58d2fd)';
			}
			else if (request.status == 'progress') {
				if( request.size )	{
					e_siz.textContent = str_download_size( request.size );
					e_siz.setAttribute('title', (request.progress ? '('+request.progress.toString()+'%)' : '') );
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
	
	this.PopupDownload = new PopupDownload();
	
}).apply( fvdSingleDownloader.Popup );
