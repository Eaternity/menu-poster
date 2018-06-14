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
  apiKey: 'asldfkjadfjsöslakdjfölsakdjföalsdkjfölasdjk=',
  suppliesOutputFile: id => `./data/supplies${id}.json`,
  baseUrl: 'https://demo.eaternity.ch',
  cloudUrl:
    'https://develop-dot-webservice-dot-eaternity-app.appspot.com/api/kitchens/00b88f92-d8d3-4a0b-8611-8042660ee35d/supplies/batch',
  menuCollectionId: '00b88f92-d8d3-4a0b-8611-8042660ee35d',
  productCollectionId: '773e3c22-3de2-48c3-8b62-3014ebcf21c4',
  jwt:
    'eyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUIeyIZUI'
})
