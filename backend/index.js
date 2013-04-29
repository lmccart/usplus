/*
 * index.js
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
var cc = require('./ccHandler.js');
var stats = require('./statsHandler.js');


var tcpServer;
var ccSocket; //JRO
var doc;
var ind, nextInd;
var charIntervalID;
var statIntervalID;

//JRO - Listening to terminal for disconnect commands
var stdin = process.openStdin();

//If we want to write a restart script it can go here
stdin.on('data', function(chunk) { 
	
	//trim the input
	var msg = chunk.toString().replace('\n', '');
	console.log("Input message: " + msg + "<"); 
	
	if (msg == 'close') 
	{
		if (ccSocket) {
			ccSocket.write('close\n', 'utf8', function() {
				console.log('closing existing CC socket');
			});
		}
	}
	
});


//JRO shutdown code - listen to Ctrl-C events
process.on( 'SIGINT', function() {
  console.log( "\nRecon Backend shutting down from  SIGINT (Crtl-C)" );
  // some other closing procedures go here
  process.exit();
});


function start() {

	// Listen for input on stdin
	process.openStdin().on('data', function(chunk) { 
	
		//trim the input
		var msg = chunk.toString().replace('\n', '');
	
		if (msg.indexOf('use db') == 0) 
		{
			common.setWriteDb(msg.substring(7));
			console.log("Using DB: "+common.db_suffix);
			//if (common.db_suffix == '_scratch') unlockDb(true);
			//else unlockDb(false);
			unlockDb(false);
		}
		
		else if (msg == 'clear db') 
		{
			clearDB(common.db_suffix);
		}
		
		else if (msg == 'unlock')
		{
			//JRO - setting the start time with an unlockDb
			//common.startTime = new Date().getTime(); // taking out, defaults to debate 3 time, but doesnt matter, offset is from 1st msg received anyway
			unlockDb(true);

			//broadcast live state with an unlock - must be done after unlocking
			common.sendLiveState(); 
		}
		
		else if (msg == 'lock')
		{
			unlockDb(false);
			
			//broadcast live state with an unlock - must be done after unlocking
			common.sendLiveState();
		}
	
	});


	// on a 'connection' event
  common.engine.on("connection", function(socket) {
	
    //curSocket = socket;
    //console.log("Connection " + socket.id + " accepted.");
    
    //send message: live
    common.sendLiveState(socket);
    
    socket.on("message", function(msg) {
      msg = JSON.parse(msg);
      console.log(msg);

      switch (msg.event) {
        case "loadDoc":
        	console.log("Load Doc request from: "+msg.data["url"]);
        	//console.log(socket);
        	//if (msg.data["url"] == '127.0.0.1:8000') loadDoc(msg.data["docName"], msg.data["delay"]);
        	//else console.log("Not accepting loadDoc messages from remote");
        	loadDoc(msg.data["docName"], msg.data["delay"]);
        	break;
        case "loadHistory":
        	loadHistory();
        	break;
      }
    });
        
    socket.on("close", function(){
      //curSocket = null;
      console.log("Connection " + socket.id + " terminated.");
    });	    

  });
	
  // create tcp server for handling cc chars stream
  tcpServer = common.net.createServer();
	//Pass in null for host to bind server to 0.0.0.0. Then it will accept connections directed to any IPv4 address.
	tcpServer.listen(8088, null, function (){
		console.log('TCP server listening on ' + tcpServer.address().address + ':' + tcpServer.address().port);
	});
	
	tcpServer.on('connection', function(sock) {
	
		//Maintain a pointer to this
		ccSocket = sock;
		
		//We have a connection - a socket object is assigned to the connection automatically
		console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
						
		//Add a 'data' event handler to this instance of socket
		sock.on('data', function(data){
			
			//JRO - new Data Methods
			data = String(data);
			//console.log('');
			//console.log("data: "+data+" "+data.length);
			
			var msg = cc.stripTCPDelimiter(data);	
			//console.log(msg+" "+msg.length);		
			//process.stdout.write(msg);
			
			cc.handleChars(msg);
			
		});
		
		//Add a 'close' event handler to this instance of socket
		sock.on('close', function(data){
			console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
		});
		
		sock.on('exit', function()
		{
			console.log("here");
			sock.close();
		});
		
	});
	
	tcpServer.on('exit', function() {
		console.log("server exit");
		tcpServer.close();
	});
	
	tcpServer.on('error', function() {
		console.log("server error");
		tcpServer.close();
	});
	
	//JRO shutdown code
	process.on('exit', function () {
		
		console.log('Got "exit" event from REPL!');
		//now how do we close the server and all sockets?
		console.log('Server connections:' + tcpServer.connections);
		
		if (ccSocket) {
			ccSocket.write('close\n', 'utf8', function() {
				console.log('socket disconnect sent');
			});
			ccSocket.destroy();
		}
		
		tcpServer.close(function () {
			console.log("Closing server fron exit()");
		});
		
		console.log('Server connections:' + tcpServer.connections);
		process.exit();
		
	});

	// mongodb
	common.mongo.open(function(err, p_client) {
	
		common.initialized = true;
		
		// authenticate
		if (common.mongouser) {
		  common.mongo.authenticate(common.mongouser, common.mongopass, function(err, p_client) { 
		  }); 
		}

	  //default to scratch db, clear it, and unlock it
	  //common.startTime = new Date().getTime(); // defaults to debate 3 time, but really doesn't matter, playback based on offset from 1st msg
	  common.setWriteDb('scratch');
	  unlockDb(false); //defualts to false
	  clearDB(common.db_suffix);
	  //unlockDb(false); //happens a touch later, helps with clear


		
	});

    
}

// do it
start();


function clearDB(dbSuffix)
{

	console.log('Clear DB:' + dbSuffix);	

  // Remove the file.
  try {
  common.fs.unlinkSync("/tmp/test.json");
  } catch (ex) { }


	//clear out all the collections
	common.mongo.collection("messages"+dbSuffix, function(err, collection) {
		collection.remove(function(err, result) {});
	});
	common.mongo.collection("word_instances"+dbSuffix, function(err, collection) {
		collection.remove(function(err, result) {});
	});
	common.mongo.collection("sentence_instances"+dbSuffix, function(err, collection) {
		collection.remove(function(err, result) {});
	});
	common.mongo.collection("unique_words"+dbSuffix, function(err, collection) {

		collection.remove(function(err, result) {});
	});
	
	//ngrams
	for (var j=2; j<5; j++) {

		common.mongo.collection("unique_"+j+"grams"+dbSuffix, function(err, collection) {
			collection.remove(function(err, result) {});
		});
	}

}

function unlockDb(flag)
{
	common.unlockDb(flag);
	if (flag) {		
		statIntervalID = setInterval(stats.sendStats, 5000);
	} else {
		clearInterval(statIntervalID);
	}
		
}


function loadDoc(docName, delay) {

	console.log("d "+delay+" n "+docName);
	
	//common.setWriteDb('1test');
	//unlockDb(true)
	//common.sendLiveState();
    
	common.usingDoc = true; //JRO
	
	// reset start date
	common.startTime = new Date().getTime(); //only reset is here, for live the default is debate 3 time
		
	try {
		doc = common.fs.readFileSync(__dirname + '/documents/' + docName, 'utf8');
		
		if (delay == 0) {
			cc.handleChars(doc);
			cc.sendEndMessage();
		} else {
			ind = 0;
			nextInd = 0;
			clearInterval(charIntervalID);
			charIntervalID = setInterval(sendCharsFromDoc, delay);
		}
	} catch (e) {
		console.log(e);
	}	
}
/*
function loadHistory() {
		common.mongo.collection('messages'+common.db_suffix, function(err, collection) {
		collection.find(function(err, cursor) {
			cursor.each(function(err, msg) { 
				// PEND only send to client requesting!
				common.sendMessage(msg, false);
			});
		});
	});	
}
*/
function sendCharsFromDoc() {

	if (ind < doc.length) {
		nextInd = Math.min(ind + 2, doc.length);
		cc.handleChars(doc.substring(ind, nextInd));
		ind = nextInd;
	}
	else {
		clearInterval(charIntervalID);
		cc.sendEndMessage();
	}
	
}

