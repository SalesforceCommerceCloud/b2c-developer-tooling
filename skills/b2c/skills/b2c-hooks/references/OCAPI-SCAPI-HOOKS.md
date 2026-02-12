# OCAPI/SCAPI Hooks Reference

OCAPI and SCAPI share the same hooks. Registering a hook for OCAPI also applies to SCAPI endpoints.

## Prerequisites

Enable hooks in Business Manager:
**Administration > Global Preferences > Feature Switches > Enable Salesforce Commerce Cloud API hook execution**

## Hook Naming Convention

```
dw.ocapi.shop.<resource>.<sub-resource>.<hookType><METHOD>
```

Hook types: `before<METHOD>`, `after<METHOD>`, `modify<METHOD>Response`, `validate<Resource>`

## Complete Hook Reference

### Authentication

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.auth.beforePOST` | `beforePOST(authHeader: String, authType: EnumValue): Status` |
| `dw.ocapi.shop.auth.afterPOST` | `afterPOST(customer: Customer, authType: EnumValue): Status` |
| `dw.ocapi.shop.auth.modifyPOSTResponse` | `modifyPOSTResponse(customer: Customer, response, authType): Status` |

### Basket

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.beforeGET` | `beforeGET(basketId: String): Status` |
| `dw.ocapi.shop.basket.beforePATCH` | `beforePATCH(basket: Basket, input): Status` |
| `dw.ocapi.shop.basket.beforePOST_v2` | `beforePOST(basket: Basket): Status` |
| `dw.ocapi.shop.basket.beforeDELETE` | `beforeDELETE(basket: Basket): Status` |
| `dw.ocapi.shop.basket.afterPOST` | `afterPOST(basket: Basket): Status` |
| `dw.ocapi.shop.basket.afterPATCH` | `afterPATCH(basket: Basket, input): Status` |
| `dw.ocapi.shop.basket.afterDELETE` | `afterDELETE(basketId: String): Status` |
| `dw.ocapi.shop.basket.modifyGETResponse` | `modifyGETResponse(basket: Basket, response): Status` |
| `dw.ocapi.shop.basket.modifyPATCHResponse` | `modifyPATCHResponse(basket: Basket, response): Status` |
| `dw.ocapi.shop.basket.modifyPOSTResponse` | `modifyPOSTResponse(basket: Basket, response): Status` |
| `dw.ocapi.shop.basket.validateBasket` | `validateBasket(response, duringSubmit: boolean): Status` |
| `dw.ocapi.baskets.actions.afterMerge` | `afterMerge(basket: Basket): Status` |
| `dw.ocapi.baskets.actions.afterTransfer` | `afterTransfer(basket: Basket): Status` |

### Basket Billing Address

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.billing_address.beforePUT` | `beforePUT(basket: Basket, address): Status` |
| `dw.ocapi.shop.basket.billing_address.afterPUT` | `afterPUT(basket: Basket, address): Status` |
| `dw.ocapi.shop.basket.billing_address.modifyPUTResponse` | `modifyPUTResponse(basket: Basket, response, address): Status` |

### Basket Customer

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.customer.beforePUT` | `beforePUT(basket: Basket, customerInfo): Status` |
| `dw.ocapi.shop.basket.customer.afterPUT` | `afterPUT(basket: Basket, customerInfo): Status` |
| `dw.ocapi.shop.basket.customer.modifyPUTResponse` | `modifyPUTResponse(basket: Basket, response, customerInfo): Status` |

