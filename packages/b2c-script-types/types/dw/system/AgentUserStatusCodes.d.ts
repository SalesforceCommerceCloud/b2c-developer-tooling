import customerAgentUserStatusCodes = require('../customer/AgentUserStatusCodes');

/**
 * AgentUserStatusCodes contains constants representing status codes that can be
 * used with a Status object to indicate the success or failure of the agent
 * user login process.
 * @see dw.system.Status
 * @deprecated see dw.customer.AgentUserStatusCodes - this class should only be used for the LoginAgentUser / LoginOnBehalfCustomer pipelets
 */
declare class AgentUserStatusCodes extends customerAgentUserStatusCodes {
    private constructor();
}

export = AgentUserStatusCodes;
