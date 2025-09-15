import { useState, useEffect } from "react"
import { web3Manager, type Web3State } from "../lib/web3"

export function useWeb3() {
  const [state, setState] = useState<Web3State>(web3Manager.getState())
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = web3Manager.subscribe(setState)
    return unsubscribe
  }, [])

  const connect = async () => {
    console.log("[v0] useWeb3 connect called")
    setIsConnecting(true)
    setError(null)

    try {
      await web3Manager.connect()
      console.log("[v0] useWeb3 connect successful")
    } catch (error: any) {
      console.error("[v0] useWeb3 connection failed:", error)
      setError(error.message || "Failed to connect to MetaMask")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setError(null)
    web3Manager.disconnect()
  }

  const clearError = () => {
    setError(null)
  }

  return {
    ...state,
    isConnecting,
    error,
    connect,
    disconnect,
    clearError,
    isCorrectChain: state.chainId === 11155111,
  }
}
