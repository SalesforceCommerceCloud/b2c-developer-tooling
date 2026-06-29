import utilMap = require('../util/Map');
import CustomEditorResources = require('./CustomEditorResources');

/**
 * This class represents a custom editor for component attributes of type `custom`. It is instantiated
 * by Page Designer and is subsequently used there for editing of such attributes by the merchant in a visual manner.
 * It therefore serves the Page Designer with all information required by such UI. What exactly
 * this information will be is up to the developer of the respective custom editor UI, i.e. depends on the respective
 * json and js files written for both the attribute definition as well as the custom editor type. Currently a configuration can be
 * served (basically values passed to Page Designer so that it can bootstrap the custom editor UI on the client side).
 * Furthermore resources can be served, which are URLs to scripts and styles required by the same UI (you will
 * likely require your own Javascript and CSS there).
 * 
 * You can access the aforementioned configuration as provided through the editor definition of the respective attribute
 * definition, which you can also adjust in the `init` function (see corresponding js file of your custom editor
 * type) that is called during initialization of the custom editor, i.e. right before it is passed to the Page Designer UI.
 * The same applies for the script and style resources which you specified as part of your custom editor type and which you
 * can refine with the `init` function as needed.
 */
declare class CustomEditor {
    /**
     * Returns the configuration of the custom editor. This is initialized with the values as provided
     * through the editor definition of the respective attribute definition of type `custom`.
     * Be aware that this configuration will have to be serializable to JSON itself as it will be passed
     * to Page Designer for processing in the UI. So you must not add any values in this map that are not
     * properly serializable. Do not use complex DWScript classes that do not support JSON serialization
     * like for instance dw.catalog.Product.
     */
    readonly configuration: utilMap<any, any>;
    /**
     * 
     * 
     * Returns the dependencies to other custom editors, e.g. used as breakout elements. You can use
     * this mapping to add more custom editor dependencies as needed. For this purpose you want to create
     * a CustomEditor instance via PageMgr.getCustomEditor) and then add it
     * to the dependencies mapping with an ID of your choice. In the client side logic of Page Designer
     * you will then be able to access these dependencies again by using the corresponding ID.
     * 
     * This is especially helpful if your custom editor for an attribute requires to open a breakout panel,
     * e.g. for a separate picker required by your custom editor. This picker could be another custom editor,
     * i.e. the one you declare as dependency here.
     */
    readonly dependencies: utilMap<any, any>;
    /**
     * Returns the resources of the custom editor. This is initialized with the values as specified
     * by the custom editor type json (see the respective styles and scripts section).
     */
    readonly resources: CustomEditorResources;
    private constructor();
    /**
     * Returns the configuration of the custom editor. This is initialized with the values as provided
     * through the editor definition of the respective attribute definition of type `custom`.
     * Be aware that this configuration will have to be serializable to JSON itself as it will be passed
     * to Page Designer for processing in the UI. So you must not add any values in this map that are not
     * properly serializable. Do not use complex DWScript classes that do not support JSON serialization
     * like for instance dw.catalog.Product.
     */
    getConfiguration(): utilMap<any, any>;
    /**
     * 
     * 
     * Returns the dependencies to other custom editors, e.g. used as breakout elements. You can use
     * this mapping to add more custom editor dependencies as needed. For this purpose you want to create
     * a CustomEditor instance via PageMgr.getCustomEditor) and then add it
     * to the dependencies mapping with an ID of your choice. In the client side logic of Page Designer
     * you will then be able to access these dependencies again by using the corresponding ID.
     * 
     * This is especially helpful if your custom editor for an attribute requires to open a breakout panel,
     * e.g. for a separate picker required by your custom editor. This picker could be another custom editor,
     * i.e. the one you declare as dependency here.
     */
    getDependencies(): utilMap<any, any>;
    /**
     * Returns the resources of the custom editor. This is initialized with the values as specified
     * by the custom editor type json (see the respective styles and scripts section).
     */
    getResources(): CustomEditorResources;
}

export = CustomEditor;
