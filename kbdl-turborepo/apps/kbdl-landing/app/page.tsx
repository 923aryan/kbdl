import HeroSection from "../components/ui/hero";
import TimelineSection from "../components/ui/timeline";
// import { Button } from '@repo/ui'; // You can use your UI button, but custom styled below to match exactly

export default function Home() {
  return (
    <div className="h-full w-full">
      <HeroSection />
      <TimelineSection />
    </div>
  );
}