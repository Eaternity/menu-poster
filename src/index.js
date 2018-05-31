const {
  catchError,
  delay,
  groupBy,
  map,
  mergeMap,
  takeLast,
  toArray
} = require('rxjs/operators')
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
const {api} = require('./api')

const csvFilePath = './data/willemDrees.csv'

const main = async ({jwt, menuCollectionId, productCollectionId}) => {
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
      // extract unique products and post them all, the post menus
      mergeMap(menus => {
        const allMenus = menus.reduce((prev, curr) => [...prev, ...curr])

        const allProducts = allMenus.reduce(
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
        const menusWithUniqueProductIds = allMenus.map(menu => {
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

        const productSource = from(uniqueProducts)

        return productSource.pipe(
          // slow things down a bit
          delay(200),
          mergeMap(product => {
            return api.postProduct({jwt, product}).pipe(
              map(() => {
                console.log('product posted')
                return menusWithUniqueProductIds
              })
            )
          })
        )
      }),
      takeLast(1),
      delay(200),
      mergeMap(menus => {
        const menuSource = from(menus)

        return menuSource.pipe(
          // slow things down a bit
          delay(200),
          mergeMap(menu => {
            return api.postMenu({jwt, menu}).pipe(
              map(() => {
                console.log('menu posted')
              })
            )
          })
        )
      }),
      catchError(err => console.error(err))
    )
    .subscribe()
}

main({
  menuCollectionId: '85b5791c-d417-4217-8ea9-65a9c2ff1f8d',
  productCollectionId: '0561c215-ee90-43c6-80b9-550fcb438d07',
  jwt:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI5Y2M1OTEyLTg5ZDktNDQ3OS1iZGY2LTVkMmM5MWJlZGQ3MiIsImlhdCI6MTUyNzc2MDgxNSwiZXhwIjoxNTMwMzUyODE1fQ.xikAvhEjrkLVkIY82RgpsB9HiaD4yQlKSdPED6BZqWc'
})
