/**
 * Library class which provides methods for retrieving messages from properties
 * resource bundles which contain locale-specific strings. When your program
 * needs a locale-specific String, it loads it from the resource bundle that is
 * appropriate for the user's current locale. In this way, the program code is
 * largely independent of the user's locale.
 * 
 * In Commerce Cloud Digital, resources are associated with the templates of a cartridge.
 * These bundles consist of properties files with a common name defined in the
 * template/resources directory of a site cartridge. For example:
 * 
 * - templates/resources/message.properties
 * - templates/resources/message_en.properties
 * - templates/resources/message_en_US.properties
 * - templates/resources/message_de_DE.properties
 * 
 * Resource bundle lookup generally follows the same rules as the Java
 * ResourceBundle class, where the locale used for lookup is based on the
 * current request. See method javadoc for additional details.
 * 
 * Properties resource files are assumed to use the UTF-8 character
 * encoding. Unicode escape sequences are also supported.
 */
declare class Resource {
    private constructor();
    /**
     * Returns the message from the default properties resource bundle (base
     * name "message") corresponding to the specified key and the request
     * locale.
     * 
     * This method is equivalent to msg(String, null).
     * @see msg
     */
    static msg(key: string): string;
    /**
     * Returns the message from the default properties resource bundle (base
     * name "message") corresponding to the specified key and the request
     * locale. If no message for the key is found, returns the default message
     * if it is not null, otherwise returns the key itself.
     * 
     * This method is equivalent to msg(key, null, defaultMessage).
     * @see msg
     */
    static msg(key: string, defaultMessage: string): string;
    /**
     * Returns the message from the specified properties resource bundle. The
     * resource bundle is located by iterating the site cartridges and looking
     * for a bundle with the specified name in the cartridge template/resources
     * directory. If it finds a bundle, it tries to return a message from the
     * bundle using standard Java ResourceBundle logic. If a message is found in
     * that cartridge's bundle, it is returned, otherwise, the next cartridge is
     * examined.
     * 
     * The method throws an exception if the key is null.
     */
    static msg(key: string, bundleName: string, defaultMessage: string): string;
    /**
     * Returns the message from the specified properties resource bundle, with
     * the provided arguments substituted for the message argument placeholders
     * (specified using the Java MessageFormat approach).
     * 
     * If null is passed for the varargs argument, this method is equivalent to
     * msg(key, bundleName, defaultMessage).
     * @see msg
     */
    static msgf(key: string, bundleName: string, defaultMessage: string, ...args: any[]): string;
}

export = Resource;
