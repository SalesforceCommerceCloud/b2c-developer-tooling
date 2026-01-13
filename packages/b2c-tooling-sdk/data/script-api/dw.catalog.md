# Package dw.catalog

## Classes
| Class | Description |
| --- | --- |
| [Catalog](dw.catalog.Catalog.md) | Represents a Commerce Cloud Digital Catalog. |
| [CatalogMgr](dw.catalog.CatalogMgr.md) | Provides helper methods for getting categories. |
| [Category](dw.catalog.Category.md) | Represents a category in a product catalog. |
| [CategoryAssignment](dw.catalog.CategoryAssignment.md) | Represents a category assignment in Commerce Cloud Digital. |
| [CategoryLink](dw.catalog.CategoryLink.md) | A CategoryLink represents a directed relationship between two catalog  categories. |
| [PriceBook](dw.catalog.PriceBook.md) | Represents a price book. |
| [PriceBookMgr](dw.catalog.PriceBookMgr.md) | Price book manager provides methods to access price books. |
| [Product](dw.catalog.Product.md) | Represents a product in Commerce Cloud Digital. |
| [ProductActiveData](dw.catalog.ProductActiveData.md) | Represents the active data for a [Product](dw.catalog.Product.md) in Commerce Cloud Digital. |
| [ProductAttributeModel](dw.catalog.ProductAttributeModel.md) | Class representing the complete attribute model for products in the system. |
| [ProductAvailabilityLevels](dw.catalog.ProductAvailabilityLevels.md) | Encapsulates the quantity of items available for each availability status. |
| [ProductAvailabilityModel](dw.catalog.ProductAvailabilityModel.md) | The ProductAvailabilityModel provides methods for retrieving all information  on availability of a single product. |
| [ProductInventoryList](dw.catalog.ProductInventoryList.md) | The ProductInventoryList provides access to ID, description and defaultInStockFlag of the list. |
| [ProductInventoryMgr](dw.catalog.ProductInventoryMgr.md) | This manager provides access to inventory-related objects. |
| [ProductInventoryRecord](dw.catalog.ProductInventoryRecord.md) | The ProductInventoryRecord holds information about a Product's inventory, and availability. |
| [ProductLink](dw.catalog.ProductLink.md) | The class represents a link between two products. |
| [ProductMgr](dw.catalog.ProductMgr.md) | Provides helper methods for getting products based on Product ID or [Catalog](dw.catalog.Catalog.md). |
| [ProductOption](dw.catalog.ProductOption.md) | Represents a product option. |
| [ProductOptionModel](dw.catalog.ProductOptionModel.md) | This class represents the option model of a specific product and  for a specific currency. |
| [ProductOptionValue](dw.catalog.ProductOptionValue.md) | Represents the value of a product option. |
| [ProductPriceInfo](dw.catalog.ProductPriceInfo.md) | Simple class representing a product price point. |
| [ProductPriceModel](dw.catalog.ProductPriceModel.md) | ProductPriceModel provides methods to access all the  [PriceBook](dw.catalog.PriceBook.md) information of a product. |
| [ProductPriceTable](dw.catalog.ProductPriceTable.md) | A ProductPriceTable is a map of quantities to prices representing the  potentially tiered prices of a product in Commerce Cloud Digital. |
| [ProductSearchHit](dw.catalog.ProductSearchHit.md) | ProductSearchHit is the result of a executed search query and wraps the actual product found by the search. |
| [ProductSearchModel](dw.catalog.ProductSearchModel.md) | The class is the central interface to a product search result and a product  search refinement. |
| [ProductSearchRefinementDefinition](dw.catalog.ProductSearchRefinementDefinition.md) | This class provides an interface to refinement options for the product search. |
| [ProductSearchRefinements](dw.catalog.ProductSearchRefinements.md) | This class provides an interface to refinement options for the product  search. |
| [ProductSearchRefinementValue](dw.catalog.ProductSearchRefinementValue.md) | Represents the value of a product search refinement. |
| [ProductVariationAttribute](dw.catalog.ProductVariationAttribute.md) | Represents a product variation attribute |
| [ProductVariationAttributeValue](dw.catalog.ProductVariationAttributeValue.md) | Represents a product variation attribute |
| [ProductVariationModel](dw.catalog.ProductVariationModel.md) | Class representing the complete variation information for a master product in  the system. |
| [Recommendation](dw.catalog.Recommendation.md) | Represents a recommendation in Commerce Cloud Digital. |
| [SearchModel](dw.catalog.SearchModel.md) | Common search model base class. |
| [SearchRefinementDefinition](dw.catalog.SearchRefinementDefinition.md) | Common search refinement definition base class. |
| [SearchRefinements](dw.catalog.SearchRefinements.md) | Common search refinements base class. |
| [SearchRefinementValue](dw.catalog.SearchRefinementValue.md) | Represents the value of a product or content search refinement. |
| [SortingOption](dw.catalog.SortingOption.md) | Represents an option for how to sort products in storefront search results. |
| [SortingRule](dw.catalog.SortingRule.md) | Represents a product sorting rule for use with the [ProductSearchModel](dw.catalog.ProductSearchModel.md). |
| [Store](dw.catalog.Store.md) | Represents a store in Commerce Cloud Digital. |
| [StoreGroup](dw.catalog.StoreGroup.md) | Represents a store group. |
| [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md) | <p>  This class represents a store inventory filter, which can be used at  [ProductSearchModel.setStoreInventoryFilter(StoreInventoryFilter)](dw.catalog.ProductSearchModel.md#setstoreinventoryfilterstoreinventoryfilter) to filter the search result by one or more  store inventories. |
| [StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md) | <p>  This class represents a store inventory filter value, which can be used for a [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md) to filter  the search result by one or more store inventory list IDs via  [ProductSearchModel.setStoreInventoryFilter(StoreInventoryFilter)](dw.catalog.ProductSearchModel.md#setstoreinventoryfilterstoreinventoryfilter). |
| [StoreMgr](dw.catalog.StoreMgr.md) | Provides helper methods for getting stores based on id and querying for  stores based on geolocation. |
| [Variant](dw.catalog.Variant.md) | Represents a variant of a product variation. |
| [VariationGroup](dw.catalog.VariationGroup.md) | Class representing a group of variants within a master product who share a  common value for one or more variation attribute values. |
