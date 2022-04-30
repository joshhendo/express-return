import * as express from 'express';
import {createApplicationProxy} from "../lib/express-return";

describe.only('proxy test', function () {
  let app: express.Application;

  beforeEach(function () {
    app = createApplicationProxy();
  });

});
