Tinytest.addAsync('FastRender - Routes - normal routes', function(test, done) {
  FastRender.route('/app', function(params, url) {
    done();
  });

  FastRender._processRoutes('/app');
});

Tinytest.addAsync('FastRender - Routes - getting params from routes', function(test, done) {
  FastRender.route('/app/:type', function(params, url) {
    test.equal(params.type, 'startup');
    done();
  });

  FastRender._processRoutes('/app/startup');
});

Tinytest.addAsync('FastRender - Routes - onAllRoutes', function(test, done) {
  FastRender.onAllRoutes(function() {
    done();
  });

  FastRender._processRoutes('/sdsdsds');
});