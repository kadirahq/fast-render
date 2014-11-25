Tinytest.add('DDPUpdate - convert added to changed', function(test) {
  var collName = Random.id();
  var coll = new Mongo.Collection(collName);

  Meteor.connection._livedata_data({
    msg: 'added',
    collection: collName,
    id: 'one',
    fields: {name: "arunoda"}
  });

  test.equal(coll.findOne('one'), {_id: 'one', name: 'arunoda'});

  Meteor.connection._livedata_data({
    msg: 'added',
    collection: collName,
    id: 'one',
    fields: {name: "kuma", age: 20}
  });

  test.equal(coll.findOne('one'), {_id: 'one', name: 'kuma', age: 20});
});

Tinytest.add('DDPUpdate - create collection later on', function(test) {
  var collName = Random.id();

  Meteor.connection._livedata_data({
    msg: 'added',
    collection: collName,
    id: 'one',
    fields: {name: "arunoda"}
  });

  Meteor.connection._livedata_data({
    msg: 'added',
    collection: collName,
    id: 'two',
    fields: {name: "kamal"}
  });

  var coll = new Mongo.Collection(collName);
  test.equal(coll.find().fetch().length, 2);
});

Tinytest.add('DDPUpdate - delete subscriptions', function(test) {
  FastRender._revertedBackToOriginal = false;
  FastRender._subscriptionIdMap = {subId: "coola", subId2: "coola"};
  FastRender._subscriptions = {coola: true, booma: true};

  Meteor.connection._livedata_data({
    msg: 'ready',
    subs: ["subId"]
  });

  FastRender._revertedBackToOriginal = true;

  test.equal(FastRender._subscriptionIdMap, {subId2: "coola"});
  test.equal(FastRender._subscriptions, {booma: true});
});

Tinytest.add('DDPUpdate - ignore frGen ready messages', function(test) {
  FastRender._revertedBackToOriginal = false;
  FastRender._subscriptionIdMap = {subId: "coola", subId2: "coola"};
  FastRender._subscriptions = {coola: true, booma: true};

  Meteor.connection._livedata_data({
    msg: 'ready',
    subs: ["subId"],
    frGen: true
  });

  FastRender._revertedBackToOriginal = true;

  test.equal(FastRender._subscriptionIdMap, {subId: "coola", subId2: "coola"});
  test.equal(FastRender._subscriptions, {coola: true, booma: true});
});

Tinytest.add('DDPUpdate - revertedBackToOriginal', function(test) {
  FastRender._revertedBackToOriginal = false;
  FastRender._subscriptionIdMap = {subId: "coola"};
  FastRender._subscriptions = {coola: true};

  Meteor.connection._livedata_data({
    msg: 'ready',
    subs: ["subId"]
  });

  test.equal(FastRender._subscriptionIdMap, {});
  test.equal(FastRender._subscriptions, {});
  test.equal(FastRender._revertedBackToOriginal, true);
});

Tinytest.add('DDPUpdate - fake ready messages', function(test) {
  FastRender._revertedBackToOriginal = false;
  var orginalSend = Meteor.connection._send;

  FastRender._subscriptions = {'coolio': true}
  var subId = "the-id";
  Meteor.connection._send({msg: 'sub', name: 'coolio', id: subId});
  test.equal(FastRender._subscriptionIdMap, {'the-id': 'coolio'});

  Meteor.connection._send = orginalSend;
  FastRender._revertedBackToOriginal = false;
});