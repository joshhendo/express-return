import * as express from 'express';
import {createApplication, HttpResponse} from '../index';

const app = createApplication();

// Some basic endpoints
app.get('/', function (req: express.Request, res: express.Response) {
  // You can, and should, still set things via accessing `res`, such as content type and headers
  // Currently, returning can only set the body and code
  res.type('text/html');

  return new HttpResponse(`
Try out one of the sample endpoints: <br />
<ul>
    <li><a href="/no-promise">/no-promise</a></li>
    <li><a href="/no-promise/error">/no-promise/error</a></li>
    <li><a href="/promise">/promise</a></li>
    <li><a href="/promise/error">/promise/error</a></li>
    <li><a href="/promise/reject">/promise/reject</a></li>
</ul>
    `);
});

app.get('/no-promise', function (req: express.Request) {
  return new HttpResponse('no promise!', 400);
});

app.get('/no-promise/error', function (req: express.Request) {
  throw new Error('error here!');
});

app.get('/promise', function (req: express.Request) {
  return Promise.resolve()
    .then(() => new HttpResponse('hello world 222', 404));
});

app.get('/promise/error', function (req: express.Request) {
  return Promise.resolve()
    .then(() => {
      throw new Error('error here');
    });
});

app.get('/promise/reject', function (req: express.Request) {
  return Promise.resolve()
    .then(() => Promise.reject('rejected promise'));
});

app.get('/just/code', function () {
  return Promise.resolve({code: 201});
});

// Error handler
app.use(function (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  console.error(err.stack);
  res.status(500).send(err.message || err);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000');
});
