import * as express from 'express';
import { createApplication, HttpResponse } from '../index';
import * as bodyParser from 'body-parser';

const app = createApplication();
const jsonParser = bodyParser.json();

app.get('/', function (req: express.Request, res: express.Response) {
  // You can, and should, still set things via accessing `res`, such as content type and headers
  // Currently, returning can only set the body and code
  res.type('text/html');

  return { body: `Try POSTing some json to '/post-something'.` };
});

app.post('/post-something', jsonParser, function (req) {
  if (!req.body || JSON.stringify(req.body) == '{}') {
    return { body: `You POSTed invalid or empty JSON!` };
  }
  return { body: `You posted up: ${JSON.stringify(req.body)}` };
});

app.listen(3002, function () {
  console.log('Example app listening on port 3002');
});
