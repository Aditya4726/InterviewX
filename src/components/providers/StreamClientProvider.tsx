"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import { streamTokenProvider } from "@/actions/stream.actions";

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [streamVideoClient, setStreamVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const userName = user?.fullName || user?.username || userId || "";
  const userImage = user?.imageUrl;
  const profileRef = useRef({ userName, userImage });

  useEffect(() => {
    profileRef.current = { userName, userImage };
  }, [userName, userImage]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    const profile = profileRef.current;

    const client = new StreamVideoClient({
      apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      user: {
        id: userId,
        name: profile.userName,
        image: profile.userImage,
      },
      tokenProvider: streamTokenProvider,
    });

    setStreamVideoClient(client);
    return () => {
      setStreamVideoClient((currentClient) =>
        currentClient === client ? undefined : currentClient
      );
      void client.disconnectUser().catch((error: unknown) => {
        console.error("Unable to disconnect the Stream client:", error);
      });
    };
  }, [isLoaded, userId]);

  // Keep the route tree rendered while the browser-only Stream client is
  // initializing. Hiding children here prevents Next.js from rendering the
  // page segment during instant-navigation validation (and on initial load).
  if (!streamVideoClient) return <>{children}</>;

  return <StreamVideo client={streamVideoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
