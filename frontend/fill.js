// Handle incoming word message.
function handleWord(msg) {
	console.log('word '+msg.word);
	appendWordInContext(msg);
}

// Handle incoming sentenceEnd message.
function handleSentenceEnd(msg) {
	console.log('sentenceEnd');	
}

// Handle incoming stats message.
function handleStats(msg) {
	console.log('stats');
}

function appendWordInContext(msg) {

 	// update curSentence
 	if (!msg.sentenceStartFlag && !msg.punctuationFlag)
 		$('#words').append(' ');
 		
 	$('#words').append(msg.word);

  
}