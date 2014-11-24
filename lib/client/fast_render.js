FastRender = {};
FastRender.enabled = typeof __fast_render_config != 'undefined';
FastRender._dataReceived = false;
FastRender._revertedBackToOriginal = false;
FastRender._blockDDP = Meteor._localStorage.getItem('__frblockddp') != undefined;
if(FastRender._blockDDP) {
  console.log("FastRender is blocking DDP messages. apply 'FastRender.debugger.unblockDDP()' to unblock again.");
}

// This allow us to apply DDP message even if Meteor block accepting messages
//  When doing initial login, Meteor sends an login message
//  Then it'll block the accpeting DDP messages from server
//  This is the cure
FastRender.injectDdpMessage = function(conn, message) {
  FastRender.debugger.log('injecting ddp message:', message);
  var originalWait = conn._waitingForQuiescence;
  conn._waitingForQuiescence = function() {return false};
  conn._livedata_data(message);
  conn._waitingForQuiescence = originalWait;
};

FastRender.init = function(payload) {
  payload = DecodeEJSON(payload);

  FastRender._subscriptions = payload.subscriptions || {}; 
  FastRender._subscriptionIdMap = {};
  FastRender._dataReceived = true;
  FastRender._payload = payload;

  //loading data into the collection
  for(var collName in payload.data) {
    var collData = payload.data[collName];
    collData.forEach(function(itemList) {
      itemList.forEach(function(item) {
        // we need to convert this back to stringify format to support 
        // sending data via livedata
        var id = LocalCollection._idStringify(item._id);
        delete item._id;

        var ddpMessage = {
          msg: 'added',
          collection: collName,
          id: id,
          fields: item,
          frGen: true
        };

        FastRender.injectDdpMessage(Meteor.connection, ddpMessage);
      });
    });
  }
};