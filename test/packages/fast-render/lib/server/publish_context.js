PublishContext = function PublishContext(context, subscription) {
  this.userId = context.userId;
  this._subscription = subscription;
  this._context = context;
  this._collectionData = {};
  this._onStop = [];
};

PublishContext.prototype._ensureCollection = function(collection) {
  if (!this._collectionData[collection]) {
    this._collectionData[collection] = [];

    //put this collection data in the parent context
    this._context._ensureCollection(collection);
    this._context._collectionData[collection].push(this._collectionData[collection]);
  }
};

PublishContext.prototype.added = function(collection, id, fields) {
  this._ensureCollection(collection);
  var doc = _.clone(fields);
  doc._id = id;
  this._collectionData[collection].push(doc);
};

PublishContext.prototype.changed = function(collection, id, fields) {
  var collectionData = this._collectionData;

  collectionData[collection] = collectionData[collection].map(function(doc) {
    if (doc._id === id) {
      var newDoc = _.clone(fields);
      newDoc._id = id;
      return newDoc;
    }

    return doc;
  });
};

PublishContext.prototype.removed = function(collection, id) {
  var collectionData = this._collectionData;

  collectionData[collection] = collectionData[collection].filter(function(doc) {
    return dod._id !== id;
  });
};

PublishContext.prototype.onStop = function(cb) {
  this._onStop.push(cb);
};

PublishContext.prototype.ready = function() {
  //make the subscription be marked as ready
  this._context.completeSubscriptions(this._subscription);

  //make sure that any observe callbacks are cancelled
  this._onStop.forEach(function(cb) {
    cb();
  });
};

