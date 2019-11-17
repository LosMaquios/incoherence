import { IncomingMessage, ServerResponse } from 'http'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'

export type ContextRequest = IncomingMessage | Http2ServerRequest
export type ContextResponse = ServerResponse | Http2ServerResponse

export interface RouteComponentContext {
  request: ContextRequest
  response: ContextResponse
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
