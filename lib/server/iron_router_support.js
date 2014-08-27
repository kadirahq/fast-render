if(!Package['iron:router']) return;

var RouteController = Package['iron:router'].RouteController;
var ServerRouter = Package['iron:router'].ServerRouter;

var currentSubscriptions = [];
Meteor.subscribe = function(subscription) {
  currentSubscriptions.push(arguments);
};

//assuming, no runtime routes will be added
Meteor.startup(function() {
  Router.routes.forEach(function(route) {
    //resolve controller class
    if(route.options && typeof route.options.controller == 'string') {
      route.options.controller = this[route.options.controller];
    }
    handleRoute(route.name, route.options);
  });

  var globalWaitOns = [];
  if(Router.options && typeof Router.options.waitOn == 'function') {
    //for 0.6.x
    globalWaitOns.push(Router.options.waitOn);
  } else if(Router._globalHooks && Router._globalHooks.waitOn && Router._globalHooks.waitOn.length > 0) {
    //for 0.7.x
    Router._globalHooks.waitOn.forEach(function(waitOn) {
      globalWaitOns.push(waitOn.hook);
    });
  }
  
  FastRender.onAllRoutes(function(path) {
    var self = this;
    
    currentSubscriptions = [];
    globalWaitOns.forEach(function(waitOn) {
      waitOn.call({path: path});
    });
    
    currentSubscriptions.forEach(function(args) {
      self.subscribe.apply(self, args);
    });
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
    name = (name == "/")? "" : name;
    return options.path || ("/" + name);
  }
}

FastRender.RouteController = RouteController.extend({
  fastRender: true,
  //disabling any IR specific serverside stuffs
  where: 'client'
});