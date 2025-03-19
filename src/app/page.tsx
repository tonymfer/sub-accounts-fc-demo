"use client";

import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import Posts from "../components/posts";
import { Button } from "@/components/ui/button";
import { erc20Abi } from "viem";
import { USDC_TOKEN_ADDRESS } from "../lib/constants";
import { formatUnits } from "viem";

function App() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } =
    useReadContract({
      abi: erc20Abi,
      address: USDC_TOKEN_ADDRESS,
      functionName: "balanceOf",
      args: [account.address as `0x${string}`],
    });

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <nav className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Feed</h1>
          {account.status === "connected" ? (
            <div className="flex items-center gap-2">
              <span
                className="text-sm text-muted-foreground cursor-pointer hover:opacity-80"
                onClick={() => {
                  navigator.clipboard.writeText(account.address || "");
                }}
                title="Click to copy address"
              >
                {account.address?.slice(0, 6)}...
                {account.address?.slice(-4)}
                {usdcBalance && !isLoadingUsdcBalance && (
                  <span className="ml-2">
                    ({formatUnits(usdcBalance, 6)} USDC)
                  </span>
                )}
              </span>
              <Button variant="outline" onClick={() => disconnect()} size="sm">
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => connect({ connector: connectors[0] })}
              size="sm"
            >
              Connect Wallet
            </Button>
          )}
        </nav>

        <Posts />
      </div>
    </main>
  );
}

export default App;
