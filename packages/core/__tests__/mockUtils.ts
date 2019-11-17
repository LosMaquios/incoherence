import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'
import { RouteMethod } from '../src/matcher'

export function mockRequestAndResponse (method: RouteMethod, path: string): [IncomingMessage, ServerResponse] {
  const request = mockRequest(method, path)

  return [request, mockResponse(request)]
}

function mockRequest (method, path) {
  const request = new IncomingMessage(new Socket())

  request.url = `http://example.com${path}`
  request.method = method

  return request
}

function mockResponse (request: IncomingMessage) {
  return new ServerResponse(request)
}
