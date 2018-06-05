const ProgressBar = require('progress')
const {api} = require('./api')

module.exports.postProductsThenPostMenus = async ({
  baseUrl,
  jwt,
  menus,
  products
}) => {
  const menuBar = new ProgressBar('  posting menus [:bar] :percent', {
    complete: '=',
    incomplete: ' ',
    width: 40,
    total: menus.length,
    clear: true
  })

  const productBar = new ProgressBar('  posting products [:bar] :percent', {
    complete: '=',
    incomplete: ' ',
    width: 40,
    total: menus.length,
    clear: true
  })

  await Promise.all(
    products.map(product =>
      api.postProduct({baseUrl, jwt, product, productBar})
    )
  )
    .then(responses => {
      const fails = responses
        .filter(res => res.statusCode !== 201)
        .map(({request: {body}, statusCode}) => {
          const {id, title, type} = JSON.parse(body)
          return {statusCode, id, title, type}
        })

      if (fails.length === 0) {
        console.log('---------------------------------------------------------')
        console.log(`All ${responses.length} products posted successfully`)
        console.log('---------------------------------------------------------')
      } else {
        console.log('---------------------------------------------------------')
        console.log('Could NOT post all products 😱')
        console.log('Products not posted:')
        console.log(fails)
        console.log('---------------------------------------------------------')
      }
    })
    .catch(err => console.error('Error posting products', err))

  await Promise.all(
    menus.map(menu => api.postMenu({baseUrl, jwt, menu, menuBar}))
  )
    .then(responses => {
      const fails = responses
        .filter(res => res.statusCode !== 201)
        .map(({request: {body}, statusCode}) => {
          const {id, title, type} = JSON.parse(body)
          return {statusCode, id, title, type}
        })

      if (fails.length === 0) {
        console.log('---------------------------------------------------------')
        console.log(`All ${responses.length} menus posted successfully`)
        console.log('---------------------------------------------------------')
      } else {
        console.log('---------------------------------------------------------')
        console.log('Could NOT post all menus 😱')
        console.log('Menus not posted:')
        console.log(fails)
        console.log('---------------------------------------------------------')
      }
    })
    .catch(err => console.error('Error posting menus', err))
}
