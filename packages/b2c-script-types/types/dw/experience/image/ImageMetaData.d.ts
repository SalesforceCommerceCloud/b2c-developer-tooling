/**
 * This class represents the image meta data, e.g. width and height.
 * @see Image
 */
declare class ImageMetaData {
    /**
     * Returns the image height.
     */
    readonly height: number;
    /**
     * Returns the image width.
     */
    readonly width: number;
    private constructor();
    /**
     * Returns the image height.
     */
    getHeight(): number;
    /**
     * Returns the image width.
     */
    getWidth(): number;
}

export = ImageMetaData;
