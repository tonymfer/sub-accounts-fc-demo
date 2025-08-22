import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      baseAccount({
        preference: {
          walletUrl: "https://keys-dev.coinbase.com/connect",
        },
        subAccounts: {
          // @ts-ignore
          enableAutoSubAccounts: true,
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
