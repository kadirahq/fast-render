Meteor.startup(function() {
  var fastRenderData = $('script[type="text/fast-render"]', document.head).text().trim();
  if(fastRenderData) {
    FastRender.init(fastRenderData);
  }
});