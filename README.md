# meteor-fast-render

FastRender is a small package that will make a huge impact on your Meteor App. It improves the loading time of your app and minimize the server load. It gives identical result as Server Side Rendering(SSR), but still sending data over the wire without breaking one of the Meteor's core principles.

## How _FastRender_ Works

FastRender simply sends the data which will be used to render the initial page with the HTML itself. So there is no loading process. Just after the HTML(with JS and CSS too) gets loaded, page will be rendered on the screen. No need to wait until connecting to the server and receiving data.

Although page gets rendered, your actual subscription will be send to the server and it will send realtime updates as usual. You can also change this behavior with [`this.forgetSubscriptions`](#thisforgetsubscriptionssubscriptionlist) API.

## Demo

I've added FastRender [support](https://github.com/arunoda/fast-render-telescope/blob/master/server/fastRender.js) to [Telescope](http://telesc.pe/) and you see how fast Telescope with FastRender. Both of the apps are hosted on meteor.com.

* [Normal Telescope](http://oridinary-telescope.meteor.com/)
* [FastRender Powered Telescope](http://fast-render-telescope.meteor.com/)

## Example 

Let's say you've a blog powered by Meteor. It's URL format looks like `/post/:_id`. Here's a actual URL for one of your blog post: <http://myblog.com/post/meteor-rocks> 

Once you visit that page, you need to wait a bit until connecting to the server and get the data. Which seems like an unnecessary work and you could loose some potential readers as well. So here's how FastRender can help you out.

**Install FastRender**

Since, still we've not released, you need to install FastRender from git. Add following to your [`smart.json`](https://github.com/arunoda/fast-render-telescope/blob/master/smart.json#L12-L14) or clone the project into the packages directory.

~~~js
"fast-render": {
  "git": "git://github.com/arunoda/meteor-fast-render.git"
}
~~~

**Add following code to your app**

~~~js
if(Meteor.isServer) {
  FastRender.route('/blog/:_id', function(params) {
    //assumes 'blogPost' is the publication which sends the given blog post
    this.subscribe('blogPost', params._id);
  })
}
~~~

Now your blog post rendered very fast and no need to wait anymore.

__*Fast Render*__ works with any Meteor app. Just add it and create some routes; it just works.

## Concept

The concept behind FastRender is very simple -- Just send the data which needs to render the initial page.

So the user can see the page, without need to load anything. In the background other subscriptions may load some other data.

Keep in mind that you are sending bunch of data with the initial HTML, if you send too much of data, your page(initial HTML) will load slowly. That's not good.

## Iron Router Support

If you are using IronRouter [`waitOn`](https://github.com/EventedMind/iron-router#waiting-on-subscriptions-waiton) or [`wait`](https://github.com/EventedMind/iron-router#waiting-on-subscriptions-wait) functionality, consider these recommendations.

IronRouter waits on all the subscriptions defined with `waitOn` or `wait` before rendering the page. Even if you have the data locally (with FastRender), it waits until subscriptions are completed. There are two options, you can used to avoid this behaviour.

### Option 1: Use this.subscribe

Let's say you've a route on `/blog/:slug`. In the IronRouter you are using `waitOn` with subscriptions `blogPost` and `blogAuthor`. So, in this case you need to subscribe to both of these subscriptions with FastRender as shown below.

~~~js
FastRender.route('/blog/:slug', function(params) {
  this.subscribe('blogPost', params.slug);
  this.subscribe('blogAuthor', params.slug);
})
~~~

If your `blogAuthor` subscription accepts the `_id` of the author instead of the `slug`. You can use something like following:

~~~js
FastRender.route('/blog/:slug', function(params) {
  this.subscribe('blogPost', params.slug);

  //assuming, PostCollection is the Meteor Collection for your blog posts
  var authorId = PostCollection.findOne({slug: params.slug}).authorId;
  this.subscribe('blogAuthor', authorId);
})
~~~

### Option 2: Use this.completeSubscriptions()

Let's say your IronRouter route `/blog/:slug` is waiting on `blog` and `authors` subscriptions. This case you are loading all the blogs and authors in to the page. If you've few number of blogs and authors this is not bad. But it is not good to load all these data with FastRender. 

Now, you can load the only the current blog post and trick IronRouter with saying subscription is completed even before it completed. You can try something like below:

~~~js
FastRender.route('/blog/:slug', function(params) {
  //assuming, PostCollection is the Meteor Collection for your blog posts
  this.find(PostCollection, {slug: params.slug});
  //now we are forcling Meteor client to say it has successfully loaded the blog subscription
  this.completeSubscriptions(['blog']);

  //there are only few authors, loading all of them is not a bad idea
  this.subscribe('authors');
})
~~~

> `this.completeSubscriptions()` can also be used without IronRouter. It might help if you've implemented some custom loading indicator.

## API

FastRender comes with a lot goodies, those are shown here with examples.

* [FastRender.route(urlPattern, callback)](#fastrenderrouteurlpattern-callback)
* [this.subscribe(name, [arg1, arg2, ...])](#thissubscribename-arg1-arg2-)
* [this.find(collectionName, query, options)](#thisfindcollectionname-query-options)
* [this.completeSubscriptions(subscriptionList)](#thiscompletesubscriptionssubscriptionlist)
* [this.userId](#thisuserid)
* [this.forgetSubscriptions(subscriptionList)](#thisforgetsubscriptionssubscriptionlist)
* [FastRender.onAllRoutes(callback)](#fastrenderonallroutescallback)

## FastRender.route(urlPattern, callback)

This is the core of FastRender, which pick your pages on the server and allow to send the data to the client. `urlPattern` is compatible with [ExpressJS](http://expressjs.com/api.html#app.VERB) and [IronRouter](https://github.com/EventedMind/iron-router#dynamic-path-segments).

`callback` runs in a context very similar to Meteor and you can use any Meteor APIs inside it. (It runs on a Fiber)

`callback` comes with an object which has the values for keys defined on the URL.

Eg:-

~~~js
FastRender.route('/post/:_id', function(params) {
  console.log(params);
})
~~~

When you access a page on <http://localhost:3000/post/meteor-rocks> following will be shown on the console.

~~~shell
{_id: "meteor-rocks"}
~~~

## this.subscribe(name, [arg1, arg2, ...])

This API is very similar to [`Meteor.subscribe`](http://docs.meteor.com/#meteor_subscribe). This will load the initial dataSet provided by `name` publication with given args. This **does not** make an active subscription on the server.

Eg:-

~~~js
FastRender.route('/post/:_id', function(params) {
  this.subscribe('blogPost', params._id);
})
~~~

Once you visit to <http://localhost:3000/post/meteor-rocks>, FastRender calls the your publication `blogPost` with arguments `params._id` and get the initial set of data provided by it. And those data will be embedded directly on the initial HTML page served by Meteor. 

Once the pages loaded, FastRender client utilities will take care of rendering it correctly.

## this.find(collectionName, query, options)

`this.subscribe` is not the only way you can send the data to the server, it is possible to manually select what your page requires and send it to the client. You can use this api for that.

`collectionName` could be either a name of the actual collection on the database or a Meteor's collection object.

Eg:-

~~~js
FastRender.route('/post/:_id', function(params) {
  //send the blog post
  this.find('posts', {_id: params._id}, {fields: {body: 1}});
  
  //send comments
  this.find(Comments, {post: params._id}, {limit: 10});
})
~~~

## this.completeSubscriptions(subscriptionList)

This api will cheat the Meteor client and say the subscription is completed. This will be useful, if you are showing some loading state(possibly with IronRouter waitOn) on the client until the subscription is completed. 

In those, cases even if the data is available on the client, you can't render them on the screen. This api helps to tackle that. `this.subscribe` internally does this for you.

`subscriptionList` accepts an array of names or a single name.


Eg:-

~~~js
FastRender.route('/post/:_id', function(params) {
  //send the blog post
  this.find('posts', {_id: params._id}, {fields: {body: 1}});
  this.completeSubscriptions(['blogPost']);
})
~~~

## this.userId

This is very useful, if your app requires authentication. FastRender works with those scenarios and it knows the loggedIn user inside `FastRender.route`. You can get the userId of loggedIn user with `this.userId`.

FastRender does this with sending the loginToken with cookies. The cookie will be set on the client. So, in order to take the use of this API, your client needs to be loaded once on the user's browser.

> This API is available on both `FastRender.route` callback and the Meteor publications(with `this.subscribe`) too.

## this.forgetSubscriptions(subscriptionList)

This is a very handy API which, saves a lot resources from your server. This will take a subscription list (previously defined with `this.subscribe` or `this.completeSubscriptions`) and block them from sending to the server just after `this.completeSubscriptions` does its job on the client.

This is not suitable for all scenarios, but works well for blogs and other content which does not needs realtime changes.

**subscriptionList** accepts an array of names or a single name.

Eg:-

~~~js
FastRender.route('/blog/:_id', function(params) {
  this.subscribe('blogPost', params._id);
  this.forgetSubscriptions(['blogPost']);
})
~~~

## FastRender.onAllRoutes(callback)

You can register a callback(or many callbacks) which will runs on all routes. All you can do with `FastRender.route` is available for here as well.

`callback` will be called with the **URL Path** as the first argument.

Eg:-

picked from Telescope's fastRender [configuration](https://github.com/arunoda/fast-render-telescope/blob/master/server/fastRender.js#L1-L3)

~~~js
FastRender.onAllRoutes(function(path) {
  this.subscribe('currentUser');
})
~~~


