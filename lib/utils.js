EncodeEJSON = function(ejson) {
  var ejsonString = EJSON.stringify(ejson);
  return JSON.stringify(ejsonString.replace(/script>/g, '___SCRIPT_TAG__'));
};

DecodeEJSON = function(encodedEjson) {
  var decodedEjsonString = encodedEjson.replace(/___SCRIPT_TAG__/g, 'script>');
  return EJSON.fromJSONValue(JSON.parse(decodedEjsonString));
};
