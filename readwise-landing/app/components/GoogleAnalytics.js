"use client";
import { Suspense } from 'react';
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
    const pathname = usePathname();
    
	function AnalyticsTracker() {
		const searchParams = useSearchParams();

    useEffect(() => {
        if (!GA_MEASUREMENT_ID || !pathname) return;

        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
        
        // Track page view
        window.gtag?.("config", GA_MEASUREMENT_ID, {
            page_path: url,
        });
    }, [pathname, searchParams]);

    if (!GA_MEASUREMENT_ID) return null;
	}
	
	export default function GoogleAnalytics() {
    return (
        <>
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
        </>
		<Suspense fallback={null}>
      <AnalyticsTracker />
		</Suspense>
    );
}