### Basket Coupon

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.coupon.beforePOST` | `beforePOST(basket: Basket, couponItem): Status` |
| `dw.ocapi.shop.basket.coupon.beforeDELETE` | `beforeDELETE(basket: Basket, couponItemId: String): Status` |
| `dw.ocapi.shop.basket.coupon.afterPOST` | `afterPOST(basket: Basket, couponItem): Status` |
| `dw.ocapi.shop.basket.coupon.afterDELETE` | `afterDELETE(basket: Basket, couponItemId: String): Status` |
| `dw.ocapi.shop.basket.coupon.modifyPOSTResponse` | `modifyPOSTResponse(basket: Basket, response, coupon): Status` |
| `dw.ocapi.shop.basket.coupon.modifyDELETEResponse` | `modifyDELETEResponse(basket: Basket, response, couponItemId): Status` |

### Basket Items

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.items.beforePOST` | `beforePOST(basket: Basket, items): Status` |
| `dw.ocapi.shop.basket.items.afterPOST` | `afterPOST(basket: Basket, items): Status` |
| `dw.ocapi.shop.basket.items.modifyPOSTResponse` | `modifyPOSTResponse(basket: Basket, response, items): Status` |
| `dw.ocapi.shop.basket.item.beforePATCH` | `beforePATCH(basket: Basket, item): Status` |
| `dw.ocapi.shop.basket.item.beforeDELETE` | `beforeDELETE(basket: Basket, itemId: String): Status` |
| `dw.ocapi.shop.basket.item.afterPATCH` | `afterPATCH(basket: Basket, item): Status` |
| `dw.ocapi.shop.basket.item.afterDELETE` | `afterDELETE(basket: Basket, itemId: String): Status` |
| `dw.ocapi.shop.basket.item.modifyPATCHResponse` | `modifyPATCHResponse(basket: Basket, response, itemId): Status` |
| `dw.ocapi.shop.basket.item.modifyDELETEResponse` | `modifyDELETEResponse(basket: Basket, response, itemId): Status` |

### Basket Gift Certificate Item

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.gift_certificate_item.beforePOST` | `beforePOST(basket: Basket, item): Status` |
| `dw.ocapi.shop.basket.gift_certificate_item.beforePATCH` | `beforePATCH(basket: Basket, itemId: String, item): Status` |
| `dw.ocapi.shop.basket.gift_certificate_item.beforeDELETE` | `beforeDELETE(basket: Basket, itemId: String): Status` |
| `dw.ocapi.shop.basket.gift_certificate_item.afterPOST` | `afterPOST(basket: Basket, item): Status` |
| `dw.ocapi.shop.basket.gift_certificate_item.afterPATCH` | `afterPATCH(basket: Basket, itemId: String, item): Status` |
| `dw.ocapi.shop.basket.gift_certificate_item.afterDELETE` | `afterDELETE(basket: Basket, itemId: String): Status` |
| `dw.ocapi.shop.basket.gift_certificate_item.modifyPOSTResponse` | `modifyPOSTResponse(basket: Basket, response, item): Status` |
| `dw.ocapi.shop.basket.gift_certificate_item.modifyPATCHResponse` | `modifyPATCHResponse(basket: Basket, response, itemId): Status` |
| `dw.ocapi.shop.basket.gift_certificate_item.modifyDELETEResponse` | `modifyDELETEResponse(basket: Basket, response, itemId): Status` |

### Basket Payment Instrument

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.payment_instrument.beforePOST` | `beforePOST(basket: Basket, instrument): Status` |
| `dw.ocapi.shop.basket.payment_instrument.beforePATCH` | `beforePATCH(basket: Basket, instrument, newInstrument): Status` |
| `dw.ocapi.shop.basket.payment_instrument.beforeDELETE` | `beforeDELETE(basket: Basket, instrument): Status` |
| `dw.ocapi.shop.basket.payment_instrument.afterPOST` | `afterPOST(basket: Basket, instrument): Status` |
| `dw.ocapi.shop.basket.payment_instrument.afterPATCH` | `afterPATCH(basket: Basket, instrument, request): Status` |
| `dw.ocapi.shop.basket.payment_instrument.afterDELETE` | `afterDELETE(basket: Basket): Status` |
| `dw.ocapi.shop.basket.payment_instrument.modifyPOSTResponse` | `modifyPOSTResponse(basket: Basket, response, request): Status` |
| `dw.ocapi.shop.basket.payment_instrument.modifyPATCHResponse` | `modifyPATCHResponse(basket: Basket, response, instrumentId): Status` |
| `dw.ocapi.shop.basket.payment_instrument.modifyDELETEResponse` | `modifyDELETEResponse(basket: Basket, response, instrumentId): Status` |

