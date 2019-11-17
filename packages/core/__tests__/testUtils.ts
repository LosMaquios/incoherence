import { RouteMethod } from '../src/matcher'
import { IncoherenceHandler } from '../src/handler'
import { mockRequestAndResponse } from './mockUtils'

export async function execHandler (
  method: RouteMethod,
  path: string,
  handler: IncoherenceHandler
) {
  const [request, response] = mockRequestAndResponse(method, path)
  await handler(request, response)

  return response
}
