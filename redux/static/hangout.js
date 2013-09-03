var db = new localStorageDB("db", localStorage);;
var parser = Parser(db)
parser.initialize();
var width, height;

var lastCategoryNotice = "";


var categories = [
  "posemo",
  "i",
  "femininity",
  "aggression",
  "honesty"
];

var femRange = [0, 0];

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


var automuteTimeout = 60 * 1000;
var sadNoticeTimeout = 60 * 1000;
var categoryNoticeTimeout = 45 * 1000;
var automuteNoticeTimeout = 30 * 1000;

var displayNoticeTimeout = 45 * 1000;
var conversationStartTime;

var localParticipant;
var otherParticipant;
var localID = "";
var otherID = "";
var baseScore = 0;

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
});




function notify() {

  // Update LIWC cats

  for(var i = 0; i < categories.length; i++) {
    var category = categories[i];

    var balance = 0.5;

    var val = gapi.hangout.data.getValue(localID+"-"+category);
    var localScore = val ? parseFloat(val) : 0;

    val = otherID ? gapi.hangout.data.getValue(otherID+"-"+category) : false;
    var otherScore = val ? parseFloat(val) : baseScore;

    // do range mapping for fem
    if (category == "femininity") {
      femRange[0] = Math.min(localScore, otherScore, femRange[0]);
      femRange[1] = Math.max(localScore, otherScore, femRange[1]);

      console.log(femRange);

      localScore = clamp(map(localScore, femRange[0], femRange[1], 0, 1), 0, 1);
      otherScore = clamp(map(otherScore, femRange[0], femRange[1], 0, 1), 0, 1);

      console.log(localScore, otherScore);
    }

    var totalScore = localScore+otherScore;
    
    if(totalScore > 0) {
      balance = localScore / totalScore;
    }

    var pct = Math.round(clamp(balance, 0, 1)*100) + "%";
    //console.log(pct);
    $('#category-'+category).width(pct);

    var notes = notifications[category];
    var now = new Date().getTime();
    if(notes) {
      for (var j=0; j<notes.length; j++) {
        if ((!notes[j][0] && balance < parseFloat(notes[j][1])) // lt
          || (notes[j][0] && balance > parseFloat(notes[j][1]))) { // gt
          //console.log(notes[j][2] + " " + !notes[j][0]+" "+parseFloat(notes[j][1])+" "+balance);
          //console.log("DISPLAY "+notes[j][2]);
          var msgs = notes[j][2];
          var randMsg = msgs[Math.floor(Math.random() * msgs.length)];

          if (category !== lastCategoryNotice) {
            if (displayNotice("category", randMsg, categoryNoticeTimeout)) {
              lastCategoryNotice = category;
            }
          }
          break;
        }  
      }
    } 
  }

  // Update smile
  if(otherID) {
    var otherSmileState = gapi.hangout.data.getValue(otherID+"-smileState");
    if(otherSmileState) {
      setSrc('#face1', "//lmccart-fixus.appspot.com/static/img/emoticon-other-" + otherSmileState + ".png");
      if(otherSmileState == "sad") {
        displayNotice("smile", "They're looking a bit sad.", sadNoticeTimeout);
      }
    }
  }
}

var lastNotificationTime = {};
function displayNotice(type, msg, delay) {
  var needToTrigger = false;
  var now = new Date().getTime();
  if(conversationStartTime && now - conversationStartTime > displayNoticeTimeout) {
    if(lastNotificationTime[type]) {
      var prev = lastNotificationTime[type];
      var diff = now - prev;
      if(diff > delay) {
        needToTrigger = true;
      }
    } else {
      needToTrigger = true;
    }
    if(needToTrigger) {
      lastNotificationTime[type] = now;
      gapi.hangout.layout.displayNotice(msg, false);
    }
  }
  return needToTrigger;
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
  setSrc("#avatar0", localParticipant.person.image.url);
  if(otherParticipant) {
    setSrc("#avatar1", otherParticipant.person.image.url);
    otherID = otherParticipant.id;
    conversationStartTime = new Date().getTime();
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

