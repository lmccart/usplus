
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

var socket = io.connect('http://fixus.jit.su:80');
var userGuid = guid();
socket.on('news', function (data) {
  console.log(data);
  socket.emit('set nickname', { name: userGuid });
});

socket.on('stats', function (data) {
  console.log(data);
  gapi.hangout.layout.displayNotice("do something", true);
});


function manualInputSubmit() {
  socket.emit('event', {
    transcript: document.getElementById('manualInput').value,
    confidence: 1});

}

function getProcessingSketchId () { return 'PinTumbler'; }