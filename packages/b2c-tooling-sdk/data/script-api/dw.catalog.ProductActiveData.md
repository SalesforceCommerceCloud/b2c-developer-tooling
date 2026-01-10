<!-- prettier-ignore-start -->
# Class ProductActiveData

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.object.ActiveData](dw.object.ActiveData.md)
        - [dw.catalog.ProductActiveData](dw.catalog.ProductActiveData.md)

Represents the active data for a [Product](dw.catalog.Product.md) in Commerce Cloud Digital.


## Property Summary

| Property | Description |
| --- | --- |
| [availableDate](#availabledate): [Date](TopLevel.Date.md) `(read-only)` | Returns the date the product became available on the site, or  `null` if none has been set. |
| [avgGrossMarginPercentDay](#avggrossmarginpercentday): [Number](TopLevel.Number.md) `(read-only)` | Returns the average gross margin percentage of the product,  over the most recent day for the site, or `null`  if none has been set or the value is no longer valid. |
| [avgGrossMarginPercentMonth](#avggrossmarginpercentmonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the average gross margin percentage of the product,  over the most recent 30 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [avgGrossMarginPercentWeek](#avggrossmarginpercentweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the average gross margin percentage of the product,  over the most recent 7 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [avgGrossMarginPercentYear](#avggrossmarginpercentyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the average gross margin percentage of the product,  over the most recent 365 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [avgGrossMarginValueDay](#avggrossmarginvalueday): [Number](TopLevel.Number.md) `(read-only)` | Returns the average gross margin value of the product,  over the most recent day for the site, or `null`  if none has been set or the value is no longer valid. |
| [avgGrossMarginValueMonth](#avggrossmarginvaluemonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the average gross margin value of the product,  over the most recent 30 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [avgGrossMarginValueWeek](#avggrossmarginvalueweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the average gross margin value of the product,  over the most recent 7 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [avgGrossMarginValueYear](#avggrossmarginvalueyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the average gross margin value of the product,  over the most recent 365 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [avgSalesPriceDay](#avgsalespriceday): [Number](TopLevel.Number.md) `(read-only)` | Returns the average sales price for the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [avgSalesPriceMonth](#avgsalespricemonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the average sales price for the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [avgSalesPriceWeek](#avgsalespriceweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the average sales price for the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [avgSalesPriceYear](#avgsalespriceyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the average sales price for the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [conversionDay](#conversionday): [Number](TopLevel.Number.md) `(read-only)` | Returns the conversion rate of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [conversionMonth](#conversionmonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the conversion rate of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [conversionWeek](#conversionweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the conversion rate of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [conversionYear](#conversionyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the conversion rate of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [costPrice](#costprice): [Number](TopLevel.Number.md) `(read-only)` | Returns the cost price for the product for the site,  or `null` if none has been set or the value is no longer valid. |
| [daysAvailable](#daysavailable): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of days the product has been available on the site. |
| [impressionsDay](#impressionsday): [Number](TopLevel.Number.md) `(read-only)` | Returns the impressions of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [impressionsMonth](#impressionsmonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the impressions of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [impressionsWeek](#impressionsweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the impressions of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [impressionsYear](#impressionsyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the impressions of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [lookToBookRatioDay](#looktobookratioday): [Number](TopLevel.Number.md) `(read-only)` | Returns the look to book ratio of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [lookToBookRatioMonth](#looktobookratiomonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the look to book ratio of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [lookToBookRatioWeek](#looktobookratioweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the look to book ratio of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [lookToBookRatioYear](#looktobookratioyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the look to book ratio of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [ordersDay](#ordersday): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of orders containing the product, over the most  recent day for the site, or `null` if none has been set  or the value is no longer valid. |
| [ordersMonth](#ordersmonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of orders containing the product, over the most  recent 30 days for the site, or `null` if none has been set  or the value is no longer valid. |
| [ordersWeek](#ordersweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of orders containing the product, over the most  recent 7 days for the site, or `null` if none has been set  or the value is no longer valid. |
| [ordersYear](#ordersyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of orders containing the product, over the most  recent 365 days for the site, or `null` if none has been set  or the value is no longer valid. |
| [returnRate](#returnrate): [Number](TopLevel.Number.md) `(read-only)` | Returns the return rate for the product for the site,  or `null` if none has been set or the value is no longer valid. |
| [revenueDay](#revenueday): [Number](TopLevel.Number.md) `(read-only)` | Returns the revenue of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [revenueMonth](#revenuemonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the revenue of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [revenueWeek](#revenueweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the revenue of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [revenueYear](#revenueyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the revenue of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [salesVelocityDay](#salesvelocityday): [Number](TopLevel.Number.md) `(read-only)` | Returns the sales velocity of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [salesVelocityMonth](#salesvelocitymonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the sales velocity of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [salesVelocityWeek](#salesvelocityweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the sales velocity of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [salesVelocityYear](#salesvelocityyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the sales velocity of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [unitsDay](#unitsday): [Number](TopLevel.Number.md) `(read-only)` | Returns the units of the product ordered over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [unitsMonth](#unitsmonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the units of the product ordered over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [unitsWeek](#unitsweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the units of the product ordered over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [unitsYear](#unitsyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the units of the product ordered over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [viewsDay](#viewsday): [Number](TopLevel.Number.md) `(read-only)` | Returns the views of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [viewsMonth](#viewsmonth): [Number](TopLevel.Number.md) `(read-only)` | Returns the views of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [viewsWeek](#viewsweek): [Number](TopLevel.Number.md) `(read-only)` | Returns the views of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [viewsYear](#viewsyear): [Number](TopLevel.Number.md) `(read-only)` | Returns the views of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAvailableDate](dw.catalog.ProductActiveData.md#getavailabledate)() | Returns the date the product became available on the site, or  `null` if none has been set. |
| [getAvgGrossMarginPercentDay](dw.catalog.ProductActiveData.md#getavggrossmarginpercentday)() | Returns the average gross margin percentage of the product,  over the most recent day for the site, or `null`  if none has been set or the value is no longer valid. |
| [getAvgGrossMarginPercentMonth](dw.catalog.ProductActiveData.md#getavggrossmarginpercentmonth)() | Returns the average gross margin percentage of the product,  over the most recent 30 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [getAvgGrossMarginPercentWeek](dw.catalog.ProductActiveData.md#getavggrossmarginpercentweek)() | Returns the average gross margin percentage of the product,  over the most recent 7 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [getAvgGrossMarginPercentYear](dw.catalog.ProductActiveData.md#getavggrossmarginpercentyear)() | Returns the average gross margin percentage of the product,  over the most recent 365 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [getAvgGrossMarginValueDay](dw.catalog.ProductActiveData.md#getavggrossmarginvalueday)() | Returns the average gross margin value of the product,  over the most recent day for the site, or `null`  if none has been set or the value is no longer valid. |
| [getAvgGrossMarginValueMonth](dw.catalog.ProductActiveData.md#getavggrossmarginvaluemonth)() | Returns the average gross margin value of the product,  over the most recent 30 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [getAvgGrossMarginValueWeek](dw.catalog.ProductActiveData.md#getavggrossmarginvalueweek)() | Returns the average gross margin value of the product,  over the most recent 7 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [getAvgGrossMarginValueYear](dw.catalog.ProductActiveData.md#getavggrossmarginvalueyear)() | Returns the average gross margin value of the product,  over the most recent 365 days for the site, or `null`  if none has been set or the value is no longer valid. |
| [getAvgSalesPriceDay](dw.catalog.ProductActiveData.md#getavgsalespriceday)() | Returns the average sales price for the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getAvgSalesPriceMonth](dw.catalog.ProductActiveData.md#getavgsalespricemonth)() | Returns the average sales price for the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getAvgSalesPriceWeek](dw.catalog.ProductActiveData.md#getavgsalespriceweek)() | Returns the average sales price for the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getAvgSalesPriceYear](dw.catalog.ProductActiveData.md#getavgsalespriceyear)() | Returns the average sales price for the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getConversionDay](dw.catalog.ProductActiveData.md#getconversionday)() | Returns the conversion rate of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getConversionMonth](dw.catalog.ProductActiveData.md#getconversionmonth)() | Returns the conversion rate of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getConversionWeek](dw.catalog.ProductActiveData.md#getconversionweek)() | Returns the conversion rate of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getConversionYear](dw.catalog.ProductActiveData.md#getconversionyear)() | Returns the conversion rate of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getCostPrice](dw.catalog.ProductActiveData.md#getcostprice)() | Returns the cost price for the product for the site,  or `null` if none has been set or the value is no longer valid. |
| [getDaysAvailable](dw.catalog.ProductActiveData.md#getdaysavailable)() | Returns the number of days the product has been available on the site. |
| [getImpressionsDay](dw.catalog.ProductActiveData.md#getimpressionsday)() | Returns the impressions of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getImpressionsMonth](dw.catalog.ProductActiveData.md#getimpressionsmonth)() | Returns the impressions of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getImpressionsWeek](dw.catalog.ProductActiveData.md#getimpressionsweek)() | Returns the impressions of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getImpressionsYear](dw.catalog.ProductActiveData.md#getimpressionsyear)() | Returns the impressions of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getLookToBookRatioDay](dw.catalog.ProductActiveData.md#getlooktobookratioday)() | Returns the look to book ratio of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getLookToBookRatioMonth](dw.catalog.ProductActiveData.md#getlooktobookratiomonth)() | Returns the look to book ratio of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getLookToBookRatioWeek](dw.catalog.ProductActiveData.md#getlooktobookratioweek)() | Returns the look to book ratio of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getLookToBookRatioYear](dw.catalog.ProductActiveData.md#getlooktobookratioyear)() | Returns the look to book ratio of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getOrdersDay](dw.catalog.ProductActiveData.md#getordersday)() | Returns the number of orders containing the product, over the most  recent day for the site, or `null` if none has been set  or the value is no longer valid. |
| [getOrdersMonth](dw.catalog.ProductActiveData.md#getordersmonth)() | Returns the number of orders containing the product, over the most  recent 30 days for the site, or `null` if none has been set  or the value is no longer valid. |
| [getOrdersWeek](dw.catalog.ProductActiveData.md#getordersweek)() | Returns the number of orders containing the product, over the most  recent 7 days for the site, or `null` if none has been set  or the value is no longer valid. |
| [getOrdersYear](dw.catalog.ProductActiveData.md#getordersyear)() | Returns the number of orders containing the product, over the most  recent 365 days for the site, or `null` if none has been set  or the value is no longer valid. |
| [getReturnRate](dw.catalog.ProductActiveData.md#getreturnrate)() | Returns the return rate for the product for the site,  or `null` if none has been set or the value is no longer valid. |
| [getRevenueDay](dw.catalog.ProductActiveData.md#getrevenueday)() | Returns the revenue of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getRevenueMonth](dw.catalog.ProductActiveData.md#getrevenuemonth)() | Returns the revenue of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getRevenueWeek](dw.catalog.ProductActiveData.md#getrevenueweek)() | Returns the revenue of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getRevenueYear](dw.catalog.ProductActiveData.md#getrevenueyear)() | Returns the revenue of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getSalesVelocityDay](dw.catalog.ProductActiveData.md#getsalesvelocityday)() | Returns the sales velocity of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getSalesVelocityMonth](dw.catalog.ProductActiveData.md#getsalesvelocitymonth)() | Returns the sales velocity of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getSalesVelocityWeek](dw.catalog.ProductActiveData.md#getsalesvelocityweek)() | Returns the sales velocity of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getSalesVelocityYear](dw.catalog.ProductActiveData.md#getsalesvelocityyear)() | Returns the sales velocity of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getUnitsDay](dw.catalog.ProductActiveData.md#getunitsday)() | Returns the units of the product ordered over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getUnitsMonth](dw.catalog.ProductActiveData.md#getunitsmonth)() | Returns the units of the product ordered over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getUnitsWeek](dw.catalog.ProductActiveData.md#getunitsweek)() | Returns the units of the product ordered over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getUnitsYear](dw.catalog.ProductActiveData.md#getunitsyear)() | Returns the units of the product ordered over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getViewsDay](dw.catalog.ProductActiveData.md#getviewsday)() | Returns the views of the product, over the most recent day  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getViewsMonth](dw.catalog.ProductActiveData.md#getviewsmonth)() | Returns the views of the product, over the most recent 30 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getViewsWeek](dw.catalog.ProductActiveData.md#getviewsweek)() | Returns the views of the product, over the most recent 7 days  for the site, or `null` if none has been set or the value  is no longer valid. |
| [getViewsYear](dw.catalog.ProductActiveData.md#getviewsyear)() | Returns the views of the product, over the most recent 365 days  for the site, or `null` if none has been set or the value  is no longer valid. |

### Methods inherited from class ActiveData

[getCustom](dw.object.ActiveData.md#getcustom), [isEmpty](dw.object.ActiveData.md#isempty)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### availableDate
- availableDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date the product became available on the site, or
      `null` if none has been set.



---

### avgGrossMarginPercentDay
- avgGrossMarginPercentDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average gross margin percentage of the product,
      over the most recent day for the site, or `null`
      if none has been set or the value is no longer valid.



---

### avgGrossMarginPercentMonth
- avgGrossMarginPercentMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average gross margin percentage of the product,
      over the most recent 30 days for the site, or `null`
      if none has been set or the value is no longer valid.



---

### avgGrossMarginPercentWeek
- avgGrossMarginPercentWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average gross margin percentage of the product,
      over the most recent 7 days for the site, or `null`
      if none has been set or the value is no longer valid.



---

### avgGrossMarginPercentYear
- avgGrossMarginPercentYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average gross margin percentage of the product,
      over the most recent 365 days for the site, or `null`
      if none has been set or the value is no longer valid.



---

### avgGrossMarginValueDay
- avgGrossMarginValueDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average gross margin value of the product,
      over the most recent day for the site, or `null`
      if none has been set or the value is no longer valid.



---

### avgGrossMarginValueMonth
- avgGrossMarginValueMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average gross margin value of the product,
      over the most recent 30 days for the site, or `null`
      if none has been set or the value is no longer valid.



---

### avgGrossMarginValueWeek
- avgGrossMarginValueWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average gross margin value of the product,
      over the most recent 7 days for the site, or `null`
      if none has been set or the value is no longer valid.



---

### avgGrossMarginValueYear
- avgGrossMarginValueYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average gross margin value of the product,
      over the most recent 365 days for the site, or `null`
      if none has been set or the value is no longer valid.



---

### avgSalesPriceDay
- avgSalesPriceDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average sales price for the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### avgSalesPriceMonth
- avgSalesPriceMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average sales price for the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### avgSalesPriceWeek
- avgSalesPriceWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average sales price for the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### avgSalesPriceYear
- avgSalesPriceYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the average sales price for the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### conversionDay
- conversionDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the conversion rate of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### conversionMonth
- conversionMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the conversion rate of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### conversionWeek
- conversionWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the conversion rate of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### conversionYear
- conversionYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the conversion rate of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### costPrice
- costPrice: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the cost price for the product for the site,
      or `null` if none has been set or the value is no longer valid.



---

### daysAvailable
- daysAvailable: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of days the product has been available on the site.
      The number is calculated based on the current date and the date the
      product became available on the site, or if that date has not been set,
      the date the product was created in the system.


    **See Also:**
    - [getAvailableDate()](dw.catalog.ProductActiveData.md#getavailabledate)


---

### impressionsDay
- impressionsDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the impressions of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### impressionsMonth
- impressionsMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the impressions of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### impressionsWeek
- impressionsWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the impressions of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### impressionsYear
- impressionsYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the impressions of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### lookToBookRatioDay
- lookToBookRatioDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the look to book ratio of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### lookToBookRatioMonth
- lookToBookRatioMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the look to book ratio of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### lookToBookRatioWeek
- lookToBookRatioWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the look to book ratio of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### lookToBookRatioYear
- lookToBookRatioYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the look to book ratio of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### ordersDay
- ordersDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of orders containing the product, over the most
      recent day for the site, or `null` if none has been set
      or the value is no longer valid.



---

### ordersMonth
- ordersMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of orders containing the product, over the most
      recent 30 days for the site, or `null` if none has been set
      or the value is no longer valid.



---

### ordersWeek
- ordersWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of orders containing the product, over the most
      recent 7 days for the site, or `null` if none has been set
      or the value is no longer valid.



---

### ordersYear
- ordersYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of orders containing the product, over the most
      recent 365 days for the site, or `null` if none has been set
      or the value is no longer valid.



---

### returnRate
- returnRate: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the return rate for the product for the site,
      or `null` if none has been set or the value is no longer valid.



---

### revenueDay
- revenueDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the revenue of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### revenueMonth
- revenueMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the revenue of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### revenueWeek
- revenueWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the revenue of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### revenueYear
- revenueYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the revenue of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### salesVelocityDay
- salesVelocityDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the sales velocity of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### salesVelocityMonth
- salesVelocityMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the sales velocity of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### salesVelocityWeek
- salesVelocityWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the sales velocity of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### salesVelocityYear
- salesVelocityYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the sales velocity of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### unitsDay
- unitsDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the units of the product ordered over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### unitsMonth
- unitsMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the units of the product ordered over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### unitsWeek
- unitsWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the units of the product ordered over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### unitsYear
- unitsYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the units of the product ordered over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### viewsDay
- viewsDay: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the views of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### viewsMonth
- viewsMonth: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the views of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### viewsWeek
- viewsWeek: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the views of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

### viewsYear
- viewsYear: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the views of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.



---

## Method Details

### getAvailableDate()
- getAvailableDate(): [Date](TopLevel.Date.md)
  - : Returns the date the product became available on the site, or
      `null` if none has been set.


    **Returns:**
    - the date the product became available.


---

### getAvgGrossMarginPercentDay()
- getAvgGrossMarginPercentDay(): [Number](TopLevel.Number.md)
  - : Returns the average gross margin percentage of the product,
      over the most recent day for the site, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the average gross margin percentage over the last day.


---

### getAvgGrossMarginPercentMonth()
- getAvgGrossMarginPercentMonth(): [Number](TopLevel.Number.md)
  - : Returns the average gross margin percentage of the product,
      over the most recent 30 days for the site, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the average gross margin percentage over the last 30 days.


---

### getAvgGrossMarginPercentWeek()
- getAvgGrossMarginPercentWeek(): [Number](TopLevel.Number.md)
  - : Returns the average gross margin percentage of the product,
      over the most recent 7 days for the site, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the average gross margin percentage over the last 7 days.


---

### getAvgGrossMarginPercentYear()
- getAvgGrossMarginPercentYear(): [Number](TopLevel.Number.md)
  - : Returns the average gross margin percentage of the product,
      over the most recent 365 days for the site, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the average gross margin percentage over the last 365 days.


---

### getAvgGrossMarginValueDay()
- getAvgGrossMarginValueDay(): [Number](TopLevel.Number.md)
  - : Returns the average gross margin value of the product,
      over the most recent day for the site, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the average gross margin value over the last day.


---

### getAvgGrossMarginValueMonth()
- getAvgGrossMarginValueMonth(): [Number](TopLevel.Number.md)
  - : Returns the average gross margin value of the product,
      over the most recent 30 days for the site, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the average gross margin value over the last 30 days.


---

### getAvgGrossMarginValueWeek()
- getAvgGrossMarginValueWeek(): [Number](TopLevel.Number.md)
  - : Returns the average gross margin value of the product,
      over the most recent 7 days for the site, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the average gross margin value over the last 7 days.


---

### getAvgGrossMarginValueYear()
- getAvgGrossMarginValueYear(): [Number](TopLevel.Number.md)
  - : Returns the average gross margin value of the product,
      over the most recent 365 days for the site, or `null`
      if none has been set or the value is no longer valid.


    **Returns:**
    - the average gross margin value over the last 365 days.


---

### getAvgSalesPriceDay()
- getAvgSalesPriceDay(): [Number](TopLevel.Number.md)
  - : Returns the average sales price for the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the average sales price over the last day.


---

### getAvgSalesPriceMonth()
- getAvgSalesPriceMonth(): [Number](TopLevel.Number.md)
  - : Returns the average sales price for the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the average sales price over the last 30 days.


---

### getAvgSalesPriceWeek()
- getAvgSalesPriceWeek(): [Number](TopLevel.Number.md)
  - : Returns the average sales price for the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the average sales price over the last 7 days.


---

### getAvgSalesPriceYear()
- getAvgSalesPriceYear(): [Number](TopLevel.Number.md)
  - : Returns the average sales price for the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the average sales price over the last 365 days.


---

### getConversionDay()
- getConversionDay(): [Number](TopLevel.Number.md)
  - : Returns the conversion rate of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the conversion over the last day.


---

### getConversionMonth()
- getConversionMonth(): [Number](TopLevel.Number.md)
  - : Returns the conversion rate of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the conversion over the last 30 days.


---

### getConversionWeek()
- getConversionWeek(): [Number](TopLevel.Number.md)
  - : Returns the conversion rate of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the conversion over the last 7 days.


---

### getConversionYear()
- getConversionYear(): [Number](TopLevel.Number.md)
  - : Returns the conversion rate of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the conversion over the last 365 days.


---

### getCostPrice()
- getCostPrice(): [Number](TopLevel.Number.md)
  - : Returns the cost price for the product for the site,
      or `null` if none has been set or the value is no longer valid.


    **Returns:**
    - the cost price.


---

### getDaysAvailable()
- getDaysAvailable(): [Number](TopLevel.Number.md)
  - : Returns the number of days the product has been available on the site.
      The number is calculated based on the current date and the date the
      product became available on the site, or if that date has not been set,
      the date the product was created in the system.


    **Returns:**
    - the age in days.

    **See Also:**
    - [getAvailableDate()](dw.catalog.ProductActiveData.md#getavailabledate)


---

### getImpressionsDay()
- getImpressionsDay(): [Number](TopLevel.Number.md)
  - : Returns the impressions of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the impressions over the last day.


---

### getImpressionsMonth()
- getImpressionsMonth(): [Number](TopLevel.Number.md)
  - : Returns the impressions of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the impressions over the last 30 days.


---

### getImpressionsWeek()
- getImpressionsWeek(): [Number](TopLevel.Number.md)
  - : Returns the impressions of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the impressions over the last 7 days.


---

### getImpressionsYear()
- getImpressionsYear(): [Number](TopLevel.Number.md)
  - : Returns the impressions of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the impressions over the last 365 days.


---

### getLookToBookRatioDay()
- getLookToBookRatioDay(): [Number](TopLevel.Number.md)
  - : Returns the look to book ratio of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the look to book ratio over the last day.


---

### getLookToBookRatioMonth()
- getLookToBookRatioMonth(): [Number](TopLevel.Number.md)
  - : Returns the look to book ratio of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the look to book ratio over the last 30 days.


---

### getLookToBookRatioWeek()
- getLookToBookRatioWeek(): [Number](TopLevel.Number.md)
  - : Returns the look to book ratio of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the look to book ratio over the last 7 days.


---

### getLookToBookRatioYear()
- getLookToBookRatioYear(): [Number](TopLevel.Number.md)
  - : Returns the look to book ratio of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the look to book ratio over the last 365 days.


---

### getOrdersDay()
- getOrdersDay(): [Number](TopLevel.Number.md)
  - : Returns the number of orders containing the product, over the most
      recent day for the site, or `null` if none has been set
      or the value is no longer valid.


    **Returns:**
    - the orders over the last day.


---

### getOrdersMonth()
- getOrdersMonth(): [Number](TopLevel.Number.md)
  - : Returns the number of orders containing the product, over the most
      recent 30 days for the site, or `null` if none has been set
      or the value is no longer valid.


    **Returns:**
    - the orders over the last 30 days.


---

### getOrdersWeek()
- getOrdersWeek(): [Number](TopLevel.Number.md)
  - : Returns the number of orders containing the product, over the most
      recent 7 days for the site, or `null` if none has been set
      or the value is no longer valid.


    **Returns:**
    - the orders over the last 7 days.


---

### getOrdersYear()
- getOrdersYear(): [Number](TopLevel.Number.md)
  - : Returns the number of orders containing the product, over the most
      recent 365 days for the site, or `null` if none has been set
      or the value is no longer valid.


    **Returns:**
    - the orders over the last 365 days.


---

### getReturnRate()
- getReturnRate(): [Number](TopLevel.Number.md)
  - : Returns the return rate for the product for the site,
      or `null` if none has been set or the value is no longer valid.


    **Returns:**
    - the return rate.


---

### getRevenueDay()
- getRevenueDay(): [Number](TopLevel.Number.md)
  - : Returns the revenue of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the revenue over the last day.


---

### getRevenueMonth()
- getRevenueMonth(): [Number](TopLevel.Number.md)
  - : Returns the revenue of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the revenue over the last 30 days.


---

### getRevenueWeek()
- getRevenueWeek(): [Number](TopLevel.Number.md)
  - : Returns the revenue of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the revenue over the last 7 days.


---

### getRevenueYear()
- getRevenueYear(): [Number](TopLevel.Number.md)
  - : Returns the revenue of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the revenue over the last 365 days.


---

### getSalesVelocityDay()
- getSalesVelocityDay(): [Number](TopLevel.Number.md)
  - : Returns the sales velocity of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the sales velocity over the last day.


---

### getSalesVelocityMonth()
- getSalesVelocityMonth(): [Number](TopLevel.Number.md)
  - : Returns the sales velocity of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the sales velocity over the last 30 days.


---

### getSalesVelocityWeek()
- getSalesVelocityWeek(): [Number](TopLevel.Number.md)
  - : Returns the sales velocity of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the sales velocity over the last 7 days.


---

### getSalesVelocityYear()
- getSalesVelocityYear(): [Number](TopLevel.Number.md)
  - : Returns the sales velocity of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the sales velocity over the last 365 days.


---

### getUnitsDay()
- getUnitsDay(): [Number](TopLevel.Number.md)
  - : Returns the units of the product ordered over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the units over the last day.


---

### getUnitsMonth()
- getUnitsMonth(): [Number](TopLevel.Number.md)
  - : Returns the units of the product ordered over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the units over the last 30 days.


---

### getUnitsWeek()
- getUnitsWeek(): [Number](TopLevel.Number.md)
  - : Returns the units of the product ordered over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the units over the last 7 days.


---

### getUnitsYear()
- getUnitsYear(): [Number](TopLevel.Number.md)
  - : Returns the units of the product ordered over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the units over the last 365 days.


---

### getViewsDay()
- getViewsDay(): [Number](TopLevel.Number.md)
  - : Returns the views of the product, over the most recent day
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the views over the last day.


---

### getViewsMonth()
- getViewsMonth(): [Number](TopLevel.Number.md)
  - : Returns the views of the product, over the most recent 30 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the views over the last 30 days.


---

### getViewsWeek()
- getViewsWeek(): [Number](TopLevel.Number.md)
  - : Returns the views of the product, over the most recent 7 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the views over the last 7 days.


---

### getViewsYear()
- getViewsYear(): [Number](TopLevel.Number.md)
  - : Returns the views of the product, over the most recent 365 days
      for the site, or `null` if none has been set or the value
      is no longer valid.


    **Returns:**
    - the views over the last 365 days.


---

<!-- prettier-ignore-end -->
