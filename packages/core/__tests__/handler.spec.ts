import {
  makeHandler,
  get,
  post
} from '../src/handler'
import { RouteComponent } from '../src/matcher'
import { mockRequestAndResponse } from './mockUtils'

describe('handler', () => {
  const MockGetComponent = jest.fn(async () => {
    return 'get called'
  }) as RouteComponent

  const MockPostComponent = jest.fn(async () => {
    return {
      status: 201,
      body: 'resource created'
    }
  }) as RouteComponent

  const MockErrorComponent = jest.fn(async () => {
    throw new Error('Failed to get resource')
  }) as RouteComponent

  const handler = makeHandler([
    get('/get/path', MockGetComponent),
    post('/post/path', MockPostComponent),
    get('/error/resource', MockErrorComponent)

    /**
     * put('/put/path', MockComponent),
     * patch('/patch/path', MockComponent),
     * del('/delete/path', MockComponent),
     * head('/head/path', MockComponent),
     * opts('/options/path', MockComponent)
     */
  ])

  test('component matching', async () => {
    const [requestGET, responseGET] = mockRequestAndResponse('GET', '/get/path')
    await handler(requestGET, responseGET)

    expect(responseGET.statusCode).toEqual(200)
    expect(MockGetComponent).toHaveBeenCalledTimes(1)
    // expect(MockGetComponent).toHaveReturnedWith('get called')

    const [requestPOST, responsePOST] = mockRequestAndResponse('POST', '/post/path')
    await handler(requestPOST, responsePOST)

    expect(responseGET.statusCode).toEqual(200)
    expect(MockPostComponent).toHaveBeenCalledTimes(1)
    // expect(MockPostComponent).toHaveReturnedWith('post called')
  })

  test('default `not found` component', async () => {
    const [requestUnknown, responseUnknown] = mockRequestAndResponse('DELETE', '/delete/a/resource')
    await handler(requestUnknown, responseUnknown)

    expect(responseUnknown.statusCode).toEqual(404)
  })

  test('default `error` component', async () => {
    const [requestError, responseError] = mockRequestAndResponse('GET', '/error/resource')
    await handler(requestError, responseError)

    return new Promise(resolve => {
      setTimeout(() => {
        expect(responseError.statusCode).toEqual(500)
        resolve()
      })
    })
  })
})
