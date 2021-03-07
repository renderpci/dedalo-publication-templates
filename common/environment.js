/**
* ENVIRONMENT
*/
var environment = {

	// version (from boot.js)
	version : null,

	// config.json file vars
	langs				: [],
	lang				: null,
	api_code			: null,
	api_db_name			: null,
	api_server_url		: null,
	table_menu			: null,
	table_menu_filter	: null,

	// lg-mylang.json file vars
	// tstring . Object with all website label strings in current lang (filled from file /lang/mylang.json)
	tstring : null,

	// local_user_config. Config object from user browser local storage (selected lang, etc.)
	local_user_config : null,

	base_path : null,

	


	/**
	* SETUP
	* @return 
	*/
	setup : function(version) {
		
		const self = this

		self.version = version

		self.base_path = './'

		const promise_loading_config_files = self.load_config()

		return promise_loading_config_files
	},//end setup




	/**
	* LOAD_CONFIG
	* @return 
	*/
	load_config : function() {

		const self = this

		return new Promise(function(resolve){

			// load user localStorage vars from browser
			self.set_local_user_config()
			
			// fetch config file
				const promise_load_config = new Promise(function(resolve){
					
					const config_file_path = self.base_path + '/config/config.json'
					fetch(config_file_path)
						.then(response => response.json())
						.then(function(json){
								console.log("json:",json);
							// parse file
							
							// lang. current selected lang for this website data
							self.lang = (self.local_user_config.lang)
								? self.local_user_config.lang
								: (function(){
									// fix lang here
									console.warn("fixing lang lang_default:", json.lang_default);
									self.set_local_user_config({
										lang : json.lang_default
									})
									return json.lang_default
								  })()

							// available langs for current website
							self.langs	= json.langs
							// api code (must be identical to serer api code to be accepted)
							self.api_code = json.api_code
							// db_name. database name where we want to load data
							self.api_db_name = json.api_db_name
							// api_server_url. server source data url
							self.api_server_url = json.api_server_url
							// table_menu. Name of the basic web table like 'web_ts'
							self.table_menu = json.table_menu		
							// table_menu_filter
							self.table_menu_filter = json.table_menu_filter
							// menu_global_page. term_id of thesaurus web global page like "ww_1"
							self.menu_global_page = json.menu_global_page
							// thesaurus_tables
							self.thesaurus_tables = json.thesaurus_tables
							// thesaurus_root_terms
							self.thesaurus_root_terms = json.thesaurus_root_terms			
							
							resolve(true)
						});
				})

			// fetch lang file
				const promise_load_lang = new Promise(function(resolve){

					// self.lang = 'lg-eng'
					if (self.local_user_config.lang) {
						self.lang = self.local_user_config.lang
					}

					const promise_lang = (self.lang)
						? (function(){
							console.warn("lang is already fixed :",self.lang);
							return new Promise(function(resolve){ resolve(true) })
						  })()
						: (function(){							
							return promise_load_config
						  })()
					
					promise_lang.then(function(response){
						
						const lang_file_path = self.base_path + '/lang/' + self.lang + '.json'
						try {
							fetch(lang_file_path)							
								.then(response => response.json())
								.then(function(json){
									if (json) {
										self.tstring = tstring =  json
									}else{
										console.log("Error. File "+lang_file_path+" is not a valid json file", json);
									}
									resolve(true)
								});
						}catch(error){
							console.error("error:",error);
							resolve(false)
						}					
					})
				})

			Promise.all([promise_load_config, promise_load_lang]).then((values) => {
				resolve(true)
			});
		})
	},//end load_config



	/**
	* SET_local_user_CONFIG
	* @param options object (optional)
	* @return 
	*/
	set_local_user_config : function(options) {

		const self = this
		
		// cookie
		const local_user_config = localStorage.getItem('local_user_config');
		if (local_user_config) {
			// use existing one
			self.local_user_config = JSON.parse(local_user_config)
			console.log("--> self.local_user_config 1 (already exists):", self.local_user_config);
		}else{
			// create a new one
			const local_user_config = {}
			localStorage.setItem('local_user_config', JSON.stringify(local_user_config));
			self.local_user_config = local_user_config
			console.log("--> self.local_user_config 2 (create new one):",self.local_user_config);
		}

		if (options) {
			for(const key in options) {
				self.local_user_config[key] = options[key]
			}
			localStorage.setItem('local_user_config', JSON.stringify(self.local_user_config));
		}
		
		// console.log("--> self.local_user_config [final]:", self.local_user_config);

		return self.local_user_config
	},//end set_local_user_config




}//end environment



function dom_ready(fn) {
  if (document.readyState!=='loading'){
	fn();
  }else{
	document.addEventListener('DOMContentLoaded', fn);
  }
}