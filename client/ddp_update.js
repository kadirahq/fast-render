if(typeof __fast_render_config == 'undefined') {
  console.log('NO_FAST_RENDER');
  return;
}

var revertedBackToOriginal = false;

var originalLivedataData = Meteor.default_connection._livedata_data;
Meteor.default_connection._livedata_data = function(msg) {
  console.log('DDP_RECIEVE', msg);
  //we are inserting docs to a collection manually
  //but when the data comes from the subscription, it will also try to insert
  //but since there are some exiting data, meteor throws an execption
  //here comes the fix
  if(msg.msg == 'added') {
    var localCollection = Meteor.default_connection._mongo_livedata_collections[msg.collection];
    var existingDoc = localCollection.findOne(msg.id);
    if(existingDoc) {
      DeepExtend(msg.fields, existingDoc);
      msg.msg = "updated";
    }
  }

  //if we've completed our tasks, no need of special handling
  if(!revertedBackToOriginal) {
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
      revertedBackToOriginal = true;
    }
  }

  return originalLivedataData.call(this, msg);
};

var originalSend = Meteor.default_connection._send;
Meteor.default_connection._send = function(msg) {
  console.log("DDP_SEND", msg);
  var self = this;

  //if we've completed our tasks, no need of special handling
  if(!revertedBackToOriginal) {
    if(msg.msg == 'sub' && __fast_render_config.subscriptions && __fast_render_config.subscriptions[msg.name]) {
      console.log('fake ready sending');
      self._livedata_data({msg:"ready",subs:[msg.id], frGen: true});
      if(__fast_render_config.forgetSubscriptions[msg.name]) {
        //we need to clear the subscription info and avoid sending it to the server
        delete __fast_render_config.forgetSubscriptions[msg.name];
        delete __fast_render_config.subscriptions[msg.name];
        return;
      } else {
        //add the messageId to be handled later
        __fast_render_config.subscriptionIdMap[msg.id] = msg.name;
      }
    }
  }

  return originalSend.call(this, msg);
};