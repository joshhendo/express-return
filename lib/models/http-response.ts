export class HttpResponse {
  body: any;
  code: number;

  constructor(body: any, code?: number) {
    this.body = body;
    this.code = code;
  }
}
