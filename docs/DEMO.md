# Multiple-account demonstration

1. Start Ganache, deploy, and open the interface. Show network settings and account addresses without exposing private keys.
2. Select account 1 in MetaMask and connect. Its balance on a new contract is 0.
3. Submit Paper with quantity 12 and confirm. Show the hash, pending entry, and unchanged balance.
4. Switch to account 0 and reconnect. Click **Approve** and confirm. Show the approved entry and EntryApproved event.
5. Look up account 1: the balance is 12 points. Switch back to the resident account to confirm its displayed balance.
6. Run `npm run test:ganache`. Explain **Second approval rejected** and **Actual invalid transaction reverts on chain**. The JSON report records the unauthorized hash and receipt status 0. Hidden buttons do not replace contract checks.
7. Grant verifier permission to account 2. Submit another entry as the resident and approve as account 2. Revoke account 2's permission and explain why it cannot approve further entries.

Automated screenshots identify the EIP-1193 test wallet; they do not show MetaMask. Use the actual extension for a manual MetaMask demonstration. Screenshots satisfy the assignment's screenshots-or-recording requirement.

## Troubleshooting

| Problem | Action |
|---|---|
| RPC connection fails | Start Ganache and check host and port |
| No contract code at the address | Redeploy after resetting Ganache |
| Wrong network | Select the chain ID configured in Ganache |
| Insufficient test ETH | Import the correct funded Ganache test account |
| Stale nonce after resetting the chain | Clear the test account's activity in MetaMask and reconnect |
| Port already in use | Check the existing process; do not run two Ganache instances on the same port |
