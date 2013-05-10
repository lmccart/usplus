(function() {
  if (gapi && gapi.hangout) {

    var initHangout = function(apiInitEvent) {
      if (apiInitEvent.isApiReady) {
        //prepareAppDOM();

        console.log("hangout ready");

        gapi.hangout.layout.displayNotice("testing", true);


        gapi.hangout.data.onStateChanged.add(function(stateChangeEvent) {
        });
        gapi.hangout.onParticipantsChanged.add(function(partChangeEvent) {
        });

        gapi.hangout.onApiReady.remove(initHangout);
      }
    };

    gapi.hangout.onApiReady.add(initHangout);
  }
})();