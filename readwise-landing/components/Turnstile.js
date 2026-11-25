"use client";
import { useEffect, useRef } from "react";

// Cloudflare Turnstile check (free). Renders only when a site key is configured.
export default function Turnstile({ siteKey, onToken }) {
    const ref = useRef(null);
    const widgetId = useRef(null);

    useEffect(() => {
        if (!siteKey) return;
        const render = () => {
            if (!ref.current || widgetId.current !== null || !window.turnstile) return;
            widgetId.current = window.turnstile.render(ref.current, {
                sitekey: siteKey,
                callback: (token) => onToken(token),
                "expired-callback": () => onToken(null),
                "error-callback": () => onToken(null),
            });
        };
        if (window.turnstile) {
            render();
        } else {
            let script = document.querySelector("script[data-turnstile]");
            if (!script) {
                script = document.createElement("script");
                script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
                script.async = true;
                script.defer = true;
                script.dataset.turnstile = "1";
                document.head.appendChild(script);
            }
            script.addEventListener("load", render);
        }
        return () => {
            if (window.turnstile && widgetId.current !== null) {
                try { window.turnstile.remove(widgetId.current); } catch (e) {}
                widgetId.current = null;
            }
        };
    }, [siteKey]);

    if (!siteKey) return null;
    return <div ref={ref} className="flex justify-center" />;
}
