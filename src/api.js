const fetch = require('fetch-retry')

const generateHeaders = jwt => ({
  'Content-Type': 'application/json',
  jwt
})

module.exports.api = {
  postMenu: ({baseUrl, jwt, menu}) =>
    fetch(`${baseUrl}/api/menus`, {
      method: 'POST',
      body: JSON.stringify(menu),
      headers: generateHeaders(jwt)
    })
      .then(res => {
        console.log(`Menu: "${menu.title}" posted successfully`)
        return res
      })
      .catch(err => {
        console.error(`Error posting menu: "${menu.title}"`)
        throw new Error(err)
      }),

  postProduct: ({baseUrl, jwt, product}) =>
    fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      body: JSON.stringify(product),
      headers: generateHeaders(jwt)
    })
      .then(res => {
        console.log(`Product: "${product.title}" posted successfully`)
        return res
      })
      .catch(err => {
        console.error(`Error posting product: "${product.title}"`)
        throw new Error(err)
      })
}
