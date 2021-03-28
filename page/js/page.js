"use strict"


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
* Basic page manager
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
	* Load basic data and config vars to work and call
	* proper template to render html
	* @return promise
	*/
	init : function() {
		
		const self = this

		return new Promise(function(resolve){

			// area name from url like /web_app/thesaurus -> 'thesaurus'
				self.area_name = window.location.pathname.split('/').slice(1).pop() || 'main_home';

			// template_container. DOM node defined in index.html
				const template_container = document.getElementById("template")

			// load additional basic scripts
				const scripts = [
					'./common/app_utils-min.js' // data_manager and event_manager libs
				]
				const ar_load_files = []
				for (let i = 0; i < scripts.length; i++) {

					ar_load_files.push( new Promise(function(resolve, reject) {
						
						const script	= document.createElement('script')
						script.src		= scripts[i] + '?' + environment.version
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
						console.log("--> page.init load_ts_web_data menu_data:",menu_data);
					
						// tpl building
						if (menu_data) {

							// fix menu data
								self.menu_data = menu_data

							// render tpl based on match data web_path, like 'thematic' with current 'area_name' (from url)
								self.row = self.menu_data.find(function(el){
									return el.web_path===self.area_name
								})								
								if (self.row) {
									self.render_template(template_container)
									.then(function(template_node){
										template_container.appendChild(template_node)
									})									
								}else{
									console.error("ERROR 404: page '"+self.area_name+"' is not defined! Available pages (web_path):", self.menu_data.map(el=>el.web_path) );
									template_container.innerHTML = `ERROR 404: page '${self.area_name}' is not defined! <br><br>Available pages (web_path): <br><br>` + self.menu_data.map(el=>el.web_path).join("<br>")
								}
						}else{
							template_container.innerHTML = `ERROR: no menu_data is received. Something was wrong with de API connection.<hr>Current call is: <pre>` + JSON.stringify(self.request_body, null, 2) + `</pre>`
						}

						resolve(true)
					})
				})
		})
	},//end init



	/**
	* LOAD_TS_WEB_DATA
	* Call API and get all table 'environment.table_menu' records
	* to build the site menu and base info
	* @return promise
	*	resolved : array rows | false
	*/
	load_ts_web_data : function() {

		const self = this
		
		return new Promise(function(resolve){

			// table selected columns/fields
				const ar_fields = [
					'id',
					'section_id',
					'lang',
					'menu',
					'active',
					'term_id',
					'term',
					'web_path',
					'template_name',
					'title',
					'abstract',
					'body',
					'parent',
					'childrens AS children',
					'norder',
					'image',
					'audiovisual'
				]
		
			// request body
				const request_body = {
					dedalo_get				: 'records',
					table					: environment.table_menu,
					ar_fields				: ar_fields,
					sql_filter				: environment.table_menu_filter || null,
					limit					: 0,
					count					: false,
					offset					: 0,
					order					: "norder ASC",
					resolve_portals_custom	: {
						image : 'image' // resolve image data from related table 'image' (see API info form more)
					}
				}

			// store a request_body copy only for error notification
				self.request_body = Object.assign({}, request_body)
			
			// fetch data
				data_manager.request({
					body : request_body
				})
				.then(function(response){

					// format/parse some columns data before continue
						const menu_data = self.parse_ts_web_data(response.result)

					resolve(response.result)
				})
		})	
	},//end load_ts_web_data



	/**
	* PARSE_TS_WEB_DATA
	* Parse stringnified columns and full paths
	* @param array rows
	* @return array parsed_rows
	*/
	parse_ts_web_data : function(rows) {
		
		const parsed_rows = []
		if (rows && Array.isArray(rows)) {

			for (let i = rows.length - 1; i >= 0; i--) {
				
				const row = Object.assign({}, rows[i])

				// parse stringified array
				row.children = row.children
					? JSON.parse(row.children)
					: null

				// fallback web_path when is not defined
				row.web_path = row.web_path
					? row.web_path
					: row.term_id

				// fix body text url paths for use on this website
				row.body = row.body
					? row.body.replaceAll('../../../media', environment.media_base_url+'/dedalo/media')
					: null

				parsed_rows.push(row)
			}
		}

		return parsed_rows
	},//end parse_ts_web_data



	/**
	* RENDER_TEMPLATE
	* Init and render current template adding the final result node
	* to the template_container
	* @return promise
	*/
	render_template : function(template_container) {
		
		const self = this

		return new Promise(function(resolve){

			// get template name from fixed self row
			const template_name = self.row.template_name

			// wait until template js files are ready
			self.load_template_files(template_name)
			.then(function(response){

				// select template object js by his name
				const template = window[template_name]

				// init template sending current db row data from loaded menu rows
				template.init({
					row : self.row
				})
				.then(function(response){
					// template is ready. Let's go render html
					// Note that the self template creates the common menu and lang selectors 
					// calling back to this page functions 
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
	* Load mandatory css and js files of current template
	* You need to create at least one css template file like './tpl/thematic/css/thematic.css'
	* and one js template file like './tpl/thematic/js/thematic.js'
	* We wait only to js files
	* @return promise
	*/
	load_template_files : function(template_name) {
		
		const self = this

		return new Promise(function(resolve){

			// load files to wait list
				const ar_load = []

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
				for (let i = 0; i < scripts.length; i++) {
					ar_load.push( new Promise(function(resolve) {						
						const script	= document.createElement('script')
						script.src		= scripts[i] + '?' + environment.version
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
	* RENDER_LANG_SELECTOR
	* This method is called by the templates when is needed
	* @return DOM node ul
	*/
	render_lang_selector : function() {
		
		const self = this
		
		const langs			= environment.langs
		const selected_lang	= environment.lang

		function build_li(lang_item) {

			const li_node = document.createElement("li")			

			const a_node = document.createElement("a")
			a_node.insertAdjacentHTML('afterbegin', lang_item.label)

			if (lang_item.code===selected_lang) {
				a_node.classList.add("selected")
			}
			a_node.addEventListener("click", function(e){
				e.preventDefault()
				localStorage.setItem('lang', lang_item.code)
				location.reload()
			})

			li_node.appendChild(a_node)

			return li_node
		}
		
		const fragment = new DocumentFragment()
		for (let i = 0; i < langs.length; i++) {			
			const lang_item	= langs[i]
			const li_node	= build_li(lang_item)
			fragment.appendChild(li_node)
		}

		// ul
			const ul_node = document.createElement("ul")
			ul_node.classList.add("lang_selector")
			ul_node.appendChild(fragment)


		return ul_node
	},//end render_lang_selector	



	/**
	* RENDER_MENU
	* This method is called the templates when is needed
	* @return promise
	*/
	render_menu : function() {
		
		const self = this

		const menu_data = self.menu_data
		
		function build_li(row) {
			
			// li
				const li_node = document.createElement("li")
				li_node.parent_term_id		= row.parent
				li_node.term_id				= row.term_id
				li_node.children_container	= null				

			// a
				if (row.active==='yes') {
					const a_node = document.createElement("a")
					a_node.insertAdjacentHTML('afterbegin', row.term)
					a_node.href = row.web_path
					li_node.appendChild(a_node)
				}

			// ul
				if (row.children && row.children.length>0) {
					const children_ul = document.createElement("ul")
					children_ul.classList.add("menu","icon","fa-angle-down")
					li_node.children_container = children_ul
					li_node.appendChild(children_ul)
				}

			return li_node
		}

		const fragment		= new DocumentFragment()
		const li_elements	= []
		for (let i = 0; i < menu_data.length; i++) {
			const row = menu_data[i]
			if (row.menu==='yes') {
				const li = build_li(row)
				li_elements.push(li)
				fragment.appendChild(li)
			}			
		}

		// hierarchize nodes inside fragment
			for (let i = 0; i < li_elements.length; i++) {
				const node = li_elements[i]
				if (node.parent_term_id) {
					const node_parent = li_elements.find(el => el.term_id===node.parent_term_id)
					if (node_parent && node_parent.children_container) {
						node_parent.children_container.appendChild(node)
					}
				}
			}

		// ul
			const ul_node = document.createElement("ul")
			ul_node.classList.add("menu")
			ul_node.appendChild(fragment)


		return ul_node;
	},//end render_menu



	/**
	* GET_POSTERFRAME_FROM_VIDEO
	* Useful function to resolve very used paths
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



	/**
	* OPEN_PLAYER
	* Creates and place in document.body a video player based on received options 
	* Note that var options contains subtitles base url too
	* For local development environment you need to take care about CORS
	* https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
	* @param object options
	* @return DOM node player_node
	*/
	open_player : function(options) {
		console.log("open_player options:", options);

		// options
			const data_video_items	= options.data_video_items
			const data_interview	= options.data_interview
			const term				= options.term
			const selected_key		= options.selected_key

		// url paths. Create development ready absolute paths based on environment definitions
			const video_url		= environment.media_base_url + data_video_items[selected_key].video_url
			const thumb_url		= page.get_posterframe_from_video(video_url) 
			const sublitles_url	= environment.media_base_url + data_video_items[selected_key].subtitles_url	

		// player wrapper
			const player_node = document.createElement("div")
			player_node.classList.add("player_node")
			document.body.appendChild(player_node)
			player_node.addEventListener("click", function(e){				
				video_node.remove()
				player_node.remove()
			})
		
		// close button
			const close_player = document.createElement("div")
			close_player.classList.add("close_player")
			close_player.innerHTML = 'X'			
			player_node.appendChild(close_player)		
	
		// video
			const video_node		= document.createElement("video")
			video_node.src			= video_url
			video_node.poster		= thumb_url
			video_node.controls		= true
			video_node.crossorigin	= "anonymous"
			// video_node.setAttribute("crossorigin", "anonymous") // anonymous | use-credentials
			player_node.appendChild(video_node)	
			video_node.addEventListener("click", function(e){
				e.stopPropagation()
			})	

		// subtitles. Ex. <track label="English" kind="subtitles" srclang="en" src="captions/vtt/sintel-en.vtt" default>
			const track		= document.createElement("track")
			track.label		= 'English'
			track.kind		= 'subtitles' // subtitles | captions
			track.default	= true
			track.srclang	= 'en'
			track.src		= sublitles_url
			video_node.appendChild(track)

		
		return player_node
	},//end open_player



}//end page