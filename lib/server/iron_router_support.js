if(!Package['iron-router']) return;

var RouteController = Package['iron-router'].RouteController;
var ServerRouter = Package['iron-router'].ServerRouter;

var currentSubscriptions = [];
Meteor.subscribe = function(subscription) {
  currentSubscriptions.push(arguments);
};

//assuming, no runtime routes will be added
Meteor.startup(function() {
  Router.routes.forEach(function(route) {
    handleRoute(route.name, route.options);
  });
});

function handleRoute(name, options) {
  var waitOnFunction;
  if(!options) {
    return false;
  } else if(options.fastRender && typeof options.waitOn == 'function') {
    //do FR support
    waitOnFunction = options.waitOn;
    FastRender.route(getPath(), onRoute);
    return true;
  } else if(options.controller && 
    options.controller.prototype &&
    options.controller.prototype.fastRender &&
    typeof options.controller.prototype.waitOn == 'function') {
    
    waitOnFunction = options.controller.prototype.waitOn;
    FastRender.route(getPath(), onRoute);
    return true;
  } else {
    return false;
  }

  //FastRender onRoute callback
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

  function getPath() {
    return options.path || ("/" + name);
  }
}

FastRender.RouteController = RouteController.extend({
  fastRender: true,
  //disabling any IR specific serverside stuffs
  where: 'client'
});