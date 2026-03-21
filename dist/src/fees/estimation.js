"use strict";
/**
 * Gas Estimation Engine for Stellar AgentKit
 *
 * Estimates Soroban operation fees before execution.
 * Critical for DeFi UX - users need to know costs upfront.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feeEstimationCache = exports.FeeEstimationCache = void 0;
exports.estimateSorobanFee = estimateSorobanFee;
exports.estimateSwapFee = estimateSwapFee;
exports.estimateDepositFee = estimateDepositFee;
exports.estimateWithdrawalFee = estimateWithdrawalFee;
exports.calculateOperationCost = calculateOperationCost;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const big_js_1 = __importDefault(require("big.js"));
const errors_1 = require("../errors");
/**
 * Estimates Soroban operation fees
 *
 * Uses simulation to determine actual resource costs.
 * Adds safety multiplier for realistic estimates.
 */
async function estimateSorobanFee(transaction, options = {}) {
    const { rpcUrl = "https://soroban-testnet.stellar.org", includeResourceBreakdown = true, feeMultiplier = 1.5, // 50% buffer by default
     } = options;
    try {
        const server = new stellar_sdk_1.rpc.Server(rpcUrl, { allowHttp: true });
        // Simulate the transaction to get resource usage
        const simulation = await server.simulateTransaction(transaction);
        if ("error" in simulation) {
            throw new errors_1.ContractError(`Simulation failed during fee estimation: ${simulation.error}`, { rpcUrl, transactionType: "soroban" });
        }
        // Parse simulation response for fee data
        if (!("results" in simulation) ||
            !simulation.results ||
            !simulation.results[0]) {
            throw new errors_1.ContractError("Invalid simulation response: missing results", { simulation: JSON.stringify(simulation) });
        }
        const result = simulation.results[0];
        const simLatestLedger = simulation.latestLedger || 0;
        // Extract resource costs from simulation
        let cpuCost = "0";
        let memCost = "0";
        let bandwidthCost = "0";
        if ("resourceFee" in result) {
            // Parse resource fees if available
            const resourceFee = result.resourceFee || {};
            cpuCost = String(resourceFee.cpuInsn || 0);
            memCost = String(resourceFee.memBytes || 0);
            bandwidthCost = String(resourceFee.bandBytes || 0);
        }
        // Calculate fee components
        const baseFeeAmount = new big_js_1.default(stellar_sdk_1.BASE_FEE);
        const resourceFeeAmount = new big_js_1.default(cpuCost)
            .plus(memCost)
            .plus(bandwidthCost)
            .times(0.00001); // Convert to stroops
        // Apply safety multiplier for conservative estimate
        const totalFeeAmount = baseFeeAmount
            .plus(resourceFeeAmount)
            .times(feeMultiplier)
            .round(0, 3); // Round up
        return {
            baseFee: baseFeeAmount.toString(),
            networkFee: baseFeeAmount.toString(),
            simulationFee: resourceFeeAmount.toString(),
            totalFee: totalFeeAmount.toString(),
            resourceFees: {
                cpu: cpuCost,
                memory: memCost,
                bandwidth: bandwidthCost,
            },
        };
    }
    catch (error) {
        if (error instanceof errors_1.ContractError) {
            throw error;
        }
        throw new errors_1.NetworkError(`Failed to estimate gas fees: ${error instanceof Error ? error.message : String(error)}`, { rpcUrl }, "Check RPC URL and network connectivity", error instanceof Error ? error : undefined);
    }
}
/**
 * Estimates swap operation fee
 *
 * @param swapAmount The amount being swapped
 * @returns Estimated network fee in stroops
 *
 * Note: Slippage is handled separately from network fees.
 * Network fee is a fixed Soroban cost in stroops.
 * Slippage tolerance should be applied to expected output separately.
 */
