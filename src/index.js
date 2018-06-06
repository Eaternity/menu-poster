const csv = require('csvtojson')

const {parse} = require('./parsers/willemDrees')
const {postProductsThenPostMenus} = require('./postProductsThenPostMenus')

const main = async ({
  baseUrl,
  dryrun,
  jwt,
  menuCollectionId,
  productCollectionId,
  sourceFile
}) => {
  try {
    const rawData = await csv({
      delimiter: ';',
      noheader: false,
      trim: true
    }).fromFile(sourceFile)

    const {menus, products} = parse({
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
  } catch (err) {
    console.error(err)
  }
}

main({
  dryrun: true, // when true nothing is POSTed
  sourceFile: './data/willemDrees.csv',
  baseUrl: 'https://carrot.eaternity.ch',
  menuCollectionId: '2ca26df3-7947-482f-80b8-430b1de424a8',
  productCollectionId: 'e2273b22-7b66-4920-a134-63ae9f0864af',
  jwt:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiIiwiZW1haWwiOiJtbXVuZGVyQGVhdGVybml0eS5jaCIsImZpcnN0TmFtZSI6IiIsImxhc3ROYW1lIjoiIn0sImlhdCI6MTUyODExOTI5NiwiZXhwIjoxNTI4MjA1Njk2fQ.FcYbvRvXSreIHE69WZJr6IB3dtuwORVHKLuCJ8NTSFI'
})
