/**
 * The class provides access to the values in the pipeline dictionary. You use
 * dynamic properties to access values, such as pdict.myvalue or
 * pdict['myvalue'];
 * 
 * The class is used in two different contexts, one where access is limited to
 * the declared input/output values and second to a context with full access.
 * Inside scripts, the PipelineDictionary allows you to access declared in/out
 * values (regardless of the alias used in the pipeline and the actual key under
 * which the value is stored). In templates and pipelines, all values can be
 * accessed. In templates the pipeline dictionary is exposed as variable pdict
 * (e.g. ${pdict.Product.ID}).
 * 
 * There are several values that are automatically stored in the
 * PipelineDictionary with each request. These include but are not limited to:
 * 
 * - CurrentSession
 * - CurrentRequest
 * - CurrentHttpParameterMap
 * - CurrentForms
 * - CurrentCustomer
 * - etc.
 */
declare class PipelineDictionary {
    private constructor();
}

export = PipelineDictionary;
