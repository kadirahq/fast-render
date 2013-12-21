Package.describe({
  "summery": "a way to render the initial page super fast!"
});

Npm.depends({
  
});

Package.on_use(function(api) {
  api.use(['minimongo', 'livedata', 'mongo-livedata', 'ejson', 'underscore', 'webapp'], ['server']);
  api.add_files(['server/inject.html'], 'server', {isAsset: true}); 

  api.add_files([
    'server/utils.js',
    'server/context.js',
    'server/fast_render.js',
    'server/inject.js',
  ], 'server');  

  api.add_files([
    'client/ddp_update.js',
    'client/data_handler.js'
  ], 'client'); 

  api.export('FastRender', ['client', 'server']);
  api.export('__init_fast_render', ['client']);
});
