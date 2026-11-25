import { useCallback, useEffect, useState } from "react";
import {
  Call,
  StreamVideoClient,
  useStreamVideoClient,
} from "@stream-io/video-react-sdk";

type CallLookupResult = {
  client: StreamVideoClient;
  id: string;
  retryKey: number;
  call?: Call;
  error?: string;
  notFound?: boolean;
};

const useGetCallById = (id: string) => {
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState<CallLookupResult>();

  const client = useStreamVideoClient();

  const retry = useCallback(() => {
    setRetryKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!client) return;

    let active = true;
    const getCall = async () => {
      try {
        const { calls } = await client.queryCalls({ filter_conditions: { id } });

        if (!active) return;
        if (calls.length > 0) {
          setResult({ client, id, retryKey, call: calls[0] });
        } else {
          setResult({
            client,
            id,
            retryKey,
            error: "Meeting room not found. Check the room link and try again.",
            notFound: true,
          });
        }
      } catch (error) {
        if (!active) return;
        console.error("Unable to load the Stream call:", error);
        setResult({
          client,
          id,
          retryKey,
          error: "Unable to connect to this room. Check your connection and retry.",
          notFound: false,
        });
      }
    };

    void getCall();
    return () => {
      active = false;
    };
  }, [client, id, retryKey]);

  const currentResult =
    client &&
    result?.client === client &&
    result.id === id &&
    result.retryKey === retryKey
      ? result
      : undefined;

  return {
    call: currentResult?.call,
    isCallLoading: !client || !currentResult,
    lookupError: currentResult?.error,
    isRoomNotFound: currentResult?.notFound ?? false,
    retry,
  };
};

export default useGetCallById;