/**
 * The class represent a stream of bytes that can be read from the
 * application. The InputStream itself doesn't provide any methods
 * to read the data. Instead the InputStream can be chained with
 * other classes like a XMLStreamReader to read data.
 */
declare class InputStream {
    private constructor();
    /**
     * Closes the input stream.
     */
    close(): void;
}

export = InputStream;
