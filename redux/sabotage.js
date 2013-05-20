var db = new localStorageDB("db", localStorage);;
var parser = Parser(db);


function init() {
	parser.initialize(this.start, null);
}


function start() {
	console.log("start()");

}

// Handle incoming messages and distribute to appropriate functions.
function handleMessage(msg) {
	console.log(msg);
	switch(msg.type) {
		case 'word':
			break;
		case 'sentenceEnd':
			break;
		case 'stats':
			break;
		default:
			break;
	}
}
