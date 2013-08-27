var db = new localStorageDB("db", localStorage);;
var parser = Parser(db)
parser.initialize();
var width, height;




var categories = [
  "posemo",
  "i",
  "femininity",
  "aggression",
  "honesty"
];

var notifications = {
  "posemo" : [
    [ 0, 0.25, "< 0.25 posemo"],
    [ 1, 0.75, "> 0.75 posemo"]
  ],
  "i" : [
    [ 1, 0.75, "> 0.75 i"]
  ],
  "aggression" : [
    [ 0, 0.25, "< 0.25 aggression"],
    [ 1, 0.75, "> 0.75 aggression"]
  ],
  "honesty" : [
    [ 0, 0.25, "< 0.25 honesty"]
  ],
  "st" : [
    [ 0, 0.25, "< 0.25 speech time"],
    [ 1, 0.75, "> 0.75 speech time"]
  ]
};




var localParticipant, remoteParticipant;

var localID = "";
var otherID = "";
var baseScore = 0;

var lastNotificationTime = 0;

// wait until hangout ready then load everything
if (gapi && gapi.hangout) {

  var initHangout = function(apiInitEvent) {
    if (apiInitEvent.isApiReady) {
      //prepareAppDOM();

      console.log("hangout ready");

      // attach listeners
      gapi.hangout.data.onStateChanged.add(function(stateChangeEvent) {
        handleStateChange(stateChangeEvent);
      });

      updateAvatars();

      // init data vals
      localID = gapi.hangout.getLocalParticipantId();
      gapi.hangout.data.setValue(localID+"-wc", "0");
      gapi.hangout.data.setValue(localID+"-st", "0");
      gapi.hangout.data.setValue(localID+"-volAvg", "0");
      for (var i=0; i<categories.length; i++) {
        gapi.hangout.data.setValue(localID+"-"+categories[i], String(baseScore));
      }


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
        updateAvatars();
      });
      gapi.hangout.av.effects.onFaceTrackingDataChanged.add(onFaceTrackingDataChanged);

      gapi.hangout.onApiReady.remove(initHangout);
    }
  };

  gapi.hangout.onApiReady.add(initHangout);
}

$(window).load(function() {
  console.log('window load');
  startSpeech();
});




function notify() {

  // Update LIWC cats

  for(var i = 0; i < categories.length; i++) {
    var balance = 0.5;

    var val = gapi.hangout.data.getValue(localID+"-"+categories[i]);
    var localScore = val ? parseFloat(val) : 0;
    //console.log(localScore);

    val = otherID ? gapi.hangout.data.getValue(otherID+"-"+categories[i]) : false;
    var otherScore = val ? parseFloat(val) : baseScore;
    var totalScore = localScore+otherScore;
    
    if(totalScore > 0) {
      balance = localScore / totalScore;
    }

    var category = categories[i];
    var pct = Math.round(Math.min(balance, Math.max(balance, 0), 1)*100) + "%";
    //console.log(pct);
    $('#category-'+category).width(pct);

    // PEND NOTIFY HERE
    var notes = notifications[category];
    var now = new Date().getTime();
    if(notes && now - lastNotificationTime > 10000) {
      for (var j=0; j<notes.length; j++) {
        if ((!notes[j][0] && balance < parseFloat(notes[j][1])) // lt
          || (notes[j][0] && balance > parseFloat(notes[j][1]))) { // gt
          console.log(notes[j][2] + " " + !notes[j][0]+" "+parseFloat(notes[j][1])+" "+balance);
          console.log("DISPLAY "+notes[j][2]);
          gapi.hangout.layout.displayNotice(notes[j][2], false);

          lastNotificationTime = now;
          break;
        }  
      }
    } 
  }

  // Update smile
}

var localPerson, remotePerson;
function updateAvatars() {
  // get participants
  localPerson = gapi.hangout.getLocalParticipant().person;
  participants = gapi.hangout.getParticipants();
  for(i in participants) {
    person = participants[i].person;
    console.log("updating avatar " + i);
    console.log(person);
    if(person != localPerson) {
      remotePerson = person;
    }
  }

  $("#avatar0").attr('src', localPerson.image.url);
  if(remotePerson) {
    $("#avatar1").attr('src', remotePerson.image.url);
  }
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
}

function handleStateChange(ev) {
  notify();
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
