"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { START_BLOCK } from "../lib/contract"
import { useWeb3 } from "../hooks/useWeb3"
import type { NFTMetadata, NFTToken } from "../types/nft"

export function Holdings() {
  const { account, provider, contract } = useWeb3()
  const [ownedTokens, setOwnedTokens] = useState<NFTToken[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch owned tokens from Transfer events
  const fetchOwnedTokens = async () => {
    if (!account || !provider || !contract) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Fetching owned tokens for:", account)

      // Get the latest block number
      const latestBlock = await provider.getBlockNumber()
      console.log("[v0] Latest block:", latestBlock)

      // Create filter for Transfer events to this address
      const transferFilter = contract.filters.Transfer(null, account)

      // Fetch all Transfer events for this address
      const events = await contract.queryFilter(transferFilter, START_BLOCK, latestBlock)
      console.log("[v0] Found transfer events:", events.length)

      // Process events to determine owned tokens
      const tokenTransfers = new Map<string, { from: string; to: string; tokenId: bigint }>()

      // Process all transfer events
      for (const event of events) {
        if (event.args) {
          const { from, to, tokenId } = event.args
          tokenTransfers.set(tokenId.toString(), {
            from: from as string,
            to: to as string,
            tokenId: tokenId as bigint,
          })
        }
      }

      // Determine which tokens are currently owned by the user
      const ownedTokenIds: bigint[] = []
      for (const [, transfer] of tokenTransfers) {
        if (transfer.to.toLowerCase() === account.toLowerCase()) {
          ownedTokenIds.push(transfer.tokenId)
        }
      }

      // Remove duplicates and sort
      const uniqueTokenIds = [...new Set(ownedTokenIds.map((id) => id.toString()))]
        .map((id) => BigInt(id))
        .sort((a, b) => (a < b ? -1 : 1))

      console.log(
        "[v0] Owned token IDs:",
        uniqueTokenIds.map((id) => id.toString()),
      )

      // Fetch token URIs for owned tokens
      const tokensWithURIs: NFTToken[] = []
      for (const tokenId of uniqueTokenIds) {
        try {
          const tokenURI = await contract.tokenURI(tokenId)
          tokensWithURIs.push({ tokenId, tokenURI })
          console.log("[v0] Token", tokenId.toString(), "URI:", tokenURI)
        } catch (err) {
          console.error(`[v0] Failed to fetch URI for token ${tokenId}:`, err)
          tokensWithURIs.push({ tokenId, tokenURI: "Failed to load" })
        }
      }

      setOwnedTokens(tokensWithURIs)
    } catch (err) {
      console.error("[v0] Error fetching owned tokens:", err)
      setError("Failed to fetch owned tokens")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-fetch on mount and address change
  useEffect(() => {
    if (account && provider && contract) {
      fetchOwnedTokens()
    } else {
      setOwnedTokens([])
    }
  }, [account, provider, contract])

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your NFTs</CardTitle>
          <CardDescription>Connect your wallet to view your NFT collection</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>🖼️</span>
            <span>Your NFTs</span>
          </div>
          <Button onClick={fetchOwnedTokens} disabled={isLoading} size="sm" variant="outline">
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </CardTitle>
        <CardDescription>
          NFTs owned by your address (derived from Transfer events since block {START_BLOCK.toString()})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your NFTs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchOwnedTokens} size="sm">
              Try Again
            </Button>
          </div>
        ) : ownedTokens.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You don't own any NFTs from this contract yet</p>
            <p className="text-sm text-gray-500">Mint your first NFT using the panel above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Found {ownedTokens.length} NFT(s)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedTokens.map((token) => (
                <NFTCard key={token.tokenId.toString()} token={token} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Individual NFT Card Component
function NFTCard({ token }: { token: NFTToken }) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Fetch metadata from token URI
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!token.tokenURI || token.tokenURI === "Failed to load") return

      setIsLoadingMetadata(true)
      try {
        // Handle IPFS URIs
        let url = token.tokenURI
        if (url.startsWith("ipfs://")) {
          url = `https://ipfs.io/ipfs/${url.slice(7)}`
        }

        const response = await fetch(url)
        if (response.ok) {
          const data: NFTMetadata = await response.json()
          setMetadata(data)
        }
      } catch (err) {
        console.error(`Failed to fetch metadata for token ${token.tokenId}:`, err)
      } finally {
        setIsLoadingMetadata(false)
      }
    }

    fetchMetadata()
  }, [token.tokenURI, token.tokenId])

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Token ID */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Token #{token.tokenId.toString()}</span>
        </div>

        {/* Metadata */}
        {isLoadingMetadata ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : metadata ? (
          <div className="space-y-2">
            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              {metadata.image ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {!imageError ? (
                    <img
                      src={
                        metadata.image.startsWith("ipfs://")
                          ? `https://ipfs.io/ipfs/${metadata.image.slice(7)}`
                          : metadata.image
                      }
                      alt={metadata.name || `Token ${token.tokenId}`}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        imageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false)
                        setImageError(true)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🖼️</div>
                        <div className="text-sm">Image failed to load</div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <div className="text-sm">No image available</div>
                  </div>
                </div>
              )}
            </div>
            {metadata.name && <h4 className="font-medium text-gray-900">{metadata.name}</h4>}
            {metadata.description && <p className="text-sm text-gray-600 line-clamp-2">{metadata.description}</p>}

            {metadata.attributes && metadata.attributes.length > 0 && (
              <div className="pt-2">
                <div className="flex flex-wrap gap-1">
                  {metadata.attributes.slice(0, 3).map((attr, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {attr.trait_type}: {attr.value}
                    </span>
                  ))}
                  {metadata.attributes.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      +{metadata.attributes.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No metadata available</div>
        )}

        {/* Token URI Link */}
        <div className="pt-2 border-t border-gray-100">
          <a
            href={
              token.tokenURI.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${token.tokenURI.slice(7)}` : token.tokenURI
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 break-all"
          >
            View Metadata →
          </a>
        </div>
      </div>
    </div>
  )
}