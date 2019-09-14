# Express Return
Extend express.js and return data from your controllers

This is currently a pre-1.0 beta; test thoroughly before using in production, and please report any bugs you find!

## What is it?
This package is a wrapper for express.js that allows your controllers to `return` and send back a body and a status code to the caller. Basically, it means, instead of having to do this:

```
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

```
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

```
const expressReturn = require('express-return').createApplication;
const app = expressReturn();
```

The `app` variable here acts in the exact same way as if you did

```
const express = require('express');
const app = express();
```

except with modified `.get`, `.post`, `.put`, `.patch` and `.delete` functions.

If you already have an app variable you want to retrofit, you can also pass it in to `expressReturn` as the first argument, and it will modify it appropriately. For example:

```
const express = require('express');
const expressReturn = require('express-return').createApplication;
const app = express();
const appWithReturn = expressReturn(app);
```

In this case, you must use the `appWithReturn` object to be able to use the return functionality.

You can also pass in as a second argument an array of which methods you want to be altered. For example, if you only want the `get` and `post` functions to be altered, you could do the following:

```
const express = require('express');
const expressReturn = require('express-return').createApplication;
const app = express();
const appWithReturn = expressReturn(app, ['get', 'post']);
```

You can also pass in anything that implements the IRouter interface into `modifyRouter` like so:

```
const express = require('express');
const expressReturn = require('express-return').modifyRouter;
const router = express.Router();
const routerWithReturn = expressReturn(router, ['get', 'post']);
```

The 'withReturn' object is a wrapper around an application or router object. Whilst it wraps many of the common functions, it doesn't wrap everything, and isn't completely interchangeable. As such, it exposes a `.application` or `.router` property (as appropriate) with the underlying Express object. These objects can have `.get` and other verbs associated with them, but working with them directly does not allow for return functionality. 

## Usage
Once setup, you can return from your controllers an object that contains the properties `body` and/or `code`. If you return just a `body`, it will do `res.send(body)` which will cause the request to be finished and the data sent back. If you return just a `code`, it will do `res.status(code)` and trigger a `res.end()` to finish the request (for example, if you want to send back a `201 Created` without any body). If you send back `code` and `body`, it will do `res.status(code)` first then do `res.send(body)`.

If nothing is returned, the wrapper code won't do anything. This means it's possible to send back data the traditional way (meaning this can be used as a drop in replacement for existing code).

In addition, other functions, such as setting headers through `res`, have not changed. So, for example, to set the content type, you could do:

```
appWithReturn.get('/', function (req, res) {
  res.type('text/html');
  return {
    code: 200,
    body: `<b>Hello World</b>`,
  };
});
```

If using TypeScript, you can import the `HttpResponse` class and do `return new HttpResponse('Hello World', 200)`. Specifying a status code is optional and will default to 200 if not specified.

### Redirect

You can return a property `redirect`, which is a URL that will be passed into the `res.redirect`. If specifying `redirect`, you can optionally specify a status code. Redirect cannot be used with a body; if both are passed in, redirect takes precedence.

If using Typescript, you can import the `HttpRedirect` class and do `return new HttpResponse('http://google.com')'. The first parameter is the URL to redirect to, and the optional second parameter is a status code.`

### Status Code Only

You can specify just a status code without a body.

If using TypeScript, you can import the `HttpCode` class and do `return new HttpCode(404)`. Alternatively, you can use `HttpRespones`, passing in `null` as the first parameter: `return new HttpResponse(null, 404)`.

### Error Handling
If an exception is thrown or the returned promise is rejected, the wrapper code will pass the error into `next`, which will pass it into error handling middleware (if defined).
