FastRender.completeSubscriptions = function(subscriptions) {
  if(typeof subscriptions == 'string') {
    subscriptions = [subscriptions];
  } else if(subscriptions.constructor != Array) {
    throw new Error('subscriptions params should be either a string or array of strings');
  }

  subscriptions.forEach(function(subscription) {
    __fast_render_config.subscriptions[subscription] = true;
  });
};

FastRender.enabled = typeof __fast_render_config != 'undefined';
FastRender.Log = Log;