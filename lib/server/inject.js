//When a HTTP Request comes, we need to figure out is it a proper request
//then get some query data
//then hijack html return by meteor
//code below, does that in abstract way

var http = Npm.require('http');

var injectDataTemplate;
Assets.getText('lib/server/inject_data.html', function(err, text) {
  if(err) {
    console.error('Error reading fast-render inject_data.html: ', err.message);
  } else {
    injectDataTemplate = _.template(text.trim());
  }
});

var originalWrite = http.OutgoingMessage.prototype.write;
http.OutgoingMessage.prototype.write = function(chunk, encoding) {
  //prevent hijacking other http requests
  if(this.queryData && !this.injected &&
    encoding === undefined && /<!DOCTYPE html>/.test(chunk)) {

    //if cors headers included if may cause some security holes. see more:
    //so we simply turn off fast-render if we detect an cors header
    //read more: http://goo.gl/eGwb4e
    if(this._headers['access-control-allow-origin']) {
      var warnMessage =
        'warn: fast-render turned off due to CORS headers. read more: http://goo.gl/eGwb4e';
      console.warn(warnMessage);
      originalWrite.call(this, chunk, encoding);
      return;
    }

    //inject data
    if(injectDataTemplate) {
      var payload = {
        subscriptions: this.queryData.subscriptions,
        data: this.queryData.collectionData,
        loginToken: this.queryData.loginToken
      }
      var data = EncodeEJSON(payload);
      var injectHtml = injectDataTemplate({data: data});
      chunk = chunk.replace('</head>', injectHtml + '\n</head>');
    } else {
      console.warn('injectDataTemplate is not ready yet!');
    }

    this.injected = true;
  }

  originalWrite.call(this, chunk, encoding);
};