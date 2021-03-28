/*jshint esversion: 6 */
"use strict";



/**
* FACES JS 
*/
var faces =  {


	/**
	* VARS
	*/
		// database record
		row : null,



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


		return new Promise(function(resolve){
			
			// load here additional files if needed	

			// events subscriptions
				// event open_video is triggered by btn_view_video
				event_manager.subscribe('open_player', page.open_player)

			resolve(true)			
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

		// rows_list
			const rows_list = document.createElement("div");
			rows_list.id = 'rows_list'
			rows_list.classList.add("rows_list")
			fragment.appendChild(rows_list)

			// request API to obtain interviews records and render them
			self.search_rows()
			.then(function(response){
				const interview_nodes = self.render_data({
					target	: rows_list,
					ar_rows	: response.result
				})
				rows_list.appendChild(interview_nodes)
			})
		
		
		return fragment
	},//end render



	/**
	* SEARCH_ROWS
	* Call to the API and load json data results of interview search
	* @return promise
	*/
	search_rows : function(options) {

		const self = this		

		return new Promise(function(resolve){

			const search_options = {
				dedalo_get				: 'records',
				table					: 'interview',
				ar_fields				: ['*'],
				order					: 'section_id ASC',
				limit					: 0,
				resolve_portals_custom	: {
					informant	: 'informant',
					image		: 'image',
					audiovisual	: 'audiovisual'
				}
			}			

			// request
				data_manager.request({
					body : search_options
				})
				.then(function(response){
					resolve(response)
				})
		})
	},//end search_rows



	/**
	* RENDER_DATA
	* Render received DB interview data
	* @return DOM DocumentFragment
	*/
	render_data : function(options) {
		
		const self = this

		// options
			const target	= options.target
			const ar_rows	= options.ar_rows

		const fragment = new DocumentFragment()
		for (let i = 0; i < ar_rows.length; i++) {
			
			const row = ar_rows[i]

			// wrapper
				const wrapper = document.createElement("div");
				wrapper.classList.add("interview_wrapper")
				fragment.appendChild(wrapper)

			// image
				if (row.image && row.image.length>0) {
					const image_node = document.createElement("img");
					image_node.classList.add("image")
					image_node.src = environment.media_base_url + row.image[0].image
					image_node.addEventListener("click", function(e){						

						// formats the data to unify the model
							const data_interview = {
								section_id	: row.interview_section_id,
								date		: null,
								code		: row.code,
								abstract	: row.abstract
							}
							const data_video_items = row.audiovisual.map(function(el){
								return {
									section_id		: el.section_id,
									transcription	: el.rsc36,
									subtitles_url	: el.subtitles,
									video_url		: el.video
								}
							})
						// publish the event (free init event is listening)
							event_manager.publish('open_player', {
								mode				: 'interview',
								data_video_items	: data_video_items,
								data_interview		: data_interview,
								term				: null,
								selected_key		: 0
							})
					})
					wrapper.appendChild(image_node)
				}

			// informant
				if (row.informant && row.informant.length>0) {
					const informant_data = row.informant.map(function(el){
						return el.name + (el.surname ? (" "+el.surname) : '')
					})
					const informant_node = document.createElement("h3");
					informant_node.classList.add("informant")
					informant_node.innerHTML = informant_data.join(", ")
					wrapper.appendChild(informant_node)	
				}
			
			// abstract
				if (row.abstract) {
					const abstract_node = document.createElement("div");
					abstract_node.classList.add("abstract")
					abstract_node.insertAdjacentHTML('afterbegin', row.abstract)
					wrapper.appendChild(abstract_node)	
				}
		}


		return fragment
	},//end render_data



}//end faces