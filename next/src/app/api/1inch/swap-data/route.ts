import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amount = searchParams.get('amount');

  if (!amount) {
    return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
  }

  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const ONEINCH_TOKEN_ADDRESS = "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE";
  const STAKING_CONTRACT_ADDRESS = "0x36F371216FA08C324d5DABe1C32542396C0d5200";

  try {
    // First, get the quote to check the swap is possible
    const quoteResponse = await axios.get('https://api.1inch.dev/swap/v6.1/8453/quote', {
      headers: {
        'Authorization': `Bearer ${process.env.apiKey}`
      },
      params: {
        fromTokenAddress: USDC_ADDRESS,
        toTokenAddress: ONEINCH_TOKEN_ADDRESS,
        amount: amount
      }
    });

    // Then get the swap data with flags to skip pre-checks
    const swapResponse = await axios.get('https://api.1inch.dev/swap/v6.1/8453/swap', {
      headers: {
        'Authorization': `Bearer ${process.env.apiKey}`
      },
      params: {
        fromTokenAddress: USDC_ADDRESS,
        toTokenAddress: ONEINCH_TOKEN_ADDRESS,
        fromAddress: STAKING_CONTRACT_ADDRESS,
        amount: amount,
        slippage: 1,
        disableEstimate: true, // Skip balance and allowance checks
        allowPartialFill: false,
        compatibilityMode: true // Add this to ensure compatibility
      }
    });

    return NextResponse.json(swapResponse.data);
  } catch (error: any) {
    console.error('Error details:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch swap data', details: error.response?.data || error.message }, 
      { status: error.response?.status || 500 }
    );
  }
} 