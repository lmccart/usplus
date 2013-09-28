
var recognizing = false;
var start_timestamp;
var recognition;
var selfSpeaking = false;

function startSpeech() {

  if (!('webkitSpeechRecognition' in window)) {
    upgrade();
  } else {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    setInterval(checkSpeaker, 100);
    setInterval(function(){updateSpeechTime(500);}, 500);

    recognition.onstart = function() {
      recognizing = true;
    };

    recognition.onerror = function(event) {
      if (event.error == 'no-speech') {
        console.log("no speech RESTART");
        startButton();
      }
      if (event.error == 'audio-capture') {
        console.log('info_no_microphone');
      }
      if (event.error == 'not-allowed') {
        if (event.timeStamp - start_timestamp < 100) {
          console.log('info_blocked');
        } else {
          console.log('info_denied');
        }
      }
    };

    recognition.onend = function() {
      recognizing = false;

      // retrigger
      console.log("RESTART");
      startButton();
    };

    recognition.onresult = function(event) {
      // check it's your own audio
      if (selfSpeaking) {
        if (typeof(event.results) == 'undefined') {
          recognition.onend = null;
          recognition.stop();
          upgrade();
          return;
        }
        for (var i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal && !gapi.hangout.av.getMicrophoneMute()) {
            console.log("event: "+event.results[i][0].transcript+" ("+event.results[i][0].confidence+")");
            parser.parseLine(event.results[i][0].transcript);

          } 
        }
      } //else console.log("other person speaking");
    };
  }

  // trigger start button
  startButton();
}

function linebreak(s) {
  return s.replace(/\n\n/g, '<p></p>').replace(/\n/g, '<br>');
}


function startButton(event) {
  console.log("start "+recognizing);
  if (!recognizing) {
    recognition.lang = 'en-US';
    recognition.start();
    ignore_onend = false;
    start_timestamp = event ? event.timeStamp : new Date().getTime();
  }
}


function checkSpeaker() {
  var volumes = gapi.hangout.av.getVolumes();
  var localVol = localParticipant.id ? volumes[localParticipant.id] : 0;
  var otherVol = otherParticipant.id ? volumes[otherParticipant.id] : 0;
  selfSpeaking = localVol >= otherVol;
}

function updateSpeechTime(itvl) {

  var numSamples = 1000/itvl;

  // get volumes
  var volumes = gapi.hangout.av.getVolumes();

  var localTime = 0, otherTime = 0;
  
  for (var i=0; i<2; i++) {

    var id = (i==0) ? localParticipant.id : otherParticipant.id;
     
    if (id) vals = gapi.hangout.data.getValue(id+"-volAvg;st;displayst").split(';');

    var vol = id ? volumes[id] : 0;
    var volAvg = id ? parseFloat(vals[0]) : 0;

    // update volume avg
    if (!i) {
      volAvg = (vol + (numSamples-1)*volAvg)/numSamples;
    }

    // update talk time
    var st = 0, displayst = 0;
    if (id) {
      st = parseInt(vals[1], 10);
      if (isNaN(st)) st = 0;
      displayst = parseInt(vals[2], 10);
      if (isNaN(displayst)) displayst = 0;
    }


    if (!i && (vol > 0 || volAvg > 1.0)) {
      st += itvl;
      displayst += itvl;
      
      gapi.hangout.data.setValue(id+"-volAvg;st;displayst", String(volAvg)+";"+String(st)+";"+String(displayst));

      localTime = st;
    }
    else if (i) {
      otherTime = st;
    }


    displayst = new Date(displayst);
    displayst = displayst.toLocaleTimeString();
    displayst = displayst.substring(displayst.indexOf(':')+1, displayst.indexOf(' '));

    $('#talkTime'+i).text(displayst);
  }

  // 60s imbalance triggers notification
  if (localTime - otherTime > automuteTimeout) {
    displayNotice("automute", "You've been auto-muted because you're talking too much.", automuteNoticeTimeout);
    if(!gapi.hangout.av.getMicrophoneMute()) {
      gapi.hangout.av.setMicrophoneMute(true); //pend temp
      
      // reset both sts on automute
      for (var i=0; i<2; i++) {
        var id = (i==0) ? localParticipant.id : otherParticipant.id;
        if (id) gapi.hangout.data.setValue(id+"-st;displayst", "0;"+String(displayst));
      }
    }
  } 
}
