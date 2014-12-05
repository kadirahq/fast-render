FastRender["debugger"] = {};
FastRender["debugger"]._logs = [];
FastRender["debugger"].log = function function_name(message/*, args..*/) {
  if(
    typeof console != 'undefined' &&
    typeof Meteor._localStorage != 'undefined' && 
    Meteor._localStorage.getItem('__frlog') == "1") 
  {
    FastRender["debugger"]._logs.push(arguments);
    arguments[0] = "FR: " + arguments[0];
    console.log.apply(console, arguments);
  }
}

FastRender["debugger"].showLogs = function() {
  Meteor._localStorage.setItem('__frlog', "1");
  location.reload();
};

FastRender["debugger"].hideLogs = function() {
  Meteor._localStorage.removeItem('__frlog');
  location.reload();
};

FastRender["debugger"].getLogs = function() {
  return FastRender["debugger"]._logs;
};

FastRender["debugger"].getLogsJSON = function() {
  return JSON.stringify(FastRender["debugger"]._logs);
};

FastRender["debugger"].blockDDP = function() {
  Meteor._localStorage.setItem('__frblockddp', "1");
  location.reload();
};

FastRender["debugger"].unblockDDP = function() {
  Meteor._localStorage.removeItem('__frblockddp');
  location.reload();
};

FastRender["debugger"].disableFR = function() {
  Meteor._localStorage.setItem('__frdisable', "1");
  location.reload();
};

FastRender["debugger"].enableFR = function() {
  Meteor._localStorage.removeItem('__frdisable');
  location.reload();
};

FastRender["debugger"].getPayload = function() {
  return FastRender._payload;
};

FastRender["debugger"].getPayloadJSON = function() {
  return JSON.stringify(FastRender._payload);
};
