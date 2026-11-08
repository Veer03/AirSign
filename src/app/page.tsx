import { SiteNav } from "@/components/landing/site-nav";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PipelineDemo } from "@/components/landing/pipeline-demo";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Privacy } from "@/components/landing/privacy";
import { Honesty } from "@/components/landing/honesty";
import { FinalCta } from "@/components/landing/final-cta";
import { SiteFooter } from "@/components/landing/site-footer";

export default function Home() {
  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <SiteNav />
      <main id="main">
        <Hero />
        <Problem />
        <HowItWorks />
        <PipelineDemo />
        <FeatureGrid />
        <Privacy />
        <Honesty />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
