import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Folder = require('./Folder');

declare global {
    module ICustomAttributes {
        interface Library extends CustomAttributes {
        }
    }
}

/**
 * Class representing a collection of dw.content.Content assets, and a
 * dw.content.Folder hierarchy organizing these content assets.
 * Currently only one library is allowed per site. An instance of this library
 * can be obtained by calling dw.content.ContentMgr.getSiteLibrary.
 */
declare class Library extends ExtensibleObject<ICustomAttributes.Library> {
    /**
     * Returns the CMS channel of the library.
     */
    readonly CMSChannelID: string;
    /**
     * Returns the ID of this library.
     */
    readonly ID: string;
    /**
     * Returns the display name for the library as known in the current
     * locale or null if it cannot be found.
     */
    readonly displayName: string | null;
    /**
     * Returns the root folder for this library.
     */
    readonly root: Folder;
    private constructor();
    /**
     * Returns the CMS channel of the library.
     */
    getCMSChannelID(): string;
    /**
     * Returns the display name for the library as known in the current
     * locale or null if it cannot be found.
     */
    getDisplayName(): string | null;
    /**
     * Returns the ID of this library.
     */
    getID(): string;
    /**
     * Returns the root folder for this library.
     */
    getRoot(): Folder;
}

export = Library;
