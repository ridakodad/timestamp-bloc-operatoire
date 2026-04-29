"use client";

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

type Intervention = {
  id: string; title: string; patient: string; room: string | null; status: string;
  time_entry: string | null; time_induction: string | null;
  time_closure: string | null; time_sspi_exit: string | null;
  createdAt: string;
};

const ROOMS = [...Array.from({ length: 20 }, (_, i) => `Salle ${i + 1}`), "Salle ROBOT"];

const SUGGESTIONS = [
  "Appendicectomie", "Cholécystectomie", "Hernie inguinale", "Prostatectomie",
  "Cystectomie", "Néphrectomie", "Arthroplastie Hanche", "Arthroplastie Genou",
  "Coelioscopie", "Laparotomie", "Thyroïdectomie", "Mastectomie",
  "Cataracte", "Amygdalectomie", "Césarienne", "Ostéosynthèse"
];

export default function Home() {
  const [step, setStep] = useState<1|2|3>(1);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [current, setCurrent] = useState<Intervention | null>(null);
  const [form, setForm] = useState({ title: '', patient: '', room: 'Salle 1' });
  const [times, setTimes] = useState({ time_entry: '', time_induction: '', time_closure: '', time_sspi_exit: '' });

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  const fetchAll = async () => {
    const r = await fetch('/api/interventions');
    setInterventions(await r.json());
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/interventions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (r.ok) {
      const data = await r.json();
      setCurrent(data);
      setTimes({ time_entry: '', time_induction: '', time_closure: '', time_sspi_exit: '' });
      setStep(2);
    }
  };

  const tap = (field: keyof typeof times) => {
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    setTimes(p => ({ ...p, [field]: now }));
  };

  const toISO = (t: string) => {
    if (!t) return null;
    const [h, m] = t.split(':');
    const d = new Date(); d.setHours(+h, +m, 0, 0);
    return d.toISOString();
  };

  const save = async () => {
    if (!current) return;
    const r = await fetch(`/api/interventions/${current.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        time_entry: toISO(times.time_entry), time_induction: toISO(times.time_induction),
        time_closure: toISO(times.time_closure), time_sspi_exit: toISO(times.time_sspi_exit),
        status: 'TERMINEE'
      })
    });
    if (r.ok) { await fetchAll(); setStep(3); }
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const exportToExcel = () => {
    const data = interventions.map(i => {
      const duration = i.time_entry && i.time_closure 
        ? Math.round((new Date(i.time_closure).getTime() - new Date(i.time_entry).getTime()) / 60000) 
        : null;
      const inductionDelay = i.time_entry && i.time_induction 
        ? Math.round((new Date(i.time_induction).getTime() - new Date(i.time_entry).getTime()) / 60000) 
        : null;

      return {
        'Intervention': i.title, 'Patient': i.patient, 'Salle': i.room,
        'Entrée Salle': fmt(i.time_entry), 'Induction': fmt(i.time_induction),
        'Fermeture': fmt(i.time_closure), 'Sortie SSPI': fmt(i.time_sspi_exit),
        'Durée Op. (min)': duration, 'Délai Induction (min)': inductionDelay,
        'Date': new Date(i.createdAt).toLocaleDateString('fr-FR')
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Interventions");
    XLSX.writeFile(wb, `Interventions_HUIM6_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const completed = interventions.filter(i => i.time_entry && i.time_closure);
  const avgOp = completed.length ? Math.round(completed.map(i => (new Date(i.time_closure!).getTime() - new Date(i.time_entry!).getTime()) / 60000).reduce((a, b) => a + b) / completed.length) : 0;
  const withInd = interventions.filter(i => i.time_entry && i.time_induction);
  const avgInd = withInd.length ? Math.round(withInd.map(i => (new Date(i.time_induction!).getTime() - new Date(i.time_entry!).getTime()) / 60000).reduce((a, b) => a + b) / withInd.length) : 0;

  return (
    <div className="app-shell">
      {/* Branding Header */}
      <div className="branding-bar">
        <div className="branding-logo">
          <img src="/logo.png" alt="Logo" style={{width:'100%', height:'100%', objectFit:'contain'}} />
        </div>
        <div className="branding-text">
          <h2>Hôpital Universitaire International Mohammed VI</h2>
          <p>RABAT - BLOC OPÉRATOIRE</p>
        </div>
      </div>

      <div className="app-header">
        <p className="date-label">{todayCap}</p>
        <h1>Tableau de Bord<br/>Interventions</h1>
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
            <div className="field-group">
              <label className="field-label">Type d'Intervention (Assistance active)</label>
              <input
                className="field-input"
                list="interventions-list"
                placeholder="Ex : Prostatectomie"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
              <datalist id="interventions-list">
                {SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div className="field-group">
              <label className="field-label">Patient</label>
              <input className="field-input" placeholder="Nom et Prénom" value={form.patient} onChange={e => setForm({ ...form, patient: e.target.value })} required />
            </div>
            <div className="field-group" style={{marginBottom:'24px'}}>
              <label className="field-label">Salle (Sélection tactile)</label>
              <select className="field-input" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}>
                {ROOMS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-pill btn-dark">INITIALISER LE SUIVI  →</button>
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
              </div>
              <span style={{background:'#f0f5f1', color:'#1e4d2b', padding:'6px 12px', borderRadius:'100px', fontSize:'11px', fontWeight:800}}>{current.room}</span>
            </div>
          </div>

          <div className="time-grid">
            {([
              { key: 'time_entry', label: 'Entrée Salle' },
              { key: 'time_induction', label: 'Induction' },
              { key: 'time_closure', label: 'Fermeture' },
              { key: 'time_sspi_exit', label: 'Sortie SSPI' },
            ] as const).map(({ key, label }) => (
              <div key={key} className={`time-cell ${times[key] ? 'captured' : ''}`} onClick={() => tap(key)}>
                <div className="cell-label">{label}</div>
                <input type="time" className="cell-time bg-transparent border-none outline-none w-full text-center" value={times[key]} onChange={e => setTimes(p => ({...p, [key]: e.target.value}))} onClick={e => e.stopPropagation()} />
                {!times[key] && <p style={{fontSize:'9px', color:'#ccc', marginTop:'4px'}}>Appuyer</p>}
              </div>
            ))}
          </div>
          <button onClick={save} className="btn-pill btn-red">CLÔTURER & SAUVEGARDER</button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="stat-row">
            <div className="stat-box"><div className="val">{interventions.length}</div><div className="key">Actes</div></div>
            <div className="stat-box"><div className="val">{avgOp}m</div><div className="key">Opératoire</div></div>
            <div className="stat-box"><div className="val">{avgInd}m</div><div className="key">Induction</div></div>
          </div>

          <div className="list-card">
            <div className="list-header">
              <span className="card-label" style={{marginBottom:0}}>Récapitulatif</span>
              <button onClick={exportToExcel} className="btn-excel">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Excel
              </button>
            </div>
            {interventions.length === 0 && <div style={{padding:'40px', textAlign:'center', color:'#ccc', fontSize:'13px'}}>Aucun historique</div>}
            {interventions.map(i => (
              <div key={i.id} className="list-row">
                <div><div className="row-title">{i.title}</div><div className="row-sub">{i.patient}</div></div>
                <div style={{textAlign:'right'}}><div className="row-room">{i.room}</div><div className="row-time">{fmt(i.time_entry)} – {fmt(i.time_closure)}</div></div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="btn-pill btn-dark">+ NOUVELLE FICHE</button>
        </>
      )}
    </div>
  );
}
