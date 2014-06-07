if(typeof Meteor.user == 'function') {
  Deps.autorun(function() {
    var user = Meteor.user();
    var status = Meteor.status();

    //we don't need to clean cookies if we've not connected yet
    //this is very usefull when testing with connecting a bad ddp connection
    if(status.connected) {
      if(user) {
        var loginToken = Meteor._localStorage.getItem('Meteor.loginToken');
        var loginTokenExpires = Meteor._localStorage.getItem('Meteor.loginTokenExpires');

        Cookies.set('meteor_login_token', loginToken, {
          path: '/',
          expires: loginTokenExpires
        });
      } else {
        Cookies.expire('meteor_login_token');
      }
    }
  });
} else {
  //make sure cookie is deleted (if previously setted)
  Cookies.expire('meteor_login_token');
}
