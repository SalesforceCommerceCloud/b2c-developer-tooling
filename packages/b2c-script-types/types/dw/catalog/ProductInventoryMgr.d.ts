import ProductInventoryList = require('./ProductInventoryList');

/**
 * This manager provides access to inventory-related objects.
 */
declare class ProductInventoryMgr {
    /**
     * Integration mode 'B2C' - using B2C inventory, no integration with Omnichannel Inventory
     */
    static readonly INTEGRATIONMODE_B2C = "B2C";
    /**
     * Integration mode 'OCI' - integration with Omnichannel Inventory enabled
     */
    static readonly INTEGRATIONMODE_OCI = "OCI";
    /**
     * Integration mode 'OCI_CACHE' - using B2C inventory, initializing cache as preparation for integration with
     * Omnichannel Inventory
     */
    static readonly INTEGRATIONMODE_OCI_CACHE = "OCI_CACHE";
    /**
     * Returns the current inventory integration mode as one of
     * 
     * - ProductInventoryMgr.INTEGRATIONMODE_B2C
     * - ProductInventoryMgr.INTEGRATIONMODE_OCI_CACHE
     * - ProductInventoryMgr.INTEGRATIONMODE_OCI
     */
    static readonly inventoryIntegrationMode: string;
    /**
     * Returns the inventory list assigned to the current site or null if no inventory list is assigned to the current
     * site.
     */
    static readonly inventoryList: ProductInventoryList | null;
    private constructor();
    /**
     * Returns the current inventory integration mode as one of
     * 
     * - ProductInventoryMgr.INTEGRATIONMODE_B2C
     * - ProductInventoryMgr.INTEGRATIONMODE_OCI_CACHE
     * - ProductInventoryMgr.INTEGRATIONMODE_OCI
     */
    static getInventoryIntegrationMode(): string;
    /**
     * Returns the inventory list assigned to the current site or null if no inventory list is assigned to the current
     * site.
     */
    static getInventoryList(): ProductInventoryList | null;
    /**
     * Returns the inventory list with the passed ID or null if no inventory list exists with that ID.
     */
    static getInventoryList(listID: string): ProductInventoryList | null;
}

export = ProductInventoryMgr;
