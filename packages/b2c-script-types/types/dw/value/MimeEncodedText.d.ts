/**
 * Container for an arbitrary text string its mime type, and encoding
 */
declare class MimeEncodedText {
    /**
     * Returns the encoding of the text. Encoding is set at creation time and
     * can't be changed afterwards
     */
    readonly encoding: string;
    /**
     * Returns the mime type of the text. Mime type is set at creation time and
     * can't be changed afterwards.
     */
    readonly mimeType: string;
    /**
     * Returns the text. Text is set at creation time and can't be changed
     * afterwards.
     */
    readonly text: string;
    /**
     * Creates a new MimeEncodedText with explicit values for mime type and
     * encoding.
     */
    constructor(text: string, mimeType: string, encoding: string);
    /**
     * Creates a new MimeEncodedText with the given String as text, mime type of
     * "text/plain;charset=UTF-8" and encoding of "UTF-8"
     */
    constructor(text: string);
    /**
     * Returns the encoding of the text. Encoding is set at creation time and
     * can't be changed afterwards
     */
    getEncoding(): string;
    /**
     * Returns the mime type of the text. Mime type is set at creation time and
     * can't be changed afterwards.
     */
    getMimeType(): string;
    /**
     * Returns the text. Text is set at creation time and can't be changed
     * afterwards.
     */
    getText(): string;
}

export = MimeEncodedText;
