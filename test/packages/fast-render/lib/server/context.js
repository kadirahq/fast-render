var Fibers = Npm.require('fibers');
var Future = Npm.require('fibers/future');

Context = function Context(loginToken) {
  this._collectionData = {};
  this._subscriptions = {};
  this._forgetSubscriptions = {};

  //get the user
  if(Meteor.users) {
    var query = {'services.resume.loginTokens.token': loginToken};
    var options = {fields: {_id: 1}};
    var user = Meteor.users.findOne(query, options);

    //support for Meteor.user
    Fibers.current._meteor_dynamics = {};
    Fibers.current._meteor_dynamics[DDP._CurrentInvocation.slot] = this;

    if(user) {
      this.userId = user._id;
    }
  }
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

Context.prototype.subscribe = function(subscription /*, params */) {
  var self = this;
  var publishHandler = Meteor.default_server.publish_handlers[subscription];
  if(publishHandler) {
    var params = Array.prototype.slice.call(arguments, 1);
    var cursors = publishHandler.apply(this, params);
    if(cursors) {
      if(cursors.constructor != Array) {
        cursors = [cursors];
      }

      //add collection data
      cursors.forEach(function(cursor) {
        var collectionName = cursor._cursorDescription.collectionName;
        self._ensureCollection(collectionName);
        self._collectionData[collectionName].push(cursor.fetch());
      });

      //set subscription
      self.completeSubscriptions(subscription);
    } else {
      console.warn('No such cursors in publication: ', subscription);
    }
  } else {
    console.warn('There is no such publish handler named:', subscription);
  }
};

Context.prototype.completeSubscriptions = function(subscriptions) {
  var self = this;
  if(typeof subscriptions == 'string') {
    subscriptions = [subscriptions];
  } else if(!subscriptions || subscriptions.constructor != Array) {
    throw new Error('subscriptions params should be either a string or array of strings');
  }

  subscriptions.forEach(function(subscription) {
    self._subscriptions[subscription] = true;
  });
};

Context.prototype.forgetSubscriptions = function(subscriptions) {
  var self = this;
  if(typeof subscriptions == 'string') {
    subscriptions = [subscriptions];
  } else if(subscriptions.constructor != Array) {
    throw new Error('subscriptions params should be either a string or array of strings');
  }

  subscriptions.forEach(function(subscription) {
    self._forgetSubscriptions[subscription] = true;
  });
};

Context.prototype._ensureCollection = function(collectionName) {
  if(!this._collectionData[collectionName]) {
    this._collectionData[collectionName] = [];
  }
};

Context.prototype.getData = function() {
  return {
    collectionData: this._collectionData,
    subscriptions: this._subscriptions,
    forgetSubscriptions: this._forgetSubscriptions
  };
};

FastRender._Context = Context;