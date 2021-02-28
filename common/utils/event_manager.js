/**
* EVENT_MANAGER
* the event_manager is created by the page and used by all instances: section, section_group, compnents, etc
* the event manager is a observable-observer pattern but we implement connection with the instances with tokens
* the token is stored in the instances and the events is a array of objects every event is auto-explained
* the ionstances has control to create news and detroy it.
*
* events format:[{
*					event_name 	: the common name of the events for fired by publish/changes,
*					token 		: unique id stored in the instance for contol the event,
*					callback 	: the function that will fired when publish/change will fired
*				}]
*
*/
export const event_manager = function(){



	this.events = []
	this.last_token = -1



	/**
	* SUBSCRIBE
	*/
	this.subscribe = function(event_name, callback) {

		// new event. Init. Create the unique token
			const token = "event_"+String(++this.last_token)

		// create the event
				const new_event = {
					event_name 	: event_name,
					token 		: token,
					callback 	: callback
				}
		// add the event to the global events of the page
			this.events.push(new_event)

		// return the token to save into the events_tokens propertie inside the caller instance
			return token
	}//end subscribe



	/**
	* UNSUBSCRIBE
	*/
	this.unsubscribe = function(event_token) {

		const self = this

		// find the event in the global events and remove it
			const result = self.events.map( (current_event, key, events) => {
				(current_event.token === event_token) ? events.splice(key, 1) : null
			})

		// return the new array without the events
			return result
	}//end unsubscribe



	/**
	* PUBLISH
	* when the publish event is fired it need propagated to the suscribers events
	*/
	this.publish = function(event_name, data={}) {
		//if(SHOW_DEBUG===true) {
			//console.log("[publish] event_name:",event_name)
			//console.log("[publish] data:",data)
		//}

		// find the events that has the same event_name for exec
		const current_events = this.events.filter(current_event => current_event.event_name === event_name)

		// if don't find events don't exec
		if(!current_events){
			return false

		}else{
			// exec the suscribed events callbacks
			const result = current_events.map(current_event => current_event.callback(data))
			return result
		}
	}//end publish



	/**
	* GET_EVENTS
	* @return
	*/
	this.get_events = function() {

		return this.events
	}//end get_events



	/**
	 * Fire an event handler to the specified node. Event handlers can detect that the event was fired programatically
	 * by testing for a 'synthetic=true' property on the event object
	 * @param {HTMLNode} node The node to fire the event handler on.
	 * @param {String} eventName The name of the event without the "on" (e.g., "focus")
	 */
	this.fire_event = function(node, eventName) {
		// Make sure we use the ownerDocument from the provided node to avoid cross-window problems
		var doc;
		if (node.ownerDocument) {
			doc = node.ownerDocument;
		} else if (node.nodeType == 9){
			// the node may be the document itself, nodeType 9 = DOCUMENT_NODE
			doc = node;
		} else {
			throw new Error("Invalid node passed to fireEvent: " + node.id);
		}

		if (node.dispatchEvent) {
			// Gecko-style approach (now the standard) takes more work
			var eventClass = "";

			// Different events have different event classes.
			// If this switch statement can't map an eventName to an eventClass,
			// the event firing is going to fail.
			switch (eventName) {
				case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
				case "mousedown":
				case "mouseup":
					eventClass = "MouseEvents";
					break;

				case "focus":
				case "change":
				case "blur":
				case "select":
					eventClass = "HTMLEvents";
					break;

				default:
					throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
					break;
			}
			var event = doc.createEvent(eventClass);

			var bubbles = eventName == "change" ? false : true;
			event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.

			event.synthetic = true; // allow detection of synthetic events
			// The second parameter says go ahead with the default action
			node.dispatchEvent(event, true);
		} else  if (node.fireEvent) {
			// IE-old school style
			var event = doc.createEventObject();
			event.synthetic = true; // allow detection of synthetic events
			node.fireEvent("on" + eventName, event);
		}
	}//end fire_event



	/**
	* WHEN_IN_DOM
	* Exec a callback when node element is placed in the DOM (then is possible to know their size, etc.)
	* Useful to render leaflet maps and so forth
	* @return mutation observer
	*/
	this.when_in_dom = function(node, callback) {

		const observer = new MutationObserver(function(mutations) {
			if (document.contains(node)) {
				// console.log("It's in the DOM!");
				observer.disconnect();

				callback(this)
			}
		});

		observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

		return observer
	}//end when_in_dom



}//end event_manager


