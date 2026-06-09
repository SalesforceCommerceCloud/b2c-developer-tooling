// Type definitions for B2C Commerce Script API 26.7

// TopLevel
import topLevelAPIException = require('./TopLevel/APIException');
import topLevelConversionError = require('./TopLevel/ConversionError');
import topLevelEvalError = require('./TopLevel/EvalError');
import topLevelFault = require('./TopLevel/Fault');
import topLevelIOError = require('./TopLevel/IOError');
import topLevelInternalError = require('./TopLevel/InternalError');
import topLevelModule = require('./TopLevel/Module');
import topLevelNamespace = require('./TopLevel/Namespace');
import topLevelQName = require('./TopLevel/QName');
import topLevelRangeError = require('./TopLevel/RangeError');
import topLevelReferenceError = require('./TopLevel/ReferenceError');
import topLevelStopIteration = require('./TopLevel/StopIteration');
import topLevelSyntaxError = require('./TopLevel/SyntaxError');
import topLevelSystemError = require('./TopLevel/SystemError');
import topLevelTypeError = require('./TopLevel/TypeError');
import topLevelURIError = require('./TopLevel/URIError');
import topLevelXML = require('./TopLevel/XML');
import topLevelXMLList = require('./TopLevel/XMLList');
import topLevelXMLStreamError = require('./TopLevel/XMLStreamError');
import topLevelarguments = require('./TopLevel/arguments');

// dw.alert
import alertAlert = require('./dw/alert/Alert');
import alertAlerts = require('./dw/alert/Alerts');

// dw.campaign
import campaignABTest = require('./dw/campaign/ABTest');
import campaignABTestMgr = require('./dw/campaign/ABTestMgr');
import campaignABTestSegment = require('./dw/campaign/ABTestSegment');
import campaignAmountDiscount = require('./dw/campaign/AmountDiscount');
import campaignApproachingDiscount = require('./dw/campaign/ApproachingDiscount');
import campaignBonusChoiceDiscount = require('./dw/campaign/BonusChoiceDiscount');
import campaignBonusDiscount = require('./dw/campaign/BonusDiscount');
import campaignCampaign = require('./dw/campaign/Campaign');
import campaignCampaignMgr = require('./dw/campaign/CampaignMgr');
import campaignCampaignStatusCodes = require('./dw/campaign/CampaignStatusCodes');
import campaignCoupon = require('./dw/campaign/Coupon');
import campaignCouponMgr = require('./dw/campaign/CouponMgr');
import campaignCouponRedemption = require('./dw/campaign/CouponRedemption');
import campaignCouponStatusCodes = require('./dw/campaign/CouponStatusCodes');
import campaignDiscount = require('./dw/campaign/Discount');
import campaignDiscountPlan = require('./dw/campaign/DiscountPlan');
import campaignFixedPriceDiscount = require('./dw/campaign/FixedPriceDiscount');
import campaignFixedPriceShippingDiscount = require('./dw/campaign/FixedPriceShippingDiscount');
import campaignFreeDiscount = require('./dw/campaign/FreeDiscount');
import campaignFreeShippingDiscount = require('./dw/campaign/FreeShippingDiscount');
import campaignPercentageDiscount = require('./dw/campaign/PercentageDiscount');
import campaignPercentageOptionDiscount = require('./dw/campaign/PercentageOptionDiscount');
import campaignPriceBookPriceDiscount = require('./dw/campaign/PriceBookPriceDiscount');
import campaignPromotion = require('./dw/campaign/Promotion');
import campaignPromotionMgr = require('./dw/campaign/PromotionMgr');
import campaignPromotionPlan = require('./dw/campaign/PromotionPlan');
import campaignSlotContent = require('./dw/campaign/SlotContent');
import campaignSourceCodeGroup = require('./dw/campaign/SourceCodeGroup');
import campaignSourceCodeInfo = require('./dw/campaign/SourceCodeInfo');
import campaignSourceCodeStatusCodes = require('./dw/campaign/SourceCodeStatusCodes');
import campaignTotalFixedPriceDiscount = require('./dw/campaign/TotalFixedPriceDiscount');

// dw.catalog
import catalogCatalog = require('./dw/catalog/Catalog');
import catalogCatalogMgr = require('./dw/catalog/CatalogMgr');
import catalogCategory = require('./dw/catalog/Category');
import catalogCategoryAssignment = require('./dw/catalog/CategoryAssignment');
import catalogCategoryLink = require('./dw/catalog/CategoryLink');
import catalogPriceBook = require('./dw/catalog/PriceBook');
import catalogPriceBookMgr = require('./dw/catalog/PriceBookMgr');
import catalogProduct = require('./dw/catalog/Product');
import catalogProductActiveData = require('./dw/catalog/ProductActiveData');
import catalogProductAttributeModel = require('./dw/catalog/ProductAttributeModel');
import catalogProductAvailabilityLevels = require('./dw/catalog/ProductAvailabilityLevels');
import catalogProductAvailabilityModel = require('./dw/catalog/ProductAvailabilityModel');
import catalogProductInventoryList = require('./dw/catalog/ProductInventoryList');
import catalogProductInventoryMgr = require('./dw/catalog/ProductInventoryMgr');
import catalogProductInventoryRecord = require('./dw/catalog/ProductInventoryRecord');
import catalogProductLink = require('./dw/catalog/ProductLink');
import catalogProductMgr = require('./dw/catalog/ProductMgr');
import catalogProductOption = require('./dw/catalog/ProductOption');
import catalogProductOptionModel = require('./dw/catalog/ProductOptionModel');
import catalogProductOptionValue = require('./dw/catalog/ProductOptionValue');
import catalogProductPriceInfo = require('./dw/catalog/ProductPriceInfo');
import catalogProductPriceModel = require('./dw/catalog/ProductPriceModel');
import catalogProductPriceTable = require('./dw/catalog/ProductPriceTable');
import catalogProductSearchHit = require('./dw/catalog/ProductSearchHit');
import catalogProductSearchModel = require('./dw/catalog/ProductSearchModel');
import catalogProductSearchRefinementDefinition = require('./dw/catalog/ProductSearchRefinementDefinition');
import catalogProductSearchRefinementValue = require('./dw/catalog/ProductSearchRefinementValue');
import catalogProductSearchRefinements = require('./dw/catalog/ProductSearchRefinements');
import catalogProductVariationAttribute = require('./dw/catalog/ProductVariationAttribute');
import catalogProductVariationAttributeValue = require('./dw/catalog/ProductVariationAttributeValue');
import catalogProductVariationModel = require('./dw/catalog/ProductVariationModel');
import catalogRecommendation = require('./dw/catalog/Recommendation');
import catalogSearchModel = require('./dw/catalog/SearchModel');
import catalogSearchRefinementDefinition = require('./dw/catalog/SearchRefinementDefinition');
import catalogSearchRefinementValue = require('./dw/catalog/SearchRefinementValue');
import catalogSearchRefinements = require('./dw/catalog/SearchRefinements');
import catalogSortingOption = require('./dw/catalog/SortingOption');
import catalogSortingRule = require('./dw/catalog/SortingRule');
import catalogStore = require('./dw/catalog/Store');
import catalogStoreGroup = require('./dw/catalog/StoreGroup');
import catalogStoreInventoryFilter = require('./dw/catalog/StoreInventoryFilter');
import catalogStoreInventoryFilterValue = require('./dw/catalog/StoreInventoryFilterValue');
import catalogStoreMgr = require('./dw/catalog/StoreMgr');
import catalogVariant = require('./dw/catalog/Variant');
import catalogVariationGroup = require('./dw/catalog/VariationGroup');

// dw.content
import contentContent = require('./dw/content/Content');
import contentContentMgr = require('./dw/content/ContentMgr');
import contentContentSearchModel = require('./dw/content/ContentSearchModel');
import contentContentSearchRefinementDefinition = require('./dw/content/ContentSearchRefinementDefinition');
import contentContentSearchRefinementValue = require('./dw/content/ContentSearchRefinementValue');
import contentContentSearchRefinements = require('./dw/content/ContentSearchRefinements');
import contentFolder = require('./dw/content/Folder');
import contentLibrary = require('./dw/content/Library');
import contentMarkupText = require('./dw/content/MarkupText');
import contentMediaFile = require('./dw/content/MediaFile');

