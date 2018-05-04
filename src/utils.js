const moment = require('moment')

const {v4} = require('uuid')

module.exports.generateStandardProduct = ({title, productCollectionId}) => ({
  id: v4(),
  title,
  type: 'product',
  productCollectionId,
  configurationPossibilities: {}
})

module.exports.generateProductionDate = week => {
  const numWeeksToAdd = Number(week)
  return (
    moment('2017-01-01', 'YYYY-MM-DD')
      .add(numWeeksToAdd, 'week')
      // first is a Sunday...
      .add(1, 'day')
      .format('YYYY-MM-DD')
  )
}
