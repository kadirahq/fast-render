if(typeof Meteor.user == 'function') {
  Tracker.autorun(function() {
    var user = Meteor.user();
    var status = Meteor.status();

    //we don't need to clean cookie if we've not connected yet
    //this is very usefull when testing with connecting a bad ddp connection
    if(status.connected) {
      if(user) {
        var loginToken = Meteor._localStorage.getItem('Meteor.loginToken');
        var loginTokenExpires = new Date(Meteor._localStorage.getItem('Meteor.loginTokenExpires'));

        Cookie.set('meteor_login_token', loginToken, {
          path: '/',
          expires: loginTokenExpires
        });
      } else {
        Cookie.set('meteor_login_token', loginToken, {
          path: '/',
          expires: -1
        });
      }
    }
  });
} else {
  //make sure cookie is deleted (if previously setted)
  Cookie.set('meteor_login_token', loginToken, {
    path: '/',
    expires: -1
  });
}
