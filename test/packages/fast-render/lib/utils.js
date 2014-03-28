EncodeEJSON = function(ejson) {
  var ejsonString = EJSON.stringify(ejson);
  return encodeURI(ejsonString);
};

DecodeEJSON = function(encodedEjson) {
  var decodedEjsonString = decodeURI(encodedEjson);
  return EJSON.fromJSONValue(JSON.parse(decodedEjsonString));
};
