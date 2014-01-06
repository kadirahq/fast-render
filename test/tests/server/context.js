var assert = require('assert');

suite('Context', function() {
  test('find', function(done, server, client) {
    var collData = server.evalSync(function() {
      Posts = new Meteor.Collection('posts');
      Posts.insert({_id: '1', text: 'one', type: 'a'});
      Posts.insert({_id: '2', text: 'two', type: 'a'});
      Posts.insert({_id: 'three', text: 'two', type: 'b'});

      var c = new FastRender._Context();
      c.find(Posts, {type: 'a'}, {sort: {_id: -1}});
      emit('return', c._collectionData);
    });

    assert.deepEqual(collData, {
      "posts": [[
        {_id: '2', text: 'two', type: 'a'},
        {_id: '1', text: 'one', type: 'a'},
      ]]
    });
    done();
  });

  test('subscribe', function(done, server, client) {
    var contextData = server.evalSync(function() {
      Posts = new Meteor.Collection('posts');
      Posts.insert({_id: '1', text: 'one', type: 'a'});
      Posts.insert({_id: '2', text: 'two', type: 'a'});
      Posts.insert({_id: 'three', text: 'two', type: 'b'});

      Meteor.publish('posts', function(type) {
        return Posts.find({type: type}, {sort: {_id: -1}});
      });

      var c = new FastRender._Context();
      c.subscribe('posts', 'a');
      emit('return', {
        _collectionData: c._collectionData,
        _subscriptions: c._subscriptions 
      });
    });

    assert.deepEqual(contextData, {
      _collectionData: {
        "posts": [[
          {_id: '2', text: 'two', type: 'a'},
          {_id: '1', text: 'one', type: 'a'},
        ]]
      },
      _subscriptions: {'posts': true}
    });

    done();
  });

  test('forgetSubscriptions', function(done, server) {
    var subs = server.evalSync(function() {
      var c = new FastRender._Context();
      c.forgetSubscriptions(['abc', 'bbc']);
      c.forgetSubscriptions('ccc');

      emit('return', c._forgetSubscriptions);
    });

    assert.deepEqual(subs, {
      abc: true,
      bbc: true,
      ccc: true
    });
    done();
  });

  test('completeSubscriptions', function(done, server) {
    var subs = server.evalSync(function() {
      var c = new FastRender._Context();
      c.completeSubscriptions(['abc', 'bbc']);
      c.completeSubscriptions('ccc');

      emit('return', c._subscriptions);
    });

    assert.deepEqual(subs, {
      abc: true,
      bbc: true,
      ccc: true
    });
    done();
  });
});