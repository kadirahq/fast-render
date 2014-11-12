__init_fast_render = function(subscriptions, data) {
  var data = DecodeEJSON(data);
  var subscriptions = DecodeEJSON(subscriptions);

  FastRender._subscriptions = subscriptions || {}; 
  FastRender._subscriptionIdMap = {};
  FastRender._dataReceived = true;

  //loading data into the collection
  for(var collName in data) {
    var collData = data[collName];
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
          fields: item
        };

        FastRender.injectDdpMessage(Meteor.connection, ddpMessage);
      });
    });
  }
}
