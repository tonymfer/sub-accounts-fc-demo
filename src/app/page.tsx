"use client";

import { Button } from "@/components/ui/button";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useWaitForTransactionReceipt,
  useSendTransaction,
} from "wagmi";
import Posts from "../components/posts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useEffect } from "react";
import { parseUnits, isAddress, encodeFunctionData } from "viem";
import { toast } from "sonner";
import { USDC, erc20Abi } from "@/lib/usdc";

function App() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address: account.address,
    token: USDC.address,
    query: {
      refetchInterval: 1000,
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [toastId, setToastId] = useState<string | number | null>(null);

  const {
    sendTransaction,
    data: hash,
    isPending: isTransactionPending,
    reset: resetTransaction,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleSend = useCallback(async () => {
    if (!amount || !isAddress(toAddress)) {
      toast.error("Invalid input", {
        description: "Please enter a valid address and amount",
      });
      return;
    }

    try {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [toAddress as `0x${string}`, parseUnits(amount, USDC.decimals)],
      });

      sendTransaction({
        to: USDC.address,
        data,
        value: 0n,
      });

      const toastId_ = toast("Sending USDC...", {
        description: `Sending ${amount} USDC to ${toAddress}`,
        duration: Infinity,
      });

      setToastId(toastId_);
      setIsDialogOpen(false);
      setAmount("");
      setToAddress("");
    } catch (_error) {
      toast.error("Transaction failed", {
        description: "Please try again",
      });
    }
  }, [amount, toAddress, sendTransaction]);

  useEffect(() => {
    if (isConfirmed && toastId !== null) {
      toast.success("Transaction successful!", {
        description: `Sent ${amount} USDC to ${toAddress}`,
        duration: 2000,
      });

      setTimeout(() => {
        toast.dismiss(toastId);
      }, 0);

      setToastId(null);
      resetTransaction();
    }
  }, [isConfirmed, toastId, amount, toAddress, resetTransaction]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between px-4 pb-4 md:pb-8 md:px-8">
      <div className="w-full max-w-2xl mx-auto">
        <nav className="flex justify-between items-center sticky top-0 bg-background z-10 py-4">
          <h1 className="text-2xl font-bold">Feed</h1>
          {account.status === "connected" ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <button
                type="button"
                className="text-sm text-muted-foreground cursor-pointer hover:opacity-80"
                onClick={() => {
                  navigator.clipboard.writeText(account.address || "");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigator.clipboard.writeText(account.address || "");
                  }
                }}
                aria-label="Click to copy address"
                title="Click to copy address"
              >
                {account.address?.slice(0, 6)}...
                {account.address?.slice(-4)}
              </button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <span className="text-sm text-muted-foreground cursor-pointer hover:opacity-80">
                    ({balance?.formatted.slice(0, 6)} {balance?.symbol})
                  </span>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send USDC</DialogTitle>
                    <DialogDescription>
                      Enter the recipient address and amount to send
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground">
                        Your Balance{" "}
                        <a
                          href="https://faucet.circle.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:opacity-80"
                        >
                          Get USDC
                        </a>
                      </div>
                      <div className="text-xl font-medium">
                        {balance
                          ? `${balance.formatted} ${balance.symbol}`
                          : "Loading..."}
                      </div>
                    </div>
                    <Input
                      placeholder="Recipient Address (0x...)"
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Amount in USDC"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleSend}
                      disabled={
                        !amount ||
                        !toAddress ||
                        isConfirming ||
                        isTransactionPending
                      }
                    >
                      Send USDC
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline hover:opacity-80"
              >
                Get USDC
              </a>

              <Button variant="outline" onClick={() => disconnect()} size="sm">
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  size="sm"
                >
                  {connector.name}
                </Button>
              ))}
            </div>
          )}
        </nav>

        <Posts onTipSuccess={() => {}} />
      </div>
    </main>
  );
}

export default App;
