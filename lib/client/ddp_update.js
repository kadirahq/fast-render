var revertedBackToOriginal = false;
var reconnecting = false;

var originalLivedataData = Meteor.connection._livedata_data;
Meteor.connection._livedata_data = function(msg) {
  Log('DDP_RECIEVE', msg);

  // fast-render adds data manually while initializing
  // But when the server sends actual data via DDP, it also tries to add
  // Then we need to detect that and alter
  //
  // But we don't need to interfer with Meteor's simulation process
  // That's why we are checking for serverDocs and ignore manual handling
  //
  // We don't need this logic after our special handling reverted back to
  // original. But we can't detect when null publications completed or not
  // That's why we need keep this logic
  //
  // It's okay to ignore this logic after sometime, but not sure when exactly

  var serverDoc = this._getServerDoc(msg.collection, msg.id);
  if(!reconnecting && !serverDoc && msg.msg == 'added') {
    var localCollection = this._mongo_livedata_collections[msg.collection];
    if(localCollection) {
      var existingDoc = localCollection.findOne(msg.id);
      if(existingDoc) {
        AddedToChanged(existingDoc, msg);
      }
    }
  }

  // if we've completed our tasks, no need of special handling
  if(!revertedBackToOriginal && FastRender._dataReceived) {

    // This will take care of cleaning special subscription handling
    // after the actual subscription comes out
    if(msg.msg == 'ready' && !msg.frGen && FastRender._subscriptions) {
      msg.subs.forEach(function(subId) {
        var subscription = FastRender._subscriptionIdMap[subId];
        if(subscription) {
          Log('DELETING_SUBSCRIPTION', subscription, subId);
          // we don't need to handle specially after this
          delete FastRender._subscriptions[subscription];
          delete FastRender._subscriptionIdMap[subId];
        }
      });
    }

    // if all the subscriptions have been processed,
    // there is no need to keep hijacking
    if(EJSON.equals(FastRender._subscriptions, {})) {
      Log('REVERTING_BACK_TO_ORIGINAL_DDP_HANDLING');
      revertedBackToOriginal = true;
    }
  }

  return originalLivedataData.call(this, msg);
};

var originalSend = Meteor.connection._send;
Meteor.connection._send = function(msg) {
  Log("DDP_SEND", msg);

  // if looking for connect again to the server, we must need to revert back to
  // original to prevent some weird DDP issues
  //  normally it is already reverted, but user may added subscriptions
  //  in server, which are not subscribed from the client
  if(msg.msg == 'connect' && msg.session != undefined) {
    revertedBackToOriginal = true;
    reconnecting = true;
  }

  var self = this;

  // if we've completed our tasks, no need of special handling
  if(!revertedBackToOriginal && FastRender._dataReceived) {
    var canSendFakeReady =
      msg.msg == 'sub' &&
      FastRender._subscriptions[msg.name];

    if(canSendFakeReady) {
      Log('FAKE_SUB_READY', msg.name);
      FastRender.injectDdpMessage(self, {msg:"ready",subs:[msg.id], frGen: true});
      // add the messageId to be handled later
      FastRender._subscriptionIdMap[msg.id] = msg.name;
    }
  }

  return originalSend.call(this, msg);
};