// dw.crypto
import cryptoCertificateRef = require('./dw/crypto/CertificateRef');
import cryptoCertificateUtils = require('./dw/crypto/CertificateUtils');
import cryptoCipher = require('./dw/crypto/Cipher');
import cryptoEncoding = require('./dw/crypto/Encoding');
import cryptoJWE = require('./dw/crypto/JWE');
import cryptoJWEHeader = require('./dw/crypto/JWEHeader');
import cryptoJWS = require('./dw/crypto/JWS');
import cryptoJWSHeader = require('./dw/crypto/JWSHeader');
import cryptoKeyRef = require('./dw/crypto/KeyRef');
import cryptoMac = require('./dw/crypto/Mac');
import cryptoMessageDigest = require('./dw/crypto/MessageDigest');
import cryptoSecureRandom = require('./dw/crypto/SecureRandom');
import cryptoSignature = require('./dw/crypto/Signature');
import cryptoWeakCipher = require('./dw/crypto/WeakCipher');
import cryptoWeakMac = require('./dw/crypto/WeakMac');
import cryptoWeakMessageDigest = require('./dw/crypto/WeakMessageDigest');
import cryptoWeakSignature = require('./dw/crypto/WeakSignature');
import cryptoX509Certificate = require('./dw/crypto/X509Certificate');

// dw.customer
import customerAddressBook = require('./dw/customer/AddressBook');
import customerAgentUserMgr = require('./dw/customer/AgentUserMgr');
import customerAgentUserStatusCodes = require('./dw/customer/AgentUserStatusCodes');
import customerAuthenticationStatus = require('./dw/customer/AuthenticationStatus');
import customerCredentials = require('./dw/customer/Credentials');
import customerCustomer = require('./dw/customer/Customer');
import customerCustomerActiveData = require('./dw/customer/CustomerActiveData');
import customerCustomerAddress = require('./dw/customer/CustomerAddress');
import customerCustomerCDPData = require('./dw/customer/CustomerCDPData');
import customerCustomerContextMgr = require('./dw/customer/CustomerContextMgr');
import customerCustomerGroup = require('./dw/customer/CustomerGroup');
import customerCustomerList = require('./dw/customer/CustomerList');
import customerCustomerMgr = require('./dw/customer/CustomerMgr');
import customerCustomerPasswordConstraints = require('./dw/customer/CustomerPasswordConstraints');
import customerCustomerPaymentInstrument = require('./dw/customer/CustomerPaymentInstrument');
import customerCustomerStatusCodes = require('./dw/customer/CustomerStatusCodes');
import customerEncryptedObject = require('./dw/customer/EncryptedObject');
import customerExternalProfile = require('./dw/customer/ExternalProfile');
import customerOrderHistory = require('./dw/customer/OrderHistory');
import customerProductList = require('./dw/customer/ProductList');
import customerProductListItem = require('./dw/customer/ProductListItem');
import customerProductListItemPurchase = require('./dw/customer/ProductListItemPurchase');
import customerProductListMgr = require('./dw/customer/ProductListMgr');
import customerProductListRegistrant = require('./dw/customer/ProductListRegistrant');
import customerProfile = require('./dw/customer/Profile');
import customerWallet = require('./dw/customer/Wallet');

// dw.customer.consent
import customerconsentConsentStatusEntry = require('./dw/customer/consent/ConsentStatusEntry');
import customerconsentMarketingConsentSubscription = require('./dw/customer/consent/MarketingConsentSubscription');
import customerconsentShopperConsentErrorCodes = require('./dw/customer/consent/ShopperConsentErrorCodes');
import customerconsentShopperConsentException = require('./dw/customer/consent/ShopperConsentException');
import customerconsentShopperConsentMgr = require('./dw/customer/consent/ShopperConsentMgr');

// dw.customer.oauth
import customeroauthOAuthAccessTokenResponse = require('./dw/customer/oauth/OAuthAccessTokenResponse');
import customeroauthOAuthFinalizedResponse = require('./dw/customer/oauth/OAuthFinalizedResponse');
import customeroauthOAuthLoginFlowMgr = require('./dw/customer/oauth/OAuthLoginFlowMgr');
import customeroauthOAuthUserInfoResponse = require('./dw/customer/oauth/OAuthUserInfoResponse');

// dw.customer.shoppercontext
import customershoppercontextShopperContext = require('./dw/customer/shoppercontext/ShopperContext');
import customershoppercontextShopperContextErrorCodes = require('./dw/customer/shoppercontext/ShopperContextErrorCodes');
import customershoppercontextShopperContextException = require('./dw/customer/shoppercontext/ShopperContextException');
import customershoppercontextShopperContextMgr = require('./dw/customer/shoppercontext/ShopperContextMgr');

// dw.experience
import experienceAspectAttributeValidationException = require('./dw/experience/AspectAttributeValidationException');
import experienceComponent = require('./dw/experience/Component');
import experienceComponentRenderSettings = require('./dw/experience/ComponentRenderSettings');
import experienceComponentScriptContext = require('./dw/experience/ComponentScriptContext');
import experienceCustomEditor = require('./dw/experience/CustomEditor');
import experienceCustomEditorResources = require('./dw/experience/CustomEditorResources');
import experiencePage = require('./dw/experience/Page');
import experiencePageMgr = require('./dw/experience/PageMgr');
import experiencePageScriptContext = require('./dw/experience/PageScriptContext');
import experienceRegion = require('./dw/experience/Region');
import experienceRegionRenderSettings = require('./dw/experience/RegionRenderSettings');

// dw.experience.cms
import experiencecmsCMSRecord = require('./dw/experience/cms/CMSRecord');

// dw.experience.image
import experienceimageFocalPoint = require('./dw/experience/image/FocalPoint');
import experienceimageImage = require('./dw/experience/image/Image');
import experienceimageImageMetaData = require('./dw/experience/image/ImageMetaData');

// dw.extensions.applepay
import extensionsapplepayApplePayHookResult = require('./dw/extensions/applepay/ApplePayHookResult');
import extensionsapplepayApplePayHooks = require('./dw/extensions/applepay/ApplePayHooks');

// dw.extensions.facebook
import extensionsfacebookFacebookFeedHooks = require('./dw/extensions/facebook/FacebookFeedHooks');
import extensionsfacebookFacebookProduct = require('./dw/extensions/facebook/FacebookProduct');

// dw.extensions.paymentapi
import extensionspaymentapiPaymentApiHooks = require('./dw/extensions/paymentapi/PaymentApiHooks');

// dw.extensions.paymentrequest
import extensionspaymentrequestPaymentRequestHookResult = require('./dw/extensions/paymentrequest/PaymentRequestHookResult');
import extensionspaymentrequestPaymentRequestHooks = require('./dw/extensions/paymentrequest/PaymentRequestHooks');

