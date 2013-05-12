
// wait until hangout ready then load everything

if (gapi && gapi.hangout) {

  var initHangout = function(apiInitEvent) {
    if (apiInitEvent.isApiReady) {
      //prepareAppDOM();

      console.log("hangout ready");


      $.getScript("//fixus.jit.su//javascripts/two.min.js", function(a, b, c) {
          
        $.getScript("//fixus.jit.su/socket.io/socket.io.js", function(a, b, c) {
          console.log('socket.io loaded');
          $('body').append('<div class="browser-landing" id="main"><div class="compact marquee"><div id="info" style="visibility: visible;"><p id="info_start" style="display: inline;"> Click on the microphone icon and begin speaking for as long as you like. </p><p id="info_speak_now" style="display: none;"> Speak now. </p><p id="info_no_speech" style="display: none;"> No speech was detected. You may need to adjust your <a href="http://support.google.com/chrome/bin/answer.py?hl=en&answer=1407892">microphone settings</a>. </p><p id="info_no_microphone" style="display: none;"> No microphone was found. Ensure that a microphone is installed and that <a href="http://support.google.com/chrome/bin/answer.py?hl=en&answer=1407892"> microphone settings</a> are configured correctly. </p><p id="info_allow" style="display: none;"> Click the "Allow" button above to enable your microphone. </p><p id="info_denied" style="display: none;"> Permission to use microphone was denied. </p><p id="info_blocked" style="display: none;"> Permission to use microphone is blocked. To change, go to chrome://settings/contentExceptions#media-stream </p><p id="info_upgrade" style="display: none;"> Web Speech API is not supported by this browser. Upgrade to <a href="http://www.google.com/chrome">Chrome</a> version 25 or later. </p></div><div id="div_start"><button id="start_button" onclick="startButton(event)" style="display: inline-block;"><img alt="Start" id="start_img" src="//fixus.jit.su/img/mic.gif"></button></div><div id="results"><span class="final" id="final_span"></span><span class="interim" id="interim_span"></span></div><textarea id="manualInput" rows="1">i me you we happy sad and angry</textarea><button onclick="manualInputSubmit()" ontap="manualInputSubmit()">Submit</button></div></div><div id="draw-shapes"></div>');
          
          start();

          $.getScript("//fixus.jit.su//javascripts/speech.js", function(a, b, c) {
            console.log('speech.js loaded');
          });
        });
      });

      gapi.hangout.data.onStateChanged.add(function(stateChangeEvent) {
      });
      gapi.hangout.onParticipantsChanged.add(function(partChangeEvent) {
      });

      gapi.hangout.onApiReady.remove(initHangout);
    }
  };

  gapi.hangout.onApiReady.add(initHangout);
}


var socket;

function start() {

  var elem = document.getElementById('draw-shapes');
  var params = { width: 285, height: 200 };
  var two = new Two(params).appendTo(elem);

  // two has convenience methods to create shapes.
  var circle = two.makeCircle(72, 100, 50);
  var rect = two.makeRectangle(213, 100, 100, 100);

  // The object returned has many stylable properties:
  circle.fill = '#FF8000';
  circle.stroke = 'orangered'; // Accepts all valid css color
  circle.linewidth = 5;

  rect.fill = 'rgb(0, 200, 255)';
  rect.opacity = 0.75;
  rect.noStroke();

  // Don't forget to tell two to render everything
  // to the screen
  two.update();

  socket = io.connect('http://fixus.jit.su:80');
  console.log(socket);
  var userGuid = guid();
  socket.on('news', function (data) {
    console.log(data);
    socket.emit('set nickname', { name: userGuid });
  });

  socket.on('stats', function (data) {
    console.log(data);
      circle.linewidth = 10;
      two.update();
    gapi.hangout.layout.displayNotice("do something", true);
  });

}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

function manualInputSubmit() {
    console.log(socket);
  socket.emit('event', {
    transcript: document.getElementById('manualInput').value,
    confidence: 1});

}
