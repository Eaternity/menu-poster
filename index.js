const csv = require('csvtojson')
const fs = require('fs')

const csvFilePath = './data/test.csv'
const csvReadStream = fs.createReadStream(csvFilePath, {encoding: 'utf8'})

csv({delimiter: ';', noheader: true, trim: true})
  .fromStream(csvReadStream)
  .on('csv', csvRowArray => {
    const numCols = csvRowArray.length

    console.log(csvRowArray)

    if (numCols !== 12) {
      throw new Error('different number of colums detected')
    }

    // const fieldsMap = {
    //   0: 'productionDate',
    //   1: 'menuTitle',
    //   2: 'servings'
    // }
  })
  .on('done', error => {
    console.log('end')
    console.error(error)
  })
