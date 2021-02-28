/*global tstring, page_globals, SHOW_DEBUG, row_fields, common, page*/
/*eslint no-undef: "error"*/

/**
* LIST_FACTORY
* Manage common list task like rendering row data and paging it
*/

"use strict";



function list_factory() {


	// vars
		// target. DOM element where timeline section is placed
			// this.target	= null
		
		// data. Database parsed rows data to create the map
			this.data = null

		// fn_row_builder. Function that manage node creation of each row block
			this.fn_row_builder = null

		// pagination. object containing pagination info: total, limit, offset
			this.pagination = null
			
		// caller (for example 'catalog' instance)
			this.caller
	
	
	
	/**
	* INIT
	* @return bool true
	*/
	this.init = function(options) {
		
		const self = this
		
		// self.target		= options.target
		self.data			= options.data || []
		self.fn_row_builder	= options.fn_row_builder
		self.pagination		= (typeof options.pagination==="undefined" ||  options.pagination===null) // false to disable, null to defaults
			? {
				total	: null,
				limit	: 10,
				offset	: 0,
				n_nodes : 10
			}
			: options.pagination // can be 'false'
		self.caller			= options.caller
		// console.log("///////////////////////////////// self.pagination:",self.pagination);
		
		// status
			self.status = "initied"


		return true
	};//end init

	

	/**
	* RENDER_LIST
	* @return promise
	*/
	this.render_list = function() {

		const self = this		
		
		// build row nodes
		return new Promise(function(resolve) {

			const fragment = new DocumentFragment(); 
			
			const ar_rows_length = self.data.length
	
			// pagination
				let paginator_options
				if (self.pagination) {
					// pagination options
						paginator_options		= self.pagination
						paginator_options.count	= ar_rows_length

					// paginator top
						paginator_options.class_name = 'top'
						const paginator_node = self.render_pagination(paginator_options)
						if (paginator_node) {
							fragment.appendChild(paginator_node)
						}						
				}
			
			// rows_list
				const rows_list = common.create_dom_element({
					element_type	: 'div',
					class_name		: 'rows_container',
					parent			: fragment
				})


			// masonry grid case add grid-sizer
				if (self.caller && self.caller.view_mode && self.caller.view_mode==='list_images') {
					common.create_dom_element({
						element_type	: 'div',
						class_name		: 'grid-sizer',
						parent			: rows_list
					})
				}

			// iterate all rows
				for (let i = 0; i < ar_rows_length; i++) {

					// row_builder. node is rendered in caller class function defined when init
						const row_node = self.fn_row_builder(self.data[i], self.caller.view_mode)
						if (row_node) {
							rows_list.appendChild(row_node)
						}
				}


			// paginator bottom	
				if (self.pagination) {
					paginator_options.class_name = 'bottom'
					fragment.appendChild( self.render_pagination(paginator_options) )
				}

			resolve(fragment)
		})
		// .then(function(end_fragment){

		// 	// container select and clean container div
		// 	const container = self.target
				
		// 	// add node
		// 	container.appendChild(end_fragment)

		// 	return end_fragment
		// });
	};//end render_list



	/**
	* RENDER_PAGINATION
	* @return DOM node
	*/
	this.render_pagination = function(options) {

		const self = this

		// const paginator = new self.paginator()
			// console.log("paginator:",paginator);
		
		const class_name = options.class_name

		const pagination = common.create_dom_element({
			element_type	: 'div',
			class_name		: 'pagination' + (options.class_name ? (' '+options.class_name) : '')
		})

		// navigator
			const full_paginator_node = self.paginator.get_full_paginator(options)
			if (full_paginator_node) {
				pagination.appendChild(full_paginator_node)
			}	

		// spacer
			const spacer = common.create_dom_element({
				element_type	: 'div',
				class_name		: 'spacer',
				parent			: pagination
			})

		// totals
			pagination.appendChild( self.paginator.get_totals_node(options) )


		return pagination
	};//end render_pagination



	/**
	* PAGINATOR
	*/
	this.paginator =  {

		// _string. All paginator translatable text string
			_string : {
				to		: tstring.to || "to",
				of		: tstring.of || "of",
				first	: tstring.first || "<<",
				prev	: tstring.prev || "Prev",
				next	: tstring.next || "Next",
				last	: tstring.last || ">>",
				showed	: tstring.showed || "Showed",
			},


		/**
		* GET_FULL_PAGINATOR
		* Builds and return complete paginator dom node
		*/
		get_full_paginator : function(options) {
			
			const self = this

			const total		= parseInt(options.total);
			const limit		= parseInt(options.limit);
			const offset	= parseInt(options.offset);
			const n_nodes	= options.n_nodes ? parseInt(options.n_nodes) : 0;

			// page nodes data
			const page_nodes_data = self.build_page_nodes(total, limit, offset, n_nodes)

			// dom nodes
			const paginator_node = self.build_paginator_html(page_nodes_data, false)

			return paginator_node
		},//end get_full_paginator
		


		/**
		* BUILD_PAGE_NODES
		* Build an array ob ojects ready to draw a pagination navigator
		*/
		build_page_nodes : function(total, limit, offset, n_nodes) {
			if(SHOW_DEBUG===true) {
				console.log("[paginator.build_page_nodes] : total",total,"limit:",limit,"offset",offset,"n_nodes:",n_nodes);
			}

			const self = this

			const ar_nodes = []

			// check total
				if (total<limit) { // total<1 || 
					return ar_nodes
				}

			// n_nodes default
				if (!n_nodes || n_nodes===0) {
					n_nodes = 6
				}

			// first
				ar_nodes.push({
					label			: self._string.first,
					offset_value	: 0,
					type			: "navigator",
					active			: (offset>=limit) ? true : false,
					id				: 'first'
				})

			// prev			
				ar_nodes.push({
					label			: self._string.prev,
					offset_value	: (offset - limit)>0 ? (offset - limit) : 0,
					type			: "navigator",
					active			: (offset>=limit) ? true : false,
					id				: 'previous'
				})			

			// intermediate
				const n_pages		= limit>0
					? Math.ceil(total / limit)
					: 0
				const current_page	= limit>0
					? Math.ceil(offset / limit)+1
					: 1
				let n_pages_group	= Math.ceil(n_nodes / 2)
				
				if (current_page<=n_pages_group) {
					n_pages_group = (n_pages_group*2) -current_page+1
				}
				
				if (n_pages>0) {
					for (let i = 1; i <= n_pages; i++) {

						const selected	= ((i-1)===(offset/limit)) ? true : false; // offset===((i+1) * limit) ? true : false
						const active	= !selected
					
						// middle extra ...
							//if (i===(current_page+1)) {
							//	ar_nodes.push({
							//		label 		 : "...",
							//		offset_value : null,
							//		type 		 : "extra",
							//		active 		 : false,
							//		selected 	 : false
							//	})
							//}

						const offset_value = ((i-1) * limit) 

						if( 	(i>=(current_page-n_pages_group) && i<=current_page)
							|| 	(i>=(current_page-n_pages_group) && i<=(current_page+n_pages_group)) 
							) {

							ar_nodes.push({
								label			: i,
								offset_value	: offset_value,
								type			: "page",
								selected		: selected,
								active			: active,
								id				: i
							})
						}
					}
				}

			// next
				ar_nodes.push({
					label			: self._string.next,
					offset_value	: offset + limit, // (n_pages_group+1) * limit,//
					type			: "navigator",
					active			: (offset < (total-limit)) ? true : false,
					id				: 'next'
				})

			// last
				ar_nodes.push({
					label			: self._string.last || ">>",
					offset_value	: (n_pages-1) * limit,
					type			: "navigator",
					active			: (offset < (total-limit)) ? true : false,
					id				: 'last'
				})	

			// response object
				const response = {
					total			: total,
					limit			: limit,
					offset			: offset,
					nodes			: n_nodes,
					n_pages			: n_pages,
					n_pages_group	: n_pages_group,
					current_page	: current_page,
					ar_nodes		: ar_nodes			
				}

			// debug
				if(SHOW_DEBUG===true) {
					// console.log("[build_page_nodes] response:",response);
				}

			return response
		},//end build_page_nodes



		/**
		* BUILD_PAGINATOR_HTML
		* Builds html of paginator from page_nodes
		*/
		build_paginator_html : function(page_nodes_data) {
			
			const self = this

			const fragment = new DocumentFragment();
			
			// iterate nodes (li)
				const ar_nodes			= page_nodes_data.ar_nodes || []
				const ar_nodes_length	= ar_nodes.length
				for (let i = 0; i < ar_nodes_length; i++) {
					
					const node = ar_nodes[i]
					
					// class_name
						let class_name = (node.type==='navigator')
							? node.type + " " + node.id
							: node.type

							if (node.selected===true) {
								class_name += " selected"
							}

					// link
						const link = common.create_dom_element({
							element_type	: "a",
							class_name		: class_name + (!node.active ? " unactive" : ""),
							text_content	: node.label,
							parent			: fragment
						})
						// event publish on click
						if (node.active===true) {
							link.addEventListener("click", function(){
								event_manager.publish('paginate', node.offset_value)
							})
						}

				}//end iterate nodes

			// wrapper ul
				const wrapper_ul = common.create_dom_element({
					element_type 	: "div",
					class_name 		: "paginator_wrapper navigator"
				})
				wrapper_ul.appendChild(fragment)


			return wrapper_ul
		},//end build_paginator_html



		/**
		* GET_TOTALS_NODE
		* Builds totals info div of current viewed records and totals
		*/
		get_totals_node : function(options) {

			const self = this

			const total		= options.total
			const limit		= options.limit
			const offset	= options.offset
			const count		= options.count

			const from = total==0 
				? 0
				: Math.ceil(1 * offset) || 1
			
			const to = offset + count

			const info = (total===0) 
				? self._string.showed + " " + total
				: self._string.showed + " " + from + " " + self._string.to + " " + to + " " + self._string.of + " " + total

			const totals_node = common.create_dom_element({
				element_type	: "div",
				class_name		: "totals",
				text_content	: info
			})		


			return totals_node
		},//end get_totals_node
	};//end paginator
	



}//end list_factory


