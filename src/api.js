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
  // The below parameters are specific to request-retry
  maxAttempts: 10, // (default) try 5 times
  retryDelay: 5000, // (default) wait for 5s before trying again
  retryStrategy: request.RetryStrategies.HTTPOrNetworkError // (default)
})

module.exports.api = {
  postMenu: ({baseUrl, jwt, menu}) =>
    request(generateOptions({jwt, body: menu, url: `${baseUrl}/api/menus`}))
      .then(res => {
        console.log(`Menu: "${menu.title}" posted successfully`)
        return res
      })
      .catch(err => {
        console.error(`Error posting menu: "${menu.title}"`)
        throw new Error(err)
      }),

  postProduct: ({baseUrl, jwt, product}) =>
    request(
      generateOptions({jwt, body: product, url: `${baseUrl}/api/products`})
    )
      .then(res => {
        console.log(`Product: "${product.title}" posted successfully`)
        return res
      })
      .catch(err => {
        console.error(`Error posting product: "${product.title}"`)
        throw new Error(err)
      })
}
