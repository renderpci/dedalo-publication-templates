/**
* thematic js
*/


var thematic = {


	row		: null,
	tree	: null,

	form : null,

	// tree data without parse
	tree_raw_data : null,



	/**
	* INIT
	* @return 
	*/
	init : function(options) {

		const self = this

		// options
			self.row = options.row		

		return new Promise(function(resolve){

			// config vars
				// table. one or more thesaurus table names (array)
				self.table = environment.thesaurus_tables
				// root_term. start point/s from to iterate thesaurus list (array)
				self.root_term = environment.thesaurus_root_terms

			// request vars. optional request using GET
				self.term_id = options.term_id || null
			
			// load aditional files if needed
				// const template_name = 'thematic'
				// common.load_style( './tpl/' + template_name + '/css/' + template_name + '.css' + '?' + environment.version)

				const scripts = [
					'./common/factory/tree_factory.js'
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
					resolve(true)
				})
				

			// events subscriptions
				event_manager.subscribe('show_indexation_nodes', self.render_indexation_nodes)
				event_manager.subscribe('open_player', self.open_player)


			// resolve(true)			
		})
	},//end init



	/**
	* RENDER
	* @return DOM DocumentFragment
	*/
	render : function() {

		const self = this

		const row = self.row

		const fragment = new DocumentFragment()

		// lang selector
			const lang_selector = page.render_lang_selector()
			fragment.appendChild(lang_selector)

		// menu
			const menu = page.render_menu()
			fragment.appendChild(menu)

		// row content
			// wrapper
				const wrapper = document.createElement("div");
				wrapper.classList.add("wrapper")
				fragment.appendChild(wrapper)
			
			// title
				const title_node = document.createElement("h1");
				title_node.classList.add("title")
				title_node.insertAdjacentHTML('afterbegin', row.title)
				wrapper.appendChild(title_node)	

			// abstract
				if (row.abstract) {
					const abstract_node = document.createElement("div");
					abstract_node.classList.add("abstract")
					abstract_node.insertAdjacentHTML('afterbegin', row.abstract)
					wrapper.appendChild(abstract_node)	
				}
			
			// body
				if (row.body) {
					const body_node = document.createElement("div");
					body_node.classList.add("body")
					body_node.insertAdjacentHTML('afterbegin', row.body)
					wrapper.appendChild(body_node)
				}

		// form. Create DOM form
			self.form = self.render_form()
			fragment.appendChild(self.form)	

		// tree. load tree data and render tree nodes
			self.rows_list_node = document.createElement("div")
			self.rows_list_node.classList.add("rows_list_node")
			fragment.appendChild(self.rows_list_node)			
			
			self.load_tree_data({})
			.then(function(rows){				
				// tree factory
				self.render_tree_data({
					rows		: rows,
					set_hilite	: (self.term_id && self.term_id.length>0)
				})			
				.then(function(){
				
				})
			})
		
		
		return fragment
	},//end render



	/**
	* RENDER_TREE_DATA
	* @return promise
	*/
	render_tree_data : function(options) {
		// console.log("-> render_tree_data options:",options);
		
		const self = this

		// options
			const rows 		 = options.rows
			const set_hilite = options.set_hilite || false
		
		return new Promise(function(resolve){

			const hilite_terms = self.term_id
				? [self.term_id]
				: null
			const parsed_data = self.parse_tree_data(rows, hilite_terms) // prepares data to use in list
					
			// tree factory			
			self.tree = self.tree || new tree_factory() // creates / get existing instance of tree
			self.tree.init({
				target		: self.rows_list_node,
				data		: parsed_data,
				root_term	: self.root_term,
				set_hilite	: set_hilite,
				caller		: self
			})
			self.tree.render()
			.then(function(){
				resolve(true)
			})
		})
	},//end render_tree_data



	/**
	* LOAD_TREE_DATA
	* Call to API and load json data results of search
	*/
	load_tree_data : function() {

		const self = this

		return new Promise(function(resolve){
					
			// data is calculated once
				if (self.tree_raw_data && self.tree_raw_data.length>0) {
					// console.log("-> load_tree_data. Returned already calculated tree self.tree_raw_data:", self.tree_raw_data);
					const data = JSON.parse( JSON.stringify(self.tree_raw_data) );
					resolve(data)
					return
				}			

			// request
				const body = {
					dedalo_get	: 'records',
					table		: self.table,
					ar_fields	: ['*'],
					sql_filter	: null,
					limit		: 0,
					count		: false,
					order		: 'norder ASC'
				}
				data_manager.request({
					body : body
				})
				.then(function(response){
					console.log("load_tree_data response:",response);

					if (response.result) {

						const ar_rows = response.result

						// fix raw data to recover it later
							self.tree_raw_data = ar_rows					

						resolve(ar_rows)
					
					}else{

						console.warn("Emty data from tree:", response);
						resolve([])
					}
				})
		})
	},//end load_tree_data



	/**
	* PARSE_TREE_DATA
	* Parse rows data to use in tree_factory
	*/
	parse_tree_data : function(ar_rows_raw) {

		const self = this

		const ar_rows = JSON.parse( JSON.stringify(ar_rows_raw) )

		const data = []

		// sample 
			// childrens: "[{"type":"dd48","section_id":"2","section_tipo":"technique1","from_component_tipo":"hierarchy49"},{"type":"dd48","section_id":"3","section_tipo":"technique1","from_component_tipo":"hierarchy49"}]"
			// code: "1191026"
			// descriptor: "yes"
			// illustration: null
			// indexation: null
			// model: null
			// norder: "0"
			// parent: "["hierarchy1_273"]"
			// related: ""
			// scope_note: "En el presente Tesauro el empleo del término es más restrictivo, ya que se aplica a los procedimientos técnicos empleados en la elaboración de bienes culturales."
			// section_id: "1"
			// space: "{"alt":16,"lat":"39.462571","lon":"-0.376295","zoom":12}"
			// table: "ts_technique,ts_material"
			// term: "Técnica"
			// term_id: "technique1_1"
			// time: null
			// tld: "technique1"

		const hilite_terms	= self.term_id
			? [self.term_id]
			: null
	
		const ar_parse = ['parent','childrens','space','indexation']
		function decode_field(field) {
			if (field) {
				return JSON.parse(field)
			}
			return null;
		}
		function parse_item(item){
			for (let i = ar_parse.length - 1; i >= 0; i--) {
				const name = ar_parse[i]
				item[name] = decode_field(item[name])
			}
			return item
		}

		const ar_rows_length = ar_rows.length
		for (let i = 0; i < ar_rows_length; i++) {
			
			// parse json encoded strings
			const item = parse_item(ar_rows[i])
						
			data.push(item)
		}

		const term_id_to_remove = []
		
		// update_children_data recursive
			function update_children_data(data, row){
				
				if ((!row.childrens || row.childrens.length===0) && (!row.indexation || row.indexation.length===0)) {

					if (!row.parent) {
						console.warn("parent not found for row:", row.term_id, row.term, row);
						return true
					}

					const parent_term_id	= row.parent[0]
					const parent_row		= data.find(item => item.term_id===parent_term_id)
					if (parent_row) {
						
						const child_key = parent_row.childrens.findIndex(el => el.section_tipo===row.tld && el.section_id===row.section_id)
						// console.log("child_key:",child_key, row.term_id, row);
						if (child_key!==-1) {
							
							// remove me as child
							parent_row.childrens.splice(child_key, 1)

							// recursion with parent
							update_children_data(data, parent_row)
						}
					}
					// set to remove
					term_id_to_remove.push(row.term_id)
				}

				return true
			}

		// remove unused terms
			const data_length = ar_rows_length
			// for (let i = 0; i < data_length; i++) {
			for (let i = data_length - 1; i >= 0; i--) {				

				const row = data[i]

				const parent_term_id = (row.parent && row.parent[0]) ? row.parent[0] : false
				if (!parent_term_id) {
					console.warn("Ignored undefined parent_term_id:", row.term_id, row.term, row);
					// set to remove
					term_id_to_remove.push(row.term_id)
					continue
				}

				// update children data
				update_children_data(data, row)				
			}

		// remove unused terms
			const data_clean = data.filter(el => term_id_to_remove.indexOf(el.term_id)===-1);
		
		// open hilite parent terms (recursive)			
			for (let i = 0; i < data_clean.length; i++) {
				const row = data_clean[i]
				
				// hilite_terms (ussually one term from user request url like /thesaurus/technique1_1)
					if (hilite_terms && hilite_terms.indexOf(row.term_id)!==-1) {
						row.hilite = true
					}
				
				if (row.hilite===true) {
					set_status_as_opened(data_clean, row, false)
				}
			}
			function set_status_as_opened(data_clean, row, recursion) {
				const parent_term_id	= row.parent[0]
				const parent_row		= data_clean.find(item => item.term_id===parent_term_id)
				if (parent_row) {
					parent_row.status = "opened"
					set_status_as_opened(data_clean, parent_row, true)
				}
			}
		
		// debug
			// if(SHOW_DEBUG===true) {
			// 	console.log("// parse_tree_data data_clean:", data_clean);
			// }

		return data_clean
	},// end parse_tree_data



	/**
	* RENDER_FORM
	* @return DOM node from
	*/
	render_form : function() {
		
		const self = this

		// form
			const form_node = document.createElement("form");
			form_node.type = "form"
					
		// term_input_search
			const term_input_search = document.createElement("input");
			term_input_search.id	= "term"
			term_input_search.name	= "term"
			form_node.appendChild(term_input_search)
		
		// submit button
			const submit_button = document.createElement("input");
			submit_button.type = "submit"
			submit_button.value = "Search"
			submit_button.classList.add("form-group","field")
			submit_button.addEventListener("click",function(e){
				e.preventDefault()
				self.form_submit()
			})
			form_node.appendChild(submit_button)

	
		return form_node
	},//end render_form



	/**
	* FORM_SUBMIT
	* Form submit launch search
	*/
	form_submit : function() {
		
		const self = this

		const term_input = self.form.querySelector('#term')
		
		// search rows exec against API
			const js_promise = self.search_rows({
				q			: term_input.value,
				q_column	: 'term',
			})
			.then((response)=>{
				
				const to_hilite = response.result.map(el => el.value)

				// remove self.term_id to avoid hilite it again
					self.term_id = null

				// rows_list_node
					const rows_list_node = self.rows_list_node
					while (rows_list_node.hasChildNodes()) {
						rows_list_node.removeChild(rows_list_node.lastChild);
					}					

				// load_tree_data
					self.load_tree_data({})
					.then(function(response){
						
						const data = response

						// const rows = response.result
						const rows = data.map(function(row){
							if (to_hilite.indexOf(row.term_id)!==-1) {
								row.hilite	= true
								row.status	= "closed"
							}
							return row
						})
						
						// render_tree_data						
							self.render_tree_data({
								rows		: rows,
								set_hilite	: true
							})
							.then(function(){
								
							})
					})					
			})		


		return js_promise
	},//end form_submit



	/**
	* SEARCH_ROWS
	* @return promise
	*	resolve array of objects
	*/
	search_rows : function(options) {
		
		const self = this

		return new Promise(function(resolve){
			
			// options
				const q			= options.q
				const q_column	= options.q_column	

			const data = self.tree_raw_data

			// find_text
				function find_text(row) {

					let find = false

					// q try
						if (q && q.length>0) {

							// remove accents from text
							const text_normalized = row[q_column].normalize("NFD").replace(/[\u0300-\u036f]/g, "")
							
							const regex	= RegExp(q, 'i')
							find = regex.test(text_normalized)
						}					

					return find
				}

			// found filter
				const found = data.filter(find_text)	

			// result . Format result array to allow autocomplete to manage it
				const result = found.map(item => {

					// parent info (for desambiguation)
						const parent_term_id	= item.parent[0]
						const parent_row		= data.find(el => el.term_id===parent_term_id)
						const parent_label		= parent_row ? (" (" + parent_row.term +")") : ''

					const label = item.term + parent_label

					const element = {
						label	: label,
						value	: item.term_id
					}
					return element
				})

			// response. Format like a regular database result from API
				const response = {
					result	: result
				}

			resolve(response)
		})
	},//end search_rows



	/**
	* RENDER_INDEXATION_NODES
	* Called from tree_factory
	* @return promise
	*/
	render_indexation_nodes : function(options) {
		console.log("-- render_indexation_nodes options:",options);		

		// options
			const row					= options.row
			const indexation_container	= options.indexation_container
			const self					= options.instance.caller
		
		return new Promise(function(resolve){
		
			if (!row.indexation || row.indexation.length<1) {
				resolve(false)
				return
			}

			// get fragments
				self.get_indexation_data(row.indexation)
				.then(function(response){
					// console.log("-- row.indexation:",row.indexation);
					// console.log("-- get_indexation_data response:",response);

					const data_indexation	= response.data_indexation
					const data_interview	= response.data_interview

					// group by interview section_id
						const groups = data_indexation.reduce(function (r, a) {
							const interview_section_id = a.index_locator.section_top_id
							r[interview_section_id] = r[interview_section_id] || [];
							r[interview_section_id].push(a);
							return r;
						}, Object.create(null));

					// iterate groups
						for(const section_top_id in groups){
												
							const data_video_items		= groups[section_top_id]
							const relation_item_promise	= self.build_indexation_item({
								data_video_items	: data_video_items,
								data_interview		: data_interview,
								term				: row.term,
								parent				: indexation_container
							})
						}

					// // draw nodes
						// const indexation_item_promises = []
						// for (let i = 0; i < row.indexation.length; i++) {

						// 	if (response.result[i]!==undefined) {

						// 		const relation_item_promise = self.build_indexation_item({
						// 			indexation	: row.indexation[i],
						// 			data		: response.result[i],
						// 			parent		: indexation_container								
						// 		})
						// 		indexation_item_promises.push(relation_item_promise)
						// 	}
						// }

					resolve(true)
				})
		})
	},//end render_indexation_nodes	



	/**
	* GET_INDEXATION_DATA
	* Call API (combi call) to obtain fragments from given indexations and interview data
	* @param array indexations
	* @return promise
	*/
	get_indexation_data : function(indexations) {

		return new Promise(function(resolve){		
			
			const lang = environment.WEB_CURRENT_LANG_CODE

			const ar_calls = []

			// indexations data
				const resolved = []
				const indexations_length = indexations.length
				for (let i = 0; i < indexations_length; i++) {
					
					const index_locator = indexations[i]

					ar_calls.push({
						id		: 'indexation',
						options	: {
							dedalo_get		: "fragment_from_index_locator",
							index_locator	: index_locator,
							lang			: lang
						}
					})
				}

			// interview data
				const interview_section_id = parseInt(indexations[0].section_top_id);
				ar_calls.push({
					id		: 'interview',
					options	: {
						dedalo_get				: 'records',
						table					: 'interview',
						ar_fields				: ['section_id','code','abstract','date','audiovisual','informant','images','project'],
						lang					: lang,
						sql_filter				: 'section_id='+interview_section_id,
						limit					: 1,
						count					: false,
						resolve_portals_custom	: {
							informant	: 'informant'
						}
					}
				})

			
			// request
				data_manager.request({
					body : {
						dedalo_get	: 'combi',
						ar_calls	: ar_calls
					}
				})
				.then(function(response){

					const result = {
						data_interview	: response.result.find(el => el.id==='interview').result[0],
						data_indexation	: []
					}

					for (let i = 0; i < response.result.length; i++) {
						if (response.result[i].id==='indexation') {
							
							const item = response.result[i].result
							if (!item.video_url) {
								console.warn("Ignored invalid item without video_url:", item);
								continue;
							}

							item.type			= 'fragment'
							item.section_id		= item.index_locator.section_id
							item.transcription	= item.fragm
							delete item.fragm
							
							// item.video_url = common.get_media_engine_url(item.video_url.split("/").pop(), 'av', null, true)
						
							result.data_indexation.push(item)
						}					
					}


					resolve(result)
				})
		})
	},//end get_indexation_data



	/**
	* BUILD_INDEXATION_ITEM
	* Build and append indexation_item to options parent element
	* @return promise
	*/
	build_indexation_item : function(options) {
		
		const self = this

		return new Promise(function(resolve){
					
			const parent			= options.parent
			const data_video_items	= options.data_video_items
			const data_interview	= options.data_interview
			const term				= options.term
			
			const av_section_id = data_video_items[0].section_id

			const indexation_item = document.createElement("div")
			indexation_item.classList.add("indexation_item")
			parent.appendChild(indexation_item)

			// img
				const video_url = environment.media_base_url + data_video_items[0].video_url
				const thumb_url = page.get_posterframe_from_video(video_url)
								
				const image_node = document.createElement("img")
				image_node.classList.add("image_indexation_item")
				image_node.src = thumb_url
				image_node.addEventListener("click", function(e){
					event_manager.publish('open_player', {
						mode				: 'indexation', // indexation | tapes
						data_interview		: data_interview,
						data_video_items	: data_video_items,
						term				: term,
						selected_key		: 0
					})
				})
				indexation_item.appendChild(image_node)			
		})
	},//end build_indexation_item



	/**
	* OPEN_PLAYER
	* @return DOM node player_node
	*/
	open_player : function(options) {

		// options
			const data_video_items	= options.data_video_items
			const data_interview	= options.data_interview
			const term				= options.term
			const selected_key		= options.selected_key

		const player_node = document.createElement("div")
		player_node.classList.add("player_node")
		document.body.appendChild(player_node)
		
		const close_player = document.createElement("div")
		close_player.classList.add("close_player")
		close_player.innerHTML = 'X'
		close_player.addEventListener("click", function(e){
			video_node.remove()
			player_node.remove()
		})
		player_node.appendChild(close_player)

		const video_url = environment.media_base_url + data_video_items[selected_key].video_url
		const thumb_url = page.get_posterframe_from_video(video_url) 
		
		const video_node	= document.createElement("video")
		video_node.src		= video_url
		video_node.poster	= thumb_url
		video_node.controls	= true
		player_node.appendChild(video_node)

		
		return player_node
	},//end open_player




}//end thematic