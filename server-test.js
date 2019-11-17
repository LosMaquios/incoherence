'use strict'

const { createServer } = require('http')

const server = createServer((request, response) => {
  const arr = Buffer.from('abc')

  console.log('a')

  response.end(arr)
})

server
  .listen(3100)
