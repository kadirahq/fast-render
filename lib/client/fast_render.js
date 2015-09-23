FastRender = {};
FastRender.enabled = typeof __fast_render_config != 'undefined';
FastRender._dataReceived = false;
FastRender._revertedBackToOriginal = false;
FastRender._blockDDP = Meteor._localStorage.getItem('__frblockddp') != undefined;
if(FastRender._blockDDP) {
  console.log("FastRender is blocking DDP messages. apply 'FastRender.debugger.unblockDDP()' to unblock again.");
}

FastRender._disable = Meteor._localStorage.getItem('__frdisable') != undefined;
if(FastRender._disable) {
  console.log("FastRender is disabled. apply 'FastRender.debugger.enableFR()' to enable it back.")
}

// This allow us to apply DDP message even if Meteor block accepting messages
//  When doing initial login, Meteor sends an login message
//  Then it'll block the accpeting DDP messages from server
//  This is the cure
FastRender.injectDdpMessage = function(conn, message) {
  FastRender["debugger"].log('injecting ddp message:', message);
  var originalWait = conn._waitingForQuiescence;
  conn._waitingForQuiescence = function() {return false};
  conn._livedata_data(message);
  conn._waitingForQuiescence = originalWait;
};

FastRender.init = function(payload) {
  if(FastRender._disable) return;

  FastRender._securityCheck(payload);

  FastRender._subscriptions = (payload && payload.subscriptions) || {};
  FastRender._subscriptionIdMap = {};
  FastRender._dataReceived = true;
  FastRender._payload = payload;

  // merging data from different subscriptions
  //  yes, this is a minimal mergeBox on the client
  var allData = {};
  if (payload) {
    _.each(payload.collectionData, function(subData, collName) {
      if(!allData[collName]) {
        allData[collName] = {};
      }
      collData = allData[collName];

      subData.forEach(function(dataSet) {
        dataSet.forEach(function(item) {
          if(!collData[item._id]) {
            collData[item._id] = item;
          } else {
            DeepExtend(collData[item._id], item);
          }
        });
      });
    });
  }

  _.each(allData, function(collData, collName) {
    _.each(collData, function(item, id) {
      var id = IDTools.idStringify(item._id);
      delete item._id;

      var ddpMessage = {
        msg: 'added',
        collection: collName,
        id: id,
        fields: item,
        frGen: true
      };

      FastRender.injectDdpMessage(Meteor.connection, ddpMessage);
    });
  });

  // let Meteor know, user login process has been completed
  if(typeof Accounts != 'undefined') {
    Accounts._setLoggingIn(false);
  }
};

FastRender._securityCheck = function(payload) {
  if(payload && payload.loginToken) {
    var localStorageLoginToken = Meteor._localStorage.getItem('Meteor.loginToken');
    if(localStorageLoginToken != payload.loginToken) {
      throw new Error("seems like cookie tossing is happening. visit here: http://git.io/q4IRHQ");
    }
  }
};