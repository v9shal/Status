/**
 * Backoff benchmark
 * -----------------
 * Measures throughput of utils/backoff and validates statistical
 * properties of the exponential-backoff-with-jitter algorithm.
 *
 * Run:  npm run bench:backoff
 */

import { performance } from 'node:perf_hooks';
import { backoff } from '../src/utils/backoff';

const BASE_MS = 1000;
const CAP_MS = 30_000;
const JITTER_MAX = 1000;

interface DistRow {
    attempts: number;
    samples: number;
    min: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
    mean: number;
    expectedRange: [number, number];
}

function pct(sorted: number[], p: number): number {
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
}

function throughput(iterations: number): { elapsed: number; opsPerSec: number } {
    for (let i = 0; i < 100_000; i++) backoff(i % 6);

    const start = performance.now();
    let sink = 0;
    for (let i = 0; i < iterations; i++) sink ^= backoff(i % 6);
    const elapsed = performance.now() - start;

    if (sink === 0xdeadbeef) console.log('');

    const opsPerSec = (iterations / elapsed) * 1000;
    return { elapsed, opsPerSec };
}

function distribution(attempts: number, samples: number): DistRow {
    const values = new Array<number>(samples);
    for (let i = 0; i < samples; i++) values[i] = backoff(attempts);
    values.sort((a, b) => a - b);

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / samples;
    const expectedFloor = Math.min(CAP_MS, BASE_MS * 2 ** attempts);
    const expectedCeil = expectedFloor + JITTER_MAX;

    return {
        attempts,
        samples,
        min: values[0],
        p50: pct(values, 50),
        p95: pct(values, 95),
        p99: pct(values, 99),
        max: values[values.length - 1],
        mean: Math.round(mean),
        expectedRange: [expectedFloor, expectedCeil],
    };
}

function assert(cond: boolean, msg: string): void {
    if (!cond) {
        console.error(`  FAIL: ${msg}`);
        process.exitCode = 1;
        return;
    }
    console.log(`  PASS: ${msg}`);
}

function main(): void {
    console.log('Backoff benchmark');
    console.log('-----------------\n');

    const iterations = 5_000_000;
    const { elapsed, opsPerSec } = throughput(iterations);
    console.log(`Throughput: ${iterations.toLocaleString()} ops in ${elapsed.toFixed(1)} ms`);
    console.log(`            ${Math.round(opsPerSec).toLocaleString()} ops/sec`);
    console.log(`            ${((elapsed * 1e6) / iterations).toFixed(0)} ns/op\n`);

    console.log('Distribution (10,000 samples per attempt):\n');
    const header = ['attempts', 'min', 'p50', 'p95', 'p99', 'max', 'mean', 'expected'];
    console.log(header.map((h) => h.padStart(10)).join(' '));

    const rows: DistRow[] = [];
    for (let a = 0; a <= 6; a++) {
        const d = distribution(a, 10_000);
        rows.push(d);
        console.log(
            [
                d.attempts,
                d.min,
                d.p50,
                d.p95,
                d.p99,
                d.max,
                d.mean,
                `${d.expectedRange[0]}-${d.expectedRange[1]}`,
            ]
                .map((v) => String(v).padStart(10))
                .join(' ')
        );
    }

    console.log('\nInvariants:');
    assert(opsPerSec > 1_000_000, 'throughput > 1M ops/sec');

    for (const r of rows) {
        const [lo, hi] = r.expectedRange;
        assert(
            r.min >= lo && r.max <= hi,
            `attempt=${r.attempts}: all samples within [${lo}, ${hi}] (got [${r.min}, ${r.max}])`
        );
    }

    assert(
        rows[5].expectedRange[0] === CAP_MS && rows[6].expectedRange[0] === CAP_MS,
        `delay capped at ${CAP_MS}ms for high attempt counts`
    );

    for (const r of rows) {
        assert(
            r.p95 - r.p50 > 100,
            `attempt=${r.attempts}: jitter spread p95-p50 > 100ms (got ${r.p95 - r.p50}ms)`
        );
    }
}

main();
