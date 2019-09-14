import * as express from 'express';
import {ApplicationRequestHandler, IRouter, Router} from 'express-serve-static-core';
import {IRouterMatcher} from "express";
import * as http from "http";

const DEFAULT_METHODS = ['get', 'post', 'put', 'patch'];

export interface ExpressReturn {
  post?: IRouterMatcher<IRouter>;
  get?: IRouterMatcher<IRouter>;
  put?: IRouterMatcher<IRouter>;
  patch?: IRouterMatcher<IRouter>;
  use: ApplicationRequestHandler<IRouter>;

  listen?(port: number, hostname: string, backlog: number, callback?: Function): http.Server;
  listen?(port: number, hostname: string, callback?: Function): http.Server;
  listen?(port: number, callback?: Function): http.Server;
  listen?(path: string, callback?: Function): http.Server;
  listen?(handle: any, listeningListener?: Function): http.Server;

  init?(): void;
}

export function createApplication(app?: express.Application, methods?: string[]): ExpressReturn {
  app = app || express();
  const wrapper = createWrapper(app, methods);
  wrapper.use = app.use.bind(app);
  wrapper.listen = app.listen.bind(app);
  wrapper.init = app.init.bind(app);
  return wrapper;
}

export function modifyRouter<T extends IRouter>(router: T, methods?: string[]): ExpressReturn {
  return createWrapper(router, methods);
}

function createWrapper<T extends IRouter>(router: T, methods?: string[]): ExpressReturn {
  methods = methods || DEFAULT_METHODS;

  const wrapper: any = {};

  methods.forEach(function (method: string) {
    (<any>wrapper)[method] = function (path: string, ...callback: any[]): any {
      (<any>router)[method](path, function (req: express.Request, res: express.Response, next: express.NextFunction) {
        let callbackIndex = -1;
        const _next = function (errorData?: any) {
          if (callbackIndex < callback.length && !errorData) {
            callbackIndex += 1;
            if (callbackIndex != callback.length - 1) {
              callback[callbackIndex](req, res, _next);
              return;
            }
            let _res = callback[callbackIndex](req, res, _next);
            handleResult(_res, res)
              .catch(next);
          } else {
            <any>next(errorData);
          }
        };
        _next();
      });
    };
  });

  return wrapper as ExpressReturn;
}

function handleResult(_res: any, res: express.Response): Promise<any> {
  if (!_res) {
    return Promise.resolve();
  }
  if (!_res.__proto__ || !_res.__proto__.then) {
    _res = Promise.resolve(_res);
  }
  return _res.then((_resData: any) => {
    if (_resData) {

      if (_resData.redirect) {
        // Optional 'code' param appears at the start
        // https://expressjs.com/en/4x/api.html#res.redirect
        if (_resData.code) {
          res.redirect(_resData.code, _resData.redirect);
        } else {
          res.redirect(_resData.redirect);
        }
        return;
      }

      if (_resData.code) {
        res.status(_resData.code);
      }

      // If it has a body, send it; if it doesn't have a body
      // but does have a status code, end the request
      if (_resData.body) {
        res.send(_resData.body);
      } else if (_resData.code) {
        res.end();
      }
    }
  });
}
