/*
 * bbCalcService.js
 * CSc 337, fall 2018
 *
 * Created On: 11/27/18
 * Author: David Wang & Anthony Pietrofeso
 * Description:
 */

"use strict";

(function() {
	const express = require("express");
	const app = express();
	let fs = require('fs');

	/*
	 * This handles GET requests to the server.
	 */
	app.use(express.static('public'));
	app.get('/', function (req, res) {
		res.header("Access-Control-Allow-Origin", "*");
		console.log("hello");
	});

	app.listen(3000);
}) ();

