let provider, signer, ledger, config, account, busy = false;
const $ = id => document.getElementById(id);
const message = text => { $('status').textContent = text; };
function errorText(error) {
  const rpcError = error.info?.error;
  return error.reason || rpcError?.data?.reason || rpcError?.message || error.shortMessage || error.message || String(error);
}
async function loadConfig() {
  const response = await fetch('/deployment.json');
  if (!response.ok) throw new Error('Contract not deployed. Run npm run deploy.');
  config = await response.json();
  $('contract').textContent = config.address;
}
async function connect() {
  if (!window.ethereum) throw new Error('Install MetaMask to connect to Ganache.');
  await loadConfig();
  const chainId = ethers.toQuantity(config.chainId);
  try { await ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId}]}); }
  catch(e) {
    if(e.code !== 4902) throw e;
    await ethereum.request({method:'wallet_addEthereumChain',params:[{chainId,chainName:'Ganache Local',rpcUrls:['http://127.0.0.1:7545'],nativeCurrency:{name:'Test Ether',symbol:'ETH',decimals:18}}]});
    await ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId}]});
  }
  await ethereum.request({method:'eth_requestAccounts'});
  provider = new ethers.BrowserProvider(ethereum);
  signer = await provider.getSigner(); account = await signer.getAddress();
  if (await provider.getCode(config.address) === '0x') throw new Error('No contract at this address. Redeploy after resetting Ganache.');
  ledger = new ethers.Contract(config.address, config.abi, signer);
  await refresh(); message('Connected to Ganache.');
}
async function refresh() {
  if(!ledger) throw new Error('Connect MetaMask first.');
  const network = await provider.getNetwork();
  if(Number(network.chainId)!==config.chainId) throw new Error('Wrong Ganache network.');
  const [owner, verifier, balance, count] = await Promise.all([ledger.owner(),ledger.verifiers(account),ledger.balances(account),ledger.entryCount()]);
  $('account').textContent = account; $('network').textContent = `Ganache · Chain ID ${network.chainId}`;
  $('role').textContent = owner.toLowerCase()===account.toLowerCase()?'Contract owner'+(verifier?' / Verifier':''):verifier?'Verifier':'Resident';
  $('balance').textContent = balance.toString(); $('admin').hidden = owner.toLowerCase()!==account.toLowerCase();
  $('entries').replaceChildren();
  for(let i=Number(count)-1;i>=Math.max(0,Number(count)-100);i--) {
    const entry = await ledger.getEntry(i), row = document.createElement('tr');
    for(const value of [i,entry.resident,entry.material,entry.quantity.toString(),entry.approved?'Approved':'Pending verification']) {const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell);}
    const cell=document.createElement('td');
    if(verifier&&!entry.approved) {const button=document.createElement('button');button.textContent='Approve';button.onclick=()=>run(()=>transact(()=>ledger.approveEntry(i)));cell.appendChild(button);}
    else cell.textContent='—'; row.appendChild(cell); $('entries').appendChild(row);
  }
}
async function transact(send) {
  message('Waiting for confirmation in MetaMask...');
  const tx = await send(); message(`Submitted: ${tx.hash}\nWaiting for confirmation...`);
  const receipt = await tx.wait();
  const events=receipt.logs.map(log=>{try{return ledger.interface.parseLog(log);}catch{return null;}}).filter(Boolean);
  $('events').textContent=events.map(e=>`${e.name}: ${e.args.map(String).join(' | ')}`).join('\n')||'No events.';
  await refresh(); message(`Success\nTx: ${tx.hash}\nBlock: ${receipt.blockNumber}\nGas: ${receipt.gasUsed}`);
}
async function run(action) {
  if(busy)return; busy=true; document.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{await action();}catch(e){message('Error: '+errorText(e));}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
$('connect').onclick=()=>run(connect); $('refresh').onclick=()=>run(refresh);
$('submit-form').onsubmit=e=>{e.preventDefault();run(async()=>{if(!ledger)throw new Error('Connect your wallet first.');const q=$('quantity').value;if(!/^[1-9][0-9]*$/.test(q))throw new Error('Quantity must be a positive integer.');await transact(()=>ledger.submitEntry($('material').value,BigInt(q)));});};
$('lookup-form').onsubmit=e=>{e.preventDefault();run(async()=>{if(!ledger)throw new Error('Connect your wallet first.');const address=ethers.getAddress($('lookup-address').value.trim());$('lookup-result').textContent=`${address}: ${await ledger.balances(address)} points`;});};
$('verifier-form').onsubmit=e=>{e.preventDefault();run(async()=>{const address=ethers.getAddress($('verifier-address').value.trim());await transact(()=>ledger.setVerifier(address,$('verifier-enabled').value==='true'));});};
if(window.ethereum){ethereum.on('accountsChanged',()=>location.reload());ethereum.on('chainChanged',()=>location.reload());}
loadConfig().catch(e=>message(errorText(e)));
