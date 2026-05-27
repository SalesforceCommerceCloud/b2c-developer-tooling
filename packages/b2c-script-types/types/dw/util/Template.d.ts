import MimeEncodedText = require('../value/MimeEncodedText');
import utilMap = require('./Map');

/**
 * Reads an ISML template from the file system and renders it into a
 * dw.value.MimeEncodedText object. Optional substitution values can be
 * passed to the isml template via the dw.util.Template.render
 * method. Substitution parameters can be accessed within the template through
 * 
 * ```
 * <isprint value="${param.parameter}">
 * ```
 * 
 * or for backward compatibility through
 * 
 * ```
 * <isprint value="${pdict.parameter}">
 * ```
 * 
 * The access through pdict only gives access to the parameter map provided at
 * rendering time and doesn't offer access to the system PipelineDictionary. The
 * pdict access to the property map is only considered to ease the transition
 * from SendMail pipelet API based templates. If the PipelineDictionary or
 * properties of the PipelineDictionary are needed, they need to be included in
 * the Property map passed to the render method.
 */
declare class Template {
    /**
     * Creates a new template. Doesn't render the template until
     * dw.util.Template.render or dw.util.Template.render
     * is invoked. The current request localeID will be used for Rendering.
     */
    constructor(templateName: string);
    /**
     * Creates a new template with the locale being set to the given localeID.
     * Rendering doesn't happen until dw.util.Template.render or
     * dw.util.Template.render is invoked.
     */
    constructor(templateName: string, localeID: string);
    /**
     * Renders the template specified at instantiation time, without any
     * substitution parameters. Any isprint tags referring to param/pdict will
     * be unresolved and will be replaced with empty strings. If there's an
     * explicit localeID set through dw.util.Template.setLocale,
     * it takes precedence over the localeID associated with the current
     * request.
     */
    render(): MimeEncodedText;
    /**
     * Renders the template specified at instantiation time with the given
     * substitution parameters. These parameters are available to ISML templates
     * through variables named 'param' and 'pdict'. Note that in this context,
     * pdict is not referring to the system PipelineDictionary, as the System
     * Pipeline Dictionary is not accessible from this script API. If there's an
     * explicit localeID set through dw.util.Template.setLocale,
     * it takes precedence over the localeID associated with the current
     * request.
     */
    render(params: utilMap<any, any>): MimeEncodedText;
    /**
     * Sets an optional localeID which is used instead of the current requests
     * localeID.
     */
    setLocale(localeID: string): Template;
}

export = Template;
