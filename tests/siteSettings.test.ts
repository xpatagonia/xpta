import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SITE_SETTINGS,
  parseHeroVideoSource,
  getCachedSiteSettings,
  publishSessionSiteSettings,
  fetchSiteSettings,
  persistSiteSettings,
} from '../src/lib/siteSettings.ts';
import { sanitizeApiBaseUrl } from '../src/lib/apiConfig.ts';

const originalWindow = (globalThis as any).window;
const originalLocalStorage = (globalThis as any).localStorage;
const originalFetch = globalThis.fetch;

afterEach(() => {
  (globalThis as any).window = originalWindow;
  (globalThis as any).localStorage = originalLocalStorage;
  globalThis.fetch = originalFetch;
});

test('parseHeroVideoSource resolves Cloudflare Stream customer URLs (watch, iframe, HLS manifest)', () => {
  const id = '5d5bc37ffcf54c9b82e996823bffbb81';

  const watchRes = parseHeroVideoSource(`https://customer-abc123def.cloudflarestream.com/${id}/watch`);
  assert.deepEqual(watchRes, {
    kind: 'cloudflare_stream',
    embedUrl: `https://customer-abc123def.cloudflarestream.com/${id}/iframe?autoplay=true&muted=true&loop=true&controls=false&preload=true`,
  });

  const iframeRes = parseHeroVideoSource(`https://customer-abc123def.cloudflarestream.com/${id}/iframe`);
  assert.equal(iframeRes?.kind, 'cloudflare_stream');

  const hlsRes = parseHeroVideoSource(
    `https://customer-abc123def.cloudflarestream.com/${id}/manifest/video.m3u8`
  );
  assert.deepEqual(hlsRes, {
    kind: 'cloudflare_stream',
    embedUrl: `https://customer-abc123def.cloudflarestream.com/${id}/iframe?autoplay=true&muted=true&loop=true&controls=false&preload=true`,
  });
});

test('parseHeroVideoSource resolves generic Cloudflare Stream & videodelivery URLs', () => {
  const id = '9f1e2d3c4b5a69788796a5b4c3d2e1f0';
  const res = parseHeroVideoSource(`https://watch.cloudflarestream.com/${id}`);
  assert.deepEqual(res, {
    kind: 'cloudflare_stream',
    embedUrl: `https://iframe.videodelivery.net/${id}?autoplay=true&muted=true&loop=true&controls=false&preload=true`,
  });

  const vdRes = parseHeroVideoSource(`https://videodelivery.net/${id}`);
  assert.equal(vdRes?.kind, 'cloudflare_stream');
});

test('parseHeroVideoSource treats Cloudflare Stream /downloads/*.mp4 and Cloudflare R2 URLs as direct HTML5 video', () => {
  const r2Url = 'https://media.xpatagonia.online/hero/patagonia-wind.mp4';
  assert.deepEqual(parseHeroVideoSource(r2Url), { kind: 'direct', src: r2Url });

  const cfDownloadUrl =
    'https://customer-abc123def.cloudflarestream.com/5d5bc37ffcf54c9b82e996823bffbb81/downloads/default.mp4';
  assert.deepEqual(parseHeroVideoSource(cfDownloadUrl), { kind: 'direct', src: cfDownloadUrl });
});

test('parseHeroVideoSource resolves YouTube watch, short, and youtu.be URLs', () => {
  const res = parseHeroVideoSource('https://youtu.be/dQw4w9WgXcQ');
  assert.deepEqual(res, {
    kind: 'youtube',
    embedUrl:
      'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1',
  });

  assert.equal(parseHeroVideoSource('   '), null);
});

test('getCachedSiteSettings purges legacy localStorage key instead of reading local overrides', () => {
  const removedKeys: string[] = [];
  (globalThis as any).window = { dispatchEvent: () => true };
  (globalThis as any).localStorage = {
    getItem: () => '{"hero":{"videoUrl":"https://stale-local-only.example/video.mp4"}}',
    removeItem: (key: string) => {
      removedKeys.push(key);
    },
  };

  const settings = getCachedSiteSettings();
  assert.ok(removedKeys.includes('xpatagonia_site_settings_v1'));
  assert.notEqual(settings.hero.videoUrl, 'https://stale-local-only.example/video.mp4');
});

test('persistSiteSettings refuses unauthenticated writes and never fakes local success on server errors', async () => {
  const noAuthResult = await persistSiteSettings(DEFAULT_SITE_SETTINGS, null);
  assert.equal(noAuthResult.savedRemote, false);
  assert.match(noAuthResult.error || '', /administrador/i);

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ success: false, error: 'Database write failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

  const failedResult = await persistSiteSettings(
    {
      ...DEFAULT_SITE_SETTINGS,
      hero: {
        ...DEFAULT_SITE_SETTINGS.hero,
        backgroundType: 'video',
        videoUrl: 'https://media.xpatagonia.online/hero.mp4',
      },
    },
    'valid-jwt-token'
  );

  assert.equal(failedResult.savedRemote, false);
  assert.equal(failedResult.error, 'Database write failed');
});

test('fetchSiteSettings fetches authoritative remote config with cache: no-store and updates session settings', async () => {
  let capturedInit: RequestInit | undefined;
  let capturedUrl = '';

  const remoteHeroUrl = 'https://media.xpatagonia.online/production-hero.mp4';
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(
      JSON.stringify({
        source: 'postgres',
        settings: {
          ...DEFAULT_SITE_SETTINGS,
          hero: {
            ...DEFAULT_SITE_SETTINGS.hero,
            backgroundType: 'video',
            videoUrl: remoteHeroUrl,
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const fetched = await fetchSiteSettings();
  assert.match(capturedUrl, /\/api\/site-settings\?_t=\d+/);
  assert.equal(capturedInit?.cache, 'no-store');
  assert.equal(fetched.hero.backgroundType, 'video');
  assert.equal(fetched.hero.videoUrl, remoteHeroUrl);

  // Restore default in session memory for isolation
  publishSessionSiteSettings(DEFAULT_SITE_SETTINGS);
});

test('sanitizeApiBaseUrl rejects legacy onrender.com URLs and localhost on HTTPS production', () => {
  assert.equal(sanitizeApiBaseUrl('https://xpatagoniaonline.onrender.com/'), '');
  assert.equal(sanitizeApiBaseUrl('https://api.xpatagonia.online/'), 'https://api.xpatagonia.online');
  (globalThis as any).window = { location: { protocol: 'https:' } };
  assert.equal(sanitizeApiBaseUrl('http://localhost:3000'), '');
});
