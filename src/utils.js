const moment = require('moment')

const {v4} = require('uuid')

module.exports.generateProduct = ({
  configurationPossibilities,
  title,
  productCollectionId
}) => ({
  id: v4(),
  title,
  type: 'product',
  productCollectionId,
  configurationPossibilities
})

module.exports.generateProductionDate = week => {
  const numWeeksToAdd = Number(week) - 1
  const productionDate = moment('2017-01-01', 'YYYY-MM-DD')
    .add(numWeeksToAdd, 'week')
    // first is a Sunday...
    .add(1, 'day')
    .format('YYYY-MM-DD')

  return productionDate
}

/*
The idea is that this function will fill up the calendar view column by column (day by day)...
 */
module.exports.adjustProductionDateAndMenuLineId = ({
  menuLineId,
  productionDate
}) => {
  if (menuLineId > 21) {
    throw new Error(
      'more then 21 menus in a week. Menu will not show up in the UI'
    )
  }

  const correctedMenuLineId = menuLineId % 3 === 0 ? 3 : menuLineId % 3
  const daysToAdd = Math.floor((menuLineId - 1) / 3)
  const correctedProductionDate = moment(productionDate)
    .add(daysToAdd, 'day')
    .format('YYYY-MM-DD')

  return {
    productionDate: correctedProductionDate,
    menuLineId: correctedMenuLineId
  }
}

module.exports.generateComponent = ({amount, product}) => ({
  section: '',
  component: product,
  quantity: {
    amount,
    unit: 'GRAM'
  }
})

module.exports.generateMenu = ({
  components,
  cloudStatus,
  productionDate,
  menuLineId,
  menuCollectionId,
  salesNumber,
  title = ''
}) => ({
  id: v4(),
  menuCollectionId,
  title,
  imageUrl: '',
  productionDate,
  menuLineId,
  menuLineTitle: '',
  salesNumber,
  servings: 4,
  serviceStatus: {
    cloudStatus: cloudStatus || 200
  },
  type: 'menu',
  components
})

module.exports.replaceWeirdChars = string => {
  return string.replace('Ã¶', 'ö')
}
