

var Tracker = function() {
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

  return {

    onFaceTrackingDataChanged: function(event) {
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
          gapi.hangout.data.setValue(localParticipant.id+"-smileState", smileState);
        }
        lastSmileState = smileState;
      } catch (e) {
        console.log(e+": "+e.message);
      }
    }
  }
};


