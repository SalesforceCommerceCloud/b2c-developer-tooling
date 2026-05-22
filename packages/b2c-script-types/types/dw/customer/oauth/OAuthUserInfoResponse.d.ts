/**
 * Contains the response from the third-party OAuth server when
 * requesting user info. Refer to the corresponding OAuth provider documentation
 * regarding what the format might be (in most cases it would be JSON).
 * The data returned would also vary depending on the scope.
 */
declare class OAuthUserInfoResponse {
    /**
     * Returns the error status
     * In cases of errors - more detailed error information
     * can be seen in the error log files (specificity of error details vary by OAuth provider).
     */
    readonly errorStatus: string;
    /**
     * Returns the user info as a String. Refer to the corresponding OAuth provider documentation
     * regarding what the format might be (in most cases it would be JSON).
     * The data returned would also vary depending on the configured 'scope'.
     */
    readonly userInfo: string;
    private constructor();
    /**
     * Returns the error status
     * In cases of errors - more detailed error information
     * can be seen in the error log files (specificity of error details vary by OAuth provider).
     */
    getErrorStatus(): string;
    /**
     * Returns the user info as a String. Refer to the corresponding OAuth provider documentation
     * regarding what the format might be (in most cases it would be JSON).
     * The data returned would also vary depending on the configured 'scope'.
     */
    getUserInfo(): string;
}

export = OAuthUserInfoResponse;
