import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ChevronLeft, Save, ShieldCheck, Star, Users } from 'lucide-react';

type Content = Record<string, unknown> & { id: number; kind: string };
const text = (item: Content, key: string) => typeof item[key] === 'string' ? String(item[key]) : '';
const fa = new Intl.NumberFormat('fa-IR');

export default function AdminSquadPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('iranmehr-admin-token') || '');
  const [items, setItems] = useState<Content[]>([]);
  const [matchId, setMatchId] = useState(0);
  const [lineup, setLineup] = useState<number[]>([]);
  const [substitutes, setSubstitutes] = useState<number[]>([]);
  const [formation, setFormation] = useState('4-3-3');
  const [mvpId, setMvpId] = useState(0);
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const load = async () => {
    const response = await fetch('/api/admin/content', { headers: { 'x-admin-token': token } });
    if (response.status === 401) { localStorage.removeItem('iranmehr-admin-token'); setToken(''); return; }
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || 'دریافت اطلاعات ممکن نشد.'); return; }
    setItems(data.items || []);
  };
  useEffect(() => { if (token) void load(); }, [token]);
  const matches = useMemo(() => items.filter(item => item.kind === 'match'), [items]);
  const players = useMemo(() => items.filter(item => item.kind === 'player'), [items]);
  const current = matches.find(item => item.id === matchId) || matches[0];
  useEffect(() => {
    if (!current) return;
    setMatchId(current.id);
    setLineup(Array.isArray(current.lineupIds) ? current.lineupIds.map(Number) : []);
    setSubstitutes(Array.isArray(current.substituteIds) ? current.substituteIds.map(Number) : []);
    setFormation(text(current, 'formation') || '4-3-3');
    setMvpId(Number(current.mvpId) || 0);
    const saved = current.playerRatings && typeof current.playerRatings === 'object' ? current.playerRatings as Record<string, number> : {};
    setRatings(Object.fromEntries(Object.entries(saved).map(([id, rating]) => [id, String(rating)])));
  }, [current?.id]);
  const login = async (event: FormEvent) => { event.preventDefault(); const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }); const data = await response.json(); if (!response.ok) { setMessage(data.error || 'ورود انجام نشد.'); return; } localStorage.setItem('iranmehr-admin-token', data.token); setToken(data.token); };
  const selectPlayer = (id: number, type: 'lineup' | 'sub') => {
    const source = type === 'lineup' ? lineup : substitutes; const other = type === 'lineup' ? substitutes : lineup;
    if (source.includes(id)) { type === 'lineup' ? setLineup(source.filter(value => value !== id)) : setSubstitutes(source.filter(value => value !== id)); return; }
    if (other.includes(id)) { setMessage('هر بازیکن فقط در یکی از دو فهرست قرار می‌گیرد.'); return; }
    if (type === 'lineup' && source.length >= 11) { setMessage('ترکیب اصلی فقط می‌تواند ۱۱ بازیکن داشته باشد.'); return; }
    type === 'lineup' ? setLineup([...source, id]) : setSubstitutes([...source, id]);
  };
  const save = async (event: FormEvent) => { event.preventDefault(); if (!current) return; const values: Record<string, unknown> = { ...current, lineupIds: lineup, substituteIds: substitutes, formation, mvpId: mvpId || null, playerRatings: Object.fromEntries(Object.entries(ratings).filter(([, rating]) => rating !== '').map(([id, rating]) => [id, Math.min(10, Math.max(0, Number(rating)))])) }; delete values.id; delete values.kind; delete values.createdAt; delete values.updatedAt; const response = await fetch('/api/admin/content/' + current.id, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ data: values }) }); const data = await response.json(); if (!response.ok) { setMessage(data.error || 'ذخیره انجام نشد.'); return; } setMessage('چیدمان، نمره‌ها و بهترین بازیکن دیدار ذخیره شد.'); await load(); };
  if (!token) return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4"><form onSubmit={login} className="w-full max-w-sm rounded-[28px] bg-white p-6 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-rose-700"/><h1 className="mt-3 text-xl font-black">ورود مدیر</h1><input data-testid="squad-admin-password" type="password" dir="ltr" value={password} onChange={event => setPassword(event.target.value)} className="mt-5 min-h-12 w-full rounded-xl bg-slate-100 px-3" placeholder="رمز عبور"/><button className="mt-3 min-h-12 w-full rounded-xl bg-rose-700 font-black text-white">ورود</button>{message && <p className="mt-3 text-sm text-rose-700">{message}</p>}</form></main>;
  return <main className="min-h-screen bg-[#f6f7fb] pb-10 text-slate-800"><header className="border-b bg-white"><div className="mx-auto flex min-h-[72px] max-w-5xl items-center justify-between px-4"><a href="#/admin" className="flex items-center gap-1 text-sm font-bold"><ChevronLeft className="h-5 w-5"/>بازگشت به مدیریت</a><b>مدیریت اسکواد مسابقه</b></div></header><form onSubmit={save} className="mx-auto w-full max-w-5xl px-4 py-6"><section className="rounded-[26px] bg-slate-950 p-5 text-white"><p className="text-sm text-amber-300">مرکز کنترل ترکیب و ارزیابی</p><h1 className="mt-1 text-2xl font-black">اسکواد ایرانمهر</h1><select data-testid="admin-squad-match" value={current?.id || ''} onChange={event => setMatchId(Number(event.target.value))} className="mt-5 min-h-12 w-full rounded-xl bg-white px-3 text-sm text-slate-900">{matches.map(match => <option key={match.id} value={match.id}>ایرانمهر مقابل {text(match, 'opponent')}</option>)}</select></section>{!current ? <p className="mt-5 rounded-2xl bg-white p-8 text-center">ابتدا یک مسابقه در پنل مدیریت ثبت کنید.</p> : <><section className="mt-5 rounded-2xl bg-white p-5 shadow-sm"><label className="text-sm font-bold">آرایش تیم</label><input data-testid="formation-input" value={formation} onChange={event => setFormation(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl bg-slate-100 px-3" placeholder="برای نمونه: 4-3-3"/><p className="mt-2 text-xs text-slate-500">ترکیب اصلی: {fa.format(lineup.length)} از ۱۱ بازیکن</p></section><section className="mt-5 grid gap-5 lg:grid-cols-2"><PlayerPicker title="ترکیب اصلی" players={players} active={lineup} onClick={id => selectPlayer(id, 'lineup')} ratings={ratings} setRating={setRatings} mvpId={mvpId} setMvpId={setMvpId}/><PlayerPicker title="بازیکنان ذخیره" players={players} active={substitutes} onClick={id => selectPlayer(id, 'sub')} ratings={ratings} setRating={setRatings} mvpId={mvpId} setMvpId={setMvpId}/></section><button data-testid="save-squad" className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-700 font-black text-white"><Save className="h-4 w-4"/>ذخیره اسکواد و ارزیابی بازیکنان</button></>}{message && <p data-testid="squad-message" className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-sm font-bold text-emerald-700">{message}</p>}</form></main>;
}
function PlayerPicker({ title, players, active, onClick, ratings, setRating, mvpId, setMvpId }: { title: string; players: Content[]; active: number[]; onClick: (id: number) => void; ratings: Record<string, string>; setRating: (values: Record<string, string>) => void; mvpId: number; setMvpId: (id: number) => void }) { return <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-black"><Users className="h-5 w-5 text-rose-700"/>{title}</h2><div className="mt-4 space-y-2">{players.map(player => { const selected = active.includes(player.id); return <div key={player.id} className={`flex items-center gap-2 rounded-xl p-2 ${selected ? 'bg-rose-50 ring-1 ring-rose-200' : 'bg-slate-50'}`}><button type="button" onClick={() => onClick(player.id)} className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-black ${selected ? 'bg-rose-700 text-white' : 'bg-white text-slate-400'}`}>{selected ? '✓' : '+'}</button><span className="min-w-0 flex-1 text-sm font-bold">{text(player, 'name')} <small className="font-normal text-slate-500">· {text(player, 'position')}</small></span>{selected && <><input data-testid={`rating-${player.id}`} value={ratings[String(player.id)] || ''} onChange={event => setRating({ ...ratings, [String(player.id)]: event.target.value })} inputMode="decimal" placeholder="نمره" className="h-9 w-14 rounded-lg bg-white text-center text-xs"/><button type="button" onClick={() => setMvpId(mvpId === player.id ? 0 : player.id)} className={`grid h-9 w-9 place-items-center rounded-lg ${mvpId === player.id ? 'bg-amber-400 text-amber-950' : 'bg-white text-slate-400'}`} title="بهترین بازیکن"><Star className="h-4 w-4" fill={mvpId === player.id ? 'currentColor' : 'none'}/></button></>}</div>; })}</div></section>; }
