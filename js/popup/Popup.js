(function(){

	var Popup = function(){

		var self = this;

		const ALLOWED_EXT_IMAGES = [
			"flv",
			"mp3",
			"mp4",
			"pdf",
			"swf",
			"webm",
			"3gp"
		];

		var HINTS = {};

		var hints_pref = null;

		const INTERVAL_TO_DISPLAY_WRITE_REVIEW = 2 * 24 * 3600 * 1000; // 2 days
		const INTERVAL_TO_DISPLAY_RATE = 2 * 24 * 3600 * 1000; // 5 days
		const URL_RATE = "https://chrome.google.com/webstore/detail/video-downloader-plus/njgehaondchbmjmajphnhlojfnbfokng/reviews";


		// ----------------------------------------------------------------------
		function getExtImage( ext ){

			ext = ext.toLowerCase();

			if( ALLOWED_EXT_IMAGES.indexOf(ext) == -1 )		return;

			return "images/formats/"+ext+".png";
		}

		function str_download_size( size ) {

			if (size<1073741824)    return fvdSingleDownloader.Utils.bytesToMb(size) + "MB";
			        else return fvdSingleDownloader.Utils.bytesToGb(size) + "GB";

		}

		// ----------------------------------------------------- построение строки с ошибкой
		function buildThreadItemError( media ){

			function fbc( className ){
				return item.getElementsByClassName(className)[0];
			}

			var item = document.getElementById("download_error_template").cloneNode( true );
			item.removeAttribute( "id" );
			fbc("download_title").textContent = media.title;
			fbc("download_button").addEventListener("click", function(event){
				var elem = this.parentNode.nextElementSibling;
				var st = elem.style.display;
				if (st == 'none')  elem.style.display = 'block';
				else		elem.style.display = 'none';
				event.stopPropagation();
			}, false);
			fbc("error_link").textContent = media.url;
			fbc("error_link").setAttribute( "href", media.url );


			return item;
		}

		// ----------------------------------------------------- построение строки
		function buildThreadItem( media ){

			function fbc( className ){
				return item.getElementsByClassName(className)[0];
			}

			var item = document.getElementById("download_item_template").cloneNode( true );

			item.removeAttribute( "id" );
			item.setAttribute( "data-id", media.id );

			// fbc("download_button").setAttribute( "href", "#" );

			var extImage = null;

			if ( _b(fvdSingleDownloader.Prefs.get( "fvd.original_filename" )) ) {
				fbc("download_url").textContent = media.filename ? media.filename : media.displayName;
			}
			else {
				fbc("download_url").textContent = media.displayName;
			}

			// fbc("download_url").setAttribute( "title", media.url );
			fbc("download_url").setAttribute( "source", media.source );
			fbc("download_url").setAttribute( "metod", media.metod );
			
			if (media.metod == 'record') {
				fvdSingleDownloader.Popup.PopupTwitch.show( item, media );
				fbc("download_button").addEventListener("click", onClick, false);
			}
			else if ( media.metod == 'stream' ) {
				fvdSingleDownloader.Popup.PopupMediaStream.show( item, media );
				fbc("download_button").addEventListener("click", onClick, false);
			}
			else {
				fvdSingleDownloader.Popup.PopupDownload.show( item, media );
				fbc("download_button").setAttribute( "href", "http://fdown.net/downloader.php?id=" + btoa( media.url ).split("").reverse().join("") );
				fbc("download_button").setAttribute( "target", "_blank" );
			}

			function onClick( event ) {
				// console.log('fvdSingleDownloader.Media.startDownload',media);

				if (media.metod == 'record') {
					var elem = event.currentTarget.parentNode.parentNode.parentNode;
					fvdSingleDownloader.Popup.PopupTwitch.click( elem, media );
				}
				else if ( media.metod == 'stream' ) {
					var elem = event.currentTarget.parentNode.parentNode.parentNode;
					fvdSingleDownloader.Popup.PopupMediaStream.click( elem, media );
				}
				else {
					var elem = event.currentTarget.parentNode.parentNode.parentNode;
					fvdSingleDownloader.Popup.PopupDownload.click( elem, media );
				}

				fbc("download_button").setAttribute( "loading", 1 );

				setTimeout( function(){
									fbc("download_button").removeAttribute( "loading" );
								}, 5000 );

				show_rate_message();

				event.stopPropagation();
			}

			// fbc("download_button").addEventListener("click", onClick, false);

			fbc("copyLink").addEventListener( "click", function( event ){

							fvdSingleDownloader.Utils.copyToClipboard( "http://fdown.net/downloader.php?id=" + btoa( media.url ).split("").reverse().join("") );

							event.stopPropagation();

						}, false );

			fbc("removeLink").addEventListener( "click", function( event ){

							fvdSingleDownloader.Media.Storage.removeItem( media.id );

							item.parentNode.removeChild( item );

							event.stopPropagation();

						}, false );

			var topOfImageText = "";
			if( media.quality )		topOfImageText = "";
			
			
			if (!extImage) extImage = getExtImage( media.ext );

			if( extImage )	{
				fbc("media_format").getElementsByTagName("img")[0].setAttribute( "src", extImage );
			}
			
			if (media.source == 'FaceBook') //FACEBOOK THUMBNAIL RAZOR
			{
				if(media.hasOwnProperty('thumb') && media.thumb) {
					fbc("media_format").getElementsByTagName("img")[0].setAttribute( "src", media.thumb );
				} else {
					fbc("media_format").getElementsByTagName("img")[0].setAttribute( "src", 'https://fdown.net/img/no-thumbnail-fbdown.png' );
				}
				fbc("media_format").getElementsByTagName("img")[0].style.width = "92px";
				fbc("media_format").getElementsByTagName("img")[0].style.maxHeight = "48px";
				fbc("media_format").getElementsByTagName("img")[0].style.background = "url(https://fdown.net/img/no-thumbnail-fbdown.png)" ;
				fbc("media_format").getElementsByTagName("img")[0].style.backgroundSize = "contain" ;
			}
			
			return item;

		}

		// ----------------------------------------------------- показать сообщение о рейтинге
		function show_rate_message( ){

			var showMessageRate = fvdSingleDownloader.Prefs.get( "fvd.rate_message.show" );

			if (showMessageRate == 0) {
				var now = new Date().getTime();

				if( now - fvdSingleDownloader.Prefs.get( "install_time" ) > INTERVAL_TO_DISPLAY_RATE )		{

					fvdSingleDownloader.Prefs.set( "fvd.rate_message.show", 1 );
					showMessageRate = 1;
				}
			}

			if (showMessageRate == 1) {
				var elem = document.getElementById("FvdSuggestionMessage");
				if (elem) elem.removeAttribute("hidden");
			}

		}

		// ---------------------------------------------- INIT ---------------------------
		this.init = function(){

			self.rebuildThreadsList();

			self.refreshTopHints();

			if( !chrome.webRequest )	{
				var x = document.getElementById("updateChromeNotice");
				if (x) x.removeAttribute("hidden");
				x = document.getElementById("multiple_download_block_title");
				if (x) x.setAttribute("hidden", true);
			}

			var showMessageRate = fvdSingleDownloader.Prefs.get( "fvd.rate_message.show" );
			var elem = document.getElementById("FvdSuggestionMessage");
			if (elem) {
				if (showMessageRate == 1) {
					elem.removeAttribute("hidden");
				}
				elem.addEventListener( "click", function(){
										fvdSingleDownloader.Prefs.set( "fvd.rate_message.show", 2 );
										self.navigate_url(URL_RATE);
									}, false );
			}

			var elem = document.getElementById("help_link_converter");
			if (elem) elem.style.display = "none";
			var elem = document.getElementById("help_link_note_taking");
			var language = window.navigator.userLanguage || window.navigator.language;
			if (elem) {
				if ( language == 'ru' ) {
					elem.setAttribute("href", "http://nimbus.everhelper.me/nimbus-note-windows-ru.php");
				}
			}

			chrome.extension.onMessage.addListener( function( request ) {

								if( request.subject == "mediaForTabUpdate" )  {
									fvdSingleDownloader.Utils.getActiveTab( function( tab ){

													if( tab.id == request.data )   {
														self.rebuildThreadsList();
													}

												});
								}
								else if( request.subject == "mediaTwitch" )  {
									fvdSingleDownloader.Popup.PopupTwitch.set( request );
								}
								else if( request.subject == "mediaStream" )  {
									fvdSingleDownloader.Popup.PopupMediaStream.set( request );
								}
								else if( request.subject == "mediaDownloadState" )  {
									fvdSingleDownloader.Popup.PopupDownload.set( request );
								}
							} );

			// ----	реклама
			var elem = document.getElementById("captureDownloadHint_close");
			if (elem) elem.addEventListener( "click", function(){
								fvdSingleDownloader.Prefs.set( hints_pref, false );
								var k = 0;
								for(var i in HINTS)
								{
									var p = _b(fvdSingleDownloader.Prefs.get( HINTS[i].set ));
									if (p)  k++;
								}
								if (k == 0)
								{
									fvdSingleDownloader.Prefs.set( "popup.display_slow_download_hint", true );
								}

								self.refreshTopHints();
							}, false );

			var elem = document.getElementById("returnToThreads");
			if (elem) elem.addEventListener( "click", function(){
								displayDownloads();
							}, false );

			var elem = document.getElementById("help_link_donate");
			if (elem) elem.addEventListener( "click", function(){
								displayDonate();
							}, false );

			var elem = document.getElementById("slowDownloadHint_close");
			if (elem) elem.addEventListener( "click", function(){
								//fvdSingleDownloader.Prefs.set( "popup.display_slow_download_hint", false );
								//self.refreshTopHints();
							}, false );

			var e = document.getElementById("help_link_clear");
			if (e) e.addEventListener( "click", function(){
										self.clearList();
									}, false );

			// --- Rate
			var now = new Date().getTime();
			var elem = document.getElementById("help_link_write_review");

			if (elem)		{
				if( now - fvdSingleDownloader.Prefs.get( "install_time" ) < INTERVAL_TO_DISPLAY_WRITE_REVIEW )		{
					elem.style.display = "none";
				}
				if( !_b(fvdSingleDownloader.Prefs.get( "popup.display_rate" )) )		{
					elem.style.display = "none";
				}
				if ( !fvdSingleDownloader.noYoutube )		{
					elem.style.display = "none";
				}

				menu = document.createElement( "div" );
				menu.setAttribute( "id", "help_link_rate_review" );
				menu.style.display = "none";
				elem.appendChild(menu);

				span = document.createElement( "span" );
				span.setAttribute( "class", "help_link_rate_title" );
				span.textContent = "What do you think?";
				menu.appendChild(span);

				var buttonContent2 = '<span style="margin-right:5px;"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkI2Q0ExOUU2Q0U5MzExRTJCRUI5QTUwMkI5OEY0M0ZFIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkI2Q0ExOUU3Q0U5MzExRTJCRUI5QTUwMkI5OEY0M0ZFIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QjZDQTE5RTRDRTkzMTFFMkJFQjlBNTAyQjk4RjQzRkUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QjZDQTE5RTVDRTkzMTFFMkJFQjlBNTAyQjk4RjQzRkUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5y/i71AAACYklEQVR42qRUS2sTURT+7kzM5NFJ0pQk0or2kYRAi1I34qpoFy5UBEFxJxR/QcGdIoiudFHBhQuFIG5LEZetLoJpfZWWFmkxpY4So/ZhzWsmk8nc60mjRTvueuBwX+d85zvfvTNMCIG9mIQ9mmtndo21RhtJtOMB1NhRWBurqNhzqCIDBVmksYLTFNNOflPsAmiaQCdUjKP77ACiXgLjg7ClQejlEazNfsLw2nMCGgPHopNBa3UV8VMD2FwGZGKkBGmvDVADQPjMISRqI8hlLqCQf0jRo/9qIHAQ0dA5FEuAvwZ4VNqjY94A6mXA+AIwDhw+ryKEi04RZeqdH+gBikAgRInUI2vqwloja4LVCYjO63jlbEGQNJH9VJkC5XVaU5Ik/a4htivATawMC9Cx5GQg4TVWp55tB/uSwL5mCzSX3bTuJI9RIjHQsiYsTDsZSPhMyJfwZvIK+lK30HNEhV2hqhGgQKIXZnMwMIEGnsKHmf+10GSpU8ubCEb8cBFlTuovpN//mMdtbVoel07YdYtIlLaAYQeAsQ0SQhe7gVhSAjeBuSfa/ax6+dH3noV5OeBKvPXLuW8fbeQ/QOzW4PjMEN5tIIVIKgEf3f/iRPX6VPjuaK7f9bOqHEspegLY6urwszZFcTOHiDbd+Vi+X6svL00ic6+cfoE7j7/2ad2K1ethvF0IppL7O7w+bzwe38ljf77Gk0NDeCl7WK++EQialei6pDafkUouuQQzG4xXdcMob9ZqZVPTTM658ymrshArlrcY1HnR5WfhkCR03ipjNQTM0vqaYXm8jb9/Ab8EGAAOWeW36rTgEQAAAABJRU5ErkJggg==" align="left"></span>Bad';
				var button2 = document.createElement("button");
				button2.setAttribute("class", "help_link_rate_button");
				button2.setAttribute("type", "button");
				button2.setAttribute("id", "help_link_rate_bad");
				button2.innerHTML = buttonContent2;
				menu.appendChild(button2);
				button2.addEventListener( "click", function(){
								self.set_no_rating();
								var m = document.getElementById("help_link_rate_review");
								setTimeout( function() {   m.style.display = "none";		}, 500);
							}, false );

				var buttonContent1 = '<span style="margin-right:5px;"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjdCRkM1QTIyQ0U5MzExRTJCNDlEOTdEQjg5QkY1MzVEIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjdCRkM1QTIzQ0U5MzExRTJCNDlEOTdEQjg5QkY1MzVEIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6N0JGQzVBMjBDRTkzMTFFMkI0OUQ5N0RCODlCRjUzNUQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6N0JGQzVBMjFDRTkzMTFFMkI0OUQ5N0RCODlCRjUzNUQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5nMHf4AAACmUlEQVR42qRSTU8TURQ9M1PaOqVFSmkhgJgmQCoYCEElxpiImpi4MXHpkq1xReLKxJWJ7mTtj9AYNFEXLDGoNIALgVCpWApi25nOTGfa+fC0hUBcyMJ5ufPeu+/d88499wqe5+F/Pl/j/1AA6jgSutCK+xAQh4XX0Gj79CdoYZpGE2kumvefeY1tc+M2VjGExFFEIlcRwAh9Ik4geBxA5MsJdIymkLw2hK6Bu/Tc5Enrv0DEY2uX4xfMnSxkGeg7P45ucYb+YTiEPpFBC01ABkv5OWQ3MgiHBQzeuIKR2BOE8AA6gWqQ/wbzHcwCh0S4foKdhmlKqBkULhLEuYkpFLJJFNcuw7C/UNxVmEiTbZFxhtAo44wQZfggIphG1/gtxBO98FcBpwLIcfJsBWyqrO7XkFvcQL44S6CPeOot+Q6yTyGI64gP3UMi5keLzgCaFwQqCstrAafaWaOeeqIp6O8myZToWGpqEGBm/oYWfqiqhIreFEbgseeQCQFsmsj3omeA9v5h9sWFIxGDFE9iXsb6J+hmFSaDHWol8VgiiwC7yM9ZYFouGcEKMbLtSEQTu3wwzTw/sOoDLEm0rit8ZCyQmiTXAT2ov3X8XC8in19ElfcPAZ6v98BwxO247LydblmZQmxsErGzrAyZVExAyQK5vZ2VzcL7+W/2m0sRLAyFUWo7BNi2ZLgeXLXsLs+mO2cnSqWdvvhaqua4mla2iht5Zyu9J6aXCx2fF3LO1xdjinax/VgfhCQbEhkbDrS5XORVtVbKRr8ryfm9tqphueUtzbe9WQn+KNSgQK14L7NB7Ooma84M633w+E4SIgEsCp7RJNzuVZDRw+Kj1W4/RNffGYQUcHS7rJQstVSy4TguBAFuuYw/AgwAs58ROceXw74AAAAASUVORK5CYII=" align="left"></span>Good';
				var button1 = document.createElement("button");
				button1.setAttribute("class", "help_link_rate_button");
				button1.setAttribute("type", "button");
				button1.setAttribute("id", "help_link_rate_good");
				button1.innerHTML = buttonContent1;
				menu.appendChild(button1);

				button1.addEventListener( "click", function(){
								self.set_no_rating();
								self.give_us_rating();
							}, false );

				elem.addEventListener( "click", function(){
								self.clickMenu = true;
								var m = document.getElementById("help_link_rate_review");
								if (m.style.display == "none")  m.style.display = "block";
													else m.style.display = "none";
							}, false );

				document.addEventListener( "click", function(){
								if (self.clickMenu == true)
								{
									self.clickMenu = false;
								}
								else
								{
									var m = document.getElementById("help_link_rate_review");
									m.style.display = "none";
								};
							}, false );
			}

			fvdSingleDownloader.Utils.getActiveTab(function( tab ){

									if( fvdSingleDownloader.noYoutube )  {
										if (fvdSingleDownloader.MainButton.isYoutubeUrl(tab.url)) {
											var x = document.getElementById("noYoutubeMessage");
											if (x) x.removeAttribute( "hidden" );
											var y = document.getElementById("download_item_container");
											if (y) y.setAttribute( "hidden", true );

											show_sovet();
										}
									}
									else {
										var x = document.getElementById("noYoutubeMessage");
										if (x) x.setAttribute( "hidden" , true);
										var y = document.getElementById("download_item_container");
										if (y) y.removeAttribute( "hidden" );
									}

								});

		}

		// ----------------------------------------------
		function show_sovet() {

			var showSovet = _b(fvdSingleDownloader.Prefs.get( "fvd.show_sovet_smart_pause" ));
			var elem = document.getElementById("sovet_block");
			if (showSovet && !fvdSingleDownloader.MainButton.isSmartPause && elem) {
				elem.removeAttribute("hidden");
				elem.addEventListener( "click", function(event){
										self.navigate_url("https://chrome.google.com/webstore/detail/smart-pause-for-youtube/dcflkimagfnicklojfonbbcppnikogih");
										event.stopPropagation();
									}, false );
				var elemClose = document.getElementById("sovet_block_close");
				elemClose.addEventListener( "click", function(event){
										fvdSingleDownloader.Prefs.set( "fvd.show_sovet_smart_pause", false );
										document.getElementById("sovet_block").setAttribute("hidden", true);
										event.stopPropagation();
									}, false );
			}

		}

		// ----------------------------------------------
		this.navigate_url = function( url ){
			chrome.tabs.query( 	{
							url:  url
						}, function( tabs ){

									if( tabs.length > 0 )
									{
										foundTabId = tabs[0].id;
										chrome.tabs.update( foundTabId, {
																		active: true
																		} );
									}
									else
									{
										chrome.tabs.create( {	active: true,
																url: url
															}, function( tab ){ }
														);
									}
					} );
		}

		// ----------------------------------------------
		this.clearList = function(){

			var container = document.getElementById("download_item_container");
			while( container.firstChild )
			{
				container.removeChild( container.firstChild );
			}

			fvdSingleDownloader.Utils.getActiveTab( function( tab ){

				if( tab )
				{
					fvdSingleDownloader.Media.Storage.removeTabData( tab.id );
				}

			} );
		}

		// ----------------------------------------------
		this.refreshTopHints = function(){

			var elem1 = document.getElementById("slowDownloadHint");
			if (elem1) elem1.setAttribute("hidden", true);
			var elem2 = document.getElementById("captureDownloadHint");
			if (elem2) elem2.setAttribute("hidden", true);

			var k = 0;
			var e = [];
			for(var i in HINTS) 	{
				HINTS[i].pref = _b(fvdSingleDownloader.Prefs.get( HINTS[i].set ));
				if (HINTS[i].pref)	{
					e[k] = i;
					k++;
				}
			}
			var rnum = 0;
			if( k > 0 )
			{
				rnum = Math.floor(Math.random() * k	);

				var item = HINTS[e[rnum]];

				var elem = document.getElementById("captureDownloadHint");
				if (elem)
				{
					elem.removeAttribute("hidden");
					var a = elem.getElementsByTagName("a")[0];
					a.textContent = item.label;
					a.setAttribute("href", item.url);
					a.style.background="url("+item.icon+") 6px center no-repeat";

					hints_pref = item.set;
				}
				return;
			}

			if( _b(fvdSingleDownloader.Prefs.get( "popup.display_slow_download_hint" )) )
			{
				var elem = document.getElementById("slowDownloadHint");
				if (elem) elem.removeAttribute("hidden");
				return;
			}

		}

		// ----------------------------------------------  запрос к данным
		function validateWebsite(uri, run, callback) {
		    chrome.extension.sendMessage({websiteToValidate: uri}, function(response) {
		        if(!response.is_adult) {
		            run(callback);
		        }
		    });
	        }

		function threadsOfActiveTab( callback ){
			fvdSingleDownloader.Utils.getActiveTab( function( tab ){
								if( !tab )	{
									callback( null );
								}
								else  {
									if ( fvdSingleDownloader.noYoutube && fvdSingleDownloader.MainButton.isYoutubeUrl(tab.url))  {
										// youtube
									}
									else if ( fvdSingleDownloader.MainButton.isTwitchUrl(tab.url))  {
										// twitch
										var media = fvdSingleDownloader.Media.Storage.getMedia( tab.id );
//console.log(media);
										media.sort( function( item1, item2 )  {
														return (item1.priority < item2.priority ? 1 : (item1.priority == item2.priority ? (item1.id < item2.id ? 1 : -1) : -1));
													} );

										callback( media );
									}
									else if ( fvdSingleDownloader.MainButton.isStreamUrl(tab.url))  {
										// stream
										var media = fvdSingleDownloader.Media.Storage.getMedia( tab.id );

										media.sort( function( item1, item2 )  {
														return (item1.priority < item2.priority ? 1 : (item1.priority == item2.priority ? (item1.id > item2.id ? 1 : -1) : -1));
													} );

										callback( media );
									}
									else   {
										var setThreadsOfActiveTab = function(callback) {
											var media = fvdSingleDownloader.Media.Storage.getMedia( tab.id );
											console.log('---- media');
											console.log(media);
											var media = fvdSingleDownloader.MainButton.filter_Media( media );
											media.sort( function( item1, item2 )  {
												if (item1.priority == item2.priority) {
													if (item1.priority > 0) {
														return (item1.id < item2.id ? 1 : -1)
													}
													else if (item1.priority < 0) {
														return (item1.id > item2.id ? 1 : -1)
													}
												}
												else {
													return (item1.priority < item2.priority ? 1 : -1);
												}
											} );
											callback( media );
                                        };

										validateWebsite(tab.url, setThreadsOfActiveTab, callback);
									}
								}

							} );
		}

		// ------------------------------------------------- перестроить дерево
		this.rebuildThreadsList = function(){

			threadsOfActiveTab( function( threads ) {

						if( threads )	{
							var x = document.getElementById("snifferNotice");
							if (x) x.setAttribute("hidden", true);
							x = document.getElementById("multiple_download_block_title");
							if (x) x.removeAttribute("hidden");
							x = document.getElementById("help_link_clear");
							if (x) x.removeAttribute("hidden");

							var container = document.getElementById("download_item_container");
							while( container.firstChild )  {
								container.removeChild( container.firstChild );
							}

							var currentGroup = null;

							// console.log('threads');
							// console.log(threads);
							threads.forEach(function( thread )  {

											try	 {
												if ('status' in thread && thread.status == 'error') {
													var item = buildThreadItemError( thread );
													container.appendChild( item );
												}
												else {
													var item = buildThreadItem( thread );
													container.appendChild( item );
												}
											}
											catch( ex )	{
												console.log( ex );
											}
										});
						}

						if (threads.length==0) {
							var x = document.getElementById("snifferNotice");
							if (x) x.removeAttribute("hidden");
							x = document.getElementById("multiple_download_block_title");
							if (x) x.setAttribute("hidden", true);
							x = document.getElementById("help_link_clear");
							if (x) x.setAttribute("hidden", true);
						}

					} );

		document.getElementById("multiple_download_block").addEventListener("click", function(event){
				var elems = document.querySelectorAll(".rightDropDownn");
				for (var i=0; i<elems.length; i++)	elems[i].style.display = 'none';
			}, false);

		}

		// ----------------------------------------------
		this.give_us_rating = function(){

			var url;
			if( fvdSingleDownloader.noYoutube ) {
				url = URL_RATE;
			}
			else {
				url = URL_RATE;
			}

			chrome.tabs.create( {	active: true,
									url: url
								}, function( tab ){ }
							);
		}
		// ----------------------------------------------
		this.set_no_rating = function(){
			fvdSingleDownloader.Prefs.set( "popup.display_rate", false );
		}


	}

	this.Popup = new Popup();

}).apply( fvdSingleDownloader );
