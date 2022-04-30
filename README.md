# Express Return
Extend express.js and return data from your controllers

This is currently a pre-1.0 beta; test thoroughly before using in production, and please report any bugs you find!

## New in 0.2.0

This is a major update, with some big changes:

  * Under the hood it's now using the `Proxy` funciton to intercept calls. This is a much cleaner way of implementing this. Previously the code was re-implementing a lot of the router handling.
  * Due to this, there's no more wrapper function. This means that there's no `app.application` to allow access to the original application object, because there isn't any original application object anymore!
  * Got rid of classes for the type definitions. `HttpResponse`, `HttpRedirect` and `HttpCode` are all now defined as TypeScript interfaces. See more information below.
  * Got rid of the `modifyRouter` function, since it's duplication functionality provided by `createRouter`

## What is it?
This package is a wrapper for express.js that allows your controllers to `return` and send back a body and a status code to the caller. Basically, it means, instead of having to do this:

```javascript
app.get('/example', function (req, res, next) {
  Promise.resolve()
    .then(function () {
      res.status(404);
      res.send('Not Found Example');
    })
    .catch(next);
});
```

into this

```javascript
app.get('/example', function (req) {
  return Promise.resolve()
    .then(function () {
      return {code: 404, body: 'Not Found Example'};
    });
});
```

## Why?
There were two main motivating factors for this implementation. Firstly, it is more natural for many developers coming from other environments, such as ASP.NET, and simplifies many usage scenarios (for example, not having to do `.catch(next)` on promise chains).

However, a larger motivating factor is the ease of testing. For example, setting up a unit or integration test, if just testing the response code and body, you can simply wait for the response to be returned and easily perform assertions as needed.

## Setup
Basic usage is as follows:

```javascript
const expressReturn = require('express-return');
const app = expressReturn.createApplication();
```

The `app` variable here acts in the exact same way as if you did

```javascript
const express = require('express');
const app = express();
```

except with modified `.get`, `.post`, `.put`, `.patch`, `.delete` and `.use` functions.

If you already have an app variable you want to retrofit, you can also pass it in to `expressReturn` as the first argument, and it will modify it appropriately. For example:

```javascript
const express = require('express');
const expressReturn = require('express-return');
const app = express();
const appWithReturn = expressReturn.createApplication(app);
```

In this case, you must use the `appWithReturn` object to be able to use the return functionality.

You can also pass in as a second argument an array of which methods you want to be altered. For example, if you only want the `get` and `post` functions to be altered, you could do the following:

```javascript
const express = require('express');
const expressReturn = require('express-return');
const app = express();
const appWithReturn = expressReturn.createApplication(app, ['get', 'post']);
```

Be mindful when specifying your own list of functions to use. For example, leaving out the `.use` will mean any error handling middleware that's defined using a `.use` statement won't have express-return enabled on it.

You can also create and retrofit routers using the `createRouter` function. If you want to create a new router, use:

```javascript
const express = requre('express');
const expressReturn = require('express-return');
const app = express();
const router = expressReturn.createRouter();
app.use('/', router);
```

Similarly, you can pass in an existing router:

```javascript
const express = require('express');
const expressReturn = require('express-return');
const app = express();
const router = express.router();
const routerWithReturn = expressReturn.createRouter(router);
```

**Note that you must have created or retrofitted with express-return all application and router objects.** It's possible to create just the application object with express-return and add in a normal router object. In this instance, the router object won't be able to return values from controllers.

## Usage

If nothing is returned, the express-return won't do anything. This means it's possible to send back data the traditional way (meaning this can be used as a drop in replacement for existing code).

In addition, other functions that you can do via `res`, have not changed. So, for example, to set the content type, you could do:

```javascript
appWithReturn.get('/', function (req, res) {
  res.type('text/html');
  return {
    code: 200,
    body: `<b>Hello World</b>`,
  };
});
```

What you shouldn't do is do something that would cause a `send` to happen twice. For example, it would seem counterintuitive to do the following:

```javascript
appWithReturn.get('/', function (req, res) {
  const body = { foo: 'bar' };
  res.send(body);
  return {
    body
  };
});
```

Each section below outlines what is being done under the hood for each kind of return that can be done, to help avoid doing something twice. It should be fairly self intuitive for the most part (if you're specifying something in your return object, such as `code`, then you don't need to specify it anywhere else)

### Return a Body

Once setup, you can return from your controllers an object that contains the property `body`, and optionally the property `code`. If you return just a `body`, it will do `res.send(body)` which will cause the request to be finished and the data sent back. 

Under the hood this is doing:

```javascript
res.send(body);
```

If you specify a code as well, under the hood it will do:

```javascript
res.status(code);
res.send(body);
```

In Typescript there is an interface called `HttpResponse` that can be used to enforce proper typing.

### Redirect

You can return a property `redirect`, which is a URL that will be passed into the `res.redirect`. If specifying `redirect`, you can optionally specify a status code. Redirect cannot be used with a body; if both are passed in, redirect takes precedence.

To do a redirect, return an object with the property `redirect_url` and optionally with the property `code`. For example:

```javascript
return {
  redirect_url: 'https://google.com',
}
```

will trigger a redirect.

Under the hood this is doing:
```javascript
res.redirect(redirect_url);
```

There are different types of redirects that can be done. If no code is defined, it uses the express default of `302 Found`. If you want to use another redirect type, such as `301 Moved Permanently` you can do:

```javascript
return {
  redirect_url: 'https://google.com',
  code: 301,
}
```

Under the hood this is doing:
```javascript
res.redirect(code, redirect_url);
```

In Typescript there is an interface called `HttpRedirect` that can be used to enforce proper typing.

### Status Code Only

You can specify just a status code without a body. For example, if you wanted to return a 404, you could do:

```javascript
return {
  code: 404,
}
```

Under the hood, this will do:

```javascript
res.status(code);
res.end();
```

In Typescript there is an interface called `HttpCode` that can be used to enforce proper typing.

### Error Handling
If an exception is thrown or the returned promise is rejected, the wrapper code will pass the error into `next`, which will pass it into the error handling middleware if it is defined.

You can also use express-return from error handling middleware.
