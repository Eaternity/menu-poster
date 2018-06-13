const {groupBy, map, pipe, reduce, uniqBy, values} = require('ramda')

const {
  adjustProductionDateAndMenuLineId,
  generateComponent,
  generateMenu,
  generateProduct,
  generateProductionDate,
  replaceWeirdChars
} = require('../utils')

module.exports.parse = ({menuCollectionId, productCollectionId, rawData}) => {
  const extractFields = map(jsonRow => ({
    /*
        some amounts are given as decimals but with an ',' that needs to be
        turned into a '.'
         */
    ingredientAmount: jsonRow['4 people (g)'].replace(',', '.'),
    menuTitle: replaceWeirdChars(jsonRow['Recipe']),
    ingredientTitle: jsonRow['Ingredient (database)'],
    productionDate: generateProductionDate(jsonRow['week']),
    origin: jsonRow['Origin'],
    transport: jsonRow['Transport'],
    production: jsonRow['Production'],
    preservation: jsonRow['Preservation'],
    processing: jsonRow['Processing'],
    salesNumber:
      jsonRow[
        'Sales (= by how many people a recipe has been eaten in a certain week)'
      ]
  }))

  const addTemporaryId = map(jsonRow => ({
    ...jsonRow,
    id: `${jsonRow.menuTitle}_${jsonRow.productionDate}`
  }))

  const groupById = groupBy(menu => menu.id)

  const convertToMenu = map(dataByMenuTitle => {
    const [{menuTitle, productionDate}] = dataByMenuTitle

    const components = dataByMenuTitle.map(
      ({
        ingredientAmount,
        ingredientTitle,
        origin,
        preservation,
        processing,
        production,
        transport
      }) => {
        const product = generateProduct({
          title: ingredientTitle,
          productCollectionId,
          configurationPossibilities: {
            origin,
            transport,
            production,
            preservation,
            processing
          }
        })

        return generateComponent({amount: ingredientAmount, product})
      }
    )

    return generateMenu({
      components,
      title: menuTitle,
      productionDate,
      menuCollectionId
    })
  })

  const groupByProductionDate = groupBy(menu => menu.productionDate)

  const distributeMenusForCalendarView = map(menusGroupedByProductionDate => {
    const menusWithMenuLineInfo = menusGroupedByProductionDate.map(
      (menu, index) => {
        const menuLineId = index + 1

        return {
          ...menu,
          menuLineTitle: `Box ${menuLineId}`,
          /*
            adjustProductionDateAndMenuLineId adjusts productionDate and
            menuLineId so the menus get spread out over the week in the Calendar view.
            */
          ...adjustProductionDateAndMenuLineId({
            menuLineId,
            productionDate: menu.productionDate
          })
        }
      }
    )

    return menusWithMenuLineInfo
  })

  const extractMenus = pipe(
    extractFields,
    addTemporaryId,
    groupById,
    values,
    convertToMenu,
    groupByProductionDate,
    distributeMenusForCalendarView,
    values,
    reduce((acc, menus) => [...acc, ...menus], [])
  )

  const menus = extractMenus(rawData)

  const allProducts = menus.reduce(
    (acc, menu) => [...acc, ...menu.components.map(({component}) => component)],
    []
  )

  const uniqueProducts = uniqBy(product => product.title, allProducts)

  /*
      Correct the product id! The menu potentiall contains
      products with null pointer ids because the products where
      made unique... Could for sure be done more elegantly by
      keeping track of all products from the beginning but...
      */
  const menusWithUniqueProductIds = menus.map(menu => {
    const {components} = menu
    const componentsWithUniqueProductIds = components.map(component => {
      const uniqueProduct = uniqueProducts.find(
        product => product.title === component.component.title
      )
      return {
        ...component,
        component: {
          id: uniqueProduct.id,
          type: uniqueProduct.type
        }
      }
    })

    return {
      ...menu,
      components: componentsWithUniqueProductIds
    }
  })

  return {menus: menusWithUniqueProductIds, products: uniqueProducts}
}
