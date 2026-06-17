/**
 * SecureEncoder contains many methods for manipulating untrusted data Strings
 * into RFC-Compliant Strings for a given context by encoding "bad" data into
 * the proper format.
 */
declare class SecureEncoder {
    private constructor();
    /**
     * 
     * 
     * Encodes a given input for use in a general HTML context. E.g.
     * text content and text attributes. This method takes the UNION of allowed
     * characters between the two context, so may be more imprecise that the
     * more specific contexts. Generally, this method is preferred unless you
     * specifically understand the context in which untrusted data will be
     * output.
     * 
     * Example Usage:
     * 
     * ```
     * <div>${SecureEncoder.forHtmlContent(unsafeData)}</div>
     * 
     * <input value="${SecureEncoder.forHtmlContent(unsafeData)}" />
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Replace Illegal Control Characters (Below 0x1F or between 0x7F and 0x9F)
     * with &#xfffd;, the Unicode Replacement Character
     * - Replace special HTML characters with their HTML Entity equivalents
     */
    static forHtmlContent(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in an HTML Attribute guarded by a double
     * quote. This method is preferred if you understand exactly how the output
     * of this will be used in the HTML document.
     * 
     * Example Usage:
     * 
     * ```
     * <div id="${SecureEncoder.forHtmlInDoubleQuoteAttribute(unsafeData)}"></div>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Replace Illegal Control Characters (Below 0x1F or between 0x7F and 0x9F)
     * with &#xfffd;, the Unicode Replacement Character
     * - Replace special HTML characters with their HTML Entity equivalents
     */
    static forHtmlInDoubleQuoteAttribute(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in an HTML Attribute guarded by a single
     * quote. This method is preferred if you understand exactly how the output
     * of this will be used in the HTML document.
     * 
     * Example Usage:
     * 
     * ```
     * <div id='${SecureEncoder.forHtmlInSingleQuoteAttribute(unsafeData)}'></div>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Replace Illegal Control Characters (Below 0x1F or between 0x7F and 0x9F)
     * with &#xfffd;, the Unicode Replacement Character
     * - Replace special HTML characters with their HTML Entity equivalents
     */
    static forHtmlInSingleQuoteAttribute(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in an HTML Attribute left unguarded.
     * This method is preferred if you understand exactly how the output
     * of this will be used in the HTML document.
     * 
     * Example Usage:
     * 
     * ```
     * <div id=${SecureEncoder.forHtmlUnquotedAttribute(unsafeData)}></div>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Replace Illegal Control Characters (Below 0x1F or between 0x7F and 0x9F)
     * with &#xfffd;, the Unicode Replacement Character
     * - Replace special HTML characters with their HTML Entity equivalents
     */
    static forHtmlUnquotedAttribute(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in a JSON Object Value to prevent
     * escaping into a trusted context.
     * 
     * Example Usage:
     * 
     * ```
     * var json = {"trusted_data" : SecureEncoder.forJSONValue(unsafeData)};
     * return JSON.stringify(json);
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics
     * - Slash escape certain illegal characters
     * - Replace all other characters with their Hex Encoded
     * equivalents prepended with \\u
     */
    static forJSONValue(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in JavaScript inside an HTML attribute.
     * This method is preferred if you understand exactly how the output
     * of the will be used in the page
     * 
     * Example Usage:
     * 
     * ```
     * <button onclick="alert('${SecureEncoder.forJavaScriptInAttribute(unsafeData)}');">
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Slash escape certain illegal characters
     * - Replace special JavaScript characters with their Hex Encoded
     * equivalents prepended with \\x for character codes under 128 and
     * \\u for character codes over 128
     */
    static forJavaScriptInAttribute(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in JavaScript inside an HTML block.
     * This method is preferred if you understand exactly how the output
     * of the will be used in the page
     * 
     * Example Usage:
     * 
     * ```
     * <script type="text/javascript">
     * var data = "${SecureEncoder.forJavaScriptInBlock(unsafeData)}";
     * </script>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Slash escape certain illegal characters
     * - Replace special JavaScript characters with their Hex Encoded
     * equivalents prepended with \\x for character codes under 128 and
     * \\u for character codes over 128
     */
    static forJavaScriptInBlock(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in JavaScript inside an HTML context.
     * This method takes the UNION of allowed characters among the other
     * contexts, so may be more imprecise that the more specific contexts.
     * Generally, this method is preferred unless you specifically understand
     * the context in which untrusted data will be output.
     * 
     * Example Usage:
     * 
     * ```
     * <script type="text/javascript">
     * var data = "${SecureEncoder.forJavaScriptInHTML(unsafeData)}";
     * </script>
     * 
     * <button onclick="alert('${SecureEncoder.forJavaScriptInHTML(unsafeData)}');">
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Slash escape certain illegal characters
     * - Replace special JavaScript characters with their Hex Encoded
     * equivalents prepended with \\x for character codes under 128 and
     * \\u for character codes over 128
     */
    static forJavaScriptInHTML(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in JavaScript inside a JavaScript source
     * file. This method is preferred if you understand exactly how the output
     * of the will be used in the page
     * 
     * Example Usage:
     * 
     * ```
     * <...inside foobar.js...>
     * var data = "${SecureEncoder.forJavaScriptInSource(unsafeData)}";
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Slash escape certain illegal characters
     * - Replace special JavaScript characters with their Hex Encoded
     * equivalents prepended with \\x for character codes under 128 and
     * \\u for character codes over 128
     */
    static forJavaScriptInSource(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use as a component of a URI. This is
     * equivalent to javascript's encodeURIComponent and does a realistic
     * job of encoding.
     * 
     * Example Usage:
     * 
     * ```
     * <a href="http://host.com?value=${SecureEncoder.forUriComponent(unsafeData)}"/>
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
     * - Percent encode all other characters
     */
    static forUriComponent(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use as a component of a URI. This is a strict
     * encoder and fully complies with RFC3986.
     * 
     * Example Usage:
     * 
     * ```
     * <a href="http://host.com?value=${SecureEncoder.forUriComponentStrict(unsafeData)}"/>
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
     * - Percent encode all other characters
     */
    static forUriComponentStrict(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in an XML comments.
     * This method is preferred if you understand the context in which
     * untrusted data will be output.
     * 
     * Note: It is recommended that you use a real parser, as this method
     * can be misused, but is left here if a parser is unavailable to you
     * 
     * Example Usage:
     * 
     * ```
     * <!-- ${SecureEncoder.forXmlCommentContent(unsafeData)} -->
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Replace Illegal Control Characters (Below 0x1F or between
     * 0x7F and 0x84 or between 0x86 and 0x9F or between 0xFDD0 and 0xFDDF)
     * with an empty string
     * - Replace special XML characters with their default XML Entity equivalents
     */
    static forXmlCommentContent(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in a general XML context. E.g.
     * text content and text attributes. This method takes the UNION of allowed
     * characters between the other contexts, so may be more imprecise that the
     * more specific contexts. Generally, this method is preferred unless you
     * specifically understand the context in which untrusted data will be
     * output.
     * 
     * Note: It is recommended that you use a real parser, as this method
     * can be misused, but is left here if a parser is unavailable to you
     * 
     * Example Usage:
     * 
     * ```
     * <foo>${SecureEncoder.forXmlContent(unsafeData)}</foo>
     * 
     * <bar attr="${SecureEncoder.forXmlContent(unsafeData)}"></bar>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Replace Illegal Control Characters (Below 0x1F or between
     * 0x7F and 0x84 or between 0x86 and 0x9F or between 0xFDD0 and 0xFDDF)
     * with an empty string
     * - Replace special XML characters with their default XML Entity equivalents
     */
    static forXmlContent(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in an XML attribute guarded by a double
     * quote. This method is preferred if you understand the context in which
     * untrusted data will be output.
     * 
     * Note: It is recommended that you use a real parser, as this method
     * can be misused, but is left here if a parser is unavailable to you
     * 
     * Example Usage:
     * 
     * ```
     * <bar attr="${SecureEncoder.forXmlInDoubleQuoteAttribute(unsafeData)}"></bar>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Replace Illegal Control Characters (Below 0x1F or between
     * 0x7F and 0x84 or between 0x86 and 0x9F or between 0xFDD0 and 0xFDDF)
     * with an empty string
     * - Replace special XML characters with their default XML Entity equivalents
     */
    static forXmlInDoubleQuoteAttribute(input: string): string;
    /**
     * 
     * 
     * Encodes a given input for use in an XML attribute guarded by a single
     * quote. This method is preferred if you understand the context in which
     * untrusted data will be output.
     * 
     * Note: It is recommended that you use a real parser, as this method
     * can be misused, but is left here if a parser is unavailable to you
     * 
     * Example Usage:
     * 
     * ```
     * <bar attr='${SecureEncoder.forXmlInSingleQuoteAttribute(unsafeData)}'></bar>
     * ```
     * 
     * Flow:
     * 
     * - Allow AlphaNumerics and some Special characters
     * - Replace Illegal Control Characters (Below 0x1F or between
     * 0x7F and 0x84 or between 0x86 and 0x9F or between 0xFDD0 and 0xFDDF)
     * with an empty string
     * - Replace special XML characters with their default XML Entity equivalents
     */
    static forXmlInSingleQuoteAttribute(input: string): string;
}

export = SecureEncoder;
