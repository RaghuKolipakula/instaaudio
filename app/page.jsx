import dynamic from 'next/dynamic';

const AudioProcessor = dynamic(() => import('../src/AudioProcessor').then(mod => mod.AudioProcessor), {
  ssr: false,
});

export default function Page() {
  return <AudioProcessor />;
}
