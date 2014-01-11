Package.describe({
  "summery": "a way to render the initial page super fast!"
});

Npm.depends({
  "connect": "2.12.0"
});

Package.on_use(function(api) {
  api.use(['minimongo', 'livedata', 'mongo-livedata', 'ejson', 'underscore', 'webapp'], ['server']);
  api.use(['underscore', 'deps', 'ejson'], ['client']);

  //this is needed since, we are depending on the iron-router on the smart.json
  //so if the user has iron-router we need to do a weak dependacy on them
  //if the user has no iron-router installed, direct call to weak dependancy throws an error
  if(isIronRouterExists()) {
    api.use(['iron-router'], ['client', 'server'], {weak: true});
  }

  api.add_files([
    'lib/server/inject_data.html',
    'lib/server/inject_config.html',
  ], 'server', {isAsset: true}); 

  api.add_files([
    'lib/server/utils.js',
    'lib/server/fast_render.js',
    'lib/server/context.js',
    'lib/server/inject.js',
    'lib/server/iron_router_support.js',
  ], 'server');  

  api.add_files([
    'lib/vendor/cookies.js',
    'lib/vendor/deepExtend.js',
    'lib/client/log.js',
    'lib/client/fast_render.js',
    'lib/client/ddp_update.js',
    'lib/client/data_handler.js',
    'lib/client/iron_router_support.js',
    'lib/client/auth.js'
  ], 'client'); 

  api.export('FastRender', ['client', 'server']);
  api.export('__init_fast_render', ['client']);
});

function isIronRouterExists() {
  var fs = Npm.require('fs');
  var path = Npm.require('path');
  var meteorPackages = fs.readFileSync(path.resolve('.meteor/packages'), 'utf8');
  return !!meteorPackages.match(/iron-router/);
}