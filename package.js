var fs = Npm.require('fs');
var path = Npm.require('path');

Package.describe({
  "summary": "Render initial page 2-10 times faster by sending data with HTML",
  "version": "2.0.0-rc3",
  "git": "https://github.com/meteorhacks/fast-render",
  "name": "meteorhacks:fast-render"
});

Npm.depends({
  "connect": "2.13.0"
});

Package.on_use(function(api) {
  api.versionsFrom('METEOR@0.9.3');
  api.use('iron:router@0.9.0 || 1.0.0', ['client', 'server'], {weak: true});
  api.use('chuangbo:cookie@1.1.0', 'client');

  api.use(['minimongo', 'livedata', 'ejson', 'underscore', 'webapp', 'routepolicy', 'accounts-base'], ['server']);
  api.use(['minimongo', 'underscore', 'deps', 'ejson', 'accounts-base'], ['client']);

  api.add_files([
    'lib/server/inject_data.html',
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
    'lib/client/log.js',
    'lib/client/fast_render.js',
    'lib/client/ddp_update.js',
    'lib/client/data_handler.js',
    'lib/client/auth.js'
  ], 'client');

  api.export('FastRender', ['client', 'server']);
  api.export('__init_fast_render', ['client']);
});
