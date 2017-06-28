# Change Log

### v2.16.1

* Fix a regression in Meteor v1.5 causing fast-render to break Meteor accounts
  login/logout functionality
* Skip fast-render payload loading, if subscriptions already ready - Fixes #12
  ("Expected not to find a document already present for an add" error)

### v2.15.0 - v2.16.0

LOG MISSING

### v2.14.0

* Add support for Meteor 1.3.2 with buffered DDP. See [PR167](https://github.com/kadirahq/fast-render/pull/167)

### v2.13.0

* Use a real subscription as the Publication context. See [PR160](https://github.com/kadirahq/fast-render/pull/160).

### v2.12.0
* Use inject-data's 2.0 API.

### v2.11.0
* Refactor the way how context process data. With this, we can fix [this](https://github.com/kadirahq/flow-router/issues/431) FlowRouter SSR issue.

### v2.10.0

* Throw an exception, when a route start without "/". See: [#135](https://github.com/meteorhacks/fast-render/pull/135)

### v2.9.0
* Add support for Meteor 1.2

### v2.8.1
* Fix some integration tests

### v2.8.0
* Add more internal APIs to support SSR

### v2.5.1
* Add some updates to DeepCopy function

### v2.5.0

* Add IE8 Support
