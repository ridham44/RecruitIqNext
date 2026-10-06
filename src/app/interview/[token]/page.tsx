'use client';

import dynamic from 'next/dynamic';
import LoadingState from '@/client/components/ui/LoadingState';

// Uses browser-only speech/audio APIs (SpeechRecognition, LiveKit), so it's
// rendered in the browser only.
const InterviewLinkPage = dynamic(() => import('@/client/pages/careers/InterviewLinkPage'), {
  ssr: false,
  loading: () => <LoadingState />,
});

export default function Page() {
  return <InterviewLinkPage />;
}
