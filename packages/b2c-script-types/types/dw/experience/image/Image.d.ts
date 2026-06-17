import MediaFile = require('../../content/MediaFile');
import FocalPoint = require('./FocalPoint');
import ImageMetaData = require('./ImageMetaData');

/**
 * This class represents an image with additional configuration capabilities (e.g. optional focal point).
 * Furthermore it provides access to meta data of the referenced image file.
 * @see FocalPoint
 * @see ImageMetaData
 */
declare class Image {
    /**
     * Returns the image media file from the current site's library.
     */
    readonly file: MediaFile | null;
    /**
     * Returns the focal point of the image.
     */
    readonly focalPoint: FocalPoint | null;
    /**
     * Returns the meta data of the physical image file. This meta data is obtained when
     * the respective component attribute was saved from Page Designer, i.e. the underlying
     * image is not queried for the meta data every time getMetaData is called
     * but only on store of the related component attribute.
     */
    readonly metaData: ImageMetaData | null;
    private constructor();
    /**
     * Returns the image media file from the current site's library.
     */
    getFile(): MediaFile | null;
    /**
     * Returns the focal point of the image.
     */
    getFocalPoint(): FocalPoint | null;
    /**
     * Returns the meta data of the physical image file. This meta data is obtained when
     * the respective component attribute was saved from Page Designer, i.e. the underlying
     * image is not queried for the meta data every time getMetaData is called
     * but only on store of the related component attribute.
     */
    getMetaData(): ImageMetaData | null;
}

export = Image;
