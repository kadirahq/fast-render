__init_fast_render = function(ejsonString) {
  var initData = EJSON.parse(ejsonString);

  //loading data into the collection
  for(var collName in initData.collectionData) {
    var collData = initData.collectionData[collName];
    collData.forEach(function(itemList) {
      itemList.forEach(function(item) {
        var localCollection = Meteor.default_connection._mongo_livedata_collections[collName];
        if(localCollection) {
          if(localCollection.findOne(item._id)) {
            localCollection.update(item._id, item);
          } else {
            localCollection.insert(item);
          }
        } else {
          console.warn('fast-route data found, but no collection exists for: ' + collName);
        }
      });
    });
  }
}