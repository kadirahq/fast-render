IDTools = {};
IDTools.idParse = LocalCollection._idParse;
IDTools.idStringify = LocalCollection._idStringify;
IDTools.ObjectID = LocalCollection._ObjectID

// To support Meteor 1.2
if(Package['mongo-id']) {
  var MongoID = Package['mongo-id'].MongoID;
  IDTools.idParse = MongoID.idParse;
  IDTools.idStringify = MongoID.idStringify;
  IDTools.ObjectID = MongoID.ObjectID;
}