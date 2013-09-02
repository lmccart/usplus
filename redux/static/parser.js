var Parser = function(db) {	

	var db = db;
	var statsHandler = StatsHandler(db);
	

	return {
	
		initialize: function() {
			// making two tables for LIWC because it's faster
			console.log("building");


			// load non-wild table if needed
		  if (!db.tableExists("LIWC_words")) {
		  	db.createTable("LIWC_words", ["word", "cats", "wildcard"]);
		  	//db.truncate("LIWC_words");
		  	for (var i=0; i<LIWC.length; i++) {
		  		if (LIWC[i]['word'])
				  	db.insertOrUpdate("LIWC_words", {word: LIWC[i]['word']}, {word: LIWC[i]['word'], wildcard: false, cats: LIWC[i]['cat']});
		  	}
		  	console.log("loaded nonwild "+LIWC.length);
		  	db.commit();
	 		}
	  	// then load wild table
		  if (!db.tableExists("LIWC_words_wild")) {
		  	db.createTable("LIWC_words_wild", ["word", "cats", "wildcard"]);
		  	//db.truncate("LIWC_words_wild");
			  
			  for (var i=0; i<LIWC_wild.length; i++) {
		  		if (LIWC_wild[i]['word'])
				  	db.insertOrUpdate("LIWC_words_wild", {word: LIWC_wild[i]['word']}, {word: LIWC_wild[i]['word'], wildcard: true, cats: LIWC_wild[i]['cat']});
		  	}
		  	console.log("loaded wild "+LIWC_wild.length);
		  	db.commit();	
			} 
		}, 
	
		parseLine: function(line) {
		
			console.log(line);
			var spaceRegEx = new RegExp(/\S{1,}/g);
			var numberRegEx = new RegExp(/\d{1,}.{1,}\d{1,}/);
			var abbrevRegEx = new RegExp(/\w{1,}[\'|\-]\w{1,}/); //JRO edit\
			var wordRegEx = new RegExp(/[\w|@|#]{1,}/);
			
			
			// add words to sentence
			//split input string with RegExo
			var tokens = line.match(spaceRegEx);
			var msg = {type: "wordcount", count:tokens.length};
			handleMessage(msg);

			for (i in tokens) //JRO - hack to only process one token at a time
			{
				//If the element isn't the last in an array, it is a new word
				if (tokens[i] !== "") 
				{
					var tok = tokens[i];
					
					var word = null;
					// pull any numbers	
					var numWord = tok.match(numberRegEx);
					if (numWord) {
						//console.log('number');
						word = numWord[0];
					}
					//console.log("tok2:"+tok);
		
					// pull any abbreviations
					var abbrevWord = tok.match(abbrevRegEx);
					if (abbrevWord && !word) {
						//console.log('abbrev');
						word = abbrevWord[0];
					}
					//console.log("tok3:"+tok);
		
					// pull out word
					var plainWord = tok.match(wordRegEx);
					if (plainWord && !word) {
						word = plainWord[0];
					} 
		
					// add message
					if (word) {
						word = word.toString();
			
						if (word.indexOf('*') != -1) {
							word = this.reDirty(word);
						}

						var cats = this.getCats(word);
						statsHandler.logWordInstance(word, cats);
						// var msg = {type: "word", word:word, cats:cats};
						// send message
						// handleMessage(msg);
					}

				}
			}
			
			// calculate stats for the line
			statsHandler.doStats();
		},
		
		getCats: function(w) {
			
			var cats = [];

			// check for regular match
			var res = db.query("LIWC_words", {word: w.toLowerCase()}); 
			if (res.length > 0) {
				cats = res[0].cats;
			}
			
			// check for wildcards
			else {
			// select all books by Torday and Sparrow
				res = db.query("LIWC_words_wild", function(row) {
			    if(w.toLowerCase().indexOf(row.word) == 0) {
			        return true;
			    } else {
			        return false;
			    }
			  });
			  if (res.length > 0) {
				  cats = res[0].cats;
			  }
			}
						 
			return cats;
		}
	},

	reDirty: function(w) {

		var swears = {
		"f***": "fuck",
		"f*****": "fucker",
		"f******": "fucking",
		"b***": "butt",
		"c***": "cock",
		"t***": "tits",
		"f***": "fucker",
		"f****": "fucking",
		"c***": "cunt",
		"b****": "bitch",
		"b******": "bitches",
		"b******": "bitching",
		"a******": "asshole",
		"p***": "piss",
		"p****": "pussy",
		"n*****": "nigger",
		"s***": "slut",
		"w****": "whore"
		};

		var s = swears[w];
		if (s) w = swears[w];
};



