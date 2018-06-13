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
    console.log(
      'manually post supplies in file ' +
        suppliesOutputFile +
        ' to eaternity cloud.'
    )

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
  apiKey: 'MWg1c2Z6ZTRkNWoybXVhNDFmbndlMnlldjU5aDJnZTc=',
  suppliesOutputFile: id => `./data/supplies${id}.json`,
  baseUrl: 'https://carrot.eaternity.ch',
  cloudUrl:
    'https://develop-dot-webservice-dot-eaternity-cloud-2.appspot.com/api/kitchens/8e17bd3b-c752-4ff9-86b9-62b112df6b71/supplies/batch',
  menuCollectionId: '8e17bd3b-c752-4ff9-86b9-62b112df6b71',
  productCollectionId: 'bd5b473e-b9fd-44ce-b42b-cb460eb78039',
  jwt:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiIiwiZW1haWwiOiJqaGlua2VsbWFubit3ZC1zdXBwbGllczFAZWF0ZXJuaXR5LmNoIiwiZmlyc3ROYW1lIjoiIiwibGFzdE5hbWUiOiIifSwiaWF0IjoxNTI4ODgzMzMwLCJleHAiOjE1Mjg5Njk3MzB9.qmFeV1rpqJVRM_EF2BMdWu3CNthfldlem6LZ_mgN_xc'
})
