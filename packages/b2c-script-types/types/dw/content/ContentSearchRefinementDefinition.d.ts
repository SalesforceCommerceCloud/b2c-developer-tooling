import SearchRefinementDefinition = require('../catalog/SearchRefinementDefinition');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface ContentSearchRefinementDefinition extends ICustomAttributes.SearchRefinementDefinition {
        }
    }
}

/**
 * This class provides an interface to refinement options for content search.
 */
declare class ContentSearchRefinementDefinition extends SearchRefinementDefinition<ICustomAttributes.ContentSearchRefinementDefinition> {
    /**
     * Identifies if this is a folder refinement.
     */
    readonly folderRefinement: boolean;
    private constructor();
    /**
     * Identifies if this is a folder refinement.
     */
    isFolderRefinement(): boolean;
}

export = ContentSearchRefinementDefinition;
