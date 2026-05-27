import Content = require('../content/Content');

/**
 * This class represents a suggested content page.
 * Use getContent method to get access to the actual dw.content.Content object.
 */
declare class SuggestedContent {
    /**
     * This method returns the actual dw.content.Content object corresponding to this suggested content.
     */
    readonly content: Content;
    private constructor();
    /**
     * This method returns the actual dw.content.Content object corresponding to this suggested content.
     */
    getContent(): Content;
}

export = SuggestedContent;
