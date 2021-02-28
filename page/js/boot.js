const t0 = performance.now()

	var SHOW_DEBUG = true;

	var tstring = {}

// setup initial config environment
	const setup = environment.setup(version)

// load css
	const styles = [
		// './tpl/assets/css/main.css',
		'./page/css/page.css'
	]
	const head  = document.getElementsByTagName('head')[0];
	for (let i = 0; i < styles.length; i++) {
		const link	= document.createElement('link')
		link.rel	= "stylesheet"
		link.type	= "text/css"
		link.href	= styles[i] + '?' + version
		head.appendChild(link)
	}

// load scripts with version control
	const scripts = [
		'./common/app_utils-min.js',
		'./page/js/page.js',
		'./common/common.js'
		// './tpl/assets/js/main.js',
	]
	const ar_load = []
	for (let i = 0; i < scripts.length; i++) {

		ar_load.push( new Promise(function(resolve, reject) {
			
			const script = document.createElement('script')

			script.src = scripts[i] + '?' + version

			script.addEventListener('load', function() {
				resolve(true)
			})
			document.body.appendChild(script)
		}));
	}
	// Promise.all(ar_load).then(() => {
	// 	// page.init()
	// });

// exec DOM ready functions
	dom_ready(function(){
		setup.then(function(response){
			
			Promise.all(ar_load).then(() => {
				page.init()
			});
			
			console.log("Hello home:", response, environment.tstring.home );

			
			console.log("setup total_time ms:", performance.now()-t0);
		})
	})