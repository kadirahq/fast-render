Package.describe({
  "summery": "a way to render the initial page super fast!"
});

Npm.depends({
  "connect": "2.12.0"
});

Package.on_use(function(api) {
  api.use(['minimongo', 'livedata', 'mongo-livedata', 'ejson', 'underscore', 'webapp'], ['server']);
  api.use(['underscore', 'deps', 'ejson'], ['client']);

  api.add_files([
    'server/inject_data.html',
    'server/inject_config.html',
  ], 'server', {isAsset: true}); 

  api.add_files([
    'server/utils.js',
    'server/context.js',
    'server/fast_render.js',
    'server/inject.js',
  ], 'server');  

  api.add_files([
    'vendor/cookies.js',
    'client/fast_render.js',
    'client/ddp_update.js',
    'client/data_handler.js',
    'client/iron_router_support.js',
    'client/auth.js'
  ], 'client'); 

  api.export('FastRender', ['client', 'server']);
  api.export('__init_fast_render', ['client']);
});
