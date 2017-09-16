import * as express from 'express';
import * as ExpressReturn from '../lib/express-return';
import {HttpResponse} from '../index';
import * as supertest from 'supertest';
import {expect} from 'chai';
import {spy} from 'sinon';

describe('express-return', function() {
  let app: express.Application;
  beforeEach(function () {
    app = ExpressReturn.createApplication();
  });


  describe('basic return with no promise', function () {
    it('defaults to 200 when no code is specified', function () {
      const controller = function() {
        return new HttpResponse('test');
      };

      app.get('/test', controller);

      return supertest(app)
        .get('/test')
        .expect(200)
        .then(response => {
          expect(response.text).to.equal('test');
        });
    });

    it('uses http code returned', function () {
      const controller = function () {
        return new HttpResponse('test', 201);
      };

      app.get('/test', controller);

      return supertest(app)
        .get('/test')
        .expect(201);
    });
  });

  describe('basic return with promise', function () {
    it('defaults to 200 when no code is specified', function () {
      const controller = function() {
        return Promise.resolve()
          .then(() => new HttpResponse('test'))
      };

      app.get('/test', controller);

      return supertest(app)
        .get('/test')
        .expect(200)
        .then(response => {
          expect(response.text).to.equal('test');
        });
    });

    it('uses http code returned', function () {
      const controller = function () {
        return Promise.resolve()
          .then(() => new HttpResponse('test', 201));
      };

      app.get('/test', controller);

      return supertest(app)
        .get('/test')
        .expect(201);
    });
  });

  describe('handles middleware', function () {
    it('hits middleware', function () {
      let middlewareCalled = false;
      const middleware = function(req: express.Request, res: express.Response, next: express.NextFunction) {
        middlewareCalled = true;
        next();
      };

      const controller = function () {
        return new HttpResponse('test');
      };

      app.get('/test', middleware, controller);

      return supertest(app)
        .get('/test')
        .expect(200)
        .then(() => {
          expect(middlewareCalled).to.equal(true);
        })
    });

    it('skips controller if middleware returns error', function () {
      let controllerCalled = false;
      let errorHandlerCalled = false;

      const middleware = function(req: express.Request, res: express.Response, next: express.NextFunction) {
        next('an error!');
      };

      const controller = function () {
        controllerCalled = true;
        return new HttpResponse('test');
      };

      const errorHandler = function(err: any, req: express.Request, res: express.Response, next: express.NextFunction)  {
        errorHandlerCalled = true;
        res.status(500);
        res.end();
      };

      app.get('/test', middleware, controller);
      app.use(errorHandler);

      return supertest(app)
        .get('/test')
        .expect(500)
        .then(() => {
          expect(controllerCalled).to.equal(false);
          expect(errorHandlerCalled).to.equal(true);
        });
    });
  });
});