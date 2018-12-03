/*
 * bbcalc.js
 * CSc 337, fall 2018
 *
 * Created On: 11/27/18
 * Author: David Wang & Anthony Pietrofeso
 * Description: This is the script for the bounce back calculator.
 * In general, it searches through a list of stocks and arranges them in order
 * of which stocks had the largest single day drops. The ones with the largest
 * drops (or fewest gains) are displayed. A user can sign in and keep track of
 * these stocks in their "portfolio".
 * Notably, I am only watching 5 total stocks because my free api call is limited to
 * 5 calls per minute.
 */

"use strict";

(function() {
	let currentProfile = null;
	let loginDisplay = false;

	let purchaseType = true;
	let purchaseButton = null;

	let availableStocks = {};
	let biggestDrops = [];

	let portfolioTotal = 0;

	// Ideally, I'd choose the top 100+ most active
	// let watching = ["AMD", "INTC", "MXIM", "AAPL", "CMCSA",
	// "QQQ", "CSCO", "SIRI", "MSFT", "MU"];

	// But my free API key is limited to 5 calls a minute / 500 a day.
	let watching = ["AMD", "INTC", "MXIM", "AAPL", "CMCSA"];

	// Sets up event listeners for logging in
	window.onload = (function () {
		document.getElementById("logInOut").onclick = signInOut;

		document.getElementById("loginForm").onsubmit = login;

		displayBBStocks();
	});

	/*
	 * displayBBStocks
	 *
	 * This function waits until all stock data necessary is found
	 * then sorts it in ascending order by change percentage.
	 * The first five are displayed.
	 */
	async function displayBBStocks() {
		for (let ticker of watching) {
			// It is promised that the stock data will be found.
			let res = await getStockData(ticker);
			console.log(res);
		}

		biggestDrops.sort(function(a, b) {return a.change - b.change});
		for (let i = 0; i < 5; i++) {
			displayStockData(biggestDrops[i], "BBStocks");
		}
	}

	/*
	 * signInOut
	 *
	 * event for the logInOut button.
	 * signs out of already signed in. If signed out, toggles the sign in display.
	 */
	function signInOut() {
		let signInDiv = document.getElementById("signIn");
		let userText = document.getElementById("userText");
		let passwordText = document.getElementById("passwordText");

		//signed in
		if(currentProfile != null) {
			currentProfile = null;
			loginDisplay = true;
			userText.value = "";
			passwordText.value = "";
			signInDiv.style.display = "block";
			document.getElementById("topText").innerHTML =
					"Sign in to see your portfolio";
			this.value = "log in";
			displayCurrentProfile();
		} else {	// signed out
			userText.value = "";
			passwordText.value = "";
			if (loginDisplay) {
				signInDiv.style.display = "none";
				loginDisplay = false;
			} else {
				signInDiv.style.display = "block";
				loginDisplay = true;
			}
		}
	}

	/*
	 * getStockData
	 *
	 * Params: ticker - A string representing a stocks ticker symbol.
	 *
	 * Returns a promise that gets the last two stock open and close prices.
	 * It calculates the change in prices. This stock is added to both
	 * a json object containing all available stocks and an array to sort.
	 */
	function getStockData(ticker) {
		return new Promise(function(resolve, reject) {
			let url = "https://www.alphavantage.co/query?function=";
			url += "TIME_SERIES_DAILY&symbol="
			url += ticker;

			// If things stop working, switch keys. Likely out of free calls.
			// url += "&apikey=MC4A891THRXU4GAO";
			url += "&apikey=N0KY93Q4FPKZYQHI";

			fetch(url)
			.then(checkStatus)
			.then(function(responseText) {
				let stockData = JSON.parse(responseText)["Time Series (Daily)"];

				let date1 = getValidDate(false, stockData);
				let date2 = getValidDate(true, stockData);

				let openPrice = parseFloat(stockData[date1]["1. open"]);
				let closePrice = parseFloat(stockData[date2]["4. close"]);
				let changeInPrice = ((openPrice - closePrice) / openPrice) * 100;

				let stockObj = {ticker: ticker,
								quantity: 0,
								open: openPrice,
								close: closePrice,
								change: changeInPrice};

				console.log(stockObj);
				availableStocks[ticker] = stockObj;
				biggestDrops.push(stockObj);
				resolve("Stock Found.");
			})
			.catch(function(error) {
				console.log(error.message);
				resolve("Stock not found.");
			});
		});
	}

	/*
	 * displayStockData
	 *
	 * Params:  stockObj - A json object representing stock data
	 *			appendTo - A string representing a div to append the stock div to
	 *
	 * Creates a set div containing all pertinent stock information to display.
	 * This div is appended to the given div.
	 */
	function displayStockData(stockObj, appendTo) {
		let stockDiv = document.createElement("div");
		stockDiv.classList.add("aStock");

		let title = document.createElement("h3");
		title.innerHTML = stockObj.ticker;
		stockDiv.appendChild(title);

		let open = document.createElement("p");
		open.innerHTML = "Opening Price: ";
		open.innerHTML += asMoney(stockObj.open);
		stockDiv.appendChild(open);

		let close = document.createElement("p");
		close.innerHTML = "Closing Price: ";
		close.innerHTML += asMoney(stockObj.close);
		stockDiv.appendChild(close);

		let change = document.createElement("p");
		change.innerHTML = "Percent Change: ";
		let colorChange = document.createElement("span");
		colorChange.innerHTML = (stockObj.change.toFixed(2) + "%");
		if (stockObj.change < 0) {
			colorChange.classList.add("red");
		} else {
			colorChange.classList.add("green");
		}
		change.appendChild(colorChange);
		stockDiv.appendChild(change);

		if ((stockObj.quantity > 0) && (appendTo == "current")) {
			let quantityDiv = document.createElement("p");
			quantityDiv.innerHTML = "Quantity: ";
			quantityDiv.innerHTML += stockObj.quantity;
			stockDiv.appendChild(quantityDiv);
		}

		let buy = document.createElement("input");
		buy.classList.add("buy");
		buy.type = "submit";
		buy.onclick = (function() {
			purchaseType = true;
			purchaseButton = this;
		});
		buy.value = "buy";
		// buy.onclick = buySell;
		// stockDiv.appendChild(buy);

		let sell = document.createElement("input");
		sell.classList.add("sell");
		sell.type = "submit";
		sell.onclick = (function() {
			purchaseType = false;
			purchaseButton = this;
		});
		sell.value = "sell";
		// sell.onclick = buySell;
		// stockDiv.appendChild(sell);

		let quantity = document.createElement("input");
		quantity.type = "text";
		quantity.placeholder = "quantity";
		quantity.classList.add("quantity");
		quantity.pattern = "^[0-9]+$";
		quantity.title="Must be a positive integer amount";
		// stockDiv.appendChild(quantity);

		// Switched to forms to get regex validation
		let form = document.createElement("form");

		form.onsubmit = buySell;
		form.appendChild(buy);
		form.appendChild(sell);
		form.appendChild(quantity);
		stockDiv.appendChild(form);

		document.getElementById(appendTo).appendChild(stockDiv);
	}

	/*
	 * buySell
	 *
	 * Event for purchasing (buy or sell) form submission.
	 * Sends POST requests of updated stock portfolios.
	 */
	function buySell() {
		let parent = purchaseButton.parentNode;
		let ticker = parent.parentNode.querySelector("h3").innerHTML;
		let quantityElement = parent.querySelector(".quantity");
		let positive = true;
		if (!purchaseType) {
			positive = false;
		}

		if (currentProfile == null) {
			alert("Please sign in to use this feature!");
			quantityElement.value = "";
			return false;
		} else {
			let quantity = parseInt(quantityElement.value);
			quantityElement.value = "";
			if (isNaN(quantity)) {
				alert("Please input a valid input into the quantity selector");
				return false;
			}
			if (quantity <= 0) {
				alert("Please input a positive integer quantity");
				return false;
			}

			for (let s of currentProfile.stocks) {
				// Note that if stocks are purchased on different days with different prices,
				// then they will have different stock sections.
				if ((s.ticker == ticker) && (Math.abs(s.open 
							- availableStocks[ticker].open) < .01)) {
					console.log("stock found");
					if (positive) {
						s.quantity += quantity;
					} else {
						if (quantity > s.quantity) {
							alert("You do not have enough stock to sell");
							return false;
						}
						s.quantity -= quantity;
					}

					editProfile(currentProfile.name, currentProfile.password,
							currentProfile.stocks);
					displayCurrentProfile();
					return false;
				}
			}

			if (!positive) {
				alert("You do not have the stock to sell");
				return false;
			}

			console.log("stock not found");
			let stockObj = availableStocks[ticker];
			stockObj.quantity = quantity;
			currentProfile.stocks.push(stockObj);
			editProfile(currentProfile.name, currentProfile.password,
					currentProfile.stocks);
			displayCurrentProfile();
			return false;

		}

		return false;
	}

	/*
	 * displayCurrentProfile
	 *
	 * Displays all of the stocks that the user has purchased.
	 */
	function displayCurrentProfile() {
		let current = document.getElementById("current");
		removeAll(current);

		if (currentProfile != null) {
			if (currentProfile.stocks.length > 0) {
				portfolioTotal = 0;
				for (let s of currentProfile.stocks) {
					if (s.quantity > 0) {
						portfolioTotal += parseFloat(s.open) * parseInt(s.quantity);
						displayStockData(s, "current");
					}
				}

				let showTotal = document.createElement("h2");
				showTotal.innerHTML = "Portfolio Total: " + asMoney(portfolioTotal);
				current.appendChild(showTotal);
			}
		}
	}


	/*
	 * editProfile
	 *
	 * Params: 	username -	String representing a user.
	 * 			password -	String representing a user's password.
	 *			stocks -	An array of JSON objects containing stock data.
	 *
	 * This is a POST request.
	 * If the user/password combo exists in the server, it will update its stocks
	 * with the given stocks. Otherwise, it will create the user with the given
	 * password and add the stocks.
	 */
	function editProfile(username, password, stocks){
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
				console.log("sent POST");
			})
			.catch(function(error) {
				 console.log(error.message);
			});
	}

	/*
	 * login
	 *
	 * This is a GET request.
	 * It searches the database for the username/password combo given in the form.
	 * If it is found, it logs in. If the username exists but the password doesn't,
	 * it alerts the user. If neither exist, it will create the combo and log in.
	 */
	function login(){
		let url = "http://localhost:3000/";
		let username = document.getElementById("userText").value;
		let password = document.getElementById("passwordText").value;

		if (username == "" || password == "") {
			alert("Cannot leave username or password fields blank");
			return false;;
		}

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
						signInOut();
						document.getElementById("logInOut").value = "log out";
						currentProfile = profile;
						document.getElementById("topText").innerHTML = "Welcome "
								+ currentProfile.name + "!";
						displayCurrentProfile();
						break;

					}
					else if (profile.name == username && profile.password != password){
						flag = "wrong";
						document.getElementById("passwordText").value = "";
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
					editProfile(username, password, stocks);
					signInOut();
					document.getElementById("logInOut").value = "log out";
					currentProfile = {name: username, password: password, stocks: []};
					document.getElementById("topText").innerHTML = "Welcome " 
							+ currentProfile.name + "!";
					displayCurrentProfile();
				}

				return false;
			})
		   .catch(function(error) {
			   console.log(error.message)
			   return false;
		   })

		  return false;
	}

	// Helper function to return latest date that exists in the stockData.
	// If next is true, it returns the second latest date.
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

	// This is a helper function that takes a Date object and
	// returns a string representation.
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

	// Helper function that returns a monetized string representing a double.
	function asMoney(someFloat) {
		let dAmt = parseFloat(someFloat);
		dAmt = dAmt.toFixed(2);
		return ("$" + dAmt);
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

}) ();
