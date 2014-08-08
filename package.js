var fs = Npm.require('fs');
var path = Npm.require('path');

Package.describe({
  summary: "a way to render the initial page super fast!",
  version: "1.0.1",
  git: "https://github.com/Tarang/meteor-fast-render.git"
});

Npm.depends({
  "connect": "2.13.0"
});

Package.on_use(function(api) {
  api.versionsFrom("METEOR-CORE@0.9.0-atm");
  api.use(['minimongo', 'livedata', 'mongo-livedata', 'ejson', 'underscore', 'webapp', 'routepolicy', 'accounts-base'], ['server']);
  api.use(['underscore', 'deps', 'ejson', 'accounts-base'], ['client']);

  api.use(['cmather:iron-router@0.8.2'], ['client', 'server']);

  api.add_files([
    'lib/server/inject_data.html',
    'lib/server/inject_config.html',
  ], 'server', {isAsset: true});

  api.add_files([
    'lib/utils.js'
  ], ['client', 'server']);

  api.add_files([
    'lib/server/utils.js',
    'lib/server/fast_render.js',
    'lib/server/publish_context.js',
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