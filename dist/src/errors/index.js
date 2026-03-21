"use strict";
/**
 * Custom Error Classes for Stellar AgentKit
 *
 * Provides structured error handling with context and recovery suggestions.
 * All errors extend AgentKitError for consistent error handling across the SDK.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationNotAllowedError = exports.ContractError = exports.NetworkError = exports.SubmissionError = exports.SimulationError = exports.TransactionError = exports.MissingParameterError = exports.InvalidNetworkError = exports.InvalidAmountError = exports.InvalidAddressError = exports.ValidationError = exports.AgentKitError = void 0;
exports.isAgentKitError = isAgentKitError;
exports.ensureAgentKitError = ensureAgentKitError;
/**
 * Base error class for all Stellar AgentKit errors
 */
class AgentKitError extends Error {
    constructor(message, code, context = {}, suggestion, cause) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.context = context;
        this.suggestion = suggestion;
        this.cause = cause;
        // Maintain proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, AgentKitError.prototype);
    }
    /**
     * Get human-readable error message with context and suggestion
     * Safely handles non-serializable values like BigInt
     */
    getFormattedMessage() {
        let output = `${this.name} [${this.code}]\n${this.message}`;
        if (Object.keys(this.context).length > 0) {
            try {
                output += `\n\nContext:\n${Object.entries(this.context)
                    .map(([k, v]) => {
                    // Handle BigInt and other non-serializable types
                    if (typeof v === 'bigint') {
                        return `  ${k}: ${v.toString()}n`;
                    }
                    if (v === undefined) {
                        return `  ${k}: undefined`;
                    }
                    if (v === null) {
                        return `  ${k}: null`;
                    }
                    try {
                        return `  ${k}: ${JSON.stringify(v, (_key, value) => typeof value === 'bigint' ? `${value.toString()}n` : value)}`;
                    }
                    catch {
                        return `  ${k}: [Unserializable: ${typeof v}]`;
                    }
                })
                    .join('\n')}`;
            }
            catch (e) {
                output += `\n\nContext: [Failed to serialize context - ${String(e)}]`;
            }
        }
        if (this.suggestion) {
            output += `\n\nSuggestion: ${this.suggestion}`;
        }
        return output;
    }
}
exports.AgentKitError = AgentKitError;
/**
 * Thrown when input validation fails
 */
class ValidationError extends AgentKitError {
    constructor(message, context = {}, suggestion, cause) {
        super(message, 'VALIDATION_ERROR', context, suggestion || 'Please check your input parameters and try again.', cause);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
/**
 * Thrown when a Stellar address is invalid
 */
class InvalidAddressError extends ValidationError {
    constructor(address, context = {}) {
        const fullContext = { address, ...context };
        super(`Invalid Stellar address: "${address.slice(0, 10)}..."`, fullContext, `Ensure the address is a valid Stellar public key (starts with 'G' or 'C' and is 56 characters).`);
        Object.setPrototypeOf(this, InvalidAddressError.prototype);
    }
}
exports.InvalidAddressError = InvalidAddressError;
/**
 * Thrown when an amount value is invalid
 */
class InvalidAmountError extends ValidationError {
    constructor(amount, context = {}) {
        const fullContext = { amount: String(amount), ...context };
        super(`Invalid amount: "${amount}"`, fullContext, `Amount must be a positive number. Use string format for large numbers: "1000.50"`);
        Object.setPrototypeOf(this, InvalidAmountError.prototype);
    }
}
exports.InvalidAmountError = InvalidAmountError;
/**
 * Thrown when network configuration is invalid
 */
class InvalidNetworkError extends ValidationError {
    constructor(network, context = {}) {
        const fullContext = { network, ...context };
        super(`Invalid network: "${network}"`, fullContext, `Use one of: "testnet" | "mainnet"`);
        Object.setPrototypeOf(this, InvalidNetworkError.prototype);
    }
}
exports.InvalidNetworkError = InvalidNetworkError;
/**
 * Thrown when a required parameter is missing
 */
class MissingParameterError extends ValidationError {
    constructor(paramName, operation, context = {}) {
        const fullContext = { parameter: paramName, operation, ...context };
        super(`Missing required parameter: "${paramName}" in ${operation}`, fullContext, `Check the operation documentation and provide the required "${paramName}" parameter.`);
        Object.setPrototypeOf(this, MissingParameterError.prototype);
    }
}
exports.MissingParameterError = MissingParameterError;
/**
 * Thrown when a transaction operation fails
 */
class TransactionError extends AgentKitError {
    constructor(message, context = {}, suggestion, cause) {
        super(message, 'TRANSACTION_ERROR', context, suggestion || 'Check transaction parameters and retry.', cause);
        Object.setPrototypeOf(this, TransactionError.prototype);
    }
}
exports.TransactionError = TransactionError;
/**
 * Thrown when transaction simulation fails
 */
class SimulationError extends TransactionError {
    constructor(functionName, context = {}, cause) {
        super(`Transaction simulation failed for function: ${functionName}`, { functionName, ...context }, `Verify contract address, function parameters, and network connectivity.`, cause);
        Object.setPrototypeOf(this, SimulationError.prototype);
    }
}
exports.SimulationError = SimulationError;
/**
 * Thrown when transaction submission fails
 */
class SubmissionError extends TransactionError {
    constructor(message, context = {}, suggestion, cause) {
        super(message, context, suggestion || 'Check your account balance and retry.', cause);
        Object.setPrototypeOf(this, SubmissionError.prototype);
    }
}
exports.SubmissionError = SubmissionError;
/**
 * Thrown when network communication fails
 */
class NetworkError extends AgentKitError {
    constructor(message, context = {}, suggestion, cause) {
        super(message, 'NETWORK_ERROR', context, suggestion || 'Check your internet connection and try again.', cause);
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}
exports.NetworkError = NetworkError;
/**
 * Thrown when contract operation fails
 */
class ContractError extends AgentKitError {
    constructor(message, context = {}, suggestion, cause) {
        super(message, 'CONTRACT_ERROR', context, suggestion || 'Check contract documentation and parameters.', cause);
        Object.setPrototypeOf(this, ContractError.prototype);
    }
}
exports.ContractError = ContractError;
/**
 * Thrown when operation is not allowed in current context
 */
class OperationNotAllowedError extends AgentKitError {
    constructor(operation, reason, context = {}, suggestion) {
        const fullContext = { operation, reason, ...context };
        super(`Operation not allowed: ${operation} - ${reason}`, 'OPERATION_NOT_ALLOWED', fullContext, suggestion);
        Object.setPrototypeOf(this, OperationNotAllowedError.prototype);
    }
}
exports.OperationNotAllowedError = OperationNotAllowedError;
/**
 * Type guard to check if error is an AgentKitError
 */
function isAgentKitError(error) {
    return error instanceof AgentKitError;
}
/**
 * Unwrap or wrap an error as AgentKitError
 */
function ensureAgentKitError(error, defaultCode = 'UNKNOWN_ERROR') {
    if (isAgentKitError(error)) {
        return error;
    }
    const message = error instanceof Error ? error.message : String(error);
    return new AgentKitError(message, defaultCode, {}, undefined, error instanceof Error ? error : undefined);
}
