(function(){
	
	var MediaStorage = function(){
		
		var self = this;

		const DOWNLOAD_AD_SIGNS_INTERVAL = 1000 * 3600 * 24 * 3; // every 3 days
		const DOWNLOAD_AD_SIGNS_CHECK_INTERVAL = 1000 * 60 * 5; // every 5 minutes
		
		// data stores by tab id		
		var extraData = {};
		var data = {};
		var adSigns = [];
		
		var lastItemId = 0;
		
		var mediaRemoveListeners = [];
		
		
		this.setTabExtraData = function(tabId, key, value) {
			if(!extraData[tabId]) {
				extraData[tabId] = {};
			}
			extraData[tabId][key] = value;
		}

		this.getTabExtraData = function(tabId, key) {
			
			if(extraData[tabId] && extraData[tabId][key]) {
				return extraData[tabId][key];
			}
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.itemHashExists = function( tabId, hash ){

			if( data[tabId] )	{
				for( var i = 0; i != data[tabId].length; i++ )	{
					if ( data[tabId][i].hash === hash ) return true;
				}
			}
			return false;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function itemAlreadyExists( tabId, item ){

			if( data[tabId] )	{
				for( var i = 0; i != data[tabId].length; i++ )	{
					var existsItem = data[tabId][i];
					if(fvdSingleDownloader.Media[item.source].isEqualItems( item, existsItem ))	{
						return true;
					}
				}
			}
			return false;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function itemAlreadyExists_source( tabId, item ){
			var exists = false;
			if( data[tabId] )
			{
				for( var i = 0; i != data[tabId].length; i++ )
				{
					var existsItem = data[tabId][i];
					if( existsItem.source == item.source )
					{
						if(fvdSingleDownloader.Media[item.source].isEqualItems( item, existsItem ))
						{
							exists = true;
							break;
						}
					}
				}
			}
			return exists;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getMaxPriorityForTab( tabId ){
			var max = 0;
			data[tabId].forEach(function( item ) {
				
				     if( item.priority > max )		max = item.priority;
					 
			});
			
			return max;			
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getDataForTab( tabId ){
			var result = [];
			
			data[tabId].forEach( function( item ){
				
						result.push( item );
				
			} );
			
			return result;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getDataForHash( hash ){
			
			var result = null;
			
			for( var tabId in data ){
				data[tabId].forEach( function( item ){
						if ('hash' in item && item.hash == hash)  result = item;
				} );
			}	
			
			return result;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getLink( tabId ){
		
			var result_link = [];
			var result_image = [];
			var result_file = [];
			var result_video = [];
			var count_link = 0;
			var count_image = 0;
			var count_file = 0;
			var count_video = 0;
			var vubor_link = 0;
			var vubor_image = 0;
			var vubor_file = 0;
			var vubor_video = 0;
			
			data[tabId].forEach( function( item ){
			
						if ( item.type == "video" || item.type == "audio" || item.type == "game")
						{
							result_video.push( item );
							count_video++;
							if (item.vubor == 1) vubor_video++;
						}
						else if ( item.type == "file" || item.type == "archiv")
						{
							result_file.push( item );
							count_file++;
							if (item.vubor == 1) vubor_file++;
						}
						else if ( item.type == "image" )
						{
							result_image.push( item );
							count_image++;
							if (item.vubor == 1) vubor_image++;
						}
						else
						{
							result_link.push( item );
							count_link++;
							if (item.vubor == 1) vubor_link++;
						}
					} );
					
			return { 	video: result_video, k_video: count_video, v_video: vubor_video,
						file: result_file, k_file: count_file, v_file: vubor_file, 
						image: result_image, k_image: count_image, v_image: vubor_image,
						link: result_link, k_link: count_link, v_link: vubor_link };
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getMedia( tabId ){
		
			var result_video = [];
			data[tabId].forEach( function( item ){
			
						if ( item.type == "video" || item.type == "audio" || item.type == "game")
						{
							result_video.push( item );
						}
					} );
			
			return result_video;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function getDataByPriority( tabId, priority ){
			var result = [];
			data[tabId].forEach( function( item ){
				
						if( item.priority == priority )		result.push( item );
				
			} );
			
			return result;
		}
		
		// ----------------------------------------------------------------------------------------------------
		function isAdUrl( url ){

			url = url.toLowerCase();
			
			for( var i = 0; i != adSigns.length; i++ ){
				
				if( !adSigns[i] ){
					continue;
				}
				
				if( url.indexOf( adSigns[i] ) != -1 ){
					return true;
				}
				
			}
			
			return false;
			
		}

		// ----------------------------------------------------------------------------------------------------
		this.hasDataForTab = function( tabId ){		
		
			if( data[tabId] && data[tabId].length > 0 )
			{	
				return true;
			}
			return false;
		}
		// ----------------------------------------------------------------------------------------------------
		this.setData_Status = function( tabId, id, t ){
			
			data[tabId].forEach( function( item ){
				
						if ( item.id == id)
						{
							item.vubor = t;
							return;
						}	
				
					} );
		}
		
		this.setData_Attribute = function( tabId, id, attr, val ){
			
			//console.log('setData_Attribute', tabId, id, attr, val );
			
			data[tabId].forEach( function( item ){
				
						if ( item.id == id)	{
							switch (attr)	{
								case "size":			item.size = val;     break;
								case "status":			item.status = val;     break;
								case "downloadId":      item.downloadId = val;
														item.progress = 0;
														item.progressByte = 0; 
														item.status = 'start';     break;
								case "progress":      	item.progress = val.progress;
														item.progressByte = val.progressByte;      break;
							}
							
							fvdSingleDownloader.MainButton.refreshMainButtonStatus();
							return;
						}	
					} );
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.setData_AttributeUrl = function( tabId, url, attr, val ){

			data[tabId].forEach( function( item ){
				
						if ( item.url == url)
						{
							switch (attr)
							{
								case "size":			item.size = val;     break;
								case "title":			item.title = val;     break;
								case "format":			item.format = val;     break;
								case "downloadName":	item.downloadName = val;     break;
							}
							return;
						}	
					} );
			
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.setTitle_FaceBook = function( tabId, videoId, val ){

			data[tabId].forEach( function( item ){
						if ( item.videoId && item.videoId == videoId)	{
							item.title = val;
							item.downloadName = "["+item.quality+"] "+val; 
							item.displayName = "["+item.quality+"] "+val;     
						}	
					});
			
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getData_Media = function( tabId, v ){

			var result = [];
		
			if (v)
			{
				data[tabId].forEach( function( item ){
							if ( v.indexOf(item.id) != -1 )			result.push(item);
						} );
			}			
					
			return result;		
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getDataForTab = function( tabId ){
		
			if( !self.hasDataForTab( tabId ) )		return null;
			
			var d = getDataForTab( tabId );
			
			return d;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getDataForHash = function( hash ){
		
			var d = getDataForHash( hash );
			
			return d;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getDataForId = function( id ){
			
			var d = null;
			for( var tabId in data ){
				data[tabId].forEach( function( item ){
						if (item.id == id)  d = item;
				} );
			}	
			
			return d;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getDataForSource = function( tabId, source ){
			
			if( !self.hasDataForTab( tabId ) )		return null;

			var result = [];
			
			data[tabId].forEach( function( item ){
				
						if (item.source == source)	result.push( item );
				
			} );
			
			return result;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getLink = function( tabId ){
		
			if( !self.hasDataForTab( tabId ) )		return null;
			
			var d = getLink( tabId );
			
			return d;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.getMedia = function( tabId ){
		
			if( !self.hasDataForTab( tabId ) )		return null;
			
			var d = getMedia( tabId );

			return d;
		}

		// ----------------------------------------------------------------------------------------------------
		this.setTwitch = function( hash, status, size ){
		
			var f = false;
			for( var tabId in data ){

				for( var i = 0; i != data[tabId].length; i++ ) {

							if ( data[tabId][i].hash == hash )	{

								if (status) data[tabId][i].status = status;
								if (size) data[tabId][i].size = size;
								
								f = true;
							}
				};
			}	
			if (f) fvdSingleDownloader.MainButton.refreshMainButtonStatus();

			return;
		}

		// ----------------------------------------------------------------------------------------------------
		this.getTwitch = function( tId, hash ){
		
			for( var tabId in data ){
				
				if (tabId == tId) continue;

				for( var i = 0; i != data[tabId].length; i++ ) {

					if ( data[tabId][i].hash == hash )	{

						return data[tabId][i];
					}
				};
			}	

			return null;
		}

		// ----------------------------------------------------------------------------------------------------
		this.setStream = function( hash, params ) {		

			var f = false;
			for( var tabId in data ){
				for( var i = 0; i != data[tabId].length; i++ ) {
							if ( data[tabId][i].hash == hash )	{
								for (var k in params) {
									data[tabId][i][k] = params[k];
								}	
								f = true;
							}
				};
			}
			
			if (f) fvdSingleDownloader.MainButton.refreshMainButtonStatus();

			return;
		}

		// ----------------------------------------------------------------------------------------------------
		this.setPlaylist = function( tabId, id, list ) {		

			for( var i = 0; i != data[tabId].length; i++ ) {
				if ( data[tabId][i].id == id )	{
					data[tabId][i].playlist = list;
				}
			};
			
			return;
		}

		// ----------------------------------------------------------------------------------------------------
		this.setDataForTab = function( tabId, tabData ){
			data[tabId] = tabData;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.addItemForTab = function( tabId, item ){
		
			if (!item.source) return;
			
			if( data[tabId] )	{
				for( var i = 0; i != data[tabId].length; i++ )	{
					var existsItem = data[tabId][i];
					if(item.source === 'FaceBook') {
						if(  item.video_id == existsItem.videoId  ) {
							item.id = data[tabId][i].id;
							item.status = data[tabId][i].status;
							if (data[tabId][i].size) item.size = data[tabId][i].size;
							data[tabId][i] = item;
							return;
						}
					} else {
						if(fvdSingleDownloader.Media[item.source].isEqualItems( item, existsItem ))	{
							//console.log('REPEAT', tabId, item, existsItem);
							item.id = data[tabId][i].id;
							item.status = data[tabId][i].status;
							if (data[tabId][i].size) item.size = data[tabId][i].size;
							data[tabId][i] = item;
							return;
						}
					}
				}
			}
			
			// add	
			lastItemId++;
			item.id = lastItemId;
			if (!item.status) item.status = 'stop';	
			if (!item.metod) item.metod = 'download';
			
			if( !self.hasDataForTab( tabId ) )	{
				data[tabId] = [];
			}
			data[tabId].push( item );
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.removeItemForUrl = function( tabId, url ){

			if (data[tabId])  {
				for( var i = 0; i != data[tabId].length; i++ ) {
							if ( data[tabId][i].url == url)	{
								data[tabId][i].type = 'remove';
							}
				};
			}			
		
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.removeTabSourceData = function( tabId, source, listId_NoRemove ){
			
			if (typeof listId_NoRemove == 'undefined') listId_NoRemove = [];

			if (source)  {
				if (data[tabId])  {
					var result = [];
					var listRemoved = [];
					
					data[tabId].forEach( function( item ) {
								if ( item.source != source || listId_NoRemove.indexOf(item.id) != -1 )  result.push(item);
								else listRemoved.push(item);
							} );
				
					if (result) data[tabId] = result;
							else delete data[tabId];
							
					return listRemoved;		
				}			
				
			}			
			else  {
				delete data[tabId];
			}	
			return null;
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.removeTabData = function( tabId ){

			//console.log('removeTabData', tabId);		
			delete data[tabId];
		}
		
		// ----------------------------------------------------------------------------------------------------
		this.removeItem = function( id ){
			
			for( var tabId in data ){
				
				var index = - 1;
				for( var i = 0; i != data[tabId]; i++ ){
					if( data[tabId][i].id = id ){
						index = i;
						break;
					}
				}
				
				if( index != -1 ){					
					data[tabId].splice( index, 1 );
					
					var removeListeners = [];
					
					mediaRemoveListeners.forEach(function( listener ){
						
						try{
							listener( tabId );
						}
						catch( ex ){
							removeListeners.push( listener );
						}
						
					});
					
					removeListeners.forEach(function( listener ){
							
						self.onMediaRemove.removeListener( listener );							
						
					});
					
					
				}
				
			}
			
		}
		
		// ------------------------------------------------------
		this.onMediaRemove = {
			addListener: function( callback ) {
							mediaRemoveListeners.push( callback );
						},
			
			removeListener: function( callback ){
							var index = mediaRemoveListeners.indexOf( callback );
							if( index != -1 )	mediaRemoveListeners.splice( index, 1 );
						}
		};
		
	}
	
	this.Storage = new MediaStorage();
	
}).apply( fvdSingleDownloader.Media );
