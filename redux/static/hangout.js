var db = new localStorageDB("db", localStorage);;
var parser = Parser(db);
var height;


var categories = [
  "posemo",
  "negemo",
  "anger", 
  "complexity", 
  "status",
  "depression",
  "formality",
  "honesty"
];

var lessCommand = [
  "Dial down the sunshine!",
  "Look on the bright side!",
  "Calm down, don't be such a dick!", 
  "Can't you say it clearly?",
  "Speak for yourself!",
  "Pull yourself out of it already!",
  "You elitist asshole.",
  "Nobody wants to read your diary!"
];

var moreCommand = [
  "Look on the bright side!",
  "Dial down the sunshine!",
  "Grow a pair.", 
  "Thank you captain obvious.", 
  "It's not all about you all the time!",
  "You can't really be that happy.",
  "Who do you think you're talking to? Ever heard of manners?",
  "Be more honest! Fucking lying piece of shit!"
];

var baseScore = 1;
var scalePower = 2, minHeightScale = 1, maxHeightScale = 50;

var scoresa = new Array(categories.length);
var scoresb = new Array(categories.length);

for (var i=0; i<categories.length; i++) {
  scoresa[i] = 0;
  scoresb[i] = 0;
}


// wait until hangout ready then load everything
if (gapi && gapi.hangout) {

  var initHangout = function(apiInitEvent) {
    if (apiInitEvent.isApiReady) {
      //prepareAppDOM();

      console.log("hangout ready");

      start();

      gapi.hangout.data.onStateChanged.add(function(stateChangeEvent) {
      });
      gapi.hangout.onParticipantsChanged.add(function(partChangeEvent) {
      });
      gapi.hangout.av.effects.onFaceTrackingDataChanged.add(onFaceTrackingDataChanged);

      gapi.hangout.onApiReady.remove(initHangout);
    }
  };

  gapi.hangout.onApiReady.add(initHangout);
}

$(window).load(function() {
  console.log('window load');

  // setup
  height = $('#feedback').height();
  for(var i = 0; i < categories.length; i++) {
    var category = categories[i];
    $('#feedback').append("<div class='category'><div class='score mine' id='my"+category+"'>"+category+"</div><div class='score yours' id='your"+category+"'></div></div>");
    $('.score').css('height', height / categories.length);
  }


  startSpeech();
  draw();
});

function start() {
  console.log('start');
  parser.initialize();
}





function draw() {
  var totalScale = 0;
  var maxScale = 0;
  var maxScaleIndex = 0;
  var balances = new Array(categories.length);
  var scales = new Array(categories.length);
  for(var i = 0; i < categories.length; i++) {
    var totalScore = scoresa[i] + scoresb[i];
    if(totalScore > 0) {
      balances[i] = scoresa[i] / totalScore;
    } else {
      balances[i] = .5;
    }
    scales[i] = Math.pow(2 * Math.abs(balances[i] - .5), scalePower);
    scales[i] = map(scales[i], 0, 1, minHeightScale, maxHeightScale);
    totalScale += scales[i];
    if(scales[i] > maxScale) {
      maxScale = scales[i];
      maxScaleIndex = i;
    }
  }

  var width = $('#feedback').width();
  var height = $('#feedback').height();
  for(var i = 0; i < categories.length; i++) {
    var curHeight = height * (scales[i] / totalScale);
    var widtha = balances[i] * width;
    var widthb = width - widtha;
    var category = categories[i];
    $('#my'+category).width(widtha);
    $('#my'+category).height(curHeight);
    $('#your'+category).width(widthb);
    $('#your'+category).height(curHeight);
    
    if(i == maxScaleIndex) {
      $('#command').text(getCommand(i, balances[i]));
      gapi.hangout.layout.displayNotice(getCommand(i, balances[i]), false);
    }
  }

}

function getCommand(category, balance) {
  return (balance > .5 ? lessCommand : moreCommand)[category];
}

// Handle incoming messages and distribute to appropriate functions.
function handleMessage(msg) {
  console.log(msg);

  if (msg.type == 'stats') {
    var flip = userGuid != data.users[0];
    var usera = flip ? 1 : 0;
    var userb = flip ? 0 : 1;
    console.log(data);
    //console.log("usera:"+usera+" userb:"+userb+" flip:"+flip+" userGuid:"+userGuid+" data.users[0]:"+data.users[0]);
    for(var i = 0; i < categories.length; i++) {
      scoresa[i] = (data.users[usera]) ? baseScore + data[categories[i]][usera] : baseScore;
      scoresb[i] = (data.users[userb]) ? baseScore + data[categories[i]][userb] : baseScore;
    }

    //gapi.hangout.layout.displayNotice(flip, true);

    console.log(scoresa);
    console.log(scoresb);


    draw();
  }
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


function map(x, inmin, inmax, outmin, outmax) {
  return ((x-inmin) / (inmax-inmin)) * (outmax-outmin) + outmin;
}

function manualInputSubmit() {
  parser.parseLine(document.getElementById('manualInput').value)
}


function rgb(brightness) {
  return 'rgb(' + brightness + ',' + brightness + ',' + brightness + ')';
}

function background(brightness, ctx) {
  ctx.save();
  ctx.fillStyle = rgb(brightness);
  ctx.fillRect(0, 0, ctx.width, ctx.height);
  ctx.restore();
}

function fill(brightness, ctx) {
  brightness |= 0;
  ctx.strokeStyle = ctx.fillStyle = rgb(brightness);
}

function circle(center, radius, ctx) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
}

var lastEvent;
var lastRoll, lastPan, lastTilt, lastScale, lastX;
function onFaceTrackingDataChanged(event) {
  try {
    lastEvent = event;

    if (!event.hasFace) {
      return;
    }

    $("#debugText").text(event.roll + " " + event.pan + " " + event.tilt);

    var canvas = document.getElementById("debugCanvas");
    var ctx = canvas.getContext('2d');
/*
    background(255, ctx);
    fill(0, ctx);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(1 / canvas.width, 1 / canvas.height);
    circle(event.leftEye, .01, ctx);
    circle(event.rightEye, .01, ctx);
    circle(event.noseTip, .01, ctx);
    ctx.restore();
*/
    /*
    lastRoll.unshift(event.roll);
    lastRoll.pop();
    lastPan.unshift(event.pan);
    lastPan.pop();
    lastTilt.unshift(event.tilt);
    lastTilt.pop();

    var dist = Math.sqrt(
        (event.leftEye.x - event.noseTip.x) *
            (event.leftEye.x - event.noseTip.x) +
                (event.leftEye.y - event.noseTip.y) *
                    (event.leftEye.y - event.noseTip.y));

    lastScale.unshift(dist);
    lastScale.pop();

    lastX.unshift(event.noseTip.x);
    lastX.pop();*/
  } catch (e) {
    console.log(e);
  }
}