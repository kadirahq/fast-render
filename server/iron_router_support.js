if(!Package['iron-router']) return;

var RouteController = Package['iron-router'].RouteController;
var ServerRouter = Package['iron-router'].ServerRouter;

var currentSubscriptions = [];
Meteor.subscribe = function(subscription) {
  currentSubscriptions.push(arguments);
};

var originalRoute = ServerRouter.prototype.route;
ServerRouter.prototype.route = function(name, options) {
  var condition = 
    options &&
    options.controller &&
    options.controller.prototype.fastRender &&
    typeof options.controller.prototype.waitOn == 'function';

  var waitOnFunction;
  if(!options) {
    // return originalRoute.call(this, name);
  } else if(options.fastRender && options.waitOn) {
    //do FR support
    waitOnFunction = options.waitOn;
    FastRender.route(options.path, onRoute);
  } else if(options.controller && 
    options.controller.prototype.fastRender &&
    typeof options.controller.prototype.waitOn == 'function') {
    
    waitOnFunction = options.controller.prototype.waitOn;
    FastRender.route(options.path, onRoute);
  } else {
    return originalRoute.call(this, name, options);
  }

  function onRoute(params, path) {
    var self = this;
    var context = {
      params: params,
      path: path
    };

    //reset subscriptions;
    currentSubscriptions = [];
    waitOnFunction.call(context);

    currentSubscriptions.forEach(function(args) {
      self.subscribe.apply(self, args);
    });
  }
};

FastRender.RouteController = RouteController.extend({
  fastRender: true,
  action: function() {
    console.log('ACTION');
  },
  run: function() {
    console.log('RUN');
  }
});