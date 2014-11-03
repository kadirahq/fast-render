EncodeEJSON = function(ejson) {
  var ejsonString = EJSON.stringify(ejson);
  return encodeURI(ejsonString);
};

DecodeEJSON = function(encodedEjson) {
  var decodedEjsonString = decodeURI(encodedEjson);
  return EJSON.fromJSONValue(JSON.parse(decodedEjsonString));
};

AddedToChanged = function(localCopy, added) {
  added.msg = "changed";
  added.cleared = [];

  _.each(localCopy, function(key, value) {
    if(typeof added.fields[key] == "undefined") {
      added.cleared.push(key);
    }
  });
};