import Writer = require('../io/Writer');
import File = require('../io/File');

/**
 * This class renders an Apache Velocity template. For Velocity template syntax, see
 * Velocity 1.7.
 * 
 * The render() methods identify the template to render from:
 * 
 * - a template file name, which is resolved in the Dynamic WebDAV file location for the current site.
 * Template file names must end with either '.vm' or '.vs'.
 * - a dw.io.File object, which can point to any file system location that is accessible from a script
 * - a string that holds the template content directly
 * Note: Files included from an ISML template (either via `#parse` or `#include`) are always resolved
 * in the Dynamic location, and it is not possible to provide an absolute path.
 * 
 * On the target side of rendering, by default the render() methods write to the current response writer. When needed,
 * a `dw.io.Writer` can be supplied as a target.
 * 
 * Parameters for rendering can be passed as a single object holding the parameters as properties.
 * 
 * To create a URL, pass the `URLUtils` class.
 * 
 * To access localized strings, pass the `Resource` class:
 * 
 * ```
 * `
 * var urlUtil = require('dw/web/URLUtils');
 * velocity.render("$url.abs('Foo-Bar','cgid',$res.msg('key')", {'url' : urlUtil, 'res' : dw.web.Resource});
 * `
 * ```
 * 
 * The complete set of VelocityTools
 * are provided to the template. You can use the tools to escape dynamic data, format text, and for other common tasks.
 * 
 * Template files are cached for different amounts of time, depending on the instance type.
 */
declare class Velocity {
    private constructor();
    /**
     * Includes the rendered content of the specified action URL, which usually is a pipeline or controller. Must only be used inside a Velocity
     * template, such as `$velocity.remoteInclude('Product-Show','sku','42')`
     */
    static remoteInclude(action: string, ...namesAndParams: string[]): string;
    /**
     * Renders an inline template to the response writer.
     */
    static render(templateContent: string, args: Object): void;
    /**
     * Renders an inline template to the provided writer.
     */
    static render(templateContent: string, args: Object, writer: Writer): void;
    /**
     * Renders a template file to the response writer.
     */
    static renderTemplate(templateFileName: string, args: Object): void;
    /**
     * Renders a template file to the provided writer.
     */
    static renderTemplate(templateFileName: string, args: Object, writer: Writer): void;
    /**
     * Renders a template file to the response writer.
     */
    static renderTemplate(templateFile: File, args: Object): void;
    /**
     * Renders a template file to the provided writer.
     */
    static renderTemplate(templateFile: File, args: Object, writer: Writer): void;
}

export = Velocity;
