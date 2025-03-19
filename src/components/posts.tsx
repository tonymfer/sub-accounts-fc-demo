"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, Repeat2, Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useAccount,
  useClient,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatDate } from "../lib/utils";
import { useCallback } from "react";
import { toast } from "sonner";
import { USDC_TOKEN_ADDRESS } from "../lib/constants";
import { erc20Abi, formatUnits, parseUnits } from "viem";

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

// Add this fetch function outside the component
const fetchPosts = async (): Promise<PostsResponse> => {
  const response = await fetch("/api/posts");
  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }
  return response.json();
};

export default function Posts() {
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
      {data?.posts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const account = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const handleTip = useCallback(async () => {
    const hash = await writeContractAsync({
      address: USDC_TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "transfer",
      args: [
        post.author.verified_addresses.eth_addresses[0],
        parseUnits("0.01", 6),
      ],
    });

    const toastId = toast("Sending tip...", {
      description: `Tipping @${post.author.username}`,
    });

    await publicClient
      .waitForTransactionReceipt({
        hash,
        confirmations: 1,
      })
      .then(() => {
        toast.success("Tip sent successfully!", {
          id: toastId,
          description: `You tipped @${post.author.username}`,
        });
      });
  }, [post.author]);

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
          disabled={!account.address}
          onClick={handleTip}
        >
          <Send className="h-4 w-4" />
          <span>Tip a penny</span>
        </Button>
      </div>
    </div>
  );
}
