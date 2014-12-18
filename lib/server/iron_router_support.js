if(!Package['iron:router']) return;

var RouteController = Package['iron:router'].RouteController;
var Router = Package['iron:router'].Router;

var currentSubscriptions = [];
Meteor.subscribe = function(subscription) {
  currentSubscriptions.push(arguments);
};

//assuming, no runtime routes will be added
Meteor.startup(function() {
  // this is trick to run the processRoutes at the 
  // end of all Meteor.startup callbacks
  Meteor.startup(processRoutes);
});

function processRoutes() {
  Router.routes.forEach(function(route) {
    route.options = route.options || {};
    if(route.options.fastRender) {
      handleRoute(route);
    } else if(
        getController(route) && 
        getController(route).prototype && 
        getController(route).prototype.fastRender
    ) {
      handleRoute(route);
    }
  });

  // getting global waitOns
  var globalWaitOns = [];
  if(Router._globalHooks && Router._globalHooks.waitOn && Router._globalHooks.waitOn.length > 0) {
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
};

function handleRoute(route) {
  var subscriptionFunctions = [];
  
  // get potential subscription handlers from the route options
  ['waitOn', 'subscriptions'].forEach(function(funcName) {
    var handler = route.options[funcName];
    if(typeof handler == 'function') {
      subscriptionFunctions.push(handler);
    } else if (handler instanceof Array) {
      handler.forEach(function(func) {
        if(typeof func == 'function') {
          subscriptionFunctions.push(func);
        }
      });
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

    // if there is a controller, try to initiate it and invoke potential 
    // methods which could give us subscriptions
    var controller = getController(route);
    if(controller && controller.prototype) {
      if(typeof controller.prototype.lookupOption == 'function') {
        // for IR 1.0
        // it is possible to create a controller invoke methods on it
        var controllerInstance = new controller();
        controllerInstance.params = params;
        controllerInstance.path = path;

        ['waitOn', 'subscriptions'].forEach(function(funcName) {
          if(controllerInstance[funcName]) {
            controllerInstance[funcName].call(controllerInstance);
          }
        });
      } else {
        // IR 0.9
        // hard to create a controller instance
        // so this is the option we can take
        var waitOn = controller.prototype.waitOn;
        if(waitOn) {
          waitOn.call(context);
        }
      }
    }

    currentSubscriptions.forEach(function(args) {
      self.subscribe.apply(self, args);
    });
  }
}

function getPath(route) {
  if(route._path) {
    // for IR 1.0
    return route._path;
  } else {
    // for IR 0.9
    var name = (route.name == "/")? "" : name;
    return route.options.path || ("/" + name);
  }
}

function getController(route) {
  if(route.findControllerConstructor) {
    // for IR 1.0
    return route.findControllerConstructor();
  } else if(route.findController) {
    // for IR 0.9
    return route.findController();
  } else {
    // unsupported version of IR
    return null;
  }
}