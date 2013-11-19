
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
        //console.log("no speech RESTART");
        startButton();
      }
      if (event.error == 'audio-capture') {
        //console.log('info_no_microphone');
      }
      if (event.error == 'not-allowed') {
        if (event.timeStamp - start_timestamp < 100) {
          //console.log('info_blocked');
        } else {
          //console.log('info_denied');
        }
      }
    };

    recognition.onend = function() {
      recognizing = false;

      // retrigger
      //console.log("RESTART");
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
            //console.log("event: "+event.results[i][0].transcript+" ("+event.results[i][0].confidence+")");
            parser.parseLine(event.results[i][0].transcript);

          } 
        }
      } //else //console.log("other person speaking");
    };
  }

  // trigger start button
  startButton();
}

function linebreak(s) {
  return s.replace(/\n\n/g, '<p></p>').replace(/\n/g, '<br>');
}


function startButton(event) {
  //console.log("start "+recognizing);
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

  var volAvgs = [0,0], sts = [0,0], displaysts = [0,0];


  // get vals for both
  for (var k=0; k<2; k++) {

    var id = (k==0) ? localParticipant.id : otherParticipant.id;
    ////console.log(id, k);
     
    if (id) {
      vals = gapi.hangout.data.getValue(id+"-volAvg;st;displayst");
      if(vals) {
        vals = vals.split(';');
        volAvgs[k] = parseInt(vals[0], 10);
        sts[k] = parseInt(vals[1], 10);
        displaysts[k] = parseInt(vals[2], 10);

        // double checking
        if (isNaN(volAvgs[k])) volAvgs[k] = 0;
        if (isNaN(sts[k])) sts[k] = 0;
        if (isNaN(displaysts[k])) displaysts[k] = 0;
      }
    }
  }

  // update vals for self
  if (localParticipant.id) {
    var vol = volumes[localParticipant.id];
    volAvgs[0] = (vol + (numSamples-1)*volAvgs[0])/numSamples;

    if (vol > 1.0 || volAvgs[0] > 1.0) {
      sts[0] += itvl;
      displaysts[0] += itvl;
    }
    ////console.log(vol, volAvgs[0], sts[0], displaysts[0]);
    gapi.hangout.data.setValue(localParticipant.id+"-volAvg;st;displayst", String(volAvgs[0])+";"+String(sts[0])+";"+String(displaysts[0]));
  }
  

  // 60s imbalance triggers notification
  if (sts[0] - sts[1] > automuteTimeout && !gapi.hangout.av.getMicrophoneMute()) {
  
    displayNotice("automute", "You've been auto-muted because you're talking too much.", automuteNoticeTimeout);
    gapi.hangout.av.setMicrophoneMute(true); 
    
    // reset both sts on automute
    for (var k=0; k<2; k++) {
      var id = (k==0) ? localParticipant.id : otherParticipant.id;
      gapi.hangout.data.setValue(id+"-volAvg;st;displayst", String(volAvgs[k])+";"+String(0)+";"+String(displaysts[k]));
    }
  }  


  for (var k=0; k<2; k++) {
    displaysts[k] = new Date(displaysts[k]);
    displaysts[k] = displaysts[k].toLocaleTimeString();
    displaysts[k] = displaysts[k].substring(displaysts[k].indexOf(':')+1, displaysts[k].indexOf(' '));

    $('#talkTime'+k).text(displaysts[k]);
  }
}

