Log = function function_name(message/*, args..*/) {
  if(
    typeof console != 'undefined' &&
    typeof localStorage != 'undefined' && 
    localStorage.getItem('__frlog') == "1") {
    arguments[0] = arguments[0] + ":";
    console.log.apply(console, arguments);
  }
}

Log.enable = function() {
  localStorage.setItem('__frlog', "1");
};

Log.disable = function() {
  localStorage.removeItem('__frlog');
};