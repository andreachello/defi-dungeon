import { NextRequest, NextResponse } from "next/server";
import { OneInchAPI } from "@/lib/1inch-api";

const oneInchAPI = new OneInchAPI(process.env.apiKey || "");

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fromToken = searchParams.get("fromToken");
        const toToken = searchParams.get("toToken");
        const amount = searchParams.get("amount");
        const fromAddress = searchParams.get("fromAddress");
        const slippage = searchParams.get("slippage") || "1";
        const chainId = searchParams.get("chainId") || "8453"; // Base chain ID

        if (!fromToken || !toToken || !amount || !fromAddress) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        console.log('1inch Swap API call:', {
            fromToken,
            toToken,
            amount,
            fromAddress,
            slippage,
            chainId
        });

        const swap = await oneInchAPI.getSwap(
            fromToken,
            toToken,
            amount,
            fromAddress,
            parseFloat(slippage),
            parseInt(chainId)
        );

        return NextResponse.json(swap);
    } catch (error) {
        console.error("1inch Swap API error:", error);
        return NextResponse.json(
            { error: "Failed to get swap", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 