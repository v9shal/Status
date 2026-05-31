'use strict';

/**
 * Queue benchmark
 * ---------------
 * Measures throughput and latency of the Redis-backed Queue:
 *   - enqueue (Lua-script atomic insert with size cap)
 *   - claim   (atomic pop + move to processing set with visibility timeout)
 *   - end-to-end produce -> consume roundtrip
 *
 * Requires a running Redis (REDIS_URL or default redis://localhost:6379).
 *
 * Run:  npm run bench:queue
 */

const Redis = require('ioredis');
const { performance } = require('node:perf_hooks');
const { Queue } = require('../src/Queue/queue');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const N = parseInt(process.env.BENCH_N || '500000', 10);
const CONCURRENCY = parseInt(process.env.BENCH_CONCURRENCY || '50', 10);

function pct(sorted, p) {
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
}

function summarize(label, durationsMs) {
    durationsMs.sort((a, b) => a - b);
    const sum = durationsMs.reduce((a, b) => a + b, 0);
    return {
        label,
        n: durationsMs.length,
        mean: +(sum / durationsMs.length).toFixed(3),
        p50: +pct(durationsMs, 50).toFixed(3),
        p95: +pct(durationsMs, 95).toFixed(3),
        p99: +pct(durationsMs, 99).toFixed(3),
        max: +durationsMs[durationsMs.length - 1].toFixed(3),
    };
}

function printTable(rows) {
    const cols = ['label', 'n', 'mean', 'p50', 'p95', 'p99', 'max'];
    console.log(cols.map((c) => c.padStart(12)).join(' '));
    for (const r of rows) {
        console.log(cols.map((c) => String(r[c]).padStart(12)).join(' '));
    }
}

async function flushBenchKeys(redis) {
    // Only clean our prefix — never call FLUSHALL.
    const stream = redis.scanStream({ match: '{homebrewmq}*', count: 500 });
    const pipeline = redis.pipeline();
    let count = 0;
    for await (const keys of stream) {
        for (const k of keys) {
            pipeline.del(k);
            count++;
        }
    }
    // Also clear job:* hashes we created
    const jobStream = redis.scanStream({ match: 'job:*', count: 500 });
    for await (const keys of jobStream) {
        for (const k of keys) {
            pipeline.del(k);
            count++;
        }
    }
    if (count > 0) await pipeline.exec();
}

async function runEnqueue(queue) {
    const durations = new Array(N);
    let inflight = 0;
    let nextIdx = 0;
    const start = performance.now();

    await new Promise((resolve, reject) => {
        const launch = () => {
            while (inflight < CONCURRENCY && nextIdx < N) {
                const i = nextIdx++;
                inflight++;
                const t0 = performance.now();
                queue
                    .enqueue({ idx: i, ts: Date.now() })
                    .then(() => {
                        durations[i] = performance.now() - t0;
                        inflight--;
                        if (nextIdx >= N && inflight === 0) resolve();
                        else launch();
                    })
                    .catch(reject);
            }
        };
        launch();
    });

    const wallMs = performance.now() - start;
    return { durations, wallMs };
}

async function runClaim(queue, expected) {
    const durations = [];
    const start = performance.now();
    let claimed = 0;

    // Drain serially — Lua claim is single-shot and we want true latency per op.
    while (claimed < expected) {
        const t0 = performance.now();
        const job = await queue.claim();
        const dt = performance.now() - t0;
        if (!job) break;
        durations.push(dt);
        await queue.complete(job.id);
        claimed++;
    }

    const wallMs = performance.now() - start;
    return { durations, wallMs, claimed };
}

async function main() {
    const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
    redis.on('error', (e) => console.error('Redis error:', e.message));

    try {
        await redis.ping();
    } catch (e) {
        console.error(`Could not reach Redis at ${REDIS_URL}: ${e.message}`);
        process.exit(1);
    }

    console.log('Queue benchmark');
    console.log('---------------');
    console.log(`Redis:        ${REDIS_URL}`);
    console.log(`Jobs:         ${N}`);
    console.log(`Concurrency:  ${CONCURRENCY} (enqueue)\n`);

    await flushBenchKeys(redis);

    const queue = new Queue('bench', redis, { maxQueueSize: N * 2 });
    await queue.register();

    // --- Enqueue ---
    const enq = await runEnqueue(queue);
    const enqSummary = summarize('enqueue', enq.durations);
    const enqTput = Math.round((N / enq.wallMs) * 1000);

    // --- Claim + complete ---
    const cl = await runClaim(queue, N);
    const clSummary = summarize('claim+ack', cl.durations);
    const clTput = Math.round((cl.claimed / cl.wallMs) * 1000);

    console.log('Latency (ms):\n');
    printTable([enqSummary, clSummary]);

    console.log('\nThroughput:');
    console.log(`  enqueue:    ${enqTput.toLocaleString()} ops/sec  (${enq.wallMs.toFixed(0)} ms wall)`);
    console.log(`  claim+ack:  ${clTput.toLocaleString()} ops/sec  (${cl.wallMs.toFixed(0)} ms wall)`);

    // --- Invariants ---
    console.log('\nInvariants:');
    let failed = 0;
    const assert = (cond, msg) => {
        if (cond) console.log(`  PASS: ${msg}`);
        else {
            console.error(`  FAIL: ${msg}`);
            failed++;
        }
    };
    assert(cl.claimed === N, `claimed all ${N} enqueued jobs (got ${cl.claimed})`);
    assert(enqSummary.p99 < 50, `enqueue p99 < 50ms (got ${enqSummary.p99}ms)`);
    assert(clSummary.p99 < 50, `claim+ack p99 < 50ms (got ${clSummary.p99}ms)`);

    // Queue should be empty after drain
    const readyLen = await redis.zcard('{homebrewmq}:readyQueue');
    const procLen = await redis.zcard('{homebrewmq}:processingQueue');
    assert(readyLen === 0, `ready queue drained (size=${readyLen})`);
    assert(procLen === 0, `processing queue cleared after ack (size=${procLen})`);

    await flushBenchKeys(redis);
    await redis.quit();

    if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
