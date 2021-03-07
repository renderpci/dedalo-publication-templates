/*global tstring, page_globals, SHOW_DEBUG, row_fields, common, page*/
/*eslint no-undef: "error"*/
"use strict";



function form_factory() {

	// vars
	// form_items. Array of form objects including properties and nodes
	this.form_items	= []
	// form element DOM node
	this.node		= null



	/**
	* ITEM_FACTORY
	*/
	this.item_factory = function(options) {

		const self = this

		// form_item. create new instance of form_item
			const form_item = self.build_form_item(options)

		// node
			self.build_form_node(form_item, options.parent)

		// callback
			if (typeof options.callback==="function") {
				options.callback(form_item)
			}

		// store current instance
			self.form_items[options.id] = form_item


		return form_item
	}//end item_factory



	/**
	* BUILD_FORM_ITEM
	* Every form input has a js object representation
	*/
	this.build_form_item = function(options) {

		// console.log("options.eq_in:", typeof options.eq_in, options.name);
		// console.log("options.eq_out:", typeof options.eq_out, options.name);

		const form_item = {
			id				: options.name,	// Like 'mint'
			name			: options.name, // Like 'mint'
			label			: options.label, // Used to placeholder too
			class_name 		: options.class_name || null,
			// search elements
			q				: options.q || "", // user keyboard enters values
			q_selected		: [], // user picked values from autocomplete options
			q_selected_eq	: options.q_selected_eq || "=", // default internal comparator used in autocomplete	with user picked values
			q_column		: options.q_column, // like 'term'
			q_splittable	: options.q_splittable || false, // depending on its value the item content will be splitted or not on loading it
			sql_filter		: options.sql_filter || null,
			// special double filters
			// q_table 		: options.q_table, // like 'mints'
			// q_table_name : 'term_table', // like 'term_table'
			// autocomplete options
			eq				: options.eq || "LIKE", // default internal comparator used in autocomplete
			eq_in			: typeof options.eq_in!=='undefined'  ? options.eq_in  : '', // used in autocomplete to define if term begins with .. o in the middle of..
			eq_out			: typeof options.eq_out!=='undefined' ? options.eq_out : '%', // used in autocomplete to define if term ends with .. o in the middle of..
			// category. thesurus terms and not terms
			is_term			: options.is_term || false, // terms use special json format as '["name"]' instead 'name'
			callback		: options.callback || false, // callback function
			list_format		: options.list_format || null,
			wrapper			: options.wrapper || null, // like YEAR to obtain YEAR(name)
			// nodes (are set on build_form_node)
			node_input		: null,
			node_values		: null,
			// input type and fixed values (case 'select')
			input_type		: options.input_type,
			input_values	: options.input_values
		}

		// add node
			// forms.build_form_node(form_item, options.parent)


		return form_item
	}//end build_form_item



	/**
	* BUILD_FORM_NODE
	*/
	this.build_form_node = function(form_item, parent) {
		// console.log("form_item:",form_item);
		// grouper
			const group = common.create_dom_element({
				element_type	: 'div',
				class_name 		: "form-group field " + form_item.class_name,
				parent 			: parent
			})

		// input
			switch(form_item.input_type) {

				case 'range_slider':
					const range_slider_labels = common.create_dom_element({
						element_type	: 'div',
						class_name		: "range_slider_labels",
						parent			: group
					})
					const range_slider_value_in = common.create_dom_element({
						element_type	: 'input',
						type			: 'text',
						id				: form_item.id + "_in",
						class_name		: "form-control range_slider_value value_in",
						parent			: range_slider_labels
					})
					const node_label = common.create_dom_element({
						element_type	: 'span',
						class_name		: "form-control range_slider_label node_label",
						inner_html		: form_item.label,
						parent			: range_slider_labels
					})
					const range_slider_value_out = common.create_dom_element({
						element_type	: 'input',
						type			: 'text',
						id				: form_item.id + "_out",
						class_name		: "form-control range_slider_value value_out",
						parent			: range_slider_labels
					})
					const node_slider = common.create_dom_element({
						element_type	: 'div',
						id				: form_item.id,
						class_name		: "form-control " + (form_item.class_name ? (' '+form_item.class_name) : ''),
						// value			: form_item.q || '',
						parent			: group
					})
					// node_select.addEventListener("change", function(e){
					// 		console.log("e.target.value:",e.target.value);
					// 	if (e.target.value) {
					// 		form_item.q = e.target.value
					// 		console.log("form_item:",form_item);
					// 	}
					// })
					form_item.node_input = node_slider
					break;

				case 'select':
					const node_select = common.create_dom_element({
						element_type	: 'select',
						id				: form_item.id,
						class_name		: "form-control ui-autocomplete-select" + (form_item.class_name ? (' '+form_item.class_name) : ''),
						value			: form_item.q || '',
						parent			: group
					})
					for (let i = 0; i < form_item.input_values.length; i++) {
						form_item.input_values[i]
						common.create_dom_element({
							element_type	: 'option',
							value			: form_item.input_values[i].value,
							inner_html		: form_item.input_values[i].label,
							parent			: node_select
						})
					}
					node_select.addEventListener("change", function(e){
							console.log("e.target.value:",e.target.value);
						if (e.target.value) {
							form_item.q = e.target.value
							console.log("form_item:",form_item);
						}
					})
					form_item.node_input = node_select
					break;

				default:
					const node_input = common.create_dom_element({
						element_type	: 'input',
						type			: 'text',
						id				: form_item.id,
						class_name		: "form-control ui-autocomplete-input" + (form_item.class_name ? (' '+form_item.class_name) : ''),
						placeholder		: form_item.label,
						value			: form_item.q || '',
						parent			: group
					})
					node_input.addEventListener("keyup", function(e){
						form_item.q = e.target.value
					})
					form_item.node_input = node_input
					break;
			}


		// values container (user selections)
			const node_values = common.create_dom_element({
				element_type	: 'div',
				// id			: form_item.name + '_values',
				class_name		: "container_values",
				parent			: group
			})
			form_item.node_values = node_values


		return true
	}//end build_form_node



	/**
	* BUILD_OPERATORS_NODE
	*/
	this.build_operators_node = function() {

		const group = common.create_dom_element({
			element_type	: "div",
			class_name 		: "form-group field field_operators"
		})

		const operator_label = common.create_dom_element({
			element_type	: "span",
			class_name 		: "radio operators",
			text_content 	: tstring["operator"] || "Operator",
			parent 			: group
		})
		// radio 1
		const radio1 = common.create_dom_element({
			element_type	: "input",
			type 			: "radio",
			id 				: "operator_or",
			parent 			: group
		})
		radio1.setAttribute("name","operators")
		radio1.setAttribute("value","OR")
		const radio1_label = common.create_dom_element({
			element_type	: "label",
			text_content 	: tstring["or"] || "or",
			parent 			: group
		})
		radio1_label.setAttribute("for","operator_or")
		// radio 2
		const radio2 = common.create_dom_element({
			element_type	: "input",
			type 			: "radio",
			id 				: "operator_and",
			name 			: "operators",
			parent 			: group
		})
		radio2.setAttribute("name","operators")
		radio2.setAttribute("value","AND")
		radio2.setAttribute("checked","checked")
		const radio2_label = common.create_dom_element({
			element_type	: "label",
			text_content 	: tstring["and"] || "and",
			parent 			: group
		})
		radio2_label.setAttribute("for","operator_and")


		return group
	}//end build_operators_node



	/**
	* ADD_SELECTED_VALUE
	*/
	this.add_selected_value = function(form_item, label, value) {

		const container = form_item.node_values

		// Check if already exists
			const inputs		= container.querySelectorAll(".input_values")
			const inputs_length	= inputs.length
			for (let i = inputs_length - 1; i >= 0; i--) {
				if (value===inputs[i].value) return false;
			}

		// Create new line
			const line = common.create_dom_element({
				element_type	: "div",
				class_name		: "line_value",
				parent			: container
			})

		// trash.
			// awesome font 4 <i class="fal fa-trash-alt"></i>
			// awesome font 5 <i class="far fa-trash-alt"></i>
			const trash = common.create_dom_element({
				element_type	: "i",
				class_name		: "icon remove fal far fa-trash fa-trash-alt", //  fa-trash awesome font 4
				parent			: line
			})
			trash.addEventListener("click",function(){

				// remove from form_item q_selected
				const index = form_item.q_selected.indexOf(value);
				if (index > -1) {
					// remove array element
					form_item.q_selected.splice(index, 1);

					// remove dom node
					this.parentNode.remove()

					// debug
					if(SHOW_DEBUG===true) {
						console.log("form_item.q_selected removed value:",value,form_item.q_selected);
					}
				}
			})

		// label
			const value_label = common.create_dom_element({
				element_type	: "span",
				class_name		: "value_label",
				inner_html		: label,
				parent			: line
			})

		// input
			const input = common.create_dom_element({
				element_type	: "input",
				class_name		: "input_values",
				parent			: line
			})
			input.value = value

		// add to form_item
			form_item.q_selected.push(value)

		// clean values
			form_item.node_input.value	= ""
			form_item.q					= ""


		return true
	}//end add_selected_value



	/**
	* SET_INPUT_VALUE
	* Set a q value to a form item
	*/
	this.set_input_value = function(form_item, value) {

		// add value
			form_item.node_input.value	= value
			form_item.q					= value

		return true
	}//end set_input_value



	/**
	* BUILD_FILTER
	* Creates a complete sqo filter using form items values
	*/
	this.build_filter = function() {

		const self = this

		const form_items = self.form_items
			// console.log("form_items:",form_items);

		const ar_query_elements = []
		for (let [id, form_item] of Object.entries(form_items)) {

			const current_group = []

			const group_op = (form_item.is_term===true) ? "OR" : "AND"
			const group = {}
				  group[group_op] = []

			// q value or sql_filter
				if ( (form_item.q.length!==0 && form_item.q!=='*') || form_item.sql_filter ) {

					const c_group_op = 'AND'
					const c_group = {}
						  c_group[c_group_op] = []

					// escape html strings containing single quotes inside.
					// Like 'leyend <img data="{'lat':'452.6'}">' to 'leyend <img data="{''lat'':''452.6''}">'
					const safe_value = form_item.q.replace(/(')/g, "''")

					// q element
						const element = {
							field		: form_item.q_column,
							value		: `'${form_item.eq_in}${safe_value}${form_item.eq_out}'`, // Like '%${form_item.q}%'
							op			: form_item.eq, // default is 'LIKE'
							sql_filter	: form_item.sql_filter,
							wrapper		: form_item.wrapper
						}

						c_group[c_group_op].push(element)

					// q_table element
						// if (form_item.q_table && form_item.q_table!=="any") {

						// 	const element_table = {
						// 		field	: form_item.q_table_name,
						// 		value	: `'${form_item.q_table}'`,
						// 		op		: '='
						// 	}

						// 	c_group[c_group_op].push(element_table)
						// }

					// add basic group
						group[group_op].push(c_group)
				}

			// q_selected values
				if (form_item.q_selected.length!==0) {

					for (let j = 0; j < form_item.q_selected.length; j++) {

						const value = form_item.q_selected[j]
						// escape html strings containing single quotes inside.
						// Like 'leyend <img data="{'lat':'452.6'}">' to 'leyend <img data="{''lat'':''452.6''}">'
						const safe_value = value.replace(/(')/g, "''")

						const c_group_op = "AND"
						const c_group = {}
							  c_group[c_group_op] = []

						// elemet
						const element = {
							field		: form_item.q_column,
							value		: (form_item.q_selected_eq==="LIKE") ? `'%${safe_value}%'` : `'${safe_value}'`,
							op			: form_item.q_selected_eq,
							sql_filter	: form_item.sql_filter,
							wrapper		: form_item.wrapper
						}

						c_group[c_group_op].push(element)

						// q_table element
							// if (form_item.q_table && form_item.q_table!=="any") {

							// 	const element_table = {
							// 		field	: form_item.q_table_name,
							// 		value	: `'${form_item.q_table}'`,
							// 		op		: '='
							// 	}

							// 	c_group[c_group_op].push(element_table)
							// }

						group[group_op].push(c_group)
					}
				}

			if (group[group_op].length>0) {
				ar_query_elements.push(group)
			}
		}

		// debug
			if(SHOW_DEBUG===true) {
				console.log("self.form_items:",self.form_items);
				console.log("ar_query_elements:",ar_query_elements);
			}

		// empty form case
			if (ar_query_elements.length<1) {
				console.warn("-> form_to_sql_filter empty elements selected:", ar_query_elements)
				return false;
			}

		// operators value (optional)
			const input_operators = self.node.querySelector('input[name="operators"]')
			const operators_value = input_operators
				? self.node.querySelector('input[name="operators"]:checked').value
				: "AND";

		// filter object
			const filter = {}
				  filter[operators_value] = ar_query_elements


		return filter
	}//end build_filter



	/**
	* PARSE_SQL_FILTER
	* Convert filter object to plain sql code ready to send to database
	* @param object filter
	* @return string
	*/
	this.parse_sql_filter = function(filter, group){

		const self = this

		const sql_filter = (filter)
			? (function() {

				const op		= Object.keys(filter)[0]
				const ar_query	= filter[op]

				const ar_filter = []
				const ar_query_length = ar_query.length
				for (let i = 0; i < ar_query_length; i++) {

					const item = ar_query[i]

					const item_op = Object.keys(item)[0]
					if(item_op==="AND" || item_op==="OR") {

						// recursion
						const current_filter_line = "" + self.parse_sql_filter(item, group) + ""
						ar_filter.push(current_filter_line)
						continue;
					}

					// item_field
						const item_field = (item.wrapper && item.wrapper.length>0) // like YEAR
							? item.wrapper + "(" + item.field + ")"
							: item.field

					let filter_line
					// if (item.op==='MATCH') {
					// 	filter_line = "MATCH (" + item.field + ") AGAINST ("+item.value+" IN BOOLEAN MODE)"
					// }else{
					// 	filter_line = (item.field.indexOf("AS")!==-1)
					// 		? "" +item.field+""  +" "+ item.op +" "+ item.value
					// 		: "`"+item.field+"`" +" "+ item.op +" "+ item.value
					// }
					if (item.sql_filter && item.sql_filter.length>0) {
						filter_line = item.sql_filter
					}else if (item.op==='MATCH') {
						filter_line = "MATCH (" + item_field + ") AGAINST ("+item.value+" IN BOOLEAN MODE)"
					}else{
						filter_line = (item_field.indexOf("AS")!==-1 || (item.wrapper && item.wrapper.length>0))
							? "" +item_field+""  +" "+ item.op +" "+ item.value + (" AND "+item_field+"!=''")
							: "`"+item_field+"`" +" "+ item.op +" "+ item.value	+ (" AND `"+item_field+"`!=''")
					}

					ar_filter.push(filter_line)

					// group
						if (group && item.group) {
							group.push(item.group)
						}
				}

				return ar_filter.join(" "+op+" ")
			  })()
			: null

		return sql_filter
	}//end parse_sql_filter



	/**
	* FULL_TEXT_SEARCH_OPERATORS_INFO
	* @return
	*/
	this.full_text_search_operators_info = function() {

		const grid = common.create_dom_element({
			element_type	: "div",
			class_name		: "full_text_search_operators_info"
		})

		const pairs = [
			{
				op		: tstring.operator,
				info	: tstring.description
			},
			{
				op		: "+",
				info	: tstring.include_the_word || "Include, the word must be present."
			},
			{
				op		: "-",
				info	: tstring.exclude_the_word || "Exclude, the word must not be present."
			},
			{
				op		: ">",
				info	: tstring.increase_ranking || "Include, and increase ranking value."
			},
			{
				op		: "<",
				info	: tstring.decrease_ranking || "Include, and decrease the ranking value."
			},
			{
				op		: "()",
				info	: tstring.group_words || "Group words into subexpressions (allowing them to be included, excluded, ranked, and so forth as a group)."
			},
			{
				op		: "~",
				info	: tstring.negate_word || "Negate a word’s ranking value."
			},
			{
				op		: "*",
				info	: tstring.wildcard_at_end || "Wildcard at the end of the word."
			},
			{
				op		: "“”",
				info	: tstring.defines_phrase || "Defines a phrase (as opposed to a list of individual words, the entire phrase is matched for inclusion or exclusion)."
			}
		]

		for (let i = 0; i < pairs.length; i++) {

			common.create_dom_element({
				element_type	: "div",
				class_name		: "op",
				text_content	: pairs[i].op,
				parent			: grid
			})

			common.create_dom_element({
				element_type	: "div",
				class_name		: "info",
				text_content	: pairs[i].info,
				parent			: grid
			})
		}

		return grid
	}//end full_text_search_operators_info



	/**
	* ACTIVATE_AUTOCOMPLETE
	* Generic autocomplete activation with support for HTML (Scott González)
	* @param object options
	*/
	this.activate_autocomplete = function(options) {

		const self = this

		// options
			const form_item		= options.form_item;
			const limit			= options.limit || 30;
			const table			= options.table || form_item.table;
			const cross_filter	= options.cross_filter || true; // look the other form values to generate the sql filter (default true)
			const order			= options.order || 'name ASC'; // 'name' is the generic column alias


		/*
		 * jQuery UI Autocomplete HTML Extension
		 *
		 * Copyright 2010, Scott González (http://scottgonzalez.com)
		 * Dual licensed under the MIT or GPL Version 2 licenses.
		 *
		 * http://github.com/scottgonzalez/jquery-ui-extensions
		 */
		(function( $ ) {

			var proto = $.ui.autocomplete.prototype,
				initSource = proto._initSource;

			function filter( array, term ) {
				var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
				return $.grep( array, function(value) {
					return matcher.test( $( "<div>" ).html( value.label || value.value || value ).text() );
				});
			}

			$.extend( proto, {
				_initSource: function() {
					if ( this.options.html && $.isArray(this.options.source) ) {
						this.source = function( request, response ) {
							response( filter( this.options.source, request.term ) );
						};
					} else {
						initSource.call( this );
					}
				},

				_renderItem: function( ul, item) {

					var final_label = item.label

					// remove empty values when separator is present
						var ar_parts 	= final_label.split(' | ')
						var ar_clean 	= []
						for (var i = 0; i < ar_parts.length; i++) {
							var current = ar_parts[i]
							if (current.length>1 && current!=='<i>.</i>') {
								ar_clean.push(current)
							}
						}
						final_label = ar_clean.join(' | ') // overwrite

					return $( "<li class=\"ui-menu-item\"></li>" )
						.data( "item.autocomplete", item )
						//.append( $( "<a></a>" )[ this.options.html ? "html" : "text" ]( item.label ) )
						.append( $( "<div class=\"ui-menu-item-wrapper\"></div>" )[ this.options.html ? "html" : "text" ]( final_label ) )
						.appendTo( ul );
				}
			});

		})( jQuery );


		const cache = {}
		$(form_item.node_input).autocomplete({
			delay		: 150,
			minLength	: 0,
			html		: true,
			source		: function( request, response ) {

				const term = request.term

				const field		= form_item.q_name // Like 'mint'
				const q_column	= form_item.q_column // Like 'term'

				// filter build
					const op 	 = "AND"
					const filter = {}
						  filter[op] = []

					const value_parsed = (form_item.eq_in) + term + (form_item.eq_out)

					// main column search item
						filter[op].push({
							field	: q_column,
							value	: `'${value_parsed}'`,
							op		: form_item.eq, // 'LIKE',
							group	: q_column
						})

					// optional second column 'term_table' search item. Add column name filter
						// const q_table	= form_item.q_table
						// if (q_table!=="any") {
						// 	filter[op].push({
						// 		field	: "term_table",
						// 		value	: `'${q_table}'`,
						// 		op		: '='
						// 	})
						// }

					// cross filter. Add other selected values to the filter to create a interactive filter
						if (cross_filter) {
							const c_op		= "OR"
							const c_filter	= {}
								  c_filter[c_op] = []
							for (let [id, current_form_item] of Object.entries(self.form_items)) {
								if (current_form_item.id===form_item.id) continue; // skip self

								// q . Value from input
									if ((current_form_item.q.length!==0 && current_form_item.q!=='*') || current_form_item.sql_filter) {

										// q element
											const element = {
												field		: current_form_item.q_column,
												value		: `'%${current_form_item.q}%'`,
												op			: "LIKE", // fixed as 'LIKE'
												sql_filter	: current_form_item.sql_filter,
												wrapper		: current_form_item.wrapper
											}

											c_filter[c_op].push(element)
									}

								// q_selected. Values from user already selected values
									if (current_form_item.q_selected.length!==0) {

										for (let k = 0; k < current_form_item.q_selected.length; k++) {

											const value = current_form_item.q_selected[k]

											// escape html strings containing single quotes inside.
											// Like 'leyend <img data="{'lat':'452.6'}">' to 'leyend <img data="{''lat'':''452.6''}">'
											const safe_value = value.replace(/(')/g, "''")

											// elemet
											const element = {
												field		: current_form_item.q_column,
												value		: (current_form_item.is_term===true) ? `'%"${safe_value}"%'` : `'${safe_value}'`,
												op			: (current_form_item.is_term===true) ? "LIKE" : "=",
												sql_filter	: current_form_item.sql_filter,
												wrapper		: current_form_item.wrapper
											}

											c_filter[c_op].push(element)
										}
									}
							}
							if (c_filter[c_op].length>0) {
								filter[op].push(c_filter)
							}
						}

					// cache . Use only when there are no cross filters
						if (filter[op].length===1) {
							if ( term in cache ) {
								if(SHOW_DEBUG===true) {
									console.warn("Returning values from cache:", cache[term])
								}
								response( cache[ term ] );
								return;
							}
						}

					// sql_filter
						const sql_filter = self.parse_sql_filter(filter) // + ' AND `'+q_column+'`!=\'\''

					// search
						data_manager.request({
							body : {
								dedalo_get	: 'records',
								table		: table,
								ar_fields	: [q_column + " AS name"],
								sql_filter	: sql_filter,
								group		: q_column,
								limit		: limit,
								order		: order
							}
						})
						.then((api_response) => { // return results in standard format (label, value)
							console.log("-->autocomplete api_response:", api_response);
							const result = api_response.result

							const ar_result	= []
							const len		= result.length
							for (let i = 0; i < len; i++) {

								const item = result[i]

								const current_ar_value = (item.name.indexOf("[\"")===0)
									? JSON.parse(item.name)
									: [item.name]

								for (let j = 0; j < current_ar_value.length; j++) {

									const item_name = current_ar_value[j]
									// const item_name = item.name.replace(/[\["|"\]]/g, '')

									const found = ar_result.find(el => el.value===item_name)
									if (!found) {
										ar_result.push({
											label	: item_name, // item_name,
											value	: item_name // item.name
										})
									}
								}
							}

							// parse result
								function parse_result(ar_result, term) {
									return ar_result.map(function(item){
										item.label	= item.label.replace(/<br>/g," ")
										item.label	= page.parse_legend_svg(item.label)
										return item
									})
								}
								const ar_result_final = parse_result(ar_result, term)
									// console.log("ar_result_final:",ar_result_final);

							// cache . Use only when there are no cross filters
								if (filter[op].length===1) {
									cache[ term ] = ar_result_final
								}

							// debug
								if(SHOW_DEBUG===true) {
									// console.log("--- autocomplete api_response:",api_response);
									// console.log("autocomplete ar_result_final:",ar_result_final);
								}

							response(ar_result_final)
						})
			},
			// When a option is selected in list
			select: function( event, ui ) {
				// prevent set selected value to autocomplete input
				event.preventDefault();

				self.add_selected_value(form_item, ui.item.label, ui.item.value)

				// reset input value
				this.value = ''

				return false;
			},
			// When a option is focus in list
			focus: function() {
				// prevent value inserted on focus
				return false;
			},
			close: function( event, ui ) {

			},
			change: function( event, ui ) {

			},
			response: function( event, ui ) {
				//console.log(ui);
			}
		})
		.on("keydown", function( event ) {
			//return false
			//console.log(event)
			if ( event.keyCode===$.ui.keyCode.ENTER  ) {
				// prevent set selected value to autocomplete input
				//event.preventDefault();
				//var term = $(this).val();
				$(this).autocomplete('close')
			}//end if ( event.keyCode===$.ui.keyCode.ENTER  )
		})// bind
		.focus(function() {
		    $(this).autocomplete('search', null)
		})
		// .blur(function() {
		//     //$(element).autocomplete('close');
		// })


		return true
	}//end activate_autocomplete



	/**
	* FORM_TO_SQL_FILTER (DEPRECATED!)
	* Builds a plain sql filter from the form nodes values
	*/
	this.form_to_sql_filter = function(options) {
		console.error("WARNING! form_to_sql_filter is DEPRECATED! Use build_filter instead!");

		const self = this

		// options
			const form_node = options.form_node

		// short vars
			const form_items = self.form_items


		const ar_query_elements = []
		for (let [id, form_item] of Object.entries(form_items)) {

			const current_group = []

			const group_op = "AND"
			const group = {}
				  group[group_op] = []

			// q value
				if (form_item.q.length!==0) {

					const c_group_op = 'AND'
					const c_group = {}
						  c_group[c_group_op] = []

					const value_parsed = (form_item.eq_in) + form_item.q + (form_item.eq_out)

					// q element
						const element = {
							field	: form_item.q_column,
							value	: `'${form_item.q}'`,
							op		: form_item.eq // default is 'LIKE'
						}

						c_group[c_group_op].push(element)

					// add basic group
						group[group_op].push(c_group)
				}

			// q_selected values
				if (form_item.q_selected.length!==0) {

					for (let j = 0; j < form_item.q_selected.length; j++) {

						// value
							const value = form_item.q_selected[j]

							// escape html strings containing single quotes inside.
							// Like 'leyend <img data="{'lat':'452.6'}">' to 'leyend <img data="{''lat'':''452.6''}">'
							const safe_value = value.replace(/(')/g, "''")

						const c_group_op = "AND"
						const c_group = {}
							  c_group[c_group_op] = []

						// elemet
						const element = {
							field	: form_item.q_column,
							value	: (form_item.is_term===true) ? `'%"${safe_value}"%'` : `'${safe_value}'`,
							op		: (form_item.is_term===true) ? "LIKE" : "="
						}
						c_group[c_group_op].push(element)

						group[group_op].push(c_group)
					}
				}

			if (group[group_op].length>0) {
				ar_query_elements.push(group)
			}
		}

		// debug
			if(SHOW_DEBUG===true) {
				console.log("self.form_items:",self.form_items);
				console.log("ar_query_elements:",ar_query_elements);
			}

		// empty form case
			if (ar_query_elements.length<1) {
				console.warn("-> form_to_sql_filter empty elements selected:", ar_query_elements)
				return null
			}

		// operators value
			const input_operators = form_node.querySelector('input[name="operators"]')
			const operators_value = input_operators
				? form_node.querySelector('input[name="operators"]:checked').value
				: "AND";

			const filter = {}
				  filter[operators_value] = ar_query_elements

		// debug
			if(SHOW_DEBUG===true) {
				console.log("-> form_to_sql_filter filter:",filter)
			}

		// sql_filter
			const sql_filter = self.parse_sql_filter(filter)


		return sql_filter
	}//end form_to_sql_filter



}//end form_factory
