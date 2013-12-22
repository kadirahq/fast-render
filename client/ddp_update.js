//we are inserting docs to a collection manually
//but when the data comes from the subscription, it will also try to insert
//but since there are some exiting data, meteor throws an execption
//here comes the fix --- blahh.....

var original = Meteor.default_connection.constructor.prototype.registerStore;
Meteor.default_connection.constructor.prototype.registerStore = function(name, store) {
  var originalUpdate = store.update;
  store.update = function(msg) {
    if(msg.msg == 'added') {
      var localCollection = Meteor.default_connection._mongo_livedata_collections[name];
      if(localCollection.findOne(msg.id)) {
        msg.msg = 'changed';
      }
    }
    return originalUpdate.call(this, msg);
  }
  return original.call(this, name, store);
}

var originalSend = Meteor.default_connection._send;
Meteor.default_connection._send = function(msg) {
  var self = this;
  setTimeout(function() {
    if(msg.msg == 'sub' && FastRender._subscriptions && FastRender._subscriptions[msg.name]) {
      console.log('fake ready sending');
      self._livedata_data({msg:"ready",subs:[msg.id]});
      //we don't need to handle specially after this
      delete FastRender._subscriptions[msg.name];
    }
  }, 0);
  return originalSend.call(this, msg);
};

/*
  Need this hack to prevent ironRouter handling these subscriptions
*/
var originalSubscribe = Meteor.subscribe;
Meteor.subscribe = function(subscription) {
  var rtn = originalSubscribe.apply(this, arguments);
  if(FastRender._ironRouterSubscriptions && FastRender._ironRouterSubscriptions[subscription]) {
    delete FastRender._ironRouterSubscriptions[subscription];
    return undefined;
  } else {
    return rtn;
  }
};