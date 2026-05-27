/**
 * This class provides support for rendering ISML templates. For more details about the ISML syntax, refer to the
 * Commerce Cloud Digital developer documentation. Templates are stored as *.isml files. They are located in a
 * locale-specific folder under the '/cartridge/templates' folder, with '/cartridge/template/default' being the default
 * locale. The template name arguments of the various render methods represent the template path (without file ending)
 * within this folder structure.
 * 
 * Example for rendering a template with arguments from JavaScript code:
 * 
 * ```
 * let isml = require('dw/template/ISML');
 * isml.renderTemplate('helloworld', {
 * Message: 'Hello, World!'
 * });
 * ```
 * 
 * Example code for accessing the template arguments in the 'helloworld.isml' template from the above code snippet:
 * @example
 * The message is: <isprint value="${pdict.Message}" />
 */
declare class ISML {
    private constructor();
    /**
     * Renders an ISML template and writes the output to the current response. The template may contain ISML tags which
     * control the character encoding, content type, caching behavior and so on of the response (see ISML
     * documentation). This method takes an additional JavaScript object as argument. Its properties are accessible for
     * script expressions in the template under the "pdict.*" variable.
     */
    static renderTemplate(template: string, templateArgs: any): void;
}

export = ISML;
