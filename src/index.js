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
  sourceFile: './data/willemDreesSmall.csv',
  apiKey: 'MTg5djV2cGI3bzZpNGc2Zjd2dnA0aGMzYWI5Z2doMG0=',
  suppliesOutputFile: id => `./data/supplies${id}.json`,
  baseUrl: 'https://carrot.eaternity.ch',
  cloudUrl:
    'https://develop-dot-webservice-dot-eaternity-cloud-2.appspot.com/api/kitchens//supplies/batch',
  menuCollectionId: '487f7d51-e992-460d-bdf5-ed242d3f61d1',
  productCollectionId: '88b22672-f5eb-4f97-9df1-0441ed40a6c8',
  jwt:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiIiwiZW1haWwiOiJjcnVnb3BlamVzQDJlbWVhLmNvbSIsImZpcnN0TmFtZSI6IiIsImxhc3ROYW1lIjoiIn0sImlhdCI6MTUyODg5Mzc5NywiZXhwIjoxNTI4OTgwMTk3fQ.0_txC6ioVBsKtN-2j15uX1k9reUp3pee_gJkYWaRmtc'
})
