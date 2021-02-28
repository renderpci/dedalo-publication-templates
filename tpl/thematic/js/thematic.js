/**
* thematic js
*/


var thematic = {


	row		: null,
	tree	: null,
	form	: null,



	/**
	* INIT
	* @return 
	*/
	init : function(options) {
		console.log("thematic init options:",options);

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
				
				common.load_script('./common/factory/tree_factory.js'  + '?' + environment.version)
				common.load_script('./common/factory/form_factory.js'  + '?' + environment.version)
				.then(function(response){
					resolve(true)
				})				

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

		const wrapper = common.create_dom_element({
			element_type	: "div",
			class_name		: "wrapper",
			parent			: fragment
		})

		const title = common.create_dom_element({
			element_type	: "h1",
			class_name		: "title",
			inner_html		: row.title,
			parent			: wrapper
		})

		if (row.abstract) {
			const body = common.create_dom_element({
				element_type	: "div",
				class_name		: "abstract",
				inner_html		: row.abstract,
				parent			: wrapper
			})
		}

		// form. Create DOM form
			const form = self.render_form()
			fragment.appendChild(form)	

		// tree. load tree data and render tree nodes
			self.rows_list_node = common.create_dom_element({
				element_type	: "div",
				class_name		: "rows_list_node",
				parent			: fragment
			})
			self.load_tree_data({})
			.then(function(data_clean){
				if(SHOW_DEBUG===true) {
					console.log("-> set_up load_tree_data data_clean:", data_clean);
				}				
				// tree factory
				self.render_tree_data({
					rows		: data_clean,
					set_hilite	: (self.term_id && self.term_id.length>0)
				})			
				.then(function(){
					// spinner.remove()
				})
			})
		
		
		return fragment
	},//end render



	/**
	* RENDER_TREE_DATA
	* @return promise
	*/
	render_tree_data : function(options) {

		const self = this

		// options
			const rows 		 = options.rows
			const set_hilite = options.set_hilite || false
		
		return new Promise(function(resolve){
		
			// tree factory			
			self.tree = self.tree || new tree_factory() // creates / get existing instance of tree
			self.tree.init({
				target		: self.rows_list_node,
				data		: rows,
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
	load_tree_data : function(options) {

		const self = this

		return new Promise(function(resolve){

			if (self.data_clean && self.data_clean.length>0) {
				resolve(self.data_clean)
			}

			// fields
				// const default_fields = [
				// 	'childrens',
				// 	'code',
				// 	'dd_relations',
				// 	'descriptor',
				// 	'illustration',
				// 	'indexation',
				// 	'model',
				// 	'norder',
				// 	'parent',
				// 	'related',
				// 	'scope_note',
				// 	'section_id',
				// 	'space',
				// 	'term',
				// 	'term_id',
				// 	'time',
				// 	'tld',
				// 	// 'relations'
				// ]

			// options
				const sql_filter	= options.sql_filter || false // used by memory only
				const filter		= options.filter || null // used by from
				const ar_fields		= ["*"]
				const order			= "norder ASC"			
				const table			= self.table
			
			// parse_sql_filter
				const group = []
				const parse_sql_filter = function(filter){

					if (filter) {
						
						const op		= Object.keys(filter)[0]
						const ar_query	= filter[op]
						
						const ar_filter = []
						const ar_query_length = ar_query.length
						for (let i = 0; i < ar_query_length; i++) {
							
							const item = ar_query[i]

							const item_op = Object.keys(item)[0]
							if(item_op==="AND" || item_op==="OR") {

								const current_filter_line = "(" + parse_sql_filter(item) + ")"
								ar_filter.push(current_filter_line)
								continue;
							}

							const filter_line = (item.field.indexOf("AS")!==-1)
								? "" +item.field+""  +" "+ item.op +" "+ item.value
								: "`"+item.field+"`" +" "+ item.op +" "+ item.value

							ar_filter.push(filter_line)

							// group
								if (item.group) {
									group.push(item.group)
								}
						}
						return ar_filter.join(" "+op+" ")
					}

					return null
				}

			// parsed_filters
				const final_sql_filter = sql_filter
					? sql_filter // case memory
					: parse_sql_filter(filter) // case form search

			// debug
				if(SHOW_DEBUG===true) {
					// console.log("--- load_tree_data parsed sql_filter:")
					// console.log(sql_filter)
				}

			// request
				const body = {
					dedalo_get	: 'records',
					table		: table,
					ar_fields	: ar_fields,
					sql_filter	: final_sql_filter,
					limit		: 0,
					count		: false,
					order		: order
				}
				data_manager.request({
					body : body
				})
				.then(function(response){
						console.log("response:",response);
					
					const data_clean = response.result
						? self.parse_tree_data(response.result)
						: null

					// fix data_clean
					self.data_clean = data_clean

					resolve(data_clean)
				})
		})
	},//end load_tree_data



	/**
	* PARSE_TREE_DATA
	* Parse rows data to use in tree_factory
	*/
	parse_tree_data : function(ar_rows) {

		const self = this

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

		const fragment = new DocumentFragment()
		
		// form_factory instance
			self.form = self.form || new form_factory()
			
		// inputs		

			// global_search
				const global_search_container = common.create_dom_element({
					element_type	: "div",
					class_name		: "global_search_container form-row fields",
					parent			: fragment
				})
				// input global search
					self.form.item_factory({
						id				: "term",
						name			: "term",
						label			: tstring.term || "Term",
						q_column		: "term",
						eq				: "LIKE",
						eq_in			: "%",
						eq_out			: "%",
						parent			: global_search_container,
						callback		: function(node_input) {
							// self.activate_autocomplete(node_input) // node_input is the form_item.node_input
						}					
					})			
		
		// submit button
			const submit_group = common.create_dom_element({
				element_type	: "div",
				class_name 		: "form-group field",
				parent 			: fragment
			})
			const submit_button = common.create_dom_element({
				element_type	: "input",
				type 			: "submit",
				id 				: "submit",
				value 			: tstring["buscar"] || "Search",
				class_name 		: "btn btn-light btn-block primary",
				parent 			: submit_group
			})
			submit_button.addEventListener("click",function(e){
				e.preventDefault()
				self.form_submit()
			})

		
		// form_node
			self.form.node = common.create_dom_element({
				element_type	: "form",
				id				: "search_form",
				class_name		: "form-inline"
			})
			self.form.node.appendChild(fragment)

		
		
		return self.form.node
	},//end render_form



	/**
	* FORM_SUBMIT
	* Form submit launch search
	*/
	form_submit : function() {
		
		const self = this

		// filter. Is built looking at form input values
			// const filter = self.build_filter()
			const form_items	= self.form.form_items
			const form_item		= form_items.term
				console.log("form_items:",form_items);
				console.log("form_item:",form_item);			
			
		// search rows exec against API
			const js_promise = self.search_rows({
				q			: form_item.q,
				q_column	: form_item.q_column,
				q_selected	: form_item.q_selected,
				limit		: 0
			})
			.then((response)=>{

				// debug
					if(SHOW_DEBUG===true) {
						console.log("--- form_submit response:",response);
					}

				const to_hilite = response.result.map(el => el.value)

				// remove self.term_id to avoid hilite again
					self.term_id = null


				// rows_list_node
					const rows_list_node = self.rows_list_node
					while (rows_list_node.hasChildNodes()) {
						rows_list_node.removeChild(rows_list_node.lastChild);
					}
					// add spinner
						const spinner	= common.create_dom_element({
							element_type	: "div",
							id				: "spinner",
							class_name		: "spinner",
							parent			: rows_list_node
						})

				// load_tree_data
					self.load_tree_data({})
					.then(function(response){
						console.log("/// load_tree_data response:",response);
						// console.log("to_hilite:",to_hilite);
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
								spinner.remove()
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
		if(SHOW_DEBUG===true) {
			console.log("----> search_rows options:",options);
		}		

		const self = this

		return new Promise(function(resolve){
			const t0 = performance.now()			
	
			const q				= options.q
			const q_column		= options.q_column
			const q_selected	= options.q_selected || null
			const limit			= options.limit

			// data . Simplifies data format (allways on data_clean)
			const data = self.data_clean.map(item => {
				const element = {
					term		: item.term,
					scope_note	: item.scope_note,
					parent		: item.parent,
					term_id		: item.term_id
				}
				return element
			})			

			// find_text
				var counter = 1
				function find_text(row) {

					if (limit>0 && counter>limit) {
						return false
					}

					let find = false

					// q try
						if (q && q.length>0) {

							// remove accents from text
							const text_normalized = row[q_column].normalize("NFD").replace(/[\u0300-\u036f]/g, "")
							
							const regex	= RegExp(q, 'i')
							find = regex.test(text_normalized)
						}
					
					// q_selected try. Check user selections from autocomplete
						if (!find && q_selected) {
							for (let i = 0; i < q_selected.length; i++) {
								if(row.term_id===q_selected[i]) {
									find = true
									break;
								}
							}
						}

					if (find===true) {
						counter++;
					}

					return find
				}

			// found filter
				const found = data.filter(find_text)	

			// result . Format result array to allow autocomplete to manage it				
				const result = found.map(item => {

					// parent info (for desambiguation)
						const parent_term_id	= item.parent[0]
						const parent_row		= self.data_clean.find(el => el.term_id===parent_term_id)
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
					result	: result,
					debug	: {
						time : performance.now()-t0
					}
				}

			resolve(response)
		})
	},//end search_rows




}//end thematic