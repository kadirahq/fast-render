Tinytest.add('Context - subscribe', function(test) {
  var collName = Random.id();
  var coll = new Mongo.Collection(collName);
  coll.insert({_id: "one", age: 20});
  coll.insert({_id: "two", age: 40});

  var pubName = Random.id();
  Meteor.publish(pubName, function() {
    return coll.find();
  });

  var context = new Context();
  context.subscribe(pubName);

  var expectedData = {
    subscriptions: {},
    collectionData: {},
    loginToken: undefined
  };
  expectedData.subscriptions[pubName] = {"[]": true};
  expectedData.collectionData[collName] = [
    coll.find().fetch()
  ];

  test.equal(context.getData(), expectedData);
});

Tinytest.add('Context - subscribe with this.x apis', function(test) {
  var collName = Random.id();
  var coll = new Mongo.Collection(collName);
  coll.insert({_id: "one", age: 20});
  coll.insert({_id: "two", age: 40});

  var pubName = Random.id();
  Meteor.publish(pubName, function() {
    var data = coll.find().fetch();
    this.added(collName, data[0]._id, data[0]);
    this.added(collName, data[1]._id, data[1]);
    this.ready();
  });

  var context = new Context();
  context.subscribe(pubName);

  var expectedData = {
    subscriptions: {},
    collectionData: {},
    loginToken: undefined
  };
  expectedData.subscriptions[pubName] = {"[]": true};
  expectedData.collectionData[collName] = [
    coll.find().fetch()
  ];

  test.equal(context.getData(), expectedData);
});

Tinytest.add('Context - subscribe with this.x apis - no ready called', function(test) {
  var pubName = Random.id();
  Meteor.publish(pubName, function() {
    
  });

  var context = new Context();
  context.subscribe(pubName);

  var expectedData = {
    subscriptions: {},
    collectionData: {},
    loginToken: undefined
  };

  test.equal(context.getData(), expectedData);
});

Tinytest.addAsync('Context - loggedIn user', function(test, done) {
  var id = Random.id();
  var username = Random.id();
  var loginToken = Random.id();

  Meteor.users.insert({_id: id, username: username});
  var hashedToken = Accounts._hashLoginToken( loginToken );
  Meteor.users.update(id, {$set: {'services.resume.loginTokens.hashedToken': hashedToken}})

  var pubName = Random.id();
  Meteor.publish(pubName, function() {
    test.equal(this.userId, id);
    test.equal(Meteor.userId(), id);
    done();
  });

  var context = new Context(loginToken);
  context.subscribe(pubName);
});