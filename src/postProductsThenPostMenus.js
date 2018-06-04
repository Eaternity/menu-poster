const {api} = require('./api')

module.exports.postProductsThenPostMenus = async ({
  baseUrl,
  jwt,
  menus,
  products
}) => {
  await Promise.all(
    products.map(product => api.postProduct({baseUrl, jwt, product}))
  )
    .then(responses => {
      console.log('-----------------------------------------------------------')
      console.log(`All ${responses.length} unique products posted successfully`)
      console.log('-----------------------------------------------------------')
    })
    .catch(err => console.error('Error posting products', err))

  await Promise.all(menus.map(menu => api.postMenu({baseUrl, jwt, menu})))
    .then(responses => {
      console.log('-----------------------------------------------------------')
      console.log(`All ${responses.length} menus posted successfully`)
      console.log('-----------------------------------------------------------')
    })
    .catch(err => console.error('Error posting menus', err))
}
