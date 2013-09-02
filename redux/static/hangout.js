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
    [ 0, 0.25, ["Try to look on the bright side.", "Stop being such a downer.", "Try to be more positive."]],
    [ 1, 0.8, ["Tone it down a bit, your partner doesn't sound so happy."]]
  ],
  "i" : [
    [ 1, 0.75, ["Stop talking about yourself so much.", "Focus on your partner a little more."]]
  ],
  "aggression" : [
    [ 0, 0.25, ["You are sounding like a pushover."]],
    [ 1, 0.8, ["Tone down the aggression."]]
  ],
  "honesty" : [
    [ 0, 0.25, ["What are you hiding? Your partner is speaking much more honestly."]]
  ]
};




var localParticipant;
var otherParticipant;
var localID = "";
var otherID = "";
var baseScore = 0;

var lastNotificationTime = 0;
var lastNotification = "";
var notificationInterval = 20*1000;

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

      updateParticipants();

      // init data vals
      gapi.hangout.data.setValue(localID+"-st", "0");
      gapi.hangout.data.setValue(localID+"-displayst", "0");
      gapi.hangout.data.setValue(localID+"-volAvg", "0");
      for (var i=0; i<categories.length; i++) {
        gapi.hangout.data.setValue(localID+"-"+categories[i], String(baseScore));
      }


      gapi.hangout.onParticipantsChanged.add(function(partChangeEvent) {
        updateParticipants();
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
  updateParticipants();
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

    var notes = notifications[category];
    var now = new Date().getTime();
    if(notes && now - lastNotificationTime > notificationInterval && category != lastNotification) {
      for (var j=0; j<notes.length; j++) {
        if ((!notes[j][0] && balance < parseFloat(notes[j][1])) // lt
          || (notes[j][0] && balance > parseFloat(notes[j][1]))) { // gt
          //console.log(notes[j][2] + " " + !notes[j][0]+" "+parseFloat(notes[j][1])+" "+balance);
          //console.log("DISPLAY "+notes[j][2]);
          var msgs = notes[j][2];
          var randMsg = msgs[Math.floor(Math.random() * msgs.length)];
          gapi.hangout.layout.displayNotice(randMsg, false);

          lastNotification = category;
          lastNotificationTime = now;
          break;
        }  
      }
    } 
  }

  // Update smile
}

function updateParticipants() {
  // get participants
  localParticipant = gapi.hangout.getLocalParticipant();
  participants = gapi.hangout.getParticipants();

  console.log("participants updated: " + participants.length);

  for(i in participants) {
    participant = participants[i];
    console.log("updating avatar " + i);
    console.log(participant);
    if(participant != localParticipant) {
      otherParticipant = participant;
    }
  }

  // update IDs
  localID = localParticipant.id;

  // update avatars
  $("#avatar0").attr('src', localParticipant.person.image.url);
  if(otherParticipant) {
    $("#avatar1").attr('src', otherParticipant.person.image.url);
    otherID = otherParticipant.id;
  }
}


// Handle incoming messages and distribute to appropriate functions.
function handleMessage(msg) {
  console.log(msg);

  if (msg.type == 'stats') {
    for(var i = 0; i < categories.length; i++) {
      console.log(localID+"-"+categories[i]);
      gapi.hangout.data.setValue(localID+"-"+categories[i], String(msg[categories[i]]));
    }
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

function unnormalize(point, ctx) {
  result = new Object();
  result.x = map(point.x, -.5, +.5, 0, ctx.canvas.width);
  result.y = map(point.y, -.5, +.5, 0, ctx.canvas.height);
  return result;
}

function length(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

function distance(a, b) {
  return length({x: b.x - a.x, y: b.y - a.y});
}

var lastEvent;
var smileAmount;
function onFaceTrackingDataChanged(event) {
  try {
    if (!event.hasFace) {
      return;
    }
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
    imagePointSum = {x: 0, y: 0};
    for(point in imagePoints) {
      imagePointSum.x += imagePoints[point].x;
      imagePointSum.y += imagePoints[point].y;
    }
    imagePointSum.x /= imagePoints.length;
    imagePointSum.y /= imagePoints.length;
    scale = length(imagePointSum);
    mouthWidth = distance(event.mouthLeft, event.mouthRight);
    eyeWidth = distance(event.leftEye, event.rightEye);
    smileAmount = mouthWidth / eyeWidth;

    var smile = smileAmount / 1;
    var pct = Math.round(Math.min(smile, Math.max(smile, 0), 1)*100) + "%";
    $('#debug-smile').width(pct);
    $('#debug-smile-text').text(Math.floor(smileAmount * 100) / 100);
  } catch (e) {
    console.log(e+": "+e.message);
  }
}
