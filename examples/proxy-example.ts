import {createApplicationProxy} from "../lib/express-return";
import * as express from 'express';

const app = createApplicationProxy();

const middleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`Request type:`, req.method);
  next();
}


app.get('/', middleware, function (req: express.Request, res: express.Response, next: express.NextFunction) {
  //res.send({ foo: 'bar' });

  // return {
  //   body: {
  //     boo: 'far'
  //   }
  // }

  throw new Error('test error');
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  // res.status(500).send('Something broke!')
  return {
    status: 500,
    body: 'something broke here!',
  }
})

app.listen(3000, function () {
  console.log(`Proxy example app listening on port 3000`);
})
