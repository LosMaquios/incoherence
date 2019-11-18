import {
  makeHandler,
  get,
  post
} from '../src/handler'
import { RouteComponent } from '../src/matcher'
import { execHandler } from './testUtils'

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

  const MockCustomErrorComponent = jest.fn(async () => {
    return {
      status: 500,
      body: 'Error skipped'
    }
  }) as RouteComponent

  const MockUnknownComponent = jest.fn(async () => {
    return {
      status: 404,
      body: `Random resource ID: ${Math.random()}`
    }
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

  const handlerWithCustoms = makeHandler([
    get('/error/resource', MockErrorComponent)
  ], {
    onError: MockCustomErrorComponent,
    onUnknown: MockUnknownComponent
  })

  test('component matching', async () => {
    const responseGET = await execHandler('GET', '/get/path', handler)

    expect(responseGET.statusCode).toBe(200)
    expect(MockGetComponent).toHaveBeenCalledTimes(1)
    // expect(MockGetComponent).toHaveReturnedWith('get called')

    const responsePOST = await execHandler('POST', '/post/path', handler)

    expect(responsePOST.statusCode).toBe(201)
    expect(MockPostComponent).toHaveBeenCalledTimes(1)
    // expect(MockPostComponent).toHaveReturnedWith('post called')
  })

  test('default `not found` component', async () => {
    const responseUnknown = await execHandler('DELETE', '/delete/a/resource', handler)

    expect(responseUnknown.statusCode).toBe(404)
  })

  test('default `error` component', async () => {
    const responseError = await execHandler('GET', '/error/resource', handler)

    return new Promise(resolve => {
      setTimeout(() => {
        expect(responseError.statusCode).toBe(500)
        resolve()
      })
    })
  })

  test('custom `not found` component', async () => {
    const responseUnknown = await execHandler('GET', '/unknown/resource', handlerWithCustoms)

    expect(responseUnknown.statusCode).toBe(404)
    expect(MockUnknownComponent).toHaveBeenCalledTimes(1)
  })

  test('custom `error` component', async () => {
    const responseError = await execHandler('GET', '/error/resource', handlerWithCustoms)

    return new Promise(resolve => {
      setTimeout(() => {
        expect(responseError.statusCode).toBe(500)
        expect(MockCustomErrorComponent).toHaveBeenCalledTimes(1)
        resolve()
      })
    })
  })
})
