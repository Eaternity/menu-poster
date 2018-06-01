const {catchError, groupBy, map, mergeMap, toArray} = require('rxjs/operators')
const {from} = require('rxjs')
const {uniqBy} = require('ramda')
const csv = require('csvtojson')

const {
  adjustProductionDate,
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
      // group menu collection by production date because there is only one
      // date coming from the week given in the original data
      groupBy(({productionDate}) => productionDate),
      mergeMap(group => group.pipe(toArray())),
      // map over menus grouped by production date and use index as menuLineId
      // TODO: distribute menus over all days of the week
      map(menusGroupedByProductionDate => {
        const menusWithMenuLineInfo = menusGroupedByProductionDate.map(
          (menu, index) => {
            // TODO: Spread menus out over the week to show them allProducts
            const menuLineId = index + 1
            const correctedMenuLineId =
              menuLineId % 3 === 0 ? 3 : menuLineId % 3

            return {
              ...menu,
              menuLineId: correctedMenuLineId,
              menuLineTitle: `Box ${menuLineId}`,
              productionDate: adjustProductionDate({
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

      // Correct the product id! The menu potentiall contains
      // products with null pointer ids because the products where
      // made unique... Could for sure be done more elegantly by
      // keeping track of all products from the beginning but I
      // can't be bothered atm
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

// const mmunderAtCarrot = {
//   baseUrl: 'https://carrot.eaternity.ch',
//   menuCollectionId: '5d8ad331-e39e-4a8d-be30-d1963dd10754',
//   productCollectionId: '9397ee78-b6b8-4e7d-b373-021dbfa41905',
//   jwt:
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjczNDMzZGNhLTQwMzYtNGM4OS05NTI3LTA4NTA0MzYwMTRhNCIsImlhdCI6MTUyNzc3NjkwOCwiZXhwIjoxNTI3ODYzMzA4fQ.JyM8jpIsnleQzDDog25UEHs3QuGP8mxehas82s_Z5YQ'
// }

main({
  baseUrl: 'http://localhost:5001',
  menuCollectionId: 'af6e444c-8fdd-4ed2-a13c-6f478cf267aa',
  productCollectionId: 'ac15ae68-c918-4ce8-8e57-0a1479abaeb1',
  jwt:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU0YTIxNGI5LTRmYTItNDNmMS05ZjlkLWM4YTg0MWZhZjllMCIsImlhdCI6MTUyNzc3NzQ1MiwiZXhwIjoxNTMwMzY5NDUyfQ.QGn-NhwBQwIOjbKNK6usXyclyfwwGKd-aMwX-zEnsn4'
})