### Basket Payment Methods

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.payment_methods.beforeGET` | `beforeGET(basketId: String): Status` |
| `dw.ocapi.shop.basket.payment_methods.afterGET` | `afterGET(basket: Basket, paymentMethods): Status` |
| `dw.ocapi.shop.basket.payment_methods.modifyGETResponse_v2` | `modifyGETResponse(basket: Basket, response): Status` |

### Basket Shipment

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.shipment.beforePOST` | `beforePOST(basket: Basket, shipment): Status` |
| `dw.ocapi.shop.basket.shipment.beforePATCH` | `beforePATCH(basket: Basket, shipment: Shipment, shipmentInfo): Status` |
| `dw.ocapi.shop.basket.shipment.beforeDELETE` | `beforeDELETE(basket: Basket, shipment: Shipment): Status` |
| `dw.ocapi.shop.basket.shipment.afterPOST` | `afterPOST(basket: Basket, shipment): Status` |
| `dw.ocapi.shop.basket.shipment.afterPATCH` | `afterPATCH(basket: Basket, shipment: Shipment, shipmentInfo): Status` |
| `dw.ocapi.shop.basket.shipment.afterDELETE` | `afterDELETE(basket: Basket, shipmentId: String): Status` |
| `dw.ocapi.shop.basket.shipment.modifyPOSTResponse` | `modifyPOSTResponse(basket: Basket, response, shipment): Status` |
| `dw.ocapi.shop.basket.shipment.modifyPATCHResponse` | `modifyPATCHResponse(basket: Basket, response, shipmentId): Status` |
| `dw.ocapi.shop.basket.shipment.modifyDELETEResponse` | `modifyDELETEResponse(basket: Basket, response, shipmentId): Status` |

### Basket Shipment Shipping Address

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.shipment.shipping_address.beforePUT` | `beforePUT(basket: Basket, shipment: Shipment, address): Status` |
| `dw.ocapi.shop.basket.shipment.shipping_address.afterPUT` | `afterPUT(basket: Basket, shipment: Shipment, address): Status` |
| `dw.ocapi.shop.basket.shipment.shipping_address.modifyPUTResponse` | `modifyPUTResponse(basket: Basket, response, address): Status` |

### Basket Shipment Shipping Method

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.shipment.shipping_method.beforePUT` | `beforePUT(basket: Basket, shipment: Shipment, method): Status` |
| `dw.ocapi.shop.basket.shipment.shipping_method.afterPUT` | `afterPUT(basket: Basket, shipment: Shipment, method): Status` |
| `dw.ocapi.shop.basket.shipment.shipping_method.modifyPUTResponse` | `modifyPUTResponse(basket: Basket, response, method): Status` |

### Basket Shipments Shipping Methods

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.basket.shipments.shipping_methods.beforeGET` | `beforeGET(basketId: String, shipmentId: String): Status` |
| `dw.ocapi.shop.basket.shipments.shipping_methods.modifyGETResponse_v2` | `modifyGETResponse(basket: Basket, response): Status` |

### Category

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.category.beforeGET` | `beforeGET(categoryId: String): Status` |
| `dw.ocapi.shop.category.modifyGETResponse` | `modifyGETResponse(category: Category, response): Status` |

### Customer

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.customer.beforeGET` | `beforeGET(customerId: String): Status` |
| `dw.ocapi.shop.customer.beforePOST` | `beforePOST(customerInput): Status` |
| `dw.ocapi.shop.customer.beforePATCH` | `beforePATCH(customer: Customer, customerInput): Status` |
| `dw.ocapi.shop.customer.afterPOST` | `afterPOST(customer: Customer, customerInput): Status` |
| `dw.ocapi.shop.customer.afterPATCH` | `afterPATCH(customer: Customer, customerInput): Status` |
| `dw.ocapi.shop.customer.modifyGETResponse` | `modifyGETResponse(customer: Customer, response): Status` |
| `dw.ocapi.shop.customer.modifyPOSTResponse` | `modifyPOSTResponse(customer: Customer, response): Status` |
| `dw.ocapi.shop.customer.modifyPATCHResponse` | `modifyPATCHResponse(customer: Customer, response): Status` |

### Customer Auth

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.customer.auth.beforePOST` | `beforePOST(authHeader: String, authType: EnumValue): Status` |
| `dw.ocapi.shop.customer.auth.afterPOST` | `afterPOST(customer: Customer, authType: EnumValue): Status` |
| `dw.ocapi.shop.customer.auth.modifyPOSTResponse` | `modifyPOSTResponse(customer: Customer, response, authType): Status` |

