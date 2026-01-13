<!-- prettier-ignore-start -->
# Class TaxMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.TaxMgr](dw.order.TaxMgr.md)

Provides methods to access the tax table.


## Constant Summary

| Constant | Description |
| --- | --- |
| [TAX_POLICY_GROSS](#tax_policy_gross): [Number](TopLevel.Number.md) = 0 | Constant representing the gross taxation policy. |
| [TAX_POLICY_NET](#tax_policy_net): [Number](TopLevel.Number.md) = 1 | Constant representing the net taxation policy. |

## Property Summary

| Property | Description |
| --- | --- |
| [customRateTaxClassID](#customratetaxclassid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the tax class that represents items with a custom tax rate. |
| [defaultTaxClassID](#defaulttaxclassid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the default tax class defined for the site. |
| [defaultTaxJurisdictionID](#defaulttaxjurisdictionid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the default tax jurisdiction defined for the site. |
| [taxExemptTaxClassID](#taxexempttaxclassid): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the tax class that represents tax exempt items. |
| [taxationPolicy](#taxationpolicy): [Number](TopLevel.Number.md) `(read-only)` | Returns the taxation policy (net/gross) configured for the current site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [applyExternalTax](dw.order.TaxMgr.md#applyexternaltaxbasket)([Basket](dw.order.Basket.md)) | Applies externally set tax rates to the given [Basket](dw.order.Basket.md). |
| static [getCustomRateTaxClassID](dw.order.TaxMgr.md#getcustomratetaxclassid)() | Returns the ID of the tax class that represents items with a custom tax rate. |
| static [getDefaultTaxClassID](dw.order.TaxMgr.md#getdefaulttaxclassid)() | Returns the ID of the default tax class defined for the site. |
| static [getDefaultTaxJurisdictionID](dw.order.TaxMgr.md#getdefaulttaxjurisdictionid)() | Returns the ID of the default tax jurisdiction defined for the site. |
| static [getTaxExemptTaxClassID](dw.order.TaxMgr.md#gettaxexempttaxclassid)() | Returns the ID of the tax class that represents tax exempt items. |
| static [getTaxJurisdictionID](dw.order.TaxMgr.md#gettaxjurisdictionidshippinglocation)([ShippingLocation](dw.order.ShippingLocation.md)) | Returns the ID of the tax jurisdiction for the specified address. |
| static [getTaxRate](dw.order.TaxMgr.md#gettaxratestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the tax rate defined for the specified combination of tax class and tax jurisdiction. |
| static [getTaxationPolicy](dw.order.TaxMgr.md#gettaxationpolicy)() | Returns the taxation policy (net/gross) configured for the current site. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### TAX_POLICY_GROSS

- TAX_POLICY_GROSS: [Number](TopLevel.Number.md) = 0
  - : Constant representing the gross taxation policy.


---

### TAX_POLICY_NET

- TAX_POLICY_NET: [Number](TopLevel.Number.md) = 1
  - : Constant representing the net taxation policy.


---

## Property Details

### customRateTaxClassID
- customRateTaxClassID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the tax class that represents items with a custom tax rate. The standard order calculation
      process assumes that such line items are initialized with a tax rate and a being ignored during the tax rate
      lookup sequence of the calculation process.
      
      
      Note that this tax class does not appear in the Business Manager tax module.



---

### defaultTaxClassID
- defaultTaxClassID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the default tax class defined for the site. This class might be used in case a product or
      service does not define a tax class. 
      
      If no default tax class is defined, the method returns null.



---

### defaultTaxJurisdictionID
- defaultTaxJurisdictionID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the default tax jurisdiction defined for the site. This jurisdiction might be used in case no
      jurisdiction is defined for a specific address. 
      
      If no default tax jurisdiction is defined, this method returns null.



---

### taxExemptTaxClassID
- taxExemptTaxClassID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the tax class that represents tax exempt items. The tax manager will return a tax rate of 0.0
      for this tax class.
      
      
      Note that this tax class does not appear in the Business Manager tax module.



---

### taxationPolicy
- taxationPolicy: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the taxation policy (net/gross) configured for the current site.

    **See Also:**
    - [TAX_POLICY_GROSS](dw.order.TaxMgr.md#tax_policy_gross)
    - [TAX_POLICY_NET](dw.order.TaxMgr.md#tax_policy_net)


---

## Method Details

### applyExternalTax(Basket)
- static applyExternalTax(basket: [Basket](dw.order.Basket.md)): void
  - : Applies externally set tax rates to the given [Basket](dw.order.Basket.md). Only use when
      [LineItemCtnr.isExternallyTaxed()](dw.order.LineItemCtnr.md#isexternallytaxed) returns true. Note: a basket can only be created in EXTERNAL
      tax mode using SCAPI.
      
      
      Typical usage in tax calculation:
      
      
      ```
         var TaxMgr = require('dw/order/TaxMgr');
         
         calculateTaxes: function () {
            Basket basket = BasketMgr.getCurrentBasket();
            if ( basket.isExternallyTaxed() )
            {
               TaxMgr.applyExternalTaxation( basket );
            }
            else
            {
               // calculation with tax tables or customization
            }
         }
      ```


    **Parameters:**
    - basket - apply external taxation to this basket


---

### getCustomRateTaxClassID()
- static getCustomRateTaxClassID(): [String](TopLevel.String.md)
  - : Returns the ID of the tax class that represents items with a custom tax rate. The standard order calculation
      process assumes that such line items are initialized with a tax rate and a being ignored during the tax rate
      lookup sequence of the calculation process.
      
      
      Note that this tax class does not appear in the Business Manager tax module.



---

### getDefaultTaxClassID()
- static getDefaultTaxClassID(): [String](TopLevel.String.md)
  - : Returns the ID of the default tax class defined for the site. This class might be used in case a product or
      service does not define a tax class. 
      
      If no default tax class is defined, the method returns null.


    **Returns:**
    - the ID of the default tax class defined for the site or null.


---

### getDefaultTaxJurisdictionID()
- static getDefaultTaxJurisdictionID(): [String](TopLevel.String.md)
  - : Returns the ID of the default tax jurisdiction defined for the site. This jurisdiction might be used in case no
      jurisdiction is defined for a specific address. 
      
      If no default tax jurisdiction is defined, this method returns null.


    **Returns:**
    - the ID of the default tax jurisdiction defined for the site or null.


---

### getTaxExemptTaxClassID()
- static getTaxExemptTaxClassID(): [String](TopLevel.String.md)
  - : Returns the ID of the tax class that represents tax exempt items. The tax manager will return a tax rate of 0.0
      for this tax class.
      
      
      Note that this tax class does not appear in the Business Manager tax module.



---

### getTaxJurisdictionID(ShippingLocation)
- static getTaxJurisdictionID(location: [ShippingLocation](dw.order.ShippingLocation.md)): [String](TopLevel.String.md)
  - : Returns the ID of the tax jurisdiction for the specified address. If no tax jurisdiction defined for the site
      matches the specified address, this method returns null.


    **Parameters:**
    - location - The shipping location

    **Returns:**
    - the ID of the tax jurisdiction for the specified address or null.


---

### getTaxRate(String, String)
- static getTaxRate(taxClassID: [String](TopLevel.String.md), taxJurisdictionID: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Returns the tax rate defined for the specified combination of tax class and tax jurisdiction. 
      
      Method returns null if no tax rate is defined. 
      
      Method returns 0.0 of 'nontaxable' tax rate is specified (see method 'getNontaxableTaxClassID'.


    **Parameters:**
    - taxClassID - ID of the tax class
    - taxJurisdictionID - ID of tax jusrisdiction

    **Returns:**
    - the tax rate defined for the specified combination of tax class and tax jurisdiction.


---

### getTaxationPolicy()
- static getTaxationPolicy(): [Number](TopLevel.Number.md)
  - : Returns the taxation policy (net/gross) configured for the current site.

    **Returns:**
    - Taxation policy configured for current site

    **See Also:**
    - [TAX_POLICY_GROSS](dw.order.TaxMgr.md#tax_policy_gross)
    - [TAX_POLICY_NET](dw.order.TaxMgr.md#tax_policy_net)


---

<!-- prettier-ignore-end -->
