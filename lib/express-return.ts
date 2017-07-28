import * as express from 'express';

const DEFAULT_METHODS = ['get', 'post', 'put', 'patch'];

export function createApplication(app?: any, methods?: string[]): express.Application {
    app = app || express();
    methods = methods || DEFAULT_METHODS;

    methods.forEach(function(method: string) {
        const originalMethod = '_' + method;
        (<any>app)[originalMethod] = (<any>app)[method];
        (<any>app)[method] = function (path: string, ...callback: any[]): any {
            (<any>app)[originalMethod](path, function (req: express.Request, res: express.Response, next: express.NextFunction) {
                let callbackIndex = 0;
                const _next = function(errorData?: any) {
                    if (callbackIndex < callback.length && !errorData) {
                        let _res = callback[callbackIndex](req, res, _next);
                        if (!_res.__proto__ || !_res.__proto__.then) {
                            _res = Promise.resolve(_res);
                        }
                        _res.then((_resData: any) => {
                            if (_resData) {
                                if (_resData.code) {
                                    res.status(_resData.code);
                                }
                                if (_resData.body) {
                                    res.send(_resData.body);
                                }
                            }
                        })
                            .catch(next);
                    } else {
                        next(errorData);
                    }
                    callbackIndex += 1;
                };
                _next();
            });
        };
    });

    return app;
}