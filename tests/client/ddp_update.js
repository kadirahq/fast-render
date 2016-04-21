Tinytest.addAsync('DDPUpdate - convert added to changed', function(test, done) {
  var collName = Random.id();
  var coll = new Mongo.Collection(collName);

  Meteor.connection._livedata_data({
    msg: 'added',
    collection: collName,
    id: 'one',
    fields: {name: "arunoda"}
  });

  Meteor.setTimeout(function () {
    test.equal(coll.findOne('one'), {_id: 'one', name: 'arunoda'});

    Meteor.connection._livedata_data({
      msg: 'added',
      collection: collName,
      id: 'one',
      fields: {name: "kuma", age: 20}
    });

    Meteor.setTimeout(function () {
      test.equal(coll.findOne('one'), {_id: 'one', name: 'kuma', age: 20});
      done();
    }, bufferedWritesInterval);

  }, bufferedWritesInterval);
});

Tinytest.addAsync('DDPUpdate - create collection later on', function(test, done) {
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
  Meteor.setTimeout(function () {
    test.equal(coll.find().fetch().length, 2);
    done();
  }, bufferedWritesInterval);
});

Tinytest.add('DDPUpdate - delete subscriptions', function(test) {
  FastRender._revertedBackToOriginal = false;
  var sub1 = {name: "coola", paramsKey: "k1"};
  var sub2 = {name: "booma", paramsKey: "k2"};
  FastRender._subscriptionIdMap = {subId: sub1, subId2: sub2};
  FastRender._subscriptions = {coola: {"k1": true}, booma: {"k2": true}};

  Meteor.connection._livedata_data({
    msg: 'ready',
    subs: ["subId"]
  });

  FastRender._revertedBackToOriginal = true;

  test.equal(FastRender._subscriptionIdMap, {subId2: sub2});
  test.equal(FastRender._subscriptions, {booma: {"k2": true}});
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
  FastRender._subscriptionIdMap = {subId: {name: "coola", paramsKey: "pk"}};
  FastRender._subscriptions = {coola: {"pk": true}};

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

  var params = [10, 20];
  var paramsKey = EJSON.stringify(params);
  FastRender._subscriptions = {'coolio': {}}
  FastRender._subscriptions['coolio'][paramsKey] = true;

  var subId = "the-id";
  Meteor.connection._send({msg: 'sub', name: 'coolio', id: subId, params: params});
  test.equal(FastRender._subscriptionIdMap, {'the-id': {name: 'coolio', paramsKey: paramsKey}});

  Meteor.connection._send = orginalSend;
  FastRender._revertedBackToOriginal = false;
});