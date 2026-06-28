export const THEME_PRESETS = ["dark", "light", "midnight", "sepia", "matrix"] as const;
export type ThemeKey = (typeof THEME_PRESETS)[number];

export type PageOverrideKey = "home" | "writing" | "projects" | "about" | "posts";

export interface PageOverride {
  theme?: ThemeKey | null;
  accent?: string | null;
}

export const PAGE_OVERRIDE_DEFS: Array<{
  key: PageOverrideKey;
  page: string;
  url: string;
  defaultOverride?: PageOverride;
}> = [
  { key: "home", page: "Home", url: "genuine.dev/" },
  { key: "writing", page: "Articles", url: "genuine.dev/blog" },
  {
    key: "projects",
    page: "Projects",
    url: "genuine.dev/projects",
    defaultOverride: { theme: "midnight", accent: "#7c8cff" },
  },
  { key: "about", page: "About", url: "genuine.dev/about" },
  {
    key: "posts",
    page: "Post pages",
    url: "genuine.dev/blog/*",
    defaultOverride: { accent: "per-topic" },
  },
];

export const STORAGE = {
  theme: "theme",
  accent: "accent",
  pageOverrides: "pageThemeOverrides",
} as const;

const THEME_LABELS: Record<ThemeKey, string> = {
  dark: "Dark",
  light: "Light",
  midnight: "Midnight",
  sepia: "Sepia",
  matrix: "Matrix",
};

export function themeLabel(key: ThemeKey): string {
  return THEME_LABELS[key];
}

export function isThemeKey(value: string): value is ThemeKey {
  return (THEME_PRESETS as readonly string[]).includes(value);
}

export function matchPageKey(pathname: string): PageOverrideKey | null {
  if (pathname === "/") return "home";
  if (pathname === "/blog") return "writing";
  if (pathname.startsWith("/blog/")) return "posts";
  if (pathname === "/projects") return "projects";
  if (pathname === "/about" || pathname === "/now" || pathname === "/uses") return "about";
  return null;
}

function readStoredOverrides(): Partial<Record<PageOverrideKey, PageOverride | null>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE.pageOverrides);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<PageOverrideKey, PageOverride | null>>;
  } catch {
    return {};
  }
}

/** Merged view for the admin UI — stored values win; unset keys fall back to code defaults. */
export function readPageOverrides(): Partial<Record<PageOverrideKey, PageOverride>> {
  const stored = readStoredOverrides();
  const out: Partial<Record<PageOverrideKey, PageOverride>> = {};
  for (const def of PAGE_OVERRIDE_DEFS) {
    if (def.key in stored) {
      const val = stored[def.key];
      if (val) out[def.key] = val;
    } else if (def.defaultOverride) {
      out[def.key] = def.defaultOverride;
    }
  }
  return out;
}

export function writePageOverrides(overrides: Partial<Record<PageOverrideKey, PageOverride | null>>) {
  localStorage.setItem(STORAGE.pageOverrides, JSON.stringify(overrides));
}

export function effectiveOverride(key: PageOverrideKey): PageOverride | undefined {
  const stored = readStoredOverrides();
  if (key in stored) {
    const val = stored[key];
    return val ?? undefined;
  }
  return PAGE_OVERRIDE_DEFS.find((d) => d.key === key)?.defaultOverride;
}

export function resolveThemeForPath(pathname: string): {
  theme: ThemeKey;
  accent: string | null;
  perTopic: boolean;
} {
  const siteTheme = (typeof window !== "undefined"
    ? localStorage.getItem(STORAGE.theme)
    : null) as ThemeKey | null;
  const siteAccent = typeof window !== "undefined" ? localStorage.getItem(STORAGE.accent) : null;
  const fallbackTheme: ThemeKey =
    siteTheme && isThemeKey(siteTheme)
      ? siteTheme
      : typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";

  const pageKey = matchPageKey(pathname);
  if (!pageKey) {
    return { theme: fallbackTheme, accent: siteAccent, perTopic: false };
  }

  const override = effectiveOverride(pageKey);
  const theme = override?.theme ?? fallbackTheme;
  const perTopic = override?.accent === "per-topic";
  const accent = perTopic ? null : (override?.accent ?? siteAccent);

  return { theme, accent, perTopic };
}

