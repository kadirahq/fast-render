Wait = function(server, timeout) {
  server.evalSync(function(timeout) {
    setTimeout(function() {
      emit('return');
    }, timeout)
  }, timeout);
};