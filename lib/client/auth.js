if (Meteor._localStorage.setItem == window.localStorage.setItem) {
  // In Meteor v1.5.0, unlike previous versions, Meteor._localStorage is a
  // direct reference to window.localStorage.
  //
  // IE11 (earlier IE versions weren't checked) doesn't handle attempts to
  // replace methods of window.localStorage with different functions properly.
  // Such attempt will result in the String of the function we try to set
  // saved as the function, destroying the ability to use this function.
  //
  // I couldn't find a way to tell in advance whether an attempt to set window.localStorage
  // will result in correct function write or not (I intentionally avoid browser
  // version detection, which is considered a bad practice). If such attempt will fail
  // we won't have a way to restore the original function.
  //
  // Note 1, the situation is even worse than that. If for exapmle we'll try to set
  // window.localStorage.setItem = function () {} the String value 'function () {}'
  // will be saved instead of the function - not only for the current session, but
  // as part of the localStorage (!) meaning that we'll have to ask users affected by
  // this bug to clear the cache to fix the situation.
  //
  // Note 2, the following won't work:
  //
  //   Meteor._localStorage = window.localStorage // Just to make example clear.
  //   originalSetItem = Meteor._localStorage.setItem
  //   Meteor._localStorage.setItem = function () {}
  //   Meteor._localStorage.setItem = originalSetItem
  //
  //   typeof Meteor._localStorage.setItem -> string
  //
  // I therefore decided to bring back the original pre-Meteor v1.5.0 code of
  // Meteor._localStorage below which isn't a reference to window.localStorage

  Meteor._localStorage = {
    getItem: function (key) {
      return window.localStorage.getItem(key);
    },
    setItem: function (key, value) {
      window.localStorage.setItem(key, value);
    },
    removeItem: function (key) {
      window.localStorage.removeItem(key);
    }
  };
}

// getting tokens for the first time
//  Meteor calls Meteor._localStorage.setItem() on the boot
//  But we can do it ourselves also with this
Meteor.startup(function() {
  resetToken();
});

// override Meteor._localStorage methods and resetToken accordingly
var originalSetItem = Meteor._localStorage.setItem;
Meteor._localStorage.setItem = function(key, value) {
  if(key == 'Meteor.loginToken') {
    Meteor.defer(resetToken);
  }
  originalSetItem.call(Meteor._localStorage, key, value);
};

var originalRemoveItem = Meteor._localStorage.removeItem;
Meteor._localStorage.removeItem = function(key) {
  if(key == 'Meteor.loginToken') {
    Meteor.defer(resetToken);
  }
  originalRemoveItem.call(Meteor._localStorage, key);
}

function resetToken() {
  var loginToken = Meteor._localStorage.getItem('Meteor.loginToken');
  var loginTokenExpires = new Date(Meteor._localStorage.getItem('Meteor.loginTokenExpires'));

  if(loginToken) {
    setToken(loginToken, loginTokenExpires);
  } else {
    setToken(null, -1);
  }
}

function setToken(loginToken, expires) {
  Cookie.set('meteor_login_token', loginToken, {
    path: '/',
    expires: expires
  });
}