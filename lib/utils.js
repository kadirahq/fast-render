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
  added.fields = added.fields || {};

  _.each(localCopy, function(value, key) {
    if(key != '_id') {
      if(typeof added.fields[key] == "undefined") {
        added.cleared.push(key);
      }
    }
  });
};

ApplyDDP = function(existing, message) {
  var newDoc = (!existing)? {}: _.clone(existing);
  if(message.msg == 'added') {
    _.each(message.fields, function(value, key) {
      newDoc[key] = value;
    });
  } else if(message.msg == "changed") {
    _.each(message.fields, function(value, key) {
      newDoc[key] = value;
    });
    _.each(message.cleared, function(key) {
      delete newDoc[key];
    });
  } else if(message.msg == "removed") {
    newDoc = {};
  }

  return newDoc;
};