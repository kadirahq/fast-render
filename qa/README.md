QA for FastRender
=================

All these scenarios needs to be tests on both modes as shown below.

1. Local Mode - running locally
2. Server Mode - run in the server (*.meteor.com)

In order to prevent loading actual subscriptions, we can use a fake `DDP_DEFAULT_CONNECTION_URL`. This cannot use always, but should need to use otherwise mentioned.

## Scenarios

> Assume all mentioned apps have all the dependencies installed including fast-render. For the fast-render creating a symlink and add fast-render to `.meteor/packages` would work.

### Iron Router with RouteController

This scenario test the IronRouter support when using RouteController. Use [FastRender powered Telescope](https://github.com/arunoda/fast-render-telescope) Meteor application for this. Make sure to add some posts to it, otherwise we cannot see any difference.

* visit `/top` and see whether posts are getting rendered without loading

### Iron Router with fastRender:true

In this case, we are testing routes directly using `this.route` with waitOn. Again, we are using above mentioned Telescope.

* visit `/posts/:_id/edit` and see whether posts are getting rendered without loading 

### With loggedIn user support

Do any of the above Telescope's scenarios with the user loggedIn. Try with the same with logging out.

> try this scenario with unsetting `DDP_DEFAULT_CONNECTION_URL`

### CORS security issues

Visit `/best` and see fast-render is disabled. 

For more on the related story. check: http://goo.gl/eGwb4e
