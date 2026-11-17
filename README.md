# Recycling Points Ledger - DS 441 A

Student: Nguyễn Bá Thiện — ID **29211164940**

Course: Blockchain: Theory & Practices

Residents submit a material and quantity. Authorized verifiers approve each entry once, awarding its quantity as non-transferable points. The interface displays each resident's balance.

Requirements source: the individual assignment `23_29211164940_Nguyen_Ba_Thien.pdf`. Deliverables include Solidity and interface source, deployment/test scripts, a README, and screenshots or a recording.

## Setup

Use Node.js 20, npm, and MetaMask for the manual wallet demonstration. Use Ganache test accounts and test Ether only.

```powershell
cd C:\Users\nguye\Downloads\DS441_Individual_Mini_Projects
npm install
npm run compile
npm run chain
```

Keep Ganache running. If Ganache Desktop already uses the same port, skip `npm run chain`. Open another terminal:

```powershell
npm run deploy
npm start
```

Open http://127.0.0.1:5173. Deployment uses unlocked RPC account 0 and writes the address and ABI to `frontend/deployment.json`. Redeploy after resetting Ganache. Set `RPC_URL` to override the deployment/test endpoint; automatic wallet network registration uses port 7545.

| Network setting | Value |
|---|---|
| RPC URL | http://127.0.0.1:7545 |
| Chain ID | 1337; check your Ganache configuration |
| Network ID | 5777 |
| Currency | Test ETH |

Import Ganache accounts 0 and 1 into MetaMask using the test keys shown by Ganache. Click **Connect MetaMask** and approve the connection. Account 0 is the owner and initial verifier; account 1 is the resident. Switching accounts reloads the interface; reconnect afterward. Deterministic Ganache keys are public test keys: never use them for real funds or commit private keys.

## Project structure

| Path | Purpose |
|---|---|
| `contracts/RecyclingPointsLedger.sol` | Permissions, entries, balances, and events |
| `frontend/` | Plain HTML/CSS/JavaScript, local ethers.js, wallet connection |
| `scripts/compile.js` | solc 0.8.24; optimizer: 200 runs; EVM: Shanghai |
| `scripts/deploy.js` | Deployment and interface configuration |
| `scripts/test.js` | Contract tests on Ganache |
| `scripts/demo.js` | Automated interface checks and screenshots |
| `evidence/` | Test results and screenshots |
| `docs/DEMO.md` | Multiple-account demonstration |
| `docs/REPORT.md` | Design, security, tests, and gas analysis |

`submitEntry` records `msg.sender` and emits `EntrySubmitted`. `approveEntry` checks verifier permission, entry ID, and the approval flag; it marks the entry approved, adds its quantity to the resident's balance, and emits `EntryApproved`. Only the owner can call `setVerifier`, which emits `VerifierUpdated`. The owner is immutable. There are no point-transfer or spending functions.

Quantities are **positive integers in standardized units**, not fractional kilograms: 12 units of Paper award 12 points. IDs start at 0. Materials must contain 1–64 bytes. The interface offers four materials; the contract accepts any valid string. The interface loads the latest 100 entries; older entries remain on chain. Solidity enforces permissions; hiding buttons only improves usability.

## Tests and screenshots

```powershell
npm test
npm run test:ganache
```

The first command starts an isolated in-process Ganache provider and shuts it down afterward. The second uses an already-running RPC node and deploys a separate test contract without changing the interface deployment. Reports are written to `evidence/test-results.json` and `evidence/ganache-test-results.json`, including hashes, blocks, and gas.

The 16 checks cover initialization, submission/events, permissions, granting/revoking roles, correct awards, duplicate approval, a mined reverted transaction, invalid quantities/materials/IDs/addresses, owner-only administration, balance accumulation/isolation, and the absence of transfer functions. Most rejection checks use `eth_call`; one unauthorized transaction is mined with receipt status 0.

Five screenshots are available in [evidence/screenshots](evidence/screenshots). They use an EIP-1193 test-wallet bridge to unlocked Ganache accounts, **not the MetaMask extension**. See [VALIDATION.md](evidence/VALIDATION.md) for verification limits.

Regenerate the English screenshots:

```powershell
npm run demo:auto
```

The script deploys its own isolated Ganache contract and captures screenshots only. It expects Microsoft Edge at its standard Windows path. Set `DEMO_BROWSER` to another Chromium executable if necessary. No separate web server or prior deployment is needed.

The English screenshots were regenerated successfully with Chrome. If Edge fails to launch, use:

```powershell
$env:DEMO_BROWSER = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run demo:auto
```

## Security and limitations

- Solidity enforces owner/verifier permissions. Residents cannot select another sender.
- The approval flag prevents awarding points twice for one ID. Solidity 0.8.24 checks overflow; a revert rolls back all changes.
- Business functions make no external contract calls. Reverted transactions still consume gas; fees also depend on gas price.
- Optimizations include an immutable owner, calldata input, and compiler optimization at 200 runs. No saving percentage is claimed without a baseline.
- Physical recycling verification happens off chain. Repeated descriptions are possible; verifiers must check the activity. Verifiers can approve their own entries because the assignment does not prohibit it.
- Blockchain data is public. Do not submit personal information as a material. The interface uses `textContent`.
- Dependencies, Ganache databases, generated deployment configuration, logs, videos, and ZIP archives are excluded from Git. Install dependencies and redeploy on another machine.
- RPC deployment and actual MetaMask signing have not been verified in the execution environment. In-process tests and the automated interface demonstration are separate checks.

## Sources and assistance

The individual assignment PDF defines the requirements. The instructor's Web3.py example illustrates RPC, ABI, and contract-address connections; this implementation uses ethers.js as permitted. OpenAI Codex assisted with code, scripts, and documentation. The student must be able to explain the workflow, permissions, reverts, and limitations.

[Solidity 0.8.24](https://docs.soliditylang.org/en/v0.8.24/) · [ethers v6](https://docs.ethers.org/v6/) · [Ganache](https://github.com/trufflesuite/ganache) · [MetaMask](https://docs.metamask.io/)
