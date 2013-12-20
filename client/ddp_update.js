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
