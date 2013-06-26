var db = new localStorageDB("db", localStorage);;
var parser = Parser(db);
parser.initialize();
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

var localID = "";
var otherID = "";
var baseScore = 1;
var scalePower = 2, minHeightScale = 1, maxHeightScale = 50;

// wait until hangout ready then load everything
if (gapi && gapi.hangout) {

  var initHangout = function(apiInitEvent) {
    if (apiInitEvent.isApiReady) {
      //prepareAppDOM();

      console.log("hangout ready");

      // init data vals
      localID = gapi.hangout.getLocalParticipantId();
      gapi.hangout.data.setValue(localID+"-wc", "0");
      gapi.hangout.data.setValue(localID+"-st", "0");
      for (var i=0; i<categories.length; i++) {
        gapi.hangout.data.setValue(localID+"-"+categories[i], String(baseScore));
      }

      // attach listeners
      gapi.hangout.data.onStateChanged.add(function(stateChangeEvent) {
        handleStateChange(stateChangeEvent);
      });
      gapi.hangout.onParticipantsChanged.add(function(partChangeEvent) {
        console.log("participants changed");
        var participants = gapi.hangout.getParticipants();
        var idFound = false;
        for (var i=0; i<participants.length; i++) {
          if (participants[i].id != localID) {
            otherID = participants[i].id;
            console.log("otherID set to "+otherID);
            break;
          }
        }
        if (!idFound) otherID = ""; // reset to empty if no other participant
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
    $('#feedback').append("<div class='category'><div class='score local' id='local"+category+"'>"+category+"</div><div class='score other' id='other"+category+"'></div></div>");
    $('.score').css('height', height / categories.length);
  }
  startSpeech();
});




function draw() {

  var totalScale = 0;
  var maxScale = 0;
  var maxScaleIndex = 0;
  var balances = new Array(categories.length);
  var scales = new Array(categories.length);

  for(var i = 0; i < categories.length; i++) {

    var val = gapi.hangout.data.getValue(localID+"-"+categories[i]);
    var localScore = val ? parseFloat(val) : baseScore;
    console.log(localScore);

    val = otherID ? gapi.hangout.data.getValue(otherID+"-"+categories[i]) : false;
    var otherScore = val ? parseFloat(val) : baseScore;
    var totalScore = localScore+otherScore;
    
    if(totalScore > 0) {
      balances[i] = localScore / totalScore;
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
    $('#local'+category).width(widtha);
    $('#local'+category).height(curHeight);
    $('#other'+category).width(widthb);
    $('#other'+category).height(curHeight);
    
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
    console.log(msg);
    for(var i = 0; i < categories.length; i++) {
      console.log(localID+"-"+categories[i]);
      gapi.hangout.data.setValue(localID+"-"+categories[i], String(msg[categories[i]]));
    }
  }
  else if (msg.type == 'wordcount') {
    var count = parseInt(gapi.hangout.data.getValue(localID+"-wc"), 10);
    count += msg.count;
    gapi.hangout.data.setValue(localID+"-wc", String(count));
  }
  else if (msg.type == 'speechtime') {
    var time = parseInt(gapi.hangout.data.getValue(localID+"-st"), 10);
    time += msg.time;
    gapi.hangout.data.setValue(localID+"-st", String(time));
  }
  

}

function handleStateChange(ev) {
  console.log('state changed');
  //console.log(gapi.hangout.data.getValue(localID+"-st"));
  //gapi.hangout.layout.displayNotice(flip, true);

  draw();
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
