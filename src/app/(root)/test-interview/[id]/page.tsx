import { Suspense } from "react";
import LoaderUI from "@/components/LoaderUI";
import TestInterviewPageClient from "./TestInterviewPageClient";

export const instant = false;

type TestInterviewPageProps = {
  params: Promise<{ id: string }>;
};

export default function TestInterviewPage({ params }: TestInterviewPageProps) {
  return (
    <Suspense fallback={<LoaderUI />}>
      <TestInterviewPageContent params={params} />
    </Suspense>
  );
}

async function TestInterviewPageContent({ params }: TestInterviewPageProps) {
  const { id } = await params;
  return <TestInterviewPageClient id={id} />;
}
