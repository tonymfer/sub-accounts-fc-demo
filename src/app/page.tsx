"use client";

import { Button } from "@/components/ui/button";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import Posts from "../components/posts";

function App() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between px-4 pb-4 md:pb-8 md:px-8">
      <div className="w-full max-w-2xl mx-auto">
        <nav className="flex justify-between items-center sticky top-0 bg-background z-10 py-4">
          <h1 className="text-2xl font-bold">Feed</h1>
          {account.status === "connected" ? (
            <div className="flex items-center gap-2 text-muted-foreground">
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
