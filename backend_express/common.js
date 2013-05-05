/*
 * common.js
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


// Require the configuration file
//var config = require(__dirname + "/config_prod.json");
var config = (process.env.NODE_ENV == 'production') ? require(__dirname + "/config_prod.json") : require(__dirname + "/config_local.json");

// Config mongo
var Db = require('mongodb').Db;
var MongoServer = require('mongodb').Server;
var mongo = new Db(config.mongo.db, new MongoServer(config.mongo.host, config.mongo.port, {strict:true, auto_reconnect:true}), {w: 1});

var db_suffix = '_scratch';
var socket = '';

function sendMessage(msg, log) {
	console.log(msg);

	if (module.exports.socket) {
		console.log("socket = ");
		console.log(module.exports.socket);
		console.log('that was socket');
		socket.emit('stats', msg);
	}
	else console.log('no socket');

	io.sockets.emit('stats', msg);
	/*if (engine.clients) {

		// send msg
	  Object.keys(engine.clients).forEach(function(key) {
		  engine.clients[key].send(JSON.stringify(msg));
	  });
	  
	  //for printing all messages
	  //console.log(msg);
	}*/
	

  // log msg
  if (log) {
	  mongo.collection('messages'+db_suffix, function(err, collection) {
			collection.insert(msg);
	  //console.log("INSERTED IN 'messages"+db_suffix+msg);
		});
	}	
}

function setSocket(socket) {
	socket = socket;
	module.exports.socket = socket;
}


module.exports = {

	config: config,

	url : require('url'),
	net : require('net'),
	fs : require('fs'),	
	
	//JRO - now setting start time when you unlock a db
	startTime : new Date(2012, 9, 22, 21), //defaults to third debate right now
	
	lastCCTime : new Date().getTime(),
	
	sendMessage : sendMessage,

	mongo : mongo,
 	async : require('async'),
 	db_suffix : db_suffix,
 	
 	
 	// is it initialized
 	initialized : false,

 	socket: "",
 	setSocket: setSocket,

 	users: [],
 	io: []
};

