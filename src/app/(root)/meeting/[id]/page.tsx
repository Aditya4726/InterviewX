import { Suspense } from "react";
import LoaderUI from "@/components/LoaderUI";
import MeetingPageClient from "./MeetingPageClient";

export const instant = false;

type MeetingPageProps = {
  params: Promise<{ id: string }>;
};

export default function MeetingPage({ params }: MeetingPageProps) {
  return (
    <Suspense fallback={<LoaderUI />}>
      <MeetingPageContent params={params} />
    </Suspense>
  );
}

async function MeetingPageContent({ params }: MeetingPageProps) {
  const { id } = await params;

  return <MeetingPageClient id={id} />;
}
