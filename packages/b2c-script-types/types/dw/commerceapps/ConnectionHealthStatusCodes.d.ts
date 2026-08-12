/**
 * Status codes and detail keys returned by the
 * dw.commerceapps.hooks.ConnectionHealthCheckHooks.checkConnectionHealth hook. The BM connection-health
 * endpoint translates the returned dw.system.Status into a health payload using these values.
 * @see dw.commerceapps.hooks.ConnectionHealthCheckHooks
 */
declare class ConnectionHealthStatusCodes {
    /**
     * dw.system.Status detail key for the human-readable status message.
     */
    static readonly DETAIL_MESSAGE = "message";
    /**
     * dw.system.Status detail key for the merchant-facing remediation hint.
     */
    static readonly DETAIL_REMEDIATION = "remediation";
    /**
     * Status code that indicates a degraded connection (partial functionality available).
     */
    static readonly STATUS_CODE_DEGRADED = "DEGRADED";
    /**
     * Status code that indicates the connection is unhealthy.
     */
    static readonly STATUS_CODE_UNHEALTHY = "UNHEALTHY";
    private constructor();
}

export = ConnectionHealthStatusCodes;
