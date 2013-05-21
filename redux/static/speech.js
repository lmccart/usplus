

var final_transcript = '';
var recognizing = false;
var ignore_onend;
var start_timestamp;
var recognition, speechHysteresis;

function startSpeech() {

  showInfo('info_start');
  if (!('webkitSpeechRecognition' in window)) {
    upgrade();
  } else {
    start_button.style.display = 'inline-block';
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // set up a hysteresis object that turns "on" immediately, but takes 1 second to turn "off"
    speechHysteresis = new hysteresis();
    speechHysteresis.risingDelay = 0;
    speechHysteresis.fallingDelay = 1000;
    speechHysteresis.ontrigger = function() {
      console.log("trigger");
      //socket.emit('speaking', { status: true});
    };
    speechHysteresis.onuntrigger = function() {
      console.log("untrigger");
      //socket.emit('speaking', { status: false});
    };
    // regularly feed the hysteresis object "off" in order to generate "end of speech" events
    setInterval(function() {speechHysteresis.update(false)}, 200);

    recognition.onstart = function() {
      recognizing = true;
      showInfo('info_speak_now');
      start_img.src = '//lmccart-fixus.appspot.com/static/img/mic-animate.gif';
    };

    recognition.onerror = function(event) {
      if (event.error == 'no-speech') {
        start_img.src = '//lmccart-fixus.appspot.com/static/img/mic.gif';
        showInfo('info_no_speech');
        ignore_onend = true;
      }
      if (event.error == 'audio-capture') {
        start_img.src = '//lmccart-fixus.appspot.com/static/img/mic.gif';
        showInfo('info_no_microphone');
        ignore_onend = true;
      }
      if (event.error == 'not-allowed') {
        if (event.timeStamp - start_timestamp < 100) {
          showInfo('info_blocked');
        } else {
          showInfo('info_denied');
        }
        ignore_onend = true;
      }
    };

    recognition.onend = function() {
      recognizing = false;
      if (ignore_onend) {
        return;
      }
      start_img.src = '//lmccart-fixus.appspot.com/static/img/mic.gif';
      if (!final_transcript) {
        showInfo('info_start');
        return;
      }
      showInfo('');
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
        var range = document.createRange();
        range.selectNode(document.getElementById('final_span'));
        window.getSelection().addRange(range);
      }
    };

    recognition.onresult = function(event) {
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

          // lmccart - send msg to socket
          console.log("event: "+event.results[i][0].transcript+" ("+event.results[i][0].confidence+")");
          parser.parseLine(event.results[i][0].transcript);
          //socket.emit('event', { transcript: event.results[i][0].transcript, confidence: event.results[i][0].confidence});

        } else {
          interim_transcript += "|";
          for (var j = 0; j < event.results[i].length; ++j) {
            interim_transcript += event.results[i][j].transcript;
            interim_transcript += "(" + event.results[i][j].confidence + ")";
            interim_transcript += " | ";
          }
        }
      }
      final_transcript = capitalize(final_transcript);
      final_span.innerHTML = linebreak(final_transcript);
      interim_span.innerHTML = linebreak(interim_transcript);
    };
  }
}

function upgrade() {
  start_button.style.visibility = 'hidden';
  showInfo('info_upgrade');
}

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
  return s.replace(first_char, function(m) { return m.toUpperCase(); });
}

function startButton(event) {
  if (recognizing) {
    recognition.stop();
    return;
  }
  final_transcript = '';
  recognition.lang = 'en-US';
  recognition.start();
  ignore_onend = false;
  final_span.innerHTML = '';
  interim_span.innerHTML = '';
  start_img.src = '//lmccart-fixus.appspot.com/static/img/mic-slash.gif';
  showInfo('info_allow');
  start_timestamp = event.timeStamp;
}

function showInfo(s) {

  if (s) {
    for (var child = info.firstChild; child; child = child.nextSibling) {
      if (child.style) {
        child.style.display = child.id == s ? 'inline' : 'none';
      }
    }
    info.style.visibility = 'visible';
  } else {
    info.style.visibility = 'hidden';
  }
}

function hysteresis() {
  var lastTime = 0;
  var lastValue = false, curValue = false;

  this.risingDelay = 0;
  this.fallingDelay = 0;
  this.ontrigger = function(){};
  this.onuntrigger = function(){};


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