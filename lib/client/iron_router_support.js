if(!Package['iron-router']) return;

//track whether inside the ironRouter or not
//useful for identifying this inside the Meteor.subscribe
var insideIronRouter = false;
var RouteController = FastRender.RouteController = Package['iron-router'].RouteController;

var originalRun = RouteController.prototype.run;
RouteController.prototype.run = function() {
  if(FastRender.enabled) {
    insideIronRouter = true;
    originalRun.call(this);
    insideIronRouter = false;
  } else {
    originalRun.call(this);
  }
};

var originalSubscribe = Meteor.subscribe;
Meteor.subscribe = function(subscription) {
  var condition = 
    FastRender.enabled &&
    //need to inside the ironRouter
    insideIronRouter &&
    //path loaded from the server and the local Router path should be the same
    //We can't simply use Router.current().path, it will give some weird deps behaviour
    //which will result subscriptions stop everytime even they are not meant to
    getPath() == __fast_render_config.serverRoutePath &&
    //subscription not yet actually loaded (this may call multiple times)
    !__fast_render_config.loadedSubscriptions[subscription]

  if(condition) {
    Log('APPLY_IR_SUB_CORRECTIONS', subscription);
    originalSubscribe.apply(this, arguments);

    //ironRouter call .ready() and and if it's true he think subscription is completed
    return {
      ready: function() {
        return true;
      }
    }
  } else {
    return originalSubscribe.apply(this, arguments);
  }
};

function getPath() {
  var url = document.createElement('a');
  url.href = location.href;
  return url.pathname;
}