// dw.extensions.payments
import extensionspaymentsSalesforceAdyenPaymentIntent = require('./dw/extensions/payments/SalesforceAdyenPaymentIntent');
import extensionspaymentsSalesforceAdyenSavedPaymentMethod = require('./dw/extensions/payments/SalesforceAdyenSavedPaymentMethod');
import extensionspaymentsSalesforceBancontactPaymentDetails = require('./dw/extensions/payments/SalesforceBancontactPaymentDetails');
import extensionspaymentsSalesforceCardPaymentDetails = require('./dw/extensions/payments/SalesforceCardPaymentDetails');
import extensionspaymentsSalesforceEpsPaymentDetails = require('./dw/extensions/payments/SalesforceEpsPaymentDetails');
import extensionspaymentsSalesforceIdealPaymentDetails = require('./dw/extensions/payments/SalesforceIdealPaymentDetails');
import extensionspaymentsSalesforceKlarnaPaymentDetails = require('./dw/extensions/payments/SalesforceKlarnaPaymentDetails');
import extensionspaymentsSalesforcePayPalOrder = require('./dw/extensions/payments/SalesforcePayPalOrder');
import extensionspaymentsSalesforcePayPalOrderAddress = require('./dw/extensions/payments/SalesforcePayPalOrderAddress');
import extensionspaymentsSalesforcePayPalOrderPayer = require('./dw/extensions/payments/SalesforcePayPalOrderPayer');
import extensionspaymentsSalesforcePayPalPaymentDetails = require('./dw/extensions/payments/SalesforcePayPalPaymentDetails');
import extensionspaymentsSalesforcePaymentDetails = require('./dw/extensions/payments/SalesforcePaymentDetails');
import extensionspaymentsSalesforcePaymentIntent = require('./dw/extensions/payments/SalesforcePaymentIntent');
import extensionspaymentsSalesforcePaymentMethod = require('./dw/extensions/payments/SalesforcePaymentMethod');
import extensionspaymentsSalesforcePaymentRequest = require('./dw/extensions/payments/SalesforcePaymentRequest');
import extensionspaymentsSalesforcePaymentsHooks = require('./dw/extensions/payments/SalesforcePaymentsHooks');
import extensionspaymentsSalesforcePaymentsMerchantAccount = require('./dw/extensions/payments/SalesforcePaymentsMerchantAccount');
import extensionspaymentsSalesforcePaymentsMerchantAccountPaymentMethod = require('./dw/extensions/payments/SalesforcePaymentsMerchantAccountPaymentMethod');
import extensionspaymentsSalesforcePaymentsMgr = require('./dw/extensions/payments/SalesforcePaymentsMgr');
import extensionspaymentsSalesforcePaymentsSiteConfiguration = require('./dw/extensions/payments/SalesforcePaymentsSiteConfiguration');
import extensionspaymentsSalesforcePaymentsZone = require('./dw/extensions/payments/SalesforcePaymentsZone');
import extensionspaymentsSalesforceSepaDebitPaymentDetails = require('./dw/extensions/payments/SalesforceSepaDebitPaymentDetails');
import extensionspaymentsSalesforceVenmoPaymentDetails = require('./dw/extensions/payments/SalesforceVenmoPaymentDetails');

// dw.extensions.pinterest
import extensionspinterestPinterestAvailability = require('./dw/extensions/pinterest/PinterestAvailability');
import extensionspinterestPinterestFeedHooks = require('./dw/extensions/pinterest/PinterestFeedHooks');
import extensionspinterestPinterestOrder = require('./dw/extensions/pinterest/PinterestOrder');
import extensionspinterestPinterestOrderHooks = require('./dw/extensions/pinterest/PinterestOrderHooks');
import extensionspinterestPinterestProduct = require('./dw/extensions/pinterest/PinterestProduct');

// dw.io
import ioCSVStreamReader = require('./dw/io/CSVStreamReader');
import ioCSVStreamWriter = require('./dw/io/CSVStreamWriter');
import ioFile = require('./dw/io/File');
import ioFileReader = require('./dw/io/FileReader');
import ioFileWriter = require('./dw/io/FileWriter');
import ioInputStream = require('./dw/io/InputStream');
import ioOutputStream = require('./dw/io/OutputStream');
import ioPrintWriter = require('./dw/io/PrintWriter');
import ioRandomAccessFileReader = require('./dw/io/RandomAccessFileReader');
import ioReader = require('./dw/io/Reader');
import ioStringWriter = require('./dw/io/StringWriter');
import ioWriter = require('./dw/io/Writer');
import ioXMLIndentingStreamWriter = require('./dw/io/XMLIndentingStreamWriter');
import ioXMLStreamConstants = require('./dw/io/XMLStreamConstants');
import ioXMLStreamReader = require('./dw/io/XMLStreamReader');
import ioXMLStreamWriter = require('./dw/io/XMLStreamWriter');

// dw.job
import jobJobExecution = require('./dw/job/JobExecution');
import jobJobStepExecution = require('./dw/job/JobStepExecution');

// dw.net
import netFTPClient = require('./dw/net/FTPClient');
import netFTPFileInfo = require('./dw/net/FTPFileInfo');
import netHTTPClient = require('./dw/net/HTTPClient');
import netHTTPClientLoggingConfig = require('./dw/net/HTTPClientLoggingConfig');
import netHTTPRequestPart = require('./dw/net/HTTPRequestPart');
import netMail = require('./dw/net/Mail');
import netSFTPClient = require('./dw/net/SFTPClient');
import netSFTPFileInfo = require('./dw/net/SFTPFileInfo');
import netWebDAVClient = require('./dw/net/WebDAVClient');
import netWebDAVFileInfo = require('./dw/net/WebDAVFileInfo');

// dw.object
import objectActiveData = require('./dw/object/ActiveData');
import objectCustomAttributes = require('./dw/object/CustomAttributes');
import objectCustomObject = require('./dw/object/CustomObject');
import objectCustomObjectMgr = require('./dw/object/CustomObjectMgr');
import objectExtensible = require('./dw/object/Extensible');
import objectExtensibleObject = require('./dw/object/ExtensibleObject');
import objectNote = require('./dw/object/Note');
import objectObjectAttributeDefinition = require('./dw/object/ObjectAttributeDefinition');
import objectObjectAttributeGroup = require('./dw/object/ObjectAttributeGroup');
import objectObjectAttributeValueDefinition = require('./dw/object/ObjectAttributeValueDefinition');
import objectObjectTypeDefinition = require('./dw/object/ObjectTypeDefinition');
import objectPersistentObject = require('./dw/object/PersistentObject');
import objectSimpleExtensible = require('./dw/object/SimpleExtensible');
import objectSystemObjectMgr = require('./dw/object/SystemObjectMgr');

// dw.order
import orderAbstractItem = require('./dw/order/AbstractItem');
import orderAbstractItemCtnr = require('./dw/order/AbstractItemCtnr');
import orderAppeasement = require('./dw/order/Appeasement');
import orderAppeasementItem = require('./dw/order/AppeasementItem');
import orderBasket = require('./dw/order/Basket');
import orderBasketMgr = require('./dw/order/BasketMgr');
import orderBonusDiscountLineItem = require('./dw/order/BonusDiscountLineItem');
import orderCouponLineItem = require('./dw/order/CouponLineItem');
import orderCreateAgentBasketLimitExceededException = require('./dw/order/CreateAgentBasketLimitExceededException');
import orderCreateBasketFromOrderException = require('./dw/order/CreateBasketFromOrderException');
import orderCreateCouponLineItemException = require('./dw/order/CreateCouponLineItemException');
import orderCreateOrderException = require('./dw/order/CreateOrderException');
import orderCreateTemporaryBasketLimitExceededException = require('./dw/order/CreateTemporaryBasketLimitExceededException');
import orderGiftCertificate = require('./dw/order/GiftCertificate');
import orderGiftCertificateLineItem = require('./dw/order/GiftCertificateLineItem');
import orderGiftCertificateMgr = require('./dw/order/GiftCertificateMgr');
import orderGiftCertificateStatusCodes = require('./dw/order/GiftCertificateStatusCodes');
import orderInvoice = require('./dw/order/Invoice');
import orderInvoiceItem = require('./dw/order/InvoiceItem');
import orderLineItem = require('./dw/order/LineItem');
import orderLineItemCtnr = require('./dw/order/LineItemCtnr');
import orderLineItemTax = require('./dw/order/LineItemTax');
import orderOrder = require('./dw/order/Order');
import orderOrderAddress = require('./dw/order/OrderAddress');
import orderOrderItem = require('./dw/order/OrderItem');
import orderOrderMgr = require('./dw/order/OrderMgr');
import orderOrderPaymentInstrument = require('./dw/order/OrderPaymentInstrument');
import orderOrderProcessStatusCodes = require('./dw/order/OrderProcessStatusCodes');
import orderPaymentCard = require('./dw/order/PaymentCard');
import orderPaymentInstrument = require('./dw/order/PaymentInstrument');
import orderPaymentMethod = require('./dw/order/PaymentMethod');
import orderPaymentMgr = require('./dw/order/PaymentMgr');
import orderPaymentProcessor = require('./dw/order/PaymentProcessor');
import orderPaymentStatusCodes = require('./dw/order/PaymentStatusCodes');
import orderPaymentTransaction = require('./dw/order/PaymentTransaction');
import orderPriceAdjustment = require('./dw/order/PriceAdjustment');
import orderPriceAdjustmentLimitTypes = require('./dw/order/PriceAdjustmentLimitTypes');
import orderProductLineItem = require('./dw/order/ProductLineItem');
import orderProductShippingCost = require('./dw/order/ProductShippingCost');
import orderProductShippingLineItem = require('./dw/order/ProductShippingLineItem');
import orderProductShippingModel = require('./dw/order/ProductShippingModel');
import orderReturn = require('./dw/order/Return');
import orderReturnCase = require('./dw/order/ReturnCase');
import orderReturnCaseItem = require('./dw/order/ReturnCaseItem');
import orderReturnItem = require('./dw/order/ReturnItem');
import orderShipment = require('./dw/order/Shipment');
import orderShipmentShippingCost = require('./dw/order/ShipmentShippingCost');
import orderShipmentShippingModel = require('./dw/order/ShipmentShippingModel');
import orderShippingLineItem = require('./dw/order/ShippingLineItem');
import orderShippingLocation = require('./dw/order/ShippingLocation');
import orderShippingMethod = require('./dw/order/ShippingMethod');
import orderShippingMgr = require('./dw/order/ShippingMgr');
import orderShippingOrder = require('./dw/order/ShippingOrder');
import orderShippingOrderItem = require('./dw/order/ShippingOrderItem');
import orderSumItem = require('./dw/order/SumItem');
import orderTaxGroup = require('./dw/order/TaxGroup');
import orderTaxItem = require('./dw/order/TaxItem');
import orderTaxMgr = require('./dw/order/TaxMgr');
import orderTrackingInfo = require('./dw/order/TrackingInfo');
import orderTrackingRef = require('./dw/order/TrackingRef');

