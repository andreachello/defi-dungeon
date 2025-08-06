import { NextResponse } from 'next/server';
import axios from 'axios';

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
    // First try to get a quote to check liquidity
    const quoteResponse = await axios.get('https://api.1inch.dev/swap/v6.1/8453/quote', {
      headers: {
        'Authorization': `Bearer ${process.env.apiKey}`
      },
      params: {
        src: USDC_ADDRESS,
        dst: ONEINCH_TOKEN_ADDRESS,
        amount: amount
      }
    });

    console.log('Quote Response:', quoteResponse.data);

    // If quote succeeds, try the swap
    const swapResponse = await axios.get('https://api.1inch.dev/swap/v6.1/8453/swap', {
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
        origin: STAKING_CONTRACT_ADDRESS // Add this to match contract's srcReceiver
      }
    });

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