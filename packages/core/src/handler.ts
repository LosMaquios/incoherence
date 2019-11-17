import { URL } from 'url'

import {
  createRouteMatcher,
  RouteMatcher,
  RouteMethod,
  RouteComponent,
  RouteComponentResponseObject,
  RouteStatusCode,
  RouteComponentResponse
} from './matcher'
import {
  setContext,
  getContext,
  setError,
  ContextRequest,
  ContextResponse
} from './context'

const supportedMethods: RouteMethod[] = [
  'GET',
  'POST',
  'HEAD',
  'OPTIONS',
  'PUT',
  'PATCH',
  'DELETE',
  /**
   * 'CONNECT',
   * 'TRACE'
   */
]

const getSimpleResponse = (status: RouteStatusCode, message: string): RouteComponentResponseObject => ({
  status,
  body: `[${status}] ${message}`
})

const onUnknownDefaultHandler: RouteComponent = async () => getSimpleResponse(404, 'Not Found')
const onErrorDefaultHandler: RouteComponent = async () => getSimpleResponse(500, 'Internal Server Error')

export interface HandlerOptions {
  onUnknown?: RouteComponent
  onError?: RouteComponent
}

const wrapMethodRouteMatcher = (method: RouteMethod) =>
  (path: string, component: RouteComponent) => createRouteMatcher(method, path, component)

export const get = wrapMethodRouteMatcher('GET')
export const post = wrapMethodRouteMatcher('POST')
export const put = wrapMethodRouteMatcher('PUT')
export const patch = wrapMethodRouteMatcher('PATCH')
export const head = wrapMethodRouteMatcher('HEAD')
export const opts = wrapMethodRouteMatcher('OPTIONS')

/**
 * TODO: I need to investigate more about methods below
 *
 * export const trace = wrapMethodRouteMatcher('TRACE')
 * export const connect = wrapMethodRouteMatcher('CONNECT')
 */

/**
 * Alias of `delete` to avoid keyword collision
 */
export const del = wrapMethodRouteMatcher('DELETE')

export const all = (path: string, component: RouteComponent) => supportedMethods
  .map(method => createRouteMatcher(method, path, component))

export function makeHandler (
  routes: RouteMatcher[],
  options: HandlerOptions = {}
) {
  routes = routes.flat(Infinity)

  const routesMap = getRoutesMap(routes)

  options = Object.assign({
    onUnknown: onUnknownDefaultHandler,
    onError: onErrorDefaultHandler
  }, options)

  const responseResolver = async (
    response: ContextResponse,
    innerResolver?: () => Promise<any>
  ) => {
    let nextResponse: RouteComponentResponse

    const currentResponse: RouteComponentResponseObject = {
      headers: {},
      status: 200,
      body: ''
    }

    try {
      if (innerResolver) {
        nextResponse = await innerResolver()
      }

      if (!nextResponse) {
        nextResponse = await options.onUnknown()
      }
    } catch (error) {
      setError(error)

      // TODO: How to handle an error here?
      nextResponse = await options.onError()

      setError(null)
    }

    // Clear context
    setContext(null)

    Object.assign(
      currentResponse,
      typeof nextResponse === 'string' || Buffer.isBuffer(nextResponse)
        ? { body: nextResponse }
        : nextResponse
    )

    response
      .writeHead(currentResponse.status, currentResponse.headers)
      .end(currentResponse.body)
  }

  return async function incoherenceHandler (
    request: ContextRequest,
    response: ContextResponse
  ) {
    const routeMatchers = routesMap.get(request.method.toUpperCase() as RouteMethod)

    if (!routeMatchers) {
      throw new Error(`Unsupported HTTP method: ${request.method}`)
    }

    const prevContext = getContext()

    setContext({
      request,
      response,
      locals: prevContext ? prevContext.locals : {}
    })

    if (!routeMatchers.length) {
      return responseResolver(response)
    }

    const requestURL = new URL(request.url)

    responseResolver(response, () => {
      for (const routeMatcher of routeMatchers) {
        if (routeMatcher.match(requestURL.pathname)) {
          return routeMatcher.invokeComponent()
        }
      }
    })
  }
}

function getRoutesMap (routes: RouteMatcher[]) {
  const map = new Map<RouteMethod, RouteMatcher[]>()

  for (const method of supportedMethods) {
    map.set(method, [])
  }

  for (const route of routes) {
    map.get(route.method).push(route)
  }

  return map
}
