import utilMap = require('../../util/Map');

/**
 * Contains OAuth-related artifacts from the HTTP response from the third-party
 * OAuth server when requesting an access token
 */
declare class OAuthAccessTokenResponse {
    /**
     * Returns the ID token, if available
     */
    readonly IDToken: string | null;
    /**
     * Returns the access token
     */
    readonly accessToken: string | null;
    /**
     * Returns the access token expiration
     */
    readonly accessTokenExpiry: number;
    /**
     * Returns the error status.
     * In cases of errors - more detailed error information
     * can be seen in the error log files (specifity of error details vary by OAuth provider).
     */
    readonly errorStatus: string | null;
    /**
     * Returns a map of additional tokens found in the response.
     */
    readonly extraTokens: utilMap<any, any> | null;
    /**
     * Returns the OAuth provider id
     */
    readonly oauthProviderId: string;
    /**
     * Returns the refresh token
     */
    readonly refreshToken: string | null;
    private constructor();
    /**
     * Returns the access token
     */
    getAccessToken(): string | null;
    /**
     * Returns the access token expiration
     */
    getAccessTokenExpiry(): number;
    /**
     * Returns the error status.
     * In cases of errors - more detailed error information
     * can be seen in the error log files (specifity of error details vary by OAuth provider).
     */
    getErrorStatus(): string | null;
    /**
     * Returns a map of additional tokens found in the response.
     */
    getExtraTokens(): utilMap<any, any> | null;
    /**
     * Returns the ID token, if available
     */
    getIDToken(): string | null;
    /**
     * Returns the OAuth provider id
     */
    getOauthProviderId(): string;
    /**
     * Returns the refresh token
     */
    getRefreshToken(): string | null;
}

export = OAuthAccessTokenResponse;
