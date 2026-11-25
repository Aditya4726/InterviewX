import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Show } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import StreamClientProvider from "@/components/providers/StreamClientProvider";

export const instant = false;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Show when="signed-in">
        <StreamClientProvider>{children}</StreamClientProvider>
      </Show>

      <Show when="signed-out">{children}</Show>
      <Toaster />
    </>
  );
}