import {
  LandingNavbar,
  LandingHero,
  LandingLogoCloud,
  LandingFeatures,
  LandingHowItWorks,
  LandingPricing,
  LandingTestimonials,
  LandingFaq,
  LandingCta,
  LandingFooter,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingNavbar />
      <LandingHero />
      <LandingLogoCloud />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingTestimonials />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </main>
  );
}
