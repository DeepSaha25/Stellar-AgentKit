"use strict";
/**
 * Tests for Event Monitoring System
 */
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("../monitoring/events");
describe('Event Monitoring System', () => {
    let monitor;
    beforeEach(() => {
        monitor = new events_1.EventMonitor(1000);
    });
    describe('recordEvent', () => {
        it('should record event with unique ID', () => {
            const eventId = monitor.recordEvent(events_1.OperationType.SWAP, { amount: '100' }, 'testnet');
            expect(eventId).toBeDefined();
            expect(eventId).toMatch(/^evt_\d+_\d+$/);
        });
        it('should store event with correct details', () => {
            const details = { from: 'G...', amount: '100' };
            const eventId = monitor.recordEvent(events_1.OperationType.SWAP, details, 'testnet');
            const event = monitor.getEvent(eventId);
            expect(event).toBeDefined();
            expect(event.operationType).toBe(events_1.OperationType.SWAP);
            expect(event.details).toEqual(details);
            expect(event.network).toBe('testnet');
        });
    });
    describe('updateStatus', () => {
        it('should update event status', () => {
            const eventId = monitor.recordEvent(events_1.OperationType.SWAP, { amount: '100' }, 'testnet');
            monitor.updateStatus(eventId, events_1.EventStatus.VALIDATING);
            const event = monitor.getEvent(eventId);
            expect(event.status).toBe(events_1.EventStatus.VALIDATING);
        });
        it('should set error when status is FAILED', () => {
            const eventId = monitor.recordEvent(events_1.OperationType.SWAP, { amount: '100' }, 'testnet');
            monitor.updateStatus(eventId, events_1.EventStatus.FAILED, {
                code: 'INSUFFICIENT_FUNDS',
                message: 'Not enough balance',
            });
            const event = monitor.getEvent(eventId);
            expect(event.error).toBeDefined();
            expect(event.error.code).toBe('INSUFFICIENT_FUNDS');
        });
        it('should calculate duration when event completes', () => {
            const eventId = monitor.recordEvent(events_1.OperationType.SWAP, { amount: '100' }, 'testnet');
            // Small delay to have non-zero duration
            setTimeout(() => {
                monitor.updateStatus(eventId, events_1.EventStatus.CONFIRMED);
                const event = monitor.getEvent(eventId);
                expect(event.endTime).toBeDefined();
                expect(event.duration).toBeGreaterThanOrEqual(0);
            }, 10);
        });
    });
    describe('queryHistory', () => {
        beforeEach(() => {
            // Create various events
            monitor.recordEvent(events_1.OperationType.SWAP, { amount: '100' }, 'testnet');
            monitor.recordEvent(events_1.OperationType.DEPOSIT, { amount: '50' }, 'testnet');
            monitor.recordEvent(events_1.OperationType.SWAP, { amount: '200' }, 'mainnet');
            monitor.recordEvent(events_1.OperationType.WITHDRAW, { amount: '30' }, 'testnet');
        });
        it('should filter by operation type', () => {
            const swaps = monitor.queryHistory({ operationType: events_1.OperationType.SWAP });
            expect(swaps.length).toBe(2);
            expect(swaps.every(e => e.operationType === events_1.OperationType.SWAP)).toBe(true);
        });
        it('should filter by network', () => {
            const mainnet = monitor.queryHistory({ network: 'mainnet' });
            expect(mainnet.length).toBe(1);
            expect(mainnet[0].network).toBe('mainnet');
        });
        it('should filter by multiple operation types', () => {
            const result = monitor.queryHistory({
                operationType: [events_1.OperationType.SWAP, events_1.OperationType.DEPOSIT],
            });
            expect(result.length).toBe(3);
        });
        it('should respect limit and offset', () => {
            const first = monitor.queryHistory({ limit: 2 });
            expect(first.length).toBe(2);
            const next = monitor.queryHistory({ limit: 2, offset: 2 });
            expect(next.length).toBe(2);
            // Verify no overlap
            const ids1 = new Set(first.map(e => e.id));
            expect(next.some(e => ids1.has(e.id))).toBe(false);
        });
    });
    describe('getStats', () => {
        beforeEach(() => {
            for (let i = 0; i < 3; i++) {
                const id = monitor.recordEvent(events_1.OperationType.SWAP, {}, 'testnet');
                monitor.updateStatus(id, events_1.EventStatus.CONFIRMED);
            }
            for (let i = 0; i < 2; i++) {
                const id = monitor.recordEvent(events_1.OperationType.DEPOSIT, {}, 'testnet');
                monitor.updateStatus(id, events_1.EventStatus.FAILED, {
                    code: 'ERROR',
                    message: 'Test error',
                });
            }
        });
        it('should calculate correct statistics', () => {
            const stats = monitor.getStats();
            expect(stats.total).toBe(5);
            expect(stats.byType[events_1.OperationType.SWAP]).toBe(3);
            expect(stats.byType[events_1.OperationType.DEPOSIT]).toBe(2);
            expect(stats.byStatus[events_1.EventStatus.CONFIRMED]).toBe(3);
            expect(stats.byStatus[events_1.EventStatus.FAILED]).toBe(2);
            expect(stats.successRate).toBe(0.6); // 3 success / 5 total
        });
    });
    describe('clearOlderThan', () => {
        it('should remove events older than timestamp', () => {
            const now = Date.now();
            const oldTime = now - 10000; // 10 seconds ago
            // Record event and manually set old timestamp
            const id = monitor.recordEvent(events_1.OperationType.SWAP, {}, 'testnet');
            const event = monitor.getEvent(id);
            event.timestamp = oldTime;
            const removed = monitor.clearOlderThan(now - 5000);
            expect(removed).toBe(1);
            expect(monitor.getEvent(id)).toBeUndefined();
        });
    });
    describe('event listeners', () => {
        it('should emit events correctly', (done) => {
            let emitted = false;
            monitor.on(events_1.OperationType.SWAP, (event) => {
                expect(event.operationType).toBe(events_1.OperationType.SWAP);
                emitted = true;
            });
            monitor.recordEvent(events_1.OperationType.SWAP, { amount: '100' }, 'testnet');
            setTimeout(() => {
                expect(emitted).toBe(true);
                done();
            }, 10);
        });
    });
});