// dw.order.hooks
import orderhooksBasketMergeHooks = require('./dw/order/hooks/BasketMergeHooks');
import orderhooksCalculateHooks = require('./dw/order/hooks/CalculateHooks');
import orderhooksCheckoutHooks = require('./dw/order/hooks/CheckoutHooks');
import orderhooksOrderHooks = require('./dw/order/hooks/OrderHooks');
import orderhooksPaymentHooks = require('./dw/order/hooks/PaymentHooks');
import orderhooksReturnHooks = require('./dw/order/hooks/ReturnHooks');
import orderhooksShippingOrderHooks = require('./dw/order/hooks/ShippingOrderHooks');
import orderhooksTaxHooks = require('./dw/order/hooks/TaxHooks');

// dw.rpc
import rpcSOAPUtil = require('./dw/rpc/SOAPUtil');
import rpcStub = require('./dw/rpc/Stub');
import rpcWebReference = require('./dw/rpc/WebReference');

// dw.sitemap
import sitemapSitemapFile = require('./dw/sitemap/SitemapFile');
import sitemapSitemapMgr = require('./dw/sitemap/SitemapMgr');

// dw.suggest
import suggestBrandSuggestions = require('./dw/suggest/BrandSuggestions');
import suggestCategorySuggestions = require('./dw/suggest/CategorySuggestions');
import suggestContentSuggestions = require('./dw/suggest/ContentSuggestions');
import suggestCustomSuggestions = require('./dw/suggest/CustomSuggestions');
import suggestProductSuggestions = require('./dw/suggest/ProductSuggestions');
import suggestSearchPhraseSuggestions = require('./dw/suggest/SearchPhraseSuggestions');
import suggestSuggestModel = require('./dw/suggest/SuggestModel');
import suggestSuggestedCategory = require('./dw/suggest/SuggestedCategory');
import suggestSuggestedContent = require('./dw/suggest/SuggestedContent');
import suggestSuggestedPhrase = require('./dw/suggest/SuggestedPhrase');
import suggestSuggestedProduct = require('./dw/suggest/SuggestedProduct');
import suggestSuggestedTerm = require('./dw/suggest/SuggestedTerm');
import suggestSuggestedTerms = require('./dw/suggest/SuggestedTerms');
import suggestSuggestions = require('./dw/suggest/Suggestions');

// dw.svc
import svcFTPService = require('./dw/svc/FTPService');
import svcFTPServiceDefinition = require('./dw/svc/FTPServiceDefinition');
import svcHTTPFormService = require('./dw/svc/HTTPFormService');
import svcHTTPFormServiceDefinition = require('./dw/svc/HTTPFormServiceDefinition');
import svcHTTPService = require('./dw/svc/HTTPService');
import svcHTTPServiceDefinition = require('./dw/svc/HTTPServiceDefinition');
import svcLocalServiceRegistry = require('./dw/svc/LocalServiceRegistry');
import svcResult = require('./dw/svc/Result');
import svcSOAPService = require('./dw/svc/SOAPService');
import svcSOAPServiceDefinition = require('./dw/svc/SOAPServiceDefinition');
import svcService = require('./dw/svc/Service');
import svcServiceCallback = require('./dw/svc/ServiceCallback');
import svcServiceConfig = require('./dw/svc/ServiceConfig');
import svcServiceCredential = require('./dw/svc/ServiceCredential');
import svcServiceDefinition = require('./dw/svc/ServiceDefinition');
import svcServiceProfile = require('./dw/svc/ServiceProfile');
import svcServiceRegistry = require('./dw/svc/ServiceRegistry');

// dw.system
import systemAgentUserStatusCodes = require('./dw/system/AgentUserStatusCodes');
import systemCache = require('./dw/system/Cache');
import systemCacheMgr = require('./dw/system/CacheMgr');
import systemHookMgr = require('./dw/system/HookMgr');
import systemInternalObject = require('./dw/system/InternalObject');
import systemJobProcessMonitor = require('./dw/system/JobProcessMonitor');
import systemLog = require('./dw/system/Log');
import systemLogNDC = require('./dw/system/LogNDC');
import systemLogger = require('./dw/system/Logger');
import systemOrganizationPreferences = require('./dw/system/OrganizationPreferences');
import systemPipeline = require('./dw/system/Pipeline');
import systemPipelineDictionary = require('./dw/system/PipelineDictionary');
import systemRESTErrorResponse = require('./dw/system/RESTErrorResponse');
import systemRESTResponseMgr = require('./dw/system/RESTResponseMgr');
import systemRESTSuccessResponse = require('./dw/system/RESTSuccessResponse');
import systemRemoteInclude = require('./dw/system/RemoteInclude');
import systemRequest = require('./dw/system/Request');
import systemRequestHooks = require('./dw/system/RequestHooks');
import systemResponse = require('./dw/system/Response');
import systemSearchStatus = require('./dw/system/SearchStatus');
import systemSession = require('./dw/system/Session');
import systemSite = require('./dw/system/Site');
import systemSitePreferences = require('./dw/system/SitePreferences');
import systemStatus = require('./dw/system/Status');
import systemStatusItem = require('./dw/system/StatusItem');
import systemSystem = require('./dw/system/System');
import systemTransaction = require('./dw/system/Transaction');

// dw.template
import templateISML = require('./dw/template/ISML');
import templateVelocity = require('./dw/template/Velocity');

