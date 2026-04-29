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
        setError("Identifiants incorrects. Veuillez réessayer.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur de connexion est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, #f8f9fa, #e9ecef)'
    }}>
      <div className="card" style={{ 
        width: '90%', 
        maxWidth: '400px', 
        padding: '40px 30px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.8)'
      }}>
        <div style={{ 
          margin: '0 auto 32px', 
          width: '80px', 
          height: '80px',
          background: '#fff',
          padding: '12px',
          borderRadius: '20px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.03)'
        }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 800, 
          color: '#111', 
          marginBottom: '8px',
          letterSpacing: '-0.02em'
        }}>
          Bienvenue
        </h2>
        <p style={{ 
          fontSize: '14px', 
          color: '#6c757d', 
          marginBottom: '32px', 
          fontWeight: 500 
        }}>
          Portail Médical HUIM6
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="field-group">
            <label className="field-label">Email Professionnel</label>
            <input
              type="email"
              className="field-input"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ background: 'rgba(0,0,0,0.02)' }}
            />
          </div>
          
          <div className="field-group" style={{ marginBottom: '32px' }}>
            <label className="field-label">Mot de passe</label>
            <input
              type="password"
              className="field-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ background: 'rgba(0,0,0,0.02)' }}
            />
          </div>

          {error && (
            <div style={{ 
              background: '#fff5f5', 
              color: '#c53030', 
              padding: '12px', 
              borderRadius: '12px', 
              fontSize: '13px', 
              fontWeight: 600, 
              marginBottom: '24px',
              border: '1px solid #fed7d7'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-pill btn-dark" 
            disabled={loading}
            style={{ 
              width: '100%', 
              height: '54px', 
              fontSize: '15px', 
              letterSpacing: '0.05em' 
            }}
          >
            {loading ? "AUTHENTIFICATION..." : "SE CONNECTER"}
          </button>
        </form>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f3f5' }}>
          <p style={{ 
            fontSize: '11px', 
            color: '#adb5bd', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em' 
          }}>
            Système de Suivi Sécurisé
          </p>
        </div>
      </div>
    </div>
  );
}
