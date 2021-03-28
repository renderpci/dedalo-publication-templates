/*jshint esversion: 6 */
"use strict";



/**
* FREE JS 
*/
var free =  {


	/**
	* VARS
	*/
		// database record
		row : null,

		// view_mode. rows view mode. default is 'list'.
		view_mode : 'list',

		// form. DOM node form
		form : null, 

		// list. instance of form_list factory
	 	list : null,
	 	
	 	// pagination. object with pagination params
	 	pagination : null,



	/**
	* INIT
	* Set up current template.
	* Load additional necessary files and set event listeners
	* @param object options
	*	{
	*		row : database record data of current template from table ts_web
	*	}
	* @return promise
	*/
	init : function(options) {

		const self = this

		// options
			self.row = options.row

		// pagination. Set defaults
			self.pagination = {
				limit	: 10, // rows per page
				offset	: 0,
				total	: null,
				n_nodes : 10 // paginator number of nodes to show
			}

		return new Promise(function(resolve){

			// load additional files if needed
				const scripts = [
					'./common/factory/list_factory.js' // small list lib
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
					}))
				}
				Promise.all(ar_load_files).then(function() {
					resolve(true)
				})

			// events subscriptions
				// event open_video is triggered by btn_view_video
				event_manager.subscribe('open_player', page.open_player)				
				// event paginate is triggered by list_factory.pagination nodes << < > >>
				event_manager.subscribe('paginate', paginating)
				function paginating(offset) {
					// update pagination vars
					self.pagination.offset = offset
					// force search again
					self.form_submit()
				}
		})
	},//end init



	/**
	* RENDER
	* Called by page.render_template after init current template
	* Creates all template html elements using
	* fixed db row as data source (title, abstract, images, etc.)
	* Note that menu and lang selectors are created here to gain
	* html control about order etc.
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

		// rows_list
			const rows_list = document.createElement("div");
			rows_list.id = 'rows_list'
			rows_list.classList.add("rows_list")
			fragment.appendChild(rows_list)
		
		
		return fragment
	},//end render



	/**
	* RENDER_FORM
	* Creates the form DOM nodes
	* @return DOM node from
	*/
	render_form : function() {

		const self = this

		// form
			const form_node = document.createElement("form");
			form_node.type = "form"
					
		// term_input_search
			const term_input_search = document.createElement("input");
			term_input_search.id	= "transcription_search"
			term_input_search.name	= "transcription_search"
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
	* Triggers the search
	*/
	form_submit : function() {
		
		const self = this

		// form input to search in the transcription column
		const transcription_search = self.form.querySelector('#transcription_search')

		// clean rows_list_container previous result nodes
			const rows_list_container = document.querySelector("#rows_list")
			while (rows_list_container.hasChildNodes()) {
				rows_list_container.removeChild(rows_list_container.lastChild);
			}			

		// search rows exec against the publication API
			const js_promise = self.search_rows({
				q					: transcription_search.value, // input string like 'school'
				limit				: self.pagination.limit, // max records per page
				offset				: self.pagination.offset, // current pagination offset
				appearances_limit	: 2 // max number of match appearances to show in each record
			})
			.then((response)=>{
				console.log("--> free template form_submit API response:", response)

				// update pagination total value
					self.pagination.total = response.total

				// render_data
					self.render_data({
						target		: rows_list_container,
						ar_rows		: response.result
					})
					.then(function(list_node){
						rows_list_container.appendChild(list_node)
					})
			})		


		return js_promise
	},//end form_submit



	/**
	* SEARCH_ROWS
	* Call to the API and load json data results of search
	* @return promise
	*/
	search_rows : function(options) {

		const self = this

		// options
			const q					= options.q || null
			const limit				= options.limit
			const offset			= options.offset
			const appearances_limit	= options.appearances_limit || 2

		return new Promise(function(resolve){

			const free_search_options = {
				dedalo_get			: 'free_search',
				q					: q,
				appearances_limit	: appearances_limit,
				list_fragment		: true,
				video_fragment		: true,
				fragment_terms		: true,
				rows_per_page		: limit,
				count				: true,
				offset				: offset
			}

			// request
				data_manager.request({
					body : free_search_options
				})
				.then(function(response){
					resolve(response)
				})
		})
	},//end search_rows



	/**
	* RENDER_DATA
	* Render received DB data using list_factory manager
	* @return promise
	*/
	render_data : function(options) {
		
		const self = this

		// options
			const target	= options.target
			const ar_rows	= options.ar_rows
		
		return new Promise(function(resolve){			

			const list_data	= self.parse_list_data(ar_rows) // prepares data to be used in list
			self.list		= self.list || new list_factory() // creates / get existing instance of list_factory
			self.list.init({
				target			: target, // node where list will be placed
				data			: list_data, // formatted found rows data
				fn_row_builder	: self.render_row, // callback function
				pagination		: self.pagination // pagnation object info (limit, offset, total)
			})
			self.list.render_list()
			.then(function(list_node){
				resolve(list_node)
			})			
		})
	},//end render_data



	/**
	* PARSE_LIST_DATA
	* Parse rows data to use it in list_factory
	* @return array data
	*/
	parse_list_data : function(ar_rows) {

		const data = []

		const ar_rows_length = ar_rows.length
		for (let i = 0; i < ar_rows_length; i++) {
			
			const row = Object.assign({}, ar_rows[i])

			const thumb_url = (row.image && row.image[0] && row.image[0].image)
				? environment.media_base_url + row.image[0].image
				: null

			const item = {
				interview_section_id	: parseInt(row.interview_section_id),
				av_section_id			: parseInt(row.av_section_id),
				fragments				: row.fragments,
				abstract				: row.abstract,
				code					: row.code,
				title					: row.title,
				thumb_url				: thumb_url,
				informant				: (row.informant && row.informant.length>0)
					? row.informant.map(function(el){
						return {
							name		: el.name,
							surname		: el.surname,
							birthplace	: el.birthplace,
							birthdate	: el.birthdate
						}
					  })
					: null
			}

			data.push(item)
		}
		

		return data
	},// end parse_list_data



	/**
	* RENDER_ROW
	* Build DOM nodes of current data row
	* Is called by factory_list as callback
	*/
	render_row : function(item) {
		
		const self = this
		
		const fragment	= new DocumentFragment()

		// data item sample
			// abstract: ""
			// av_section_id: 1
			// code: ""
			// fragments: (2) [{…}, {…}]
			// informant: [{…}]
			// interview_section_id: 1
			// thumb_url: "https://dedalo.dev/dedalo/media/image/1.5MB/0/rsc29_rsc170_1.jpg"
			// title: "Interview 1"

		// posterframe image
			const posterframe = document.createElement("div");
			posterframe.classList.add("posterframe")
			fragment.appendChild(posterframe)

			const img_posterframe = document.createElement("img");
			img_posterframe.src = item.thumb_url
			posterframe.appendChild(img_posterframe)


		// row_info
			const row_info = document.createElement("div");
			row_info.classList.add("row_info")
			fragment.appendChild(row_info)
			
			// informant_info
				if (item.informant && item.informant.length>0 && item.informant[0].name.length>0) {

					const informant_info = document.createElement("h3");
					informant_info.classList.add("informant_info")
					informant_info.innerHTML = build_informant_text(item.informant)
					row_info.appendChild(informant_info)
					
					function build_informant_text(informant) {

						if (!informant || informant.length<1) return ''

						const full_value = []
						for (let i = 0; i < informant.length; i++) {
							
							const item = informant[i]

							const informant_value = []

							if (item.name && item.name.length>0) {
								informant_value.push(item.name)
							}

							if (item.surname && item.surname.length>0) {
								informant_value.push(item.surname)
							}

							full_value.push( informant_value.join(' ') ) 
						}
						
						return full_value.join(', ')
					}
				}

			// summary
				if (item.abstract && item.abstract.length>0) {

					// btn_summary
						const btn_summary = document.createElement("input");
						btn_summary.type = "button"
						btn_summary.value = "Summary"
						btn_summary.classList.add("btn","btn-light","btn-block","primary")
						row_info.appendChild(btn_summary)
						btn_summary.addEventListener("click", function(){
							summary.classList.toggle("hide")
						})					

					// summary text
						const summary = document.createElement("div");
						summary.innerHTML = item.abstract
						summary.classList.add("summary","hide")
						row_info.appendChild(summary)
				}
			
			// group_fragment_info
				const group_fragment_info = document.createElement("div");
				group_fragment_info.classList.add("group_fragment_info")
				row_info.appendChild(group_fragment_info)

			// fragments
				for (let i = 0; i < item.fragments.length; i++) {
					
					// fragment_node
						const fragment_node = document.createElement("div");
						fragment_node.classList.add("fragment_info")
						fragment_node.innerHTML = item.fragments[i].list_fragment
						group_fragment_info.appendChild(fragment_node)

					// buttons
						const buttons = document.createElement("div");
						buttons.classList.add("buttons")
						group_fragment_info.appendChild(buttons)

						// btn_view_video
							const btn_view_video = document.createElement("input");
							btn_view_video.type = "button"
							btn_view_video.value = "View video"
							btn_view_video.classList.add("btn","btn-light","btn-block","primary")
							buttons.appendChild(btn_view_video)
							btn_view_video.addEventListener("click", function(){

								// formats the data to unify the model
									const data_interview = {
										section_id	: item.interview_section_id,
										date		: null,
										code		: item.code,
										abstract	: item.abstract
									}
									const data_video_items = item.fragments.map(function(el){
										return {
											section_id		: item.av_section_id,
											transcription	: el.fragm,
											subtitles_url	: el.subtitles_url,
											video_url		: el.video_url
										}
									})
								// publish the event (free init event is listening)
									event_manager.publish('open_player', {
										data_video_items	: data_video_items,
										data_interview		: data_interview,
										term				: null,
										selected_key		: i
									})
							})

					// terms_list
						if (item.terms_list) {
							const terms_list = document.createElement("div");
							terms_list.classList.add("terms_list")
							terms_list.innerHTML = item.terms_list
							group_fragment_info.appendChild(terms_list)
						}
				}			
			

		const row_node = document.createElement("div");		
		row_node.classList.add("row_node")
		row_node.appendChild(fragment)


		return row_node
	},//end render_row



}//end free