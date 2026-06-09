/**
 * This APIException is thrown by method PageMgr.renderPage
 * and PageMgr.serializePage
 * to indicate that the passed aspect attributes failed during validation against the
 * definition provided through the aspect type of the page.
 */
declare class AspectAttributeValidationException {
    private constructor();
}

export = AspectAttributeValidationException;
