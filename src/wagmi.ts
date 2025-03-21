import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { version4 } from './lib/connector'

export function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
     version4({
      preference: {
        options: "smartWalletOnly",
        keysUrl: "https://keys-dev.coinbase.com/connect",
      },
     })
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [baseSepolia.id]: http(),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
