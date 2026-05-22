import URLRedirect = require('../../web/URLRedirect');
import OAuthFinalizedResponse = require('./OAuthFinalizedResponse');
import OAuthAccessTokenResponse = require('./OAuthAccessTokenResponse');
import OAuthUserInfoResponse = require('./OAuthUserInfoResponse');

/**
 * The OAuthLoginFlowMgr encapsulates interactions with third party
 * OAuth providers to support the Authorization Code Flow.
 * 
 * The way to use is:
 * 
 * - call initiateOAuthLogin
 * - redirect the user to the returned link
 * - when the user authenticates there the server will call back to
 * a URL configured on the provider's web site
 * - when processing the request made from the provider's web site
 * you have two choices - either call the obtainAccessToken
 * and obtainUserInfo
 * methods one after another separately (gives you more flexibility),
 * or call the finalizeOAuthLogin method which internally
 * calls the other two (simpler to use).
 * 
 * Sample code for using it:
 * 
 * ```
 * `
 * var finalizedResponse : OAuthFinalizedResponse = OAuthLoginFlowMgr.finalizeOAuthLogin();
 * var userInfo = finalizedResponse.userInfoResponse.userInfo;
 * `
 * ```
 * 
 * or:
 * @example
 * `
 * var accessTokenResponse : OAuthAccessTokenResponse = OAuthLoginFlowMgr.obtainAccessToken();
 * var userInfoResponse : OAuthUserInfoResponse = OAuthLoginFlowMgr.obtainUserInfo(
 * accessTokenResponse.oauthProviderId, accessTokenResponse.accessToken);
 * var userInfo = userInfoResponse.userInfo;
 * `
 */
declare class OAuthLoginFlowMgr {
    private constructor();
    /**
     * This method works in tandem with the initiateOAuthLogin method.
     * After the user has been redirected to the URL returned by that method
     * to the external OAuth2 provider and the user has interacted with the provider's
     * site, the browser is redirected to a URL configured on the provider's web
     * site. This URL should be that of a pipeline that contains
     * a script invoking the finalizeOAuthLogin method.
     * 
     * At this point the user has either been authenticated by the external provider
     * or not (forgot password, or simply refused to provide credentials). If the user
     * has been authenticated by the external provider and the provider returns an
     * authentication code, this method exchanges the code for a token and with that
     * token it requests from the provider the user information specified by the
     * configured scope (id, first/last name, email, etc.).
     * 
     * The method is aggregation of two other methods - obtainAccessToken
     * and obtainUserInfo
     * and is provided for convenience. You may want to
     * use the two individual methods instead if you need more flexibility.
     * 
     * This supports the Authorization Code Flow.
     */
    static finalizeOAuthLogin(): OAuthFinalizedResponse | null;
    /**
     * This method works in tandem with another method - finalizeOAuthLogin.
     * It starts the process of authentication via an external OAuth2 provider. It
     * takes one parameter - OAuthProviderId (as configured in the system). Outputs
     * an URL pointing to the OAuth2 provider's web page to which the browser should
     * redirect to initiate the actual user authentication or NULL if there is an
     * invalid configuration or an error occurs.
     * The method stores a few key/values in the session
     * (dw.system.Session.getPrivacy, implementation specific parameters and may change at any time)
     * to be picked up by the finalizeOAuthLogin method  when the provider redirects back.
     * 
     * This supports the Authorization Code Flow.
     */
    static initiateOAuthLogin(oauthProviderId: string): URLRedirect | null;
    /**
     * This method is called internally by finalizeOAuthLogin.
     * There are customer requests to expose a more granular way of
     * doing the interactions that finalizeOAuthLogin is currently doing
     * with the third party OAuth server to accommodate certain providers.
     * 
     * This supports the Authorization Code Flow.
     */
    static obtainAccessToken(): OAuthAccessTokenResponse;
    /**
     * This method is called internally by finalizeOAuthLogin.
     * There are customer requests to expose a more granular way of
     * doing the interactions that finalizeOAuthLogin is currently doing
     * with the third party OAuth server to accommodate certain providers.
     * 
     * This supports the Authorization Code Flow.
     */
    static obtainUserInfo(oauthProviderId: string, accessToken: string): OAuthUserInfoResponse;
}

export = OAuthLoginFlowMgr;
