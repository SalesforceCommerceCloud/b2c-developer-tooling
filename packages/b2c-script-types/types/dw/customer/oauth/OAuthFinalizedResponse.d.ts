import OAuthUserInfoResponse = require('./OAuthUserInfoResponse');
import OAuthAccessTokenResponse = require('./OAuthAccessTokenResponse');

/**
 * Contains the combined responses from the third-party OAuth server when
 * finalizing the authentication.
 * 
 * Contains both the dw.customer.oauth.OAuthAccessTokenResponse
 * 
 * and the dw.customer.oauth.OAuthUserInfoResponse
 */
declare class OAuthFinalizedResponse {
    /**
     * Returns the access token response
     */
    readonly accessTokenResponse: OAuthAccessTokenResponse;
    /**
     * Returns the user info response
     */
    readonly userInfoResponse: OAuthUserInfoResponse;
    private constructor();
    /**
     * Returns the access token response
     */
    getAccessTokenResponse(): OAuthAccessTokenResponse;
    /**
     * Returns the user info response
     */
    getUserInfoResponse(): OAuthUserInfoResponse;
}

export = OAuthFinalizedResponse;
