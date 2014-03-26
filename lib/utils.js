EncodeEJSON = function(ejson) {
  var ejsonString = EJSON.stringify(ejson);
  return _.escape(ejsonString);
};

DecodeEJSON = function(encodedEjson) {
  var decodedEjsonString = _.unescape(encodedEjson);
  return EJSON.fromJSONValue(JSON.parse(decodedEjsonString));
};
