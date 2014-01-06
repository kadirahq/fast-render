QA for FastRender
=================

All these scenarios needs to be tests on both modes as shown below.

1. Local Mode - running locally
2. Server Mode - run in the server (*.meteor.com)

In order to prevent loading actual subscriptions, we can use a fake `DDP_DEFAULT_CONNECTION_URL`. This cannot use always, but should need to use otherwise mentioned.

## Scenarios

> Assume all mentioned apps have all the dependencies installed including fast-render. For the fast-render creating a symlink and add fast-render to `.meteor/packages` would work.

### Iron Router with RouteController

This scenario test the IronRouter support when using RouteController. Use Telescope Meteor application for this. Make sure to add some posts to it, otherwise we cannot see any difference.

* bring `/client/helpers/routes.js` to `/routes.js`
* First extend with `FastRender.RouteController` instead `RouteController`
* visit `/top` and see whether posts are getting rendered without loading

### Iron Router with fastRender:true

In this case, we are testing routes directly using `this.route` with waitOn. Again, we are using Telescope.

* bring `/client/helpers/routes.js` to `/routes.js`
* Find such a route described above
* add additional option as `fastRender:true`
* visit that route and see whether posts are getting rendered without loading

### Iron Router used in a package

In this case, we are testing a how FastRender works with IronRouter installed as a package but not a direct dependency to the meteor app. [`blog`](https://atmosphere.meteor.com/package/blog) smart package is a good example for it.

* create a meteor package and setup `blog` as with the given instructions: http://github.differential.io/meteor-blog/
* add FR support to the blog package (with `fastRender: true`)
* visit that route and see whether posts are getting loaded without loading

