/*global tstring, page_globals, SHOW_DEBUG, row_fields, common, page*/
/*eslint no-undef: "error"*/

"use strict";



function timeline_factory() {



	/**
	* VARS
	*/
		// target. DOM element where timeline section is placed
			this.target	= null
		
		// data. Database parsed rows data to create the map
			this.data = null

		// container. Where block nodes are placed
			this.container = null

		// scroll_activated. Scroll activation state
			this.scroll_activated = false

		// block_builder. Function that manage node creation of each block
			this.block_builder = null	

		// max_group_nodes
			this.max_group_nodes = null



	/**
	* INIT
	*/
	this.init = function(options) {
		
		const self = this

		// options
			// target. DOM element where map is placed
			self.target				= options.target
			// block_builder. Use custom options block_builder function
			self.block_builder		= options.block_builder
			// max_group_nodes
			self.max_group_nodes	= options.max_group_nodes || 10

		return new Promise(function(resolve){

			// build wrapper
				const section = common.create_dom_element({
					element_type	: "section",
					class_name		: "cd-timeline js-cd-timeline"
				})
				// set and fix container (where block nodes will be placed)
				self.container = common.create_dom_element({
					element_type	: "div",
					class_name		: "container max-width-lg cd-timeline__container",
					parent			: section
				})

				// activate_timeline_scroll
					//self.activate_timeline_scroll()
		
				self.target.appendChild(section)

			resolve(true)
		})
	}//end init



	/**
	* RENDER_TIMELINE
	*/
	this.render_timeline = function(options) {
		if(SHOW_DEBUG===true) {
			console.log("-> render_timeline options:",options);
		}
		
		const self = this

		// options
			// data. Preparsed data from rows. Contains items with properties 'lat', 'lon', and 'data' like [{lat: lat, lon: lon, data: []}]
			self.data = options.data
	
		return new Promise(function(resolve) {
					
			// parse_data. Create individual blocks for each data row
				self.parse_data_to_timeline(self.data)
				.then(function(){

					// activate_timeline_scroll
						common.when_in_dom(self.target, function(){
							self.activate_timeline_scroll()
						})						
					
					resolve(true)
				})
		})	
	}//end render_timeline



	/**
	* PARSE_DATA_TO_TIMELINE
	* @return promise
	*/
	this.parse_data_to_timeline = function(data) {
		
		const self = this

		return new Promise(function(resolve){		

			const fragment = new DocumentFragment();

			const data_length = data.length			
			for (let i = 0; i < data_length; i++) {
				
				const row = data[i]

				// build timeline block
					// const block = self.block_builder(row, self.container.lastChild)
					const block = self.block_builder(row, self.max_group_nodes)

				// add
					fragment.appendChild(block)
			}

			// add all nodes in one operation
				self.container.appendChild(fragment)

			// debug
				if(SHOW_DEBUG===true) {
					// Check if total number of groups and total number of items shown are correct
						// const total_bloques	= self.container.getElementsByClassName("cd-timeline__block").length
						// const total_items	= self.container.getElementsByClassName("block_item").length
						// console.log("total bloques:",total_bloques)
						// console.log("total items:",total_items)
				}
		
			resolve(fragment)
		})
	}//end parse_data_to_timeline



	/**
	* ACTIVATE_TIMELINE_SCROLL
	*/
	this.activate_timeline_scroll = function() {

		if (self.scroll_activated===true) {
			// return false
		}
		
		(function(){
		  // Vertical Timeline - by CodyHouse.co
			function VerticalTimeline( element ) {
				this.element	= element;
				this.blocks		= this.element.getElementsByClassName("cd-timeline__block");
				this.images		= this.element.getElementsByClassName("cd-timeline__img");
				this.contents	= this.element.getElementsByClassName("cd-timeline__content");
				this.offset		= 0.8; //0.8;
				this.hideBlocks();
			};

			VerticalTimeline.prototype.hideBlocks = function() {
				if ( !"classList" in document.documentElement ) {
					return; // no animation on older browsers
				}

				// hide timeline blocks which are outside the viewport
					const self = this;
					const blocks_count = this.blocks.length;
					for( let i = 0; i < blocks_count; i++) {
						(function(i){
							if( self.blocks[i].getBoundingClientRect().top > window.innerHeight*self.offset ) {
								self.images[i].classList.add("cd-timeline__img--hidden"); 
								self.contents[i].classList.add("cd-timeline__content--hidden"); 
							}
						})(i);
					}
			};

			VerticalTimeline.prototype.showBlocks = function() {
				if ( ! "classList" in document.documentElement ) {
					return;
				}

				const self = this;
				const blocks_count = this.blocks.length;
				for( let i = 0; i < blocks_count; i++) {							
			
					(function(i){

						if( self.contents[i].classList.contains("cd-timeline__content--hidden"))  {
							
							const block_top			= self.blocks[i].getBoundingClientRect().top
							const window_compare	= window.innerHeight*self.offset
								// console.log("block_top, innerHeight, window_compare:", block_top, window.innerHeight, window_compare);

							if(block_top <= window_compare) {
								// add bounce-in animation
								self.images[i].classList.add("cd-timeline__img--bounce-in");
								self.contents[i].classList.add("cd-timeline__content--bounce-in");
								// remove hidden
								self.images[i].classList.remove("cd-timeline__img--hidden");
								self.contents[i].classList.remove("cd-timeline__content--hidden");
								// console.log("blocks_count:",blocks_count);
							}
						}
					})(i);				
				}				
			};

			const verticalTimelines			= document.getElementsByClassName("js-cd-timeline")
			const verticalTimelinesArray	= []
			let	scrolling					= false
			if(verticalTimelines.length>0) {
				
				for( let i = 0; i < verticalTimelines.length; i++) {
					(function(i){
						verticalTimelinesArray.push(new VerticalTimeline(verticalTimelines[i]));
					})(i);
				}

				const timeline_container = document.getElementsByClassName("cd-timeline__container")
				
				// show timeline blocks on scrolling
					window.addEventListener("scroll", function(event) {
					
						if( !scrolling ) {
							scrolling = true;
							(!window.requestAnimationFrame)
								? setTimeout(checkTimelineScroll, 250) 
								: window.requestAnimationFrame(checkTimelineScroll);
						}
					})
			}//end if(verticalTimelines.length>0)

			function checkTimelineScroll() {
				verticalTimelinesArray.forEach(function(timeline){
					timeline.showBlocks();
				});
				scrolling = false;
			};
		})();

		// fix state
			self.scroll_activated = true


		return true
	}//end activate_timeline_scroll



}//end timeline_factory