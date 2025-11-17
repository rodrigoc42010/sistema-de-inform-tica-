export function initAnalytics(measurementId) {
  try {
    if (!measurementId || typeof document === 'undefined') return;
    if (window.__gaLoaded) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId, { anonymize_ip: true });
    window.__gaLoaded = true;
  } catch {}
}