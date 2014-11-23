Tinytest.add('FastRender - init - coll data ', function(test) {
  var expectedMessages = [
    {msg: 'added', collection: "posts", id: "one", fields: {name: "arunoda"}},
    {msg: 'added', collection: "posts", id: "two", fields: {name: "meteorhacks"}},
    {msg: 'added', collection: "comments", id: "one", fields: {text: "great"}}
  ];

  var payload = {
    subscriptions: {posts: true},
    data: {
      posts: [[
        {_id: "one", name: "arunoda"},
        {_id: "two", name: "meteorhacks"},
      ]],
      comments: [[
        {_id: "one", text: "great"}
      ]]
    }
  };

  var newMessages = [];

  WithNewInjectDdpMessage(function(conn, ddpMessage) {
    newMessages.push(ddpMessage);
  }, function() {
    payload = EncodeEJSON(payload);
    FastRender.init(payload);

    test.equal(newMessages, expectedMessages);
    test.equal(FastRender.subscriptions, payload.subscriptions);
  });
});

Tinytest.addAsync('FastRender - init - ObjectId support', function(test, done) {
  var id = new LocalCollection._ObjectID();
  console.log(id);
  var payload = {
    subscriptions: {posts: true},
    data: {
      posts: [[
        {_id: id, name: "arunoda"},
      ]]
    }
  };

  WithNewInjectDdpMessage(function(conn, ddpMessage) {
    test.equal(ddpMessage.id, id._str);
    done();
  }, function() {
    payload = EncodeEJSON(payload);
    FastRender.init(payload);
  });
});

WithNewInjectDdpMessage = function(newCallback, runCode) {
  var originalInjectDDP = FastRender.injectDdpMessage;
  FastRender.injectDdpMessage = newCallback;
  if(runCode) runCode();
  FastRender.injectDdpMessage = originalInjectDDP;
};