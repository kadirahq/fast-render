PublishContext = function PublishContext(context, subscription) {
  this.userId = context.userId;
  this.unblock = function() {};
  this._pubId = Random.id();
  this._subscription = subscription;
  this._context = context;
  this._collectionData = {};
  this._onStop = [];
  this._stopped = false;

  // connection object
  this.connection = {
    _id: Meteor.uuid(),
    close: function() {},
    onClose: function() {},
    // fake value, will be supported later on
    clientAddress: "127.0.0.1",
    httpHeaders: context.headers
  };

  // we won't be supporting all the other fields of the Meteor's
  // Subscription class since they are private variables
};

PublishContext.prototype._addCursor = function(cursor) {
  var self = this;
  cursor.rewind();
  var collectionName = 
    (cursor._cursorDescription)? cursor._cursorDescription.collectionName: null || //for meteor-collections
    (cursor._collection)? cursor._collection._name: null; //for smart-collections

  this._ensureCollection(collectionName);
  var cursorData = cursor.fetch();
  cursorData.forEach(function(doc) {
    self.added(collectionName, doc._id, doc);
  });
};

PublishContext.prototype._ensureCollection = function(collection) {
  if (!this._collectionData[collection]) {
    this._collectionData[collection] = [];
  }
};

PublishContext.prototype.added = function(collection, id, fields) {
  this._ensureCollection(collection);
  var doc = _.clone(fields);
  doc._id = id;
  this._collectionData[collection].push(doc);
  this._context._added(collection, id, this._pubId);
};

PublishContext.prototype.changed = function(collection, id, fields) {
  this._ensureCollection(collection);
  var collectionData = this._collectionData;
  var found = false;
  collectionData[collection] = collectionData[collection].map(function(doc) {
    if (doc._id === id) {
      found = true;
      return _.extend(doc, fields);
    }

    return doc;
  });
  // If we found the doc, then we've changed it so we're done
  if (found)
    return;
  // Otherwise, see if it exists in another view within this context
  if (this._context._docIsPublished(collection, id)) {
    // Found it, so we can just add it to our view.
    this.added(collection, id, fields);
  } else {
    // We didn't find it, so attempting to change it is an error
    throw new Error("Could not find element with id " + id + " to change");      
  }
};

PublishContext.prototype.removed = function(collection, id) {
  this._ensureCollection(collection);
  var collectionData = this._collectionData;
  var found = false;
  collectionData[collection] = collectionData[collection].filter(function(doc) {
    if (doc._id === id) {
      found = true;
      return false;
    } else {
      return true;
    }
  });
  // If we didn't find (and remove) it, throw an error if it doesn't exists in
  // another view within this context.
  if (!found && !this._context._docIsPublished(collection, id)) {
    throw new Error("Removed nonexistent document " + id);     
  }
  this._context._removed(collection, id, this._pubId);  
};

PublishContext.prototype.onStop = function(cb) {
  if (this._stopped) {
    cb();
  } else {
    this._onStop.push(cb);
  }
};

PublishContext.prototype.ready = function() {
  this._stopped = true;

  //make the subscription be marked as ready
  if(this._subscription) {
    //don't do this for null subscriptions
    this._context.completeSubscriptions(this._subscription);
  }

  //make sure that any observe callbacks are cancelled
  this._onStop.forEach(function(cb) {
    cb();
  });
};

PublishContext.prototype.error = function() {};
PublishContext.prototype.stop = function() {};