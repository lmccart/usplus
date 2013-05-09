
(function() {
  if (gapi && gapi.hangout) {

    var initHangout = function(apiInitEvent) {
      if (apiInitEvent.isApiReady) {
        //prepareAppDOM();

        gapi.hangout.data.onStateChanged.add(function(stateChangeEvent) {
          //updateLocalDataState(stateChangeEvent.state,
          //                     stateChangeEvent.metadata);
        });
        gapi.hangout.onParticipantsChanged.add(function(partChangeEvent) {
          //updateLocalParticipantsData(partChangeEvent.participants);
        });

        if (!state_) {
          var state = gapi.hangout.data.getState();
          var metadata = gapi.hangout.data.getStateMetadata();
          if (state && metadata) {
            //updateLocalDataState(state, metadata);
          }
        }
        if (!participants_) {
          var initParticipants = gapi.hangout.getParticipants();
          if (initParticipants) {
            //updateLocalParticipantsData(initParticipants);
          }
        }

        gapi.hangout.onApiReady.remove(initHangout);
      }
    };

    gapi.hangout.onApiReady.add(initHangout);
  }
})();