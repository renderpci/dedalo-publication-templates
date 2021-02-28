/**
* generic js
*/


var generic = {


	row : null,



	/**
	* INIT
	* @return 
	*/
	init : function(options) {
		console.log("generic init options:",options);

		const self = this

		// options
			self.row = options.row		

		return new Promise(function(resolve){
			
			// load aditional files if needed
				// const template_name = 'generic'
				// common.load_style( './tpl/' + template_name + '/css/' + template_name + '.css' + '?' + environment.version)
				// common.load_script('./tpl/' + template_name + '/js/'  + template_name + '.js'  + '?' + environment.version)
				// .then(function(response){
				// 	resolve(true)
				// })

			resolve(true)			
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

		const body = common.create_dom_element({
			element_type	: "div",
			class_name		: "body",
			inner_html		: row.body,
			parent			: wrapper
		})

		
		
		return fragment
	},//end render



	




}//end generic