var _gaq = [];

(function() {
	var SEND_REPORT_EVERY = 24*3600*1000, ANALYTICS_CODE = "UA-64751394-1";

	// Standard Google Universal Analytics code
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){

	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),

	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)

	})(window,document,'script','https://www.google-analytics.com/analytics.js','ga'); // Note: https protocol here
	
	ga('create', ANALYTICS_CODE, 'auto');
	ga('set', 'checkProtocolTask',null);
	
	// initialize analytics
  
	function setLastAnalyticsTime() {
		localStorage["_analytics_last_time"] = new Date().getTime();
	}
  
	function getLastAnalyticsTime() {
		var v = localStorage["_analytics_last_time"];
		v = parseInt(v);
		if(isNaN(v)) {
			v = 0;
		}
		return v;
	}  
  
	// check need send analytic report once per minute
	setInterval(function() {
		var lastSendTime = getLastAnalyticsTime(), now = new Date().getTime();
		if(now - lastSendTime > SEND_REPORT_EVERY) {
			console.log("SEND");
			ga('send', 'pageview');
			setLastAnalyticsTime();
		}
	}, 60000);
})();