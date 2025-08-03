import { cookieStorage, createStorage, http } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, arbitrum, base } from "@reown/appkit/networks";

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.projectID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const networks = [mainnet, arbitrum, base];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_1INCH_RPC_URL as string),
    [base.id]: http("https://mainnet.base.org")
  }
});

export const config = wagmiAdapter.wagmiConfig;
