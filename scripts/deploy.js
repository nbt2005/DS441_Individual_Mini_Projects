const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const { compile, root } = require('./compile');
async function main() {
  const artifact = compile();
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:7545');
  try {
  const signer = await provider.getSigner(0);
  const contract = await new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer).deploy();
  await contract.waitForDeployment();
  const receipt = await contract.deploymentTransaction().wait();
  const config = { address: await contract.getAddress(), chainId: Number((await provider.getNetwork()).chainId), owner: await signer.getAddress(), abi: artifact.abi, transactionHash: receipt.hash, blockNumber: receipt.blockNumber };
  fs.writeFileSync(path.join(root, 'frontend/deployment.json'), JSON.stringify(config, null, 2));
  console.log(JSON.stringify(config, (key, value) => key === 'abi' ? '[ABI saved]' : value, 2));
  } finally { provider.destroy(); }
}
main().catch(e => { console.error(e.shortMessage || e.message); process.exitCode = 1; });
