// Automated demo wallet: unlocked Ganache accounts through EIP-1193, NOT MetaMask.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const { root, compile } = require('./compile');
const ganache = require('ganache');
async function main() {
  const temp=path.join(root,'artifacts/tmp');fs.mkdirSync(temp,{recursive:true});process.env.TEMP=temp;process.env.TMP=temp;
  const chain=ganache.provider({logging:{quiet:true},wallet:{deterministic:true},chain:{chainId:1337}});
  const rpc = new ethers.BrowserProvider(chain);
  rpc.pollingInterval=50;
  const artifact=compile(), owner=await rpc.getSigner(0);
  const deployed=await new ethers.ContractFactory(artifact.abi,artifact.bytecode,owner).deploy();await deployed.waitForDeployment();
  const config={address:await deployed.getAddress(),chainId:1337,abi:artifact.abi};
  const accounts = await rpc.send('eth_accounts', []);
  let browser;
  try { browser = await chromium.launch({executablePath:process.env.DEMO_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}); }
  catch(e) {rpc.destroy();await chain.disconnect();throw e;}
  const context = await browser.newContext({viewport:{width:1200,height:1000}});
  const page = await context.newPage();
  const pause = () => page.waitForTimeout(2500);
  const screenshots = path.join(root,'evidence/screenshots'); fs.mkdirSync(screenshots,{recursive:true});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  try {
    await page.exposeFunction('ganacheRequest',async({method,params})=> {
      if(method==='eth_requestAccounts'||method==='eth_accounts') return {result:[accounts[1]]};
      if(method==='wallet_switchEthereumChain')return {result:null};
      try {return {result:await chain.request({method,params:params||[]})};}
      catch(e){return {error:{message:e.message,code:e.code,data:e.data}};}
    });
    await page.addInitScript(()=>{window.ethereum={request:async args=>{const reply=await window.ganacheRequest(args);if(reply.error)throw Object.assign(new Error(reply.error.message),reply.error);return reply.result;},on:()=>{}};});
    await page.route('http://demo.local/**',async route=>{
      const pathname=new URL(route.request().url()).pathname;
      if(pathname==='/deployment.json')return route.fulfill({json:config});
      const file=pathname==='/'?'frontend/index.html':pathname==='/ethers.js'?'node_modules/ethers/dist/ethers.umd.min.js':'frontend'+pathname;
      await route.fulfill({path:path.join(root,file)});
    });
    await page.goto('http://demo.local/');
    await page.evaluate(()=>{const note=document.createElement('p');note.textContent='AUTOMATED DEMO | EIP-1193 test wallet / Ganache | Not the MetaMask extension';note.style.fontWeight='bold';document.querySelector('header').prepend(note);});
    await page.getByRole('button',{name:'Connect MetaMask'}).click();
    await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Connected'));
    await pause();
    const ledger=new ethers.Contract(config.address,config.abi,rpc);
    const before=await ledger.balances(accounts[1]); const id=await ledger.entryCount();
    await page.getByRole('button',{name:'Submit entry',exact:true}).click();
    await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Success'));
    assert.equal(await ledger.balances(accounts[1]),before);
    await page.screenshot({path:path.join(screenshots,'01-resident-submitted.png'),fullPage:true});
    await page.locator('#status').scrollIntoViewIfNeeded(); await pause();
    await page.evaluate(async id=>{await run(()=>transact(()=>ledger.approveEntry(id)));},Number(id));
    await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Error:'));
    assert.match(await page.locator('#status').textContent(), /Only verifier/);
    await page.screenshot({path:path.join(screenshots,'02-unauthorized-rejected.png'),fullPage:true}); await pause();
    // Switch the injected wallet's selected account, matching an account-change reload.
    await page.evaluate(address=>{const previous=window.ethereum.request;window.ethereum.request=args=>['eth_accounts','eth_requestAccounts'].includes(args.method)?Promise.resolve([address]):previous(args);},accounts[0]);
    await page.getByRole('button',{name:'Connect MetaMask'}).click();
    await page.waitForFunction(()=>document.getElementById('role').textContent.includes('Contract owner'));
    await pause();
    const row=page.locator('tbody tr').filter({has:page.locator('td:first-child',{hasText:new RegExp('^'+id+'$')})});
    await row.getByRole('button',{name:'Approve',exact:true}).click();
    await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Success'));
    await page.locator('#lookup-address').fill(accounts[1]);
    await page.getByRole('button',{name:'Look up',exact:true}).click();
    await page.waitForFunction(()=>document.getElementById('lookup-result').textContent.includes('points'));
    assert.equal(await ledger.balances(accounts[1]),before+12n);
    await page.screenshot({path:path.join(screenshots,'02-verifier-approved.png'),fullPage:true});
    await page.locator('#lookup-result').scrollIntoViewIfNeeded(); await pause();
    await page.evaluate(async id=>{await run(()=>transact(()=>ledger.approveEntry(id)));},Number(id));
    await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Error:'));
    assert.match(await page.locator('#status').textContent(), /Already approved/);
    await page.locator('#status').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(screenshots,'04-duplicate-rejected.png'),fullPage:true}); await pause();
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(screenshots,'03-mobile.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(root,'evidence/ui-results.json'),JSON.stringify({timestamp:new Date().toISOString(),wallet:'Injected EIP-1193 test bridge, not MetaMask extension',entryId:id.toString(),resident:accounts[1],balanceBefore:before.toString(),balanceAfter:(before+12n).toString(),checks:['Resident submission succeeds','Pending submission does not award points','Verifier approval succeeds','Balance increases by 12','Lookup displays balance','Desktop and mobile screenshots','No browser page errors'],status:'PASS'},null,2));
    console.log('PASS automated web demo; screenshots saved');
  } finally {
    await context.close();
    await browser.close();rpc.destroy();await chain.disconnect();
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
