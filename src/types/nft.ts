export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  // Optional additional ERC-721 standard fields
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface NFTToken {
  tokenId: bigint;
  tokenURI: string;
}
