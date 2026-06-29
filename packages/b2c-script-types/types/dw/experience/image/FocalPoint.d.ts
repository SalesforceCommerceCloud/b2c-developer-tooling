/**
 * This class represents an image focal point.
 * @see Image
 */
declare class FocalPoint {
    /**
     * Returns the focal point abscissa.
     */
    readonly x: number;
    /**
     * Returns the focal point ordinate.
     */
    readonly y: number;
    private constructor();
    /**
     * Returns the focal point abscissa.
     */
    getX(): number;
    /**
     * Returns the focal point ordinate.
     */
    getY(): number;
}

export = FocalPoint;
