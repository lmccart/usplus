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

var baseScore = 1;
var scalePower = 2, minHeightScale = 1, maxHeightScale = 50;

// wait until hangout ready then load everything
if (gapi && gapi.hangout) {

  var initHangout = function(apiInitEvent) {
    if (apiInitEvent.isApiReady) {
      //prepareAppDOM();

      console.log("hangout ready");

      // init data vals
      gapi.hangout.data.setValue(gapi.hangout.getLocalParticipantId()+"-wc", "0");
      gapi.hangout.data.setValue(gapi.hangout.getLocalParticipantId()+"-st", "0");
      for (var i=0; i<categories.length; i++) {
        gapi.hangout.data.setValue(gapi.hangout.getLocalParticipantId()+"-"+categories[i], String(baseScore));
      }

      // attach listeners
      gapi.hangout.data.onStateChanged.add(function(stateChangeEvent) {
        handleStateChange(stateChangeEvent);
      });
      gapi.hangout.onParticipantsChanged.add(function(partChangeEvent) {
      });

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
});




function draw() {
  var totalScale = 0;
  var maxScale = 0;
  var maxScaleIndex = 0;
  var balances = new Array(categories.length);
  var scales = new Array(categories.length);

  for(var i = 0; i < categories.length; i++) {

    console.log(gapi.hangout.getLocalParticipantId());
    var myScore = parseFloat(gapi.hangout.data.getValue(gapi.hangout.getLocalParticipantId()+"-"+categories[i]));
    // pend: should this be stored instead of looked up each time?
    var yourID = "";
    var participants = gapi.hangout.getParticipants();
    for (var i=0; i<participants.length; i++) {
      console.log(participants[i].id);
      //if (participants[i].id != gapi.hangout.getLocalParticipantId()) {
      //  yourID = participants[i].id;
      //  break;
      //}
    }

    /*
    var yourScore = yourID ? parseFloat(gapi.hangout.data.getValue(yourID+"-"+categories[i])) : baseScore;
    var totalScore = myScore+yourScore;
    if(totalScore > 0) {
      balances[i] = myScore / totalScore;
    } else {
      balances[i] = .5;
    }
    scales[i] = Math.pow(2 * Math.abs(balances[i] - .5), scalePower);
    scales[i] = map(scales[i], 0, 1, minHeightScale, maxHeightScale);
    totalScale += scales[i];
    if(scales[i] > maxScale) {
      maxScale = scales[i];
      maxScaleIndex = i;
    }*/
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
    console.log(msg);
    for(var i = 0; i < categories.length; i++) {
      console.log(gapi.hangout.getLocalParticipantId()+"-"+categories[i]);
      gapi.hangout.data.setValue(gapi.hangout.getLocalParticipantId()+"-"+categories[i], String(msg[categories[i]]));
    }
  }
  else if (msg.type == 'wordcount') {
    var count = parseInt(gapi.hangout.data.getValue(gapi.hangout.getLocalParticipantId()+"-wc"), 10);
    count += msg.count;
    gapi.hangout.data.setValue(gapi.hangout.getLocalParticipantId()+"-wc", String(count));
  }
  else if (msg.type == 'speechtime') {
    var time = parseInt(gapi.hangout.data.getValue(gapi.hangout.getLocalParticipantId()+"-st"), 10);
    time += msg.time;
    gapi.hangout.data.setValue(gapi.hangout.getLocalParticipantId()+"-st", String(time));
  }
  

}

function handleStateChange(ev) {
  console.log('state changed');
  //console.log(gapi.hangout.data.getValue(gapi.hangout.getLocalParticipantId()+"-st"));
  //gapi.hangout.layout.displayNotice(flip, true);

  draw();
}


function map(x, inmin, inmax, outmin, outmax) {
  return ((x-inmin) / (inmax-inmin)) * (outmax-outmin) + outmin;
}

function manualInputSubmit() {
  parser.parseLine(document.getElementById('manualInput').value)
}
