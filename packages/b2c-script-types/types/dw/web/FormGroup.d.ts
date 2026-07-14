import FormElement = require('./FormElement');
import FormAction = require('./FormAction');

/**
 * The class is the central class within the whole form handling. It is
 * the container element for fields and other form elements. A form group
 * can contain other forms, also called sub-forms.
 * 
 * Access to the elements of a form is provided via an index based access or
 * via an associative array access. For example, the field "firstname" can be accessed
 * with the expression "myform.firstname".
 */
declare class FormGroup extends FormElement {
    /**
     * Returns the number of elements in the form.
     */
    readonly childCount: number;
    /**
     * Returns a form-wide error message. If no error message
     * is present the method returns null.
     */
    readonly error: string | null;
    /**
     * The object that was bound to this form group.
     */
    readonly object: any;
    /**
     * Returns the action that was submitted with the last request. The action is
     * set independent whether the form must be valid for this action. The method
     * returns null if no action at all was submitted with the last request for this
     * form group.
     */
    readonly submittedAction: FormAction | null;
    /**
     * Returns the action that was triggered with the last request. An action is
     * only marked as triggered if the constraints regarding form validation are
     * meet. The method returns null if no action was marked as triggered.
     */
    readonly triggeredAction: FormAction | null;
    /**
     * The method copies the value from a form into the object, which was previously
     * bound to the form. The method is equivalent to the pipelet AcceptForm.
     * 
     * This method is equivalent to the call formgroup.copyFrom( formgroup.object ).
     */
    accept(): void;
    /**
     * The method updates the form with the values from the given object.
     * 
     * The method call is basically equivalent to the pipelet UpdateFormWithObject.
     * 
     * The method not only copies the value, it also binds the object to the form. Binding means that the form keeps the
     * information from which objects the values were taken. This can be used for two purposes:
     * 
     * - for lists it makes it easier in the code to find the associated object, for example in case of a related
     * action, and
     * - it allows to copy back the values from the form into the object (see accept).
     * 
     * Because of this bind behavior, the operation is also sometimes called a bind-operation.
     */
    copyFrom(obj: any): void;
    /**
     * The method updates the object with the values from the form.
     * 
     * The method call is basically equivalent to the pipelet UpdateObjectWithForm.
     * 
     * The method needs a submitted form. The copyTo call is delegated to the form fields. Each form field than checks
     * if its value was submitted as part of the form:
     * 
     * - If this is true, the object gets updated with the form field value.
     * - If this is false, the object will not be updated.
     * 
     * This is the reason why you cannot copy values from one object into another object by using
     * copyFrom and copyTo within the same request (e.g. by one call to a script or
     * controller).
     */
    copyTo(obj: any): void;
    /**
     * Returns the number of elements in the form.
     */
    getChildCount(): number;
    /**
     * Returns a form-wide error message. If no error message
     * is present the method returns null.
     */
    getError(): string | null;
    /**
     * The object that was bound to this form group.
     */
    getObject(): any;
    /**
     * Returns the action that was submitted with the last request. The action is
     * set independent whether the form must be valid for this action. The method
     * returns null if no action at all was submitted with the last request for this
     * form group.
     */
    getSubmittedAction(): FormAction | null;
    /**
     * Returns the action that was triggered with the last request. An action is
     * only marked as triggered if the constraints regarding form validation are
     * meet. The method returns null if no action was marked as triggered.
     */
    getTriggeredAction(): FormAction | null;
}

export = FormGroup;
