## Naranja Brand NFT DApp

An opinionated React + Vite + TypeScript DApp for minting and viewing ERC-721 NFTs. It uses Tailwind CSS for styling and ethers/wagmi/viem for Web3 interactions.

### Tech Stack
- React 18 + Vite 5 (TypeScript)
- Tailwind CSS 3
- Ethers v6, Wagmi, Viem
- Radix UI + lucide-react + tailwindcss-animate

### Prerequisites
- Node.js 18+ (recommended: LTS)
- npm 9+ (comes with Node 18+)
- A deployed ERC-721-compatible contract (or use a test deployment)

### Getting Started
1) Install dependencies
```bash
npm install
```

2) Configure environment variables
Create a file named `.env.local` in the project root with the following variables:
```bash
# Address of your ERC-721 contract
VITE_CONTRACT_ADDRESS=0xYourContractAddress

# RPC URL for your target network (Alchemy/Infura/local node, etc.)
VITE_RPC_URL=https://your-rpc-url

# Chain ID of the target network (e.g. 1: mainnet, 11155111: Sepolia)
VITE_CHAIN_ID=11155111
```

3) Run the development server
```bash
npm run dev
```
By default, the app runs at http://localhost:5173

### Build & Preview
Create a production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```
The preview server will also run on http://localhost:5173 (unless occupied).

### Project Structure (high-level)
```
├─ src/
│  ├─ components/        # UI components and panels
│  ├─ hooks/             # React hooks (e.g., Web3)
│  ├─ lib/               # Web3 helpers, contract config
│  ├─ types/             # TypeScript types
│  ├─ main.tsx           # App entry with Vite
│  └─ index.css          # Tailwind + theme tokens
├─ index.html            # Vite HTML entry
├─ tailwind.config.js    # Tailwind configuration
├─ postcss.config.js     # PostCSS configuration
├─ vite.config.ts        # Vite configuration
└─ package.json          # Scripts and dependencies
```

### Common Scripts
- `npm run dev`: Start the Vite development server
- `npm run build`: Type-check and build for production
- `npm run preview`: Preview the production build

### Wallet & Network
- Make sure your wallet (e.g., MetaMask) is connected to the same network as `VITE_CHAIN_ID`.
- The contract address provided in `VITE_CONTRACT_ADDRESS` must exist on that same network.

### Metadata for Minting
The mint flow expects a Token URI pointing to a JSON file (HTTP(S) or IPFS) with typical NFT metadata fields:
```json
{
  "name": "My NFT #1",
  "description": "A unique collectible",
  "image": "https://your-domain.com/path/image.png",
  "attributes": [{ "trait_type": "Rarity", "value": "Common" }]
}
```

### Troubleshooting
- Node version: Ensure Node.js 18+ (`node -v`). Vite 5 requires modern Node.
- Tailwind config: The project uses a manual Tailwind setup. No external `shadcn/ui` config is required.
- Contract errors: If you see messages about ABI mismatch or contract not found, verify `VITE_CONTRACT_ADDRESS`, network `VITE_CHAIN_ID`, and your RPC URL.
- Port conflicts: If port 5173 is in use, stop other services or set a custom port with `vite --port 5174`.

### License
This project is provided as-is for demonstration and educational purposes.


