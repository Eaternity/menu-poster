const {groupBy, map, pipe, reduce, uniqBy, values} = require('ramda')
const hash = require('object-hash')
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
    production: jsonRow['Production']
      .replace('/', ',')
      .replace('sustainable', 'sustainable-fish')
      .replace('wild', 'wild-caught'),
    preservation: jsonRow['Preservation'],
    processing: jsonRow['Processing'],
    salesNumber:
      jsonRow[
        'Sales (= by how many people a recipe has been eaten in a certain week)'
      ]
  }))

  const addTemporaryId = map(jsonRow => ({
    ...jsonRow,
    id: `${jsonRow.menuTitle}_${jsonRow.productionDate}_${jsonRow.salesNumber}`
  }))

  const groupById = groupBy(menu => menu.id)

  const convertToMenu = map(dataByCustomId => {
    const [{menuTitle, productionDate, salesNumber}] = dataByCustomId

    const components = dataByCustomId.map(
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
      salesNumber,
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
        component: uniqueProduct
      }
    })

    return {
      ...menu,
      components: componentsWithUniqueProductIds
    }
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
  //
  // { id: 'c13f663a-2b15-4e78-be6d-08ef6ae65ac1',
  // menuCollectionId: '1dcb1b69-e9dd-4031-b782-b7fe6b13ffa9',
  // title: 'Aardappelpuree, geroosterde pompoen en koolsalade',
  // imageUrl: '',
  // productionDate: '2017-01-02',
  // menuLineId: 1,
  // menuLineTitle: 'Box 1',
  // servings: 4,
  // serviceStatus: { cloudStatus: 200 },
  // type: 'menu',
  // components:
  //  [ { section: '', component: [Object], quantity: [Object] },
  //    { section: '', component: [Object], quantity: [Object] },
  //    { section: '', component: [Object], quantity: [Object] },
  //    { section: '', component: [Object], quantity: [Object] },
  //    { section: '', component: [Object], quantity: [Object] },
  //    { section: '', component: [Object], quantity: [Object] },
  //    { section: '', component: [Object], quantity: [Object] },
  //    { section: '', component: [Object], quantity: [Object] },
  //    { section: '', component: [Object], quantity: [Object] } ] }
  const supplies = menusWithUniqueProductIds.map((menu, index) => ({
    'request-id': index,
    supply: {
      'supply-date': menu.productionDate,
      id: hash(menu),
      ingredients: menu.components.map(component => ({
        amount: (component.quantity.amount / 4) * menu.salesNumber,
        unit: 'gram',
        id: component.component.id,
        names: [
          {language: 'de', value: component.component.title},
          {language: 'nl', value: component.component.title}
        ],
        origin: component.component.configurationPossibilities.origin,
        transport: component.component.configurationPossibilities.transport,
        production: component.component.configurationPossibilities.production,
        preservation:
          component.component.configurationPossibilities.preservation,
        processing: component.component.configurationPossibilities.processing
      }))
    }
  }))
  return {supplies, menus: menusWithUniqueProductIds, products: uniqueProducts}
}
