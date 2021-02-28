/*global tstring, page_globals, SHOW_DEBUG, row_fields, common, page, forms, document, DocumentFragment, tstring, console */
/*eslint no-undef: "error"*/
/*jshint esversion: 6 */



// app_utils . web application useful es6 modules compatible with old browsers (Configure CodeKit to ES6 Bundle IIFE) (!)



// common web_app/utils imports
	import {data_manager as data_manager_alias} from 'utils/data_manager.js'
	import {event_manager as event_manager_alias} from 'utils/event_manager.js'



// globals
	window.data_manager		= new data_manager_alias();
	window.event_manager	= new event_manager_alias();
	// window.data_manager_alias = function(){
	// 		alert("44");
	// };



// setTimeout(function(){
// 	console.log("Activated app_utils !");
// 	console.log("Avilable data_manager:",data_manager);
// 	console.log("Avilable event_manager:",event_manager);
// },10)
	
