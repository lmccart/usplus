/*
 * statsHandler.js
 *
 * Copyright 2012 (c) Sosolimited http://sosolimited.com
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 */



var common = require('./common.js');

function sendStats(socket) {

	var curTime = new Date().getTime();
	if (curTime - common.lastCCTime < 5*1000) //stop sending stats fifteen seconds after last cc
	{
		//JRO - adding suffix
		common.mongo.collection('word_instances'+common.db_suffix, function(err, collection) {
			collection.find({userID:0}).count(function(err, total1) {
				collection.find({userID:1}).count(function(err, total2) {
		
					//console.log('STATS >> 1:'+total1+' 2:'+total2);
		
					var message = {
						type: "stats",
						calcs: [["funct", "+funct"], //function words. for testing.
										["posemo", "+posemo"], //use cat names if they correspond!
										["negemo", "+negemo"], 
										["anger", "+anger"], 
										["i", "+i"], 
										["we", "+we"], 
										["complexity", "+excl+tentat+negate-incl+discrep"],
										["status", "+we-i"],
										["depression", "+i+bio+negemo-posemo"],
										["formality", "-i+article+sixltr-present-discrep"],
										["honesty", "+i+excl-negemo"]],
						tempVal: [0,0],
						total: [total1, total2],
						timeDiff: new Date().getTime() - common.startTime
					};
				
					calcCats(message);
				
					common.sendMessage(message, socket, true);
				});
				
			});
		});
		
	}
}

function calcCats(msg) {

	if (msg['calcs'].length === 0) {
		return msg;
	}
	
	else {
	
		var traitModifier = msg['calcs'][0][1].substring(0,1);
		var traitName = msg['calcs'][0][0];
		
		var catEndIndex = msg['calcs'][0][1].substring(1).search(/[+,-]+/)+1;
		if (catEndIndex === 0) catEndIndex = msg['calcs'][0][1].length;
		
		var catName = msg['calcs'][0][1].substring(1,catEndIndex);
		var remainder = msg['calcs'][0][1].substring(catEndIndex);
		
		//console.log(traitModifier+" "+traitName+" "+catEndIndex+" "+catName+" "+remainder);
	
		// if we've already looked up this val within this function call, don't do it again
		// TODO: this should be looked up each time correct?
		
		
		if (msg[traitName]) {
		
			addVal(msg, traitModifier, traitName, [msg[traitName][0]*msg['total'][0], msg[traitName][1]*msg['total'][1]], remainder);
			
		} else {
	
			//JRO - adding db suffix
			common.mongo.collection('word_instances'+common.db_suffix, function(err, collection) {

				collection.find({cats:catName, userID:0}).count(function(err, val1) {
					collection.find({cats:catName, userID:1}).count(function(err, val2) {
	
						addVal(msg, traitModifier, traitName, [val1, val2], remainder);
					});
					
				});
				
				
			});
			
		}
	}
}

function addVal(msg, modifier, name, val, remainder) {
	console.log("addVal "+modifier+" "+name+" "+val+" "+remainder+" "+msg['total']);

	if (modifier === '-') val = [-1*val[0], -1*val[1]];

	msg['tempVal'] = [msg['tempVal'][0]+val[0], msg['tempVal'][1]+val[1]];
	
	if (remainder.length === 0) {
		msg[name] = [(msg['total'][0] == 0) ? 0 : msg['tempVal'][0]/msg['total'][0],
								 (msg['total'][1] == 0) ? 0 : msg['tempVal'][1]/msg['total'][1]];
		msg['tempVal'] = [0,0];
		msg['calcs'].shift();
		console.log('msg done');
		console.log(msg);
	}
	else {
		//console.log(curVal+" "+val+" "+msg['total']+" "+traitName+"="+msg[traitName]);
		msg['calcs'][0][1] = remainder;
	}				
	calcCats(msg);
	
}


exports.sendStats = sendStats;