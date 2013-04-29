
/**
 * Module dependencies.
 */



var common = require('./common.js');
var cc = require('./ccHandler.js');
var stats = require('./statsHandler.js');


var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


app.get('/', function (req, res)
{
  res.render('index.html');
});

app.get('/socket', function (req, res)
{
  res.render('socket_test.html');
});


app.listen(3000);

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});




var ccSocket; 
var ind, nextInd;
var charIntervalID;
var statIntervalID;


//JRO shutdown code - listen to Ctrl-C events
process.on( 'SIGINT', function() {
  console.log( "\nRecon Backend shutting down from  SIGINT (Crtl-C)" );
  // some other closing procedures go here
  process.exit();
});


function start() {


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
        	break;
        case "loadHistory":
        	break;
      }
    });
        
    socket.on("close", function(){
      //curSocket = null;
      console.log("Connection " + socket.id + " terminated.");
    });	    

  });
	

	/*
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
*/

	
	//JRO shutdown code
	process.on('exit', function () {
		
		console.log('Got "exit" event from REPL!');
		
		if (ccSocket) {
			ccSocket.write('close\n', 'utf8', function() {
				console.log('socket disconnect sent');
			});
			ccSocket.destroy();
		}

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

	  clearDB(common.db_suffix);
		
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


