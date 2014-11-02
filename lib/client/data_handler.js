__init_fast_render = function(ejsonJson) {
  // server sends serverRoutePath's encoded to version to prevent XSS
  // see more: http://goo.gl/UNrfXs
  var url = __fast_render_config.serverRoutePath;
  __fast_render_config.serverRoutePath = decodeURI(url);

  var initData = DecodeEJSON(ejsonJson);
  console.log("INIT_DATA", initData);

  //loading data into the collection
  for(var collName in initData.collectionData) {
    var collData = initData.collectionData[collName];
    collData.forEach(function(itemList) {
      itemList.forEach(function(item) {
        var id = item._id;
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
