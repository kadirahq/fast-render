if(typeof __fast_render_config == 'undefined') {
  Log('NO_FAST_RENDER');
  return;
}

var revertedBackToOriginal = false;

var originalLivedataData = Meteor.default_connection._livedata_data;
Meteor.default_connection._livedata_data = function(msg) {
  Log('DDP_RECIEVE', msg);

  //if we've completed our tasks, no need of special handling
  if(!revertedBackToOriginal) {
    //we are inserting docs to a collection manually
    //but when the data comes from the subscription, it will also try to insert
    //but since there are some exiting data, meteor throws an execption
    //  serverDoc check is to see, if this doc is releated to an simulation, 
    //  if so it's better to ignore it
    var serverDoc = Meteor._get(this._serverDocuments, msg.collection, msg.id);
    if(!serverDoc && msg.msg == 'added') {
      var localCollection = Meteor.default_connection._mongo_livedata_collections[msg.collection];
      if(localCollection) {
        var existingDoc = localCollection.findOne(msg.id);
        if(existingDoc) {
          msg.fields = DeepExtend(true, existingDoc, msg.fields);
          delete msg.fields._id;
          msg.msg = "changed";
        }
      }
    }

    //This will take care of cleaning special subscription handling 
    //after the actual subscription comes out
    if(msg.msg == 'ready' && !msg.frGen && __fast_render_config.subscriptions) {
      msg.subs.forEach(function(subId) {
        var subscription = __fast_render_config.subscriptionIdMap[subId];
        if(subscription) {
          Log('DELETING_SUBSCRIPTION', subscription, subId);
          //we don't need to handle specially after this
          delete __fast_render_config.subscriptions[subscription];
          delete __fast_render_config.subscriptionIdMap[subId];

          //need to track the loaded subscription, specially for handling in the ironRouter
          __fast_render_config.loadedSubscriptions[subscription] = true;
        }
      });
    }

    //if all the subscriptions have been processed, there is no need to keep hijacking
    if(EJSON.equals(__fast_render_config.subscriptions, {})) {
      Log('REVERTING_BACK_TO_ORIGINAL_DDP_HANDLING');
      revertedBackToOriginal = true;
    }
  }

  return originalLivedataData.call(this, msg);
};

var originalSend = Meteor.default_connection._send;
Meteor.default_connection._send = function(msg) {
  Log("DDP_SEND", msg);

  //if looking for connect again to the server, we must need to revert back to original
  //to prevent some weird DDP issues
  //  normally it is already reverted, but user may added subscriptions in server,
  //  which are not subscribed from the client
  if(msg.msg == 'connect' && msg.session != undefined) {
    revertedBackToOriginal = true;
  }

  var self = this;

  //if we've completed our tasks, no need of special handling
  if(!revertedBackToOriginal) {
    if(msg.msg == 'sub' && __fast_render_config.subscriptions && __fast_render_config.subscriptions[msg.name]) {
      Log('FAKE_SUB_READY', msg.name);
      self._livedata_data({msg:"ready",subs:[msg.id], frGen: true});
      //add the messageId to be handled later
      __fast_render_config.subscriptionIdMap[msg.id] = msg.name;
    }
  }

  return originalSend.call(this, msg);
};