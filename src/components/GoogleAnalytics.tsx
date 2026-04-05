import Script from "next/script";

const GA_MAP: Record<string, string> = JSON.parse(
  process.env.NEXT_PUBLIC_GA_MAP ?? process.env.GA_MAP ?? "{}"
);

interface GoogleAnalyticsProps {
  username?: string;
}

export default function GoogleAnalytics({ username }: GoogleAnalyticsProps) {
  // Only use GA if user has a specific tag in GA_MAP
  const gaId = username ? GA_MAP[username] : null;

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
