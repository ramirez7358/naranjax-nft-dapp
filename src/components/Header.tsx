import { Button } from "./ui/button"
import { CONTRACT_ADDRESS, truncateAddress } from "../lib/contract"
import { useWeb3 } from "../hooks/useWeb3"

export function Header() {
  const { account, isConnected, isCorrectChain, connect, disconnect, isConnecting, error, clearError } = useWeb3()

  const handleConnect = async () => {
    console.log("[v0] Header connect button clicked")
    try {
      await connect()
    } catch (err) {
      console.error("[v0] Header connect error:", err)
      // Error is already handled in useWeb3 hook
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">NaranjaX Brand NFT</h1>
          </div>

          {/* Connection Info */}
          <div className="flex items-center space-x-4">
            {/* Contract Address */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <span>Contract:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{truncateAddress(CONTRACT_ADDRESS)}</code>
            </div>

            {/* Chain Info */}
            {isConnected && (
              <div className="flex items-center space-x-2 text-sm">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isCorrectChain ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  Sepolia
                </span>
              </div>
            )}

            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-700">{truncateAddress(account!)}</div>
                <Button onClick={disconnect} variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button onClick={handleConnect} size="sm" disabled={isConnecting}>
                  {isConnecting ? "Connecting..." : "Connect MetaMask"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-red-700">❌ {error}</div>
              <Button onClick={clearError} variant="ghost" size="sm" className="text-red-700 hover:text-red-800">
                ✕
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wrong Chain Warning */}
      {isConnected && !isCorrectChain && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="text-sm text-red-700">⚠️ Please switch to Sepolia (Chain ID: 11155111) to use this DApp</div>
          </div>
        </div>
      )}
    </header>
  )
}
