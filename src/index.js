const csv = require('csvtojson')

const {api} = require('./api')
const {parse} = require('./parsers/willemDrees')
const {postProductsThenPostMenus} = require('./postProductsThenPostMenus')

var fs = require('fs')

const main = async ({
  apiKey,
  baseUrl,
  cloudUrl,
  dryrun,
  jwt,
  menuCollectionId,
  productCollectionId,
  sourceFile,
  suppliesOutputFile
}) => {
  try {
    const rawData = await csv({
      delimiter: ',',
      noheader: false,
      trim: true
    }).fromFile(sourceFile)

    const {supplies, menus, products} = parse({
      rawData,
      menuCollectionId,
      productCollectionId
    })
    if (!dryrun) {
      postProductsThenPostMenus({
        baseUrl,
        jwt,
        menus,
        products
      })
    } else {
      // log stuff out for debugging here
      console.log('number of menus', menus.length)
      console.log('number of products', products.length)
    }

    var i,
      j,
      temparray,
      chunk = 50
    var succesfulSupplyPosts = 0
    for (i = 0, j = supplies.length; i < j; i += chunk) {
      temparray = supplies.slice(i, i + chunk)
      if (!dryrun) {
        api
          .postSupplies({cloudUrl, apiKey, supplyRequests: temparray})
          .then(console.log(succesfulSupplyPosts++))
      }
      fs.writeFile(
        suppliesOutputFile(i),
        JSON.stringify(temparray, null, 2),
        function(err) {
          if (err) {
            console.log(err)
          }
        }
      )
    }
  } catch (err) {
    console.error(err)
  }
}

main({
  dryrun: false, // when true nothing is POSTed
  sourceFile: './data/willemDrees.csv',
  apiKey: 'M3Y1ZzR5OGc4ZHo3NnRqbnU5bjc5MG5xNnVjbTN6bWg=',
  suppliesOutputFile: id => `./data/supplies${id}.json`,
  baseUrl: 'https://carrot.eaternity.ch',
  cloudUrl:
    'https://develop-dot-webservice-dot-eaternity-cloud-2.appspot.com/api/kitchens/ebf192e3-4c30-40d3-9869-3b30ddecbbdb/supplies/batch',
  menuCollectionId: 'ebf192e3-4c30-40d3-9869-3b30ddecbbdb',
  productCollectionId: 'cb682cd4-b400-4895-ae95-9fe9fd26b91b',
  jwt:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFiMjRkMjM2LTU2ZGEtNDI1OS05OGNkLTcyZTViYjc5YzM2NyIsImlhdCI6MTUyODg4NTk5OSwiZXhwIjoxNTI4OTcyMzk5fQ.chMwKYaDI7TTrHh5-9N2h_oqZV9uZLlMWgBqtd45c_E'
})
