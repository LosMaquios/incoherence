import { ServerResponse, IncomingMessage } from 'http'
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
import { setContext, getContext, setError } from './context'

const methods: RouteMethod[] = [
  'GET',
  'POST',
  'HEAD',
  'OPTIONS',
  'PUT',
  'PATCH',
  'DELETE',
  'CONNECT',
  'TRACE'
]

const getSimpleResponse = (status: RouteStatusCode, message: string): RouteComponentResponseObject => ({
  status,
  body: `[${status}] ${message}`
})

const onUnknownDefaultHandler: RouteComponent = async () => getSimpleResponse(404, 'Not found')
const onErrorDefaultHandler: RouteComponent = async () => getSimpleResponse(500, 'Internal server error')

export interface HandlerOptions {
  onUnknown: RouteComponent
  onError: RouteComponent
}

const wrapMethodRouteMatcher = (method: RouteMethod) =>
  (path: string, component: RouteComponent) => createRouteMatcher(method, path, component)

export const get = wrapMethodRouteMatcher('GET')
export const post = wrapMethodRouteMatcher('POST')
export const put = wrapMethodRouteMatcher('PUT')
export const patch = wrapMethodRouteMatcher('PATCH')
export const head = wrapMethodRouteMatcher('HEAD')
export const options = wrapMethodRouteMatcher('OPTIONS')
export const trace = wrapMethodRouteMatcher('TRACE')
export const connect = wrapMethodRouteMatcher('CONNECT')

/**
 * Alias of `delete` to avoid keyword collision
 */
export const del = wrapMethodRouteMatcher('DELETE')

export const all = (path: string, component: RouteComponent) => methods
  .map(method => createRouteMatcher(method, path, component))

export function makeHandler (
  routes: RouteMatcher[],
  options: HandlerOptions
) {
  routes = routes.flat(Infinity)

  const routesMap = getRoutesMap(routes)

  options = Object.assign({
    onUnknown: onUnknownDefaultHandler,
    onError: onErrorDefaultHandler
  }, options)

  const responseResolver = async (
    response: ServerResponse,
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

    Object.assign(
      currentResponse,
      typeof nextResponse === 'string' || Buffer.isBuffer(nextResponse)
        ? { body: nextResponse }
        : nextResponse
    )

    for (const header in currentResponse.headers) {
      response.setHeader(header, currentResponse.headers[header])
    }

    response.statusCode = currentResponse.status
    response.end(currentResponse.body)
  }

  return async function incoherenceHandler (
    request: IncomingMessage,
    response: ServerResponse
  ) {
    const routeMatchers = routesMap.get(request.method.toUpperCase() as RouteMethod)

    if (!routeMatchers) {
      throw new Error(`Unsupported HTTP method: ${request.method}`)
    }

    if (!routeMatchers.length) {
      return responseResolver(response)
    }

    const requestURL = new URL(request.url)
    const prevContext = getContext()

    setContext({
      request,
      response,
      locals: prevContext ? prevContext.locals : {}
    })

    responseResolver(response, async () => {
      for (const routeMatcher of routeMatchers) {
        if (routeMatcher.match(requestURL.pathname)) {
          return routeMatcher.invokeComponent()
        }
      }
    })
  }
}

function getRoutesMap (routes: RouteMatcher[]) {
  const map = getMapFromMethods(methods)

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
