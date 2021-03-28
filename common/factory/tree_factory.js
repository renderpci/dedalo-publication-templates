/*global tstring, page_globals, __WEB_TEMPLATE_WEB__, Promise, SHOW_DEBUG, row_fields, common, page*/
/*eslint no-undef: "error"*/

"use strict";



function tree_factory() {

	// vars
		// target. DOM element where timeline section is placed
			this.target	= null
		
		// data. Database parsed rows data to create the map
			this.data = null

		// root_term. root nodes for tree
			this.root_term = null

		// caller. Insatance that call here (ussually thesaurus.js)
			this.caller



	/**
	* INIT
	*/
	this.init = function(options) {
		// console.log("-- tree_factory init options:", options);
		
		const self = this

		// fix vars

		// target. DOM element where map is placed
			self.target = options.target
		
		// data. Preparsed data from rows. Contains items with properties 'lat', 'lon', and 'data' like [{lat: lat, lon: lon, data: []}]
			self.data = options.data

		// caller
			self.caller = options.caller

		// set_hilite
			self.set_hilite = options.set_hilite || false
				// console.log("self.set_hilite:",self.set_hilite);

		// hilite_relations_limit. When limit is reached, no more relations are opened automaticly
			self.hilite_relations_limit		= 15
			self.hilite_relations_showed	= 0 // incremented each time a relation is showed automactily untili maximun allowed

		// hilite_indexation_limit. When limit is reached, no more indexation are opened automaticly
			self.hilite_indexation_limit	= 15
			self.hilite_indexation_showed	= 0 // incremented each time a indexation is showed automactily untili maximun allowed

		// tree_state
			const session_tree_state = sessionStorage.getItem("tree_state")
			if (session_tree_state && !self.set_hilite) {

				self.tree_state = JSON.parse(session_tree_state)

				const data_length = self.data.length
				for (let i = 0; i < data_length; i++) {
					// set state
					const current_session_item = self.tree_state.find(item => item.id===self.data[i].term_id)					
					if (current_session_item) {
						self.data[i].state = current_session_item.state
					}				 				
				}
				// console.log(">>>>>> self.tree_state from session cache:", self.tree_state);	

			}else{
				
				self.tree_state = []
				const data_length = self.data.length
				for (let i = 0; i < data_length; i++) {

					const current_state = self.data[i].status || "closed"						

					// set state default for all
					self.data[i].state = current_state
					// add
					self.tree_state.push({
						id		: self.data[i].term_id,
						state	: current_state
					})
				}

				// if (self.set_hilite!==true) {
					sessionStorage.setItem('tree_state', JSON.stringify(self.tree_state));	
				// }				

				// console.log(">>>>>> self.tree_state calculated new:", self.tree_state);		
			}			

		// rows
			self.root_term = options.root_term

		// status
			self.status = "initied"


		return true
	}//end init



	/**
	* RENDER
	*/
	this.render = function(options) {
		// console.log("-- render options:",options);
		
		const self = this

		const target	= self.target
		const data		= self.data
		const root_term	= self.root_term
		
		const js_promise = new Promise(function(resolve){			

			const fragment = new DocumentFragment();

			// tree_wrapper. Create the tree wrapper and insert into parent node 'self.target')
				const tree_wrapper = self.create_dom_element({
					element_type	: "div",
					class_name		: "tree_wrapper",
					parent			: fragment
				})

			// render tree nodes
				const tree_nodes = []

				// build dom nodes
					const data_length = data.length
					for (let i = 0; i < data_length; i++) {
						
						const row = data[i]
						
						if (row.descriptor!=='yes') {
							console.warn("Skipped build_tree_node of term ND :", row.term_id, row.term);
							continue;
						}

						tree_nodes.push(
							self.build_tree_node(row)
						)
					}

			// hierarchize nodes
				const tree_nodes_length = tree_nodes.length
				for (let i = 0; i < tree_nodes_length; i++) {
					
					const tree_node	= tree_nodes[i]
					const term_id	= tree_node.term_id

					if (root_term.indexOf(term_id)!==-1) {
						
						// root tree_node
						tree_wrapper.appendChild(tree_node)
					
					}else{
						
						// others
						const parent = tree_node.parent
							? tree_node.parent[0]
							: null

						if (!parent) {
							console.log("skip non parent defined tree_node:", tree_node);
							continue
						}
						
						const parent_tree_node = tree_nodes.find(item => item.term_id===parent)
						if (parent_tree_node && parent_tree_node.branch) {
							parent_tree_node.branch.appendChild(tree_node)
						}
					}
				}
			

			resolve(fragment)

		})
		.then(function(response){
			
			// append finished gragment to target DOM
				target.appendChild(response)

			// scroll to hilite
				if (self.set_hilite===true) {
					event_manager.when_in_dom(target, function(){
						// find first hilited term
						const tree_node = target.querySelector(".term.hilite")
						// scroll document to hilited term (first founded at DOM)
						if (tree_node) {
							tree_node.scrollIntoView({behavior: "auto", block: "center", inline: "nearest"})
						}
					})				
				}

			return response
		})
		

		return js_promise
	}//end render



	/**
	* BUILD_TREE_NODE
	* @return DOM node tree_node
	*/
	this.build_tree_node = function(row) {

		const self = this
		
		// node wrapper
			const tree_node = self.create_dom_element({
				element_type	: "div",
				class_name		: "tree_node",
				id				: row.term_id
			})

			tree_node.term_id = row.term_id
			tree_node.parent  = row.parent


		// term
			const term_value	= row.term //+ " <small>[" + row.term_id + "]</small>"
			const to_hilite		= (row.hilite && row.hilite===true)
			const term_css		= to_hilite===true ? " hilite" : ""
			const term = self.create_dom_element({
				element_type	: "span",
				class_name		: "term" + term_css,
				inner_html		: term_value,
				parent			: tree_node
			})			

		// nd
			if (row.nd && row.nd.length>0) {
				self.create_dom_element({
					element_type	: "span",
					class_name		: "nd",
					inner_html		: "[" + row.nd.join(", ") + "]",
					parent			: tree_node
				})
			}		

		// buttons
			// button scope_note
				if (row.scope_note && row.scope_note.length>0) {
					const btn_scope_note = self.create_dom_element({
						element_type	: "span",
						class_name		: "btn_scope_note",
						parent			: tree_node
					})
					btn_scope_note.addEventListener("mousedown", function(){
						if (this.classList.contains("open")) {
							scope_note.classList.add("hide")
							this.classList.remove("open")
						}else{
							scope_note.classList.remove("hide")
							this.classList.add("open")
						}
					})
				}
			
			// button relations
				let btn_relations
				if (row.relations && row.relations.length>0) {
					btn_relations = self.create_dom_element({
						element_type	: "span",
						class_name		: "btn_relations",
						// inner_html	: "Relations",
						parent			: tree_node
					})
					btn_relations.addEventListener("mousedown", function(){
						if (this.classList.contains("open")) {
							relations_container.classList.add("hide")
							this.classList.remove("open")
						}else{
							relations_container.classList.remove("hide")
							this.classList.add("open")
						}
					})
				}

			// button indexation
				let btn_indexation
				if (row.indexation && row.indexation.length>0) {
					btn_indexation = self.create_dom_element({
						element_type	: "span",
						class_name		: "btn_indexation",
						// inner_html	: "indexation",
						parent			: tree_node
					})
					btn_indexation.addEventListener("mousedown", function(){
						if (this.classList.contains("open")) {
							indexation_container.classList.add("hide")
							this.classList.remove("open")
						}else{
							indexation_container.classList.remove("hide")
							this.classList.add("open")
						}
					})
				}			

		// scope note wrapper
			let scope_note		
			if (row.scope_note && row.scope_note.length>0) {

				const hide_style = row.state==="opened" ? "" : " hide"
								
				// scope_note
					const scope_note_text = row.scope_note.replace(/^\s*<br\s*\/?>|<br\s*\/?>\s*$/g,'');
					scope_note = self.create_dom_element({
						element_type	: "div",
						class_name		: "scope_note hide",
						inner_html		: scope_note_text,
						parent			: tree_node
					})
			}

		// relations wrapper
			let relations_container
			if (row.relations && row.relations.length>0) {

				// relations_container
					relations_container = self.create_dom_element({
						element_type	: "div",
						class_name		: "relations_container hide",
						parent			: tree_node
					})

					// Callback function to execute when mutations are observed
					const callback = function(mutationsList, observer) {
						// Use traditional 'for loops' for IE 11
						for(let mutation of mutationsList) {
							if (mutation.type==='attributes' && mutation.attributeName==='class') {
									// console.log('The ' + mutation.attributeName + ' attribute was modified.');
									// console.log("mutationsList:",mutationsList);
									// console.log("mutationsList.target:",mutationsList[0].target);
								if (!mutationsList[0].target.classList.contains("hide")) {
									
									// draw nodes
									self.render_relation_nodes(row, relations_container, self, false)
									
									// Stop observing
									observer.disconnect();
								}
							}
						}
					};

					// Create an observer instance linked to the callback function
					const observer = new MutationObserver(callback);

					// Start observing the target node for configured mutations
					observer.observe(relations_container, { attributes: true, childList: false, subtree: false });

					// console.log("self.hilite_relations_limit:",self.hilite_relations_limit, self.hilite_relations_showed);

					if (row.hilite===true && self.hilite_relations_showed<self.hilite_relations_limit) {
						// relations_container.classList.remove("hide")
						// btn_relations.click()
						relations_container.classList.remove("hide")
						btn_relations.classList.add("open")

						// increment hilite_relations_showed until reach self.hilite_relations_limit
						self.hilite_relations_showed++
					}
			}

		// indexation wrapper
			let indexation_container
			if (row.indexation && row.indexation.length>0) {

				// indexation_container
					indexation_container = self.create_dom_element({
						element_type	: "div",
						class_name		: "indexation_container hide",
						parent			: tree_node
					})

					// Callback function to execute when mutations are observed
					const callback = function(mutationsList, observer) {
						// Use traditional 'for loops' for IE 11
						for(let mutation of mutationsList) {
							if (mutation.type==='attributes' && mutation.attributeName==='class') {
									// console.log('The ' + mutation.attributeName + ' attribute was modified.');
									// console.log("mutationsList:",mutationsList);
									// console.log("mutationsList.target:",mutationsList[0].target);
								if (!mutationsList[0].target.classList.contains("hide")) {
									
									// draw nodes
									// self.render_indexation_nodes(row, indexation_container, self)
									event_manager.publish('show_indexation_nodes', {
										row						: row,
										indexation_container	: indexation_container,
										instance				: self
									})
									
									// Stop observing
									observer.disconnect();
								}
							}
						}
					};

					// Create an observer instance linked to the callback function
					const observer = new MutationObserver(callback);

					// Start observing the target node for configured mutations
					observer.observe(indexation_container, { attributes: true, childList: false, subtree: false });

					// console.log("self.hilite_indexation_limit:",self.hilite_indexation_limit, self.hilite_indexation_showed);

					if (row.hilite===true && self.hilite_indexation_showed<self.hilite_indexation_limit) {
						// indexation_container.classList.remove("hide")
						// btn_indexation.click()
						indexation_container.classList.remove("hide")
						btn_indexation.classList.add("open")

						// increment hilite_indexation_showed until reach self.hilite_indexation_limit
						self.hilite_indexation_showed++
					}
			}

			// button children
				if (row.children && row.children.length>0) {

					const open_style = row.state==="opened" ? " open" : ""

					const arrow = self.create_dom_element({
						element_type	: "span",
						class_name		: "arrow" + open_style,
						parent			: tree_node
					})
					arrow.addEventListener("mousedown", function(){
						let new_state
						if (this.classList.contains("open")) {
							branch.classList.add("hide")
							this.classList.remove("open")
							// new_state
							new_state = "closed"
						}else{
							branch.classList.remove("hide")
							this.classList.add("open")
							// new_state
							new_state = "opened"
						}
						
						// state update
						const current_state = self.tree_state.find(item => item.id===row.term_id)
						if (current_state && current_state.state!==new_state) {
							current_state.state = new_state
							// update sessionStorage tree_state var
							sessionStorage.setItem('tree_state', JSON.stringify(self.tree_state));
						}
					})
				}

		// children wrapper
			let branch
			if (row.children && row.children.length>0) {
				
				const hide_style = row.state==="opened" ? "" : " hide"
								
				// branch
					branch = self.create_dom_element({
						element_type	: "div",
						class_name		: "branch" + hide_style,
						parent			: tree_node
					})

				tree_node.branch = branch

			}else{

				tree_node.branch = null
			}


		return tree_node
	};//end build_tree_node



	/**
	* RENDER_RELATION_NODES
	* @return promise
	*/
	this.render_relation_nodes = function(row, relations_container, self, view_in_context) {
				
		return new Promise(function(resolve){

			if (!row.relations || row.relations.length<1) {
				resolve(false)
			}
		
			// draw nodes
			const relation_item_promises = []
			for (let i = 0; i < row.relations.length; i++) {
				const relation_item_promise = self.build_relation_item({
					data	: row.relations[i],
					parent	: relations_container,
					row		: row
				})
				relation_item_promises.push(relation_item_promise)
			}
			
			// All promises done
			// Low resolution images are loaded. Change src with the hi-res version
			Promise.all(relation_item_promises).then((image_nodes) => {
				// console.log("All promisses are resolved!",image_nodes);
				
				for (let i = 0; i < image_nodes.length; i++) {											
					// show
					// image_nodes[i].classList.add("loaded")

					// replace image file (thumb) with quality '1.5MB'																							
					// image_nodes[i].src = image_nodes[i].src.replace('/thumb','/0.125MB')
										
					// reassign background color
					// const bg_color_rgb = image_nodes[i].style.backgroundColor
					// image_nodes[i].style.backgroundColor = bg_color_rgb
				}				
			});

			resolve(true)		
		})
	};//end render_relation_nodes	



	/**
	* BUILD_RELATION_ITEM
	* Build and append relation_item to options parent element
	* @return promise
	*/
	this.build_relation_item = function(options) {
		
		const self = this

		// options
			const parent	= options.parent
			const data		= options.data

		return new Promise(function(resolve){

			const image_url	= data.image_url
			const thumb_url	= data.thumb_url
			const title		= data.title

			const title_text = title
				? title
				: '' // (options.data.section_tipo + " " + options.data.section_id)

			const relation_item = self.create_dom_element({
				element_type	: "div",
				class_name		: "relation_item",
				title			: title_text + (SHOW_DEBUG ? (" [" + options.data.table + " " + options.data.section_tipo + " " + options.data.section_id + "]") : '')			})

			// img
				page.build_image_with_background_color(thumb_url, relation_item)
				.then(function(response){

					const img = response.img

					// append thumb image
					relation_item.appendChild(img)

					// image click event
					img.addEventListener("mousedown", function(){
						// open detail file in another window
							const template = (data.table==='pictures')
								? 'picture'
								: 'object'
							const url = page_globals.__WEB_ROOT_WEB__ + "/" + template + "/" + data.section_id
							const new_window = window.open(url)
								  new_window.focus();
					})
				})

			resolve(relation_item)
		})
	};//end build_relation_item



	/**
	* RENDER_INDEXATION_NODES
	* @return promise
	*/
		// this.render_indexation_nodes = function(row, indexation_container, self) {
		// 	if(SHOW_DEBUG===true) {
		// 		console.log("-- render_indexation_nodes row:",row);
		// 	}	
			
		// 	return new Promise(function(resolve){
			
		// 		if (!row.indexation || row.indexation.length<1) {
		// 			resolve(false)
		// 			return
		// 		}

		// 		if (typeof self.caller.get_indexation_data!=='function') {
		// 			console.warn("Ignored render_indexation_nodes call to undefined caller function 'get_indexation_data'");
		// 			resolve(false)
		// 			return
		// 		}

		// 		// get fragments
		// 			self.caller.get_indexation_data(row.indexation)
		// 			.then(function(response){
		// 				// console.log("-- row.indexation:",row.indexation);
		// 				// console.log("-- get_indexation_data response:",response);

		// 				const data_indexation	= response.data_indexation
		// 				const data_interview	= response.data_interview

		// 				// group by interview section_id
		// 					const groups = data_indexation.reduce(function (r, a) {
		// 						const interview_section_id = a.index_locator.section_top_id
		// 						r[interview_section_id] = r[interview_section_id] || [];
		// 						r[interview_section_id].push(a);
		// 						return r;
		// 					}, Object.create(null));

		// 				// iterate groups
		// 					for(const section_top_id in groups){
													
		// 						const data_video_items		= groups[section_top_id]
		// 						const relation_item_promise	= self.caller.build_indexation_item({
		// 							data_video_items	: data_video_items,
		// 							data_interview		: data_interview,
		// 							term				: row.term,
		// 							parent				: indexation_container
		// 						})
		// 					}

		// 				// // draw nodes
		// 				// const indexation_item_promises = []
		// 				// for (let i = 0; i < row.indexation.length; i++) {

		// 				// 	if (response.result[i]!==undefined) {

		// 				// 		const relation_item_promise = self.build_indexation_item({
		// 				// 			indexation	: row.indexation[i],
		// 				// 			data		: response.result[i],
		// 				// 			parent		: indexation_container								
		// 				// 		})
		// 				// 		indexation_item_promises.push(relation_item_promise)
		// 				// 	}
		// 				// }

		// 				resolve(true)
		// 			})
		// 	})
		// };//end render_indexation_nodes	



	/**
	* BUILD_INDEXATION_ITEM
	* Build and append indexation_item to options parent element
	* @return promise
	*/
	this.build_indexation_item = function(options) {
		console.warn("-- build_indexation_item options:", options);
		
		const self = this

		return new Promise(function(resolve){
					
			const parent			= options.parent
			const data_video_items	= options.data_video_items
			const data_interview	= options.data_interview
			const term				= options.term
			
			const av_section_id = data_video_items[0].section_id

			const indexation_item = self.create_dom_element({
				element_type	: "div",
				class_name		: "indexation_item",
				// title		: (SHOW_DEBUG ? (" [" + options.data.table + " " + options.data.section_tipo + " " + options.data.section_id + "]") : ''),
				parent			: parent
			})

			// img
				const thumb_url = av_section_id
					? common.get_media_engine_url(av_section_id, 'posterframe', 'thumb', true)
					: __WEB_TEMPLATE_WEB__ + '/assets/images/default_thumb.jpg'

				page.build_image_with_background_color(thumb_url, indexation_item, null)
				.then(function(response){

					const img = response.img

					// append thumb image
					indexation_item.appendChild(img)

					let current_video_player_wrapper = null

					// image click event
					img.addEventListener("click", function(){
					
						event_manager.publish('open_video', {
							mode				: 'indexation', // indexation | tapes
							data_interview		: data_interview,
							data_video_items	: data_video_items,
							term				: term,
							selected_key		: 0
						})
						/*
						if (current_video_player_wrapper) {
							current_video_player_wrapper.classList.toggle('hide')
							return true
						}

						self.caller.video_player = self.caller.video_player || new video_player() // creates / get existing instance of player
						self.caller.video_player.init({
							mode				: 'indexation', // indexation | tapes
							data_interview		: data_interview,
							data_video_items	: data_video_items,
							term				: term,
							selected_key		: 0
						})
						self.caller.video_player.render()
						.then(function(video_player_wrapper){
							parent.appendChild(video_player_wrapper)
							// set current_video_player_wrapper
							current_video_player_wrapper = video_player_wrapper
							// resolve(true)
						})
						*/
					})
					
					resolve(img)
				})			
		})
	};//end build_indexation_item



	/**
	* GET_THESAURUS_CHILDREN
	* @return promise
	*/
	this.get_thesaurus_children = function(item_terms) {
		
		return new Promise(function(resolve){

			const term_id = item_terms.join(',')
			
			// request
			data_manager.request({
				body : {
					dedalo_get			: 'thesaurus_children',
					db_name				: page_globals.WEB_DB,
					lang				: page_globals.WEB_CURRENT_LANG_CODE,
					ar_fields			: ['term_id'],
					term_id				: term_id,
					recursive			: true,
					only_descriptors	: true,
					remove_restricted	: false,
					multiple			: true
				}
			})
			.then(function(response){
				// console.log("--- response:", term_id, response);
				const ar_terms = []
				const elements = response.result
				for (let j = 0; j < elements.length; j++) {

					const terms = elements[j].result
					for (let i = 0; i < terms.length; i++) {
						ar_terms.push(terms[i])
					}
				}

				resolve(ar_terms.map(function(el){
					return el.term_id
				}))
			})
		})
	};//end get_thesaurus_children



	/**
	* CREATE_DOM_ELEMENT
	* Builds single dom element
	*/
	this.create_dom_element = function(element_options) {
		
		const element_type				= element_options.element_type
		const parent					= element_options.parent
		const class_name				= element_options.class_name
		const style						= element_options.style
		const data_set					= element_options.data_set || element_options.dataset
		const custom_function_events	= element_options.custom_function_events
		const title_label				= element_options.title_label || element_options.title
		const text_node					= element_options.text_node
		const text_content				= element_options.text_content
		const inner_html				= element_options.inner_html
		const href						= element_options.href
		const id						= element_options.id
		const draggable					= element_options.draggable
		const value						= element_options.value
		const download					= element_options.download
		const src						= element_options.src
		const placeholder				= element_options.placeholder
		const type						= element_options.type // Like button, text ..
		const target					= element_options.target
		
		const element = document.createElement(element_type);
	
		// Add id property to element
		if(id){
			element.id = id;
		}

		// A element. Add href property to element
		if(element_type==='a'){
			if(href){
				element.href = href;
			}else{
				element.href = 'javascript:;'
			}
			if (target) {
				element.target = target
			}		
		}
		
		// Class name. Add css classes property to element
		if(class_name){
			element.className = class_name
		}

		// Style. Add css style property to element
		if(style){
			for(key in style) {
				element.style[key] = style[key]
				//element.setAttribute("style", key +":"+ style[key]+";");
			}		
		}

		// Title . Add title attribute to element
		if(title_label){
			element.title = title_label
		}
	
		// Dataset Add dataset values to element		
		if(data_set){
			for (var key in data_set) {
				element.dataset[key] = data_set[key]
			}
		}

		// Value
		if(value){
			element.value = value
		}

		// Type
		if(type){
			//element.type = type
			element.setAttribute("type", type)
		}

		// Click event attached to element
		if(custom_function_events){
			const len = custom_function_events.length
			for (let i = 0; i < len; i++) {
				const function_name			= custom_function_events[i].name
				const event_type			= custom_function_events[i].type
				const function_arguments	= custom_function_events[i].function_arguments					

				// Create event caller
				this.create_custom_events(element, event_type, function_name, function_arguments)
			}
		}//end if(custom_function_events){
		
		// Text content 
		if(text_node){
			//element.appendChild(document.createTextNode(TextNode));
			// Parse html text as object
			if (element_type==='span') {
				element.textContent = text_node
			}else{
				const el = document.createElement('span')
					  // el.innerHTML = " "+text_node // Note that prepend a space to span for avoid Chrome bug on selection
					  el.insertAdjacentHTML('afterbegin', " "+text_node)
				element.appendChild(el)
			}			
		}else if(text_content) {
			element.textContent = text_content
		}else if(inner_html) {
			// element.innerHTML = inner_html
			element.insertAdjacentHTML('afterbegin', inner_html)
		}

		// Append created element to parent
		if (parent) {
			parent.appendChild(element)
		}

		// Dragable
		if(draggable){
			element.draggable = draggable;
		}

		// Download
		if (download) {
			element.setAttribute("download", download)
		}

		// SRC Add id property to element
		if(src){
			element.src = src;
		}

		// placeholder
		if (placeholder) {
			element.placeholder = placeholder
		}


		return element;
	}//end create_dom_element





}//end tree_factory


