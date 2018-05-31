const {request} = require('universal-rxjs-ajax')

const generateHeaders = jwt => ({
  'Content-Type': 'application/json',
  jwt
})

module.exports.api = {
  postMenu: ({jwt, menu}) => {
    return request({
      url: 'http://localhost:5001/api/menus',
      headers: generateHeaders(jwt),
      method: 'POST',
      body: menu
    })
  },

  postProduct: ({jwt, product}) => {
    return request({
      url: 'http://localhost:5001/api/products',
      headers: generateHeaders(jwt),
      method: 'POST',
      body: product
    })
  }
}
