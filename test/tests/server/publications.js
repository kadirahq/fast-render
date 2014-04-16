var assert = require('assert');

suite('Publications', function() {
  test('null publications', function(done, server) {
    var data = server.evalSync(function() {
      var Posts = new Meteor.Collection('posts');
      Posts.insert({_id: 'one', data: 'abc'});

      Meteor.publish(null, function() {
        return Posts.find();
      });

      FastRender.route('/:user', function(params) {
        this.completeSubscriptions(params.user);
      });

      FastRender._processRoutes('/arunoda', null, {}, function(data) {
        emit('return', data);
      });
    });

    assert.deepEqual(data.subscriptions, {arunoda: true})
    assert.deepEqual(data.collectionData, {
      posts: [[{_id: 'one', data: 'abc'}]]
    });
    done();
  });

  test('publications - with error', function(done, server) {
    var data = server.evalSync(function() {
      var Posts = new Meteor.Collection('posts');
      Posts.insert({_id: 'one', data: 'abc'});

      Meteor.publish(null, function() {
        throw new Error('oops');
      });

      Meteor.publish(null, function() {
        return Posts.find();
      });

      FastRender.route('/:user', function(params) {
        this.completeSubscriptions(params.user);
      });

      FastRender._processRoutes('/arunoda', null, {}, function(data) {
        emit('return', data);
      });
    });

    assert.deepEqual(data.subscriptions, {arunoda: true})
    assert.deepEqual(data.collectionData, {
      posts: [[{_id: 'one', data: 'abc'}]]
    });
    done();
  });
});