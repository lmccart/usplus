/*
 * ccHandler.js
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

//These variables need to remain global so that we can add to the buffers periodically
var cur2Gram = ["", ""];
var cur3Gram = ["", ""];
var cur4Gram = ["", ""];
var minNGramOccurrences = 2;

//Called from outside of 
function handleChars(newChars, user, callback)
{
	parseWords(newChars, user, callback);

}

//Function takes a buffer and pulls out any words
function parseWords(text, user, callback)
{

	//split input string with RegExo
	var tokens = text.split(' ');

	for (i in tokens)
	{
		//If the element isn't the last in an array, it is a new word
		if (tokens[i] !== "")
		{
			var tok = tokens[i];
			
			//console.log("tok:"+tok + " l:"+tok.length );

			handleWord(user, tok.toString(), callback); 
		}
	}
}

function handleWord(user, w, callback)
{	

	//console.log("HANDLE WORD "+w+" user "+user);
	var curWordID = new common.mongo.bson_serializer.ObjectID(); 
	var curTime = new Date().getTime();
	var timeDiff = curTime - common.startTime;
	
	common.lastCCTime = curTime;

	// if new sentence, generate ID and insert into sentence_instances

	var funcs = [

	    function(cb) { // look up categories
		  	getCats(w, cb);
	    },

	    function(cats, cb) { // log unique word
		    //console.log("cats "+cats);
		    logUniqueWord(curWordID, w, cats, cb);
	    },

	    function(uniqueWDoc, cb) { // log word instance
		    //console.log("uniqueWDoc "+uniqueWDoc);
	   		logWordInstance(user, curWordID, uniqueWDoc, timeDiff, cb);
	   	},

	    function(uniqueWDoc, cb) { // process 4 grams
				processNGrams(4, timeDiff, user, curWordID, uniqueWDoc, [], cb);
			},

	    function(uniqueWDoc, ngrams, cb) { // process 3 grams
				processNGrams(3, timeDiff, user, curWordID, uniqueWDoc, ngrams, cb);
			},

	    function(uniqueWDoc, ngrams, cb) { // process 2 grams
				processNGrams(2, timeDiff, user, curWordID, uniqueWDoc, ngrams, cb);
			},
		function() {
			callback();
		}
	];

	var cb = function(err, res) {
	    //console.log(arguments);
	};

	common.async.waterfall(funcs, cb);


}


function getCats(w, cb) {

	var cats = [];

	//looking for any digit within the string
	if (w.search(/\d/) != -1) {
		cats.push('numbrz');
	}
	
	//adding six letter words
	if (w.length >= 7) {
		cats.push('sixltr');
	}

	common.mongo.collection('LIWC', function(e, c) {
		// first check if it's in LIWC (non wildcard)
		c.findOne({'word':w.toLowerCase()}, function(err, doc) {

			// add categories
			if (doc) {
				//console.log("NORMAL "+w);
				cb(null, cats.concat(doc.cat));
			} 

			//TODO: This needs to be fixed, currently not working
			else { // if not found, check wildcards
				common.mongo.collection('LIWC_wildcards', function(e, c) {
					c.findOne({$where: "'"+w.toLowerCase()+"'.indexOf(this.word) == 0" }, function(err, wdoc) {
						if (wdoc) {
							//console.log("WILDCARD:" + w + " CAT:" + wdoc.cat + " ORIGINAL:" + wdoc.word);
							cb(null, cats.concat(wdoc.cat));
						} 
						else cb(null, cats);
					});
				});
			}
		});
	});
}

function logUniqueWord(wordID, w, cats, cb) {

	//console.log('logUniqueWord:' + w);
	common.mongo.collection('unique_words'+common.db_suffix, function(err, collection) { 
		// upsert unique_words
		collection.findAndModify(
			{word: w}, 
			[['_id','asc']], 
			{$push: {wordInstanceIDs: wordID}, $set: {cats: cats}},
			{upsert:true, new:true},
			function(err, object) {
				//console.log("object "+object);
				cb(null, object);
		});
	});
}

function logWordInstance(user, wordID, uniqueWDoc, time, cb) {
	//console.log('logWordInstance');
	// insert into word_instances with cats
	common.mongo.collection('word_instances'+common.db_suffix, function(err, collection) {
		// insert into word_instances
		var doc = {
			_id: wordID,
			word: uniqueWDoc.word,
			userID: user,
			cats: uniqueWDoc.cats,
			timeDiff: time
		}
		collection.insert(doc);
		cb(null, uniqueWDoc);
	});
}


function processNGrams(l, t, user, wID, uniqueWDoc, ngrams, cb) {

	//console.log('processNGrams');

	var curGram;
	if (l == 2) curGram = cur2Gram;
	else if (l == 3) curGram = cur3Gram;
	else if (l == 4) curGram = cur4Gram;

	// check for 2grams
	if (curGram.length == l && (uniqueWDoc.word != 'Undefined') && (uniqueWDoc.word != 'undefined')) {
		curGram.shift();
		curGram.push(uniqueWDoc.word);
		common.mongo.collection('unique_'+l+'grams'+common.db_suffix, function(e, c) {
			c.findAndModify(
				{ngram: curGram, userID:user},
				[['_id','asc']], 
				{$push: {wordInstanceIDs: wID}}, 
				{upsert:true, new:true},
				function(err, object) {
					if(object.wordInstanceIDs.length == minNGramOccurrences) {
						sendNewNGram(t, user, object._id, curGram, l);
					}
					if(object.wordInstanceIDs.length >= minNGramOccurrences) {
						ngrams.push([object._id, object.wordInstanceIDs.length]);
					}
					cb(null, uniqueWDoc, ngrams);
				}
			);
		});
	} else {
		curGram.push(uniqueWDoc.word);
		cb(null, uniqueWDoc, ngrams);
	}
}

function checkNGram(i, msg) {

	if (i < msg.ngram.length) {
		common.mongo.collection('unique_words'+common.db_suffix, function(e, c) {
			c.find({cats:'funct', word:msg.ngram[i]}).count(function(err, val) {
				if (val == 0) {
					if (i == msg.ngram.length-1) return msg;
					else checkNGram(i+1, msg);
				}
			});
		});
	}
}

function sendNewNGram(t, user, nid, n, nInstances) {
	
	var message = {
		type: "newNGram",
		user: user,
		timeDiff: t,
		dbid: nid,
		ngram: n, 
		instances: nInstances
	};
  checkNGram(0, message);
  // todo: add ngrams back in
  //common.sendMessage(message, true);
}



//exposing this to for debugging and testing
//TODO: make private once tested
exports.parseWords = parseWords;
exports.handleChars = handleChars;