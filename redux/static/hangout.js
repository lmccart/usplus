var db = new localStorageDB("db", localStorage);;
var parser = Parser(db)
parser.initialize();
var width, height;


var categories = [
  "posemo",
  "i"
];


var localID = "";
var otherID = "";
var baseScore = 0;
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
  width = $('#feedback').width();
  for(var i = 0; i < categories.length; i++) {
    var category = categories[i];
    $('#feedback').append("<div class='category'><div class='score local' id='local"+category+"'>"+category+"</div><div class='score other' id='other"+category+"'></div></div>");
    $('.score').css('height', height / categories.length);
  }
  startSpeech();
});




function draw() {

  // Update LIWC cats
  var maxScale = 0.8;

  for(var i = 0; i < categories.length; i++) {
    var balance = 0.5;

    var val = gapi.hangout.data.getValue(localID+"-"+categories[i]);
    var localScore = val ? parseFloat(val) : 0;
    console.log(localScore);

    val = otherID ? gapi.hangout.data.getValue(otherID+"-"+categories[i]) : false;
    var otherScore = val ? parseFloat(val) : baseScore;
    var totalScore = localScore+otherScore;
    
    if(totalScore > 0) {
      balance = localScore / totalScore;
    }

    var category = categories[i];
    var pct = Math.round(Math.min(balance, Math.max(balance, 0), 1)*100) + "%";
    console.log(pct);
    $('#'+category).width(pct);

    // PEND NOTIFY HERE
    if(i == maxScale) {
      //$('#command').text(getCommand(i, balances[i]));
      //gapi.hangout.layout.displayNotice(getCommand(i, balances[i]), false);
    }
  }
  
  // Update talk time
  var balance = 0.5;

  var st0 = new Date(parseInt(gapi.hangout.data.getValue(localID+"-st"), 10));
  st0 = st0.toLocaleTimeString();
  st0 = st0.substring(st0.indexOf(':')+1, st0.indexOf(' '));
  
  var st1 = otherID ? parseInt(gapi.hangout.data.getValue(otherID+"-st"), 10) : 0;
  st1 = new Date(st1);
  st1 = st1.toLocaleTimeString();
  st1 = st1.substring(st1.indexOf(':')+1, st1.indexOf(' '));

  
  $('#talkTime0').text(st0);
  $('#talkTime1').text(st1);
  
  // PEND NOTIFY HERE and AUTO MUTE
  if(true) {
    //$('#command').text(getCommand(i, balances[i]));
    //gapi.hangout.layout.displayNotice(getCommand(i, balances[i]), false);
  }

  // Update smile
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
  
  else if (msg.type == 'speech') {
    gapi.hangout.data.setValue(localID+"-speaking", msg.val);
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
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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

function unnormalize(point, ctx) {
  result = new Object();
  result.x = map(point.x, -.5, +.5, 0, ctx.canvas.width);
  result.y = map(point.y, -.5, +.5, 0, ctx.canvas.height);
  return result;
}

function length(a) {
  //return Math.sqrt(a.x * b.x + a.y * b.y);
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

function distance(a, b) {
  return length({x: b.x - a.x, y: b.y - a.y});
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
    if (canvas) {
      var ctx = canvas.getContext('2d');

      background(255, ctx);
      fill(0, ctx);

      imagePoints = [
        event.leftEye,
        event.leftEyebrowLeft,
        event.leftEyebrowRight,

        event.rightEye,
        event.rightEyebrowLeft,
        event.rightEyebrowRight,

        event.lowerLip,
        event.upperLip,
        event.mouthCenter,
        event.mouthLeft,
        event.mouthRight,

        event.noseRoot,
        event.noseTip
      ];

      for(point in imagePoints) {
        circle(unnormalize(imagePoints[point], ctx), 2, ctx);
      }


      // type error somewhere around here>>
      imagePointSum = {x: 0, y: 0};
      for(point in imagePoints) {
        imagePointSum.x += imagePoints[point].x;
        imagePointSum.y += imagePoints[point].y;
      }
      imagePointSum.x /= imagePoints.length;
      imagePointSum.y /= imagePoints.length;
      scale = length(imagePointSum);
      mouthWidth = distance(event.mouthLeft, event.mouthRight);
      //console.log(mouthWidth / scale);

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
    }
  } catch (e) {
    console.log(e+": "+e.message);
  }
}
