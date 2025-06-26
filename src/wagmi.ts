import { numberToHex, parseEther } from "viem";
import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  injected,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      coinbaseWallet({
        preference: {
          options: "smartWalletOnly",
          keysUrl: "https://keys-dev.coinbase.com/connect",
        },
        // @ts-ignore
        subAccounts: {
          enableAutoSubAccounts: true,
          // defaultSpendLimits: {
          //   [baseSepolia.id]: [
          //     {
          //       allowance: numberToHex(parseEther("0.1")),
          //       period: 24 * 60 * 60, // 1 day
          //       token: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          //     }
          //   ]
          // }
        },
        paymasterUrls: {
          [baseSepolia.id]: process.env.NEXT_PUBLIC_PAYMASTER_SERVICE_URL!,
        },
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [baseSepolia.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
