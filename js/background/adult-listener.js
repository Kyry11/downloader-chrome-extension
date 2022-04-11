class ValidateUri {
	constructor() {
        this._blacklist = [];
		this._whitelist = [];
		this._queue = {};
		this._addListener();
	}

	_addListener(){
		document.addEventListener('isAdultWebsite', e => {
			if(!e || !e.detail || !e.detail.dcurr || !e.detail.rsp) return;
			const isAdult = e.detail.rsp === 'ADULT';
			this._updateList(isAdult ? this._blacklist : this._whitelist, e.detail.dcurr);
		});

        chrome.runtime.onMessage.addListener( (request,sender,sendResponse) => {
            if(request.websiteToValidate) {
                this.isAdult(request.websiteToValidate)
                    .then(isAdult => {
                        sendResponse({is_adult: isAdult, websiteToValidate: request.websiteToValidate});
                    });
                return true;
            }
        });
    }

	_updateList(list, url) {
		const domain = this._getDomainName(url);
		return !list.includes(domain) && list.push(domain);
	}

	_basicValidation(url) {
		return !!url && url.startsWith('http');
	}

	_getDomainName (url){
		let l = document.createElement("a");
		l.href = url;
		return l.origin;
	}

	isAdult(url) {
	    return new Promise((resolve, reject) => {
            // non-valid url
            if(this._basicValidation(url)) {
                const domain = this._getDomainName(url);
                this.setQueue(domain, resolve);
            } else {
                resolve(false);
            }
        });
	}

	_checkUri(domain){
        // blacklist
        if(this._blacklist.includes(domain)) {
            return true;
        }
        // whitelist
        if(this._whitelist.includes(domain)) {
            return false;
        }
        // unknown
        return null;
    }

	_checkInManualBlacklist(domain){
	    this._manual_blacklist = ["http://pornotube.com/","http://dachix.com/","http://badjojo.com/","http://pornhub.com/","http://redtube.com/","http://xtube.com/","http://empflix.com/","http://xhamster.com/","http://adultlibrary.com/","http://youjizz.com/","http://www.hentaitube.tv/","http://video.xnxx.com/","http://wankerhut.com/","http://shufuni.com/","http://nefesnefese.net/","http://spankwire.com/","http://moviefap.com/","http://xvideos.com/","http://extremetube.com/","http://submityourflicks.com/","http://hardsextube.com/","http://www.pornrabbit.com/","http://bravomamas.com/","http://youngleafs.com/","http://bravoteens.com/","http://deviantclip.com/","http://flytube.com/","http://tube8.com/","http://teenist.com/","http://www.pornotube.com/","http://www.dachix.com/","http://www.badjojo.com/","http://www.pornhub.com/","http://www.redtube.com/","http://www.xtube.com/","http://www.empflix.com/","http://www.xhamster.com/","http://www.adultlibrary.com/","http://www.youjizz.com/","http://www.www.hentaitube.tv/","http://www.video.xnxx.com/","http://www.wankerhut.com/","http://www.shufuni.com/","http://www.nefesnefese.net/","http://www.spankwire.com/","http://www.moviefap.com/","http://www.xvideos.com/","http://www.extremetube.com/","http://www.submityourflicks.com/","http://www.hardsextube.com/","http://www.www.pornrabbit.com/","http://www.bravomamas.com/","http://www.youngleafs.com/","http://www.bravoteens.com/","http://www.deviantclip.com/","http://www.flytube.com/","http://www.tube8.com/","http://www.teenist.com/","https://pornotube.com/","https://dachix.com/","https://badjojo.com/","https://pornhub.com/","https://redtube.com/","https://xtube.com/","https://empflix.com/","https://xhamster.com/","https://adultlibrary.com/","https://youjizz.com/","https://www.hentaitube.tv/","https://video.xnxx.com/","https://wankerhut.com/","https://shufuni.com/","https://nefesnefese.net/","https://spankwire.com/","https://moviefap.com/","https://xvideos.com/","https://extremetube.com/","https://submityourflicks.com/","https://hardsextube.com/","https://www.pornrabbit.com/","https://bravomamas.com/","https://youngleafs.com/","https://bravoteens.com/","https://deviantclip.com/","https://flytube.com/","https://tube8.com/","https://teenist.com/","https://www.pornotube.com/","https://www.dachix.com/","https://www.badjojo.com/","https://www.pornhub.com/","https://www.redtube.com/","https://www.xtube.com/","https://www.empflix.com/","https://www.xhamster.com/","https://www.adultlibrary.com/","https://www.youjizz.com/","https://www.www.hentaitube.tv/","https://www.video.xnxx.com/","https://www.wankerhut.com/","https://www.shufuni.com/","https://www.nefesnefese.net/","https://www.spankwire.com/","https://www.moviefap.com/","https://www.xvideos.com/","https://www.extremetube.com/","https://www.submityourflicks.com/","https://www.hardsextube.com/","https://www.www.pornrabbit.com/","https://www.bravomamas.com/","https://www.youngleafs.com/","https://www.bravoteens.com/","https://www.deviantclip.com/","https://www.flytube.com/","https://www.tube8.com/","https://www.teenist.com/","http://myhomeclip.com/","http://rude.com/","http://beeg.com/","http://lubetube.com/","http://indianpornvideos.com/","http://h2porn.com/","http://celebrityfakevideo.com/","http://motherless.com/","http://topamateurporn.com/","http://youfreeporn.us","http://asianpornmovies.com/","http://www.indianxtube.com/","http://xxxbunker.com/","http://gaywatch.com/","http://tube.abigtits.com/","http://www.myhomeclip.com/","http://www.rude.com/","http://www.beeg.com/","http://www.lubetube.com/","http://www.indianpornvideos.com/","http://www.h2porn.com/","http://www.celebrityfakevideo.com/","http://www.motherless.com/","http://www.topamateurporn.com/","http://www.youfreeporn.us","http://www.asianpornmovies.com/","http://www.www.indianxtube.com/","http://www.xxxbunker.com/","http://www.gaywatch.com/","http://www.tube.abigtits.com/","https://myhomeclip.com/","https://rude.com/","https://beeg.com/","https://lubetube.com/","https://indianpornvideos.com/","https://h2porn.com/","https://celebrityfakevideo.com/","https://motherless.com/","https://topamateurporn.com/","https://youfreeporn.us","https://asianpornmovies.com/","https://www.indianxtube.com/","https://xxxbunker.com/","https://gaywatch.com/","https://tube.abigtits.com/","https://www.rude.com/","https://www.beeg.com/","https://www.lubetube.com/","https://www.indianpornvideos.com/","https://www.h2porn.com/","https://www.celebrityfakevideo.com/","https://www.motherless.com/","https://www.topamateurporn.com/","https://www.youfreeporn.us","https://www.asianpornmovies.com/","https://www.www.indianxtube.com/","https://www.xxxbunker.com/","https://www.gaywatch.com/","https://www.tube.abigtits.com/","http://tubethumbs.com/","http://tjoob.com/","http://moviesand.com/","http://home-video-tube.com/","http://iyottube.com/","http://eporner.com/","http://moviesguy.com/","http://cliphunter.com/","http://homemoviestube.com/","http://mofosex.com/","http://porntube.com/","http://sextube.com/","http://tubety.com","http://submityourtapes.com/","http://amateurboobtube.com/","http://bravotube.com/","http://eroprofile.com/","http://freefuckvidz.com/","http://ashemaletube.com/","http://xxxkinky.com/","http://vidsvidsvids.com/","http://boyfriendtv.com/","http://keezmovies.com/","http://yuvutu.com/","http://gayforit.com/","http://5ilthy.com/","http://alotporn.com/","http://pridetube.com/","http://tnaflix.com/","http://lesbianpornvideos.com/","http://pornoxo.com/","http://porn.com/","http://tokyoporn.com/","http://liseli-porn.com/","http://gotgayporn.com/","http://realgfporn.com/","http://www.tubethumbs.com/","http://www.tjoob.com/","http://www.moviesand.com/","http://www.home-video-tube.com/","http://www.iyottube.com/","http://www.eporner.com/","http://www.moviesguy.com/","http://www.cliphunter.com/","http://www.homemoviestube.com/","http://www.mofosex.com/","http://www.porntube.com/","http://www.sextube.com/","http://www.tubety.com","http://www.submityourtapes.com/","http://www.amateurboobtube.com/","http://www.bravotube.com/","http://www.eroprofile.com/","http://www.freefuckvidz.com/","http://www.ashemaletube.com/","http://www.xxxkinky.com/","http://www.vidsvidsvids.com/","http://www.boyfriendtv.com/","http://www.keezmovies.com/","http://www.yuvutu.com/","http://www.gayforit.com/","http://www.5ilthy.com/","http://www.alotporn.com/","http://www.pridetube.com/","http://www.tnaflix.com/","http://www.lesbianpornvideos.com/","http://www.pornoxo.com/","http://www.porn.com/","http://www.tokyoporn.com/","http://www.liseli-porn.com/","http://www.gotgayporn.com/","http://www.realgfporn.com/","https://tubethumbs.com/","https://tjoob.com/","https://moviesand.com/","https://home-video-tube.com/","https://iyottube.com/","https://eporner.com/","https://moviesguy.com/","https://cliphunter.com/","https://homemoviestube.com/","https://mofosex.com/","https://porntube.com/","https://sextube.com/","https://tubety.com","https://submityourtapes.com/","https://amateurboobtube.com/","https://bravotube.com/","https://eroprofile.com/","https://freefuckvidz.com/","https://ashemaletube.com/","https://xxxkinky.com/","https://vidsvidsvids.com/","https://boyfriendtv.com/","https://keezmovies.com/","https://yuvutu.com/","https://gayforit.com/","https://5ilthy.com/","https://alotporn.com/","https://pridetube.com/","https://tnaflix.com/","https://lesbianpornvideos.com/","https://pornoxo.com/","https://porn.com/","https://tokyoporn.com/","https://liseli-porn.com/","https://gotgayporn.com/","https://realgfporn.com/","https://www.tubethumbs.com/","https://www.tjoob.com/","https://www.moviesand.com/","https://www.home-video-tube.com/","https://www.iyottube.com/","https://www.eporner.com/","https://www.moviesguy.com/","https://www.cliphunter.com/","https://www.homemoviestube.com/","https://www.mofosex.com/","https://www.porntube.com/","https://www.sextube.com/","https://www.tubety.com","https://www.submityourtapes.com/","https://www.amateurboobtube.com/","https://www.bravotube.com/","https://www.eroprofile.com/","https://www.freefuckvidz.com/","https://www.ashemaletube.com/","https://www.xxxkinky.com/","https://www.vidsvidsvids.com/","https://www.boyfriendtv.com/","https://www.keezmovies.com/","https://www.yuvutu.com/","https://www.gayforit.com/","https://www.5ilthy.com/","https://www.alotporn.com/","https://www.pridetube.com/","https://www.tnaflix.com/","https://www.lesbianpornvideos.com/","https://www.pornoxo.com/","https://www.porn.com/","https://www.tokyoporn.com/","https://www.liseli-porn.com/","https://www.gotgayporn.com/","https://www.realgfporn.com/"];

		let m = domain.match(/^((https?:\/\/)(www\.)?([0-9a-z-\.]+))/);
		if (m != null)
		{
			const url = m[1] + '/',
			    s_url = ((m[3] === '') ? m[2] + 'www.' + m[4] : m[2] + m[4]) + '/',
                is_adult = this._manual_blacklist.find(item => item.includes(url) || item.includes(s_url));
			return !!is_adult;
		}
		return false;
    }


	async setQueue(domain, resolve, times = 0){
        times++;
        let _isAdult = this._checkUri(domain);
        if(_isAdult === null){
            // try few more times
            if( times !== 5 ) {
                return setTimeout( ()=> {
                    this.setQueue(domain, resolve, times);
                }, times * 100);
            // check in predefined list
            } else {
                _isAdult = this._checkInManualBlacklist(domain);
            }
        }
        resolve(_isAdult);
    }
}
window.validateUri = window.validateUri || new ValidateUri();