Tinytest.add('FastRender - init - coll data ', function(test) {
  var expectedMessages = [
    {msg: 'added', collection: "posts", id: "one", fields: {name: "arunoda"}, frGen: true},
    {msg: 'added', collection: "posts", id: "two", fields: {name: "meteorhacks"}, frGen: true},
    {msg: 'added', collection: "comments", id: "one", fields: {text: "great"}, frGen: true}
  ];

  var payload = {
    subscriptions: {posts: true},
    collectionData: {
      posts: [[
        {_id: "one", name: "arunoda"},
        {_id: "two", name: "meteorhacks"},
      ]],
      comments: [[
        {_id: "one", text: "great"}
      ]]
    }
  };

  var newMessages = [];

  WithNewInjectDdpMessage(function(conn, ddpMessage) {
    newMessages.push(ddpMessage);
  }, function() {

    FastRender.init(payload);

    test.equal(newMessages, expectedMessages);
    test.equal(FastRender._subscriptions, payload.subscriptions);
  });
});

Tinytest.addAsync('FastRender - init - ObjectId support', function(test, done) {
  var id = new IDTools.ObjectID();
  var payload = {
    subscriptions: {posts: true},
    collectionData: {
      posts: [[
        {_id: id, name: "arunoda"},
      ]]
    }
  };

  WithNewInjectDdpMessage(function(conn, ddpMessage) {
    test.equal(ddpMessage.id, id._str);
    done();
  }, function() {

    FastRender.init(payload);
  });
});

Tinytest.addAsync('FastRender - init - merge docs', function(test, done) {
  var collName = Random.id();
  var payload = {
    subscriptions: {posts: true},
    collectionData: {

    }
  };

  payload.collectionData[collName] = [
    [{_id: "one", name: "arunoda", age: 20}],
    [{_id: "one", name: "arunoda", age: 30, city: "colombo"}],
    [{_id: "one", plan: "pro"}]
  ];

  FastRender.init(payload);

  var coll = new Mongo.Collection(collName);
  Meteor.setTimeout(function () {
    test.equal(coll.findOne('one'), {
      _id: "one",
      name: "arunoda",
      age: 30,
      city: "colombo",
      plan: "pro"
    });
    done();
  }, bufferedWritesInterval);
});

Tinytest.addAsync('FastRender - init - merge docs deep', function(test, done) {
  var collName = Random.id();
  var payload = {
    subscriptions: {posts: true},
    collectionData: {

    }
  };

  payload.collectionData[collName] = [
    [{_id: "one", name: "arunoda", profile: {name: "arunoda"}}],
    [{_id: "one", name: "arunoda", profile: {email: "arunoda@arunoda.com"}}],
  ];

  FastRender.init(payload);

  var coll = new Mongo.Collection(collName);
  Meteor.setTimeout(function () {
    test.equal(coll.findOne('one'), {
      _id: "one",
      name: "arunoda",
      profile: {
        name: "arunoda",
        email: "arunoda@arunoda.com"
      }
    });
    done();
  }, bufferedWritesInterval);
});


Tinytest.addAsync('FastRender - init - ejon data', function(test, done) {
  var collName = Random.id();
  var payload = {
    subscriptions: {posts: true},
    collectionData: {

    }
  };

  var date = new Date('2014-10-20');
  payload.collectionData[collName] = [
    [{_id: "one", name: "arunoda", date: date}],
  ];

  FastRender.init(payload);

  var coll = new Mongo.Collection(collName);
  Meteor.setTimeout(function () {
    var doc = coll.findOne("one");
    test.equal(doc.date.getTime(), date.getTime());
    done();
  }, bufferedWritesInterval);
});

WithNewInjectDdpMessage = function(newCallback, runCode) {
  var originalInjectDDP = FastRender.injectDdpMessage;
  FastRender.injectDdpMessage = newCallback;
  if(runCode) runCode();
  FastRender.injectDdpMessage = originalInjectDDP;
};