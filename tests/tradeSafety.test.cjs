const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { buildSync } = require('esbuild');
const temp = mkdtempSync(join(tmpdir(), 'ttswap-trade-tests-'));
buildSync({ entryPoints: [resolve(__dirname, '../src/utils/tradeSafety.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: join(temp, 'safety.cjs'), logLevel: 'silent' });
const { buildSwapAmounts, validSlippage, matchesToken, tokenIdentity, confirmSwapTransaction, assertQuoteLiquidity, assertQuoteStep, MAX_UINT128 } = require(join(temp, 'safety.cjs'));
after(() => rmSync(temp, { recursive: true, force: true }));

test('18-decimal input retains every unit; preview matches packed output floor', () => {
  const q = buildSwapAmounts('1.000000000000000001', '2.000000000000000001', 18, 18, '0.5', true);
  assert.equal(q.amountIn, 1000000000000000001n);
  assert.equal(q.packed >> 128n, q.amountIn);
  assert.equal(q.packed & MAX_UINT128, q.minimum);
  assert.equal(q.minimum, 1990000000000000000n);
  assert.equal(q.minimumText, '1.99');
});
test('protection off is explicitly zero; tiny protected output and overflow rejected', () => {
  assert.equal(buildSwapAmounts('1', '2', 6, 6, '0.5', false).minimum, 0n);
  assert.throws(() => buildSwapAmounts('1', '0.000001', 6, 6, '0.5', true));
  assert.throws(() => buildSwapAmounts((MAX_UINT128 + 1n).toString(), '2', 0, 0, '0.5', true));
  assert.throws(() => buildSwapAmounts('1.0000001', '2', 6, 6, '0.5', true));
});
test('slippage rejects malformed, negative, excessive and ambiguous values', () => {
  for (const value of ['', 'NaN', '-1', '0', '100', '0.123', '1e1', '0.5%']) assert.equal(validSlippage(value), false, value);
  for (const value of ['0.1', '0.5', '3', '50']) assert.equal(validSlippage(value), true, value);
});
test('token search covers names/symbols/addresses, whitespace and no match; symbols are not identity', () => {
  const token = { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0xABCD', id: '1' };
  for (const query of [' wbtc ', 'BITCOIN', '0xab']) assert.equal(matchesToken(token, query), true);
  assert.equal(matchesToken(token, 'TWETH'), false);
  assert.notEqual(tokenIdentity(token), tokenIdentity({ ...token, address: '0xDCBA' }));
});
test('zero/missing/nonfinite liquidity and stalled/oversized loops cannot freeze quoting', () => {
  const pool = { fromQuan: '1000', toQuan: '2000', fromValue: '1000', toValue: '1000' };
  assert.doesNotThrow(() => assertQuoteLiquidity(pool));
  for (const value of [0, undefined, 'NaN', -1, Infinity]) assert.throws(() => assertQuoteLiquidity({ ...pool, toValue: value }));
  assert.throws(() => assertQuoteStep(0, 100, 1));
  assert.throws(() => assertQuoteStep(1, 100, 10001));
  assert.throws(() => assertQuoteStep(1, 1e30, 1));
});
test('broadcast remains pending until a successful receipt arrives', async () => {
  let resolveReceipt;
  const phases = [];
  const result = confirmSwapTransaction({ hash: '0x1', wait: () => new Promise(resolve => { resolveReceipt = resolve; }) }, value => phases.push(value.phase));
  assert.deepEqual(phases, ['pending']);
  resolveReceipt({ status: 1, hash: '0x1' });
  assert.equal(await result, true);
  assert.deepEqual(phases, ['pending', 'confirmed']);
});
test('revert is failed; unavailable confirmation does not imply failed execution', async () => {
  const phases = [];
  assert.equal(await confirmSwapTransaction({ hash: '0x1', wait: async () => ({ status: 0 }) }, value => phases.push(value.phase)), false);
  assert.deepEqual(phases, ['pending', 'failed']);
  const unknown = [];
  await assert.rejects(() => confirmSwapTransaction({ hash: '0x1', wait: async () => { throw new Error('RPC unavailable'); } }, value => unknown.push(value.phase)));
  assert.deepEqual(unknown, ['pending']);
});
test('repriced transaction tracks replacement; cancellation never claims swap success', async () => {
  for (const cancelled of [false, true]) {
    const phases = [];
    const result = await confirmSwapTransaction({ hash: '0x1', wait: async () => { throw { code: 'TRANSACTION_REPLACED', cancelled, receipt: { status: 1, hash: '0x2' } }; } }, value => phases.push(value));
    assert.equal(result, !cancelled);
    assert.deepEqual(phases.at(-1), { phase: cancelled ? 'failed' : 'confirmed', hash: '0x2' });
  }
});

test('GraphQL string decimals produce the same preview and submission units', () => {
  const q = buildSwapAmounts('10', '0.003341', '6', '18', '0.5', true);
  assert.equal(q.amountIn, 10000000n);
  assert.equal(q.minimumText, '0.003324295');
});
