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
var config = require(__dirname + "/config.json");

var fs = require('fs');
var Db = require('mongodb').Db;
var MongoServer = require('mongodb').Server;
var engine = require('engine.io')
var mongo = new Db(config.mongo.db, new MongoServer(config.mongo.host, config.mongo.port, {strict:true})); 


var engine =  engine.listen(8081, "127.0.0.1");

var db_suffix = '_scratch';
var unlock_db = false;

var usingDoc = false; //JRO


function sendMessage(msg, log) {

	if (engine.clients) {

		// send msg
	  Object.keys(engine.clients).forEach(function(key) {
		  engine.clients[key].send(JSON.stringify(msg));
	  });
	  
	  //for printing all messages
	  //console.log(msg);
	}

  // log msg
  if (log) {
	  mongo.collection('messages'+db_suffix, function(err, collection) {
			collection.insert(msg);
	  //console.log("INSERTED IN 'messages"+db_suffix+msg);
		});
	}	
}


function sendLiveState(socket)
{
	var db = -1;
	
	if (unlock_db)
	{
		if (db_suffix == '_d0' || db_suffix == '_d0test') db = 0;
		else if (db_suffix == '_d1' || db_suffix == '_d1test') db = 1;
		else if (db_suffix == '_d2' || db_suffix == '_d2test') db = 2;
		else db = -1; //using -1 if scratch db is selected
	}

	var msg = {
		type: "livestate",
		debate: db
	};
	
	//if socket is provided, send only to that socket
	if (socket) {
		console.log("CONNECT: sending live state: " + JSON.stringify(msg)); 
		socket.send(JSON.stringify(msg)); 
	}
	else
	{
		//console.log("HEARTBEAT: sending live state: " + JSON.stringify(msg));
		Object.keys(engine.clients).forEach(function(key) {
		  engine.clients[key].send(JSON.stringify(msg));
	  });
	}
  
	
}

function setWriteDb(db) {

	console.log("setWriteDb(" + db + ")");

	switch (db) {
		case '0':
			db_suffix = '_d0';
			break;
		case '1':
			db_suffix = '_d1';
			break;
		case '2':
			db_suffix = '_d2';
			break;
			
		case '0test':
			db_suffix = '_d0test';
			break;
		case '1test':
			db_suffix = '_d1test';
			break;
		case '2test':
			db_suffix = '_d2test';
			break;
			
		//JRO - using scratch DB as the default	
		case 'scratch':
			db_suffix = '_scratch';
			break;
			
		default:
			db_suffix = '_scratch';
			//console.log('db name not recognized, using _scratch');
			break;
	}
	
	//console.log("set db "+db_suffix +" "+ db);
	module.exports.db_suffix = db_suffix;
	
}

function unlockDb(unlock)
{
  //console.log("Unlock DB:"+db_suffix+ " Set:"+unlock);
	unlock_db = unlock;
}

function dbUnlocked()
{
	return unlock_db;
}



module.exports = {
	url : require('url'),
	net : require('net'),
	fs : fs,	
	
	//JRO - now setting start time when you unlock a db
	startTime : new Date(2012, 9, 22, 21), //defaults to third debate right now
	
	lastCCTime : new Date().getTime(),
	
	sendMessage : sendMessage,
	setWriteDb : setWriteDb,
	
	mongo : mongo,
 	engine : engine,
 	async : require('async'),
 	db_suffix : db_suffix,
 	
 	unlockDb : unlockDb,
 	dbUnlocked : dbUnlocked,
 	
 	sendLiveState : sendLiveState,
 	
 	// is there a live streaming debate
 	live : false,
 	
 	// is it initialized
 	initialized : false
};

