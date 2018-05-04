const fs = require('fs')

const csv = require('csvtojson')

const {generateProductionDate, generateStandardProduct} = require('./utils')

const csvFilePath = './data/willemDrees.csv'
const csvReadStream = fs.createReadStream(csvFilePath, {encoding: 'utf8'})

let allProducts = []
let allMenus = []
let menu = {
  components: []
}

csv({delimiter: ';', noheader: false, trim: true})
  .fromStream(csvReadStream)
  .on('csv', csvRowArray => {
    const numCols = csvRowArray.length

    if (numCols !== 12) {
      throw new Error('different number of colums detected')
    }

    // remove willem en drees specific columns
    const rowWithRelevantCols = [
      ...csvRowArray.slice(0, 2),
      ...csvRowArray.slice(3, 4),
      ...csvRowArray.slice(5)
    ]

    const fieldsMap = {
      0: 'week',
      1: 'menuTitle',
      2: 'productTitle',
      3: 'origin',
      4: 'transport',
      5: 'production',
      6: 'greenhouse',
      7: 'preservation',
      8: 'processing',
      9: 'amount'
    }

    const jsonRow = rowWithRelevantCols
      .map((cellContent, colIndex) => ({
        [fieldsMap[colIndex]]: cellContent
      }))
      .reduce((prev, curr) => ({...prev, ...curr}), {})

    const {
      menuTitle,
      productTitle,
      origin,
      transport,
      production,
      greenhouse,
      preservation,
      processing,
      week
    } = jsonRow

    const product = {
      ...generateStandardProduct({
        title: productTitle,
        //TODO: manually get productCollectionId from database...
        productCollectionId: 'test id'
      }),
      configurationPossibilities: {
        origin,
        transport,
        production,
        greenhouse,
        preservation,
        processing
      }
    }

    //TODO: while?! same menu title collect products in menus components, then
    // push to all menus
    //TODO: manually get menuCollectionId from database...
    // menu = {
    //   ...menu,
    //   title: menuTitle,
    //   productionDate: generateProductionDate(week),
    //   components: [
    //     ...menu.components,
    //     {
    //       section: '',
    //       component: product
    //     }
    //   ]
    // }

    allProducts.push(product)
  })
  .on('done', error => {
    if (error) {
      console.error(error)
    }
    console.log(allProducts)
    console.log(allMenus)

    // const uniqueProducts = uniqBy(product => product.title)(allProducts)

    // TODO: post all unique products, then post all menus
    // use {request} from universal-rxjs-ajax?! like in eaternity-app api?!
    // you could then do:
    // const source = Observable.of(allProducts).pipe(
    //   map(product => request(...))
    // )
    //
    // you can then wait until all products are posted, then post menus... also
    // easy to throttle, delay etc to not post too fast
  })
