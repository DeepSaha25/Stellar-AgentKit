"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentClient = void 0;
const contract_1 = require("./lib/contract");
const bridge_1 = require("./tools/bridge");
class AgentClient {
    constructor(config) {
        /**
         * Liquidity Pool operations.
         */
        this.lp = {
            deposit: async (params) => {
                return await (0, contract_1.deposit)(this.publicKey, params.to, params.desiredA, params.minA, params.desiredB, params.minB);
            },
            withdraw: async (params) => {
                return await (0, contract_1.withdraw)(this.publicKey, params.to, params.shareAmount, params.minA, params.minB);
            },
            getReserves: async () => {
                return await (0, contract_1.getReserves)(this.publicKey);
            },
            getShareId: async () => {
                return await (0, contract_1.getShareId)(this.publicKey);
            },
        };
        // Mainnet safety check for general operations
        if (config.network === "mainnet" && !config.allowMainnet) {
            throw new Error("🚫 Mainnet execution blocked for safety.\n" +
                "Stellar AgentKit requires explicit opt-in for mainnet operations to prevent accidental use of real funds.\n" +
                "To enable mainnet, set allowMainnet: true in your config:\n" +
                "  new AgentClient({ network: 'mainnet', allowMainnet: true, ... })");
        }
        // Warning for mainnet usage (when opted in)
        if (config.network === "mainnet" && config.allowMainnet) {
            console.warn("\n⚠️  WARNING: STELLAR MAINNET ACTIVE ⚠️\n" +
                "You are executing transactions on Stellar mainnet.\n" +
                "Real funds will be used. Double-check all parameters before proceeding.\n");
        }
        this.network = config.network;
        this.publicKey = config.publicKey || process.env.STELLAR_PUBLIC_KEY || "";
        if (!this.publicKey && this.network === "testnet") {
            // In a real SDK, we might not throw here if only read-only methods are used,
            // but for this implementation, we'll assume it's needed for most actions.
        }
    }
    /**
     * Perform a swap on the Stellar network.
     * @param params Swap parameters
     */
    async swap(params) {
        return await (0, contract_1.swap)(this.publicKey, params.to, params.buyA, params.out, params.inMax);
    }
    /**
     * Bridge tokens from Stellar to EVM compatible chains.
     *
     * ⚠️ IMPORTANT: Mainnet bridging requires BOTH:
     * 1. AgentClient initialized with allowMainnet: true
     * 2. ALLOW_MAINNET_BRIDGE=true in your .env file
     *
     * This dual-safeguard approach prevents accidental mainnet bridging.
     *
     * @param params Bridge parameters
     * @returns Bridge transaction result with status, hash, and network
     */
    async bridge(params) {
        return await bridge_1.bridgeTokenTool.func({
            ...params,
            fromNetwork: this.network === "mainnet"
                ? "stellar-mainnet"
                : "stellar-testnet",
        });
    }
}
exports.AgentClient = AgentClient;
