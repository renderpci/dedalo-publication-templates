/*global tstring, page_globals, SHOW_DEBUG, row_fields, common, page, forms, document, DocumentFragment, tstring, console */
/*eslint no-undef: "error"*/
"use strict";
/**
* COMMON JS
*
*
*/
var common = {



	/**
	* GET_JSON_DATA
	* Exec a XMLHttpRequest to trigger url and return a promise with object response
	*/
	get_json_data : function(trigger_url, trigger_vars, async) {
		
		const	url		= trigger_url + "?d=" + Date.now();
		const data_send = JSON.stringify(trigger_vars)
		
		var isIE 	= (navigator.userAgent.indexOf("MSIE") != -1)
		var isiE11 	= /rv:11.0/i.test(navigator.userAgent)		
		if (isIE || isiE11) {
			var warning_ms = tstring.incompatible_browser || "Warning: Internet explorer is not supported. Please use a modern browser like Chrome, Firefox, Safari, Opera, Edje.."
			alert(warning_ms)
			return false
		}	

		// ASYNC
		if (typeof async=="undefined") {
			async = true
		}
	
		// Create new promise with the Promise() constructor;
		// This has as its argument a function
		// with two parameters, resolve and reject
		return new Promise(function(resolve, reject) {
			// Standard XHR to load an image
			var request = new XMLHttpRequest();
				request.open('POST', url, async);
				//codification of the header for POST method, in GET no is necesary
				request.setRequestHeader("Content-type", "application/json"); // application/json application/x-www-form-urlencoded
				request.responseType = 'json';
				// When the request loads, check whether it was successful
				request.onload = function(e) {
				  if (request.status === 200) {
					// If successful, resolve the promise by passing back the request response
					resolve(request.response);
				  }else{
					// If it fails, reject the promise with a error message
					reject(Error('Reject error. Data don\'t load. error code: ' + request.statusText + " - url: " + url));
				  }
				};
				request.onerror = function(e) {			
				  // Also deal with the case when the entire request fails to begin with
				  // This is probably a network error, so reject the promise with an appropriate message
				  reject(Error('There was a network error. data_send: '+url+"?"+ data_send + "statusText: " + request.statusText));
				};

		  // Send the request
		  request.send(data_send);
		});
	},//end get_json



	/**
	* CREATE_DOM_ELEMENT
	* Builds single dom element
	*/
	create_dom_element : function(element_options) {
		
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
	},//end create_dom_element



	// /**
	// * BUILD_PLAYER
	// * @return dom element vide
	// */
	// build_player : function(options) {
	// 	if(SHOW_DEBUG===true) {
	// 		console.log("[common.build_player] options",options)
	// 	}

	// 	const self = this		
		
	// 	var type = options.type || ["video/mp4"]
	// 	var src  = options.src  || [""]
	// 	if (!Array.isArray(src)) {
	// 		src = [src]
	// 	}

	// 	// video
	// 		var video = document.createElement("video")
	// 			video.id 			= options.id || "video_player"
	// 			video.controls 		= options.controls || true
	// 			video.poster 		= options.poster || ""
	// 			video.className 	= options.class || "video-js video_hidden"
	// 			video.preload 		= options.preload || "auto"
	// 			video.dataset.setup = '{}' // {"trackTimeOffset":<?php echo $trackTimeOffset ?>}

	// 			if (options.height) {
	// 				video.height = options.height
	// 			}
	// 			if (options.width) {
	// 				video.width = options.width
	// 			}

	// 	// src			
	// 		for (let i = 0; i < src.length; i++) {			
	// 			var source = document.createElement("source")
	// 				source.src  = src[i]
	// 				source.type = type[i]
	// 			video.appendChild(source)
	// 		}
	// 		const base_url 	= src[0]
	// 		const tcin_secs = parseInt( self.get_query_variable( base_url, "vbegin" ) )
		
	// 	// subtitles
	// 		// <track src=\"$subtitles_file_url\" kind=\"$vtt_kind\" srclang=\"en\" label=\"English\" default>
	// 		// <track kind="subtitles" src="http://example.com/path/to/captions.vtt" srclang="en" label="English" default>
	// 		var ar_subtitles = options.ar_subtitles || null
	// 		if (ar_subtitles) {			
	// 			for (var i = 0; i < ar_subtitles.length; i++) {
	// 				var subtitle_obj = ar_subtitles[i]
	// 				// Build track
	// 				var track = document.createElement("track")
	// 					track.kind 		= "subtitles"
	// 					track.src 		= subtitle_obj.src
	// 					track.srclang 	= subtitle_obj.srclang
	// 					track.label 	= subtitle_obj.label
	// 					//if (track.default) {
	// 					//	video.default = options.default
	// 					//}
	// 					if (subtitle_obj.srclang===options.default) {
	// 						track.default = true
	// 					}						
	// 				video.appendChild(track)				
	// 			}//end for (var i = 0; i < ar_subtitles.length; i++)
	// 		}

	// 	// msj no html5 
	// 		var msg_no_js = document.createElement("p")
	// 			msg_no_js.className = "vjs-no-js"
	// 		var msj_text = document.createTextNode("To view this video please enable JavaScript, and consider upgrading to a web browser that supports HTML5 video")
	// 			msg_no_js.appendChild(msj_text)
	// 		video.appendChild(msg_no_js)

	// 	/*
	// 		<video id="my-video" class="video-js" controls preload="auto" width="640" height="264" poster="MY_VIDEO_POSTER.jpg" data-setup="{}">
	// 		<source src="MY_VIDEO.mp4" type='video/mp4'>
	// 		<source src="MY_VIDEO.webm" type='video/webm'>
	// 		<p class="vjs-no-js">
	// 		  To view this video please enable JavaScript, and consider upgrading to a web browser that
	// 		  <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
	// 		</p>
	// 		</video>
	// 		*/

	// 	// Activate
	// 		var player 
	// 		setTimeout(function(){

	// 			window.ready(function(e){
					
	// 				// player set
	// 					player = videojs(video)

	// 					player.ready(function() {
	// 							// show hidden element
	// 								this.addClass('video_show');
	// 								//this.removeClass('video_hide')
	// 								//this.removeClass('video_hide');
	// 								//this.removeClass('video_hide')
	// 								//console.log("+++++ e:",this);

	// 							// restricted fragments. Set ar_restricted_fragments on build player to activate skip restricted fragments
	// 								if (typeof options.ar_restricted_fragments!=="undefined" && options.ar_restricted_fragments.length>0) {										
	// 									this.on('timeupdate', function(e){
	// 										self.skip_restricted(this, options.ar_restricted_fragments, tcin_secs);
	// 									});
	// 								}
	// 					});
						
	// 				// Optional play
	// 					if (options.play===true) {
	// 						player.play()
	// 					}
	// 			})//end window.ready(function(e)
				
	// 		}, 1)
			
			
	// 	return video
	// },//end build_player



	/**
	* BUILD_PLAYER
	* @return DOM element video
	*/
	build_player : function(options) {
		if(SHOW_DEBUG===true) {
			console.log("[common.build_player] options",options)
		}

		const self = this		
		
		var type = options.type || ["video/mp4"]
		var src  = options.src  || [""]
		if (!Array.isArray(src)) {
			src = [src]
		}

		// video
			const video = document.createElement("video")
				video.id 			= options.id || "video_player"
				video.controls 		= options.controls || true
				video.poster 		= options.poster || common.get_posterframe_from_video(src)
				video.className 	= options.class || "video-js video_hidden hide"
				video.preload 		= options.preload || "auto"
				video.dataset.setup = '{}' // {"trackTimeOffset":<?php echo $trackTimeOffset ?>}

				if (options.height) {
					video.height = options.height
				}
				if (options.width) {
					video.width = options.width
				}

		// src			
			for (let i = 0; i < src.length; i++) {			
				const source = document.createElement("source")
					  source.src	= src[i]
					  source.type	= type[i]
				video.appendChild(source)
			}
			
		// subtitles
			// <track src=\"$subtitles_file_url\" kind=\"$vtt_kind\" srclang=\"en\" label=\"English\" default>
			// <track kind="subtitles" src="http://example.com/path/to/captions.vtt" srclang="en" label="English" default>
			const ar_subtitles = options.ar_subtitles || null
			if (ar_subtitles) {			
				for (let i = 0; i < ar_subtitles.length; i++) {
					const subtitle_obj = ar_subtitles[i]

					// Build track
					const track = document.createElement("track")
						track.kind 		= "subtitles"
						track.src 		= subtitle_obj.src
						track.srclang 	= subtitle_obj.srclang
						track.label 	= subtitle_obj.label
						//if (track.default) {
						//	video.default = options.default
						//}
						if (subtitle_obj.srclang===options.default) {
							track.default = true
						}
									
					video.appendChild(track)				
				}//end for (var i = 0; i < ar_subtitles.length; i++)
			}

		// msj no html5 
			const msg_no_js = document.createElement("p")
				msg_no_js.className = "vjs-no-js"
			const msj_text = document.createTextNode("To view this video please enable JavaScript, and consider upgrading to a web browser that supports HTML5 video")
				msg_no_js.appendChild(msj_text)
			video.appendChild(msg_no_js)

		/*
			<video id="my-video" class="video-js" controls preload="auto" width="640" height="264" poster="MY_VIDEO_POSTER.jpg" data-setup="{}">
			<source src="MY_VIDEO.mp4" type='video/mp4'>
			<source src="MY_VIDEO.webm" type='video/webm'>
			<p class="vjs-no-js">
			  To view this video please enable JavaScript, and consider upgrading to a web browser that
			  <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
			</p>
			</video>
			*/

		// Activate
			setTimeout(function(){

				window.ready(function(e){
					
					// player set
						const player = videojs(video)

						player.ready(function() {
							// show hidden element
								this.addClass('video_show');
								this.removeClass('hide')

							// restricted fragments. Set ar_restricted_fragments on build player to activate skip restricted fragments
								if (typeof options.ar_restricted_fragments!=="undefined" && options.ar_restricted_fragments.length>0) {										
									const base_url 	= src[0]
									const tcin_secs = parseInt( self.get_query_variable( base_url, "vbegin" ) )		
									this.on('timeupdate', function(e){
										self.skip_restricted(this, options.ar_restricted_fragments, tcin_secs);
									});										
								}
						});
						
					// Optional play
						if (options.play===true) {
							player.play()
						}
				})//end window.ready(function(e)
				
			}, 1)
			
			
		return video
	},//end build_player



	/**
	* SKIP_RESTRICTED
	*/
	skip_restricted : function(player, ar_restricted_fragments, tcin_secs) {
		
		//console.log("[skip_restricted] ar_restricted_fragments:",ar_restricted_fragments);
		//console.log("current time 2:", parseInt( player.currentTime() ) );

		// current_time_in_seconds. curretn partial time and tcin (the offset of the video fragment)
			const player_current_time 	  		= parseInt( player.currentTime() )
			const absolute_player_current_time 	= player_current_time + parseInt( tcin_secs )
				if(SHOW_DEBUG===true) {
					//console.log("absolute_player_current_time:",absolute_player_current_time, player_current_time);
				}				

		// iterate
			const ar_restricted_fragments_len = ar_restricted_fragments.length
			for (let i = 0; i < ar_restricted_fragments_len; i++) {
				
				const item 				 = ar_restricted_fragments[i]
				const current_tcin_secs  = item.tcin_secs
				const current_tcout_secs = item.tcout_secs

				if (absolute_player_current_time>current_tcin_secs && absolute_player_current_time<current_tcout_secs) {
					// Jump to end skipping this time rage
						const time_to_jump_secs = current_tcout_secs - tcin_secs 
						player.currentTime( time_to_jump_secs );

					if(SHOW_DEBUG===true) {
						console.log("+++ Jumped to end time :",absolute_player_current_time, current_tcout_secs);
						console.log("item:",item, "tcin_secs", tcin_secs, "player_current_time", player_current_time, "time_to_jump_secs",time_to_jump_secs );
					}
				}				
			}		


		return true
	},//end skip_restricted



	/**
	* TIMESTAMP_TO_FECHA
	*/
	timestamp_to_fecha : function(timestamp) {
	
		if (!timestamp || timestamp.length<4) {
			return null
		}

		if (timestamp.length===10) {

			var year 	= timestamp.substring(0, 4) // 2014-06-24
			var month 	= timestamp.substring(5, 7)
			var day 	= timestamp.substring(8, 10)

			//var fecha = day +"-"+ month +"-"+ year

			// push in order when not empty
				const ar_parts = []
					if (day && day!='00') {
						ar_parts.push(day)
					}
					if (month && month!='00') {
						ar_parts.push(month)
					}
					if (year && year!='00') {
						ar_parts.push(year)
					}

			var fecha = ar_parts.join('-')	

		}else{

			var current_date = new Date(timestamp);	
			
			var year 	= current_date.getFullYear();
			var month 	= current_date.getMonth(); //Be careful! January is 0 not 1
			var day 	= current_date.getDate();

			function pad(n) {
				return n<10 ? '0'+n : n;
			}

			var fecha = pad(day) +"-"+ pad(month + 1) +"-"+ year
		}
		//console.log("timestamp-fecha:",timestamp,fecha);

		return fecha
	},//end timestamp_to_fecha



	/**
	* LOCAL_TO_REMOTE_PATH
	* @return string url
	*/
	local_to_remote_path : function(url) {

		if (!url) {
			return null
		}
		
		if ( url.indexOf('http://')===-1 && url.indexOf('https://')===-1 ) {

			// Like /dedalo/media_test/media_emakumeak/image/1.5MB/0/rsc29_rsc170_626.jpg
			const WEB_ENTITY = page_globals.WEB_ENTITY

			url = url.replace('/dedalo4/', '/dedalo/')
			url = url.replace('/media_test/media_'+WEB_ENTITY, '/media')

			// if first char is not /, add it
			if (url.charAt(0)!=='/') {
				url = '/' + url
			}

			// absolute
			url = page_globals.__WEB_MEDIA_BASE_URL__ + url
		}
		

		return url
	},//end local_to_remote_path



	/**
	* GET_POSTERFRAME_FROM_VIDEO
	* Resolve posterframe url from video url replacing path and suffix
	*/
	get_posterframe_from_video : function(video_url) {

		let posterframe_url = video_url
			posterframe_url = posterframe_url.replace(/\/404\//g, '/posterframe/')
			posterframe_url = posterframe_url.replace(/\.mp4/g, '.jpg')

		const ar_parts = posterframe_url.split("?")
			if (typeof ar_parts[0]!=="undefined") {
				posterframe_url = ar_parts[0]
			}

		return posterframe_url
	},//end get_posterframe_from_video



	/**
	* GET_MEDIA_ENGINE_URL
	* Create a url ready to use with media engine (safe acces to Dédalo files)
	*/
	get_media_engine_url : function(file_name, type, quality, full_name) {

		if (!file_name) {
			// console.warn("Error on get_media_engine_url. Invalid file_name :", file_name);
			return null
		}
		
		// id. from 'rsc29_rsc170_1.jpg' to '1'
			const regex	= /^.{3,}_.{3,}_(\d{1,})\.[\S]{3,4}$/;
			const id	= (full_name || type==='av')
				? file_name
				: regex.exec(file_name)[1]

		const media_engine_url = __WEB_MEDIA_ENGINE_URL__ + '/' + type + '/' + id + (quality ? ('/'+quality) : '')

		return media_engine_url
	},//end get_media_engine_url



	/**
	* OPEN_NOTE
	*/
	open_note : function(button, notes_data) {

		for (var i = notes_data.length - 1; i >= 0; i--) {
			var note = notes_data[i]
			if (button.dataset.tag_id===note.id) {
			
				// Activate colorbox for docu_images
				$.colorbox({
					html 		: note.label, 
					transition 	: "none"
				});
				return true
			}
		}

		return false
	},//end open_note



	/**
	* SET_BACKGROUND_COLOR
	* Set container background color as read from image
	*/
	set_background_color : function(img, container) {

		// Set crossOrigin to allow remote images
		img.setAttribute('crossOrigin', '');

		const colorThief = new BackgroundColorTheif();  
		const rgb 		 = colorThief.getBackGroundColor(img);

		//console.log('[set_background_color] background-color = ',rgb, container);

		// Assign background color
		container.style.backgroundColor = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] +')';

		return rgb
	},//end set_background_color



	/**
	* BUILD_SLIDER
	* 
	* options : {
	*	container // dom element
	*	ar_elements // array of objects (image, title, text)
	* }
	* @return promise
	*/
	build_slider : function(options) {
		
		// div container
		const container = options.container

		const js_promise = new Promise(function(resolve) {

			var ul = common.create_dom_element({
					element_type 	: "ul",
					class_name   	: "slides",
					parent : container
				})

			const ar_elements_len = options.ar_elements.length
			for (let i = 0; i < ar_elements_len; i++) {

				const element  		= options.ar_elements[i]

				const bg_image 		= element.image
				const slider_title 	= element.title || null
				const slider_text 	= element.text || null

				if (bg_image.length<4) continue; // Skip empty image url

				var li = common.create_dom_element({
					element_type : "li",
					class_name   : "row_image",
					parent 		 : ul
					})
					// image big
					var div_img = common.create_dom_element({
						element_type : "div",
						class_name   : "image_bg",
						parent 		 : li
					})
					div_img.style.backgroundImage = "url("+bg_image+")"

					// image text
					var div_text = common.create_dom_element({
						element_type : "div",
						class_name   : "image_text",
						parent 		 : li
						})
						var title = common.create_dom_element({
							element_type : "h1",
							text_content : slider_title,
							parent 		 : div_text
							})
							var link = common.create_dom_element({
								element_type : "a",
								parent 		 : title
							})
						var span = common.create_dom_element({
							element_type : "span",
							text_content : slider_text,
							parent 		 : div_text
							})

				if (i===0) {
					var img = new Image()
					img.addEventListener("load",function(){
						resolve(ul)
					},false)
					// Load the image and draw canvas on finish
					img.src = bg_image
				}
			}

			//resolve(ul)
		});


		return js_promise
	},//end build_slider



	/**
	* GET_SCROLLBAR_WIDTH
	* @return 
	*/
	get_scrollbar_width : function() {

		var outer = document.createElement("div");
		outer.style.visibility = "hidden";
		outer.style.width = "100px";
		outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

		document.body.appendChild(outer);

		var widthNoScroll = outer.offsetWidth;
		// force scrollbars
		outer.style.overflow = "scroll";

		// add innerdiv
		var inner = document.createElement("div");
		inner.style.width = "100%";
		outer.appendChild(inner);        

		var widthWithScroll = inner.offsetWidth;

		// remove divs
		outer.parentNode.removeChild(outer);

		return widthNoScroll - widthWithScroll;
	},//end get_scrollbar_width



	/**
	* HAS_SCROLLBAR
	*/
	has_scrollbar : function() {
		// The Modern solution
		if (typeof window.innerWidth === 'number') {
			const result = window.innerWidth >= document.documentElement.clientWidth
			return result
		}

		// rootElem for quirksmode
		const rootElem = document.documentElement || document.body

		// Check overflow style property on body for fauxscrollbars
		var overflowStyle

		if (typeof rootElem.currentStyle !== 'undefined')
		overflowStyle = rootElem.currentStyle.overflow

		overflowStyle = overflowStyle || window.getComputedStyle(rootElem, '').overflow

		// Also need to check the Y axis overflow
		var overflowYStyle

		if (typeof rootElem.currentStyle !== 'undefined')
			overflowYStyle = rootElem.currentStyle.overflowY

		overflowYStyle = overflowYStyle || window.getComputedStyle(rootElem, '').overflowY

		var contentOverflows = rootElem.scrollHeight > rootElem.clientHeight
		var overflowShown    = /^(visible|auto)$/.test(overflowStyle) || /^(visible|auto)$/.test(overflowYStyle)
		var alwaysShowScroll = overflowStyle === 'scroll' || overflowYStyle === 'scroll'

		const result = (contentOverflows && overflowShown) || (alwaysShowScroll)
		

		return result
	},//end has_scrollbar



	/**
	* CLONE_DEEP
	*/
	clone_deep : function(o) {

		const self = this
		
		let newO
		let i

		if (typeof o !== 'object') return o

		if (!o) return o

		if (Object.prototype.toString.apply(o) === '[object Array]') {
		newO = []
		for (i = 0; i < o.length; i += 1) {
			newO[i] = self.clone_deep(o[i])
		}
		return newO
		}

		newO = {}
		for (i in o) {
			if (o.hasOwnProperty(i)) {
				newO[i] = self.clone_deep(o[i])
			}
		}

		return newO
	},//end clone_deep



	/**
	* GET_QUERY_VARIABLE
	*/
	get_query_variable : function(url, variable) {

	   //var query = window.location.search.substring(1);
	   const query = url.split("?")[1]

	   const vars  = query.split("&")	   
	   for (var i=0; i<vars.length; i++) {
		   const pair = vars[i].split("=")
		   if(pair[0]==variable) return pair[1]
	   }

	   return false
	},//end get_query_variable



	/**
	* REGISTER_EVENTS
	*/
	register_events : function(handler_object, handler_events) {

		for (let event_name in handler_events) {
			// add event
			const event_functions = handler_events[event_name]
			handler_object.addEventListener(event_name, function(e) {
				for (let key in event_functions) {
					event_functions[key](e)
				}
			})
		}

		return true
	},//end register_events



	/**
	* CLEAN_GAPS
	* Remove empty elements in a joined array of elements
	* Like 'element1 | element2 |  | element3' 
	* to: 	'element1, element2, element3'
	*/
	clean_gaps : function(text, splitter=" | ", joinner=", ") {

		if (!text) {
			return ""
		}

		// trim start and end spaces. i.e. ' | label1 | label2 | ' => '| label1 | label2 |'
		text = text.trim()

		// remove splitte at start and end. i.e '| label1 | label2 |' => 'label1 | label2'
		text = text.replace(/^\| |\| {1,2}\|| \|+$/g, '')

		// trim again
		text = text.trim()

		// split by splitter (piper) and then join again with new joinner
		const result = (text.split(splitter).filter( el => el.length>0 )).join(joinner)

		return result
	},//end clean_gaps



	/**
	* WHEN_IN_DOM
	* Exec a callback when node element is placed in the DOM (then is possible to know their size, etc.)
	* Useful to render leaflet maps and so forth
	* @return mutation observer
	*/
	when_in_dom : function(node, callback) {

		if (document.contains(node)) {
			return callback()
		}

		const observer = new MutationObserver(function(mutations) {
			if (document.contains(node)) {
				// console.log("It's in the DOM!");
				observer.disconnect();

				callback()
			}
		});

		observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

		return observer
	},//end when_in_dom



	/**
	* REMOVE_GAPS
	* Removes empty values in multimple values string. 
	* Like 'pepe | lepe' when 'pepe | lepe | '
	*/
	remove_gaps : function(value, separator) {

		if (!value) return null

		const beats		= value.split(separator).filter(Boolean)
		const result	= beats.join(separator)
		
		return result
	},//end remove_gaps



	/**
	* SPLIT_DATA
	* Safe value split
	*/
	split_data : function(value, separator) {
		const result = (value && (typeof value==='string' || value instanceof String))
			? value.split(separator)
			: Array.isArray(value) ? value : []

		return result;
	},//end split_data



	/**
	* CLEAN_DATE
	* Format date values
	* input sample: 1920-00-00 00:00:00,1950-00-00 00:00:00
	* @return array dates
	*/
	clean_date : function(value, separator) {

		const ar_values = value ? value.split(separator) : []

		const dates = []
		for (let i = 0; i < ar_values.length; i++) {
			
			const date			= ar_values[i]
			const split_date	= date.split('-')
			const ar_elements	= []
			
			// day
				if (split_date[2] && split_date[2]!=='00 00:00:00') {
					const month = split_date[2].split(' ')[0]
					ar_elements.push(month)
				}

			// month
				if (split_date[1] && split_date[1]!=='00') {
					ar_elements.push(split_date[1])
				}			

			// year
				if (split_date[0] && split_date[0]!=='0000') {
					ar_elements.push(split_date[0])
				}

			const final_date = ar_elements.join('-')

			dates.push(final_date)
		}
		// console.log("/////////////// dates:",dates);

		return dates;
	},//end clean_date



	/**
	* DOWNLOAD_ITEM
	* @return bool true
	*/
	download_item : function(donwload_url, file_name) {		

		fetch(donwload_url)
		.then(function (response) {
			return response.blob();
		})
		.then(function (blob) {
			const href = URL.createObjectURL(blob)

			// link_obj
			const link_obj = common.create_dom_element({
				element_type	: "a",
				href			: href,
				download		: file_name || 'image.jpg'
			})
			
			link_obj.click();

			link_obj.remove()
		});

		return true
	},//end download_item



	/**
	* IS_NODE
	* Check if value is a DOM node
	* @return bool
	*/
	is_node : function(element) {
		if (typeof element!=='undefined' && (element instanceof HTMLElement || element.nodeType)) {
			return true
		}
		return false
	},//end is_node



	/**
	* IS_ELEMENT_IN_VIEWPORT
	* Check if given element node is in page viewport
	*/
	is_element_in_viewport : function (el) {

		const rect = el.getBoundingClientRect();

		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			rect.right <= (window.innerWidth || document.documentElement.clientWidth)
		);
	},//end is_element_in_viewport


	/**
	* IS_ELEMENT_TOP_IN_VIEWPORT
	* Check if given element node top is in page viewport
	*/
	is_element_top_in_viewport : function (el) {

		const rect = el.getBoundingClientRect();

		return (
			rect.top <= (window.innerHeight || document.documentElement.clientHeight)
		);
	},



	/**
	* LANG_CODE_TO_TLD2
	* Converts Dédalo lang codes like 'lg-eng' to tld2 ISO 639-1 codes like 'en'
	* @see https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
	*/
	lang_code_to_tld2 : function (lang_code) {

		let tld2

		switch(lang_code){
			case 'lg-spa': tld2 = 'es'; break;
			case 'lg-eng': tld2 = 'en'; break;
			case 'lg-cat': tld2 = 'ca'; break;
			case 'lg-fra': tld2 = 'fr'; break;
			case 'lg-ell': tld2 = 'el'; break;
			case 'lg-deu': tld2 = 'de'; break;
			case 'lg-por': tld2 = 'pt'; break;
			case 'lg-eus': tld2 = 'eu'; break;
			case 'lg-ara': tld2 = 'ar'; break;
			default : 
				tld2 = 'lang_code';
				console.warn("Impossible to convert lang_code to tld2 ISO 639-1 :", lang_code);
		}

		return tld2
	},//end lang_code_to_tld2



	is_object : function(current_var) {
		return (typeof current_var==='object' && current_var!==null)
	},//end is_object



	is_array : function(current_var) {
		return Array.isArray(current_var)
	},//end is_array



	get_today_date : function() {
		
		const dt = new Date

		const day		= dt.getDate().toString().padStart(2, '0')
		const month		= (dt.getMonth()+1).toString().padStart(2, '0')
		const year		= dt.getFullYear().toString().padStart(4, '0')
		const hours		= dt.getHours().toString().padStart(2, '0')
		const minutes	= dt.getMinutes().toString().padStart(2, '0')
		const seconds	= dt.getSeconds().toString().padStart(2, '0')
		
		const dformat = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`

        return dformat
	},//end get_today_date



	/**
	* LOAD_STYLE
	* @param object self
	*/
	load_style : function(src) {

		return new Promise(function(resolve, reject) {

			// DOM tag
				const element 	  = document.createElement("link")
					  element.rel = "stylesheet"

				element.onload = function() {
					resolve(src);
				};
				element.onerror = function() {
					reject(src);
				};

				element.href = src

				document.getElementsByTagName("head")[0].appendChild(element)
		})
	},//end load_style



	/**
	* LOAD_SCRIPT
	* @param object self
	*/
	load_script : async function(src) {

		return new Promise(function(resolve, reject) {

			// DOM tag
				const element = document.createElement("script")
				element.setAttribute("defer", "defer");

				element.onload = function() {
					resolve(src);
				};
				element.onerror = function() {
					reject(src);
				};

				element.src = src

				document.body.appendChild(element)
		})
	},//end load_script



}//end common



function ready(fn) {
  if (document.readyState!=='loading'){
	fn();
  } else {
	document.addEventListener('DOMContentLoaded', fn);
  }
}


(function() {
	var throttle = function(type, name, obj) {
		obj = obj || window;
		var running = false;
		var func = function() {
			if (running) { return; }
			running = true;
			 requestAnimationFrame(function() {
				obj.dispatchEvent(new CustomEvent(name));
				running = false;
			});
		};
		obj.addEventListener(type, func);
	};

	/* init - you can init any event */
	throttle("resize", "optimizedResize");
})();



