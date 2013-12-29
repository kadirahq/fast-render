Package.describe({
  "summery": "a way to render the initial page super fast!"
});

Npm.depends({
  "connect": "2.12.0"
});

Package.on_use(function(api) {
  api.use(['minimongo', 'livedata', 'mongo-livedata', 'ejson', 'underscore', 'webapp'], ['server']);
  api.use(['underscore', 'deps', 'ejson'], ['client']);

  if(isIronRouterExists()) {
    api.use(['iron-router'], ['client', 'server'], {weak: true});
  }

  api.add_files([
    'server/inject_data.html',
    'server/inject_config.html',
  ], 'server', {isAsset: true}); 

  api.add_files([
    'server/utils.js',
    'server/context.js',
    'server/fast_render.js',
    'server/inject.js',
    'server/iron_router_support.js',
  ], 'server');  

  api.add_files([
    'vendor/cookies.js',
    'vendor/deepExtend.js',
    'client/log.js',
    'client/fast_render.js',
    'client/ddp_update.js',
    'client/data_handler.js',
    'client/iron_router_support.js',
    'client/auth.js'
  ], 'client'); 

  api.export('FastRender', ['client', 'server']);
  api.export('__init_fast_render', ['client']);
});

function isIronRouterExists() {
  var fs = Npm.require('fs');
  var path = Npm.require('path');
  var meteorPackages = fs.readFileSync(path.resolve('.meteor/packages'), 'utf8');
  !!meteorPackages.match(/iron-router\n/);
}
