import FormElement = require('./FormElement');

/**
 * The FormAction class represents the action in form instance hierarchy.
 */
declare class FormAction extends FormElement {
    /**
     * Returns the optional description for the action. The description could be used
     * as tooltip for the action.
     */
    readonly description: string;
    /**
     * Returns the optional label for the action. The label would be typically used
     * as button text.
     */
    readonly label: string;
    /**
     * Returns the object that was bound to the form in which the action
     * is contained. The method is a convenience method for getParent().getObject().
     * In most cases this is actually the object for which
     * the specific action is triggered.
     */
    readonly object: any;
    /**
     * Identifies if the form action was submitted from
     * the client to the server.
     */
    readonly submitted: boolean;
    /**
     * Identifies that this action is triggerd. An
     * action is only triggered if it was submitted and the constraints, regarding
     * a valid form, are met.
     */
    readonly triggered: boolean;
    /**
     * In case of an image button, returns the x coordinate of the last click.
     */
    readonly x: number;
    /**
     * In case of an image button, returns the y coordinate of the last click.
     */
    readonly y: number;
    private constructor();
    /**
     * Returns the optional description for the action. The description could be used
     * as tooltip for the action.
     */
    getDescription(): string;
    /**
     * Returns the optional label for the action. The label would be typically used
     * as button text.
     */
    getLabel(): string;
    /**
     * Returns the object that was bound to the form in which the action
     * is contained. The method is a convenience method for getParent().getObject().
     * In most cases this is actually the object for which
     * the specific action is triggered.
     */
    getObject(): any;
    /**
     * In case of an image button, returns the x coordinate of the last click.
     */
    getX(): number;
    /**
     * In case of an image button, returns the y coordinate of the last click.
     */
    getY(): number;
    /**
     * Identifies if the form action was submitted from
     * the client to the server.
     */
    isSubmitted(): boolean;
    /**
     * Identifies that this action is triggerd. An
     * action is only triggered if it was submitted and the constraints, regarding
     * a valid form, are met.
     */
    isTriggered(): boolean;
}

export = FormAction;
