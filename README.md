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

except with modified `.get`, `.post`, `.put` and `.patch` functions.

If you already have an app variable you want to retrofit, you can also pass it in to `expressReturn` as the first argument, and it will modify it appropriately. For example:

```
const express = require('express');
const expressReturn = require('express-return').createApplication;
const app = express();
expressReturn(app);
```

You can also pass in as a second argument an array of which methods you want to be altered. For example, if you only want the `get` and `post` functions to be altered, you could do the following:

```
const express = require('express');
const expressReturn = require('express-return').createApplication;
const app = express();
expressReturn(app, ['get', 'post']);
```

## Usage
Once setup, you can return from your controllers an object that contains the properties `body` and/or `code`. If you return just a `body`, it will do `res.send(body)` which will cause the request to be finished and the data sent back. If you return just a `code`, it will do `res.status(code)`, and will not cause the request to be finished (this is an uncommon scenario). If you send back `code` and `body`, it will do `res.status(code)` first then do `res.send(body)`.

If nothing is returned, the wrapper code won't do anything. This means it's possible to send back data the traditional way (meaning this can be used as a drop in replacement for existing code).

In addition, other functions, such as setting headers through `res`, have not changed. So, for example, to set the content type, you could do:

```
app.get('/', function (req, res) {
  res.type('text/html');
  return {
    code: 200,
    body: `<b>Hello World</b>`,
  };
});
```

### Error Handling
If an exception is thrown or the returned promise is rejected, the wrapper code will pass the error into `next`, which will pass it into error handling middleware (if defined).
