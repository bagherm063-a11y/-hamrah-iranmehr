import { useEffect, useMemo, useState } from 'react';
import { Award, ChevronDown, ClipboardList, Star, Users, X } from 'lucide-react';

type Content = Record<string, unknown> & { id: number; kind: string };
const fa = new Intl.NumberFormat('fa-IR');
const text = (item: Content | undefined, key: string, fallback = '') => typeof item?.[key] === 'string' ? String(item[key]) : fallback;
const number = (item: Content | undefined, key: string) => typeof item?.[key] === 'number' ? Number(item[key]) : 0;
const image = (item: Content) => text(item, 'image');

function Avatar({ item }: { item: Content }) {
  return image(item) ? <img src={image(item)} alt={text(item, 'name')} className="h-11 w-11 rounded-xl object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-100 text-rose-700"><Users className="h-5 w-5" /></div>;
}

export default function StaffAndSquad() {
  const [items, setItems] = useState<Content[]>([]);
  const [open, setOpen] = useState<'staff' | 'squad' | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/content').then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems(data.items || []);
    }).catch(() => setError('دریافت اطلاعات این بخش ممکن نشد.'));
  }, []);
  const staff = useMemo(() => items.filter(item => item.kind === 'staff'), [items]);
  const players = useMemo(() => items.filter(item => item.kind === 'player'), [items]);
  const matches = useMemo(() => items.filter(item => item.kind === 'match'), [items]);
  const currentMatch = matches.find(item => item.id === selectedMatch) || matches.find(item => ['live_first', 'half_time', 'live_second'].includes(text(item, 'status'))) || matches.find(item => text(item, 'status') === 'finished') || matches[0];
  const lineupIds = Array.isArray(currentMatch?.lineupIds) ? currentMatch.lineupIds.map(Number) : [];
  const substituteIds = Array.isArray(currentMatch?.substituteIds) ? currentMatch.substituteIds.map(Number) : [];
  const lineup = players.filter(player => lineupIds.includes(player.id));
  const substitutes = players.filter(player => substituteIds.includes(player.id));
  const ratings = (currentMatch?.playerRatings && typeof currentMatch.playerRatings === 'object' ? currentMatch.playerRatings : {}) as Record<string, number>;
  const mvpId = number(currentMatch, 'mvpId');
  const formation = text(currentMatch, 'formation', 'ترکیب هنوز اعلام نشده است');
  return <>
    <section className="border-t border-slate-200 bg-[#f6f7fb] px-4 py-7 pb-28 dark:border-white/10 dark:bg-[#111525] lg:pb-7"><div className="mx-auto w-full max-w-7xl"><div className="grid gap-3 sm:grid-cols-2"><button data-testid="open-staff" onClick={() => setOpen('staff')} className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-4 text-right shadow-sm ring-1 ring-slate-200 dark:bg-[#1a2034] dark:ring-white/10"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white"><Users className="h-5 w-5" /></span><span><b className="block text-sm">کادر فنی ایرانمهر</b><small className="text-slate-500">مربیان و اعضای تیم</small></span></button><button data-testid="open-squad" onClick={() => setOpen('squad')} className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-4 text-right shadow-sm ring-1 ring-slate-200 dark:bg-[#1a2034] dark:ring-white/10"><span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-700 text-white"><ClipboardList className="h-5 w-5" /></span><span><b className="block text-sm">اسکواد دیدار</b><small className="text-slate-500">چیدمان، نمره‌ها و بهترین بازیکن</small></span></button></div></div></section>
    {open && <div className="fixed inset-0 z-[96] bg-slate-950/60 p-0 backdrop-blur-sm sm:p-4" onClick={() => setOpen(null)}><section onClick={event => event.stopPropagation()} className="mx-auto h-[100dvh] w-full max-w-3xl overflow-y-auto bg-[#f6f7fb] p-4 dark:bg-[#111525] sm:h-[92dvh] sm:rounded-[28px]">
      <header className="sticky top-0 z-10 -mx-4 -mt-4 mb-5 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-white/10 dark:bg-[#1a2034]/95"><div className="flex items-center gap-2">{open === 'staff' ? <Users className="text-rose-700" /> : <ClipboardList className="text-rose-700" />}<b>{open === 'staff' ? 'کادر فنی ایرانمهر' : 'اسکواد و ارزیابی مسابقه'}</b></div><button data-testid="close-staff-squad" onClick={() => setOpen(null)} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button></header>
      {error ? <p className="rounded-2xl bg-rose-50 p-5 text-center text-sm font-bold text-rose-700">{error}</p> : open === 'staff' ? <StaffList staff={staff} /> : <Squad match={currentMatch} matches={matches} choose={setSelectedMatch} lineup={lineup} substitutes={substitutes} ratings={ratings} mvpId={mvpId} formation={formation} />}
    </section></div>}
  </>;
}
function StaffList({ staff }: { staff: Content[] }) {
  const groups = ['سرمربی', 'مربی', 'مربی دروازه‌بانان', 'بدنساز', 'سرپرست', 'کادر پزشکی', 'سایر اعضای کادر'];
  if (!staff.length) return <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-[#1a2034]"><Users className="mx-auto h-9 w-9 text-rose-700" /><b className="mt-3 block">کادر فنی هنوز معرفی نشده است</b><p className="mt-2 text-sm leading-7 text-slate-500">مدیر باشگاه می‌تواند اعضا را از بخش «کادر فنی» پنل مدیریت اضافه کند.</p></div>;
  return <div className="space-y-6">{groups.map(group => { const members = staff.filter(member => text(member, 'role').includes(group) || (group === 'مربی' && text(member, 'role') === 'مربی')); if (!members.length) return null; return <section key={group}><h2 className="mb-3 text-base font-black">{group}</h2><div className="grid gap-3 sm:grid-cols-2">{members.map(member => <article key={member.id} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-[#1a2034] dark:ring-white/10"><Avatar item={member}/><div className="min-w-0"><b className="block truncate">{text(member, 'name')}</b><span className="mt-1 block text-xs font-bold text-rose-700 dark:text-rose-300">{text(member, 'role')}</span><p className="mt-2 text-xs leading-6 text-slate-500">{text(member, 'bio')}</p></div></article>)}</div></section>; })}</div>;
}
function Squad({ match, matches, choose, lineup, substitutes, ratings, mvpId, formation }: { match?: Content; matches: Content[]; choose: (id: number) => void; lineup: Content[]; substitutes: Content[]; ratings: Record<string, number>; mvpId: number; formation: string }) {
  if (!match) return <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 dark:bg-[#1a2034]">مسابقه‌ای برای نمایش اسکواد وجود ندارد.</p>;
  const renderPlayer = (player: Content) => <article key={player.id} className={`flex items-center gap-3 rounded-xl p-2.5 ${player.id === mvpId ? 'bg-amber-100 ring-1 ring-amber-300 dark:bg-amber-400/15' : 'bg-white/10'}`}><Avatar item={player}/><div className="min-w-0 flex-1"><b className="block truncate text-sm">{text(player, 'name')}</b><small className="text-white/70">{fa.format(number(player, 'number'))} · {text(player, 'position')}</small></div>{typeof ratings[String(player.id)] === 'number' && <b className="rounded-lg bg-white px-2 py-1 text-sm text-slate-900">{ratings[String(player.id)].toFixed(1)}</b>}{player.id === mvpId && <Award className="h-5 w-5 text-amber-300" />}</article>;
  return <div className="space-y-5"><select data-testid="squad-match-select" value={match.id} onChange={event => choose(Number(event.target.value))} className="min-h-12 w-full rounded-xl bg-white px-3 text-sm shadow-sm dark:bg-[#1a2034]">{matches.map(item => <option key={item.id} value={item.id}>ایرانمهر مقابل {text(item, 'opponent')}</option>)}</select><section className="match-center-hero rounded-[26px] p-5 text-white"><p className="text-center text-sm text-white/70">چیدمان ترکیب ایرانمهر</p><h2 className="mt-1 text-center text-xl font-black">{formation}</h2><div className="mt-5 rounded-2xl border border-white/15 bg-emerald-900/55 p-3"><div className="grid grid-cols-2 gap-2">{lineup.length ? lineup.map(renderPlayer) : <p className="col-span-2 py-8 text-center text-sm text-white/70">ترکیب اصلی هنوز توسط باشگاه اعلام نشده است.</p>}</div></div></section>{mvpId > 0 && <section className="rounded-2xl bg-amber-50 p-4 text-amber-950"><div className="flex items-center gap-2"><Star className="h-5 w-5 fill-amber-500 text-amber-500"/><b>بهترین بازیکن دیدار</b></div><p className="mt-2 text-sm">{text(lineup.find(player => player.id === mvpId) || match, 'mvpName', 'بازیکن برتر پس از پایان دیدار اعلام شد.')}</p></section>}<section><h2 className="mb-3 font-black">نیمکت و بازیکنان ذخیره</h2>{substitutes.length ? <div className="grid gap-2 sm:grid-cols-2">{substitutes.map(player => <div key={player.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-[#1a2034]"><Avatar item={player}/><span className="text-sm font-bold">{text(player, 'name')}</span></div>)}</div> : <p className="rounded-xl bg-white p-4 text-sm text-slate-500 dark:bg-[#1a2034]">فهرست ذخیره‌ها هنوز اعلام نشده است.</p>}</section>{Object.keys(ratings).length > 0 && <p className="flex items-center gap-2 text-xs text-slate-500"><ChevronDown className="h-4 w-4"/>نمره‌ها توسط کادر فنی پس از مسابقه ثبت می‌شوند.</p>}</div>;
}
