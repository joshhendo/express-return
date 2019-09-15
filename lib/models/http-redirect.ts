export function HttpRedirect(redirect: string, code?: number) {
  return {
    redirect,
    code,
  }
}
