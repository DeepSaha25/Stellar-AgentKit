"use strict";
/**
 * Error handling utilities for Stellar AgentKit
 *
 * Provides helpers for error handling, logging, and recovery.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = handleError;
exports.handleErrorSync = handleErrorSync;
exports.tryAsync = tryAsync;
exports.trySync = trySync;
exports.recoverWith = recoverWith;
exports.chainOperations = chainOperations;
exports.isRetriable = isRetriable;
exports.retryWithBackoff = retryWithBackoff;
const index_1 = require("./index");
/**
 * Generic error handler wrapper
 * Catches errors, ensures they're AgentKitError, logs them, and decides whether to rethrow
 */
async function handleError(fn, options = {}) {
    const { logError = true, throwError = true, returnErrorObject = false } = options;
    try {
        return await fn();
    }
    catch (error) {
        const agentKitError = (0, index_1.ensureAgentKitError)(error);
        if (logError) {
            console.error(agentKitError.getFormattedMessage());
        }
        if (throwError) {
            throw agentKitError;
        }
        return returnErrorObject ? agentKitError : undefined;
    }
}
/**
 * Synchronous error handler wrapper
 */
function handleErrorSync(fn, options = {}) {
    try {
        return fn();
    }
    catch (error) {
        const agentKitError = (0, index_1.ensureAgentKitError)(error);
        if (options.logError) {
            console.error(agentKitError.getFormattedMessage());
        }
        if (options.throwError) {
            throw agentKitError;
        }
        return (options.returnErrorObject ? agentKitError : undefined);
    }
}
/**
 * Execute function and return result (no exceptions thrown)
 */
async function tryAsync(fn) {
    try {
        const data = await fn();
        return { success: true, data };
    }
    catch (error) {
        return { success: false, error: (0, index_1.ensureAgentKitError)(error) };
    }
}
/**
 * Execute function and return result (no exceptions thrown, synchronous)
 */
function trySync(fn) {
    try {
        const data = fn();
        return { success: true, data };
    }
    catch (error) {
        return { success: false, error: (0, index_1.ensureAgentKitError)(error) };
    }
}
/**
 * Error recovery helper - provides default value on error
 */
async function recoverWith(fn, defaultValue, shouldLog = true) {
    try {
        return await fn();
    }
    catch (error) {
        if (shouldLog) {
            const agentKitError = (0, index_1.ensureAgentKitError)(error);
            console.warn(`Operation failed, returning default: ${agentKitError.message}`);
        }
        return defaultValue;
    }
}
/**
 * Chain multiple operations with error handling
 */
async function chainOperations(operations, stopOnError = true) {
    const results = [];
    let succeeded = 0;
    let failed = 0;
    for (const operation of operations) {
        try {
            const result = await operation();
            results.push(result);
            succeeded++;
        }
        catch (error) {
            const agentKitError = (0, index_1.ensureAgentKitError)(error);
            results.push(agentKitError);
            failed++;
            if (stopOnError) {
                break;
            }
        }
    }
    return { results, succeeded, failed };
}
/**
 * Determine if error is retriable
 */
function isRetriable(error) {
    if (!(0, index_1.isAgentKitError)(error))
        return true; // Unknown errors might be retriable
    // These error codes are not retriable
    const nonRetriableCodes = [
        'VALIDATION_ERROR',
        'INVALID_ADDRESS_ERROR',
        'INVALID_AMOUNT_ERROR',
        'MISSING_PARAMETER_ERROR',
        'OPERATION_NOT_ALLOWED',
    ];
    return !nonRetriableCodes.includes(error.code);
}
async function retryWithBackoff(fn, options = {}) {
    const { maxAttempts = 3, initialDelayMs = 100, maxDelayMs = 5000, backoffMultiplier = 2, shouldRetry = isRetriable, } = options;
    let lastError;
    let delay = initialDelayMs;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
                throw (0, index_1.ensureAgentKitError)(lastError);
            }
            console.warn(`Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms: ${lastError.message}`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * backoffMultiplier, maxDelayMs);
        }
    }
    throw (0, index_1.ensureAgentKitError)(lastError);
}
