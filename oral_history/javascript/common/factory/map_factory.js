/*global tstring, page_globals, SHOW_DEBUG, row_fields, common, page*/
/*eslint no-undef: "error"*/

"use strict";



function map_factory() {

	// vars
		// target. DOM element where map is placed
			this.target	= null

		// data. Database parsed rows data to create the map
			this.data = null

		// source_maps
			this.source_maps = {}

		// popup_builder. Use custom options popup_builder function or fallback to default
			this.popup_builder = null

		// default map vars set
			this.map				= null
			this.layer_control		= false
			this.loaded_document	= false
			this.icon_main			= null
			this.icon_finds			= null
			this.icon_uncertain		= null
			this.popupOptions		= null
			this.current_layer		= null
			this.current_group		= null
			this.option_selected	= null

		// initial_map_data. Default fallback positions
			this.initial_map_data	= {
				lat		: 40.65993615913156,
				lon		: -3.2304345278385687,
				zoom	: 5, // (13 for dare, 8 for osm)
				alt		: 0
			}

		// source_maps. Default fallback
			this.source_maps = [
				{
					name	: "osm",
					url		: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
					default	: true
				},
				{
					name	: "arcgis",
					url		: '//server.arcgisonline.com/ArcGIS/' + 'rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
				}
			]

		// icon_main (default icon properties)
			this.icon_main = null // set on parse

		// popup_options
			this.popup_options


		// map_container_div (created inside map_container)
			this.map_container_div = null



	/**
	* INIT
	*/
	this.init = function(options) {
		if(SHOW_DEBUG===true) {
			console.log("--> init options:",options)
		}

		const self = this

		// options
			const source_maps	= options.source_maps || self.source_maps
			const popup_builder	= options.popup_builder || self.build_popup_content
			const map_position	= options.map_position || self.initial_map_data
			const map_container	= options.map_container
			const legend		= options.legend || null
			const popup_options	= options.popup_options || {
				// maxWidth						Number	300	Max width of the popup, in pixels.
				maxWidth : 420,
				// minWidth						Number	50	Min width of the popup, in pixels.
				// maxHeight					Number	null	If set, creates a scrollable container of the given height inside a popup if its content exceeds it.
				// maxHeight : 420,
				// autoPan						Boolean	true	Set it to false if you don't want the map to do panning animation to fit the opened popup.
				// autoPanPaddingTopLeft		Point	null	The margin between the popup and the top left corner of the map view after autopanning was performed.
				// autoPanPaddingBottomRight	Point	null	The margin between the popup and the bottom right corner of the map view after autopanning was performed.
				// autoPanPadding				Point	Point(5, 5)	Equivalent of setting both top left and bottom right autopan padding to the same value.
				// keepInView					Boolean	false	Set it to true if you want to prevent users from panning the popup off of the screen while it is open.
				// closeButton					Boolean	true	Controls the presence of a close button in the popup.
				closeButton : false,
				// autoClose					Boolean	true	Set it to false if you want to override the default behavior of the popup closing when another popup is opened.
				// closeOnEscapeKey				Boolean	true	Set it to false if you want to override the default behavior of the ESC key for closing of the popup.
				// closeOnClick					Boolean	*	Set it if you want to override the default behavior of the popup closing when user clicks on the map. Defaults to the map's closePopupOnClick option.
				// className					String	''	A custom CSS class name to assign to the popup.
				className : 'map_popup'
			}
			const icon_main = options.marker_icon
				? L.icon(options.marker_icon)
				: L.icon({
					iconUrl			: page_globals.__WEB_TEMPLATE_WEB__ + "/assets/lib/leaflet/images/naranja.png",
					shadowUrl		: page_globals.__WEB_TEMPLATE_WEB__ + "/assets/lib/leaflet/images/marker-shadow.png",
					iconSize		: [47, 43], // size of the icon
					shadowSize		: [41, 41], // size of the shadow
					iconAnchor		: [10, 19], // point of the icon which will correspond to marker's location
					shadowAnchor	: [0, 20],  // the same for the shadow
					popupAnchor		: [12, -20] // point from which the popup should open relative to the iconAnchor
				})


		// fix vars
			self.source_maps	= source_maps
			self.map_position	= map_position
			self.map_container	= map_container
			self.popup_builder	= popup_builder
			self.popup_options	= popup_options
			self.icon_main		= icon_main
			self.legend			= legend


		return self.render_base_map()
	}//end init



	/**
	* RENDER_BASE_MAP
	*/
	this.render_base_map = function() {

		const self = this

		return new Promise(function(resolve){

			// reset map if already exists instance
				if (self.map) {
					// resolve(resolve(self.map))
					// return
					self.map.off(); // clear All Event Listeners
					self.map.remove();	// remove map
				}

			// map position
				const map_position	= self.map_position
				const map_x			= parseFloat(map_position.lat)
				const map_y			= parseFloat(map_position.lon)
				const map_zoom		= parseInt(map_position.zoom)
				const map_alt		= parseInt(map_position.alt)

			// reset map vars
				self.map				= null
				self.layer_control		= false
				self.loaded_document	= false
				self.icon_finds			= null
				self.icon_uncertain		= null
				self.popupOptions		= null
				self.current_layer		= null
				self.current_group		= null
				self.option_selected	= null

			// layer. Add layer to map
				let default_layer	= null
				const base_maps		= {} // layer selector
				for (let i = 0; i < self.source_maps.length; i++) {

					const source_map	= self.source_maps[i]
					const layer			= new L.TileLayer(source_map.url, source_map.options)

					base_maps[source_map.name] = layer

					if (i===0 || source_map.default===true) {
						default_layer = layer
					}
				}

				const container = self.map_container_div || common.create_dom_element({
					element_type	: "div",
					class_name		: "",
					parent			: self.map_container
				})
				self.map_container_div = container

			// map
				self.map = new L.map(container, {layers: [default_layer], center: new L.LatLng(map_x, map_y), zoom: map_zoom});

			// layer selector
				self.layer_control = L.control.layers(base_maps).addTo(self.map);

			// disable zoom handlers
				self.map.scrollWheelZoom.disable();

			// popupOptions
				self.popupOptions =	self.popup_options

			// fix vars
				// target. DOM element where map is placed
				// self.target = target
				// data. Preparsed data from rows. Contains items with properties 'lat', 'lon', and 'data' like [{lat: lat, lon: lon, data: []}]

			// init map library
				// self.init({
				// 	source_maps		: source_maps,
				// 	map_position	: map_position
				// })

			// draw map
				// self.parse_data_to_map(data)

			// legend
				if (self.legend && typeof self.legend==="function") {
					const legend_node = self.legend()
					self.map_container.appendChild(legend_node)
				}


			resolve(self.map)
		})
	}//end render_base_map



	/**
	* PARSE_DATA_TO_MAP
	*/
	this.parse_data_to_map = function(data, caller_mode) {

		const self = this

		return new Promise(function(resolve){

			// reset. Reset all map layers
				if (self.current_group) {
					// Reset points
					self.current_group.clearLayers();
				}

			// no data check cases
				if (!data || data.length<1) {
					// self.map.eachLayer(function (layer) {
					//     self.map.removeLayer(layer);
					// });
					self.render_base_map()
					// self.reset_map()
					resolve(self.map_container)
					return false
				}

			// Group data elements by place
				const group_data = (data[0].geojson)
					? self.group_by_place_geojson(data)
					: self.group_by_place(data)
				const group_data_length	= group_data.length


			// create marker. Build marker with custom icon and popup
				const create_marker = function(element, latlng, marker_icon, popup) {
					const marker = L.marker(latlng, {icon: marker_icon}).bindPopup(popup) //.openPopup();
					marker.on('mousedown', function(e) {
						// event publish map_selected_marker
						event_manager.publish('map_selected_marker', {
							item	: element,
							event	: e
						})
					})
					return marker
				}

			const ar_markers = []
			for (let i = group_data_length - 1; i >= 0; i--) {

				const element = group_data[i]

				// des
					// var ar_places = JSON.parse(element.lugar)
					// // Iterate all
					// var ar_places_length = ar_places.length
					// for (var j = 0; j < ar_places_length; j++) {

					// 	var current_place = ar_places[j]
					// 	current_place.layer_data.forEach(function(layer_data) {
					// 		//console.log(layer_data);
					// 		//console.log("element.uncertain:",element.uncertain,layer_data);
					// 		if (layer_data!=="undefined" && layer_data.type==="Point") {

					// 			var lat	= layer_data.lat
					// 			var lon	= layer_data.lon
					// 			var current_tipo_section_id = element.tipo_section_id

					// 			var popup_content = self.build_popup_content(element);

					// 			if(caller_mode==="load_hallazgos" || caller_mode==="load_culturas" || caller_mode==="load_epocas"){
					// 				var marker_icon = self.icon_finds // green
					// 			}else{
					// 				var marker_icon = self.icon_main // Default
					// 			}

					// 			// Marker set popup and click event
					// 			var marker = L.marker([lat, lon], {icon: marker_icon}).bindPopup(popup_content)
					// 				marker.on('click', function(e) {
					// 					self.show_tipos({
					// 						tipo_section_id : current_tipo_section_id,
					// 						order 			: null,
					// 						caller_mode 	: caller_mode
					// 					})
					// 				})
					// 			ar_markers.push(marker)
					// 		}
					// 	});//end current_place.layer_data.forEach(function(layer_data)
					// }

				// marker_icon
				const marker_icon = element.marker_icon
					? L.icon(element.marker_icon)
					: self.icon_main // already parsed on init

				const popup_content	= self.popup_builder(element)

				const popup = L.popup(self.popupOptions)
						.setLatLng([element.lat, element.lon])
						.setContent(popup_content)
						// .openOn(self.map);	// auto open first marker

				// console.log("+++++++++++++++ element.geojson:",element.geojson, element);
				if (element.geojson) {

					for (let k = 0; k < element.geojson.length; k++) {

						const geojsonFeature = element.geojson[k].layer_data

						const marker = L.geoJSON(geojsonFeature, {
							pointToLayer : function(feature, latlng) {
								// return create_marker(element, latlng, marker_icon, popup)
								return L.marker(latlng, {icon: marker_icon})
							},
							onEachFeature : function(feature, layer) {
								layer.bindPopup(popup)
							}
						})

						marker.on('mousedown', function(e) {
							// event publish map_selected_marker
							event_manager.publish('map_selected_marker', {
								item	: element,
								event	: e
							})
						})

						ar_markers.push(marker)
					}

				}else{

					// marker. Set popup and click event
					// const marker = L.marker([element.lat, element.lon], {icon: marker_icon}).bindPopup(popup) //.openPopup();
					// 	  marker.on('click', function(e) {
					// 		// event publish map_selected_marker
					// 		event_manager.publish('map_selected_marker', {
					// 			item	: element,
					// 			event	: e
					// 		})
					// 	  })
					const marker = create_marker(element, [element.lat, element.lon], marker_icon, popup)
					ar_markers.push(marker)
				}
			}
			// console.log("ar_markers:",ar_markers);

			// group . Create a layer group and add to map
				if (ar_markers.length>0) {
					// self.current_group = L.layerGroup(ar_markers)
					// self.current_group.addTo(self.map)
					const cluster_markers = L.markerClusterGroup({
						spiderfyOnMaxZoom	:  true,
						showCoverageOnHover	: false,
						zoomToBoundsOnClick	: true,
						maxClusterRadius	: 30,
						iconCreateFunction: function(cluster) {
							return L.divIcon({ html: cluster.getChildCount(), className: 'mycluster', iconSize: L.point(40, 40) });
						}
					})
					for (let k = 0; k < ar_markers.length; k++) {
						cluster_markers.addLayer(ar_markers[k])
					}
					self.map.addLayer(cluster_markers);
				}

			// feature_group . Fit points positions on map and adjust the zoom
				if (ar_markers && ar_markers.length>0) {
					const feature_group = new L.featureGroup(ar_markers)
					if (feature_group) {

						self.map.fitBounds(feature_group.getBounds())

						if (self.map.getZoom()>18) {
							self.map.setZoom(18)
						}
					}
				}

				self.map.on('popupopen', function(e) {
					const wrapper	= e.popup._wrapper
					const ar_img	= wrapper.querySelectorAll('img')
					if (ar_img) {
						for (let i = 0; i < ar_img.length; i++) {
							if (!ar_img[i].classList.contains('loaded')) {
								ar_img[i].image_in_dom()
							}
						}
					}
				});


			resolve(self.map_container)
		})
	}//end parse_data_to_map



	/**
	* GROUP_BY_PLACE
	* Group results rows by property 'lugar' (place)
	*/
	this.group_by_place = function(data) {

		const group_data = []

		const data_length = data.length
		for (let i = 0; i < data_length; i++) {

			const item				= data[i]
			const group_data_item	= group_data.find(el => el.lat===item.lat && el.lon===item.lon)

			if (group_data_item) {
				// already exists
				group_data_item.group.push(item.data)
			}else{
				// create new one
				const new_item = {
					lat			: item.lat,
					lon			: item.lon,
					geojson		: item.geojson,
					marker_icon	: item.marker_icon,
					group		: [item.data]
				}
				group_data.push(new_item)
			}
		}

		return group_data
	}//end group_by_place



	/**
	* GROUP_BY_PLACE_GEOJSON
	* Group results rows by property 'lugar' (place)
	*/
	this.group_by_place_geojson = function(data) {

		const group_data = []

		const data_length = data.length
		for (let i = 0; i < data_length; i++) {

			const element			= data[i]
			const geojson			= element.geojson
			const geojson_length	= geojson.length

			for (let k = 0; k < geojson_length; k++) {

				const features = geojson[k].layer_data.features

				for (let g = 0; g < features.length; g++) {

					const coordinates	= features[g].geometry.coordinates
					const lat			= coordinates[0]
					const lon			= coordinates[1]

					const group_data_item = group_data.find(el => el.lat===lat && el.lon===lon)
					if (group_data_item) {
						// already exists
						group_data_item.group.push(element.data)
					}else{
						// create new one
						const new_item = {
							lat			: lat,
							lon			: lon,
							geojson		: [geojson[k]],
							marker_icon	: element.marker_icon,
							group		: [element.data],
						}
						group_data.push(new_item)
					}
					break; // only first is used to group
				}
			}
		}
		// console.log("+++ data:",data);
		// console.log("+++ group_data:",group_data);

		return group_data
	}//end group_by_place_geojson



	/**
	* BUILD_POPUP_CONTENT
	* Send calback option to overwrite current function
	*/
	this.build_popup_content = function(data) {

		console.log("(!) Using default build_popup_content function:", data);

		const self = this

		const popup_wrapper = common.create_dom_element({
			element_type	: "div",
			class_name		: "popup_wrapper",
			inner_html		: "TITLE: " + data.title + " [" + data.section_id + "]"
		})
		return popup_wrapper

		const ar_group = data.group

		// order ar_group
			const collator = new Intl.Collator('es',{ sensitivity: 'base', ignorePunctuation:true});
			ar_group.sort( (a,b) => {return collator.compare(a.nombre , b.nombre)});

		// title
			const ar_group_length = ar_group.length
			for (let i = 0; i < ar_group_length; i++) {

				const nombre			= ar_group[i].nombre.replace(',', ', ') // Add space between names separated with comma
				const tipo_section_id	= ar_group[i].tipo_section_id

				const title = common.create_dom_element({
					element_type	: "a",
					parent			: popup_wrapper,
					inner_html		: nombre,
					data_set		: {
						tipo_section_id	: JSON.stringify(tipo_section_id),
						nombre			: nombre
					}
				})
				title.addEventListener("click",function(e){
					var tipos = JSON.parse(e.target.dataset.tipo_section_id)
					self.show_tipos({
						tipo_section_id : tipos,
						caller_mode 	: data.caller_mode
					})
				})
			}

		// label
			if (data.type_label) {
				var type = common.create_dom_element({
					element_type 	: "div",
					parent 			: popup_wrapper,
					text_content 	: data.type_label
				})
			}


		return popup_wrapper
	}//end build_popup_content



	/**
	* RESET_MAP
	*/
	this.reset_map = function() {

		const self = this

		const map_data = self.initial_map_data

		//self.map.panTo(new L.LatLng(map_data.x, map_data.y))
		//self.map.setZoom(map_data.zoom)

		self.map.setView(new L.LatLng(map_data.lat, map_data.lon), map_data.zoom);

		return true
	}//end reset_map



}//end map_factory
