# 🚨 Siren - Real-Time Civic Signals on Movement

Crowd-validated civic intelligence powered by Movement blockchain.

**Deployed Module:** [`0x8929dbe48bae9c96036e7cb03c80d7686aa79d525571f93e98b48ef41e26389c`](https://explorer.movementnetwork.xyz/account/0x8929dbe48bae9c96036e7cb03c80d7686aa79d525571f93e98b48ef41e26389c?network=testnet)  


### Signal Types
- 🚔 **Checkpoint** - Traffic enforcement
- 🔊 **Noise** - Noise complaints
- ⚠️ **Hazard** - Road hazards
- 🚗 **Traffic** - Heavy traffic


## Tech Stack

- **Blockchain:** Movement (Aptos Move)
- **Backend:** Next.js App Router + tRPC
- **Database:** PostgreSQL (local Docker) / Neon (production)
- **ORM:** Drizzle
- **Frontend:** NextJS + Tailwind CSS
- **Auth:** Privy.io
- **AI:** Google Gemini 2.5 Flash (image & noise analysis)


## 🏆 Movement Advantages

- **1-3s finality** - Fast transaction confirmation (targeting sub-second)
- **Low-cost transactions** - Typically ~$0.001 per TX, suitable for daily use
- **High TPS** - Scales to thousands of users
- **Aptos Move** - Secure resource model with parallel execution


## Track Fulfillment

| Track Requirement                            | Implementation                                    | Code Reference                                                                                            |
| -------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Best App on Movement Using Privy Wallets** |
| Privy embedded wallet creation               | Auto-creates Aptos wallet on login                | ```19:70:mobile/app/page.tsx```                                                                           |
| Social login integration                     | Google/Email via PrivyProvider                    | ```7:31:mobile/app/providers.tsx```                                                                       |
| Wallet funding automation                    | Auto-funds new wallets via faucet                 | ```30:46:mobile/trpc/routers/siren.ts```                                                                  |
| Transaction signing with Privy               | Uses `useSignRawHash` for TX signing              | ```157:210:mobile/components/SubmitSignalModal.tsx```                                                     |
| Wallet address management                    | Stores Privy user → Movement address mapping      | ```4:11:mobile/db/schema.ts```                                                                            |
| **Best Consumer App built on Movement**      |
| Move smart contracts deployed                | Core + Reputation modules on testnet              | ```1:215:packages/contracts/sources/core.move```<br>```1:81:packages/contracts/sources/reputation.move``` |
| Real-time signal submission                  | Submit signals with GPS coordinates               | ```23:36:mobile/lib/transactions.ts```<br>```58:137:packages/contracts/sources/core.move```               |
| Proximity-based consensus                    | Auto-matches nearby signals, increases confidence | ```48:137:packages/contracts/sources/core.move```                                                         |
| On-chain reputation system                   | Earn reputation for submissions/confirmations     | ```25:40:packages/contracts/sources/reputation.move```                                                    |
| Signal query & display                       | View all signals with map/list views              | ```48:60:mobile/trpc/routers/siren.ts```<br>```35:309:mobile/components/MapView.tsx```                    |
| Consumer-friendly UX                         | Mobile-first design, zero crypto friction         | ```10:105:mobile/app/page.tsx```<br>```14:89:mobile/components/WalletSelection.tsx```                     |

------
**Solo Built for Movement M1 Hackathon, Powered by Replit** 
