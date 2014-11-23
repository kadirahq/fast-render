Tinytest.add('FastRender - init ', function(test) {
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

  var originalInjectDDP = FastRender.injectDdpMessage;
  FastRender.injectDdpMessage = function(conn, ddpMessage) {
    newMessages.push(ddpMessage);
  };
  payload = EncodeEJSON(payload);
  FastRender.init(payload);
  FastRender.injectDdpMessage = originalInjectDDP;

  test.equal(newMessages, expectedMessages);
  test.equal(FastRender.subscriptions, payload.subscriptions);
});