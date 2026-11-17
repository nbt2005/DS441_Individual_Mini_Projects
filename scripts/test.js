const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ganache = require('ganache');
const { ethers } = require('ethers');
const { compile, root } = require('./compile');
async function main() {
  // Keep Ganache's temporary database inside the writable project workspace.
  const tempDir = path.join(root, 'artifacts', 'tmp');
  fs.mkdirSync(tempDir, { recursive: true });
  process.env.TEMP = tempDir; process.env.TMP = tempDir; process.env.TMPDIR = tempDir;
  const external = process.argv.includes('--ganache');
  const chain = external ? null : ganache.provider({ logging: { quiet: true }, wallet: { deterministic: true }, chain: { chainId: 1337 } });
  const provider = external ? new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:7545') : new ethers.BrowserProvider(chain);
  provider.pollingInterval = 50;
  try {
  const [owner, resident, verifier] = await Promise.all([0, 1, 2].map(i => provider.getSigner(i)));
  const artifact = compile();
  const contract = await new ethers.ContractFactory(artifact.abi, artifact.bytecode, owner).deploy();
  await contract.waitForDeployment();
  const results = [], transactions = [];
  async function test(name, action) { await action(); results.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
  async function tx(label, promise) { const receipt = await (await promise).wait(); transactions.push({ label, hash: receipt.hash, block: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() }); return receipt; }
  async function rejects(action, reason) { await assert.rejects(action, e => String(e.shortMessage || e.message).includes(reason) || JSON.stringify(e, (_,v)=>typeof v==='bigint'?v.toString():v).includes(reason)); }
    await test('Owner is initial verifier; resident has zero points', async () => { assert.equal(await contract.owner(), await owner.getAddress()); assert.equal(await contract.verifiers(await owner.getAddress()), true); assert.equal(await contract.balances(await resident.getAddress()), 0n); });
    await test('Resident submits Paper quantity 12; submission event emitted', async () => { const r = await tx('submitEntry', contract.connect(resident).submitEntry('Paper', 12)); const event = r.logs.map(l => contract.interface.parseLog(l)).find(e=>e.name==='EntrySubmitted'); assert.equal(event.args.resident, await resident.getAddress()); assert.equal(event.args.quantity, 12n); const entry = await contract.getEntry(0); assert.equal(entry.material, 'Paper'); assert.equal(entry.approved, false); assert.equal(await contract.balances(await resident.getAddress()), 0n); });
    await test('Unauthorized resident cannot approve', () => rejects(()=>contract.connect(resident).approveEntry.staticCall(0), 'Only verifier'));
    await test('Owner grants verifier role', async () => { await tx('setVerifier', contract.setVerifier(await verifier.getAddress(), true)); assert.equal(await contract.verifiers(await verifier.getAddress()), true); });
    await test('Verifier approves once and awards exactly 12 points', async () => { const r = await tx('approveEntry', contract.connect(verifier).approveEntry(0)); const event = r.logs.map(l => contract.interface.parseLog(l)).find(e=>e.name==='EntryApproved'); assert.equal(event.args.points, 12n); assert.equal(await contract.balances(await resident.getAddress()), 12n); assert.equal((await contract.getEntry(0)).approved, true); });
    await test('Second approval rejected without changing balance', async () => { await rejects(()=>contract.connect(verifier).approveEntry.staticCall(0), 'Already approved'); assert.equal(await contract.balances(await resident.getAddress()),12n); });
    await test('Actual invalid transaction reverts on chain', async () => { const t = await contract.connect(resident).approveEntry(0, { gasLimit: 150000 }); await assert.rejects(()=>t.wait()); const r = await provider.getTransactionReceipt(t.hash); assert.equal(r.status, 0); transactions.push({label:'unauthorized approval (reverted)',hash:r.hash,block:r.blockNumber,gasUsed:r.gasUsed.toString(),status:r.status}); });
    await test('Zero quantity rejected', () => rejects(()=>contract.submitEntry.staticCall('Paper', 0), 'Quantity must be positive'));
    await test('Empty material rejected', () => rejects(()=>contract.submitEntry.staticCall('', 1), 'Material length'));
    await test('Oversized material rejected', () => rejects(()=>contract.submitEntry.staticCall('a'.repeat(65), 1), 'Material length'));
    await test('Missing entry rejected', () => rejects(()=>contract.approveEntry.staticCall(999), 'Entry not found'));
    await test('Non-owner cannot grant verifier', async () => { const address = await resident.getAddress(); await rejects(()=>contract.connect(resident).setVerifier.staticCall(address, true), 'Only owner'); });
    await test('Zero verifier address rejected', () => rejects(()=>contract.setVerifier.staticCall(ethers.ZeroAddress, true), 'Zero address'));
    await test('Revoked verifier cannot approve new entry', async () => { await tx('submit second entry', contract.connect(resident).submitEntry('Plastic', 3)); await tx('revoke verifier', contract.setVerifier(await verifier.getAddress(), false)); await rejects(()=>contract.connect(verifier).approveEntry.staticCall(1), 'Only verifier'); });
    await test('Owner approves second entry; balances accumulate and remain isolated', async () => { await tx('approve second entry', contract.approveEntry(1)); assert.equal(await contract.balances(await resident.getAddress()), 15n); assert.equal(await contract.balances(await owner.getAddress()), 0n); assert.equal(await contract.entryCount(), 2n); });
    await test('ABI exposes no transfer or spending function', async () => { assert.equal(artifact.abi.some(x=>['transfer','transferFrom','approve'].includes(x.name)), false); });
    const report = { timestamp: new Date().toISOString(), network: external?'Ganache RPC':'Ganache in-process', chainId:Number((await provider.getNetwork()).chainId), contract:await contract.getAddress(), accounts:{owner:await owner.getAddress(),resident:await resident.getAddress(),verifier:await verifier.getAddress()}, results, transactions };
    fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
    fs.writeFileSync(path.join(root,'evidence',external?'ganache-test-results.json':'test-results.json'),JSON.stringify(report,null,2));
    console.log(`${results.length}/${results.length} passed`);
  } finally { provider.destroy(); if(chain) await chain.disconnect(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
