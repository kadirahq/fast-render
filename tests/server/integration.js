Tinytest.add('integration - with a simple route', function(test) {
  var collName = Random.id();
  var pubName = Random.id();
  var path = "/" + Random.id();
  var obj = {_id: "one", aa: 10};

  var coll = new Meteor.Collection(collName);
  coll.insert(obj);

  Meteor.publish(pubName, function() {
    return coll.find();
  });

  FastRender.route(path, function() {
    this.subscribe(pubName);
  });

  var data = getFRData(path);
  test.isTrue(data.subscriptions[pubName]);
  test.equal(data.collectionData[collName][0][0], obj);
});

Tinytest.add('integration - onAllRoutes', function(test) {
  var collName = Random.id();
  var pubName = Random.id();
  var path = "/" + Random.id();
  var obj = {_id: "one", aa: 10};

  var coll = new Meteor.Collection(collName);
  coll.insert(obj);

  var cursorHandler = createCursorHandler(function() {
    return coll.find();
  });

  Meteor.publish(pubName, function() {
    return cursorHandler.get();
  });

  FastRender.onAllRoutes(function() {
    this.subscribe(pubName);
  });

  var data = getFRData(path);
  test.isTrue(data.subscriptions[pubName]);
  test.equal(data.collectionData[collName][0][0], obj);
  cursorHandler.stop();
});

Tinytest.add('integration - onAllRoutes + route ', function(test) {
  var collName = Random.id();
  var pubName = Random.id();
  var path = "/" + Random.id();
  var obj1 = {_id: "one", aa: 10};
  var obj2 = {_id: "two", aa: 10};

  var coll = new Meteor.Collection(collName);
  coll.insert(obj1);
  coll.insert(obj2);

  var cursorHandler = createCursorHandler(function(id) {
    return coll.find({_id: id});
  });

  Meteor.publish(pubName, function(id) {
    return cursorHandler.get(id);
  });

  FastRender.onAllRoutes(function() {
    this.subscribe(pubName, 'one');
  });

  FastRender.route(path, function() {
    this.subscribe(pubName, 'two');
  });

  var data = getFRData(path);
  test.isTrue(data.subscriptions[pubName]);
  test.equal(data.collectionData[collName][0][0], obj1);
  test.equal(data.collectionData[collName][1][0], obj2);
  cursorHandler.stop();
});

Tinytest.add('integration - null publications', function(test) {
  var collName = Random.id();
  var pubName = Random.id();
  var path = "/" + Random.id();
  var obj = {_id: "one", aa: 10};
  var sent = false;

  var coll = new Meteor.Collection(collName);
  coll.insert(obj);

  var cursorHandler = createCursorHandler(function() {
    return coll.find();
  });
  Meteor.publish(null, function() {
    return cursorHandler.get();
  });

  var data = getFRData(path);
  test.equal(data.collectionData[collName][0][0], obj);
  cursorHandler.stop();
});

Tinytest.add('integration - send data via this.* apis', function(test) {
  var collName = Random.id();
  var pubName = Random.id();
  var path = "/" + Random.id();
  var obj = {_id: "one", aa: 10};

  Meteor.publish(pubName, function() {
    var sub = this;
    sub.added(collName, obj._id, _.omit(obj, '_id'));
    Meteor.setTimeout(function() {
      sub.ready();
    }, 100);
  });

  FastRender.route(path, function() {
    this.subscribe(pubName);
  });

  var data = getFRData(path);
  test.isTrue(data.subscriptions[pubName]);
  test.equal(data.collectionData[collName][0][0], obj);
});

Tinytest.add('integration - send data via this.* apis, but delayed', function(test) {
  var collName = Random.id();
  var pubName = Random.id();
  var path = "/" + Random.id();
  var obj = {_id: "one", aa: 10};

  Meteor.publish(pubName, function() {
    var sub = this;
    Meteor.setTimeout(function() {
      sub.added(collName, obj._id, _.omit(obj, '_id'));
      sub.ready();
    }, 1000);
  });

  FastRender.route(path, function() {
    this.subscribe(pubName);
  });

  var data = getFRData(path);
  test.isFalse(data.subscriptions[pubName]);
  test.equal(data.collectionData, {});
});

Tinytest.add('integration - error inside a publication', function(test) {
  var collName = Random.id();
  var pubName = Random.id();
  var path = "/" + Random.id();
  var obj = {_id: "one", aa: 10};

  var coll = new Meteor.Collection(collName);
  coll.insert(obj);

  Meteor.publish(pubName, function() {
    throw new Error("some bad thing happens");
  });

  FastRender.route(path, function() {
    this.subscribe(pubName);
  });

  var data = getFRData(path);
  test.equal(data.collectionData, {});
});

Tinytest.add('integration - error inside a null publication', function(test) {
  var collName = Random.id();
  var pubName = Random.id();
  var path = "/" + Random.id();
  var obj = {_id: "one", aa: 10};

  var coll = new Meteor.Collection(collName);
  coll.insert(obj);

  Meteor.publish(null, function() {
    throw new Error("some bad thing happens");
  });

  var data = getFRData(path);
  test.equal(data.collectionData, {});
});

Tinytest.add('integration - when path has no leading slash', function(test) {
  var path = Random.id();

  test.throws(function(){
    FastRender.route(path, function() {
    });
  }, 'Error: path (' + path + ') must begin with a leading slash "/"');
});

var urlResolve = Npm.require('url').resolve;
function getFRData(path) {
  var url = urlResolve(process.env.ROOT_URL, path);
  var options = {
    headers: {
      "Accept": "text/html"
    }
  };
  var res = HTTP.get(url, options);

  var encodedData = res.content.match(/data">(.*)<\/script/)[1];
  return InjectData._decode(encodedData)['fast-render-data'];
}

function createCursorHandler(callback) {
  var stop = false;
  function getFn() {
    if(stop) {
      return [];
    } else {
      return callback.apply(this, arguments);
    }
  }

  function stopFn() {
    stop = true;
  }

  return {
    get: getFn,
    stop: stopFn
  };
}