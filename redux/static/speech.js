

var final_transcript = '';
var recognizing = false;
var start_timestamp;
var recognition, speechHysteresis;
var selfSpeaking = false;

function startSpeech() {

  showInfo('info_start');
  if (!('webkitSpeechRecognition' in window)) {
    upgrade();
  } else {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // set up a hysteresis object that turns "on" immediately, but takes 1 second to turn "off"
    speechHysteresis = new hysteresis();
    // regularly feed the hysteresis object "off" in order to generate "end of speech" events
    setInterval(function() {speechHysteresis.update(false);}, 200);
    setInterval(checkSpeaker, 100);
    setInterval(function(){updateSpeechTime(250);}, 250);

    recognition.onstart = function() {
      recognizing = true;
      showInfo('info_speak_now');
    };

    recognition.onerror = function(event) {
      if (event.error == 'no-speech') {
        console.log("no speech RESTART");
        startButton();
      }
      if (event.error == 'audio-capture') {
        showInfo('info_no_microphone');
      }
      if (event.error == 'not-allowed') {
        if (event.timeStamp - start_timestamp < 100) {
          showInfo('info_blocked');
        } else {
          showInfo('info_denied');
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
        var interim_transcript = '';
        if (typeof(event.results) == 'undefined') {
          recognition.onend = null;
          recognition.stop();
          upgrade();
          return;
        }
        // there is some kind of speech event
        speechHysteresis.update(true);
        //console.log(event);
        for (var i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
            final_transcript += "(" + event.results[i][0].confidence + ")";

            console.log("event: "+event.results[i][0].transcript+" ("+event.results[i][0].confidence+")");
            parser.parseLine(event.results[i][0].transcript);

          } else {
            interim_transcript += "|";
            for (var j = 0; j < event.results[i].length; ++j) {
              interim_transcript += event.results[i][j].transcript;
              interim_transcript += "(" + event.results[i][j].confidence + ")";
              interim_transcript += " | ";
            }
          }
        }
        final_transcript = final_transcript;
        //final_span.innerHTML = linebreak(final_transcript);
        //interim_span.innerHTML = linebreak(interim_transcript);
      } else console.log("other person speaking");
    };
  }

  // trigger start button
  startButton();
}

function upgrade() {
  showInfo('info_upgrade');
}

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}


function startButton(event) {
  console.log("start "+recognizing);
  if (!recognizing) {
    final_transcript = '';
    recognition.lang = 'en-US';
    recognition.start();
    ignore_onend = false;
    // final_span.innerHTML = '';
    // interim_span.innerHTML = '';
    showInfo('info_allow');
    start_timestamp = event ? event.timeStamp : new Date().getTime();
  }
}

function showInfo(s) {

  // if (s) {
  //   for (var child = info.firstChild; child; child = child.nextSibling) {
  //     if (child.style) {
  //       child.style.display = child.id == s ? 'inline' : 'none';
  //     }
  //   }
  //   info.style.visibility = 'visible';
  // } else {
  //   info.style.visibility = 'hidden';
  // }
}

function hysteresis() {
  var lastTime = 0;
  var lastValue = false, curValue = false;

  this.risingDelay = 0;
  this.fallingDelay = 1000;
  /*this.ontrigger = function(){
    console.log("trigger");
  };
  this.onuntrigger = function(){
    console.log("untrigger");
  };*/


  this.update = function(value) {
    var curTime = Date.now();
    if(value != curValue) {
      if(value != lastValue) {
        lastTime = curTime;
      }
      var delay = value ? this.risingDelay : this.fallingDelay;
      if(curTime - lastTime >= delay) {
        if(value) {
          this.ontrigger();
        } else {
          this.onuntrigger();
        }
        curValue = value;
      }
    }
    lastValue = value;
  }
}

function checkSpeaker() {
  var volumes = gapi.hangout.av.getVolumes();
  var localVol = localID ? volumes[localID] : 0;
  var otherVol = otherID ? volumes[otherID] : 0;
  //console.log(volumes);
  var prevSpeaking = selfSpeaking;
  selfSpeaking = localVol >= otherVol;
  if (prevSpeaking != selfSpeaking) console.log("selfSpeaking switched to "+selfSpeaking);
}