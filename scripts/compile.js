const fs = require('fs');
const path = require('path');
const solc = require('solc');
const root = path.resolve(__dirname, '..');
function compile() {
  const input = { language: 'Solidity', sources: { 'RecyclingPointsLedger.sol': { content: fs.readFileSync(path.join(root, 'contracts/RecyclingPointsLedger.sol'), 'utf8') } }, settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'shanghai', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  for (const error of output.errors || []) { if (error.severity === 'error') throw new Error(error.formattedMessage); }
  const c = output.contracts['RecyclingPointsLedger.sol'].RecyclingPointsLedger;
  const artifact = { abi: c.abi, bytecode: '0x' + c.evm.bytecode.object, compiler: solc.version() };
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/RecyclingPointsLedger.json'), JSON.stringify(artifact, null, 2));
  return artifact;
}
module.exports = { compile, root };
if (require.main === module) { compile(); console.log('Compiled Solidity 0.8.24 (optimizer 200, Shanghai)'); }
