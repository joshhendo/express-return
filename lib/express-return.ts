import * as express from 'express';
import type { IRouter } from 'express-serve-static-core';

const DEFAULT_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'use'];

export function createProxy(obj: express.Application | express.Router, methods?: string[]) {
  const methodsToUse = methods || DEFAULT_METHODS;

  const routeHandler = {
    async apply(target: any, thisArg: any, args: any) {
      if (!args || args.length < 3) {
        return target(...args);
      }

      const isErrorHandler = args.length === 4;
      const errorArgOffset = isErrorHandler ? 1 : 0;

      const res = args[1 + errorArgOffset];
      const next = args[2 + errorArgOffset];

      // If there's a weird scenario that hasn't been considered
      if (next == null || typeof next !== 'function' || next.name !== 'next') {
        return target(...args);
      }

      try {
        const _resData = await target(...args);

        if (_resData) {
          if (_resData.redirect_url) {
            // Optional 'code' param appears at the start
            // https://expressjs.com/en/4x/api.html#res.redirect
            if (_resData.code) {
              res.redirect(_resData.code, _resData.redirect_url);
            } else {
              res.redirect(_resData.redirect_url);
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
      } catch (err) {
        next(err);
      }
    },
  };

  const handleFunction = function (target: any, property: any) {
    return function (...args: any[]): any {
      target[property](
        ...args.map((x) => {
          if (typeof x !== 'function') {
            return x;
          }

          return new Proxy(x, routeHandler);
        })
      );
    };
  };

  const handler = {
    get(target: any, property: string) {
      if (methodsToUse.indexOf(property) === -1) {
        return target[property];
      }

      return handleFunction(target, property);
    },
  };

  return new Proxy(obj, handler);
}

export function createApplication(app?: express.Application, methods?: string[]): express.Application {
  return createProxy(app || express(), methods);
}

export function createRouter<T extends IRouter>(router?: T, methods?: string[]): T {
  return createProxy(router || express.Router(), methods);
}