### Customer Address

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.customer.addresses.beforeGET` | `beforeGET(customerId: String): Status` |
| `dw.ocapi.shop.customer.addresses.beforePOST` | `beforePOST(customer: Customer, address): Status` |
| `dw.ocapi.shop.customer.addresses.afterPOST` | `afterPOST(customer: Customer, address): Status` |
| `dw.ocapi.shop.customer.addresses.modifyGETResponse` | `modifyGETResponse(customer: Customer, response): Status` |
| `dw.ocapi.shop.customer.address.beforeGET` | `beforeGET(customerId: String, addressName: String): Status` |
| `dw.ocapi.shop.customer.address.beforePATCH` | `beforePATCH(customer: Customer, address, addressInput): Status` |
| `dw.ocapi.shop.customer.address.beforeDELETE` | `beforeDELETE(customer: Customer, address): Status` |
| `dw.ocapi.shop.customer.address.afterPATCH` | `afterPATCH(customer: Customer, address, addressInput): Status` |
| `dw.ocapi.shop.customer.address.afterDELETE` | `afterDELETE(customer: Customer, addressName: String): Status` |
| `dw.ocapi.shop.customer.address.modifyGETResponse` | `modifyGETResponse(customer: Customer, response): Status` |
| `dw.ocapi.shop.customer.address.modifyPOSTResponse` | `modifyPOSTResponse(customer: Customer, response, address): Status` |
| `dw.ocapi.shop.customer.address.modifyPATCHResponse` | `modifyPATCHResponse(customer: Customer, response, addressName): Status` |

### Customer Baskets

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.customer.baskets.beforeGET` | `beforeGET(customerId: String): Status` |
| `dw.ocapi.shop.customer.baskets.modifyGETResponse_v2` | `modifyGETResponse(customer: Customer, response): Status` |

### Customer Orders

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.customer.orders.beforeGET` | `beforeGET(customerId: String): Status` |
| `dw.ocapi.shop.customer.orders.modifyGETResponse_v2` | `modifyGETResponse(customer: Customer, response): Status` |

### Customer Password

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.customer.password.beforePUT` | `beforePUT(customer: Customer, passwordInput): Status` |
| `dw.ocapi.shop.customer.password.afterPUT_v2` | `afterPUT(customer: Customer, passwordInput): Status` |
| `dw.ocapi.shop.customer.password_reset.beforePOST` | `beforePOST(email: String): Status` |
| `dw.ocapi.shop.customer.password_reset.afterPOST` | `afterPOST(email: String): Status` |

