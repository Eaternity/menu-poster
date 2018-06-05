const request = require('requestretry')

const generateHeaders = jwt => ({
  'Content-Type': 'application/json',
  jwt
})

const generateOptions = ({body, jwt, url}) => ({
  url,
  method: 'POST',
  body,
  headers: generateHeaders(jwt),
  json: true,
  fullResponse: true,
  /*
  Without retry strategy an arbitrary number of menus did not get posted and the request returned different status codes all of which indicated that the
  error could be recovered (503, 504 etc...). requestretry seems to solve the problem. The options below are specific to requestretry.
   */
  maxAttempts: 30, // (default) try 5 times
  retryDelay: 7000, // (default) wait for 5s before trying again
  retryStrategy: request.RetryStrategies.HTTPOrNetworkError // (default)
})

module.exports.api = {
  postMenu: ({baseUrl, jwt, menu}) =>
    request(generateOptions({jwt, body: menu, url: `${baseUrl}/api/menus`})),

  postProduct: ({baseUrl, jwt, product}) =>
    request(
      generateOptions({jwt, body: product, url: `${baseUrl}/api/products`})
    )
}
