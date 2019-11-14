# Incoherence

  A tiny experiment

## Usage

```ts
import { makeHandler, RoutesMap } from '@incoherence/handler'
import { createServer } from 'http'

const routes: RoutesMap = [
  {
    path: '/user',
    method: 'GET',
    component: UserComponent
  },
  {
    path: '/user/create/:id',
    method: 'POST',
    component: UserCreateComponent
  }
]

const server = createServer(
  makeHandler(routes)
)

server.listen(ANY_PORT)

// useVerifyAuth.ts
import { ResponseError } from '@incoherence/core'
import { useHeader } from '@incoherence/hooks'

async function useVerifyAuth () {
  const [tokenHeader, setTokenHeader] = useHeader('authorization') /* <- request header */

  if (!tokenHeader.value || !(await isValidToken(tokenHeader.value))) {
    throw new ResponseError({
      status: 400,
      body: {
        error: 'Unauthorized'
      }
    })
  }
}

// UserComponent.ts
import { useVerifyAuth } from '../hooks/useVerifyAuth'

async function UserComponent () {
  await useVerifyAuth()

  return {
    status: 200,
    body: {
      name: 'Jhon Doe',
      age: 30
    }
  }
}

// UserCreateComponent.ts
import { useParam, useBody } from '@incoherence/hooks'

async function UserCreateComponent () {
  saveToDB(useParam('id'), useBody()/* <- request body */)

  return {
    status: 200,
    body: {
      message: 'User created successfully'
    }
  }
}
```
