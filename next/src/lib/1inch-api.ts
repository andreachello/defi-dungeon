const ONEINCH_API_BASE = "https://api.1inch.dev";

export interface SwapQuote {
  fromToken: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI: string;
    tags: string[];
  };
  toToken: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI: string;
    tags: string[];
  };
  toTokenAmount: string;
  fromTokenAmount: string;
  protocols: any[];
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: number;
    gasPrice: string;
  };
}

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI: string;
  tags: string[];
}

export class OneInchAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = ONEINCH_API_BASE;
  }

  private async makeRequest(
    endpoint: string,
    params: Record<string, any> = {}
  ) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `1inch API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getQuote(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    chainId: number = 1
  ): Promise<SwapQuote> {
    return this.makeRequest(`/swap/v6.0/${chainId}/quote`, {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount: amount,
    });
  }

  async getSwap(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1,
    chainId: number = 1
  ): Promise<SwapQuote> {
    return this.makeRequest(`/swap/v6.0/${chainId}/swap`, {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount: amount,
      from: fromAddress,
      slippage: slippage,
    });
  }

  async getTokens(chainId: number = 1): Promise<TokenInfo[]> {
    return this.makeRequest(`/token/v1.2/${chainId}`);
  }

  async getTokenPrices(
    tokenAddresses: string[],
    chainId: number = 1
  ): Promise<Record<string, number>> {
    const response = await this.makeRequest(`/price/v1.1/${chainId}`, {
      tokens: tokenAddresses.join(","),
    });
    return response;
  }

  async getGasPrice(chainId: number = 1): Promise<{
    fast: number;
    standard: number;
    slow: number;
  }> {
    return this.makeRequest(`/gas-price/v1.1/${chainId}`);
  }
}
