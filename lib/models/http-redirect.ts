export class HttpRedirect {
  redirect: string;
  code: number;

  constructor(redirect: string, code?: number) {
    this.redirect = redirect;
    this.code = code;
  }
}
