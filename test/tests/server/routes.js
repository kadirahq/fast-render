var assert = require('assert');

suite('Routes', function() {
  test('matching route', function(done, server) {
    var data = server.evalSync(function() {
      FastRender.route('/:user', function(params) {
        this.completeSubscriptions(params.user);
      });

      FastRender._processRoutes('/arunoda', null, {}, function(data) {
        emit('return', data);
      });
    });

    assert.deepEqual(data.subscriptions, {arunoda: true})
    done();
  });

  test('non-matching route', function(done, server) {
    var data = server.evalSync(function() {
      FastRender.route('/abc/:user', function(params) {
        this.completeSubscriptions(params.user);
      });

      FastRender._processRoutes('/arunoda', null, {}, function(data) {
        emit('return', data);
      });
    });

    assert.deepEqual(data.subscriptions, {})
    done();
  });

  test('on all routes', function(done, server) {
    var data = server.evalSync(function() {
      FastRender.onAllRoutes(function(path) {
        this.completeSubscriptions(path);
      });

      FastRender._processRoutes('arunoda', null, {}, function(data) {
        emit('return', data);
      });
    });

    assert.deepEqual(data.subscriptions, {arunoda: true});
    done();
  });

  test('loginToken-g', function(done, server, client) {
    client.evalSync(laika.actions.createUser, {username: 'arunoda', password: '123456'});
    var token = client.evalSync(function() {
      emit('return', Meteor._localStorage.getItem('Meteor.loginToken'));
    });
    var data = server.evalSync(function(token) {
      var user = Meteor.users.findOne({username: 'arunoda'});

      FastRender.route('/', function() {
        this.completeSubscriptions(this.userId);
      }); 

      FastRender._processRoutes('/', token, {}, function(data) {
        emit('return', {
          subscriptions: data.subscriptions, 
          user: user
        });
      });      
    }, token);

    var expected = {};
    expected[data.user._id] = true;
    assert.deepEqual(data.subscriptions, expected);
    done();
  });

  test('loginToken:Meteor.userId', function(done, server, client) {
    client.evalSync(laika.actions.createUser, {username: 'arunoda', password: '123456'});
    var token = client.evalSync(function() {
      emit('return', Meteor._localStorage.getItem('Meteor.loginToken'));
    }); 
    var data = server.evalSync(function(token) {
      var user = Meteor.users.findOne({username: 'arunoda'});

      var userId = "should have some id";
      FastRender.route('/', function() {
        userId = Meteor.userId();
      }); 

      FastRender._processRoutes('/', token, {}, function(data) {
        emit('return', {
          userId: userId, 
          user: user
        });
      });      
    }, token);

    assert.equal(data.user._id, data.userId);
    done();
  });

  test('nologinToken:Meteor.userId', function(done, server, client) {
    var userId = server.evalSync(function() {
      var userId = 'should be null';
      FastRender.route('/', function() {
        userId = Meteor.userId();
      }); 

      FastRender._processRoutes('/', null, {}, function(data) {
        emit('return', userId);
      });      
    });

    assert.equal(userId, null);
    done();
  });

  test('router headers', function(done, server, client) {
    var headers = server.evalSync(function() {
      var headers;
      FastRender.route('/', function(params) {
        headers = this.headers;
      });

      FastRender._processRoutes('/', null, { 'test-header': 'should-exist' }, function(data) {
        emit('return', headers);
      });
    });

    assert.deepEqual(headers, {'test-header': 'should-exist'})
    done();
  });
});
