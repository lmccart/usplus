
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

var app = express();
app.set('port', process.env.PORT || 3000);

// all environments
//app.set('views', __dirname + '/views');
//app.engine('html', require('ejs').renderFile);
//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(express.bodyParser());
//app.use(express.methodOverride());
//app.use(app.router);
//  app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));


var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

common.io = require('socket.io').listen(server);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//app.listen(3000);


common.io.sockets.on('connection', function (socket) {

	
  socket.emit('news', { hello: 'world' });
  
  socket.on('set nickname', function (data) {
    socket.set('nickname', data.name, function () {
      socket.emit('ready');
      if (common.users.indexOf(data.name) == -1) {
      	console.log("adding name "+data.name+" user:"+common.users.length);
      	common.users.push(data.name);
      }
    });
  });

  socket.on('event', function (data) {
    socket.get('nickname', function (err, name) {
    	var user = common.users.indexOf(name);
    	if (user !== -1) {
	    	console.log('event: '+data.transcript+' ('+data.confidence+') by '+name);
				cc.handleChars(' '+data.transcript+' ', user, stats.sendStats);
				stats.sendStats();
			} else console.log("unrecognized nickname "+name)
    });
  });

  socket.on('speaking', function (data) {
    socket.get('nickname', function (err, name) {
    	var user = common.users.indexOf(name);
    	if (user !== -1) {
     		console.log('speaking: ' + data.status + ' by'+name);
     	} else console.log("unrecognized nickname "+name)
    });
  });
});


var ccSocket; 
var ind, nextInd;
var charIntervalID;
var statIntervalID;



function start() {


	// mongodb
	common.mongo.open(function(err, p_client) {

		// authenticate
		if (common.config.mongo.user) {
		  common.mongo.authenticate(common.config.mongo.user, common.config.mongo.pass, function(err, p_client) { 
		  	console.log("authenticated");
				common.initialized = true;
	  		clearDB(common.db_suffix);
		  }); 
		} else {
			common.initialized = true;
	  	clearDB(common.db_suffix);
	  }
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


