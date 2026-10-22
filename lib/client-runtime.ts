// One client for the original hosting and the standalone GitHub Pages build.
// The static build exposes only a public API URL, never a database secret.
function meta(name: string) {
  return typeof document === 'undefined' ? '' : document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content || '';
}

export function homeHref() { return meta('dna-base') || '/'; }
export function usesStaticRouting() { return meta('dna-routing') === 'hash'; }

export function redirectToCanonical() {
  const base = meta('dna-canonical-base');
  if (!base || typeof window === 'undefined') return false;
  try {
    const id = sharedResultId();
    // A browser already answering on the old origin may finish its existing
    // session there. It uses the same Supabase backend without another charge.
    if (!id) {
      const draft = JSON.parse(localStorage.getItem('design-dna-v2-session') || 'null');
      if (draft?.started && draft.expiresAt > Date.now()) return false;
    }
    const target = new URL(base);
    if (target.protocol !== 'https:' || target.origin === window.location.origin) return false;
    if (id) target.hash = `/result/${id}`;
    window.location.replace(target.toString());
    return true;
  } catch { return false; }
}

export function resultHref(id: string, legacy = false) {
  const route = `${legacy ? 'r' : 'result'}/${encodeURIComponent(id)}`;
  return `${homeHref()}${route}`;
}

export function resultUrl(id: string, legacy = false) {
  return new URL(resultHref(id, legacy), window.location.origin).toString();
}

export function sharedResultId() {
  return currentRoute().match(/^\/(?:result|r)\/([a-f0-9-]{36})\/?$/)?.[1] || '';
}

export function currentRoute() {
  const hash=window.location.hash.replace(/^#/,'');
  if(/^\/(?:result|r|play|admin)(?:\/|$)/.test(hash))return hash;
  const base=homeHref().replace(/\/$/,'');
  return window.location.pathname.startsWith(base+'/')?window.location.pathname.slice(base.length):window.location.pathname;
}
export function accessTokenFromLocation(){return currentRoute().match(/^\/play\/([^/]+)\/?$/)?.[1]||'';}
export function accessHref(token:string){return `${homeHref()}play/${encodeURIComponent(token)}`;}
export function isAdminRoute(){return /^\/admin\/?$/.test(currentRoute());}

export function requestApi(path: string, data?: unknown) {
  const base = meta('dna-api').replace(/\/$/, '') || '/api';
  const endpoint = `${base}${path.replace(/^\/api(?=\/|$)/, '')}`;
  return fetch(endpoint, {
    ...(data !== undefined ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)} : {}),
    cache: 'no-store',
  });
}
