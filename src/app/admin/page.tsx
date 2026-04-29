"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';

type AdminIntervention = {
  id: string; title: string; patient: string; room: string; status: string;
  time_entry: string; time_induction: string; time_closure: string;
  createdAt: string; userName: string;
};

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

  const exportAll = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Global_History");
    XLSX.writeFile(wb, "HUIM6_Global_Data.xlsx");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws);
      
      const r = await fetch('/api/admin/interventions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
      });
      if (r.ok) { alert('Importation réussie'); fetchData(); }
    };
    reader.readAsBinaryString(file);
  };

  // Stats
  const byService = data.reduce((acc: any, curr) => {
    const s = curr.userName || 'Inconnu';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  
  const chartData = Object.keys(byService).map(k => ({ name: k, value: byService[k] }));

  return (
    <div className="app-shell" style={{ maxWidth: '1000px' }}>
      <div className="branding-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
          <div>
            <h2 style={{ fontSize: '14px', margin: 0 }}>Cockpit Direction Médicale</h2>
            <p style={{ fontSize: '10px', margin: 0, opacity: 0.6 }}>ANALYTICS GLOBALES HUIM6</p>
          </div>
        </div>
        <Link href="/" style={{ fontSize: '11px', fontWeight: 800, color: '#111', textDecoration: 'none', background: '#f1f3f5', padding: '6px 12px', borderRadius: '100px' }}>
          RETOUR DASHBOARD
        </Link>
      </div>

      <div className="stat-row" style={{ marginTop: '24px' }}>
        <div className="stat-box"><div className="val">{data.length}</div><div className="key">Total Interventions</div></div>
        <div className="stat-box"><div className="val">{Object.keys(byService).length}</div><div className="key">Services Actifs</div></div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 className="card-title" style={{ fontSize: '16px', marginBottom: '20px' }}>Activité par Service</h3>
        <div style={{ width: '100%', height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1e4d2b' : '#2a6b3d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="list-card" style={{ marginTop: '24px' }}>
        <div className="list-header">
          <span className="card-label">Outils Admin</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label className="btn-excel" style={{ cursor: 'pointer', background: '#f8f9fa', color: '#111' }}>
              📁 Importer Excel
              <input type="file" hidden accept=".xlsx,.xls" onChange={handleUpload} />
            </label>
            <button onClick={exportAll} className="btn-excel">📥 Tout Exporter</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f3f5' }}>
                <th style={{ padding: '12px' }}>Service</th>
                <th style={{ padding: '12px' }}>Patient</th>
                <th style={{ padding: '12px' }}>Acte</th>
                <th style={{ padding: '12px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{i.userName}</td>
                  <td style={{ padding: '12px' }}>{i.patient}</td>
                  <td style={{ padding: '12px', opacity: 0.7 }}>{i.title}</td>
                  <td style={{ padding: '12px', opacity: 0.5 }}>{new Date(i.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
