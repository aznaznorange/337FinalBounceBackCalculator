/*
 * bbcalc.js
 * CSc 337, fall 2018
 *
 * Created On: 11/27/18
 * Author: David Wang & Anthony Pietrofeso
 * Description:
 */

"use strict";

(function() {

	let currentProfile = null;
	// Sets up event listeners for both buttons
	window.onload = function () {

		//getStockDiv("AAPL", "BBStocks");


		//toggle login window
		let loginDisplay = false;
		let loginButton = document.getElementById("logInOut").onclick = function(){
			if(loginDisplay){
				let login = document.getElementById("signIn").style.display = "none";
				loginDisplay = false;

			} else{
				let login = document.getElementById("signIn").style.display = "block";
				loginDisplay = true;
			}
		};

		let loginSubmit = document.getElementById("submitUserInfo").onclick = login;
	}

	function getStockDiv(ticker, appendTo) {
		let url = "https://www.alphavantage.co/query?function=";
		url += "TIME_SERIES_DAILY&symbol="
		url += ticker;
		url += "&apikey=MC4A891THRXU4GAO";

		fetch(url)
		.then(checkStatus)
		.then(function(responseText) {
			let stockData = JSON.parse(responseText)["Time Series (Daily)"];

			let stockDiv = document.createElement("div");
			stockDiv.classList.add("aStock");

			let title = document.createElement("h3");
			title.innerHTML = ticker;
			stockDiv.appendChild(title);

			let date1 = getValidDate(false, stockData);
			let date2 = getValidDate(true, stockData);

			let openPrice = parseFloat(stockData[date1]["1. open"]);
			let closePrice = parseFloat(stockData[date2]["4. close"]);
			let changeInPrice = ((openPrice - closePrice) / openPrice) * 100;

			let open = document.createElement("p");
			open.innerHTML = date1;
			open.innerHTML += " Opening Price: ";
			open.innerHTML += stockData[date1]["1. open"];
			stockDiv.appendChild(open);

			let close = document.createElement("p");
			close.innerHTML = date2;
			close.innerHTML += " Closing Price: ";
			close.innerHTML += stockData[date2]["4. close"];
			stockDiv.appendChild(close);

			let change = document.createElement("p");
			change.innerHTML = "Percent Change: ";
			change.innerHTML += changeInPrice.toString();
			stockDiv.appendChild(change);

			let buy = document.createElement("input");
			buy.value = "Buy";
			buy.type = "button";
			stockDiv.appendChild(buy);

			let sell = document.createElement("input");
			sell.value = "Sell";
			sell.type = "button";
			stockDiv.appendChild(sell);

			let quantity = document.createElement("input");
			quantity.type = "text";
			quantity.placeholder = "Quantity";
			stockDiv.appendChild(quantity);

			document.getElementById(appendTo).appendChild(stockDiv);

		})
		.catch(function(error) {
			console.log(error.message);
		});
	}

	function getValidDate(next, stockData) {
		let d = new Date();
		let dateStr = dateToString(d);

		while (!stockData.hasOwnProperty(dateStr)) {
			d.setDate(d.getDate() - 1);
			dateStr = dateToString(d);
		}

		if (next) {
			d.setDate(d.getDate() - 1);
			dateStr = dateToString(d);
			while (!stockData.hasOwnProperty(dateStr)) {
				d.setDate(d.getDate() - 1);
				dateStr = dateToString(d);
			}
		}

		return dateStr;
	}

	function dateToString(d) {
		let yyyy = d.getFullYear();
		let mm = d.getMonth() + 1;
		let dd = d.getDate();

		let date = yyyy.toString() + "-";

		if (mm < 10) {
			date += "0";
		}
		date += mm.toString() + "-";

		if (dd < 10) {
			date += "0";
		}
		date += dd.toString();
		return date;
	}


	// helper function to remove all children from parent node.
	function removeAll(parent) {
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}
	}

	// normal check status function
	function checkStatus(response) {
    	if (response.status >= 200 && response.status < 300) {
        	return response.text();
    	} else if (response.status == 404) {
    		return Promise.reject(new Error("Page data not found"));
    	} else if (response.status == 400) {
    		return Promise.reject(new Error("Error, invalid request"));
    	} else {
        	return Promise.reject(new Error(response.status+": "+response.statusText));
    	}
	}

	function createProfile(username, password, stocks){
		stocks = JSON.stringify(stocks);
		const message = {profile: username + ":::" + password + ":::" + stocks + '\n'};


		const fetchOptions = {
			method : 'POST',
			headers : {
				'Accept': 'application/json',
				'Content-Type' : 'application/json'
			},

			body : JSON.stringify(message)
		};


		let url = "http://localhost:3000/";
		fetch(url, fetchOptions)
			.then(checkStatus)
			.then(function(){
				login();
			})
			.catch(function(error) {
				 alert(error);
			});
	}

	function login(){
		let url = "http://localhost:3000/";
		let username = document.getElementById("userText").value;
		let password = document.getElementById("passwordText").value;

		fetch(url, {method: "GET"})
		   .then(checkStatus)
		   .then(function(responseText) {
			   //console.log(responseText);
				let data = JSON.parse(responseText);

				let flag = "new";
				for (let profile of data.profiles){
					//console.log(profile.name);
					//console.log(profile.password);
					if (profile.name == username && profile.password == password){
						flag = "right";
						currentProfile = profile;
						if (currentProfile != null){
							for (let i in currentProfile.stocks){
								let stock = String(currentProfile.stocks[i]);
								getStockDiv(stock, "searchAndPort");
							}
						}
						break;

					}
					else if (profile.name == username && profile.password != password){
						flag = "wrong"
						break;
					}
					else if (profile.name != username && profile.password != password){
						flag = "new";
					}
				}
				//console.log(flag);
				if(flag == "wrong"){
					alert("Wrong password");
				}
				else if (flag == "new"){
					alert("Will create new profile for " + username);
					let stocks = [];
					createProfile(username, password, stocks);
				}
			})
		   .catch(function(error) {
			   alert(error);
		   })

	}




}) ();
