import { createRouteMatcher, RouteComponent } from '../src/matcher'

describe('matcher', () => {
  let MockComponent: RouteComponent

  beforeEach(() => {
    MockComponent = jest.fn(async () => 'Mock called')
  })

  test('matcher creation', async () => {
    const matcher = createRouteMatcher('GET', '/example/path', MockComponent)

    expect(matcher.method).toBe('GET')
    expect(matcher.params).toBeInstanceOf(Map)

    expect(matcher.match('/example/path')).toBe(true)

    const result = await matcher.invokeComponent()

    expect(MockComponent).toHaveBeenCalledTimes(1)
    expect(result).toBe('Mock called')
  })

  test('path matching', () => {
    const matcherSimplePath = createRouteMatcher('GET', '/users', MockComponent)

    expect(matcherSimplePath.match('/users')).toBe(true)
    expect(matcherSimplePath.match('/get/users')).toBe(false)
    expect(matcherSimplePath.match('/users/get')).toBe(false)
    expect(matcherSimplePath.match('/get/users/all')).toBe(false)

    const matcherComplexPath = createRouteMatcher('POST', '/users/add/:id', MockComponent)

    expect(matcherComplexPath.match('/users/add/100123')).toBe(true)
    expect(matcherComplexPath.match('/users/add/1/2')).toBe(false)
  })

  test.todo('extract params')
})
