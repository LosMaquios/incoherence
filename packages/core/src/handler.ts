import { ServerResponse, IncomingMessage } from 'http'
import { URL } from 'url'

import { createRouteMatcher, RouteMatcher } from './matcher'
import { setContext, getContext } from './context'

export type RouteMethod = 'GET' | 'POST' | 'HEAD' | 'OPTIONS' | 'PUT' | 'PATCH' | 'DELETE' | 'CONNECT' | 'TRACE'

// Taken from: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
export type RouteStatusCodes =
  100 | 101 | 102 | 103 |
  200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 |
  300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 |
  400

export type RouteComponent = () => RouteResponse

export interface RouteResponse {
  status?: number
  body?: any
}

const wrapMethodRouteMatcher = (method: RouteMethod) =>
  (path: string, component: RouteComponent) => createRouteMatcher(method, path, component)

export const get = wrapMethodRouteMatcher('GET')
export const post = wrapMethodRouteMatcher('POST')
export const put = wrapMethodRouteMatcher('PUT')
export const patch = wrapMethodRouteMatcher('PATCH')
export const head = wrapMethodRouteMatcher('HEAD')
export const options = wrapMethodRouteMatcher('OPTIONS')

/**
 * Alias of `delete` to avoid keyword collision
 */
export const del = wrapMethodRouteMatcher('DELETE')

export function makeHandler (
  routes: RouteMatcher[]
) {
  const routesMap = getRoutesMap(routes)

  return function incoherenceHandler (
    request: IncomingMessage,
    response: ServerResponse
  ) {
    const routeMatchers = routesMap.get(request.method.toUpperCase() as RouteMethod)

    if (!routeMatchers) {
      throw new Error(`Unsupported HTTP method: ${request.method}`)
    }

    const requestURL = new URL(request.url)

    for (const routeMatcher of routeMatchers) {
      if (routeMatcher.match(requestURL.pathname)) {
        setContext({
          url: requestURL,
          request,
          response
        })

        routeMatcher.invokeComponent(getContext())
        break
      }
    }

    // TODO: Fallback to 404 component
  }
}

function getRoutesMap (
  routes: RouteMatcher[]
) {
  const map = getMapFromMethods([
    'GET',
    'POST',
    'HEAD',
    'OPTIONS',
    'PUT',
    'PATCH',
    'DELETE',
    'CONNECT',
    'TRACE'
  ])

  for (const route of routes) {
    map
      .get(route.method)
      .push(route)
  }

  return map
}

function getMapFromMethods (
  methods: RouteMethod[]
) {
  const map = new Map<RouteMethod, RouteMatcher[]>()

  for (const method of methods) {
    map.set(method, [])
  }

  return map
}
