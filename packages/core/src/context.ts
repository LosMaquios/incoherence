import { IncomingMessage, ServerResponse } from 'http'

export interface RouteComponentContext {
  request: IncomingMessage
  response: ServerResponse
  locals: { [key: string]: any }
}

const context: {
  current: RouteComponentContext,
  error: any
} = {
  current: null,
  error: null
}

export function setContext (nextContext: RouteComponentContext) {
  context.current = nextContext
}

export function getContext () {
  return context.current
}

export function setError (nextError: any) {
  context.error = nextError
}

export function getError () {
  return context.error
}
