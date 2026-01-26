
2.7.1. Pipeline to Controller Conversion

Pipeline building blocks are available in the pipeline editor in Studio.

Icon Component Description Conversion

Transition Control flow: creates a transition between two nodes and
configures transactions.

Transactions determine whether the transition starts, ends, or saves a
transaction.

Begin Transaction: marks the nodes that make up a transaction

Commit Transaction: commits the transaction to the database

Rollback Transaction: rolls back the previous transaction

Transaction Save Point: saves the transaction

Control flow: standard JavaScript application control flow, in which one
function calls another, in a controller.

Transactions: for explicit transactions that have begin, commit,
rollback, and save point transitions, require dw/system/Transaction and
use the begin, commit, and rollback methods. In controllers, you can
create a copy of objects before entering the transaction if you want to
simulate a save point.

Text Toole Enables you to add text inside pipeline that is visible in
the pipeline editor

Use the JSDoc comments in the file to document usage for your
controller. You can also build out your custom JSDoc using the
SiteGenesis build. See also Building JSDoc and the Styleguide.

Start Node A pipeline can have multiple start nodes. Each start node
begins a different logic branch and must have a unique name.

Call Mode: accessibility of the start node

Public: can be called via HTTP and via call or jump nodes

Private: can be called via call or jump nodes only

Secure Connection required:

true: incoming request must be https.

false: incoming request can be http.

Name: name used to execute the pipeline.

A controller is a CommonJS module with exposed functions that can be
called. Each exposed function serves the same purpose as a start node.

Call Mode and Secure Connection required: guards replace public and
private call modes. Guards can restrict access to controllers based on
protocol, HTTP method, or authorized login.

Name: The name of an exposed function. For example, if the Home pipeline
has a Show start node, the equivalent Home controller exposes a Show
function.

::: annotation
<https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/LegacyDevDoc/#>
:::

::: annotation
<https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/LegacyDevDoc/#>
:::

::: annotation
<https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/LegacyDevDoc/https://www.salesforce.com/company/privacy/>
:::

::: annotation
<https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/LegacyDevDoc/SiteGenesisSetup.html#SiteGenesisSetup__doc>
:::
:::::::

::: page
3/16/23, 2:11 PM Legacy Developer Documentation

https://documentation.b2c.commercecloud.salesforce.com/DOC1/advanced/print.jsp?topic=/com.demandware.dochelp/LegacyDevDoc/LegacyDevDoc.html&cp=...
47/158

Icon Component Description Conversion

Call Node

Jump Node

A call node calls a pipeline workflow and returns to the current
workflow.

A jump node calls a pipeline workflow and does not return to the current
workflow.

Description: description for other developers using the pipeline.

Dynamic: select false to specify a pipeline directly or true to specify
a dictionary item containing the pipeline.

Pipeline: pipeline name or Pipeline Dictionary item name

A controller is a CommonJS module and can require other modules and call
their functions.

Note: It\'s not recommended that controllers call each other, because
controller functionality is meant to be self-contained (to avoid
circular dependencies). Sometimes, however, such as calling non-public
controllers during the checkout process, it is unavoidable.

Script Node Calls a custom script

Configuration: specify how you want a script node to behave.

OnError: PIPELET_ERROR or exception

Script File: the Salesforce B2C Commerce script file to execute

Timeout in seconds for this script. The default is 30 seconds within
storefront requests and 15 minutes within jobs. The maximum upper limit
when executing within a job is 60 minutes. The maximum upper limit when
executing within a storefront request is 5 minutes.

Transactional: true or false

A controller is a CommonJS module and can require other modules and call
their functions. To call a script function directly, the script must be
modified to be a CommonJS module so it can be required.

OnError: Use standard JavaScript handling and the B2C Commerce Logger
class to write to B2C Commerce logs.

Timeout: a controller as a whole has a timeout of 5 minutes. You can use
standard JavaScript mechanisms to detect a long-running script, such as
a break loop.

Transactional: you can wrap the execution of a function from a script by
requiring dw/system/Transaction and using the wrap method.

Eval Node

Assign Node

Eval nodes evaluate an expression, resulting in an error, an exception,
or Dictionary output.

Assign nodes assign values to new or existing Pipeline Dictionary
entries, using up to 10 configured pairs of dictionary-input and
dictionary-output values.

Standard variable declaration and assignment in JavaScript replaces both
eval and assign nodes.

Decision Node

Join Node

Loop Node

Provides conditional branch in workflow

Comparison operator: comparison operator (for example, expression)

Decision Key: the Pipeline key to compare, typically to determine if its
content is null.

Join nodes provide a convergence point for multiple branches in workflow

Loop nodes provide for an iterative process

Iterator Definition:

Element Key: name of the Pipeline Dictionary item that holds the current
element

Iterator Key: name of the Pipeline Dictionary item to be used as the
iterator

Use standard JavaScript for control flow in a controller.

Interaction Node Specifies the page template used to show resulting
information

Dynamic Template:

If set to true, uses a template expression to identify a dynamic
template to use. This approach allows you to assign different templates
for different product types.

Use the View.js helper class or the other view classes provided in the
scripts directory to render templates and catch rendering errors.

Dynamic Template:

Use standard JavaScript to control which ISML template is rendered.

Interaction Continue Node

Processes a template based on user action via a browser. Usually, this
approach is used for forms. The template must reference a form
definition that defines storefront entry fields and buttons.

Call Properties:

Secure Connection required:

Use controllers to define the logic used when rendering the form and
handling form actions.

Secure Connection required: Guards replace public and private call
modes. Guards can restrict access to controllers based on protocol, HTTP
method, or authorized login.

Dynamic Template:
:::

::::::::::::: page
3/16/23, 2:11 PM Legacy Developer Documentation

https://documentation.b2c.commercecloud.salesforce.com/DOC1/advanced/print.jsp?topic=/com.demandware.dochelp/LegacyDevDoc/LegacyDevDoc.html&cp=...
48/158

Icon Component Description Conversion

true: incoming request must be https.

false: incoming request can be http.

Dynamic Template:

If set to true, uses a template expression to identify a dynamic
template to use. This approach lets you assign different templates for
different product types.

Use standard JavaScript to control which ISML template is rendered.

Stop Node Functions as an emergency break, comparable with an exception
within pipelets.

If you want to stop all pipelines, use a stop node. Avoid using stop
nodes in production.

Name: external name

Use standard JavaScript to control flow.

End Node Finishes the execution of the current pipeline

Name: must be unique within the pipeline. The calling pipeline can use
and end node to dispatch flow after a call.

The value of the name property is returned to the calling node. If there
is a transition off the calling node of the same name, that transition
is followed. End node names can be evaluated at the call node to
implement error handling.

If you choose to call a pipeline from a controller, the end node name is
returned to you. Otherwise, you can replace an end node name with a
variable.

