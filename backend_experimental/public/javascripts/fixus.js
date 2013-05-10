
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

function getProcessingSketchId () { return 'PinTumbler'; }



var elem = document.getElementById('draw-shapes');
console.log(elem);
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

two.update();


