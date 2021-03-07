


// config. Set the site config in JSON format
	const config = {
		api_server_url		: "https://dedalo.dev/dedalo/lib/dedalo/publication/server_api/v1/json/",
		api_code			: "7Yd8jdyf_duen327!udjx",
		api_db_name			: "web_dedalo_demo_dev",
		media_base_url		: "https://dedalo.dev",
		table_menu			: "ts_web",
		table_menu_filter	: "menu='yes'",
		langs				: [{
			code	: "lg-spa",
			label	: "Español"
		},
		{
			code	: "lg-eng",
			label	: "English"
		}],
		lang_default			: "lg-eng",
		lang					: "lg-eng", // current selected lang
		thesaurus_tables		: ["ts_anthropology"],
		thesaurus_root_terms	: ["aa1_1"],
		version					: '0.0.1'
	}



// setup initial config environment
	// const setup = environment.setup(version)
	const environment = config



// load basic scripts with version control
	const scripts = [
		'./page/js/page.js',
		'./common/app_utils-min.js'
	]
	const ar_load = []
	for (let i = 0; i < scripts.length; i++) {

		ar_load.push( new Promise(function(resolve, reject) {
			
			const script = document.createElement('script')

			script.src = scripts[i] + '?' + environment.version

			script.addEventListener('load', function() {
				resolve(true)
			})
			document.head.appendChild(script)
		}));
	}
	Promise.all(ar_load).then(() => {
		page.init()
	});

// exec DOM ready functions
	// dom_ready(function(){
	// 	setup.then(function(response){
			
	// 		Promise.all(ar_load).then(() => {
	// 			page.init()
	// 		});
			
	// 		console.log("Hello home:", response, environment.tstring.home );

			
	// 		console.log("setup total_time ms:", performance.now()-t0);
	// 	})
	// })