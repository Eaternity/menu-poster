const {request} = require('universal-rxjs-ajax')

const generateHeaders = jwt => ({
  'Content-Type': 'application/json',
  jwt
})

module.exports.api = {
  postMenu: ({baseUrl, jwt, menu}) => {
    return request({
      url: `${baseUrl}/api/menus`,
      headers: generateHeaders(jwt),
      method: 'POST',
      body: menu
    })
  },

  postProduct: ({baseUrl, jwt, product}) => {
    return request({
      url: `${baseUrl}/api/products`,
      headers: generateHeaders(jwt),
      method: 'POST',
      body: product
    })
  }
}
