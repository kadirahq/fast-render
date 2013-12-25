if(typeof __fast_render_config == 'undefined') {
  console.log('NO_FAST_RENDER');
  return;
}

var originalLivedataData = Meteor.default_connection._livedata_data;
Meteor.default_connection._livedata_data = function(msg) {
  console.log('DDP_RECIEVE', msg);
  //we are inserting docs to a collection manually
  //but when the data comes from the subscription, it will also try to insert
  //but since there are some exiting data, meteor throws an execption
  //here comes the fix
  if(msg.msg == 'added') {
    var localCollection = Meteor.default_connection._mongo_livedata_collections[msg.collection];
    if(localCollection.findOne(msg.id)) {
      localCollection.remove(msg.id);
    }
  }

  //This will take care of cleaning special subscription handling 
  //after the actual subscription comes out
  if(msg.msg == 'ready' && !msg.frGen && __fast_render_config.subscriptions) {
    msg.subs.forEach(function(subId) {
      var subscription = __fast_render_config.subscriptionIdMap[subId];
      if(subscription) {
        console.log('deleting subscription', subscription, subId);
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
    console.log('REVERTING_BACK_TO_ORIGINAL_DDP_HANDLING');
    Meteor.default_connection._livedata_data = originalLivedataData;
    Meteor.default_connection._send = originalSend;
  }

  return originalLivedataData.call(this, msg);
};

var originalSend = Meteor.default_connection._send;
Meteor.default_connection._send = function(msg) {
  console.log("DDP_SEND", msg);
  var self = this;
  if(msg.msg == 'sub' && __fast_render_config.subscriptions && __fast_render_config.subscriptions[msg.name]) {
    console.log('fake ready sending');
    self._livedata_data({msg:"ready",subs:[msg.id], frGen: true});
    __fast_render_config.subscriptionIdMap[msg.id] = msg.name;
  }

  return originalSend.call(this, msg);
};