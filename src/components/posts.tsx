import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Heart, Repeat2, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatUnits, parseUnits, isAddress, encodeFunctionData } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useBalance,
  useSendTransaction,
} from "wagmi";
import { USDC, erc20Abi } from "@/lib/usdc";
import { formatDate } from "../lib/utils";

export interface Post {
  id: string;
  author: {
    name: string;
    display_name: string;
    username: string;
    pfp_url: string;
    power_badge: boolean;
    custody_address: `0x${string}`;
    verified_addresses: {
      eth_addresses: `0x${string}`[];
      sol_addresses: string[];
    };
  };
  embeds: {
    metadata: {
      content_type: string;
    };
    url: string;
  }[];
  text: string;
  timestamp: string;
  reactions: {
    likes_count: number;
    recasts_count: number;
  };
  replies: {
    count: number;
  };
}

interface PostsResponse {
  posts: Post[];
}

const fetchPosts = async (): Promise<PostsResponse> => {
  const response = await fetch("/api/posts");
  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }
  return response.json();
};

export default function Posts({ onTipSuccess }: { onTipSuccess: () => void }) {
  const { data, isLoading, error } = useQuery<PostsResponse>({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading posts...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">Error loading posts</div>
    );
  }

  return (
    <div className="space-y-4">
      {data?.posts.map((post) => (
        <PostCard key={post.id} post={post} onTipSuccess={onTipSuccess} />
      ))}
    </div>
  );
}

function PostCard({
  post,
  onTipSuccess,
}: {
  post: Post;
  onTipSuccess: () => void;
}) {
  const account = useAccount();
  const { data: balance } = useBalance({
    address: account.address,
    token: USDC.address,
  });
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
  const [toastId, setToastId] = useState<string | number | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleTip = useCallback(async () => {
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [
        post.author.verified_addresses.eth_addresses[0],
        parseUnits("0.10", USDC.decimals),
      ],
    });

    sendTransaction({
      to: USDC.address,
      data,
      value: 0n,
    });

    const toastId_ = toast("Sending tip...", {
      description: `Tipping @${post.author.username} with 0.10 USDC`,
      duration: Infinity,
    });

    setToastId(toastId_);
  }, [post.author, sendTransaction]);

  const handleCustomTip = useCallback(async () => {
    if (
      !customTipAmount ||
      !isAddress(post.author.verified_addresses.eth_addresses[0])
    )
      return;

    try {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          post.author.verified_addresses.eth_addresses[0],
          parseUnits(customTipAmount, USDC.decimals),
        ],
      });

      sendTransaction({
        to: USDC.address,
        data,
        value: 0n,
      });

      const toastId_ = toast("Sending custom tip...", {
        description: `Tipping @${post.author.username} with ${customTipAmount} USDC`,
        duration: Infinity,
      });

      setToastId(toastId_);
      setIsDialogOpen(false);
      setCustomTipAmount("");
    } catch (_error) {
      toast.error("Invalid tip amount", {
        description: "Please enter a valid USDC amount",
      });
    }
  }, [customTipAmount, post.author, sendTransaction]);

  const handlePercentageClick = useCallback(
    (percentage: number) => {
      if (!balance?.value) return;
      const amount = (
        Number(formatUnits(balance.value, USDC.decimals)) * percentage
      ).toFixed(2);
      setCustomTipAmount(amount);
    },
    [balance]
  );

  useEffect(() => {
    if (isConfirmed && toastId !== null) {
      toast.success("Tip sent successfully!", {
        description: `You tipped @${post.author.username} with ${hash ? customTipAmount : "0.10"} USDC`,
        duration: 2000,
      });

      setTimeout(() => {
        toast.dismiss(toastId);
      }, 0);

      setToastId(null);
      resetTransaction();
      onTipSuccess();
    }
  }, [
    isConfirmed,
    toastId,
    post.author,
    resetTransaction,
    onTipSuccess,
    setToastId,
    hash,
    customTipAmount,
  ]);

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={post.author.pfp_url}
              alt={post.author.display_name}
            />
            <AvatarFallback>
              {post.author.display_name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{post.author.display_name}</div>
            <div className="text-sm text-muted-foreground">
              @{post.author.username} · {formatDate(post.timestamp)}
            </div>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
          <a
            href={`https://warpcast.com/~/conversations/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <div className="mb-3 whitespace-pre-wrap">{post.text}</div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span>{post.reactions.likes_count}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Repeat2 className="h-4 w-4 text-muted-foreground" />
            <span>{post.reactions.recasts_count}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={!account.address || isConfirming || isTransactionPending}
            onClick={handleTip}
          >
            <Send className="h-4 w-4" />
            <span>Tip 0.10 USDC</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={
                  !account.address || isConfirming || isTransactionPending
                }
              >
                <Send className="h-4 w-4" />
                <span>Custom Tip</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Custom Tip (USDC)</DialogTitle>
                <DialogDescription>
                  Enter the amount of USDC you want to tip @
                  {post.author.username}
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
                      ? `${Number(formatUnits(balance.value, USDC.decimals)).toFixed(2)} USDC`
                      : "Loading..."}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePercentageClick(0.1)}
                    disabled={!balance}
                  >
                    10%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePercentageClick(0.2)}
                    disabled={!balance}
                  >
                    20%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePercentageClick(0.5)}
                    disabled={!balance}
                  >
                    50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePercentageClick(1)}
                    disabled={!balance}
                  >
                    100%
                  </Button>
                </div>
                <Input
                  type="number"
                  placeholder="0.0"
                  step="0.01"
                  min="0"
                  value={customTipAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomTipAmount(e.target.value)
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCustomTip}
                  disabled={
                    !customTipAmount || isConfirming || isTransactionPending
                  }
                >
                  Send Tip
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
