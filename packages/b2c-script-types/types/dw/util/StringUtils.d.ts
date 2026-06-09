import Money = require('../value/Money');
import Calendar = require('./Calendar');

/**
 * String utility class.
 */
declare class StringUtils {
    /**
     * String encoding type HTML.
     * @see encodeString
     */
    static readonly ENCODE_TYPE_HTML = 0;
    /**
     * String encoding type WML.
     * @see encodeString
     * @deprecated Don't use this constant anymore.
     */
    static readonly ENCODE_TYPE_WML = 2;
    /**
     * String encoding type XML.
     * @see encodeString
     */
    static readonly ENCODE_TYPE_XML = 1;
    /**
     * String truncate mode 'char'. Truncate string to the nearest character. Default mode if no truncate mode is specified.
     * @see truncate
     */
    static readonly TRUNCATE_CHAR = "char";
    /**
     * String truncate mode 'sentence'. Truncate string to the nearest sentence.
     * @see truncate
     */
    static readonly TRUNCATE_SENTENCE = "sentence";
    /**
     * String truncate mode 'word'. Truncate string to the nearest word.
     * @see truncate
     */
    static readonly TRUNCATE_WORD = "word";
    private constructor();
    /**
     * Interprets a Base64 encoded string as byte stream of an UTF-8 encoded string.
     * 
     * The method throws an IllegalArgumentException in case the encoding
     * failed because of a mismatch between the input string and the character encoding.
     */
    static decodeBase64(base64: string | null): string;
    /**
     * Interprets a Base64 encoded string as the byte stream representation of a string.
     * The given character encoding is used for decoding the byte stream into the
     * character representation.
     * 
     * The method throws an IllegalArgumentException in case the encoding
     * failed because of a mismatch between the input String and the character encoding.
     */
    static decodeBase64(base64: string | null, characterEncoding: string | null): string;
    /**
     * Convert a given syntax-safe string to a string according to the
     * selected character entity encoding type.
     */
    static decodeString(str: string, type: number): string;
    /**
     * Encodes the byte representation of the given string as Base64.
     * The string is converted into the byte representation with UTF-8 encoding.
     * 
     * The method throws an IllegalArgumentException in case the encoding
     * failed because of a mismatch between the input string and the character encoding.
     */
    static encodeBase64(str: string | null): string;
    /**
     * Encodes the byte representation of the given string as Base64.
     * The string is converted into the byte representation using the given
     * character encoding.
     * 
     * The method throws an IllegalArgumentException in case the encoding
     * failed because of a mismatch between the input string and the character encoding.
     */
    static encodeBase64(str: string | null, characterEncoding: string | null): string;
    /**
     * Convert a given string to a syntax-safe string according to the
     * selected character entity encoding type.
     */
    static encodeString(str: string, type: number): string;
    /**
     * Returns a formatted string using the specified format and arguments.
     * The formatting string is a Java MessageFormat expression, e.g.
     * format( "Message: {0}, {1}", "test", 10 ) would result in "Message: test, 10".
     * 
     * If a Collection is passed as the only argument, the elements of this collection
     * are used as arguments for the formatting.
     */
    static format(format: string, ...args: any[]): string;
    /**
     * Formats a Calendar object with Calendar.INPUT_DATE_TIME_PATTERN format
     * of the current request locale, for example "MM/dd/yyyy h:mm a" for the
     * locale en_US. The used time zone is the time zone of the calendar object.
     */
    static formatCalendar(calendar: Calendar): string;
    /**
     * Formats a Calendar object with the provided date format. The format is a
     * Java date format, like "yyy-MM-dd". The used time zone is the time zone
     * of the calendar object.
     */
    static formatCalendar(calendar: Calendar, format: string): string;
    /**
     * Formats a Calendar object with the date format defined by the provided locale
     * and Calendar pattern.  The locale can be for instance the request.getLocale().
     * The used time  zone is the time zone of the calendar object.
     */
    static formatCalendar(calendar: Calendar, locale: string, pattern: number): string;
    /**
     * Formats a date with the default date format of the current site.
     * @deprecated Use formatCalendar instead.
     */
    static formatDate(date: Date): string;
    /**
     * Formats a date with the provided date format. The format is the
     * Java date format, like "yyyy-MM-DD". The locale of the calling context
     * request is used in formatting.
     * @deprecated Use formatCalendar instead.
     */
    static formatDate(date: Date, format: string): string;
    /**
     * Formats a date with the provided date format in specified locale. The format is
     * Java date format, like "yyyy-MM-DD".
     * @deprecated Use formatCalendar instead.
     */
    static formatDate(date: Date, format: string, locale: string): string;
    /**
     * Returns a formatted integer number using the default integer format of the current
     * site. The method can be also called to format a floating number as integer.
     */
    static formatInteger(number: number): string;
    /**
     * Formats a Money Object with the default money format of the current request locale.
     */
    static formatMoney(money: Money): string;
    /**
     * Returns a formatted number as a string using the specified number format in specified locale. The format is
     * Java number format, like "#,###.00". To format as an integer
     * number provide "0" as format string.
     */
    static formatNumber(number: number, format: string, locale: string): string;
    /**
     * Return a string in which specified number of characters in the suffix is not changed
     * and the rest of the characters replaced with specified character.
     */
    static garble(str: string, replaceChar: string, suffixLength: number): string;
    /**
     * Returns the string with leading white space removed.
     */
    static ltrim(str: string): string;
    /**
     * This method provides cell padding functionality to the template.
     */
    static pad(str: string, width: number): string;
    /**
     * Returns the string with trailing white space removed.
     */
    static rtrim(str: string): string;
    /**
     * Convert a given string to an HTML-safe string.
     * This method substitutes characters that conflict with HTML syntax
     * (<,>,&,") and characters that are beyond the ASCII
     * chart (Unicode 160-255) to HTML 3.2 named character entities.
     */
    static stringToHtml(str: string): string;
    /**
     * Converts a given string to a WML-safe string.
     * This method substitutes characters that conflict with WML syntax
     * (<,>,&,&apos;,"$) to WML named character entities.
     * @deprecated Don't use this method anymore
     */
    static stringToWml(str: string): string;
    /**
     * Converts a given string to a XML-safe string.
     * This method substitutes characters that conflict with XML syntax
     * (<,>,&,&apos;,") to XML named character entities.
     */
    static stringToXml(str: string): string;
    /**
     * Returns the string with leading and trailing white space removed.
     */
    static trim(str: string): string;
    /**
     * Truncate the string to the specified length using specified truncate mode. Optionally,
     * append suffix to truncated string.
     */
    static truncate(str: string, maxLength: number, mode: string, suffix: string): string;
}

export = StringUtils;
