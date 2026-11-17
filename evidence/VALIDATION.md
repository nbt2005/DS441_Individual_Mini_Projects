# Validation results — November 17, 2026

| Component | Result |
|---|---|
| solc 0.8.24 compilation | PASS |
| In-process Ganache deployment | PASS; address in test-results.json |
| Contract tests | 16/16 PASS |
| Multiple accounts | Separate owner, resident, and verifier |
| Actual rejected transaction | Receipt status 0 and hash in JSON |
| Localhost Ganache RPC | Not verified; earlier connection attempts returned EACCES |
| Actual MetaMask extension | Not tested |
| English interface screenshots | PASS; all five desktop/mobile screenshots regenerated with Chrome |

Screenshots demonstrate submitting Paper quantity 12 without immediately awarding points, rejecting resident approval with Only verifier, successful owner approval, a resident balance of 12, and rejecting repeat approval with Already approved.

The interface uses real in-process Ganache through an injected EIP-1193 test-wallet bridge. These are not screenshots of signing with MetaMask. Videos and ZIP archives are excluded from Git; the script captures screenshots only.

Run `npm run demo:auto` to regenerate English interface evidence. No separate server or prior deployment is required. Microsoft Edge must be available at its standard Windows path, or set DEMO_BROWSER to a Chromium executable. The script writes screenshots and ui-results.json and labels the screenshots as an automated demonstration.

The English screenshots were regenerated on November 17, 2026, using Node 26.13.1 and Chrome after Edge failed to launch. Contract tests also passed with this Node version. Ganache used its JavaScript fallback because the native uWS binary did not match Node. Dependencies were initially copied from an existing local project with matching versions. Fresh registry installation has not been verified due to network restrictions. Source code does not depend on that project's paths.
