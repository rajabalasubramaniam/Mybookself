"use client";
import { Suspense } from 'react';
import Script from "next/script";
import { useSearchParams } from "next/navigation";

// Inner component that uses the hook
function AnalyticsTracker() {
  const searchParams = useSearchParams();
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    // Track page view with search params
    const url = window.location.pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }, [searchParams]);

  return null;
}

// Main component with Suspense
export default function GoogleAnalytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false
          });
        `}
      </Script>
    </Suspense>
  );
}