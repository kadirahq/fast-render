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
    newDoc = null;
  }

  return newDoc;
};

// source: https://gist.github.com/kurtmilam/1868955
//  modified a bit to not to expose this as an _ api
DeepExtend = function deepExtend (obj) {
  var parentRE = /#{\s*?_\s*?}/,
      slice = Array.prototype.slice,
      hasOwnProperty = Object.prototype.hasOwnProperty;

  _.each(slice.call(arguments, 1), function(source) {
    for (var prop in source) {
      if (hasOwnProperty.call(source, prop)) {
        if (_.isNull(obj[prop]) || _.isUndefined(obj[prop]) || _.isFunction(obj[prop]) || _.isNull(source[prop]) || _.isDate(source[prop])) {
          obj[prop] = source[prop];
        }
        else if (_.isString(source[prop]) && parentRE.test(source[prop])) {
          if (_.isString(obj[prop])) {
            obj[prop] = source[prop].replace(parentRE, obj[prop]);
          }
        }
        else if (_.isArray(obj[prop]) || _.isArray(source[prop])){
          if (!_.isArray(obj[prop]) || !_.isArray(source[prop])){
            throw 'Error: Trying to combine an array with a non-array (' + prop + ')';
          } else {
            obj[prop] = _.reject(DeepExtend(obj[prop], source[prop]), function (item) { return _.isNull(item);});
          }
        }
        else if (_.isObject(obj[prop]) || _.isObject(source[prop])){
          if (!_.isObject(obj[prop]) || !_.isObject(source[prop])){
            throw 'Error: Trying to combine an object with a non-object (' + prop + ')';
          } else {
            obj[prop] = DeepExtend(obj[prop], source[prop]);
          }
        } else {
          obj[prop] = source[prop];
        }
      }
    }
  });
  return obj;
};