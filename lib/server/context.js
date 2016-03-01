var Fibers = Npm.require('fibers');
var Future = Npm.require('fibers/future');

Context = function Context(loginToken, otherParams) {
  this._collectionData = {};
  this._subscriptions = {};
  this._loginToken = loginToken;

  _.extend(this, otherParams);

  // get the user
  if(Meteor.users) {
    // check to make sure, we've the loginToken,
    // otherwise a random user will fetched from the db
    if(loginToken) {
      var hashedToken = loginToken && Accounts._hashLoginToken( loginToken );
      var query = {'services.resume.loginTokens.hashedToken': hashedToken };
      var options = {fields: {_id: 1}};
      var user = Meteor.users.findOne(query, options);
    }

    // support for Meteor.user
    Fibers.current._meteor_dynamics = {};
    Fibers.current._meteor_dynamics[DDP._CurrentInvocation.slot] = this;

    if(user) {
      this.userId = user._id;
    }
  }
};

Context.prototype.subscribe = function(subName /*, params */) {
  var self = this;

  var publishHandler = Meteor.default_server.publish_handlers[subName];
  if(publishHandler) {
    var params = Array.prototype.slice.call(arguments, 1);
    // non-universal subs have subscription id
    var subscriptionId = Random.id();
    var publishContext = new PublishContext(this, publishHandler, subscriptionId, params, subName);

    return this.processPublication(publishContext);
  } else {
    console.warn('There is no such publish handler named:', subName);
    return {};
  }
};

Context.prototype.processPublication = function(publishContext) {
  var self = this;
  var data = {};
  var ensureCollection = function(collectionName) {
    self._ensureCollection(collectionName);
    if(!data[collectionName]) {
      data[collectionName] = [];
    }
  };

  var future = new Future();
  // detect when the context is ready to be sent to the client
  publishContext.onStop(function() {
    if(!future.isResolved()) {
      future.return();
    }
  });

  publishContext._runHandler();

  if (!publishContext._subscriptionId) {
    // universal subscription, we stop it (same as marking it as ready) ourselves
    // they otherwise do not have ready or stopped state, but in our case they do
    publishContext.stop();
  }

  if (!future.isResolved()) {
    // don't wait forever for handler to fire ready()
    Meteor.setTimeout(function() {
      if (!future.isResolved()) {
        // publish handler failed to send ready signal in time
        // maybe your non-universal publish handler is not calling this.ready()?
        // or maybe it is returning null to signal empty publish?
        // it should still call this.ready() or return an empty array []
        var message =
          'Publish handler for ' + publishContext._name +  ' sent no ready signal\n' +
          ' This could be because this publication `return null`.\n' +
          ' Use `return this.ready()` instead.'
        console.warn();
        future.return();
      }
    }, 500);  // arbitrarially set timeout to 500ms, should probably be configurable

    //  wait for the subscription became ready.
    future.wait();
  }

  // stop any runaway subscription
  // this can happen if a publish handler never calls ready or stop, for example
  // it does not hurt to call it multiple times
  publishContext.stop();

  // get the data
  _.each(publishContext._collectionData, function(collData, collectionName) {
    // making an array from a map
    collData = _.values(collData);

    ensureCollection(collectionName);
    data[collectionName].push(collData);

    // copy the collection data in publish context into the FR context
    self._collectionData[collectionName].push(collData);
  });

  return data;
};

Context.prototype.completeSubscriptions = function(name, params) {
  var subs = this._subscriptions[name];
  if(!subs) {
    subs = this._subscriptions[name] = {};
  }

  subs[EJSON.stringify(params)] = true;
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
    loginToken: this._loginToken
  };
};

FastRender._Context = Context;
