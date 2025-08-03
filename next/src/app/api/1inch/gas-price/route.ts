import { NextRequest, NextResponse } from "next/server";
import { OneInchAPI } from "@/lib/1inch-api";

const oneInchAPI = new OneInchAPI(process.env.apiKey || "");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get("chainId") || "1";

    const gasPrice = await oneInchAPI.getGasPrice(parseInt(chainId));

    return NextResponse.json(gasPrice);
  } catch (error) {
    console.error("1inch Gas Price API error:", error);
    return NextResponse.json(
      { error: "Failed to get gas price" },
      { status: 500 }
    );
  }
}
