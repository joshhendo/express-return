import * as express from 'express';

const DEFAULT_METHODS = ['get', 'post', 'put', 'patch'];

export function createApplication(app?: any, methods?: string[]): express.Application {
  app = app || express();
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

function handleResult(_res: any, res: express.Response) {
  if (!_res) {
    return;
  }
  if (!_res.__proto__ || !_res.__proto__.then) {
    _res = Promise.resolve(_res);
  }
  return _res.then((_resData: any) => {
    if (_resData) {
      if (_resData.code) {
        res.status(_resData.code);
      }
      if (_resData.body) {
        res.send(_resData.body);
      }
    }
  });
}
