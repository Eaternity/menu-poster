const {api} = require('./api')

module.exports.postProductsThenPostMenus = async ({
  baseUrl,
  jwt,
  menus,
  products
}) => {
  await Promise.all(
    products.map(product => api.postProduct({baseUrl, jwt, product}))
  ).catch(err => console.error('Error posting product', err))

  await Promise.all(
    menus.map(menu => api.postMenu({baseUrl, jwt, menu}))
  ).catch(err => console.error('Error posting menu', err))
}
