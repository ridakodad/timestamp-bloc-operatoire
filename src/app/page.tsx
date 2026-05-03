"use client";

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

type Intervention = {
  id: string; title: string; patient: string; room: string | null; status: string;
  surgeon: string | null; anesthetist: string | null;
  time_service_arrival: string | null; time_reception: string | null; time_entry: string | null; 
  time_induction: string | null; time_closure: string | null; time_recovery: string | null; time_exit: string | null;
  createdAt: string;
};

const ROOMS = [...Array.from({ length: 20 }, (_, i) => `Salle ${i + 1}`), "Salle ROBOT"];

const SUGGESTIONS = [
  "Appendicectomie", "Cholécystectomie", "Hernie inguinale", "Prostatectomie",
  "Cystectomie", "Néphrectomie", "Arthroplastie Hanche", "Arthroplastie Genou",
  "Coelioscopie", "Laparotomie", "Thyroïdectomie", "Mastectomie",
  "Cataracte", "Amygdalectomie", "Césarienne", "Ostéosynthèse"
];

const SURGEONS = [
  "El Sayegh Hachem", "Bouabdellah Zakaria", "Lachkar Salim"
];

export default function Home() {
  const { data: session } = useSession();
  const [step, setStep] = useState<1|2|3>(1);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [current, setCurrent] = useState<Intervention | null>(null);
  const [form, setForm] = useState({ title: '', patient: '', room: 'Salle 1', surgeon: '', anesthetist: '', time_service_arrival: '' });
  const [times, setTimes] = useState({ 
    time_reception: '', time_entry: '', time_induction: '', 
    time_closure: '', time_recovery: '', time_exit: '' 
  });
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  
  // Calendrier & Filtre
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);

  const todayStr = new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayCap = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

  const fetchAll = async () => {
    try {
      const r = await fetch('/api/interventions');
      const data = await r.json();
      if (Array.isArray(data)) {
        setInterventions(data);
      } else {
        setInterventions([]);
      }
    } catch (err) {
      setInterventions([]);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const toISO = (t: string) => {
    if (!t) return null;
    const [h, m] = t.split(':');
    const d = new Date(selectedDate); d.setHours(+h, +m, 0, 0);
    return d.toISOString();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, time_service_arrival: toISO(form.time_service_arrival) };
    const r = await fetch('/api/interventions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (r.ok) {
      const data = await r.json();
      setCurrent(data);
      setTimes({ 
        time_reception: '', time_entry: '', time_induction: '', 
        time_closure: '', time_recovery: '', time_exit: '' 
      });
      setStep(2);
    }
  };

  const toTimeStr = (iso: string | null) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const resume = (i: Intervention) => {
    setCurrent(i);
    setTimes({
      time_reception: toTimeStr(i.time_reception),
      time_entry: toTimeStr(i.time_entry),
      time_induction: toTimeStr(i.time_induction),
      time_closure: toTimeStr(i.time_closure),
      time_recovery: toTimeStr(i.time_recovery),
      time_exit: toTimeStr(i.time_exit),
    });
    setStep(2);
  };

  const tap = (field: keyof typeof times) => {
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    setTimes(p => ({ ...p, [field]: now }));
  };

  const save = async (status: 'EN_COURS' | 'TERMINEE') => {
    if (!current) return;
    const r = await fetch(`/api/interventions/${current.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        time_reception: toISO(times.time_reception),
        time_entry: toISO(times.time_entry),
        time_induction: toISO(times.time_induction),
        time_closure: toISO(times.time_closure),
        time_recovery: toISO(times.time_recovery),
        time_exit: toISO(times.time_exit),
        status
      })
    });
    if (r.ok) { 
      await fetchAll(); 
      if (status === 'TERMINEE') {
        setStep(3); 
        setCurrent(null);
      } else {
        alert('Enregistré avec succès');
      }
    }
  };

  const deleteOne = async (id: string) => {
    if (!confirm('Supprimer cette intervention ?')) return;
    const r = await fetch(`/api/interventions/${id}`, { method: 'DELETE' });
    if (r.ok) { await fetchAll(); }
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const filteredInterventions = interventions.filter(i => 
    new Date(i.createdAt).toISOString().split('T')[0] === selectedDate
  );

  const exportToExcel = () => {
    const data = filteredInterventions.map(i => {
      const duration = i.time_entry && i.time_closure 
        ? Math.round((new Date(i.time_closure).getTime() - new Date(i.time_entry).getTime()) / 60000) 
        : null;
      return {
        'Intervention': i.title, 'Patient': i.patient, 'Salle': i.room,
        'Chirurgien': i.surgeon, 'Réanimateur': i.anesthetist,
        'Arrivée Service': fmt(i.time_service_arrival), 'Accueil Bloc': fmt(i.time_reception), 'Entrée Salle': fmt(i.time_entry),
        'Induction': fmt(i.time_induction), 'Fermeture': fmt(i.time_closure),
        'Réveil': fmt(i.time_recovery), 'Sortie': fmt(i.time_exit),
        'Durée Op. (min)': duration, 'Statut': i.status,
        'Date': new Date(i.createdAt).toLocaleDateString('fr-FR')
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Interventions");
    XLSX.writeFile(wb, `Interventions_${selectedDate}.xlsx`);
  };

  const completed = filteredInterventions.filter(i => i.time_entry && i.time_closure);
  const avgOp = completed.length ? Math.round(completed.map(i => (new Date(i.time_closure!).getTime() - new Date(i.time_entry!).getTime()) / 60000).reduce((a, b) => a + b) / completed.length) : 0;

  return (
    <div className="app-shell">
      {showCalendar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowCalendar(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '340px' }} onClick={e => e.stopPropagation()}>
            <h3 className="card-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Choisir une date</h3>
            <input type="date" className="field-input" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setShowCalendar(false); }} style={{ marginBottom: '16px' }} />
            <button className="btn-pill btn-dark" onClick={() => setShowCalendar(false)}>FERMER</button>
          </div>
        </div>
      )}

      <div className="branding-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="branding-logo"><img src="/logo.png" alt="Logo" style={{width:'100%', height:'100%', objectFit:'contain'}} /></div>
          <div className="branding-text"><h2>HUIM6 Mohammed VI</h2><p>RABAT - BLOC OPÉRATOIRE</p></div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {session?.user?.email === 'admin@huim6.ma' && <Link href="/admin" className="btn-cockpit">COCKPIT ADMIN</Link>}
          <button onClick={() => signOut()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      <div className="app-header">
        <p className="date-label">{todayCap}</p>
        <h1>Suivi Temps Réel</h1>
      </div>

      <nav className="nav-pill">
        <div className={`nav-pill-item ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>Nouvelle</div>
        <div className={`nav-pill-item ${step === 2 ? 'active' : ''} ${!current ? 'opacity-30 pointer-events-none' : ''}`} onClick={() => current && setStep(2)}>Suivi</div>
        <div className={`nav-pill-item ${step === 3 ? 'active' : ''}`} onClick={() => setStep(3)}>Historique</div>
      </nav>

      {step === 1 && (
        <div className="card">
          <p className="card-label">Saisie des données</p>
          <h2 className="card-title" style={{marginBottom:'24px'}}>Nouvelle Fiche</h2>
          <form onSubmit={handleCreate}>
            <div className="field-group"><label className="field-label">Type d'Intervention</label>
              <input className="field-input" list="interventions-list" placeholder="Ex : Prostatectomie" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              <datalist id="interventions-list">{SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="field-group"><label className="field-label">Patient</label>
              <input className="field-input" placeholder="Nom et Prénom" value={form.patient} onChange={e => setForm({ ...form, patient: e.target.value })} required />
            </div>
            <div className="field-group"><label className="field-label">Chirurgien</label>
              <input className="field-input" list="surgeons-list" placeholder="Nom du chirurgien" value={form.surgeon} onChange={e => setForm({ ...form, surgeon: e.target.value })} />
              <datalist id="surgeons-list">{SURGEONS.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="field-group"><label className="field-label">Réanimateur</label>
              <input className="field-input" placeholder="Nom du réanimateur" value={form.anesthetist} onChange={e => setForm({ ...form, anesthetist: e.target.value })} />
            </div>
            <div className="field-group"><label className="field-label">Heure d'arrivée au service</label>
              <input type="time" className="field-input" value={form.time_service_arrival} onChange={e => setForm({ ...form, time_service_arrival: e.target.value })} />
            </div>
            <div className="field-group" style={{marginBottom:'24px'}}><label className="field-label">Salle</label>
              <select className="field-input" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}>{ROOMS.map(r => <option key={r}>{r}</option>)}</select>
            </div>
            <button type="submit" className="btn-pill btn-dark">DÉBUTER LE SUIVI →</button>
          </form>
        </div>
      )}

      {step === 2 && current && (
        <>
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div>
                <p className="card-label">Intervention en cours</p>
                <h2 className="card-title">{current.title}</h2>
                <p style={{fontSize:'13px', color:'#8a8a8a', fontWeight:600}}>{current.patient}</p>
                <p style={{fontSize:'11px', color:'#a6192e', fontWeight:700, marginTop: '4px'}}>
                  {current.surgeon && `Chir: ${current.surgeon} `}
                  {current.anesthetist && `| Réa: ${current.anesthetist} `}
                  {current.time_service_arrival && `| Arrivée Sce: ${fmt(current.time_service_arrival)}`}
                </p>
              </div>
              <span style={{background:'#f0f5f1', color:'#1e4d2b', padding:'6px 12px', borderRadius:'100px', fontSize:'11px', fontWeight:800}}>{current.room}</span>
            </div>
          </div>
          <div className="time-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {([
              { key: 'time_reception', label: 'Accueil Bloc' },
              { key: 'time_entry', label: 'Entrée Salle' },
              { key: 'time_induction', label: 'Induction' },
              { key: 'time_closure', label: 'Fermeture' },
              { key: 'time_recovery', label: 'Réveil' },
              { key: 'time_exit', label: 'Sortie' },
            ] as const).map(({ key, label }) => (
              <div key={key} className={`time-cell ${times[key] ? 'captured' : ''}`} onClick={() => tap(key)}>
                <div className="cell-label">{label}</div>
                <input type="time" className="cell-time bg-transparent border-none outline-none w-full text-center" value={times[key]} onChange={e => setTimes(p => ({...p, [key]: e.target.value}))} onClick={e => e.stopPropagation()} />
                {!times[key] && <p style={{fontSize:'9px', color:'#ccc', marginTop:'4px'}}>Appuyer</p>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button onClick={() => save('EN_COURS')} className="btn-pill btn-dark" style={{ flex: 1, background: '#444' }}>SAUVEGARDER</button>
            <button onClick={() => save('TERMINEE')} className="btn-pill btn-red" style={{ flex: 1 }}>CLÔTURER</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="stat-row">
            <div className="stat-box"><div className="val">{filteredInterventions.length}</div><div className="key">Actes</div></div>
            <div className="stat-box"><div className="val">{avgOp}m</div><div className="key">Moy. Opératoire</div></div>
          </div>
          <div className="list-card">
            <div className="list-header">
              <button onClick={() => setShowCalendar(true)} style={{ background: '#f8f9fa', border: 'none', padding: '6px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: 800 }}>{selectedDate.split('-').reverse().join('/')}</button>
              <div style={{display:'flex', gap:'8px'}}>
                <button onClick={() => setIsDeleteMode(!isDeleteMode)} className={`btn-excel ${isDeleteMode ? 'bg-[#a6192e]' : 'bg-[#111]'}`} style={{padding:'8px'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
                <button onClick={exportToExcel} className="btn-excel">Excel</button>
              </div>
            </div>
            {filteredInterventions.map(i => (
              <div key={i.id} className="list-row">
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                  {isDeleteMode ? (
                    <button onClick={() => deleteOne(i.id)} style={{background:'#fee', color:'#a6192e', border:'none', padding:'6px', borderRadius:'8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                  ) : i.status === 'EN_COURS' ? (
                    <button onClick={() => resume(i)} style={{background:'#eef2ff', color:'#4f46e5', border:'none', padding:'6px 12px', borderRadius:'8px', fontSize:'10px', fontWeight:800}}>REPRENDRE</button>
                  ) : null}
                  <div><div className="row-title">{i.title}</div><div className="row-sub">{i.patient}</div></div>
                </div>
                <div style={{textAlign:'right'}}><div className="row-room">{i.room}</div><div className="row-time">{fmt(i.time_reception)} – {fmt(i.time_exit)}</div></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
