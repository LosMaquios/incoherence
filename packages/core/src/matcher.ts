import escapeStringRegexp = require('escape-string-regexp')

import { setContext } from './context'

export type RouteMethod = 'GET' | 'POST' | 'HEAD' | 'OPTIONS' | 'PUT' | 'PATCH' | 'DELETE' | 'CONNECT' | 'TRACE'

// Taken from: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
export type RouteStatusCode =
  100 | 101 | 102 | 103 |
  200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 |
  300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 |
  400 | 404 | 500

export type RouteComponentResponse = RouteComponentResponseObject | string

export interface RouteComponentResponseObject {
  headers?: { [key: string]: any }
  status?: RouteStatusCode
  body?: any
}

export type RouteComponent = () => Promise<RouteComponentResponse>

/**
 * Match params:
 *
 *   - /required/:param
 *   - /optional/:param~
 */
const PARAM_REGEX = /(\/)?:([-\w]+)(~)?/

const rewriteParams = (_, slash = '', param, optional = '') => {
  let rewrite = `${slash}(?<${param}>[^/]+)`

  if (slash && optional) {
    rewrite = `(?:${rewrite})`
  }

  return `${rewrite}${optional}`
}

export interface RouteMatcher {
  method: RouteMethod
  params: Map<string, string>
  match: (path: string) => boolean
  invokeComponent: () => Promise<RouteComponentResponse>
}

export function createRouteMatcher (
  method: RouteMethod,
  path: string,
  component: RouteComponent
): RouteMatcher {
  const params = new Map<string, string>()

  return {
    method,
    params,
    match: getMatchFn(path, params),
    invokeComponent: getComponentInvoker(component, params)
  }
}

function getComponentInvoker (
  component: RouteComponent,
  params: Map<string, string>
) {
  return async function componentInvoker () {
    const componentResponse = await component()

    // Clear context
    setContext(null)

    // Clear params
    params.clear()

    return componentResponse
  }
}

function getMatchFn (
  path: string,
  params: Map<string, string>
) {
  const regex = new RegExp(escapeStringRegexp(path).replace(PARAM_REGEX, rewriteParams))

  return function matchFn (
    anyPath: string
  ) {
    const match = regex.exec(anyPath)

    if (!match) return false

    for (const param in match.groups) {
      params.set(param, match.groups[param])
    }

    return true
  }
}
