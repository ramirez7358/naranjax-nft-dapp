import { Header } from "./components/Header"
import { OwnerPanel } from "./components/OwnerPanel"
import { MintPanel } from "./components/MintPanel"
import { Holdings } from "./components/Holdings"
import { useWeb3 } from "./hooks/useWeb3"

function App() {
  const { isConnected, isCorrectChain } = useWeb3()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to NaranjaX Brand NFT DApp</h2>
            <p className="text-gray-600 mb-8">Connect your wallet to start minting and managing NFTs</p>
          </div>
        ) : !isCorrectChain ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Wrong Network</h2>
            <p className="text-gray-600">Please switch to Sepolia to use this DApp</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Owner Panel */}
            <OwnerPanel />

            {/* Mint Panel */}
            <MintPanel />

            {/* Holdings */}
            <Holdings />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
