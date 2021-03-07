


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
		thesaurus_tables		: ["ts_anthropology"],
		thesaurus_root_terms	: ["aa1_1"],
		version					: '0.0.1'
	}



// setup initial config environment
	const environment = config
	// get and set user selected lang from localStorage if exists
	environment.lang = localStorage.getItem('lang') || environment.lang_default



/**
* PAGE.JS
*/
var page = {


	/**
	* VARS
	*/
		page_title	: null,
		menu_data	: null,
		row			: null,
		area_name	: null,



	/**
	* INIT
	* @return 
	*/
	init : function() {
		
		const self = this

		return new Promise(function(resolve){

			// area name from url like /web_app/thesaurus -> 'thesaurus'
				self.area_name = window.location.pathname.split('/').slice(1).pop() || 'main_home';

			const template_container = document.getElementById("template")

			// load additional basic scripts
				const scripts = [
					'./common/app_utils-min.js'
				]
				const ar_load_files = []
				for (let i = 0; i < scripts.length; i++) {

					ar_load_files.push( new Promise(function(resolve, reject) {
						
						const script = document.createElement('script')

						script.src = scripts[i] + '?' + environment.version

						script.addEventListener('load', function() {
							resolve(true)
						})
						document.head.appendChild(script)
					}));
				}			
				Promise.all(ar_load_files).then(function() {
					
					// load ts_web data
					self.load_ts_web_data()
					.then(function(menu_data){

						// fix data
						self.menu_data = menu_data

						// tpl
						if (self.menu_data) {

							// render tpl
								self.row = self.menu_data.find(function(el){
									return el.web_path===self.area_name
								})								
								if (!self.row) {
									console.error("ERROR 404: page '"+area_name+"' not found! Available pages (web_path):", self.menu_data.map(el=>el.web_path) );
								}else{									
									self.render_template(template_container)
									.then(function(template_node){										
										template_container.appendChild(template_node)
									})
								}
						}

						resolve(true)
					})
				})
		})
	},//end init



	/**
	* RENDER_LANG_SELECTOR
	* @return DOM DocumentFragment
	*/
	render_lang_selector : function() {
		
		const self = this
		
		const langs			= environment.langs
		const selected_lang	= environment.lang

		// ul
			const ul_node = document.createElement("ul")
			ul_node.classList.add("lang_selector")
		
		for (let i = 0; i < langs.length; i++) {
			
			const lang = langs[i]

			const li_node = document.createElement("li")
			ul_node.appendChild(li_node)

			const a_node = document.createElement("a")
			a_node.insertAdjacentHTML('afterbegin', lang.label)

			if (lang.code===selected_lang) {
				a_node.classList.add("selected")
			}
			a_node.addEventListener("click", function(e){
				e.preventDefault()
				localStorage.setItem('lang', lang.code)
				location.reload()
			})

			li_node.appendChild(a_node)
		}


		return ul_node
	},//end render_lang_selector



	/**
	* LOAD_TS_WEB_DATA
	* Call API and get all table 'environment.table_menu' records
	* to buil the site menu and base info
	* @return promise
	*	resolved : array rows || false
	*/
	load_ts_web_data : function() {

		const self = this
		
		return new Promise(function(resolve){
		
			// request
			const request_body = {
				dedalo_get		: 'records',
				table			: environment.table_menu,
				ar_fields		: ['*'],
				sql_filter		: environment.table_menu_filter || null,
				limit			: 0,
				count			: false,
				offset			: 0,
				order			: "norder ASC"
			}
			data_manager.request({
				body : request_body
			})
			.then(function(response){

				const menu_data = self.parse_ts_web_data(response.result)

				resolve(response.result)
			})
		})	
	},//end load_ts_web_data



	/**
	* PARSE_TS_WEB_DATA
	* Parse stringnified columns and full paths
	* @param array rows
	* @return array rows
	*/
	parse_ts_web_data : function(rows) {
		
		if (rows) {

			for (let i = rows.length - 1; i >= 0; i--) {
				
				const row = rows[i]

				row.children = row.children
					? JSON.parse(row.children)
					: null

				row.web_path = row.web_path
					? row.web_path
					: row.term_id

			}
		}

		return rows
	},//end parse_ts_web_data



	/**
	* RENDER_MENU
	* @return promise
	*/
	render_menu : function() {
		
		const self = this

		// ul
			const ul_node = document.createElement("ul")
			ul_node.classList.add("menu")

		function build_li(row) {

			const li_node = document.createElement("li")
			li_node.parent_term_id	= row.parent
			li_node.term_id			= row.term_id
			ul_node.appendChild(li_node)			

			if (row.active==='yes') {
				const a_node = document.createElement("a")
				a_node.insertAdjacentHTML('afterbegin', row.term)
				a_node.href = row.web_path
				li_node.appendChild(a_node)
			}

			return li_node
		}

		const li_elements = []
		for (let i = 0; i < self.menu_data.length; i++) {
			
			const row = self.menu_data[i]

			if (row.menu==='yes') {
				const li = build_li(row)
				li_elements.push(li)
			}			
		}
		
		// for (let i = 0; i < fragment.childNodes.length; i++) {
		for (let i = 0; i < ul_node.childNodes.length; i++) {
			
			const li = ul_node.childNodes[i]
			if (li.parent_term_id && li.parent_term_id.length>0) {

				// parent
				const parent_element = li_elements.find(function(el){
					return el.term_id===li.parent_term_id
				})
				if (parent_element) {
					const parent_ul = (parent_element.lastChild && parent_element.lastChild.tagName==='UL')
						? parent_element.lastChild
						: (function(){
							
							const ul_inside_node = document.createElement("ul")
							ul_inside_node.classList.add("menu","icon","fa-angle-down")
							parent_element.appendChild(ul_inside_node)

							return ul_inside_node
						  })()
					
					parent_ul.appendChild(li)
				}
			}
		}

		// const ul = common.create_dom_element({
		// 	element_type	: "ul",
		// 	class_name		: "menu"
		// })
		// ul.appendChild(fragment)
		
		return ul_node
	},//end render_menu	



	/**
	* RENDER_TEMPLATE
	* @return promise
	*/
	render_template : function(template_container) {
		
		const self = this

		return new Promise(function(resolve){

			const template_name = self.row.template_name

			self.load_template_files(template_name)
			.then(function(response){

				const template = window[template_name]

				template.init({
					row : self.row
				})
				.then(function(response){
					
					const template_node = template.render()
					if (template_node) {
						template_container.appendChild(template_node)
					}					
					resolve(template_node)
				})								
			})
		})
	},//end render_template
	


	/**
	* LOAD_TEMPLATE_FILES
	* @return promise
	*/
	load_template_files : function(template_name) {
		
		const self = this

		return new Promise(function(resolve){

			// css
				const styles = [
					'./tpl/' + template_name + '/css/' + template_name + '.css'
				]
				const head  = document.getElementsByTagName('head')[0];
				for (let i = 0; i < styles.length; i++) {
					const link	= document.createElement('link')
					link.rel	= "stylesheet"
					link.type	= "text/css"
					link.href	= styles[i] + '?' + environment.version
					head.appendChild(link)
				}

			// js
				const scripts = [
					'./tpl/' + template_name + '/js/' + template_name + '.js'
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
				resolve(true)
			});			
		})
	},//end load_template_files



	/**
	* GET_POSTERFRAME_FROM_VIDEO
	* Resolve posterframe url from video url replacing path and suffix
	*/
	get_posterframe_from_video : function(video_url) {

		let posterframe_url = video_url
			posterframe_url = posterframe_url.replace(/\/404\//g, '/posterframe/')
			posterframe_url = posterframe_url.replace(/\.mp4/g, '.jpg')

		const ar_parts = posterframe_url.split("?")
			if (typeof ar_parts[0]!=="undefined") {
				posterframe_url = ar_parts[0]
			}

		return posterframe_url
	},//end get_posterframe_from_video



}//end page