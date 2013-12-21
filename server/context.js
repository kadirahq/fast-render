var Future = Npm.require('fibers/future');

Context = function Context() {
  this._collectionData = {};
  this._subscriptions = [];
};

Context.prototype.find = function(collectionName, query, options) {
  var self = this;
  if(collectionName.constructor == Meteor.Collection) {
    collectionName = collectionName._name;
  } else if(typeof collectionName != 'string') {
    throw new Error("find's first arg should be either a Meteor.Collection or a string");
  }

  var mongo = MongoInternals.defaultRemoteCollectionDriver().mongo;
  if(mongo && mongo.db) {
    var future = new Future();
    var args = Array.prototype.slice.call(arguments, 1);
    var coll = mongo.db.collection(collectionName);

    coll.find.apply(coll, args).toArray(function(err, result) {
      if(err) {
        throw err;
      } else {
        self._ensureCollection(collectionName);
        self._collectionData[collectionName].push(result);
        future.return();
      }
    });
    future.wait();
  } else {
    console.warn('fast-render still cannot access the mongo connection');
  }
};

Context.prototype.subscribe = function(subscriptions) {
  if(typeof subscriptions == 'string') {
    subscriptions = [subscriptions];
  } else if(subscriptions.constructor != Array) {
    throw new Error('subscriptions params should be either a string or array of strings');
  }

  this._subscriptions = this._subscriptions.concat(subscriptions);
};

Context.prototype._ensureCollection = function(collectionName) {
  if(!this._collectionData[collectionName]) {
    this._collectionData[collectionName] = [];
  }
};

Context.prototype.getData = function() {
  return {
    collectionData: this._collectionData,
    subscriptions: this._subscriptions
  };
};