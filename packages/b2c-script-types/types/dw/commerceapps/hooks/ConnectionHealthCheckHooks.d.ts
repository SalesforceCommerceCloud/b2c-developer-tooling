import Status = require('../../system/Status');

/**
 * This interface represents the optional connection health check extension point for Commerce App providers. It lets a
 * Commerce App report whether its external service is reachable and operating correctly so Business Manager can surface
 * health on the app's installation details. Implementing this hook is not required &mdash; apps that do not depend on
 * an external connection may omit it entirely. When omitted, Business Manager does not display health status on the
 * app's tile.
 * 
 * A function must be defined inside a JavaScript source and must be exported. The script with the exported hook
 * function must be located inside a site cartridge. Inside the site cartridge a 'package.json' file with a 'hooks'
 * entry must exist.
 * 
 * ```
 * "hooks": "./hooks.json"
 * ```
 * 
 * The hooks entry links to a json file, relative to the 'package.json' file. This file lists all registered hooks
 * inside the hooks property:
 * 
 * ```
 * "hooks": [
 * {"name": "sfcc.app.tax.checkConnectionHealth", "script": "./checkConnectionHealth.js"}
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the exported hook function.
 * 
 * The hook is registered per app domain using the sfcc.app.<domain>.checkConnectionHealth
 * convention &mdash; for example, sfcc.app.tax.checkConnectionHealth for a tax app.
 * 
 * IMPORTANT: This hook should only be implemented and registered by Commerce Apps (applications
 * installed via the Commerce App framework with a CAP file). It is not intended for custom merchant cartridges or
 * storefront implementations.
 */
declare interface ConnectionHealthCheckHooks {
    /**
     * Reports the current health of the Commerce App's connection to its external service. The platform applies a CPU
     * timeout, so implementations should be lightweight and time-bounded.
     * 
     * The Business Manager connection-health endpoint that invokes this hook reports unknown when the hook
     * times out, throws, or returns null. dw.system.HookMgr.callHook itself rethrows any exception
     * raised by the hook script &mdash; the unknown translation is applied by the BM endpoint dispatcher, not
     * by HookMgr.
     * 
     * The BM endpoint interprets the returned dw.system.Status as follows: Status.OK &rarr; healthy;
     * Status.ERROR with code dw.commerceapps.ConnectionHealthStatusCodes.STATUS_CODE_DEGRADED DEGRADED
     * &rarr; degraded; Status.ERROR with code
     * dw.commerceapps.ConnectionHealthStatusCodes.STATUS_CODE_UNHEALTHY UNHEALTHY (or any other ERROR code)
     * &rarr; unhealthy. A null return is treated as unknown.
     * 
     * Use dw.system.Status.addDetail with keys
     * dw.commerceapps.ConnectionHealthStatusCodes.DETAIL_MESSAGE and
     * dw.commerceapps.ConnectionHealthStatusCodes.DETAIL_REMEDIATION to provide structured information for the
     * BM UI. dw.commerceapps.ConnectionHealthStatusCodes.DETAIL_REMEDIATION DETAIL_REMEDIATION should describe
     * actionable steps the merchant can take when the connection is degraded or unhealthy.
     * 
     * Both detail values are surfaced verbatim in Business Manager. To localize them for the BM admin's language, look
     * up the strings via dw.web.Resource from the cartridge's resource bundles (e.g. files under
     * cartridge/templates/resources/) instead of hard-coding English. The BM endpoint dispatcher invokes the
     * hook in the BM session locale, so Resource.msg resolves against the admin's language.
     * @example
     * var Resource = require('dw/web/Resource');
     * var Status = require('dw/system/Status');
     * 
     * exports.checkConnectionHealth = function () {
     * var status = new Status(Status.ERROR, 'DEGRADED');
     * status.addDetail('message', Resource.msg('healthcheck.degraded.message', 'taxapp', null));
     * status.addDetail('remediation',
     * Resource.msgf('healthcheck.degraded.remediation', 'taxapp', null, providerName));
     * return status;
     * };
     */
    checkConnectionHealth(): Status;
}

export = ConnectionHealthCheckHooks;
