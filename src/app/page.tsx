"use client";

import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import Posts from "../components/posts";
import { Button } from "@/components/ui/button";
import { erc20Abi } from "viem";
import { USDC_TOKEN_ADDRESS } from "../lib/constants";
import { formatUnits } from "viem";
import { Loader2 } from "lucide-react";

function App() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    data: usdcBalance,
    isFetching: isLoadingUsdcBalance,
    refetch: refetchUsdcBalance,
  } = useReadContract({
    abi: erc20Abi,
    address: USDC_TOKEN_ADDRESS,
    functionName: "balanceOf",
    args: [account.address as `0x${string}`],
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-between px-4 pb-4 md:pb-8 md:px-8">
      <div className="w-full max-w-2xl mx-auto">
        <nav className="flex justify-between items-center sticky top-0 bg-background z-10 py-4">
          <h1 className="text-2xl font-bold">Feed</h1>
          {account.status === "connected" ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm items-center flex gap-1">
                {isLoadingUsdcBalance && (
                  <span className="inline-block animate-spin">
                    <Loader2 className="w-4 h-4" />
                  </span>
                )}
                {usdcBalance && <>${formatUnits(usdcBalance, 6)}</>}
              </span>
              <span
                className="text-sm text-muted-foreground cursor-pointer hover:opacity-80"
                onClick={() => {
                  navigator.clipboard.writeText(account.address || "");
                }}
                title="Click to copy address"
              >
                {account.address?.slice(0, 6)}...
                {account.address?.slice(-4)}
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

        <Posts onTipSuccess={refetchUsdcBalance} />
      </div>
    </main>
  );
}

export default App;