function estimateSwapFee(swapAmount) {
    const amount = new big_js_1.default(swapAmount);
    // Typical swap costs on Soroban (in stroops)
    // Network fee is fixed Soroban operation cost
    const networkFee = new big_js_1.default(stellar_sdk_1.BASE_FEE).times(2.5); // ~2.5x base for swap
    // Slippage is a percentage of the TOKEN amount, not stroops
    // Example: 1% slippage on 1000 USDC = 10 USDC loss
    // This is separate from the network fee
    const protocolSlippage = amount.times(0.003); // 0.3% protocol fee
    return {
        baseFee: stellar_sdk_1.BASE_FEE.toString(),
        networkFee: networkFee.toString(),
        simulationFee: "0", // Simulation fee in stroops (actual value depends on pool state)
        totalFee: networkFee.toString(), // Network fee in stroops
        resourceFees: {
            cpu: "5000000", // Approximate CPU cost
            memory: "100000",
            bandwidth: "10000",
        },
    };
}
/**
 * Estimates LP deposit fee
 */
function estimateDepositFee(desiredAmountA, desiredAmountB) {
    const totalAmount = new big_js_1.default(desiredAmountA).plus(desiredAmountB);
    // LP operations typically cost more due to reserve checks
    const depositFee = totalAmount.times(0.0005); // 0.05% deposit fee
    const networkFee = new big_js_1.default(stellar_sdk_1.BASE_FEE).times(3); // Higher cost for LP
    const totalFee = depositFee.plus(networkFee);
    return {
        baseFee: stellar_sdk_1.BASE_FEE.toString(),
        networkFee: networkFee.toString(),
        simulationFee: depositFee.toString(),
        totalFee: totalFee.toString(),
        resourceFees: {
            cpu: "8000000",
            memory: "200000",
            bandwidth: "20000",
        },
    };
}
/**
 * Estimates LP withdrawal fee
 */
function estimateWithdrawalFee(shareAmount) {
    const amount = new big_js_1.default(shareAmount);
    const withdrawalFee = amount.times(0.0005); // 0.05% withdrawal fee
    const networkFee = new big_js_1.default(stellar_sdk_1.BASE_FEE).times(2.8); // ~2.8x for withdrawal
    const totalFee = withdrawalFee.plus(networkFee);
    return {
        baseFee: stellar_sdk_1.BASE_FEE.toString(),
        networkFee: networkFee.toString(),
        simulationFee: withdrawalFee.toString(),
        totalFee: totalFee.toString(),
        resourceFees: {
            cpu: "7000000",
            memory: "150000",
            bandwidth: "15000",
        },
    };
}
/**
 * Calculates effective slippage and total cost
 */
function calculateOperationCost(inputAmount, estimatedOutput, fee) {
    const input = new big_js_1.default(inputAmount);
    const estimated = new big_js_1.default(estimatedOutput);
    const totalFee = new big_js_1.default(fee.totalFee);
    const slippage = input.minus(estimated);
    const slippagePercent = slippage.div(input).times(100);
    return {
        inputAmount: input.toString(),
        outputAmount: estimated.toString(),
        feeAmount: totalFee.toString(),
        totalCost: input.plus(totalFee).toString(),
        slippagePercent: slippagePercent.toFixed(2),
    };
}
/**
 * Fee estimation cache for quick lookups
 */
class FeeEstimationCache {
    constructor() {
        this.cache = new Map();
        this.ttlMs = 5 * 60 * 1000; // 5 minute TTL
    }
    /**
     * Get cached estimate or compute new one
     */
    async getOrEstimate(key, estimator) {
        const cached = this.cache.get(key);
        const now = Date.now();
        if (cached && now - cached.timestamp < this.ttlMs) {
            return cached.estimate;
        }
        const estimate = await estimator();
        this.cache.set(key, { estimate, timestamp: now });
        return estimate;
    }
    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Clear old entries
     */
    prune() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.ttlMs) {
                this.cache.delete(key);
            }
        }
    }
}
exports.FeeEstimationCache = FeeEstimationCache;
exports.feeEstimationCache = new FeeEstimationCache();
