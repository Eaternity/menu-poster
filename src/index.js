const csv = require('csvtojson')
var fs = require('fs')
const {parse} = require('./parsers/willemDrees')
const {postProductsThenPostMenus} = require('./postProductsThenPostMenus')

const main = async ({
  baseUrl,
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
      //example
      // [
      //   {
      //     'request-id': 0,
      //     supply: {
      //       supplier: 'Howeg',
      //       'supply-date': '2014-6-01',
      //       ingredients: [
      //         {
      //           id: '170',
      //           names: [
      //             {language: 'fr', value: "L'huile de colza"},
      //             {language: 'de', value: 'Rapsöl'}
      //           ],
      //           origin: 'Mongolei',
      //           amount: 2047,
      //           transport: 'ground',
      //           production: 'wild-caught',
      //           processing: 'unboned',
      //           conservation: 'canned',
      //           packaging: 'cardboard',
      //           unit: 'gram',
      //           producer: 'Unilever Schweiz GmbH',
      //           storage: 3,
      //           price: 1.2
      //         }
      //       ]
      //     }
      //   }
      // ]
      console.log(
        'manually post supplies in file ' +
          suppliesOutputFile +
          ' to eaternity cloud.'
      )
      fs.writeFile(suppliesOutputFile, supplies, function(err) {
        if (err) {
          console.log(err)
        }
      })
    } else {
      // log stuff out for debugging here
      console.log('number of menus', menus.length)
      console.log('number of products', products.length)
    }
  } catch (err) {
    console.error(err)
  }
}

main({
  dryrun: false, // when true nothing is POSTed
  sourceFile: './data/willemDrees.csv',
  suppliesOutputFile: './data/supplies.json',
  baseUrl: 'https://carrot.eaternity.ch',
  menuCollectionId: '1dcb1b69-e9dd-4031-b782-b7fe6b13ffa9',
  productCollectionId: 'd757f97e-a4f4-4ff5-b3a9-93ffb0209524',
  jwt:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiIiwiZW1haWwiOiJqaGlua2VsbWFubit3ZDZAZWF0ZXJuaXR5LmNoIiwiZmlyc3ROYW1lIjoiIiwibGFzdE5hbWUiOiIifSwiaWF0IjoxNTI4Nzk5NDc0LCJleHAiOjE1Mjg4ODU4NzR9.0JAYSZ9mTyb357gCPb9MVb1B8eyAZj0oQlM80xbSZUg'
})
