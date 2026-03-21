"use strict";
/**
 * Tests for TypeScript Type Safety System
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = require("../types/strict");
describe('TypeScript Type Safety', () => {
    describe('createPublicKey', () => {
        it('should create valid public key', () => {
            const key = (0, strict_1.createPublicKey)('GBBD47UZQ5DSFEO76KZVVYKRRWHQ3NXPML3GKHCFHZMPVQ6T4KV44CD3');
            expect(key).toBeDefined();
        });
        it('should reject invalid format', () => {
            expect(() => {
                (0, strict_1.createPublicKey)('invalid-key');
            }).toThrow();
        });
        it('should reject wrong prefix', () => {
            expect(() => {
                (0, strict_1.createPublicKey)('CBBD47UZQ5DSFEO76KZVVYKRRWHQ3NXPML3GKHCFHZMPVQ6T4KV44CD3');
            }).toThrow();
        });
    });
    describe('createContractAddress', () => {
        it('should create valid contract address', () => {
            const addr = (0, strict_1.createContractAddress)('CBBD47UZQ5DSFEO76KZVVYKRRWHQ3NXPML3GKHCFHZMPVQ6T4KV44CD3');
            expect(addr).toBeDefined();
        });
        it('should reject wrong prefix', () => {
            expect(() => {
                (0, strict_1.createContractAddress)('GBBD47UZQ5DSFEO76KZVVYKRRWHQ3NXPML3GKHCFHZMPVQ6T4KV44CD3');
            }).toThrow();
        });
    });
    describe('createAmount', () => {
        it('should create valid amount from string', () => {
            const amount = (0, strict_1.createAmount)('1000.50');
            expect(amount).toBeDefined();
        });
        it('should create valid amount from number', () => {
            const amount = (0, strict_1.createAmount)(1000);
            expect(amount).toBeDefined();
        });
        it('should reject negative amounts', () => {
            expect(() => {
                (0, strict_1.createAmount)('-100');
            }).toThrow();
        });
        it('should reject scientific notation', () => {
            expect(() => {
                (0, strict_1.createAmount)('1e10');
            }).toThrow();
        });
        it('should validate decimal format', () => {
            expect(() => {
                (0, strict_1.createAmount)('100.50.25');
            }).toThrow();
        });
        it('should handle many decimal places', () => {
            const amount = (0, strict_1.createAmount)('1.000000000000000001');
            expect(amount).toBeDefined();
        });
    });
    describe('createAssetSymbol', () => {
        it('should create valid asset symbol', () => {
            const symbol = (0, strict_1.createAssetSymbol)('USDC');
            expect(symbol).toBe('USDC');
        });
        it('should uppercase symbol', () => {
            const symbol = (0, strict_1.createAssetSymbol)('usdc');
            expect(symbol).toBe('USDC');
        });
        it('should reject invalid characters', () => {
            expect(() => {
                (0, strict_1.createAssetSymbol)('USD-C');
            }).toThrow();
        });
        it('should reject empty symbol', () => {
            expect(() => {
                (0, strict_1.createAssetSymbol)('');
            }).toThrow();
        });
    });
    describe('createPercentage', () => {
        it('should create valid percentage', () => {
            const pct = (0, strict_1.createPercentage)(50);
            expect(pct).toBe(50);
        });
        it('should reject < 0', () => {
            expect(() => {
                (0, strict_1.createPercentage)(-1);
            }).toThrow();
        });
        it('should reject > 100', () => {
            expect(() => {
                (0, strict_1.createPercentage)(101);
            }).toThrow();
        });
        it('should allow boundary values', () => {
            expect((0, strict_1.createPercentage)(0)).toBe(0);
            expect((0, strict_1.createPercentage)(100)).toBe(100);
        });
    });
    describe('createFee', () => {
        it('should create fee from string', () => {
            const fee = (0, strict_1.createFee)('1000');
            expect(fee).toBeDefined();
        });
        it('should create fee from number', () => {
            const fee = (0, strict_1.createFee)(1000);
            expect(fee).toBeDefined();
        });
        it('should reject negative fees', () => {
            expect(() => {
                (0, strict_1.createFee)('-100');
            }).toThrow();
        });
    });
    describe('createLedgerSequence', () => {
        it('should create valid ledger sequence', () => {
            const seq = (0, strict_1.createLedgerSequence)(12345);
            expect(seq).toBe(12345);
        });
        it('should reject negative numbers', () => {
            expect(() => {
                (0, strict_1.createLedgerSequence)(-1);
            }).toThrow();
        });
        it('should reject floating point', () => {
            expect(() => {
                (0, strict_1.createLedgerSequence)(123.45);
            }).toThrow();
        });
    });
    describe('createTransactionHash', () => {
        it('should create valid transaction hash', () => {
            const hash = (0, strict_1.createTransactionHash)('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6');
            expect(hash).toBeDefined();
        });
        it('should normalize to lowercase', () => {
            const hash = (0, strict_1.createTransactionHash)('A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6');
            expect(hash).toContain('a1b2');
        });
        it('should reject wrong length', () => {
            expect(() => {
                (0, strict_1.createTransactionHash)('abc');
            }).toThrow();
        });
        it('should reject invalid hex', () => {
            expect(() => {
                (0, strict_1.createTransactionHash)('z1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6');
            }).toThrow();
        });
    });
    describe('multiplyAmount', () => {
        it('should multiply amounts', () => {
            const amount = (0, strict_1.createAmount)('100');
            const result = (0, strict_1.multiplyAmount)(amount, 2);
            expect(result).toBeDefined();
        });
    });
    describe('divideAmount', () => {
        it('should divide amounts', () => {
            const amount = (0, strict_1.createAmount)('100');
            const result = (0, strict_1.divideAmount)(amount, 2);
            expect(result).toBeDefined();
        });
    });
    describe('createStrictConfig', () => {
        it('should create valid config', () => {
            const config = (0, strict_1.createStrictConfig)({
                network: 'testnet',
                publicKey: 'GBBD47UZQ5DSFEO76KZVVYKRRWHQ3NXPML3GKHCFHZMPVQ6T4KV44CD3',
                defaultSlippage: 0.5,
                defaultTimeout: 60,
            });
            expect(config.network).toBe('testnet');
            expect(config.defaultSlippage).toBe(0.5);
        });
        it('should validate public key in config', () => {
            expect(() => {
                (0, strict_1.createStrictConfig)({
                    network: 'testnet',
                    publicKey: 'invalid',
                    defaultSlippage: 0.5,
                });
            }).toThrow();
        });
        it('should set defaults', () => {
            const config = (0, strict_1.createStrictConfig)({
                network: 'testnet',
                publicKey: 'GBBD47UZQ5DSFEO76KZVVYKRRWHQ3NXPML3GKHCFHZMPVQ6T4KV44CD3',
            });
            expect(config.defaultSlippage).toBe(1);
            expect(config.defaultTimeout).toBe(300);
            expect(config.maxFee).toBeDefined();
        });
    });
});
