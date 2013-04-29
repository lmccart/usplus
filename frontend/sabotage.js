
var socket;
var messages = messagePlayer(this);

// URI parsing helper functions.
function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};



parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};


function init() {
	
	var args = parseUri(document.URL).queryKey;
  var d = args.delay ? parseFloat(args.delay) : 10;
  if (args.docName) {
  	connect(args.docName, d);
  }
	messages.loadMessages();
	messages.playbackMessages(0);
}



// Connect via engine.io, send loadDoc message if docName is specified in URL args.
function connect() {
	console.log('connected');
	
	socket = new eio.Socket({ host: location.hostname, port: 8081 });

	// Send up options.
	socket.send(JSON.stringify({
	  event: "loadDoc",
	
	  data: {
	    // Pass up the document name if it's set.
	    docName: args.docName,
	
	    // delay between each char chunk
	    delay: d
	  }
	}));
	
  socket.on("message", function(msg) {
  	handleMessage(msg);
	});
}

// Handle incoming messages and distribute to appropriate functions.
function handleMessage(msg) {
	
	switch(msg.type) {
		case 'live':
			console.log('live');
			break;
		case 'word':
			handleWord(msg);
			break;
		case 'sentenceEnd':
			handleSentenceEnd(msg);
			break;
		case 'stats':
			handleStats(msg);
			break;
		default:
			break;
	}
}
