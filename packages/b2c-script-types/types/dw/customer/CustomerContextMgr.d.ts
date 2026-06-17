/**
 * Provides helper methods for managing customer context, such as the Effective Time for which the customer is shopping
 * at
 */
declare class CustomerContextMgr {
    /**
     * Get the effective time associated with the customer. By default, the effective time is null.
     */
    static effectiveTime: Date | null;
    private constructor();
    /**
     * Get the effective time associated with the customer. By default, the effective time is null.
     */
    static getEffectiveTime(): Date | null;
    /**
     * Set the effective time for the customer. Null is allowed to remove effective time from the customer.
     */
    static setEffectiveTime(effectiveTime: Date): void;
}

export = CustomerContextMgr;
