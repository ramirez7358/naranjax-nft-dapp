import { ethers } from "ethers";

export const CONTRACT_ABI = [
  // ERC721 standard functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",

  // Custom contract functions
  "function owner() view returns (address)",
  "function isAuthorizedMinter(address minter) view returns (bool)",
  "function setMinter(address minter, bool status)",
  "function mint(address to, string uri)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
];

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const RPC_URL = import.meta.env.VITE_RPC_URL;
export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID;
export const START_BLOCK = 0;

// Helper function to validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Helper function to truncate address for display
export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function validateContract(
  provider: ethers.Provider,
  address: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Check if address has contract code
    const code = await provider.getCode(address);
    if (code === "0x") {
      return {
        isValid: false,
        error: `No contract found at address ${address}. This appears to be an EOA (wallet address), not a deployed contract.`,
      };
    }

    // Try to call a basic function to verify ABI compatibility
    const contract = new ethers.Contract(address, CONTRACT_ABI, provider);
    try {
      await contract.name.staticCall();
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Contract exists but ABI mismatch. The contract at ${address} may not be an ERC721 or may have different function signatures.`,
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate contract: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
