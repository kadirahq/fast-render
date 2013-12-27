__init_fast_render = function(ejsonJson) {
  var initData = EJSON.fromJSONValue(ejsonJson);

  //loading data into the collection
  for(var collName in initData.collectionData) {
    var collData = initData.collectionData[collName];
    collData.forEach(function(itemList) {
      itemList.forEach(function(item) {
        var localCollection = Meteor.default_connection._mongo_livedata_collections[collName];
        if(localCollection) {
          var exitingDoc = localCollection.findOne(item._id);
          if(exitingDoc) {
            DeepExtend(true, exitingDoc, item);
            localCollection.update(item._id, exitingDoc);
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