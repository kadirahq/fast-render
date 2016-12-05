var fs = Npm.require('fs');
var path = Npm.require('path');

Package.describe({
  "summary": "Render your app before the DDP connection even comes alive - magic?",
  "version": "2.16.3",
  "git": "https://github.com/abecks/meteor-fast-render",
  "name": "staringatlights:fast-render"
});

Npm.depends({
  "connect": "2.13.0"
});

Package.onUse(function(api) {
  configure(api);
  api.export('FastRender', ['client', 'server']);
  api.export('__init_fast_render', ['client']);
});

Package.onTest(function(api) {
  configure(api);
  api.use('tinytest', ['client', 'server']);
  api.use('http', 'server');
  api.use('random', ['server', 'client']);
  api.use('mongo', ['server', 'client']);

  api.addFiles([
    'tests/utils.js'
  ], ['client', 'server']);

  api.addFiles([
    'tests/client/fast_render.js',
    'tests/client/ddp_update.js'
  ], 'client');

  api.addFiles([
    'tests/server/context.js',
    'tests/server/integration.js'
  ], 'server');
});

function configure (api) {
  api.versionsFrom('METEOR@0.9.3');
  api.use('staringatlights:inject-data@2.0.5', ['client', 'server']);
  api.use('iron:router@0.9.0 || 1.0.0', ['client', 'server'], {weak: true});
  api.use('chuangbo:cookie@1.1.0', 'client');
  api.use('meteorhacks:picker@1.0.3', 'server');
  api.use('meteorhacks:meteorx@1.4.1', 'server');

  api.use(['minimongo', 'livedata', 'ejson', 'underscore', 'webapp', 'routepolicy', 'accounts-base', 'random'], ['server']);
  api.use(['minimongo', 'underscore', 'deps', 'ejson', 'accounts-base'], ['client']);


  api.addFiles([
    'lib/utils.js'
  ], ['client', 'server']);

  api.addFiles([
    'lib/server/namespace.js',
    'lib/server/utils.js',
    'lib/server/routes.js',
    'lib/server/publish_context.js',
    'lib/server/context.js',
    'lib/server/iron_router_support.js',
  ], 'server');

  api.addFiles([
    'lib/client/id_tools.js',
    'lib/client/fast_render.js',
    'lib/client/debugger.js',
    'lib/client/ddp_update.js',
    'lib/client/auth.js',
    'lib/client/boot.js'
  ], 'client');

}
