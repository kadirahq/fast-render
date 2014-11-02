FastRender = {};
FastRender.enabled = typeof __fast_render_config != 'undefined';
FastRender.Log = Log;

// This allow us to apply DDP message even if Meteor block accepting messages
//  When doing initial login, Meteor sends an login message
//  Then it'll block the accpeting DDP messages from server
//  This is the cure
FastRender.injectDdpMessage = function(conn, message) {
  var originalWait = conn._waitingForQuiescence;
  conn._waitingForQuiescence = function() {return false};
  conn._livedata_data(message);
  conn._waitingForQuiescence = originalWait;
};