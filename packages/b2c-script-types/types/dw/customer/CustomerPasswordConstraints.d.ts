/**
 * Provides access to the constraints of customer passwords. An instance of this class can be obtained via CustomerMgr.getPasswordConstraints.
 */
declare class CustomerPasswordConstraints {
    /**
     * Returns `true` if letters are enforced.
     */
    static readonly forceLetters: boolean;
    /**
     * Returns `true` if mixed case is enforced.
     */
    static readonly forceMixedCase: boolean;
    /**
     * Returns `true` if numbers are enforced.
     */
    static readonly forceNumbers: boolean;
    /**
     * Returns the minimum length.
     */
    static readonly minLength: number;
    /**
     * Returns the minimum number of special characters.
     */
    static readonly minSpecialChars: number;
    private constructor();
    /**
     * Returns the minimum length.
     */
    static getMinLength(): number;
    /**
     * Returns the minimum number of special characters.
     */
    static getMinSpecialChars(): number;
    /**
     * Returns `true` if letters are enforced.
     */
    static isForceLetters(): boolean;
    /**
     * Returns `true` if mixed case is enforced.
     */
    static isForceMixedCase(): boolean;
    /**
     * Returns `true` if numbers are enforced.
     */
    static isForceNumbers(): boolean;
}

export = CustomerPasswordConstraints;
