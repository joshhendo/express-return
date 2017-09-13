import * as express from 'express';
import {IRouter} from 'express-serve-static-core';

const DEFAULT_METHODS = ['get', 'post', 'put', 'patch'];

export function createApplication(app?: express.Application, methods?: string[]): express.Application {
  app = app || express();
  return modifyRouter(app, methods);
}

export function modifyRouter<T extends IRouter>(app: T, methods?: string[]): T {
  methods = methods || DEFAULT_METHODS;

  methods.forEach(function (method: string) {
    const originalMethod = '_' + method;
    (<any>app)[originalMethod] = (<any>app)[method];
    (<any>app)[method] = function (path: string, ...callback: any[]): any {
      (<any>app)[originalMethod](path, function (req: express.Request, res: express.Response, next: express.NextFunction) {
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
            let _res = <any>next(errorData);
            handleResult(_res, res);
          }
        };
        _next();
      });
    };
  });

  return app;
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
      if (_resData.code) {
        res.status(_resData.code);
      }
      // If it has a body, send it;
      // if it doesn't have a body
      // but does have a status code,
      // end the request
      if (_resData.body) {
        res.send(_resData.body);
      } else if (_resData.code) {
        res.end();
      }
    }
  });
}
