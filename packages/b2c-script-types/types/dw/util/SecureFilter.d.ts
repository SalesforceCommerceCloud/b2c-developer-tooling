/**
 * SecureFilter contains many methods for manipulating untrusted data Strings
 * into RFC-Compliant Strings for a given context by removing "bad" data from
 * the untrusted data.
 */
declare class SecureFilter {
    private constructor();
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in a general HTML
     * context. E.g. text content and text attributes. This method takes the
     * UNION of allowed characters among all contexts, so may be more
     * imprecise that the more specific contexts. Generally, this method is
     * preferred unless you specifically understand the context in which
     * untrusted data will be output.
     * 
     * Example Usage:
     * 
     * ```
     * <div>${SecureFilter.forHtmlContent(unsafeData)}</div>
     * 
     * <input value="${SecureFilter.forHtmlContent(unsafeData)}" />
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forHtmlContent(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in an HTML
     * Attribute guarded by a double quote. This method is preferred if you
     * understand exactly how the output of this will be used in the HTML
     * document.
     * 
     * Example Usage:
     * 
     * ```
     * <div id="${SecureFilter.forHtmlInDoubleQuoteAttribute(unsafeData)}"></div>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forHtmlInDoubleQuoteAttribute(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in an HTML
     * Attribute guarded by a single quote. This method is preferred if you
     * understand exactly how the output of this will be used in the HTML
     * document.
     * 
     * Example Usage:
     * 
     * ```
     * <div id='${SecureFilter.forHtmlInSingleQuoteAttribute(unsafeData)}'></div>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forHtmlInSingleQuoteAttribute(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in an HTML
     * Attribute left unguarded. This method is preferred if you understand
     * exactly how the output of this will be used in the HTML document.
     * 
     * Example Usage:
     * 
     * ```
     * <div id=${SecureFilter.forHtmlUnquotedAttribute(unsafeData)}></div>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forHtmlUnquotedAttribute(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in a JSON Object
     * Value to prevent escaping into a trusted context.
     * 
     * Example Usage:
     * 
     * ```
     * var json = {"trusted_data" : SecureFilter.forJSONValue(unsafeData)};
     * return JSON.stringify(json);
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics
     * - Remove all other characters
     */
    static forJSONValue(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in JavaScript
     * inside an HTML attribute. This method is preferred if you understand
     * exactly how the output of the will be used in the page
     * 
     * Example Usage:
     * 
     * ```
     * <button onclick="alert('${SecureFilter.forJavaScriptInAttribute(unsafeData)}');">
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forJavaScriptInAttribute(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in JavaScript
     * inside an HTML block. This method is preferred if you understand
     * exactly how the output of the will be used in the page
     * 
     * Example Usage:
     * 
     * ```
     * <script type="text/javascript">
     * var data = "${SecureFilter.forJavaScriptInBlock(unsafeData)}";
     * </script>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forJavaScriptInBlock(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in JavaScript
     * inside an HTML context. This method takes the UNION of allowed
     * characters among the other contexts, so may be more imprecise that the
     * more specific contexts. Generally, this method is preferred unless you
     * specifically understand the context in which untrusted data will be
     * output.
     * 
     * Example Usage:
     * 
     * ```
     * <script type="text/javascript">
     * var data = "${SecureFilter.forJavaScriptInHTML(unsafeData)}";
     * </script>
     * 
     * <button onclick="alert('${SecureFilter.forJavaScriptInHTML(unsafeData)}');">
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forJavaScriptInHTML(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in JavaScript
     * inside a JavaScript source file. This method is preferred if you
     * understand exactly how the output of the will be used in the page
     * 
     * Example Usage:
     * 
     * ```
     * <...inside foobar.js...>
     * var data = "${SecureFilter.forJavaScriptInSource(unsafeData)}";
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forJavaScriptInSource(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use as a component
     * of a URI. This is equivalent to javascript's filterURIComponent and
     * does a realistic job of encoding.
     * 
     * Example Usage:
     * 
     * ```
     * <a href="http://host.com?value=${SecureFilter.forUriComponent(unsafeData)}"/>
     * ```
     * 
     * Allows:
     * 
     * ```
     * A-Z, a-z, 0-9, -, _, ., ~, !, *, ', (, )
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forUriComponent(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use as a component
     * of a URI. This is a strict filter and fully complies with RFC3986.
     * 
     * Example Usage:
     * 
     * ```
     * <a href="http://host.com?value=${SecureFilter.forUriComponentStrict(unsafeData)}"/>
     * ```
     * 
     * Allows:
     * 
     * ```
     * A-Z, a-z, 0-9, -, _, ., ~
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forUriComponentStrict(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in an XML
     * comments. This method is preferred if you understand the context in
     * which untrusted data will be output.
     * 
     * Note: It is recommended that you use a real parser, as this method
     * can be misused, but is left here if a parser is unavailable to you
     * 
     * Example Usage:
     * 
     * ```
     * <!-- ${SecureFilter.forXmlCommentContent(unsafeData)} -->
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forXmlCommentContent(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in a general XML
     * context. E.g. text content and text attributes. This method takes the
     * UNION of allowed characters between the other contexts, so may be more
     * imprecise that the more specific contexts. Generally, this method is
     * preferred unless you specifically understand the context in which
     * untrusted data will be output.
     * 
     * Note: It is recommended that you use a real parser, as this method
     * can be misused, but is left here if a parser is unavailable to you
     * 
     * Example Usage:
     * 
     * ```
     * <foo>${SecureFilter.forXmlContent(unsafeData)}</foo>
     * 
     * <bar attr="${SecureFilter.forXmlContent(unsafeData)}"></bar>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forXmlContent(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in an XML
     * attribute guarded by a double quote. This method is preferred if you
     * understand the context in which untrusted data will be output.
     * 
     * Note: It is recommended that you use a real parser, as this method
     * can be misused, but is left here if a parser is unavailable to you
     * 
     * Example Usage:
     * 
     * ```
     * <bar attr="${SecureFilter.forXmlInDoubleQuoteAttribute(unsafeData)}"></bar>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forXmlInDoubleQuoteAttribute(input: string): string;
    /**
     * 
     * 
     * Filters illegal characters from a given input for use in an XML
     * attribute guarded by a single quote. This method is preferred if you
     * understand the context in which untrusted data will be output.
     * 
     * Note: It is recommended that you use a real parser, as this method
     * can be misused, but is left here if a parser is unavailable to you
     * 
     * Example Usage:
     * 
     * ```
     * <bar attr='${SecureFilter.forXmlInSingleQuoteAttribute(unsafeData)}'></bar>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Remove all other characters
     */
    static forXmlInSingleQuoteAttribute(input: string): string;
}

export = SecureFilter;
