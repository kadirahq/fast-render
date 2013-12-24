var Fiber = Npm.require('fibers');

FastRender = {
  _routes: []
};

FastRender.route = function route(path, callback) {
  var keys = [];
  FastRender._routes.push({
    regexp: Utils._pathRegexp(path, keys, false, false),
    callback: callback,
    keys: keys
  });
};

FastRender._processRoutes = function _processRoutes(path, callback) {
  var selectedRoute;
  var params;

  for(var lc=0; lc<FastRender._routes.length; lc++) {
    var route = FastRender._routes[lc];
    params = Utils._pathMatch(path, route);
    if(params) {
      selectedRoute = route;
      break;
    }
  }

  if(selectedRoute) {
    var context = new Context();

    Fiber(function() {
      try {
        selectedRoute.callback.call(context, params);
        callback(context.getData());
      } catch(err) {
        console.error('error on fast-rendering path: ' + path + " ; error: " + err.stack);
        callback(null);
      }
    }).run();
  } else {
    callback(null);
  }
};