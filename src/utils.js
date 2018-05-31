const moment = require('moment')

const {v4} = require('uuid')

module.exports.generateProduct = ({title, productCollectionId}) => ({
  id: v4(),
  title,
  type: 'product',
  productCollectionId,
  configurationPossibilities: {}
})

module.exports.generateProductionDate = week => {
  const numWeeksToAdd = Number(week)
  const productionDate = moment('2017-01-01', 'YYYY-MM-DD')
    .add(numWeeksToAdd, 'week')
    // first is a Sunday...
    .add(1, 'day')
    .format('YYYY-MM-DD')
  return productionDate
}

module.exports.adjustProductionDate = ({menuLineId, productionDate}) => {
  if (menuLineId > 21) {
    throw new Error(
      'more then 21 menus in a week. Menu will not show up in the UI'
    )
  }

  const daysToAdd = Math.floor((menuLineId - 1) / 3)
  return moment(productionDate)
    .add(daysToAdd, 'day')
    .format('YYYY-MM-DD')
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
  title = ''
}) => ({
  id: v4(),
  menuCollectionId,
  title,
  imageUrl: '',
  productionDate,
  menuLineId,
  menuLineTitle: '',
  servings: 1,
  serviceStatus: {
    cloudStatus: cloudStatus || 200
  },
  type: 'menu',
  components
})
