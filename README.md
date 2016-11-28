# Fast Render

Fast Render can improve the initial load time of your app, giving you 2-10 times faster initial page loads. It provides the same effect as Server Side Rendering (SSR), but still sends data over the wire to avoid breaking one of Meteor’s core principles.

#### This is a continuation of `meteorhacks:fast-render` by @arunoda

**Table of Contents**

  - [Demo](#demo)
  - [Usage](#usage)
  - [How Fast Render Works](#how-fast-render-works)
  - [Using Fast Render With Iron Router](#using-fast-render-with-iron-router)
  - [Using Fast Render's route APIs](#using-fast-renders-route-apis)
  - [Security](#security)
  - [Known Issues](#known-issues)
  - [Debugging](#debugging)
  - [Fast Render 2.x vs 1.x](#fast-render-2x-vs-1x)

## Demo

Let's look at a demo. Here is the leaderboard example from [BulletProof Meteor](https://bulletproofmeteor.com). It's written using Meteor and Iron Router:

![a Meteor app Without Fast Render](https://cldup.com/v4PmJqPtlY.png)

Here you see the loading screen while we wait on data to render the actual leaderboard.

---

Now let's see how the leaderboard loads when using Fast Render: [click here](https://bulletproofmeteor.com/leaderboard).

You never see the loading screen becuase we don't have to wait on data. Right after the page is loaded, the leaderboard is there. To do this, all we've done is add Fast Render to the app and insert a single line of configuration.

Check this demo [video](https://www.youtube.com/watch?v=mGcE6UVOqPk) if you need to see more what Fast Render can do.

## Usage

> **Attention**
> If you are new to Fast Render, I highly recommend you follow [this BulletProof Meteor lesson](https://bulletproofmeteor.com/basics/no-more-loading). It explains how to use Fast Render and why you might want to.

Add Fast Render to your Meteor app:

~~~shell
meteor add staringatlights:fast-render
~~~

After that, make sure you've moved your route related code (`router.js` file or relavant files) to a place which can be access by both server and client. (i.e. the `lib` folder).

**To add Fast Render support to FlowRouter, visit [here](https://github.com/kadirahq/flow-router#fast-render).**

Rest of the documentation is for apps utilizing Iron Router.

Then add the `fastRender: true` option to your route:

~~~js
this.route('leaderboard', {
  path: '/leaderboard/:date?',
  waitOn: function(){
    return Meteor.subscribe('leaderboard');
  },
  fastRender: true
});
~~~

## How Fast Render Works

Fast render runs the `waitOn` function (or one of the Fast Render API calls) on the server and gets the subscription data relavant to the page you are loading. Then it sends that data along with the initial HTML of the Meteor app as shown below:

![Meteor Subscription Data with Initial HTML](https://cldup.com/RFgMhjv7qR.png)

Then Fast Render parses and loads that data into Meteor collections. This makes your Meteor app code (Iron Router) think the data connection has been made, and it renders the page right away.

> If you want to learn more about how Fast Render works, refer to [this article](https://meteorhacks.com/fast-render-internals-and-how-it-works.html).

## Using Fast Render With Iron Router

Fast Render is compatible with both versions 0.9 and 1.0 of Iron Router. However, you'll need to follow a few rules.

#### 1. Place your routes in a place which can be seen by both server and client.

Fast Render needs to read some of your routes' functions like `waitOn()` on the server. Put your app's routes (`router.js` file or relavant files) in a place which can seen by both the server and the client.

> Meteor's `lib` directory is a best place to keep your routes.

#### 2. Add the `fastRender: true` option.

The next step is to specify which routes you'd like to apply Fast Render to. That's done by adding the `fastRender: true` option to a route as shown below:

~~~js
this.route('leaderboard', {
  path: '/leaderboard/:date?',
  waitOn: function(){
    return Meteor.subscribe('leaderboard');
  },
  fastRender: true
});
~~~

> You can also add `fastRender:true` option when extending `RouteController`. Then you don't need add `fastRender:true` option for individual routes.

#### 3. `waitOn` and `subscriptions` methods

Fast Render runs your waitOn and [subscriptions](https://github.com/EventedMind/iron-router/blob/devel/Guide.md#the-subscriptions-option) methods on the server. Make sure you're using `Meteor.subscribe` and not `this.subscribe`.

> SubsManager is compatible with Fast Render, so you can also use [SubsManager](https://github.com/meteorhacks/subs-manager) inside these methods.

Since these methods run on the server, you can't have any client related code inside these functions. For example, if you are using `Session` related logic inside a waitOn, you need to make sure that code will only be executed on the client. Here's how:

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

If you declare waitOn methods at the global level as shown below, then by default Fast Render will pick data for subscriptions defined inside those waitOn methods.

~~~js
Router.configure({
  waitOn: function() {
    return [
      Meteor.subscribe('courses')
    ]
  }
});
~~~

> This is [how](https://github.com/TelescopeJS/Telescope/pull/565/files?diff=split) Fast Render support has been added to Telescope. [See](https://github.com/TelescopeJS/Telescope/pull/565/files?diff=split) how easy it was.

## Using Fast Render's route APIs

If you're doing some custom subscription handling, Fast Render won't be able to identify those subscriptions. This is also true when you are not using Iron Router.

If you want to use Fast Render in these cases, you'll need to map subscriptions manually to routes. It can be done using the following APIs:

> The following APIs are available on the server only.

#### FastRender.route(callback)

This declares server side routes using a URL pattern similar to Iron Router's. The callback runs in a context very similar to Meteor and you can use any Meteor APIs inside it (it runs on a Fiber).  Inside, you can subscribe to publications using `this.subscribe`.

Use it like this:

~~~js
FastRender.route('/leaderboard/:date', function(params) {
  this.subscribe('leaderboard', params.date);
})
~~~

#### FastRender.onAllRoutes(callback)

This is very similar to `FastRender.route`, but lets you register a callback which will run on all routes.

Use it like this:

~~~js
FastRender.onAllRoutes(function(path) {
  this.subscribe('currentUser');
})
~~~

## Security

Fast Render has the ability to get data related to a user by detecting `loggedIn` status. It does this by sending the same loginToken used by the DDP connection using cookies.

This is not inherently bad, but this might potentially cause some security issues. Those issues are described below along with possible countermeasures. Fortunately, Fast Render has features to prevent some of them.

> These issues were raised by [Emily Stark](https://twitter.com/estark37) from the [meteor-core team](https://groups.google.com/forum/#!msg/meteor-talk/1Fg4rNk9JZM/ELX3672QsrEJ).

#### Side Effects

It is possible to send custom HTTP requests to routes handled by Fast Render either using an XHR request or a direct HTTP request.

So if you are doing some DB write operations or saving something to the filesystem, the code sent will be executed. this could be bad if the HTTP request is an XHR request called by a malicious user. They wouldn't be able read anything, but they could cause side effects.

It is wise to avoid side effects from following places:

* publications
* fastRender routes
* IronRouter waitOn and subscriptions methods

#### CORS Headers

If your app adds [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) headers via connect handlers, there is a potential security issue.

Fast Render detects CORS headers with conflicting routes and turns off fast rendering for those routes.

It's okay to add CORS headers to custom server side routes, but if they conflict with the client side routes (which are handled by Fast Render), then there will be a security issue. It would allow malicious XHR requests from other domains to access loggedIn user's subscription data.

#### Cookie Tossing

If your app is available under a shared domain like `*.meteor.com` or `*.herokuapp.com`, there is a potential [security issue](https://groups.google.com/forum/#!topic/meteor-talk/Zhy1c6MdOH8).

**We've made some [protection](https://groups.google.com/d/msg/meteor-talk/LTO2n5D1bxY/J5EnVpJo0rAJ) to this issue; so you can still use Fast Render.**

If you host your app under `*.meteor.com` etc. but use a separate domain, then your app will not be vulnerable in this way.

## Known Issues

### Client Error: "Server sent add for existing id"

If you are getting this issue, it seems like you are doing a database write operation inside a `Template.rendered` (Template.yourTemplate.rendered).

To get around with this issue, rather than invoking a DB operation with MiniMongo, try to invoke a method call.

Related Issue & Discussion: <https://github.com/meteorhacks/fast-render/issues/80>

### No data is injected when using "AppCache" package

Currently FastRender does not support simultaneous usage with [appcache package](https://atmospherejs.com/meteor/appcache)

Related Issue & Discussion: <https://github.com/kadirahq/fast-render/issues/136>

## Debugging

Sometimes, you need to test whether Fast Render is working or not. You can do this using the built-in debugger. The debugger works on the client and is safe to run it on a deployed app. It has a few useful features:

#### Block DDP

You can block the DDP connection and check whether the page was fast rendered or not. Once blocked, no DDP messages will be accepted. To block, apply following command in the browser console:

~~~
FastRender.debugger.blockDDP()
~~~

You can unblock it with:

~~~
FastRender.debugger.unblockDDP()
~~~

#### Get Payload

With the following command you can inspect the data that comes on a Fast Render page load:

~~~
FastRender.debugger.getPayload()
~~~

It will be in this format:

~~~js
{
  // subscriptions processed
  subscriptions: {
    courses: true,
    leaderBoard: true
  },

  // data grouped by collection name
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

> You can also apply `FastRender.debugger.getPayloadJSON()` to get the logs as a JSON string.

#### Disable Fast Render

You can also use a command to disable Fast Render:

~~~
FastRender.debugger.disableFR()
~~~

Re-enable it with:

~~~
FastRender.debugger.enableFR()
~~~

#### Logs

Fast Render has robust logging.

You can turn it on using `FastRender.debugger.showLogs()`.

Hide them again using `FastRender.debugger.hideLogs()`.

You can get all of the log messages by using `FastRender.debugger.getLogs()` and `FastRender.debugger.getLogsJSON()`.


## Fast Render 2.x vs 1.x

There is no much difference for you, but 2.x is deeply integrated to Meteor and it will have almost zero DDP related issues.

#### Iron Router

Fast Render 1.x used to work with almost all versions of Iron Router. But Fast Render 2.x only works with Iron Router version 0.9 and 1.x only.

Earlier, Fast Render comes with it's own Iron Router controller called `FastRender.RouteController`. You could use that to add Fast Render support to that RouteController.

Now, you've to set `fastRender:true` option in the route level and there is no `FastRender.RouteController`.

#### Unused APIs

Fast Render 1.x comes with a lot of additional APIs. Now [these](#using-fast-renders-route-apis) are the only API's comes with Fast Render.

* FastRender.route(<route-def>, <callback>)
* FastRender.onAllRoutes(<callback>)

#### Debugger

Fast Render 2.x comes with a its own debugger, which you can use to check whether Fast Render is working or not. It also has some handy tools.
