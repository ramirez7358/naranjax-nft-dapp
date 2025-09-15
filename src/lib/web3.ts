import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, validateContract } from "./contract";

export interface Web3State {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: ethers.Contract | null;
  chainId: number | null;
  isConnected: boolean;
}

export const SEPOLIA_CHAIN_ID = 11155111;

export class Web3Manager {
  private state: Web3State = {
    account: null,
    provider: null,
    signer: null,
    contract: null,
    chainId: null,
    isConnected: false,
  };

  private listeners: ((state: Web3State) => void)[] = [];

  subscribe(listener: (state: Web3State) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  async connect() {
    console.log("[v0] Starting MetaMask connection...");

    if (!window.ethereum) {
      console.log("[v0] MetaMask not found");
      throw new Error("MetaMask is not installed");
    }

    try {
      console.log("[v0] Creating provider...");
      const provider = new ethers.BrowserProvider(window.ethereum);

      console.log(
        "[v0] Requesting wallet permissions to force account selection..."
      );
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (permError) {
        // If permissions request fails, continue with regular account request
        console.log(
          "[v0] Permissions request failed, continuing with account request:",
          permError
        );
      }

      console.log("[v0] Requesting accounts...");
      await provider.send("eth_requestAccounts", []);

      console.log("[v0] Getting signer...");
      const signer = await provider.getSigner();

      console.log("[v0] Getting address...");
      const account = await signer.getAddress();

      console.log("[v0] Getting network...");
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      console.log("[v0] Connected to chain:", chainId);

      // Check if we're on Sepolia
      if (chainId !== SEPOLIA_CHAIN_ID) {
        console.log("[v0] Switching to Sepolia...");
        await this.switchToSepolia();
      }

      console.log("[v0] Validating contract at address:", CONTRACT_ADDRESS);
      const validation = await validateContract(provider, CONTRACT_ADDRESS);

      if (!validation.isValid) {
        console.error("[v0] Contract validation failed:", validation.error);
        throw new Error(`Contract validation failed: ${validation.error}`);
      }

      console.log("[v0] Contract validation successful");
      console.log("[v0] Creating contract instance...");
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      this.state = {
        account,
        provider,
        signer,
        contract,
        chainId,
        isConnected: true,
      };

      console.log("[v0] Connection successful, account:", account);
      this.notify();
    } catch (error) {
      console.error("[v0] Failed to connect:", error);
      throw error;
    }
  }

  async switchToSepolia() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
              chainName: "Sepolia Test Network",
              nativeCurrency: {
                name: "SepoliaETH",
                symbol: "SEP",
                decimals: 18,
              },
              rpcUrls: ["https://sepolia.infura.io/v3/"],
              blockExplorerUrls: ["https://sepolia.etherscan.io/"],
            },
          ],
        });
      }
    }
  }

  disconnect() {
    this.state = {
      account: null,
      provider: null,
      signer: null,
      contract: null,
      chainId: null,
      isConnected: false,
    };
    this.notify();
  }

  getState() {
    return this.state;
  }
}

export const web3Manager = new Web3Manager();

// Add global type for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
