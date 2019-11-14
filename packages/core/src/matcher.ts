import escapeStringRegexp = require('escape-string-regexp')

import { RouteComponent, RouteMethod } from './handler'
import { RouteComponentContext, setContext } from './context'

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
  invokeComponent: (context: RouteComponentContext) => Promise<void>
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
  return async function componentInvoker (
    { response }: RouteComponentContext
  ) {
    const componentResponse = await component()

    response.statusCode = componentResponse.status
    response.end(componentResponse.body)

    // Clear context
    setContext(null)

    // Clear params
    params.clear()
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
