const fetch = require('fetch-retry')

const generateHeaders = jwt => ({
  'Content-Type': 'application/json',
  jwt
})

const generateOptions = ({jwt, body}) => ({
  method: 'POST',
  body: JSON.stringify(body),
  headers: generateHeaders(jwt),
  // api exposed by fetc-retry:
  retries: 5,
  retryDelay: 5000
})

module.exports.api = {
  postMenu: ({baseUrl, jwt, menu}) =>
    fetch(`${baseUrl}/api/menus`, generateOptions({jwt, body: menu}))
      .then(res => {
        console.log(`Menu: "${menu.title}" posted successfully`)
        return res
      })
      .catch(err => {
        console.error(`Error posting menu: "${menu.title}"`)
        throw new Error(err)
      }),

  postProduct: ({baseUrl, jwt, product}) =>
    fetch(`${baseUrl}/api/products`, generateOptions({jwt, body: product}))
      .then(res => {
        console.log(`Product: "${product.title}" posted successfully`)
        return res
      })
      .catch(err => {
        console.error(`Error posting product: "${product.title}"`)
        throw new Error(err)
      })
}
