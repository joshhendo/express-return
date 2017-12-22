import * as express from 'express';
import * as ExpressReturn from '../lib/express-return';
import {HttpResponse} from '../index';
import * as supertest from 'supertest';
import {expect} from 'chai';
const memwatch = require('memwatch-next');

// There are long tests, which rely on an optional dependency
// Unskip them to run
describe.skip('memory-leak-test', function() {
  it('check app level memory leak', async function () {
    this.timeout(500000);
    const app = ExpressReturn.createApplication();

    const controller = function() {
      return new HttpResponse('test');
    };

    app.get('/test', controller);

    let numberOfStats = 0;
    let numberOfLeaks = 0;

    memwatch.on('leak', function(info: any) {
      console.log(`leak: ${JSON.stringify(info)}`);
      numberOfLeaks++;
    });

    memwatch.on('stats', function(stats: any) {
      console.log(`stat: ${JSON.stringify(stats)}`);
      numberOfStats++;
    });

    while (numberOfStats < 22) {
      // console.log(`stats: ${numberOfStats}\tleaks: ${numberOfLeaks}`);
      await supertest(app)
        .get('/test')
        .expect(200)
        .then(response => {
          expect(response.text).to.equal('test');
        });
    }

    expect(numberOfLeaks).to.equal(0);
  });

  it('check router level memory leak', async function () {
    this.timeout(500000);
    const app = express();
    const router = express.Router();
    ExpressReturn.modifyRouter(router);

    const controller = function () {
      return new HttpResponse('test');
    };

    router.get('/test', controller);

    app.use(router);

    let numberOfStats = 0;
    let numberOfLeaks = 0;

    memwatch.on('leak', function(info: any) {
      console.log(`leak: ${JSON.stringify(info)}`);
      numberOfLeaks++;
    });

    memwatch.on('stats', function(stats: any) {
      console.log(`stat: ${JSON.stringify(stats)}`);
      numberOfStats++;
    });

    while (numberOfStats < 22) {
      // console.log(`stats: ${numberOfStats}\tleaks: ${numberOfLeaks}`);
      await supertest(app)
        .get('/test')
        .expect(200)
        .then(response => {
          expect(response.text).to.equal('test');
        });
    }

    expect(numberOfLeaks).to.equal(0);
  });
});