### Customer Payment Instrument

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.customer.payment_instruments.beforeGET` | `beforeGET(customerId: String): Status` |
| `dw.ocapi.shop.customer.payment_instruments.modifyGETResponse_v2` | `modifyGETResponse(customer: Customer, response): Status` |
| `dw.ocapi.shop.customer.payment_instrument.beforeGET` | `beforeGET(customerId: String, instrumentId: String): Status` |
| `dw.ocapi.shop.customer.payment_instrument.beforePOST` | `beforePOST(customer: Customer, instrument): Status` |
| `dw.ocapi.shop.customer.payment_instrument.beforeDELETE` | `beforeDELETE(customer: Customer, instrument): Status` |
| `dw.ocapi.shop.customer.payment_instrument.afterPOST` | `afterPOST(customer: Customer, instrument): Status` |
| `dw.ocapi.shop.customer.payment_instrument.afterDELETE` | `afterDELETE(customer: Customer, instrumentId: String): Status` |
| `dw.ocapi.shop.customer.payment_instrument.modifyGETResponse` | `modifyGETResponse(customer: Customer, response): Status` |
| `dw.ocapi.shop.customer.payment_instrument.modifyPOSTResponse` | `modifyPOSTResponse(customer: Customer, response, instrument): Status` |

### Customer Product Lists

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.customer.product_lists.beforeGET` | `beforeGET(customerId: String): Status` |
| `dw.ocapi.shop.customer.product_lists.beforePOST` | `beforePOST(customer: Customer, productList): Status` |
| `dw.ocapi.shop.customer.product_lists.afterPOST` | `afterPOST(customer: Customer, productList): Status` |
| `dw.ocapi.shop.customer.product_lists.modifyGETResponse_v3` | `modifyGETResponse(customer: Customer, response): Status` |
| `dw.ocapi.shop.customer.product_list.beforeGET` | `beforeGET(customerId: String, listId: String): Status` |
| `dw.ocapi.shop.customer.product_list.beforePATCH` | `beforePATCH(customer: Customer, productList, listInput): Status` |
| `dw.ocapi.shop.customer.product_list.beforeDELETE` | `beforeDELETE(customer: Customer, productList): Status` |
| `dw.ocapi.shop.customer.product_list.afterPATCH` | `afterPATCH(customer: Customer, productList, listInput): Status` |
| `dw.ocapi.shop.customer.product_list.afterDELETE` | `afterDELETE(customer: Customer, listId: String): Status` |
| `dw.ocapi.shop.customer.product_list.modifyGETResponse` | `modifyGETResponse(customer: Customer, response): Status` |
| `dw.ocapi.shop.customer.product_list.modifyPOSTResponse` | `modifyPOSTResponse(customer: Customer, response, productList): Status` |
| `dw.ocapi.shop.customer.product_list.modifyPATCHResponse` | `modifyPATCHResponse(customer: Customer, response, listId): Status` |

### Customer Product List Items

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.customer.product_list.items.beforeGET` | `beforeGET(customerId: String, listId: String): Status` |
| `dw.ocapi.shop.customer.product_list.items.beforePOST` | `beforePOST(customer: Customer, productList, item): Status` |
| `dw.ocapi.shop.customer.product_list.items.afterPOST` | `afterPOST(customer: Customer, productList, item): Status` |
| `dw.ocapi.shop.customer.product_list.items.modifyGETResponse_v2` | `modifyGETResponse(customer: Customer, response): Status` |
| `dw.ocapi.shop.customer.product_list.item.beforeGET` | `beforeGET(customerId: String, listId: String, itemId: String): Status` |
| `dw.ocapi.shop.customer.product_list.item.beforePATCH` | `beforePATCH(customer: Customer, productList, item, itemInput): Status` |
| `dw.ocapi.shop.customer.product_list.item.beforeDELETE` | `beforeDELETE(customer: Customer, productList, item): Status` |
| `dw.ocapi.shop.customer.product_list.item.afterPATCH` | `afterPATCH(customer: Customer, productList, item, itemInput): Status` |
| `dw.ocapi.shop.customer.product_list.item.afterDELETE` | `afterDELETE(customer: Customer, productList, itemId: String): Status` |
| `dw.ocapi.shop.customer.product_list.item.modifyGETResponse` | `modifyGETResponse(customer: Customer, response): Status` |
| `dw.ocapi.shop.customer.product_list.item.modifyPOSTResponse` | `modifyPOSTResponse(customer: Customer, response, item): Status` |
| `dw.ocapi.shop.customer.product_list.item.modifyPATCHResponse` | `modifyPATCHResponse(customer: Customer, response, itemId): Status` |

### Gift Certificate

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.gift_certificate.beforePOST` | `beforePOST(giftCertificateCode: String): Status` |
| `dw.ocapi.shop.gift_certificate.modifyPOSTResponse` | `modifyPOSTResponse(giftCertificate, response): Status` |