// dw.util
import utilArrayList = require('./dw/util/ArrayList');
import utilAssert = require('./dw/util/Assert');
import utilBigInteger = require('./dw/util/BigInteger');
import utilBytes = require('./dw/util/Bytes');
import utilCalendar = require('./dw/util/Calendar');
import utilCollection = require('./dw/util/Collection');
import utilCurrency = require('./dw/util/Currency');
import utilDateUtils = require('./dw/util/DateUtils');
import utilDecimal = require('./dw/util/Decimal');
import utilFilteringCollection = require('./dw/util/FilteringCollection');
import utilGeolocation = require('./dw/util/Geolocation');
import utilHashMap = require('./dw/util/HashMap');
import utilHashSet = require('./dw/util/HashSet');
import utilIterator = require('./dw/util/Iterator');
import utilLinkedHashMap = require('./dw/util/LinkedHashMap');
import utilLinkedHashSet = require('./dw/util/LinkedHashSet');
import utilList = require('./dw/util/List');
import utilLocale = require('./dw/util/Locale');
import utilMap = require('./dw/util/Map');
import utilMapEntry = require('./dw/util/MapEntry');
import utilMappingKey = require('./dw/util/MappingKey');
import utilMappingMgr = require('./dw/util/MappingMgr');
import utilPropertyComparator = require('./dw/util/PropertyComparator');
import utilSecureEncoder = require('./dw/util/SecureEncoder');
import utilSecureFilter = require('./dw/util/SecureFilter');
import utilSeekableIterator = require('./dw/util/SeekableIterator');
import utilSet = require('./dw/util/Set');
import utilSortedMap = require('./dw/util/SortedMap');
import utilSortedSet = require('./dw/util/SortedSet');
import utilStringUtils = require('./dw/util/StringUtils');
import utilTemplate = require('./dw/util/Template');
import utilUUIDUtils = require('./dw/util/UUIDUtils');

// dw.value
import valueEnumValue = require('./dw/value/EnumValue');
import valueMimeEncodedText = require('./dw/value/MimeEncodedText');
import valueMoney = require('./dw/value/Money');
import valueQuantity = require('./dw/value/Quantity');

// dw.web
import webCSRFProtection = require('./dw/web/CSRFProtection');
import webClickStream = require('./dw/web/ClickStream');
import webClickStreamEntry = require('./dw/web/ClickStreamEntry');
import webCookie = require('./dw/web/Cookie');
import webCookies = require('./dw/web/Cookies');
import webForm = require('./dw/web/Form');
import webFormAction = require('./dw/web/FormAction');
import webFormElement = require('./dw/web/FormElement');
import webFormElementValidationResult = require('./dw/web/FormElementValidationResult');
import webFormField = require('./dw/web/FormField');
import webFormFieldOption = require('./dw/web/FormFieldOption');
import webFormFieldOptions = require('./dw/web/FormFieldOptions');
import webFormGroup = require('./dw/web/FormGroup');
import webFormList = require('./dw/web/FormList');
import webFormListItem = require('./dw/web/FormListItem');
import webForms = require('./dw/web/Forms');
import webHttpParameter = require('./dw/web/HttpParameter');
import webHttpParameterMap = require('./dw/web/HttpParameterMap');
import webLoopIterator = require('./dw/web/LoopIterator');
import webPageMetaData = require('./dw/web/PageMetaData');
import webPageMetaTag = require('./dw/web/PageMetaTag');
import webPagingModel = require('./dw/web/PagingModel');
import webResource = require('./dw/web/Resource');
import webURL = require('./dw/web/URL');
import webURLAction = require('./dw/web/URLAction');
import webURLParameter = require('./dw/web/URLParameter');
import webURLRedirect = require('./dw/web/URLRedirect');
import webURLRedirectMgr = require('./dw/web/URLRedirectMgr');
import webURLUtils = require('./dw/web/URLUtils');

// dw.ws
import wsPort = require('./dw/ws/Port');
import wsWSUtil = require('./dw/ws/WSUtil');
import wsWebReference2 = require('./dw/ws/WebReference2');

