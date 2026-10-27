import { useEffect, useMemo, useState } from 'react';
import { X, Heart, Camera, Award, MapPin, Star } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { fetchPhotosByAuthor } from '@/lib/data';
import { formatLikes, basqueName, spotCountryLabel } from '@/lib/utils';
import { LANG_KEY } from '@/lib/types';
import { seasonIcon } from '@/lib/i18n';
import { Ikurrina } from './Ikurrina';
import type { Photo, Spot } from '@/lib/types';

export function PhotographerModal({ author, onClose }: { author: string; onClose: () => void }) {
  const { t, lang, setTab, setFocusedSpotId } = useApp();
  const [photos, setPhotos] = useState<(Photo & { spot?: Spot })[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'voted' | 'recent'>('voted');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try { if (alive) setPhotos(await fetchPhotosByAuthor(author)); }
      catch { if (alive) setPhotos([]); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [author]);

  const sorted = useMemo(() => {
    const arr = [...photos];
    if (sort === 'voted') arr.sort((a, b) => b.likes - a.likes);
    else arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return arr;
  }, [photos, sort]);

  const totalLikes = useMemo(() => photos.reduce((s, p) => s + p.likes, 0), [photos]);
  const totalPhotos = photos.length;

  // Derive trophy counts from global rankings (best-effort from current photos set)
  // For demo: count how many photos would podium in weekly/monthly (top 3 by likes)
  const weeklyWins = useMemo(() => {
    const sortedByLikes = [...photos].sort((a, b) => b.likes - a.likes);
    return sortedByLikes.slice(0, 2).filter((p) => p.likes > 50).length;
  }, [photos]);
  const monthlyWins = useMemo(() => {
    const sortedByLikes = [...photos].sort((a, b) => b.likes - a.likes);
    return sortedByLikes.slice(0, 1).filter((p) => p.likes > 100).length;
  }, [photos]);

  const avatarInitial = author.charAt(0).toUpperCase();
  const handle = author.toLowerCase().replace(/\s+/g, '_');

  const openInMap = (spotId: string) => {
    setFocusedSpotId(spotId);
    setTab('map');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[88vh] bg-white dark:bg-slate2-900 rounded-t-3xl sm:rounded-3xl shadow-lift overflow-hidden flex flex-col animate-slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 grid place-items-center w-9 h-9 rounded-full bg-white/80 dark:bg-slate2-800/80 backdrop-blur hover:scale-105 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-forest-600 to-forest-800 dark:from-slate2-800 dark:to-slate2-950 p-6 pt-8 text-white">
            <div className="flex items-center gap-4">
              <div className="grid place-items-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur text-3xl font-display font-700 shrink-0">
                {avatarInitial}
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-700 truncate">{author}</h2>
                <p className="text-white/70 text-sm">@{handle}</p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur">
                    <Camera className="w-3 h-3" /> {totalPhotos} {t('totalPhotos').toLowerCase()}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur">
                    <Heart className="w-3 h-3 fill-terracotta-400 text-terracotta-400" /> {formatLikes(totalLikes)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Palmarés */}
          <div className="px-6 py-4 border-b border-forest-100 dark:border-slate2-800">
            <h3 className="text-xs font-700 uppercase tracking-wider text-forest-700/60 dark:text-sand-300/60 mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> {t('palmares')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {weeklyWins > 0 && (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-600">
                  🥇 {weeklyWins}x {t('photoOfWeek')}
                </span>
              )}
              {monthlyWins > 0 && (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate2-800 text-slate-600 dark:text-sand-300 text-xs font-600">
                  🥈 {monthlyWins}x {t('photoOfMonth')}
                </span>
              )}
              {weeklyWins === 0 && monthlyWins === 0 && (
                <span className="text-xs text-forest-700/50 dark:text-sand-300/50">—</span>
              )}
            </div>
          </div>

          {/* Sort buttons */}
          <div className="px-6 pt-4 flex gap-1.5">
            <button
              onClick={() => setSort('voted')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-600 transition-all ${
                sort === 'voted' ? 'bg-forest-600 text-white shadow-soft' : 'bg-forest-50 dark:bg-slate2-800 text-forest-700/70 dark:text-sand-300/70'
              }`}
            >
              <Star className="w-3 h-3" /> {t('mostVoted')}
            </button>
            <button
              onClick={() => setSort('recent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-600 transition-all ${
                sort === 'recent' ? 'bg-forest-600 text-white shadow-soft' : 'bg-forest-50 dark:bg-slate2-800 text-forest-700/70 dark:text-sand-300/70'
              }`}
            >
              🕒 {t('mostRecent')}
            </button>
          </div>

          {/* Photo grid */}
          <div className="p-6 pt-3">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-forest-50 dark:bg-slate2-850 shimmer-bg animate-shimmer" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <p className="text-center py-10 text-sm text-forest-700/50 dark:text-sand-300/50">{t('noPhotographerPhotos')}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sorted.map((p) => {
                  const isEus = lang === 'EUS' && p.spot?.euskal_herria;
                  return (
                    <div key={p.id} className="group relative rounded-xl overflow-hidden bg-forest-50 dark:bg-slate2-850 shadow-soft cursor-pointer" onClick={() => p.spot && openInMap(p.spot.id)}>
                      <div className="aspect-square">
                        <img src={p.image_url} alt={p.spot?.name ?? 'Photo'} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90" />
                      <div className="absolute bottom-0 inset-x-0 p-2 text-white">
                        {p.spot && (
                          <div className="flex items-center gap-1 text-[11px] font-600 truncate">
                            <MapPin className="w-3 h-3 shrink-0 text-terracotta-300" />
                            <span className="truncate">{isEus && p.spot ? basqueName(p.spot.id, p.spot.name) : p.spot?.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] mt-0.5">
                          <Heart className="w-2.5 h-2.5 fill-terracotta-400 text-terracotta-400" />
                          {formatLikes(p.likes)}
                          <span className="ml-auto">{seasonIcon[p.season]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
