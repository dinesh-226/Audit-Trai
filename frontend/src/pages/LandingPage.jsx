import React, { useState } from 'react';
import {
  Anchor,
  ShieldCheck,
  Ship,
  Box,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Lock,
  ArrowRight,
  TrendingUp,
  Radio,
  FileText,
  Users,
  Compass,
  ChevronRight,
  Play
} from 'lucide-react';

export const LandingPage = ({ onLaunchApp, onOpenLogin, onOpenRegister }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      icon: ShieldCheck,
      color: '#059669',
      bg: 'rgba(16, 185, 129, 0.1)',
      title: 'Cryptographic SHA-256 Audit Trail',
      description: 'Every container booking, loading, and vessel departure is forward-chained into an immutable blockchain ledger. Detect any database tampering instantly with one click.'
    },
    {
      icon: MapPin,
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.1)',
      title: 'Live Maritime AIS Satellite Map',
      description: 'Real-time telemetry tracking vessels across the Suez Canal, Malacca Strait, and major international container corridors with live coordinate updates and speed gauges.'
    },
    {
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(239, 68, 68, 0.1)',
      title: 'AI Behavioral Anomaly Detection',
      description: 'Intelligent heuristic engine scans for 7 operational anomalies including premature unloading, teleportation jumps, burst operations, and cold-chain temperature excursions.'
    },
    {
      icon: Clock,
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.1)',
      title: 'Visual Journey Milestones',
      description: 'End-to-end milestone timeline from Booked ➔ Loaded ➔ In Transit ➔ Arrived ➔ Unloaded ➔ Inspected ➔ Delivered with digital officer signatures and block hashes.'
    },
    {
      icon: QrCode,
      color: '#0f3460',
      bg: 'rgba(15, 52, 96, 0.1)',
      title: 'Container QR Shipping Passes',
      description: 'Generate dynamic QR codes for physical containers. Port customs and clients can scan the code to instantly verify seal numbers, journey milestones, and ledger certificates.'
    },
    {
      icon: Sparkles,
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.1)',
      title: 'AI Maritime Audit Assistant',
      description: 'Ask plain-English questions like "Who loaded container ONEU-8821094 at Singapore?" or "Show active anomalies today" to receive grounded, hallucination-free audit intelligence.'
    }
  ];

  const roles = [
    {
      title: 'Admin',
      badge: 'badge-purple',
      icon: '👑',
      desc: 'Highest level of access. Manages users, changes roles, views complete audit trail, runs tamper simulations, verifies system integrity, and generates reports.'
    },
    {
      title: 'Port Manager',
      badge: 'badge-cyan',
      icon: '⚓',
      desc: 'Focuses on port activities. Monitors containers, loading/unloading operations, yard logistics, gate entry/exit, and ship berths.'
    },
    {
      title: 'Ship Manager',
      badge: 'badge-blue',
      icon: '🚢',
      desc: 'Focuses on vessel and voyage operations. Monitors ship location, AIS speed, routes, onboard container manifests, voyage details, and estimated arrival (ETA).'
    },
    {
      title: 'Inspector',
      badge: 'badge-amber',
      icon: '🔍',
      desc: 'Checks physical condition & security of containers. Verifies container seals, conducts inspections, uploads photographs, completes checklists, and marks Pass/Fail.'
    },
    {
      title: 'Viewer',
      badge: 'badge-green',
      icon: '👁️',
      desc: 'Read-only access. Can view records, verify audit trail integrity, inspect container details, and generate reports, but cannot modify any data.'
    }
  ];

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', color: '#0f172a' }}>
      {/* 1. Clean Top Navigation Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 48px',
        height: '74px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(15, 52, 96, 0.2)'
          }}>
            <Anchor size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f3460', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
              CONTAINERSHIP
            </div>
            <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, letterSpacing: '1px' }}>
              AUDIT TRAIL & AIS
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#features" style={{ fontSize: '14px', fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}>
            Features
          </a>
          <a href="#ais-tracking" style={{ fontSize: '14px', fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}>
            Live AIS Tracking
          </a>
          <a href="#how-it-works" style={{ fontSize: '14px', fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}>
            Blockchain Security
          </a>
          <a href="#roles" style={{ fontSize: '14px', fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}>
            User Roles
          </a>
        </nav>

        {/* Right CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onOpenLogin}
            className="btn btn-secondary"
            style={{ fontWeight: 600 }}
          >
            Sign In
          </button>
          <button
            onClick={onOpenRegister}
            className="btn btn-primary"
            style={{ fontWeight: 700 }}
          >
            <span>Register Account</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{
        padding: '80px 48px 100px 48px',
        maxWidth: '1360px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Top Trust Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          padding: '6px 16px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#0f3460',
          marginBottom: '24px'
        }}>
          <ShieldCheck size={16} color="#059669" />
          <span>IMO-ISPS & ISO 6346 COMPLIANT MARITIME AUDIT LEDGER</span>
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: '48px',
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-1.2px',
          lineHeight: 1.15,
          maxWidth: '960px',
          margin: '0 auto 20px auto'
        }}>
          AI-Powered Container Ship <br />
          <span style={{
            background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Audit Trail & Monitoring System
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '18px',
          color: '#475569',
          maxWidth: '780px',
          margin: '0 auto 36px auto',
          lineHeight: 1.6
        }}>
          Maintain a complete, transparent, and tamper-resistant record of container and ship operations.
          Track container journeys from booking to delivery, verify blockchain hashes with SHA-256, and detect anomalies with AI.
        </p>

        {/* Hero CTAs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '64px' }}>
          <button
            onClick={onOpenRegister}
            className="btn btn-primary btn-lg"
          >
            <span>Register Officer Account</span>
            <ArrowRight size={18} />
          </button>
          <button
            onClick={onOpenLogin}
            className="btn btn-secondary btn-lg"
          >
            <span>Sign In / Demo Login</span>
          </button>
        </div>

        {/* 4 Stats Highlights Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '28px 32px',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05)'
        }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f3460' }}>100%</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginTop: '2px' }}>
              SHA-256 Chained Integrity
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Zero silent record alterations</div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f3460' }}>7 AI Rules</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginTop: '2px' }}>
              Anomaly Detection
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Real-time sequence triggers</div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f3460' }}>5 Global Hubs</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginTop: '2px' }}>
              Live AIS Corridors
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Mumbai, Singapore, Rotterdam, Suez</div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f3460' }}>5 Role Tiers</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', marginTop: '2px' }}>
              Role-Based Control
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Admin, Port, Ship, Inspector, Viewer</div>
          </div>
        </div>
      </section>

      {/* 3. Core Capabilities Grid */}
      <section id="features" style={{
        padding: '80px 48px',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              PLATFORM MODULES
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>
              Comprehensive Maritime Audit & Monitoring
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
              Everything required to track container movements, protect audit integrity, and automate safety compliance.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '32px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(15, 23, 42, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(15, 23, 42, 0.05)';
                  }}
                >
                  <div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: feat.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px'
                    }}>
                      <Icon size={24} color={feat.color} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0' }}>
                      {feat.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. How Cryptographic Forward-Chaining Works */}
      <section id="how-it-works" style={{ padding: '90px 48px', maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            IMMUTABILITY GUARANTEES
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>
            How Cryptographic Ledger Hashing Works
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '700px', margin: '0 auto' }}>
            Every event links directly to the cryptographic fingerprint of the preceding record, making historical manipulation mathematically impossible to hide.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', position: 'relative' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f3460', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '16px' }}>
              1
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
              Operation Executed
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              An authenticated officer registers a container booking, ship arrival, loading event, or inspection pass.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', position: 'relative' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '16px' }}>
              2
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
              SHA-256 Hashed
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              The payload, timestamps, officer role, and previous block hash are cryptographically combined into a SHA-256 digest.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', position: 'relative' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '16px' }}>
              3
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
              Forward-Chained
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              The new hash becomes the required prerequisite for all future audit logs, forming a continuous tamper-proof chain.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', position: 'relative' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '16px' }}>
              4
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
              Instant Verification
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Auditors can click "Verify Audit Integrity" at any time to mathematically confirm 100% block continuity.
            </p>
          </div>
        </div>
      </section>

      {/* 5. 5-Tier User Role Matrix */}
      <section id="roles" style={{ padding: '80px 48px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f3460', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              SECURITY & ACCESS CONTROL
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>
              Role-Based Access Control
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
              Tailored workspaces and permissions for every stakeholder in the maritime logistics supply chain.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {roles.map((r, i) => (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{r.icon}</span>
                    <span>{r.title}</span>
                  </h3>
                  <span className={`badge ${r.badge}`}>{r.title}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA Conversion Banner */}
      <section style={{
        padding: '90px 48px',
        background: 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #0284c7 100%)',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '38px', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.8px' }}>
            Ready to Monitor Your Maritime Container Fleet?
          </h2>
          <p style={{ fontSize: '17px', color: '#e0f2fe', margin: '0 0 36px 0', lineHeight: 1.6 }}>
            Experience real-time AIS vessel telemetry, tamper-proof SHA-256 audit chaining, and AI anomaly detection today.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenRegister}
              style={{
                background: '#ffffff',
                color: '#0f3460',
                padding: '14px 32px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              <span>Register for Access</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={onOpenLogin}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '14px 28px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer style={{
        padding: '40px 48px',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '13px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Anchor size={18} color="#0f3460" />
          <span style={{ fontWeight: 700, color: '#0f172a' }}>ContainerShip Audit Trail System</span>
          <span>&copy; 2026. Cryptographically Verified Maritime Ledger.</span>
        </div>
        <div>
          <span>Frameworks: <strong>IMO-ISPS</strong> &bull; <strong>ISO 6346</strong> &bull; <strong>SHA-256 Ledger</strong></span>
        </div>
      </footer>
    </div>
  );
};
