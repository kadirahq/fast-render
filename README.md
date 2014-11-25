# Fast Render

Fast Render can improve the initial load time of your app and gives 2-10 times faster page loads. It gives identical result as Server Side Rendering(SSR), but still sending data over the wire without breaking one of the Meteor’s core principles.

Let's look at a demo. It is the leaderboard of the [BulletProof Meteor](https://bulletproofmeteor.com). It's written with Meteor and using Iron Router:

![a Meteor app Without Fast Render](https://cldup.com/rqjCCH7ftd.png)

You can see the loading screen before rendering the acutual leaderboard.

---

Now let's look at the fast render enabled leaderboard: [click here](https://bulletproofmeteor.com/leaderboard)

It has no loading time. Just after the page get loaded, leaderboard is there. In this case we've only added fast render to the app and add a single line of configuration.

## Usage

> **Attention**
> If you are new to fast render, I highly recommend to follow this [BulletProof Meteor lesson](https://bulletproofmeteor.com/basics/no-more-loading) which shows how to use fast render and show why it's needed.

Install fast render into your app.

~~~shell
meteor add meteorhacks:fast-render@2.0.0-rc7
~~~

Then make sure you've moved your Iron Router `router.js` file (or relavant files) to a place which can be access by both server and client. (i.e. `lib` folder).

Then add `fastRender: true` option to the route like below:

~~~js
this.route('leaderboard', {
  path: '/leaderboard',
  waitOn: function(){
    return Meteor.subscribe('leaderboard'); 
  },
  fastRender: true
});

~~~

That's only you've to do.

### How Fast Render Works

Fast render runs the above `waitOn` function on the server and get the subscription data relavant to `leaderboard` publication. Then it will send those data along with the initial HTML of the meteor app as shown below:

![Meteor Subscription Data with Initial HTML](https://cldup.com/RFgMhjv7qR.png)

Then fast render parse and loads that data into Meteor collections. So, your Meteor app code (Iron Router) thinks page has been loaded and it can render the page right away. 

If you want to learn more about [how Fast Render works](https://meteorhacks.com/fast-render-internals-and-how-it-works.html), refer this [article](https://meteorhacks.com/fast-render-internals-and-how-it-works.html).

## Using with Iron Router

You can use both Iron Router 0.9 and 1.0 with fast render. However, you need to follow some few rules.

#### 1. Place your routes in a place which can be seen by both server and client

Fast Render needs to read some of your route's function like `waitOn()` on the server. Therefore you make write your app's routes in a place which can seen by both server and the client.

> Meteor's `lib` directory is a best place to keep your routes.

#### 2. Add `fastRender:true` option.

You need to tell, which routes needs fast rendering or not. That's done by adding an option to your route with `fastRender:true` as shown below:

~~~js
this.route('leaderboard', {
  path: '/leaderboard/:date?',
  waitOn: function(){
    return Meteor.subscribe('leaderboard'); 
  },
  fastRender: true
});
~~~

#### 3. waitOn and subscriptions methods

Fast render runs your waitOn and [subscriptions](https://github.com/EventedMind/iron-router/blob/devel/Guide.md#the-subscriptions-option) method on the controller in side the server. So, make sure you are using `Meteor.subscribe` instead of `this.subscribe`.

> But, you can use [SubsManager](https://github.com/meteorhacks/subs-manager) inside these methods. SubsManager works with fast render.

Since these methods runs on the server, you can't have any client related code inside these functions. For an example, if you are using `Session` related logic inside a waitOn you need to make sure they are going to execute only in the client. This is how you can do it:

~~~js
waitOn: function() {
  var date = new Date();
  if(Meteor.isClient) {
    date = Session.get('selectedDate');
  }

  return Meteor.subscribe('leaderboard', date);
}
~~~

#### 4. Global Configurations

If you declare waitOn methods in the global level as shown below, fast render picks data for subscriptions defined inside those waitOn methods by default.

~~~js
Router.configure({
  waitOn: function() {
    return [
      Meteor.subscribe('courses')
    ]
  }
});
~~~

## Using without Iron Router

Sometimes, you might be doing some custom subscription handling and then fast render can't identify those subscriptions. This is also true when you are not using Iron Router.

In such cases, you need to map subscriptions manually to routes. It can be done with following apis:

> All these APIs are available in the server only.

#### FastRender.route(callback)

You can declare server side routes using an url pattern which compatible with Iron Router. The callback runs in a context very similar to Meteor and you can use any Meteor APIs inside it. (It runs on a Fiber)

Then inside that, you can subscribe to publications with `this.subscribe`.

Eg:-

~~~js
FastRender.route('/leaderboard/:date', function(params) {
  this.subscribe('leaderboard', params.date);
})
~~~

#### FastRender.onAllRoutes(callback)

You can register a callback which will runs on all routes. It's very similar to `FastRender.route` but runs on all routes.

~~~js
FastRender.onAllRoutes(function(path) {
  this.subscribe('currentUser');
})
~~~

## Security Measures

Fast render has the ability to detect the loggedIn user and get data related to him/her. It does this by sending the same loginToken used by the DDP connection over cookies.

This is not something bad, but this might cause some security issues. Those issues are described below with the possible counter measures. Fortunately, Fast Render has built-in measures to prevent some of them.

> These issues are raised by [Emily Stark](https://twitter.com/estark37) from the [meteor-core team](https://groups.google.com/forum/#!msg/meteor-talk/1Fg4rNk9JZM/ELX3672QsrEJ).

#### Side Effects

It is possible to send custom HTTP requests to one of the routes handled by fast render either as a XHR request or a direct HTTP request.

In this case, if you are doing some DB write operations or saving something to the filesystem, they'll be  get executed. This gets worst, if the HTTP request is a XHR request called by an evil user. He can’t read anything, but he can cause side effects.

So, it is wise to avoid side effects from following places:

* publications
* fastRender routes 
* IronRouter waitOn and subscriptions methods

### CORS headers

If one of your packages or your app adds [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) headers via connect handlers, there is a potential security issue.

So, Fast Render detects CORS headers with conflicting routes and turned off fast rendering for that routes.

It is okay to add CORS headers to custom server side routes, but if they conflict with the client side routes(which handled by Fast Render), then there is a security issue. This issue allows malicious XHR requests from other domains to access loggedIn user's subscription data.

### Do not Fast Render with shared domains

If your app is available under a shared domain like `*.meteor.com` or `*.herokuapp.com`, then you are exposed to a serious [security issue](https://groups.google.com/forum/#!topic/meteor-talk/Zhy1c6MdOH8). In those situations, don't use fast render.

If you are hosting your app under `*.meteor.com` or heroku but using a separate domain, then you are not vulnerable for this issue.

## Debugging

Sometimes, you need to test whether fast render is working or not. You can simply do with the built in debugger. This debugger works on the client side of your app and it's safe to run it on a deployed app as well. It exposes few functionalities:

### Block DDP

You can block the DDP connection and check whether fast rendering worked or not. Once blocked, none of the DDP messages will be accepted. To block, apply following command in the browser console:

~~~
FastRender.debugger.blockDDP()
~~~

You can unblock it back with:

~~~
FastRender.debugger.unblockDDP()
~~~

### Get Payload

With following command you can inspect the data comes with fast render:

~~~
FastRender.debugger.getPayload()
~~~

It will have a format like this:

~~~js
{
  // subscriptions processed
  subscriptions: {
    courses: true,
    leaderBoard: true
  },

  // data grouped by the collection name
  data: {
    courses: [
      [...],
    ],
    users: [
      [...]
    ]
  }
}
~~~

> You can apply `FastRender.debugger.getPayloadJSON()` to get the logs as a JSON string.

### Disable Fast Render

Likewise blocking DDP, you can disable fast render and see how things happening. To disable, apply following command:

~~~
FastRender.debugger.disableFR()
~~~

Apply `FastRender.debugger.enableFR()` to enable it back.

### Logs

Fast Render has a robust logging functionality. You can turn it on by invoking following command:

~~~
FastRender.debugger.showLogs()
~~~

You can hide logs again via `FastRender.debugger.hideLogs()`.

You can get all of the log messages with `FastRender.debugger.getLogs()` and `FastRender.debugger.getLogsJSON()`.
