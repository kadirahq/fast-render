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
    options.controller.prototype.fastRendered &&
    typeof options.controller.prototype.waitOn == 'function';

  //TODO: Add support for options.waitOn too.
  
  if(!options) {
    // return originalRoute.call(this, name);
  } else if(options.fastRendered && options.waitOn) {
    //do FR support

  } else if(options.controller && 
    options.controller.prototype.fastRendered &&
    typeof options.controller.prototype.waitOn == 'function') {
  
    FastRender.route(options.path, function(params, path) {
      var self = this;
      var context = {
        params: params,
        path: path
      };
 
      //reset subscriptions;
      currentSubscriptions = [];
      options.controller.prototype.waitOn.call(context);

      currentSubscriptions.forEach(function(args) {
        self.subscribe.apply(self, args);
      });
    });
  } else {
    // return originalRoute.call(this, name, options);
  }
};

FastRender.RouteController = RouteController.extend({
  fastRendered: true,
  action: function() {
    console.log('ACTION');
  },
  run: function() {
    console.log('RUN');
  }
});
