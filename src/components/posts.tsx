import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Heart, Repeat2, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useSendCalls, useWaitForCallsStatus } from "wagmi/experimental";
import { USDC_TOKEN_ADDRESS } from "../lib/constants";
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
  const {
    sendCalls,
    data: sendCallsId,
    reset: resetSendCalls,
    isPending: isSendCallsPending,
  } = useSendCalls();
  const { data: callsStatus, isLoading: isCallsStatusLoading } =
    useWaitForCallsStatus({
      id: sendCallsId,
    });
  const [toastId, setToastId] = useState<string | number | null>(null);

  const handleTip = useCallback(async () => {
    sendCalls({
      calls: [
        {
          to: USDC_TOKEN_ADDRESS,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [
              post.author.verified_addresses.eth_addresses[0],
              parseUnits("0.01", 6),
            ],
          }),
          value: "0x0",
        },
      ],
      capabilities: {
        paymasterService: {
          url: process.env.NEXT_PUBLIC_PAYMASTER_SERVICE_URL,
        },
      },
      account: account.address,
    });

    const toastId_ = toast("Sending tip...", {
      description: `Tipping @${post.author.username}`,
      duration: Infinity,
    });

    setToastId(toastId_);
  }, [post.author, sendCalls]);

  useEffect(() => {
    if (callsStatus?.status === "CONFIRMED" && toastId !== null) {
      toast.success("Tip sent successfully!", {
        description: `You tipped @${post.author.username}`,
        duration: 2000,
      });

      // Dismiss the original toast after the success toast is shown (dismissing immediately causes the success toast to not be shown)
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 0);

      setToastId(null);
      resetSendCalls();
      onTipSuccess();
    }
  }, [
    callsStatus,
    toastId,
    post.author,
    resetSendCalls,
    onTipSuccess,
    setToastId,
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
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          disabled={
            !account.address || isCallsStatusLoading || isSendCallsPending
          }
          onClick={handleTip}
        >
          <Send className="h-4 w-4" />
          <span>Tip a penny</span>
        </Button>
      </div>
    </div>
  );
}
