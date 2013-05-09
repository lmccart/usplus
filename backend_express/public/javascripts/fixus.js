
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

var socket = io.connect();
var userGuid = guid();
socket.on('news', function (data) {
  console.log(data);
  socket.emit('set nickname', { name: userGuid });
});
function manualInputSubmit() {
  socket.emit('event', {
    transcript: document.getElementById('manualInput').value,
    confidence: 1});
}

