/**
 * Triggers pre-warming of critical kiosk assets to ensure they are in the PWA cache.
 * This includes fonts and Material Symbols which are essential for the dashboard.
 */
export const prewarmKioskAssets = async () => {
    // Only pre-warm in browser environment
    if (typeof window === 'undefined') return;

    const assets = [
        'https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;700;800;900&family=Heebo:wght@300;400;500;700;800;900&display=swap',
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block'
    ];

    try {
        // Fetching these will trigger the Service Worker (via Workbox in vite.config.ts) 
        // to cache them according to the runtimeCaching rules.
        await Promise.allSettled(
            assets.map(url => 
                fetch(url, { mode: 'no-cors' })
                    .catch(() => { /* ignore failures in pre-warm */ })
            )
        );
    } catch (error) {
        // Fail silently as pre-warm is an optimization
    }
};
