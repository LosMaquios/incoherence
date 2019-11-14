import { IncomingMessage, ServerResponse } from 'http'

export interface RouteComponentContext {
  url: URL
  request: IncomingMessage
  response: ServerResponse
}

const context: {
  current: RouteComponentContext
} = {
  current: null
}

export function setContext (nextContext: RouteComponentContext) {
  context.current = nextContext
}

export function getContext () {
  return context.current
}
