/*
 * bbCalcService.js
 * CSc 337, fall 2018
 *
 * Created On: 11/27/18
 * Author: David Wang & Anthony Pietrofeso
 * Description: GET returns list of user profiles.
 * Post adds profile to list of profiles, or updates the stocks in that profile.
 */

"use strict";

(function() {
	const FILE = "profiles.txt";

	const express = require("express");
	const app = express();
	let fs = require("fs");

	const  bodyParser = require('body-parser');
	const jsonParser = bodyParser.json();

	app.use(function(req, res, next) {
 	    res.header("Access-Control-Allow-Origin", "*");
 	    res.header("Access-Control-Allow-Headers",
 	               "Origin, X-Requested-With, Content-Type, Accept");
 	  next();
 	});

	// Post request updates stocks or adds profile.
	app.post('/', jsonParser, function (req, res) {
		let userPassStock = req.body.profile;
		let userPassStocklis = userPassStock.split(":::");
		let user = userPassStocklis[0];
		let password = userPassStocklis[1];

		let newfile = [];
		let fileContent = fs.readFileSync(FILE, 'utf8', function(err) {
			if(err) {
				console.log(err);
				res.status(400);
				return;
			}
			res.status(200);
		});

		fileContent = fileContent.split("\n");
		for (let line of fileContent){
			console.log(line);
	        if(!line.includes(":::")){
				console.log("thinks not a line");
	            continue;
	        }

			let splitline = line.split(":::");

			if (splitline[0] == user && splitline[1] == password){
				console.log("thinks same user");
				continue;
			}

			newfile.push(line);
		}

		newfile.push(userPassStock);

		let fileStr = "";
		for (let line of newfile){
			fileStr += line + "\n";
		}

		fs.writeFile(FILE, fileStr, function(err) {
	    	if(err) {
				console.log(err);
				res.status(400);
				return;
	    	}
	    	res.status(200);
		});
		res.send("");
	});


	// Returns ALL profiles
	app.get('/', function (req, res) {
	    let fileContent = fs.readFileSync(FILE, 'utf8', function(err) {
	    	if(err) {
				console.log(err);
				res.status(400);
				return;
	    	}
	        res.status(200);
	    });

	    fileContent = fileContent.split('\n');

	    let lis = [];
	    let i = 0;
	    for (let line of fileContent){
	        if(!line.includes(":::")){
	            continue;
	        }

	        line = line.split(":::");

	        let data = {"name": line[0], "password": line[1], "stocks": JSON.parse(line[2])}
	        lis[i] = data;
	        i++;
	    }
		console.log("got here!")

	    let data = {"profiles": lis};

	    res.send(JSON.stringify(data));
	});


	app.listen(3000);
}) ();
