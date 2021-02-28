/*global get_label, environment, SHOW_DEBUG */
/*eslint no-undef: "error"*/



/**
* DATA_LOADER
*/
export const data_manager = function() {

}//end data_manager



/**
* REQUEST
* Make a fetch request to server api
* @param object options
* @return promise api_response
*/
data_manager.prototype.request = async function(options) {

	// console.log("++++ request options:",options);

	const url			= options.url || environment.api_server_url
	const method		= options.method || 'POST' // *GET, POST, PUT, DELETE, etc.
	const mode			= options.mode || 'cors' // no-cors, cors, *same-origin
	const cache			= options.cache || 'no-cache' // *default, no-cache, reload, force-cache, only-if-cached
	const credentials	= options.credentials || 'same-origin' // include, *same-origin, omit
	const headers		= options.headers || {'Content-Type': 'application/json'}// 'Content-Type': 'application/x-www-form-urlencoded'
	const redirect		= options.redirect || 'follow' // manual, *follow, error
	const referrer		= options.referrer || 'no-referrer' // no-referrer, *client
	const body			= options.body // body data type must match "Content-Type" header

	// code defaults
		if (!body.code) {
			body.code = environment.api_code
		}
	// lang defaults
		if (!body.lang) {
			body.lang = environment.lang
		}
	// db_name defaults
		if (!body.db_name && environment.api_db_name) {
			body.db_name = environment.api_db_name
		}

	const handle_errors = function(response) {
		if (!response.ok) {
			console.warn("-> handle_errors response:",response);
			throw Error(response.statusText);
		}
		return response;
	}

 	const api_response = fetch(
 		url,
 		{
			method		: method,
			mode		: mode,
			cache		: cache,
			credentials	: credentials,
			headers		: headers,
			redirect	: redirect,
			referrer	: referrer,
			body		: JSON.stringify(body)
		})
		.then(handle_errors)
		.then(response => {
			// console.log("-> json response 1 ok:",response.body);
			const json_parsed = response.json().then((result)=>{
				//console.log("-> json result 2:",result);
				return result
			})
			return json_parsed
		})// parses JSON response into native Javascript objects
		.catch(error => {
			console.error("!!!!! [page data_manager.request] ERROR:", error)
			console.warn("body:",body);
			return {
				result 	: false,
				msg 	: error.message,
				error 	: error
			}
		});

	return api_response
}//end request



/**
* REQUEST
* Make a fetch request to server api
* @param object options
* @return promise api_response
*//*
data_manager.prototype.request = async function(options) {

	this.url			= options.url || DEDALO_CORE_URL + '/api/v1/json/'
	this.method			= options.method || 'POST' // *GET, POST, PUT, DELETE, etc.
	this.mode			= options.mode || 'cors' // no-cors, cors, *same-origin
	this.cache			= options.cache || 'no-cache' // *default, no-cache, reload, force-cache, only-if-cached
	this.credentials	= options.credentials || 'same-origin' // include, *same-origin, omit
	this.headers		= options.headers || {'Content-Type': 'application/json'}// 'Content-Type': 'application/x-www-form-urlencoded'
	this.redirect		= options.redirect || 'follow' // manual, *follow, error
	this.referrer		= options.referrer || 'no-referrer' // no-referrer, *client
	this.body			= options.body // body data type must match "Content-Type" header

	const handle_errors = function(response) {
		if (!response.ok) {
			console.warn("-> handle_errors response:",response);
			throw Error(response.statusText);
		}
		return response;
	}

	const api_response = fetch(
		this.url,
		{
			method		: this.method,
			mode		: this.mode,
			cache		: this.cache,
			credentials	: this.credentials,
			headers		: this.headers,
			redirect	: this.redirect,
			referrer	: this.referrer,
			body		: JSON.stringify(this.body)
		})
		.then(handle_errors)
		.then(response => {
			// console.log("-> json response 1 ok:",response.body);
			const json_parsed = response.json().then((result)=>{
				//console.log("-> json result 2:",result);
				return result
			})
			return json_parsed
		})// parses JSON response into native Javascript objects
		.catch(error => {
			console.error("!!!!! [data_manager.request] ERROR:", error)
			return {
				result 	: false,
				msg 	: error.message,
				error 	: error
			}
		});

	// const api_response = await fetch(this.url, {
	// 		method		: this.method,
	// 		mode		: this.mode,
	// 		cache		: this.cache,
	// 		credentials	: this.credentials,
	// 		headers		: this.headers,
	// 		redirect	: this.redirect,
	// 		referrer	: this.referrer,
	// 		body		: JSON.stringify(this.body)
	// 	})
	// if (api_response.status >= 200 && api_response.status <= 299) {
	// 	const json_response = await api_response.json();
	// 	console.log("json_response", json_response);
	// 	return json_response
	// } else {
	// 	// Handle errors
	// 	console.log(api_response.status, api_response.statusText);
	// }

	return api_response
}//end request
*/


/**
* DOWNLOAD_URL
* @param string url
* @param string filename
* Donwload url blob data and create a temporal autofired link
*/
export function download_url(url, filename) {
	fetch(url).then(function(t) {
		return t.blob().then((b)=>{
			var a = document.createElement("a");
			a.href = URL.createObjectURL(b);
			a.setAttribute("download", filename);
			a.click();
			a.remove();
		}
		);
	});
}//end download_url


