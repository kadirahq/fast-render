if(!Package['iron:router']) return;

var RouteController = Package['iron:router'].RouteController;
var Router = Package['iron:router'].Router;

var currentSubscriptions = [];
Meteor.subscribe = function(subscription) {
  currentSubscriptions.push(arguments);
};

//assuming, no runtime routes will be added
Meteor.startup(function() {
  Router.routes.forEach(function(route) {
    route.options = route.options || {};
    if(route.options.fastRender) {
      handleRoute(route);
    } else if(route.options.controller && route.options.controller.prototype.fastRender) {
      handleRoute(route);
    }
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

function handleRoute(route) {
  var subscriptionFunctions = [];
  
  ['waitOn', 'subscriptions'].forEach(function(funcName) {
    if(route.options[funcName]) {
      subscriptionFunctions.push(route.options[funcName]);
    }
  });

  FastRender.route(getPath(route), onRoute);

  function onRoute(params, path) {
    var self = this;
    var context = {
      params: params,
      path: path
    };

    //reset subscriptions;
    currentSubscriptions = [];
    subscriptionFunctions.forEach(function(func) {
      func.call(context);
    });

    if(route.options.controller && route.options.controller.prototype.subscriptions) {
      var controllerInstance = new route.options.controller();
      controllerInstance.params = params;
      controllerInstance.path = path;

      ['waitOn', 'subscriptions'].forEach(function(funcName) {
        if(controllerInstance[funcName]) {
          controllerInstance[funcName].call(controllerInstance);
        }
      });
    }

    currentSubscriptions.forEach(function(args) {
      self.subscribe.apply(self, args);
    });
  }
}

function getPath(route) {
  if(route._path) {
    return route._path;
  } else {
    var name = (route.name == "/")? "" : name;
    return route.options.path || ("/" + name);
  }
}