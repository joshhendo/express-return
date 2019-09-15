export function HttpResponse(body: any, code?: number) {
  return {
    body,
    code,
  }
}
