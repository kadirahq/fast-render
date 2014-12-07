var Fibers = Npm.require('fibers');
var Future = Npm.require('fibers/future');

Context = function Context(loginToken, otherParams) {
  this._collectionData = {};
  this._subscriptions = {};
  this._subscriptionFutures = [];
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

    //support for Meteor.user
    Fibers.current._meteor_dynamics = {};
    Fibers.current._meteor_dynamics[DDP._CurrentInvocation.slot] = this;

    if(user) {
      this.userId = user._id;
    }
  }
};

Context.prototype.subscribe = function(subscription /*, params */) {
  var self = this;
  
  var publishHandler = Meteor.default_server.publish_handlers[subscription];
  if(publishHandler) {
    var publishContext = new PublishContext(this, subscription);
    var params = Array.prototype.slice.call(arguments, 1);

    this.processPublication(publishHandler, publishContext, params);
  } else {
    console.warn('There is no such publish handler named:', subscription);
  }
};

Context.prototype.processPublication = function(publishHandler, publishContext, params) {
  var self = this;
  
  var future = new Future;
  this._subscriptionFutures.push(future);
  //detect when the context is ready to be sent to the client
  publishContext.onStop(function() {
    if(!future.isResolved()) {
      future.return();
    }
  });

  try {
    var cursors = publishHandler.apply(publishContext, params);
  } catch(ex) {
    console.warn('error caught on publication: ', publishContext._subscription, ': ', ex.message);
    // since, this subscription caught on an error we can't proceed.
    // but we can't also throws an error since other publications might have something useful
    // So, it's not fair to ignore running them due to error of this sub
    // this might also be failed due to the use of some private API's of Meteor's Susbscription class
    publishContext.ready();
  }

  if(cursors) {
    //the publish function returned a cursor
    if(cursors.constructor != Array) {
      cursors = [cursors];
    }

    //add collection data
    cursors.forEach(function(cursor) {
      cursor.rewind();
      var collectionName = 
        (cursor._cursorDescription)? cursor._cursorDescription.collectionName: null || //for meteor-collections
        (cursor._collection)? cursor._collection._name: null; //for smart-collections

      self._ensureCollection(collectionName);
      self._collectionData[collectionName].push(cursor.fetch());
    });

    //the subscription is ready
    publishContext.ready();
  } else if(cursors === null) {
    //some developers send null to indicate they are not using the publication
    //this is not the way to go, but meteor's accounts-base also does this
    //so we need some special handling on this
    publishContext.ready();
  }

  if (!future.isResolved()) {
    //don't wait forever for handler to fire ready()
    Meteor.setTimeout(function() {
      if (!future.isResolved()) {
        //publish handler failed to send ready signal in time
        console.warn('Publish handler for', publishContext._subscription, 'sent no ready signal');
        future.return();
      }
    }, 500);  //arbitrarially set timeout to 500ms, should probably be configurable
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

Context.prototype._ensureCollection = function(collectionName) {
  if(!this._collectionData[collectionName]) {
    this._collectionData[collectionName] = [];
  }
};

Context.prototype.getData = function() {
  // Ensure that all of the subscriptions are ready
  this._subscriptionFutures.forEach(function(future) {
    future.wait();
  });

  return {
    collectionData: this._collectionData,
    subscriptions: this._subscriptions,
    loginToken: this._loginToken
  };
};

FastRender._Context = Context;