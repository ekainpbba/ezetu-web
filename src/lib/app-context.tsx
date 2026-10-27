import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LangCode, ViewTab } from './types';
import { makeT } from './i18n';

type ThemeMode = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';

interface AppCtx {
  mapLayer: 'all' | 'visited' | 'saved';
  setMapLayer: (v: 'all' | 'visited' | 'saved') => void;
  photographerOpen: string | null;
  setPhotographerOpen: (name: string | null) => void;
  theme: ResolvedTheme;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  toggleTheme: () => void;
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (k: string) => string;
  tab: ViewTab;
  setTab: (v: ViewTab) => void;
  uploadOpen: boolean;
  setUploadOpen: (v: boolean) => void;
  addPlaceOpen: boolean;
  setAddPlaceOpen: (v: boolean) => void;
  contributeOpen: boolean;
  setContributeOpen: (v: boolean) => void;
  prefilledComarca: string | null;
  setPrefilledComarca: (v: string | null) => void;
  wishlistOpen: boolean;
  setWishlistOpen: (v: boolean) => void;
  focusedSpotId: string | null;
  setFocusedSpotId: (id: string | null) => void;
  spotsRefreshKey: number;
  bumpSpotsRefresh: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

const LANG_KEY = 'ezetu.lang';
const THEME_KEY = 'ezetu.theme';

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'auto') return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return mode;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    return saved ?? 'auto';
  });
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(localStorage.getItem(THEME_KEY) as ThemeMode | null ?? 'auto'));
  const [lang, setLangState] = useState<LangCode>(() => (localStorage.getItem(LANG_KEY) as LangCode) ?? 'ES');
  const [tab, setTab] = useState<ViewTab>('gallery');
  const [mapLayer, setMapLayer] = useState<'all' | 'visited' | 'saved'>('all');
  const [photographerOpen, setPhotographerOpen] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [prefilledComarca, setPrefilledComarca] = useState<string | null>(null);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [focusedSpotId, setFocusedSpotId] = useState<string | null>(null);
  const [spotsRefreshKey, setSpotsRefreshKey] = useState(0);
  const bumpSpotsRefresh = useCallback(() => setSpotsRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  // Track OS preference changes when in auto mode
  useEffect(() => {
    if (themeMode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    setTheme(mq.matches ? 'dark' : 'light');
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  const setThemeMode = useCallback((m: ThemeMode) => {
    setThemeModeState(m);
    localStorage.setItem(THEME_KEY, m);
    setTheme(resolveTheme(m));
  }, []);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
    document.documentElement.lang = l.toLowerCase();
  }, []);

  useEffect(() => { document.documentElement.lang = lang.toLowerCase(); }, [lang]);

  const t = useMemo(() => makeT(lang), [lang]);
  const toggleTheme = useCallback(() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark'), [themeMode, setThemeMode]);

  const value: AppCtx = {
    mapLayer, setMapLayer,
    photographerOpen, setPhotographerOpen,
    theme, themeMode, setThemeMode, toggleTheme, lang, setLang, t,
    tab, setTab, uploadOpen, setUploadOpen, addPlaceOpen, setAddPlaceOpen, contributeOpen, setContributeOpen, prefilledComarca, setPrefilledComarca, wishlistOpen, setWishlistOpen,
    focusedSpotId, setFocusedSpotId, spotsRefreshKey, bumpSpotsRefresh,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used within AppProvider');
  return c;
}
