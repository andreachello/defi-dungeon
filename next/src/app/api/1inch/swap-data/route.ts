import { NextResponse } from 'next/server';
import axios from 'axios';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 10000; // 10 seconds
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

async function makeRequestWithRetry(
  url: string,
  config: any,
  retryCount = 0
): Promise<any> {
  try {
    const response = await axios.get(url, config);
    return response;
  } catch (error: any) {
    // Check if we should retry
    if (
      retryCount < MAX_RETRIES &&
      (RETRYABLE_STATUS_CODES.includes(error.response?.status) || !error.response)
    ) {
      // Calculate delay with exponential backoff
      const delay = Math.min(INITIAL_DELAY * Math.pow(2, retryCount), MAX_DELAY);
      console.log(`1inch API retry ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms delay`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeRequestWithRetry(url, config, retryCount + 1);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amount = searchParams.get('amount');
  const receiver = searchParams.get('receiver');

  if (!amount || !receiver) {
    return NextResponse.json({ error: 'Amount and receiver are required' }, { status: 400 });
  }

  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const ONEINCH_TOKEN_ADDRESS = "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE";
  const STAKING_CONTRACT_ADDRESS = "0x962f6Ea4E7816b5daf8b34DfcFc328120801dF2F";

  // Log the parameters
  console.log('Swap Parameters:', {
    src: USDC_ADDRESS,
    dst: ONEINCH_TOKEN_ADDRESS,
    amount: amount,
    from: STAKING_CONTRACT_ADDRESS,
    receiver: receiver
  });

  try {
    // First try to get a quote to check liquidity with retries
    const quoteResponse = await makeRequestWithRetry(
      'https://api.1inch.dev/swap/v6.1/8453/quote',
      {
        headers: {
          'Authorization': `Bearer ${process.env.apiKey}`
        },
        params: {
          src: USDC_ADDRESS,
          dst: ONEINCH_TOKEN_ADDRESS,
          amount: amount
        }
      }
    );

    console.log('Quote Response:', quoteResponse.data);

    // If quote succeeds, try the swap with retries
    const swapResponse = await makeRequestWithRetry(
      'https://api.1inch.dev/swap/v6.1/8453/swap',
      {
        headers: {
          'Authorization': `Bearer ${process.env.apiKey}`
        },
        params: {
          src: USDC_ADDRESS,
          dst: ONEINCH_TOKEN_ADDRESS,
          amount: amount,
          from: STAKING_CONTRACT_ADDRESS,
          receiver: receiver,
          slippage: 1,
          disableEstimate: true,
          allowPartialFill: false,
          referrer: STAKING_CONTRACT_ADDRESS,
          origin: STAKING_CONTRACT_ADDRESS
        }
      }
    );

    // Log the swap data for debugging
    console.log('Swap Response:', swapResponse.data);

    return NextResponse.json(swapResponse.data);
  } catch (error: any) {
    console.error('Error details:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: 'Failed to fetch swap data', 
        details: error.response?.data || error.message,
        params: {
          src: USDC_ADDRESS,
          dst: ONEINCH_TOKEN_ADDRESS,
          amount: amount,
          from: STAKING_CONTRACT_ADDRESS,
          receiver: receiver
        }
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
