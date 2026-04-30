"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  PieChart, Pie, Legend
} from 'recharts';
import * as XLSX from 'xlsx';

type AdminIntervention = {
  id: string; title: string; patient: string; room: string; status: string;
  time_reception: string; time_entry: string; time_induction: string; 
  time_closure: string; time_recovery: string; time_exit: string;
  createdAt: string; userName: string;
};

const COLORS = ['#1e4d2b', '#2a6b3d', '#a6192e'];

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<AdminIntervention[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const r = await fetch('/api/admin/interventions');
    if (r.ok) setData(await r.json());
    setLoading(false);
  };

  useEffect(() => { if (session?.user?.email === 'admin@huim6.ma') fetchData(); }, [session]);

  if (session?.user?.email !== 'admin@huim6.ma') {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Accès réservé à l'administrateur.</div>;
  }

  const calcMin = (start: string, end: string) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return diff > 0 ? Math.round(diff / 60000) : null;
  };

  const stats = data.map(i => ({
    ...i,
    durOp: calcMin(i.time_induction, i.time_closure),
    durInd: calcMin(i.time_entry, i.time_induction),
    durExit: calcMin(i.time_recovery, i.time_exit)
  }));

  const avg = (arr: (number | null)[]) => {
    const valid = arr.filter(v => v !== null) as number[];
    return valid.length ? Math.round(valid.reduce((a, b) => a + b) / valid.length) : 0;
  };

  const globalAvgOp = avg(stats.map(s => s.durOp));
  const globalAvgInd = avg(stats.map(s => s.durInd));
  const globalAvgExit = avg(stats.map(s => s.durExit));

  // Data pour le Donut Chart de répartition
  const distributionData = [
    { name: 'Chirurgie', value: globalAvgOp },
    { name: 'Induction', value: globalAvgInd },
    { name: 'Sortie', value: globalAvgExit },
  ];

  const byService = data.reduce((acc: any, curr) => {
    const s = curr.userName || 'Inconnu';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  
  const chartService = Object.keys(byService).map(k => ({ name: k, value: byService[k] }));

  const exportAll = () => {
    const exportData = stats.map(s => ({
      'Service': s.userName, 'Patient': s.patient, 'Intervention': s.title,
      'Durée Chir (min)': s.durOp, 'Délai Ind (min)': s.durInd, 'Délai Sortie (min)': s.durExit,
      'Date': new Date(s.createdAt).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analytics");
    XLSX.writeFile(wb, "HUIM6_Analytics_Export.xlsx");
  };

  return (
    <div className="app-shell" style={{ maxWidth: '1100px' }}>
      <div className="branding-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
          <div>
            <h2 style={{ fontSize: '14px', margin: 0 }}>Analytics Direction Médicale</h2>
            <p style={{ fontSize: '10px', margin: 0, opacity: 0.6 }}>COCKPIT DE PILOTAGE HUIM6</p>
          </div>
        </div>
        <Link href="/" className="btn-cockpit">RETOUR DASHBOARD</Link>
      </div>

      <div className="stat-row" style={{ marginTop: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-box"><div className="val" style={{color:'#111'}}>{data.length}</div><div className="key">Total Actes</div></div>
        <div className="stat-box"><div className="val" style={{color:'#1e4d2b'}}>{globalAvgOp}m</div><div className="key">Moy. Chirurgie</div></div>
        <div className="stat-box"><div className="val" style={{color:'#2a6b3d'}}>{globalAvgInd}m</div><div className="key">Moy. Induction</div></div>
        <div className="stat-box"><div className="val" style={{color:'#a6192e'}}>{globalAvgExit}m</div><div className="key">Moy. Sortie</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Chart 1: Volume */}
        <div className="card">
          <h3 className="card-label" style={{marginBottom:'16px'}}>Volume par Spécialité</h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartService}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#1e4d2b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Répartition Donut */}
        <div className="card">
          <h3 className="card-label" style={{marginBottom:'16px'}}>Répartition du Temps Moyen</h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="list-card" style={{ marginTop: '20px' }}>
        <div className="list-header">
          <span className="card-label">Journal des interventions</span>
          <button onClick={exportAll} className="btn-excel">📥 EXPORT ANALYTIQUE</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f3f5', background: '#fcfcfc' }}>
                <th style={{ padding: '12px' }}>SERVICE</th>
                <th style={{ padding: '12px' }}>PATIENT</th>
                <th style={{ padding: '12px' }}>ACTE</th>
                <th style={{ padding: '12px' }}>CHIR</th>
                <th style={{ padding: '12px' }}>IND</th>
                <th style={{ padding: '12px' }}>SORTIE</th>
              </tr>
            </thead>
            <tbody>
              {stats.slice(0, 50).map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                  <td style={{ padding: '12px', fontWeight: 800 }}>{i.userName}</td>
                  <td style={{ padding: '12px' }}>{i.patient}</td>
                  <td style={{ padding: '12px', opacity: 0.8 }}>{i.title}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#1e4d2b' }}>{i.durOp || '--'}m</td>
                  <td style={{ padding: '12px', color: '#2a6b3d' }}>{i.durInd || '--'}m</td>
                  <td style={{ padding: '12px', color: '#a6192e' }}>{i.durExit || '--'}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