### Order

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.order.beforeGET` | `beforeGET(orderId: String): Status` |
| `dw.ocapi.shop.order.beforePOST` | `beforePOST(basket: Basket): Status` |
| `dw.ocapi.shop.order.afterPOST` | `afterPOST(order: Order): Status` |
| `dw.ocapi.shop.order.modifyGETResponse` | `modifyGETResponse(order: Order, response): Status` |
| `dw.ocapi.shop.order.modifyPOSTResponse` | `modifyPOSTResponse(order: Order, response): Status` |
| `dw.ocapi.shop.order.validateOrder` | `validateOrder(response, duringPlace: boolean): Status` |

### Order Payment Instrument

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.order.payment_instrument.beforePOST` | `beforePOST(order: Order, instrument): Status` |
| `dw.ocapi.shop.order.payment_instrument.beforePATCH` | `beforePATCH(order: Order, instrument, newInstrument): Status` |
| `dw.ocapi.shop.order.payment_instrument.beforeDELETE` | `beforeDELETE(order: Order, instrument): Status` |
| `dw.ocapi.shop.order.payment_instrument.afterPOST` | `afterPOST(order: Order, instrument): Status` |
| `dw.ocapi.shop.order.payment_instrument.afterPATCH` | `afterPATCH(order: Order, instrument, request): Status` |
| `dw.ocapi.shop.order.payment_instrument.afterDELETE` | `afterDELETE(order: Order, instrumentId: String): Status` |
| `dw.ocapi.shop.order.payment_instrument.modifyPOSTResponse` | `modifyPOSTResponse(order: Order, response, request): Status` |
| `dw.ocapi.shop.order.payment_instrument.modifyPATCHResponse` | `modifyPATCHResponse(order: Order, response, instrumentId): Status` |
| `dw.ocapi.shop.order.payment_instrument.modifyDELETEResponse` | `modifyDELETEResponse(order: Order, response, instrumentId): Status` |

### Order Payment Methods

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.order.payment_methods.beforeGET` | `beforeGET(orderId: String): Status` |
| `dw.ocapi.shop.order.payment_methods.modifyGETResponse_v2` | `modifyGETResponse(order: Order, response): Status` |

### Product

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.product.beforeGET` | `beforeGET(productId: String): Status` |
| `dw.ocapi.shop.product.modifyGETResponse` | `modifyGETResponse(product: Product, response): Status` |

### Product Search

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.product_search.beforeGET` | `beforeGET(searchRequest): Status` |
| `dw.ocapi.shop.product_search.modifyGETResponse` | `modifyGETResponse(searchResult, response): Status` |

### Promotion

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.promotion.beforeGET` | `beforeGET(promotionId: String): Status` |
| `dw.ocapi.shop.promotion.modifyGETResponse` | `modifyGETResponse(promotion: Promotion, response): Status` |
| `dw.ocapi.shop.promotions.beforeGET` | `beforeGET(promotionIds: String): Status` |
| `dw.ocapi.shop.promotions.modifyGETResponse` | `modifyGETResponse(promotions, response): Status` |

### Search Suggestion

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.search_suggestion.beforeGET` | `beforeGET(query: String): Status` |
| `dw.ocapi.shop.search_suggestion.modifyGETResponse` | `modifyGETResponse(suggestions, response): Status` |

### Store

| Hook | Signature |
|------|-----------|
| `dw.ocapi.shop.store.beforeGET` | `beforeGET(storeId: String): Status` |
| `dw.ocapi.shop.store.modifyGETResponse` | `modifyGETResponse(store: Store, response): Status` |
| `dw.ocapi.shop.stores.beforeGET` | `beforeGET(storeIds: String): Status` |
| `dw.ocapi.shop.stores.modifyGETResponse` | `modifyGETResponse(stores, response): Status` |

## Common Patterns

### Validation (return error to reject request)

```javascript
exports.beforePUT = function(basket, address) {
    if (!isValidZipCode(address.postalCode)) {
        var status = new Status(Status.ERROR);
        status.addDetail('field', 'postalCode');
        status.addDetail('message', 'Invalid postal code');
        return status;
    }
    return new Status(Status.OK);
};
```

### Modify Response (add custom properties)

```javascript
exports.modifyGETResponse = function(product, response) {
    response.c_customField = 'value';
    response.c_extendedInfo = { source: 'hook' };
};
```

### Custom Properties

Add `c_` prefixed properties in modifyResponse hooks. Supported types: String, Integer, Double, Boolean, Date, Set of Strings.

## Notes

- All hooks return `dw.system.Status` - return `Status.OK` to continue, `Status.ERROR` to reject
- Hooks with `_v2` or `_v3` suffix are newer versions with updated signatures
- Response objects in `modify*Response` hooks can be modified in place
- Custom query parameters with `c_` prefix are accessible via `request.httpParameterMap`
