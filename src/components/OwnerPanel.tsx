import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { isValidAddress } from "../lib/contract"
import { useWeb3 } from "../hooks/useWeb3"

export function OwnerPanel() {
  const { account, contract, signer } = useWeb3()
  const [minterAddress, setMinterAddress] = useState("")
  const [isAuthorizing, setIsAuthorizing] = useState(true) // true = authorize, false = deauthorize
  const [contractOwner, setContractOwner] = useState<string | null>(null)
  const [isLoadingOwner, setIsLoadingOwner] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [hash, setHash] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [contractError, setContractError] = useState<string | null>(null)

  // Fetch contract owner
  useEffect(() => {
    const fetchOwner = async () => {
      if (!contract) return

      try {
        console.log("[v0] Fetching contract owner...")
        const owner = await contract.owner()
        console.log("[v0] Contract owner:", owner)
        setContractOwner(owner)
        setContractError(null)
      } catch (error) {
        console.error("[v0] Error fetching owner:", error)
        if (error instanceof Error && error.message.includes("could not decode result data")) {
          setContractError(
            "Contract not found at the configured address. Please check if the contract is deployed and the address is correct.",
          )
        } else {
          setContractError("Failed to connect to contract. Please check your network connection.")
        }
      } finally {
        setIsLoadingOwner(false)
      }
    }

    fetchOwner()
  }, [contract])

  // Check if current user is owner
  const isOwner = account && contractOwner && account.toLowerCase() === contractOwner.toLowerCase()

  // Handle setting minter
  const handleSetMinter = async () => {
    if (!isValidAddress(minterAddress)) {
      toast.error("Please enter a valid Ethereum address")
      return
    }

    if (!contract || !signer) {
      toast.error("Contract not available")
      return
    }

    try {
      console.log("[v0] Setting minter:", minterAddress, isAuthorizing)
      setIsPending(true)

      const contractWithSigner = contract.connect(signer)
      const tx = await contractWithSigner.setMinter(minterAddress, isAuthorizing)
      setHash(tx.hash)

      console.log("[v0] Transaction sent:", tx.hash)
      setIsConfirming(true)

      await tx.wait()
      console.log("[v0] Transaction confirmed")

      toast.success(`Minter ${isAuthorizing ? "authorized" : "deauthorized"} successfully!`)
      setMinterAddress("")
    } catch (error) {
      console.error("[v0] Error setting minter:", error)
      toast.error("Failed to set minter")
    } finally {
      setIsPending(false)
      setIsConfirming(false)
    }
  }

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
              Current contract address: {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "Not configured"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Don't show panel if not owner
  if (isLoadingOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Owner Panel</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!isOwner) {
    return null // Don't show panel if not owner
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>👑</span>
          <span>Owner Panel</span>
        </CardTitle>
        <CardDescription>Manage authorized minters for the NFT contract</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Minter Address Input */}
          <div className="md:col-span-2">
            <label htmlFor="minter-address" className="block text-sm font-medium text-gray-700 mb-1">
              Minter Address
            </label>
            <Input
              id="minter-address"
              type="text"
              placeholder="0x..."
              value={minterAddress}
              onChange={(e) => setMinterAddress(e.target.value)}
              className={!isValidAddress(minterAddress) && minterAddress ? "border-red-300" : ""}
            />
            {minterAddress && !isValidAddress(minterAddress) && (
              <p className="text-sm text-red-600 mt-1">Invalid Ethereum address</p>
            )}
          </div>

          {/* Action Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <div className="flex space-x-2">
              <Button
                variant={isAuthorizing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAuthorizing(true)}
                className="flex-1"
              >
                Authorize
              </Button>
              <Button
                variant={!isAuthorizing ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsAuthorizing(false)}
                className="flex-1"
              >
                Revoke
              </Button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSetMinter}
            disabled={!isValidAddress(minterAddress) || isPending || isConfirming}
            className="min-w-[120px]"
          >
            {isPending || isConfirming ? "Processing..." : `${isAuthorizing ? "Authorize" : "Revoke"} Minter`}
          </Button>
        </div>

        {/* Transaction Status */}
        {hash && (
          <div className="text-sm text-gray-600">
            <p>Transaction: {hash}</p>
            {isConfirming && <p className="text-blue-600">Confirming transaction...</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
