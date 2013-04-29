var messagePlayer = function(app) {
	
	var setTimeoutEvents = [];
	var obj;
	
	return {
		loadMessages: function() {
			console.log("load msgs");
			obj = JSON && JSON.parse(messagesJSON) || $.parseJSON(messagesJSON);
			console.log(obj.messages.length);
			
		},
		
		sendMessage: function(msg) {
			console.log("send msg");
		},
		
		
		playbackMessages: function(transcriptID) {
    	
    	console.log("playback messages "+transcriptID);
    	var n = 0;
  		var startMsg = obj.messages[0];

      function runMessage(i) {
      
      	console.log("runmsg "+i);
      
        var msg = obj['messages'][i];
      	app.handleMessage(msg);
        
        var lastMsg = (i == 0) ? startMsg : obj.messages[i-1];

        console.log("last msg "+lastMsg+" msg "+msg);
  			diff = Math.max(0, msg.timeDiff - lastMsg.timeDiff);
  			
      	console.log("diff "+diff);
        //if (app.modifier) {
        //  diff = diff / app.modifier;
        //}
        
        
  			setTimeoutEvents.push(setTimeout(function() {
  				// trigger app.trigger("message:" + msg['type'], { msg: msg['attributes'] });

          if (obj.messages.length > i+1) {
            runMessage(i+1);
          } else console.log("end of msgs");
        }, diff, this));
  			console.log("settimeout "+msg.word+" "+diff);
	  		
      }

      runMessage(0);
    }
	};

};