declare global {
    const PIPELET_NEXT: number;
    const PIPELET_ERROR: number;
    const webreferences2: any;
    const slotcontent: any;
    const module: topLevelModule;
    const exports: any;
    const session: systemSession;
    const request: systemRequest;
    const response: systemResponse;
    const customer: customerCustomer;
    function parseInt(s: string, radix: number): number;
    function parseFloat(s: string): number;
    function decodeURI(uri: string): string;
    function decodeURIComponent(uriComponent: string): string;
    function encodeURI(uri: string): string;
    function encodeURIComponent(uriComponent: string): string;
    function escape(s: string): string;
    function isFinite(number: number): boolean;
    function isNaN(object: any): boolean;
    function isXMLName(name: string): boolean;
    function unescape(string: string): string;
    function importPackage(packagePath: any): void;
    function importClass(classPath: any): void;
    function require(path: string): topLevelModule;
    function importScript(scriptPath: string): void;
    function empty(obj: any): boolean;
    function trace(msg: string, ...params: any[]): void;

    type APIException = topLevelAPIException;
    const APIException: typeof topLevelAPIException;
    type ConversionError = topLevelConversionError;
    const ConversionError: typeof topLevelConversionError;
    type Fault = topLevelFault;
    const Fault: typeof topLevelFault;
    type IOError = topLevelIOError;
    const IOError: typeof topLevelIOError;
    type InternalError = topLevelInternalError;
    const InternalError: typeof topLevelInternalError;
    type Module = topLevelModule;
    const Module: typeof topLevelModule;
    type Namespace = topLevelNamespace;
    const Namespace: typeof topLevelNamespace;
    type QName = topLevelQName;
    const QName: typeof topLevelQName;
    type StopIteration = topLevelStopIteration;
    const StopIteration: typeof topLevelStopIteration;
    type SystemError = topLevelSystemError;
    const SystemError: typeof topLevelSystemError;
    type XML = topLevelXML;
    const XML: typeof topLevelXML;
    type XMLList = topLevelXMLList;
    const XMLList: typeof topLevelXMLList;
    type XMLStreamError = topLevelXMLStreamError;
    const XMLStreamError: typeof topLevelXMLStreamError;

    module dw {
        module alert {
            export { alertAlert as Alert };
            export { alertAlerts as Alerts };
        }
        module campaign {
            export { campaignABTest as ABTest };
            export { campaignABTestMgr as ABTestMgr };
            export { campaignABTestSegment as ABTestSegment };
            export { campaignAmountDiscount as AmountDiscount };
            export { campaignApproachingDiscount as ApproachingDiscount };
            export { campaignBonusChoiceDiscount as BonusChoiceDiscount };
            export { campaignBonusDiscount as BonusDiscount };
            export { campaignCampaign as Campaign };
            export { campaignCampaignMgr as CampaignMgr };
            export { campaignCampaignStatusCodes as CampaignStatusCodes };
            export { campaignCoupon as Coupon };
            export { campaignCouponMgr as CouponMgr };
            export { campaignCouponRedemption as CouponRedemption };
            export { campaignCouponStatusCodes as CouponStatusCodes };
            export { campaignDiscount as Discount };
            export { campaignDiscountPlan as DiscountPlan };
            export { campaignFixedPriceDiscount as FixedPriceDiscount };
            export { campaignFixedPriceShippingDiscount as FixedPriceShippingDiscount };
            export { campaignFreeDiscount as FreeDiscount };
            export { campaignFreeShippingDiscount as FreeShippingDiscount };
            export { campaignPercentageDiscount as PercentageDiscount };
            export { campaignPercentageOptionDiscount as PercentageOptionDiscount };
            export { campaignPriceBookPriceDiscount as PriceBookPriceDiscount };
            export { campaignPromotion as Promotion };
            export { campaignPromotionMgr as PromotionMgr };
            export { campaignPromotionPlan as PromotionPlan };
            export { campaignSlotContent as SlotContent };
            export { campaignSourceCodeGroup as SourceCodeGroup };
            export { campaignSourceCodeInfo as SourceCodeInfo };
            export { campaignSourceCodeStatusCodes as SourceCodeStatusCodes };
            export { campaignTotalFixedPriceDiscount as TotalFixedPriceDiscount };
        }
        module catalog {
            export { catalogCatalog as Catalog };
            export { catalogCatalogMgr as CatalogMgr };
            export { catalogCategory as Category };
            export { catalogCategoryAssignment as CategoryAssignment };
            export { catalogCategoryLink as CategoryLink };
            export { catalogPriceBook as PriceBook };
            export { catalogPriceBookMgr as PriceBookMgr };
            export { catalogProduct as Product };
            export { catalogProductActiveData as ProductActiveData };
            export { catalogProductAttributeModel as ProductAttributeModel };
            export { catalogProductAvailabilityLevels as ProductAvailabilityLevels };
            export { catalogProductAvailabilityModel as ProductAvailabilityModel };
            export { catalogProductInventoryList as ProductInventoryList };
            export { catalogProductInventoryMgr as ProductInventoryMgr };
            export { catalogProductInventoryRecord as ProductInventoryRecord };
            export { catalogProductLink as ProductLink };
            export { catalogProductMgr as ProductMgr };
            export { catalogProductOption as ProductOption };
            export { catalogProductOptionModel as ProductOptionModel };
            export { catalogProductOptionValue as ProductOptionValue };
            export { catalogProductPriceInfo as ProductPriceInfo };
            export { catalogProductPriceModel as ProductPriceModel };
            export { catalogProductPriceTable as ProductPriceTable };
            export { catalogProductSearchHit as ProductSearchHit };
            export { catalogProductSearchModel as ProductSearchModel };
            export { catalogProductSearchRefinementDefinition as ProductSearchRefinementDefinition };
            export { catalogProductSearchRefinementValue as ProductSearchRefinementValue };
            export { catalogProductSearchRefinements as ProductSearchRefinements };
            export { catalogProductVariationAttribute as ProductVariationAttribute };
            export { catalogProductVariationAttributeValue as ProductVariationAttributeValue };
            export { catalogProductVariationModel as ProductVariationModel };
            export { catalogRecommendation as Recommendation };
            export { catalogSearchModel as SearchModel };
            export { catalogSearchRefinementDefinition as SearchRefinementDefinition };
            export { catalogSearchRefinementValue as SearchRefinementValue };
            export { catalogSearchRefinements as SearchRefinements };
            export { catalogSortingOption as SortingOption };
            export { catalogSortingRule as SortingRule };
            export { catalogStore as Store };
            export { catalogStoreGroup as StoreGroup };
            export { catalogStoreInventoryFilter as StoreInventoryFilter };
            export { catalogStoreInventoryFilterValue as StoreInventoryFilterValue };
            export { catalogStoreMgr as StoreMgr };
            export { catalogVariant as Variant };
            export { catalogVariationGroup as VariationGroup };
        }
        module content {
            export { contentContent as Content };
            export { contentContentMgr as ContentMgr };
            export { contentContentSearchModel as ContentSearchModel };
            export { contentContentSearchRefinementDefinition as ContentSearchRefinementDefinition };
            export { contentContentSearchRefinementValue as ContentSearchRefinementValue };
            export { contentContentSearchRefinements as ContentSearchRefinements };
            export { contentFolder as Folder };
            export { contentLibrary as Library };
            export { contentMarkupText as MarkupText };
            export { contentMediaFile as MediaFile };
        }
        module crypto {
            export { cryptoCertificateRef as CertificateRef };
            export { cryptoCertificateUtils as CertificateUtils };
            export { cryptoCipher as Cipher };
            export { cryptoEncoding as Encoding };
            export { cryptoJWE as JWE };
            export { cryptoJWEHeader as JWEHeader };
            export { cryptoJWS as JWS };
            export { cryptoJWSHeader as JWSHeader };
            export { cryptoKeyRef as KeyRef };
            export { cryptoMac as Mac };
            export { cryptoMessageDigest as MessageDigest };
            export { cryptoSecureRandom as SecureRandom };
            export { cryptoSignature as Signature };
            export { cryptoWeakCipher as WeakCipher };
            export { cryptoWeakMac as WeakMac };
            export { cryptoWeakMessageDigest as WeakMessageDigest };
            export { cryptoWeakSignature as WeakSignature };
            export { cryptoX509Certificate as X509Certificate };
        }
        module customer {
            export { customerAddressBook as AddressBook };
            export { customerAgentUserMgr as AgentUserMgr };
            export { customerAgentUserStatusCodes as AgentUserStatusCodes };
            export { customerAuthenticationStatus as AuthenticationStatus };
            export { customerCredentials as Credentials };
            export { customerCustomer as Customer };
            export { customerCustomerActiveData as CustomerActiveData };
            export { customerCustomerAddress as CustomerAddress };
            export { customerCustomerCDPData as CustomerCDPData };
            export { customerCustomerContextMgr as CustomerContextMgr };
            export { customerCustomerGroup as CustomerGroup };
            export { customerCustomerList as CustomerList };
            export { customerCustomerMgr as CustomerMgr };
            export { customerCustomerPasswordConstraints as CustomerPasswordConstraints };
            export { customerCustomerPaymentInstrument as CustomerPaymentInstrument };
            export { customerCustomerStatusCodes as CustomerStatusCodes };
            export { customerEncryptedObject as EncryptedObject };
            export { customerExternalProfile as ExternalProfile };
            export { customerOrderHistory as OrderHistory };
            export { customerProductList as ProductList };
            export { customerProductListItem as ProductListItem };
            export { customerProductListItemPurchase as ProductListItemPurchase };
            export { customerProductListMgr as ProductListMgr };
            export { customerProductListRegistrant as ProductListRegistrant };
            export { customerProfile as Profile };
            export { customerWallet as Wallet };
            module consent {
                export { customerconsentConsentStatusEntry as ConsentStatusEntry };
                export { customerconsentMarketingConsentSubscription as MarketingConsentSubscription };
                export { customerconsentShopperConsentErrorCodes as ShopperConsentErrorCodes };
                export { customerconsentShopperConsentException as ShopperConsentException };
                export { customerconsentShopperConsentMgr as ShopperConsentMgr };
            }
            module oauth {
                export { customeroauthOAuthAccessTokenResponse as OAuthAccessTokenResponse };
                export { customeroauthOAuthFinalizedResponse as OAuthFinalizedResponse };
                export { customeroauthOAuthLoginFlowMgr as OAuthLoginFlowMgr };
                export { customeroauthOAuthUserInfoResponse as OAuthUserInfoResponse };
            }
            module shoppercontext {
                export { customershoppercontextShopperContext as ShopperContext };
                export { customershoppercontextShopperContextErrorCodes as ShopperContextErrorCodes };
                export { customershoppercontextShopperContextException as ShopperContextException };
                export { customershoppercontextShopperContextMgr as ShopperContextMgr };
            }
        }
        module experience {
            export { experienceAspectAttributeValidationException as AspectAttributeValidationException };
            export { experienceComponent as Component };
            export { experienceComponentRenderSettings as ComponentRenderSettings };
            export { experienceComponentScriptContext as ComponentScriptContext };
            export { experienceCustomEditor as CustomEditor };
            export { experienceCustomEditorResources as CustomEditorResources };
            export { experiencePage as Page };
            export { experiencePageMgr as PageMgr };
            export { experiencePageScriptContext as PageScriptContext };
            export { experienceRegion as Region };
            export { experienceRegionRenderSettings as RegionRenderSettings };
            module cms {
                export { experiencecmsCMSRecord as CMSRecord };
            }
            module image {
                export { experienceimageFocalPoint as FocalPoint };
                export { experienceimageImage as Image };
                export { experienceimageImageMetaData as ImageMetaData };
            }
        }
        module extensions {
            module applepay {
                export { extensionsapplepayApplePayHookResult as ApplePayHookResult };
                export { extensionsapplepayApplePayHooks as ApplePayHooks };
            }
            module facebook {
                export { extensionsfacebookFacebookFeedHooks as FacebookFeedHooks };
                export { extensionsfacebookFacebookProduct as FacebookProduct };
            }
            module paymentapi {
                export { extensionspaymentapiPaymentApiHooks as PaymentApiHooks };
            }
            module paymentrequest {
                export { extensionspaymentrequestPaymentRequestHookResult as PaymentRequestHookResult };
                export { extensionspaymentrequestPaymentRequestHooks as PaymentRequestHooks };
            }
            module payments {
                export { extensionspaymentsSalesforceAdyenPaymentIntent as SalesforceAdyenPaymentIntent };
                export { extensionspaymentsSalesforceAdyenSavedPaymentMethod as SalesforceAdyenSavedPaymentMethod };
                export { extensionspaymentsSalesforceBancontactPaymentDetails as SalesforceBancontactPaymentDetails };
                export { extensionspaymentsSalesforceCardPaymentDetails as SalesforceCardPaymentDetails };
                export { extensionspaymentsSalesforceEpsPaymentDetails as SalesforceEpsPaymentDetails };
                export { extensionspaymentsSalesforceIdealPaymentDetails as SalesforceIdealPaymentDetails };
                export { extensionspaymentsSalesforceKlarnaPaymentDetails as SalesforceKlarnaPaymentDetails };
                export { extensionspaymentsSalesforcePayPalOrder as SalesforcePayPalOrder };
                export { extensionspaymentsSalesforcePayPalOrderAddress as SalesforcePayPalOrderAddress };
                export { extensionspaymentsSalesforcePayPalOrderPayer as SalesforcePayPalOrderPayer };
                export { extensionspaymentsSalesforcePayPalPaymentDetails as SalesforcePayPalPaymentDetails };
                export { extensionspaymentsSalesforcePaymentDetails as SalesforcePaymentDetails };
                export { extensionspaymentsSalesforcePaymentIntent as SalesforcePaymentIntent };
                export { extensionspaymentsSalesforcePaymentMethod as SalesforcePaymentMethod };
                export { extensionspaymentsSalesforcePaymentRequest as SalesforcePaymentRequest };
                export { extensionspaymentsSalesforcePaymentsHooks as SalesforcePaymentsHooks };
                export { extensionspaymentsSalesforcePaymentsMerchantAccount as SalesforcePaymentsMerchantAccount };
                export { extensionspaymentsSalesforcePaymentsMerchantAccountPaymentMethod as SalesforcePaymentsMerchantAccountPaymentMethod };
                export { extensionspaymentsSalesforcePaymentsMgr as SalesforcePaymentsMgr };
                export { extensionspaymentsSalesforcePaymentsSiteConfiguration as SalesforcePaymentsSiteConfiguration };
                export { extensionspaymentsSalesforcePaymentsZone as SalesforcePaymentsZone };
                export { extensionspaymentsSalesforceSepaDebitPaymentDetails as SalesforceSepaDebitPaymentDetails };
                export { extensionspaymentsSalesforceVenmoPaymentDetails as SalesforceVenmoPaymentDetails };
            }
            module pinterest {
                export { extensionspinterestPinterestAvailability as PinterestAvailability };
                export { extensionspinterestPinterestFeedHooks as PinterestFeedHooks };
                export { extensionspinterestPinterestOrder as PinterestOrder };
                export { extensionspinterestPinterestOrderHooks as PinterestOrderHooks };
                export { extensionspinterestPinterestProduct as PinterestProduct };
            }
        }
        module io {
            export { ioCSVStreamReader as CSVStreamReader };
            export { ioCSVStreamWriter as CSVStreamWriter };
            export { ioFile as File };
            export { ioFileReader as FileReader };
            export { ioFileWriter as FileWriter };
            export { ioInputStream as InputStream };
            export { ioOutputStream as OutputStream };
            export { ioPrintWriter as PrintWriter };
            export { ioRandomAccessFileReader as RandomAccessFileReader };
            export { ioReader as Reader };
            export { ioStringWriter as StringWriter };
            export { ioWriter as Writer };
            export { ioXMLIndentingStreamWriter as XMLIndentingStreamWriter };
            export { ioXMLStreamConstants as XMLStreamConstants };
            export { ioXMLStreamReader as XMLStreamReader };
            export { ioXMLStreamWriter as XMLStreamWriter };
        }
        module job {
            export { jobJobExecution as JobExecution };
            export { jobJobStepExecution as JobStepExecution };
        }
        module net {
            export { netFTPClient as FTPClient };
            export { netFTPFileInfo as FTPFileInfo };
            export { netHTTPClient as HTTPClient };
            export { netHTTPClientLoggingConfig as HTTPClientLoggingConfig };
            export { netHTTPRequestPart as HTTPRequestPart };
            export { netMail as Mail };
            export { netSFTPClient as SFTPClient };
            export { netSFTPFileInfo as SFTPFileInfo };
            export { netWebDAVClient as WebDAVClient };
            export { netWebDAVFileInfo as WebDAVFileInfo };
        }
        module object {
            export { objectActiveData as ActiveData };
            export { objectCustomAttributes as CustomAttributes };
            export { objectCustomObject as CustomObject };
            export { objectCustomObjectMgr as CustomObjectMgr };
            export { objectExtensible as Extensible };
            export { objectExtensibleObject as ExtensibleObject };
            export { objectNote as Note };
            export { objectObjectAttributeDefinition as ObjectAttributeDefinition };
            export { objectObjectAttributeGroup as ObjectAttributeGroup };
            export { objectObjectAttributeValueDefinition as ObjectAttributeValueDefinition };
            export { objectObjectTypeDefinition as ObjectTypeDefinition };
            export { objectPersistentObject as PersistentObject };
            export { objectSimpleExtensible as SimpleExtensible };
            export { objectSystemObjectMgr as SystemObjectMgr };
        }
        module order {
            export { orderAbstractItem as AbstractItem };
            export { orderAbstractItemCtnr as AbstractItemCtnr };
            export { orderAppeasement as Appeasement };
            export { orderAppeasementItem as AppeasementItem };
            export { orderBasket as Basket };
            export { orderBasketMgr as BasketMgr };
            export { orderBonusDiscountLineItem as BonusDiscountLineItem };
            export { orderCouponLineItem as CouponLineItem };
            export { orderCreateAgentBasketLimitExceededException as CreateAgentBasketLimitExceededException };
            export { orderCreateBasketFromOrderException as CreateBasketFromOrderException };
            export { orderCreateCouponLineItemException as CreateCouponLineItemException };
            export { orderCreateOrderException as CreateOrderException };
            export { orderCreateTemporaryBasketLimitExceededException as CreateTemporaryBasketLimitExceededException };
            export { orderGiftCertificate as GiftCertificate };
            export { orderGiftCertificateLineItem as GiftCertificateLineItem };
            export { orderGiftCertificateMgr as GiftCertificateMgr };
            export { orderGiftCertificateStatusCodes as GiftCertificateStatusCodes };
            export { orderInvoice as Invoice };
            export { orderInvoiceItem as InvoiceItem };
            export { orderLineItem as LineItem };
            export { orderLineItemCtnr as LineItemCtnr };
            export { orderLineItemTax as LineItemTax };
            export { orderOrder as Order };
            export { orderOrderAddress as OrderAddress };
            export { orderOrderItem as OrderItem };
            export { orderOrderMgr as OrderMgr };
            export { orderOrderPaymentInstrument as OrderPaymentInstrument };
            export { orderOrderProcessStatusCodes as OrderProcessStatusCodes };
            export { orderPaymentCard as PaymentCard };
            export { orderPaymentInstrument as PaymentInstrument };
            export { orderPaymentMethod as PaymentMethod };
            export { orderPaymentMgr as PaymentMgr };
            export { orderPaymentProcessor as PaymentProcessor };
            export { orderPaymentStatusCodes as PaymentStatusCodes };
            export { orderPaymentTransaction as PaymentTransaction };
            export { orderPriceAdjustment as PriceAdjustment };
            export { orderPriceAdjustmentLimitTypes as PriceAdjustmentLimitTypes };
            export { orderProductLineItem as ProductLineItem };
            export { orderProductShippingCost as ProductShippingCost };
            export { orderProductShippingLineItem as ProductShippingLineItem };
            export { orderProductShippingModel as ProductShippingModel };
            export { orderReturn as Return };
            export { orderReturnCase as ReturnCase };
            export { orderReturnCaseItem as ReturnCaseItem };
            export { orderReturnItem as ReturnItem };
            export { orderShipment as Shipment };
            export { orderShipmentShippingCost as ShipmentShippingCost };
            export { orderShipmentShippingModel as ShipmentShippingModel };
            export { orderShippingLineItem as ShippingLineItem };
            export { orderShippingLocation as ShippingLocation };
            export { orderShippingMethod as ShippingMethod };
            export { orderShippingMgr as ShippingMgr };
            export { orderShippingOrder as ShippingOrder };
            export { orderShippingOrderItem as ShippingOrderItem };
            export { orderSumItem as SumItem };
            export { orderTaxGroup as TaxGroup };
            export { orderTaxItem as TaxItem };
            export { orderTaxMgr as TaxMgr };
            export { orderTrackingInfo as TrackingInfo };
            export { orderTrackingRef as TrackingRef };
            module hooks {
                export { orderhooksBasketMergeHooks as BasketMergeHooks };
                export { orderhooksCalculateHooks as CalculateHooks };
                export { orderhooksCheckoutHooks as CheckoutHooks };
                export { orderhooksOrderHooks as OrderHooks };
                export { orderhooksPaymentHooks as PaymentHooks };
                export { orderhooksReturnHooks as ReturnHooks };
                export { orderhooksShippingOrderHooks as ShippingOrderHooks };
                export { orderhooksTaxHooks as TaxHooks };
            }
        }
        module rpc {
            export { rpcSOAPUtil as SOAPUtil };
            export { rpcStub as Stub };
            export { rpcWebReference as WebReference };
        }
        module sitemap {
            export { sitemapSitemapFile as SitemapFile };
            export { sitemapSitemapMgr as SitemapMgr };
        }
        module suggest {
            export { suggestBrandSuggestions as BrandSuggestions };
            export { suggestCategorySuggestions as CategorySuggestions };
            export { suggestContentSuggestions as ContentSuggestions };
            export { suggestCustomSuggestions as CustomSuggestions };
            export { suggestProductSuggestions as ProductSuggestions };
            export { suggestSearchPhraseSuggestions as SearchPhraseSuggestions };
            export { suggestSuggestModel as SuggestModel };
            export { suggestSuggestedCategory as SuggestedCategory };
            export { suggestSuggestedContent as SuggestedContent };
            export { suggestSuggestedPhrase as SuggestedPhrase };
            export { suggestSuggestedProduct as SuggestedProduct };
            export { suggestSuggestedTerm as SuggestedTerm };
            export { suggestSuggestedTerms as SuggestedTerms };
            export { suggestSuggestions as Suggestions };
        }
        module svc {
            export { svcFTPService as FTPService };
            export { svcFTPServiceDefinition as FTPServiceDefinition };
            export { svcHTTPFormService as HTTPFormService };
            export { svcHTTPFormServiceDefinition as HTTPFormServiceDefinition };
            export { svcHTTPService as HTTPService };
            export { svcHTTPServiceDefinition as HTTPServiceDefinition };
            export { svcLocalServiceRegistry as LocalServiceRegistry };
            export { svcResult as Result };
            export { svcSOAPService as SOAPService };
            export { svcSOAPServiceDefinition as SOAPServiceDefinition };
            export { svcService as Service };
            export { svcServiceCallback as ServiceCallback };
            export { svcServiceConfig as ServiceConfig };
            export { svcServiceCredential as ServiceCredential };
            export { svcServiceDefinition as ServiceDefinition };
            export { svcServiceProfile as ServiceProfile };
            export { svcServiceRegistry as ServiceRegistry };
        }
        module system {
            export { systemAgentUserStatusCodes as AgentUserStatusCodes };
            export { systemCache as Cache };
            export { systemCacheMgr as CacheMgr };
            export { systemHookMgr as HookMgr };
            export { systemInternalObject as InternalObject };
            export { systemJobProcessMonitor as JobProcessMonitor };
            export { systemLog as Log };
            export { systemLogNDC as LogNDC };
            export { systemLogger as Logger };
            export { systemOrganizationPreferences as OrganizationPreferences };
            export { systemPipeline as Pipeline };
            export { systemPipelineDictionary as PipelineDictionary };
            export { systemRESTErrorResponse as RESTErrorResponse };
            export { systemRESTResponseMgr as RESTResponseMgr };
            export { systemRESTSuccessResponse as RESTSuccessResponse };
            export { systemRemoteInclude as RemoteInclude };
            export { systemRequest as Request };
            export { systemRequestHooks as RequestHooks };
            export { systemResponse as Response };
            export { systemSearchStatus as SearchStatus };
            export { systemSession as Session };
            export { systemSite as Site };
            export { systemSitePreferences as SitePreferences };
            export { systemStatus as Status };
            export { systemStatusItem as StatusItem };
            export { systemSystem as System };
            export { systemTransaction as Transaction };
        }
        module template {
            export { templateISML as ISML };
            export { templateVelocity as Velocity };
        }
        module util {
            export { utilArrayList as ArrayList };
            export { utilAssert as Assert };
            export { utilBigInteger as BigInteger };
            export { utilBytes as Bytes };
            export { utilCalendar as Calendar };
            export { utilCollection as Collection };
            export { utilCurrency as Currency };
            export { utilDateUtils as DateUtils };
            export { utilDecimal as Decimal };
            export { utilFilteringCollection as FilteringCollection };
            export { utilGeolocation as Geolocation };
            export { utilHashMap as HashMap };
            export { utilHashSet as HashSet };
            export { utilIterator as Iterator };
            export { utilLinkedHashMap as LinkedHashMap };
            export { utilLinkedHashSet as LinkedHashSet };
            export { utilList as List };
            export { utilLocale as Locale };
            export { utilMap as Map };
            export { utilMapEntry as MapEntry };
            export { utilMappingKey as MappingKey };
            export { utilMappingMgr as MappingMgr };
            export { utilPropertyComparator as PropertyComparator };
            export { utilSecureEncoder as SecureEncoder };
            export { utilSecureFilter as SecureFilter };
            export { utilSeekableIterator as SeekableIterator };
            export { utilSet as Set };
            export { utilSortedMap as SortedMap };
            export { utilSortedSet as SortedSet };
            export { utilStringUtils as StringUtils };
            export { utilTemplate as Template };
            export { utilUUIDUtils as UUIDUtils };
        }
        module value {
            export { valueEnumValue as EnumValue };
            export { valueMimeEncodedText as MimeEncodedText };
            export { valueMoney as Money };
            export { valueQuantity as Quantity };
        }
        module web {
            export { webCSRFProtection as CSRFProtection };
            export { webClickStream as ClickStream };
            export { webClickStreamEntry as ClickStreamEntry };
            export { webCookie as Cookie };
            export { webCookies as Cookies };
            export { webForm as Form };
            export { webFormAction as FormAction };
            export { webFormElement as FormElement };
            export { webFormElementValidationResult as FormElementValidationResult };
            export { webFormField as FormField };
            export { webFormFieldOption as FormFieldOption };
            export { webFormFieldOptions as FormFieldOptions };
            export { webFormGroup as FormGroup };
            export { webFormList as FormList };
            export { webFormListItem as FormListItem };
            export { webForms as Forms };
            export { webHttpParameter as HttpParameter };
            export { webHttpParameterMap as HttpParameterMap };
            export { webLoopIterator as LoopIterator };
            export { webPageMetaData as PageMetaData };
            export { webPageMetaTag as PageMetaTag };
            export { webPagingModel as PagingModel };
            export { webResource as Resource };
            export { webURL as URL };
            export { webURLAction as URLAction };
            export { webURLParameter as URLParameter };
            export { webURLRedirect as URLRedirect };
            export { webURLRedirectMgr as URLRedirectMgr };
            export { webURLUtils as URLUtils };
        }
        module ws {
            export { wsPort as Port };
            export { wsWSUtil as WSUtil };
            export { wsWebReference2 as WebReference2 };
        }
    }
}

declare module "dw" {
    export = dw;
}
