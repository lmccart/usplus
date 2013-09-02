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
    [ 1, 0.82, ["Tone it down a bit, your partner doesn't sound so happy."]]
  ],
  "i" : [
    [ 1, 0.75, ["Stop talking about yourself so much.", "Focus on your partner a little more."]]
  ],
  "aggression" : [
    [ 0, 0.25, ["You are sounding like a pushover."]],
    [ 1, 0.82, ["Tone down the aggression."]]
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
var notificationInterval = 45*1000;

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
      gapi.hangout.data.setValue(localID+"-smileState", "neutral");
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
  lastNotificationTime = new Date().getTime();
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
    var pct = Math.round(clamp(balance, 0, 1)*100) + "%";
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
  if(otherID) {
    var otherSmileState = gapi.hangout.data.getValue(otherID+"-smileState");
    setSrc('#face1', "//lmccart-fixus.appspot.com/static/img/emoticon-other-" + otherSmileState + ".png");
    if(otherSmileState == "sad") {
      gapi.hangout.layout.displayNotice("It looks like you made them sad.", false);
    }
  }
}

function display

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
  setSrc("#avatar0", localParticipant.person.image.url);
  if(otherParticipant) {
    setSrc("#avatar1", otherParticipant.person.image.url);
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

function Hysteresis() {
  var lastTime = 0;
  var lastValue = false;
  var curValue = false;

  this.risingDelay = 250;
  this.fallingDelay = 1500;
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
  this.getState = function() {
    return curValue;
  }
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

function average(a, b) {
  result = new Object();
  result.x = (a.x + b.x) / 2;
  result.y = (a.y + b.y) / 2;
  return result;
}

function clamp(x, low, high) {
  return Math.max(low, Math.min(high, x));
}

// it looks like jquery resets the src even when it's the same as before
// so we check before setting to avoid that
function setSrc(id, src) {
  if($(id).attr('src') !== src) {
    $(id).attr('src', src);
  }
}

// an alternative approach to smile detection
// is to do 2-cluster k-means analysis on the last
// 30 seconds of data and determine which class the
// current smile amount belongs to.
// some settings for smile detection immediately follow:
var smileThreshold = 1.0; // multiplier on standard deviation
var smileHistoryTime = 15; // 15 seconds
var smileSadLength = 15; // no smiles in this many seconds make a sad face
var smileHistoryLength = 450; // 15 seconds at 30 fps
var smileAmount;
var smileLowpass;
var smileHistory = [];
var lastSmileState = "neutral";
var lastSmile = 0;
var smileHysteresis = new Hysteresis();
function onFaceTrackingDataChanged(event) {
  try {
    if (!event.hasFace) {
      return;
    }
    mouthWidth = distance(event.mouthLeft, event.mouthRight);
    eyeWidth = distance(event.leftEye, event.rightEye);
    smileAmount = mouthWidth / eyeWidth;

    var now = new Date().getTime() / 1000;
    if(smileAmount)
    smileHistory.push({time: now, smile: smileAmount});
    if(smileHistory.length > smileHistoryLength) {
      smileHistory.shift();
    }
    smileLowpass = 0;
    var smileSum = 0;
    var weightSum = 0;
    for(i in smileHistory) {
      var cur = smileHistory[i];
      var elapsedTime = now - cur.time;
      var curWeight = Math.max(0, Math.sin(Math.PI * elapsedTime / smileHistoryTime));
      smileSum += cur.smile;
      weightSum += curWeight;
      smileLowpass += curWeight * cur.smile;
    }
    smileLowpass = smileLowpass / weightSum;

    var smileAverage = smileSum / smileHistory.length;
    var stdDev = 0;
    for(i in smileHistory) {
      var smileDiff = smileHistory[i].smile - smileAverage
      stdDev += smileDiff * smileDiff;
    }
    stdDev = Math.sqrt(stdDev / smileHistory.length);

    var curSmileState = smileAmount > smileLowpass + stdDev * smileThreshold;
    smileHysteresis.update(curSmileState);
    var smileState;
    if(smileHysteresis.getState()) {
      lastSmile = now;
      smileState = "happy";
    } else if(now - lastSmile > smileSadLength) {
      smileState = "sad";
    } else {
      smileState = "neutral";
    }
    if(smileState !== lastSmileState) {
      setSrc('#face0', "//lmccart-fixus.appspot.com/static/img/emoticon-local-" + smileState + ".png");
      gapi.hangout.data.setValue(localID+"-smileState", smileState);}
    }
    lastSmileState = smileState;
  } catch (e) {
    console.log(e+": "+e.message);
  }
}
