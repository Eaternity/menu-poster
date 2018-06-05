const {catchError, groupBy, map, mergeMap, toArray} = require('rxjs/operators')
const {from} = require('rxjs')
const {uniqBy} = require('ramda')
const csv = require('csvtojson')

const {
  adjustProductionDateAndMenuLineId,
  generateComponent,
  generateMenu,
  generateProduct,
  generateProductionDate
} = require('./utils')
const {postProductsThenPostMenus} = require('./postProductsThenPostMenus')

const csvFilePath = './data/willemDrees.csv'

const main = async ({baseUrl, jwt, menuCollectionId, productCollectionId}) => {
  const rowArray = await csv({
    delimiter: ';',
    noheader: false,
    trim: true
  }).fromFile(csvFilePath)

  const source = from(rowArray)

  source
    .pipe(
      // comvert row data into right format
      map(jsonRow => {
        const rowWithCorrectKeys = {
          ingredientAmount: jsonRow['4 people (g)'],
          menuTitle: jsonRow['Recipe'],
          ingredientTitle: jsonRow['Ingredient (database)'],
          productionDate: generateProductionDate(jsonRow['week']),
          origin: jsonRow['Origin'],
          transport: jsonRow['Transport'],
          production: jsonRow['Production'],
          preservation: jsonRow['Preservation'],
          processing: jsonRow['Processing']
        }

        return rowWithCorrectKeys
      }),
      // group row data by menu title
      groupBy(({menuTitle}) => menuTitle),
      mergeMap(group => group.pipe(toArray())),
      // extract components and generate a menu from each group
      map(dataGroupedByMenu => {
        const [{menuTitle, productionDate}] = dataGroupedByMenu

        const components = dataGroupedByMenu.map(
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
      }),
      /*
      group menu collection by production date because there is only one
      date coming from the week given in the original data
       */
      groupBy(({productionDate}) => productionDate),
      mergeMap(group => group.pipe(toArray())),
      // map over menus grouped by production date and use index as menuLineId
      map(menusGroupedByProductionDate => {
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
      }),
      // get rid of the productionDate grouping
      toArray(),
      map(menus => menus.reduce((prev, curr) => [...prev, ...curr])),
      catchError(err => console.error(err))
    )
    .subscribe(menus => {
      const allProducts = menus.reduce(
        (acc, menu) => [
          ...acc,
          ...menu.components.map(({component}) => component)
        ],
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

      postProductsThenPostMenus({
        baseUrl,
        jwt,
        menus: menusWithUniqueProductIds,
        products: uniqueProducts
      })
    })
}

main({
  baseUrl: 'https://carrot.eaternity.ch',
  menuCollectionId: '2ca26df3-7947-482f-80b8-430b1de424a8',
  productCollectionId: 'e2273b22-7b66-4920-a134-63ae9f0864af',
  jwt:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiIiwiZW1haWwiOiJtbXVuZGVyQGVhdGVybml0eS5jaCIsImZpcnN0TmFtZSI6IiIsImxhc3ROYW1lIjoiIn0sImlhdCI6MTUyODExOTI5NiwiZXhwIjoxNTI4MjA1Njk2fQ.FcYbvRvXSreIHE69WZJr6IB3dtuwORVHKLuCJ8NTSFI'
})
