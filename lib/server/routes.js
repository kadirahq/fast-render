var Fiber = Npm.require('fibers');
FastRender._onAllRoutes = [];

var fastRenderRoutes = Picker.filter(function(req, res) {
  return IsAppUrl(req.url);
});
fastRenderRoutes.middleware(Npm.require('connect').cookieParser());

FastRender.route = function route(path, callback) {
  fastRenderRoutes.route(path, onRoute);

  function onRoute(params, req, res, next) {
    FastRender._processRoutes(params, req, callback, function(queryData) {
      res.queryData = queryData;
      next();
    });
  }
};

FastRender.onAllRoutes = function onAllRoutes(callback) {
  FastRender._onAllRoutes.push(callback);
};

FastRender._processRoutes =
  function _processRoutes(params, req, routeCallback, callback) {
  callback = callback || function() {};

  var path = req.url;
  var loginToken = req.cookies['meteor_login_token'];
  var headers = req.headers;

  var context = new Context(loginToken, { headers: headers });
  try {
    //run onAllRoutes callbacks if provided
    FastRender._onAllRoutes.forEach(function(callback) {
      callback.call(context, path);
    });

    routeCallback.call(context, params, path);
    callback(context.getData());
  } catch(err) {
    console.error('error on fast-rendering path: ' + path + " ; error: " + err.stack);
    callback(null);
  }
};

// adding support for null publications
FastRender.onAllRoutes(function() {
  var context = this;
  var nullHandlers = Meteor.default_server.universal_publish_handlers;

  if(nullHandlers && nullHandlers) {
    nullHandlers.forEach(function(publishHandler) {
      var publishContext = new PublishContext(context, null);
      var params = [];
      context.processPublication(publishHandler, publishContext, params);
    });
  }
});