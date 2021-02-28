/**
* page.js
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
					console.log("self.area_name:",self.area_name);			

			// load menu data
				self.load_menu_data()
				.then(function(menu_data){
						console.log("menu_data:",self.area_name, menu_data);

					// fix data
					self.menu_data = menu_data
					if (self.menu_data) {

						// reder lang_selector
							// const lang_selector_container = document.getElementById("lang_selector")
							// const lang_selector = self.render_lang_selector()
							// lang_selector_container.appendChild(lang_selector)

						// render page menu
							// const menu_container = document.getElementById("menu")
							// const menu = self.render_menu(menu_container)
							// menu_container.appendChild(menu)

						// render tpl
							self.row = self.menu_data.find(function(el){
								return el.web_path===self.area_name
							})
							console.log("self.row:",self.row);
							if (!self.row) {
								console.error("ERROR 404: page '"+area_name+"' not found! Available pages (web_path):", self.menu_data.map(el=>el.web_path) );
							}else{								
								const template_container = document.getElementById("template")
								self.render_template(template_container)
							}
						}

					resolve(true)
				})
		})
	},//end init



	/**
	* RENDER_LANG_SELECTOR
	* @return DOM DocumentFragment
	*/
	render_lang_selector : function() {
		
		const self = this

		const fragment = new DocumentFragment()

		const ul = common.create_dom_element({
			element_type	: "ul",
			class_name		: "lang_selector",
			parent			: fragment
		})

		const selected_lang = environment.lang

		for (let i = 0; i < environment.langs.length; i++) {
			
			const lang = environment.langs[i]

			const li = common.create_dom_element({
				element_type	: "li",
				parent			: ul
			})

			const a = common.create_dom_element({
				element_type	: "a",
				inner_html		: lang.label,
				class_name		: (lang.code===selected_lang) ? 'selected' : '',
				// href			: environment.base_path + '?lang=' + lang.code,
				parent			: li
			})
			a.addEventListener("click", function(e){
				e.preventDefault()

				environment.set_local_user_config({
					lang : lang.code
				})
				location.reload()
			})
		}


		return fragment
	},//end render_lang_selector



	/**
	* LOAD_MENU_DATA
	* Call API and get all table 'environment.table_menu' records
	* to buil the site menu and base info
	* @return promise
	*	resolved : array rows || false
	*/
	load_menu_data : function() {

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

				const menu_data = self.parse_menu_data(response.result)

				resolve(response.result)
			})
		})	
	},//end load_menu_data



	/**
	* PARSE_MENU_DATA
	* Parse stringnified columns and full paths
	* @param array rows
	* @return array rows
	*/
	parse_menu_data : function(rows) {
		
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
	},//end parse_menu_data



	/**
	* RENDER_MENU
	* @return promise
	*/
	render_menu : function() {
		
		const self = this

		const fragment = new DocumentFragment()	

		function build_li(row) {
			
			const li = common.create_dom_element({
				element_type	: "li",
				parent			: fragment
			})
			li.parent_term_id	= row.parent
			li.term_id			= row.term_id

			if (row.active==='yes') {
				const a = common.create_dom_element({
					element_type	: "a",
					class_name		: "",
					inner_html		: row.term,
					href			: row.web_path,
					parent			: li
				})
			}

			return li
		}

		const li_elements = []
		for (let i = 0; i < self.menu_data.length; i++) {
			
			const row = self.menu_data[i]

			if (row.term_id!==environment.menu_global_page && row.menu==='yes') {
				const li = build_li(row)
				li_elements.push(li)
			}			
		}
		
		for (let i = 0; i < fragment.childNodes.length; i++) {
			
			const li = fragment.childNodes[i]
			if (li.parent_term_id && li.parent_term_id.length>0) {

				// parent
				const parent_element = li_elements.find(function(el){
					return el.term_id===li.parent_term_id
				})
				if (parent_element) {
					const parent_ul = (parent_element.lastChild && parent_element.lastChild.tagName==='UL')
						? parent_element.lastChild
						: (function(){
							return common.create_dom_element({
								element_type	: "ul",
								class_name		: "icon solid fa-angle-down " + li.term_id,
								parent			: parent_element
							})
						  })()
					
					parent_ul.appendChild(li)
				}
			}
		}

		const ul = common.create_dom_element({
			element_type	: "ul",
			class_name		: "menu"
		})
		ul.appendChild(fragment)
		
		return ul
	},//end render_menu



	/**
	* LOAD_TEMPLATE_FILES
	* @return 
	*/
	load_template_files : function() {
		
		const self = this

		return new Promise(function(resolve){

			const template_name = self.row.template_name
				console.log("template_name:",template_name);

			// css
				const styles = [
					'./tpl/' + template_name + '/css/' + template_name + '.css'
				]
				const head  = document.getElementsByTagName('head')[0];
				for (let i = 0; i < styles.length; i++) {
					const link	= document.createElement('link')
					link.rel	= "stylesheet"
					link.type	= "text/css"
					link.href	= styles[i] + '?' + version
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

						script.src = scripts[i] + '?' + version

						script.addEventListener('load', function() {
							resolve(true)
						})
						document.body.appendChild(script)
					}));
				}

			Promise.all(ar_load).then(() => {
				resolve(true)
			});			
		})
	},//end load_template_files



	/**
	* RENDER_TEMPLATE
	* @return promise
	*/
	render_template : function(template_container) {
		
		const self = this

		return new Promise(function(resolve){

			self.load_template_files()
			.then(function(response){

				const template = window[self.row.template_name]

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
	



}//end page