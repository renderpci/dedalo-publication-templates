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
		
		
		return fragment
	},//end render



	




}//end generic