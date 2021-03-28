/*jshint esversion: 6 */
"use strict";



/**
* GENERIC JS
* Default multipurpose template
*/
var generic = {


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
	*/
	init : function(options) {
		console.log("generic template init options:",options);

		const self = this

		// options
			self.row = options.row

		return new Promise(function(resolve){
			
			// load here additional files if needed				

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

		// images
			if (row.image && row.image.length>0) {
				for (let i = 0; i < row.image.length; i++) {					

					const image_node = document.createElement("img");
					image_node.src = environment.media_base_url + row.image[i].image
					image_node.classList.add("image")
					wrapper.appendChild(image_node)
				}					
			}		
		
		
		return fragment
	},//end render



}//end generic