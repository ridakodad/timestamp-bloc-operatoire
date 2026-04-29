"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Identifiants invalides");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
        <div className="branding-logo" style={{ margin: '0 auto 20px', width: '64px', height: '64px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h2 className="card-title" style={{ marginBottom: '8px' }}>Connexion</h2>
        <p style={{ fontSize: '12px', color: '#8a8a8a', marginBottom: '24px', fontWeight: 600 }}>
          Portail Médical HUIM6
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field-group" style={{ textAlign: 'left' }}>
            <label className="field-label">Email Professionnel</label>
            <input
              type="email"
              className="field-input"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
            <label className="field-label">Mot de passe</label>
            <input
              type="password"
              className="field-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ background: '#fee', color: '#a6192e', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-pill btn-dark" disabled={loading}>
            {loading ? "CONNEXION..." : "SE CONNECTER"}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '10px', color: '#ccc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Accès réservé au personnel médical
        </p>
      </div>
    </div>
  );
}
