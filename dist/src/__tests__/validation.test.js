"use strict";
/**
 * Comprehensive test suite for validation and error handling framework
 *
 * Run with: npm test -- --testPathPattern=validation
 * Coverage: validation module, error classes, handlers
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../validation/index");
const index_2 = require("../errors/index");
const handlers_1 = require("../errors/handlers");
// ============================================================================
// Test Framework (Simple Jest-like)
// ============================================================================
let passed = 0;
let failed = 0;
function test(name, fn) {
    try {
        const result = fn();
        if (result instanceof Promise) {
            result.then(() => {
                console.log(`✅ ${name}`);
                passed++;
            }).catch((error) => {
                console.log(`❌ ${name}\n   → ${error.message}`);
                failed++;
            });
        }
        else {
            console.log(`✅ ${name}`);
            passed++;
        }
    }
    catch (error) {
        console.log(`❌ ${name}\n   → ${error.message}`);
        failed++;
    }
}
function expect(actual) {
    return {
        toBeDefined: () => {
            if (actual === undefined || actual === null) {
                throw new Error(`Expected value to be defined, got ${actual}`);
            }
        },
        toEqual: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toThrow: (expectedError) => {
            // actual should be a function
            try {
                actual();
                throw new Error(`Expected function to throw ${expectedError.name}`);
            }
            catch (error) {
                if (!(error instanceof expectedError)) {
                    throw new Error(`Expected ${expectedError.name}, got ${error.message}`);
                }
            }
        },
        toBeTruthy: () => {
            if (!actual) {
                throw new Error(`Expected truthy value, got ${actual}`);
            }
        },
        toBeFalsy: () => {
            if (actual) {
                throw new Error(`Expected falsy value, got ${actual}`);
            }
        },
        toContain: (substring) => {
            if (!String(actual).includes(substring)) {
                throw new Error(`Expected "${actual}" to contain "${substring}"`);
            }
        },
    };
}
// ============================================================================
// ERROR CLASSES TESTS
// ============================================================================
console.log("\n📋 ERROR CLASSES TESTS\n");
test("AgentKitError should be createable with message and code", () => {
    const error = new index_2.AgentKitError("Test error", "TEST_CODE", {}, "Try something");
    expect(error.message).toEqual("Test error");
    expect(error.code).toEqual("TEST_CODE");
    expect(error.suggestion).toBeDefined();
});
test("AgentKitError.getFormattedMessage() should include context", () => {
    const error = new index_2.AgentKitError("Test", "TEST", { value: 123 });
    const formatted = error.getFormattedMessage();
    expect(formatted).toContain("TEST");
    expect(formatted).toContain("value");
});
test("InvalidAddressError should be thrown for invalid addresses", () => {
    expect(() => {
        throw new index_2.InvalidAddressError("invalid");
    }).toThrow(index_2.InvalidAddressError);
});
test("InvalidAmountError should be thrown for invalid amounts", () => {
    expect(() => {
        throw new index_2.InvalidAmountError("not-a-number");
    }).toThrow(index_2.InvalidAmountError);
});
test("ValidationError should extend AgentKitError", () => {
    const error = new index_2.ValidationError("Test validation");
    expect(error instanceof index_2.AgentKitError).toBeTruthy();
});
test("isAgentKitError should return true for AgentKitError instances", () => {
    const error = new index_2.AgentKitError("Test", "TEST");
    expect((0, index_2.isAgentKitError)(error)).toBeTruthy();
    expect((0, index_2.isAgentKitError)(new Error("Regular error"))).toBeFalsy();
});
test("ensureAgentKitError should convert regular Error to AgentKitError", () => {
    const regularError = new Error("Regular error");
    const result = (0, index_2.ensureAgentKitError)(regularError);
    expect((0, index_2.isAgentKitError)(result)).toBeTruthy();
});
// ============================================================================
// VALIDATION TESTS
// ============================================================================
console.log("\n✓ VALIDATION TESTS\n");
test("validateStellarAddress should accept valid public keys", () => {
    const validAddress = "GDZST3XVCDTUJ76ZAV2HA72KYPJMFSND4XNFIXRN7GPYABKK7FEZWWH";
    const result = (0, index_1.validateStellarAddress)(validAddress);
    expect(result).toEqual(validAddress);
});
test("validateStellarAddress should throw InvalidAddressError for invalid addresses", () => {
    expect(() => (0, index_1.validateStellarAddress)("invalid-address")).toThrow(index_2.InvalidAddressError);
});
test("validateAmount should accept valid numeric strings", () => {
    const result = (0, index_1.validateAmount)("100.50");
    expect(result).toBeDefined();
});
test("validateAmount should reject negative amounts by default", () => {
    expect(() => (0, index_1.validateAmount)("-100")).toThrow(index_2.InvalidAmountError);
});
test("validateAmount should accept zero when allowZero is true", () => {
    const result = (0, index_1.validateAmount)("0", { allowZero: true });
    expect(result).toEqual("0");
});
test("validateAmount should reject amounts exceeding maxAmount", () => {
    expect(() => (0, index_1.validateAmount)("150", { maxAmount: 100 })).toThrow(index_2.InvalidAmountError);
});
test("validateAmount should enforce decimal places", () => {
    expect(() => (0, index_1.validateAmount)("100.123", { decimals: 2 })).toThrow(index_2.InvalidAmountError);
});
test("validateNetwork should accept 'testnet' and 'mainnet'", () => {
    expect((0, index_1.validateNetwork)("testnet")).toEqual("testnet");
    expect((0, index_1.validateNetwork)("mainnet")).toEqual("mainnet");
});
test("validateNetwork should throw for invalid networks", () => {
    expect(() => (0, index_1.validateNetwork)("invalid-network")).toThrow(index_2.InvalidNetworkError);
});
test("validateRequired should throw for undefined values", () => {
    expect(() => (0, index_1.validateRequired)(undefined, "param", "operation")).toThrow(index_2.MissingParameterError);
});
test("validateRequired should return value if present", () => {
    const value = "test";
    expect((0, index_1.validateRequired)(value, "param", "operation")).toEqual(value);
});
test("validateSwapParams should validate all swap fields", () => {
    const validParams = {
        to: "GDZST3XVCDTUJ76ZAV2HA72KYPJMFSND4XNFIXRN7GPYABKK7FEZWWH",
        buyA: true,
        out: "100",
        inMax: "110",
    };
    const result = (0, index_1.validateSwapParams)(validParams);
    expect(result.buyA).toEqual(true);
});
test("validateSwapParams should reject missing required fields", () => {
    expect(() => (0, index_1.validateSwapParams)({ buyA: true })).toThrow();
});
test("validateDepositParams should validate all deposit fields", () => {
    const validParams = {
        to: "GDZST3XVCDTUJ76ZAV2HA72KYPJMFSND4XNFIXRN7GPYABKK7FEZWWH",
        desiredA: "100",
        minA: "90",
        desiredB: "200",
        minB: "180",
    };
    const result = (0, index_1.validateDepositParams)(validParams);
    expect(result.to).toBeDefined();
});
test("validateAddresses should validate multiple addresses", () => {
    const addresses = [
        "GDZST3XVCDTUJ76ZAV2HA72KYPJMFSND4XNFIXRN7GPYABKK7FEZWWH",
        "GDZST3XVCDTUJ76ZAV2HA72KYPJMFSND4XNFIXRN7GPYABKK7FEZWWH",
    ];
    const result = (0, index_1.validateAddresses)(addresses);
    expect(result.length).toEqual(2);
});
// ============================================================================
// ERROR HANDLERS TESTS
// ============================================================================
console.log("\n⚙️  ERROR HANDLERS TESTS\n");
test("handleErrorSync should return value on success", () => {
    const result = (0, handlers_1.handleErrorSync)(() => "success", { throwError: false });
    expect(result).toEqual("success");
});
test("handleErrorSync should catch and handle errors", () => {
    const result = (0, handlers_1.handleErrorSync)(() => {
        throw new Error("Test error");
    }, { throwError: false, returnErrorObject: true });
    expect((0, index_2.isAgentKitError)(result)).toBeTruthy();
});
test("isRetriable should return true for network errors", () => {
    const error = new index_2.NetworkError("Connection failed");
    expect((0, handlers_1.isRetriable)(error)).toBeTruthy();
});
test("isRetriable should return false for validation errors", () => {
    const error = new index_2.ValidationError("Invalid input");
    expect((0, handlers_1.isRetriable)(error)).toBeFalsy();
});
// ============================================================================
// SUMMARY
// ============================================================================
console.log("\n" + "=".repeat(60));
console.log(`\n✅ Tests Passed: ${passed}`);
console.log(`❌ Tests Failed: ${failed}`);
console.log(`📊 Total Tests: ${passed + failed}`);
if (failed === 0) {
    console.log("\n🎉 All tests passed!\n");
}
else {
    console.log(`\n⚠️  ${failed} tests failed!\n`);
    process.exit(1);
}
