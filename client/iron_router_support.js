FastRender._addIronRouterSupport = function() {
  //only if IronRouter is added
  if(typeof RouteController != 'function') return;

  //track whether inside the ironRouter or not
  //useful for identifying this inside the Meteor.subscribe
  var insideIronRouter = false;

  //implementation for `insideIronRouter`
  var originalRun = RouteController.prototype.run;
  RouteController.prototype.run = function() {
    insideIronRouter = true;
    var rtn = originalRun.call(this);
    insideIronRouter = false;
    return rtn;
  };

  var originalSubscribe = Meteor.subscribe;
  Meteor.subscribe = function(subscription) {
    var condition = 
      //need to inside the ironRouter
      insideIronRouter &&
      //path loaded from the server and the local Router path should be the same
      Router.current().path == __fast_render_config.serverRoutePath &&
      //subscription not yet actually loaded (this may call multiple times)
      !__fast_render_config.loadedSubscriptions[subscription]

    if(condition) {
      FastRender.completeSubscriptions(subscription);
      originalSubscribe.apply(this, arguments);
    } else {
      return originalSubscribe.apply(this, arguments);
    }
  };
};