declare global {
  interface Window {
    __a?: (hex: string, alpha: number) => string;
    __setTheme?: (theme: string) => void;
    __setAccent?: (hex: string) => void;
    __resetAccent?: () => void;
    __applyRouteTheme?: (pathname?: string) => void;
  }
}

export function applyThemeForPath(pathname: string) {
  if (typeof window === "undefined") return;
  if (pathname.startsWith("/admin")) return;

  const { theme, accent, perTopic } = resolveThemeForPath(pathname);
  window.__setTheme?.(theme);

  if (perTopic) {
    window.__resetAccent?.();
  } else if (accent) {
    window.__setAccent?.(accent);
  } else {
    window.__resetAccent?.();
  }

  if (!perTopic || matchPageKey(pathname) !== "posts") {
    document.documentElement.removeAttribute("data-topic");
  }
}

export function applyPostTopic(topic: string) {
  if (typeof window === "undefined") return;
  const pageKey = matchPageKey(window.location.pathname);
  if (pageKey !== "posts") return;

  const override = effectiveOverride("posts");
  const perTopic = !override?.accent || override.accent === "per-topic";
  if (!perTopic) return;

  const normalized = topic.toLowerCase();
  if (normalized) {
    document.documentElement.setAttribute("data-topic", normalized);
  } else {
    document.documentElement.removeAttribute("data-topic");
  }
}

export function clearPostTopic() {
  document.documentElement.removeAttribute("data-topic");
}

/** Inline boot script — keeps theme/accent/page overrides in sync before first paint. */
export function themeBootScript(): string {
  return `(function(){
function __a(h,a){var n=parseInt(h.slice(1),16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'}
function __setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('theme',t)}catch(e){}}
function __setAccent(h){var d=document.documentElement;d.style.setProperty('--acc',h);d.style.setProperty('--acc-bg',__a(h,0.08));d.style.setProperty('--acc-border',__a(h,0.25));try{localStorage.setItem('accent',h)}catch(e){}}
function __resetAccent(){var d=document.documentElement;d.style.removeProperty('--acc');d.style.removeProperty('--acc-bg');d.style.removeProperty('--acc-border');try{localStorage.removeItem('accent')}catch(e){}}
function __matchPageKey(p){
  if(p==='/'||p==='')return 'home';
  if(p==='/blog')return 'writing';
  if(p.indexOf('/blog/')===0)return 'posts';
  if(p==='/projects')return 'projects';
  if(p==='/about'||p==='/now'||p==='/uses')return 'about';
  return null;
}
function __readOverrides(){
  try{
    var raw=localStorage.getItem('pageThemeOverrides');
    if(!raw){
      return {projects:{theme:'midnight',accent:'#7c8cff'},posts:{accent:'per-topic'}};
    }
    var stored=JSON.parse(raw);
    var defs={projects:{theme:'midnight',accent:'#7c8cff'},posts:{accent:'per-topic'}};
    var out={};
    for(var k in defs){if(defs.hasOwnProperty(k))out[k]=defs[k];}
    for(var k2 in stored){
      if(!stored.hasOwnProperty(k2))continue;
      if(stored[k2]===null){delete out[k2];}else{out[k2]=stored[k2];}
    }
    return out;
  }catch(e){return {projects:{theme:'midnight',accent:'#7c8cff'},posts:{accent:'per-topic'}};}
}
function __applyRouteTheme(path){
  if(path.indexOf('/admin')===0)return;
  var siteTheme=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
  var siteAccent=localStorage.getItem('accent');
  var key=__matchPageKey(path);
  var ov=key?__readOverrides()[key]:null;
  var theme=(ov&&ov.theme)?ov.theme:siteTheme;
  document.documentElement.setAttribute('data-theme',theme);
  document.documentElement.removeAttribute('data-topic');
  if(ov&&ov.accent==='per-topic'){
    __resetAccent();
  }else if(ov&&ov.accent){
    __setAccent(ov.accent);
  }else if(siteAccent){
    __setAccent(siteAccent);
  }else{
    __resetAccent();
  }
}
window.__a=__a;window.__setTheme=__setTheme;window.__setAccent=__setAccent;window.__resetAccent=__resetAccent;window.__applyRouteTheme=__applyRouteTheme;
try{__applyRouteTheme(location.pathname);}catch(e){}
})();`;
}
