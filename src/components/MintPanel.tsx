import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { isValidAddress } from "../lib/contract"
import { useWeb3 } from "../hooks/useWeb3"

export function MintPanel() {
  const { account, contract, signer } = useWeb3()
  const [toAddress, setToAddress] = useState("")
  const [tokenURI, setTokenURI] = useState("")
  const [isAuthorizedMinter, setIsAuthorizedMinter] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [hash, setHash] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [contractError, setContractError] = useState<string | null>(null)

  // Check if current user is authorized minter
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!contract || !account) {
        setIsLoadingAuth(false)
        return
      }

      try {
        console.log("[v0] Checking minter authorization for:", account)
        const isAuthorized = await contract.isAuthorizedMinter(account)
        console.log("[v0] Is authorized minter:", isAuthorized)
        setIsAuthorizedMinter(isAuthorized)
        setContractError(null)
      } catch (error) {
        console.error("[v0] Error checking authorization:", error)
        setIsAuthorizedMinter(false)
        if (error instanceof Error && error.message.includes("could not decode result data")) {
          setContractError(
            "Contract not found at the configured address. Please check if the contract is deployed and the address is correct.",
          )
        } else {
          setContractError("Failed to connect to contract. Please check your network connection.")
        }
      } finally {
        setIsLoadingAuth(false)
      }
    }

    checkAuthorization()
  }, [contract, account])

  // Handle minting
  const handleMint = async () => {
    if (!isValidAddress(toAddress)) {
      toast.error("Please enter a valid recipient address")
      return
    }

    if (!tokenURI.trim()) {
      toast.error("Please enter a token URI")
      return
    }

    // Basic URI validation
    if (!tokenURI.startsWith("http://") && !tokenURI.startsWith("https://") && !tokenURI.startsWith("ipfs://")) {
      toast.error("Token URI should start with http://, https://, or ipfs://")
      return
    }

    if (!contract || !signer) {
      toast.error("Contract not available")
      return
    }

    try {
      console.log("[v0] Minting NFT to:", toAddress, "with URI:", tokenURI)
      setIsPending(true)
      setHash(null)

      const contractWithSigner = contract.connect(signer)
      const tx = await contractWithSigner.mint(toAddress, tokenURI)
      setHash(tx.hash)

      console.log("[v0] Mint transaction sent:", tx.hash)
      setIsConfirming(true)

      await tx.wait()
      console.log("[v0] Mint transaction confirmed")

      toast.success("NFT minted successfully!")
      // Clear form
      setToAddress("")
      setTokenURI("")
    } catch (error) {
      console.error("[v0] Error minting NFT:", error)
      toast.error("Failed to mint NFT")
    } finally {
      setIsPending(false)
      setIsConfirming(false)
    }
  }

  const canMint = isAuthorizedMinter && !isPending && !isConfirming
  const isValidForm = isValidAddress(toAddress) && tokenURI.trim()

  if (contractError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚠️</span>
            <span>Contract Error</span>
          </CardTitle>
          <CardDescription>Unable to connect to the NFT contract</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{contractError}</p>
            <p className="text-red-600 text-xs mt-2">
              Please deploy your contract and update the CONTRACT_ADDRESS in src/lib/contract.ts
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🎨</span>
          <span>Mint NFT</span>
        </CardTitle>
        <CardDescription>
          {isLoadingAuth
            ? "Checking authorization..."
            : isAuthorizedMinter
              ? "You are authorized to mint NFTs"
              : "You are not authorized to mint NFTs"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authorization Status */}
        <div
          className={`p-3 rounded-lg border ${
            isAuthorizedMinter ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{isAuthorizedMinter ? "✅" : "❌"}</span>
            <span className="font-medium">{isAuthorizedMinter ? "Authorized Minter" : "Not Authorized"}</span>
          </div>
          {!isAuthorizedMinter && (
            <p className="text-sm mt-1">Contact the contract owner to get minting authorization</p>
          )}
        </div>

        {/* Mint Form */}
        <div className="space-y-4">
          {/* Recipient Address */}
          <div>
            <label htmlFor="to-address" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address
            </label>
            <Input
              id="to-address"
              type="text"
              placeholder="0x..."
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              disabled={!isAuthorizedMinter}
              className={!isValidAddress(toAddress) && toAddress ? "border-red-300" : ""}
            />
            {toAddress && !isValidAddress(toAddress) && (
              <p className="text-sm text-red-600 mt-1">Invalid Ethereum address</p>
            )}
          </div>

          {/* Token URI */}
          <div>
            <label htmlFor="token-uri" className="block text-sm font-medium text-gray-700 mb-1">
              Token URI
            </label>
            <Input
              id="token-uri"
              type="text"
              placeholder="https://example.com/metadata.json or ipfs://..."
              value={tokenURI}
              onChange={(e) => setTokenURI(e.target.value)}
              disabled={!isAuthorizedMinter}
            />
            <p className="text-sm text-gray-500 mt-1">
              URL pointing to the NFT metadata (JSON file with name, description, image, etc.)
            </p>
          </div>

          {/* Quick Fill Button */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setToAddress(account || "")}
              disabled={!isAuthorizedMinter || !account}
            >
              Mint to Self
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setTokenURI("https://raw.githubusercontent.com/ethereum/EIPs/master/assets/eip-721/example.json")
              }
              disabled={!isAuthorizedMinter}
            >
              Use Example URI
            </Button>
          </div>
        </div>

        {/* Mint Button */}
        <div className="flex justify-end">
          <Button onClick={handleMint} disabled={!canMint || !isValidForm} className="min-w-[120px]" size="lg">
            {isPending || isConfirming ? "Minting..." : "Mint NFT"}
          </Button>
        </div>

        {/* Transaction Status */}
        {hash && (
          <div className="text-sm text-gray-600 space-y-1">
            <p>Transaction: {hash}</p>
            {isConfirming && <p className="text-blue-600">Confirming transaction...</p>}
          </div>
        )}

        {/* Help Text */}
        {!isAuthorizedMinter && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-1">Need Authorization?</h4>
            <p className="text-sm text-blue-700">
              Only authorized minters can create NFTs. If you're the contract owner, use the Owner Panel above to
              authorize your address. Otherwise, contact the contract owner.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
