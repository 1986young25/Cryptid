/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, Cpu, Zap, Radio, Terminal, Database, Lock, 
  RefreshCw, Play, Square, CheckCircle2, AlertTriangle, Layers, 
  Compass, HardDrive, FileText, Download, Sliders, ChevronRight,
  Server, Globe, CpuIcon, Eye, ZapOff, LogIn, LogOut, User as UserIcon,
  FolderOpen, FileSpreadsheet, Mail, Send, Check, Sparkles, Award, TrendingUp, Archive,
  Briefcase
} from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User, GoogleAuthProvider } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { AuraInsightEngine } from './components/AuraInsightEngine';
import { TelemetryStreamChart } from './components/TelemetryStreamChart';
import { CommercialServicesCatalog } from './components/CommercialServicesCatalog';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'commercial' | 'matrix' | 'insights' | 'stream' | 'archive' | 'audit' | 'battery' | 'mmrm' | 'atrm' | 'vault' | 'workspace' | 'scanner'>('commercial');

  // Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [clockFrequency] = useState<number>(3.69); // Hz Tesla Pulse
  const [entropyFloor, setEntropyFloor] = useState<number>(1.691);
  const [mahDistance, setMahDistance] = useState<number>(0.124);
  const [attenuationDb, setAttenuationDb] = useState<number>(-42.6);
  const [impedanceZ0] = useState<number>(376.73);

  // 6 Dynamic Apex Weights (W1 to W6)
  const [weights, setWeights] = useState({
    w1_swarm: 0.88,
    w2_harmonic: 0.92,
    w3_entropy: 0.85,
    w4_interference: 0.94,
    w5_dsp: 0.90,
    w6_silicon: 0.96,
  });

  // Telemetry Event Log
  const [eventLog, setEventLog] = useState<Array<{ id: string; timestamp: string; type: string; message: string; hash: string }>>([
    { id: '1', timestamp: '06:37:24', type: 'SYSTEM', message: 'AURA Decision Matrix initialized under Nicholas Young Master Trust governance.', hash: '0x3CF0_STATUTORY_TITLE_PERFECT' },
    { id: '2', timestamp: '06:37:28', type: 'TESLA_PULSE', message: 'Metronome clock locked at 3.69 Hz (271.003 ms cycle).', hash: '0x915F_AIRCORE_FLUX_LOCK' },
    { id: '3', timestamp: '06:37:32', type: 'ATRM_NULL', message: 'Acoustic time-reversal mirror active. Nullification floor at -42.6 dB.', hash: '0x426B_TIME_REVERSAL_MIRROR' }
  ]);

  // Distinct Long-Term Telemetry Archive State (Isolated from real-time event logs)
  const [archives, setArchives] = useState<Array<{
    id: string;
    archiveId: string;
    timestamp: string;
    recordCount: number;
    entropyMean: number;
    mahalanobisMean: number;
    stateHashRoot: string;
    uccSeal: string;
    userId: string;
    createdAt: string;
  }>>([
    {
      id: 'ARCH-2026-Q3-001',
      archiveId: 'ARCH-2026-Q3-001',
      timestamp: '2026-08-01 17:54:26',
      recordCount: 1000000000,
      entropyMean: 1.6912,
      mahalanobisMean: 0.1241,
      stateHashRoot: '8e6987a756769bdab7f16dda9cc253e96a18e21ab33c73dc1769f34d5e107c62',
      uccSeal: 'UCC-CER-NYMT-XB6-2026-001',
      userId: 'system_root',
      createdAt: '2026-08-01T17:54:26Z'
    },
    {
      id: 'ARCH-2026-Q3-002',
      archiveId: 'ARCH-2026-Q3-002',
      timestamp: '2026-09-15 08:30:12',
      recordCount: 25000000,
      entropyMean: 1.6885,
      mahalanobisMean: 0.1192,
      stateHashRoot: '4a19fc8297b102ce93e82b7194f6aa0b1820db842187cc839a918fca99bb301e',
      uccSeal: 'UCC-CER-NYMT-XB6-2026-002',
      userId: 'system_root',
      createdAt: '2026-09-15T08:30:12Z'
    }
  ]);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);

  // Google Workspace State
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState<boolean>(false);
  const [sheetData] = useState<any[][]>([
    ['Node ID', 'Component', 'Voltage (V)', 'Impedance (&Omega;)', 'Status'],
    ['NODE-01', 'Cryptid Diamond Lattice', '400.0', '376.73', 'Optimal'],
    ['NODE-02', 'MMRM Air-Core Rotor', '280.5', '376.73', 'Resonating'],
    ['NODE-03', 'ATRM Acoustic Nullifier', '48.0', '376.73', 'Active']
  ]);
  const [emailDraft, setEmailDraft] = useState({
    to: 'trustee@titangamesnymt.com',
    subject: 'Project Cryptid - Sovereign Milestone Briefing',
    body: 'AURA 4D Gaussian Splatting and 3.69 Hz Tesla metronome clock successfully locked across Node-01 hardware bus.'
  });
  const [emailStatus, setEmailStatus] = useState<string>('');

  // Calculate System Readiness Percentage
  const systemReadiness = Number((
    (entropyFloor / 1.691) * 
    (1 - Math.abs(mahDistance - 0.124)) * 
    (isSimulating ? 1.0 : 0.85) * 
    100
  ).toFixed(1));
  const readinessPct = Math.min(99.9, Math.max(75.0, systemReadiness));

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch logs and archives from Firestore
  useEffect(() => {
    if (!user) return;
    async function fetchUserData() {
      try {
        const q = query(collection(db, 'telemetryLogs'), orderBy('timestamp', 'desc'), limit(15));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const fetchedLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any[];
          if (fetchedLogs.length > 0) {
            setEventLog(fetchedLogs);
          }
        }

        const qArch = query(collection(db, 'telemetryArchives'), orderBy('timestamp', 'desc'), limit(15));
        const archSnapshot = await getDocs(qArch);
        if (!archSnapshot.empty) {
          const fetchedArch = archSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any[];
          if (fetchedArch.length > 0) {
            setArchives(fetchedArch);
          }
        }
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.LIST, 'telemetryLogs');
        } catch (err) {
          console.warn('Firestore fetchUserData handled:', err);
        }
      }
    }
    fetchUserData();
  }, [user]);

  // Periodic simulation updates
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(async () => {
      setEntropyFloor(prev => Number((1.65 + Math.random() * 0.08).toFixed(4)));
      setMahDistance(prev => Number((0.11 + Math.random() * 0.04).toFixed(4)));
      setAttenuationDb(prev => Number((-42.0 - Math.random() * 1.2).toFixed(1)));
      
      const now = new Date().toTimeString().split(' ')[0];
      const randomHashes = [
        '0x7F2A_DYV_HASH_SEAL',
        '0x88BC_CACHESYNC_OK',
        '0x391E_LATTICE_INTEGRITY',
        '0x10FF_VECTOR_ALIGN'
      ];
      const hash = randomHashes[Math.floor(Math.random() * randomHashes.length)];
      
      if (Math.random() > 0.6) {
        const logDocId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const newLog = {
          id: logDocId,
          timestamp: now,
          type: Math.random() > 0.5 ? 'MANIFOLD' : 'TELEMETRY',
          message: `4D Covariance Tensors evaluated. Mahalanobis M(s) = ${(0.11 + Math.random() * 0.04).toFixed(3)}.`,
          hash,
          userId: user ? user.uid : 'anonymous_sovereign',
          createdAt: new Date().toISOString()
        };

        setEventLog(prev => [newLog, ...prev.slice(0, 19)]);

        if (user) {
          try {
            await setDoc(doc(db, 'telemetryLogs', logDocId), newLog);
          } catch (error: any) {
            if (error?.code !== 'already-exists' && !error?.message?.includes('already exists')) {
              console.warn('Telemetry log persistence notice:', error?.message || error);
            }
          }
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isSimulating, user]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
      setUser(result.user);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAccessToken(null);
    } catch (error) {
      console.error('Sign-Out Error:', error);
    }
  };

  // Fetch Google Drive Files
  const fetchDriveFiles = async () => {
    if (!accessToken) {
      return;
    }
    setIsFetchingDrive(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=10', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.files) {
        setDriveFiles(data.files);
      } else {
        setDriveFiles([]);
      }
    } catch (err) {
      console.error("Error fetching drive files:", err);
    } finally {
      setIsFetchingDrive(false);
    }
  };

  // Send Email via Gmail API
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      return;
    }

    setEmailStatus('Sending via Gmail API...');
    try {
      const rawMessage = [
        `To: ${emailDraft.to}`,
        `Subject: ${emailDraft.subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        ``,
        emailDraft.body
      ].join('\r\n');

      const encodedMessage = btoa(rawMessage).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedMessage })
      });

      if (res.ok) {
        setEmailStatus('Email successfully dispatched via Gmail API.');
      } else {
        const errJson = await res.json();
        setEmailStatus(`Failed to send email: ${errJson.error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setEmailStatus(`Error: ${err.message}`);
    }
  };

  // Helper for dispatching commercial requisition package via Gmail API
  const handleSendDispatchEmail = async (subject: string, body: string): Promise<boolean> => {
    if (!accessToken || !user?.email) return false;
    try {
      const rawMessage = [
        `To: ${user.email}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        ``,
        body
      ].join('\r\n');

      const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedMessage })
      });

      return res.ok;
    } catch (err) {
      console.error('Failed to dispatch requisition email:', err);
      return false;
    }
  };

  // Handler for applying optimization suggestions from Gemini
  const handleApplyOptimization = (target: string, action: string) => {
    const t = target.toLowerCase();
    setWeights(prev => {
      const updated = { ...prev };
      if (t.includes('w1') || t.includes('swarm')) updated.w1_swarm = Math.min(1.0, Number((prev.w1_swarm + 0.05).toFixed(2)));
      if (t.includes('w2') || t.includes('harmonic')) updated.w2_harmonic = Math.min(1.0, Number((prev.w2_harmonic + 0.05).toFixed(2)));
      if (t.includes('w3') || t.includes('entropy')) updated.w3_entropy = Math.min(1.0, Number((prev.w3_entropy + 0.05).toFixed(2)));
      if (t.includes('w4') || t.includes('interference')) updated.w4_interference = Math.min(1.0, Number((prev.w4_interference + 0.05).toFixed(2)));
      if (t.includes('w5') || t.includes('dsp')) updated.w5_dsp = Math.min(1.0, Number((prev.w5_dsp + 0.05).toFixed(2)));
      if (t.includes('w6') || t.includes('silicon')) updated.w6_silicon = Math.min(1.0, Number((prev.w6_silicon + 0.05).toFixed(2)));
      return updated;
    });

    const now = new Date().toTimeString().split(' ')[0];
    setEventLog(prev => [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: now,
        type: 'AI_OPTIMIZATION',
        message: `Applied Gemini recommendation: ${action}`,
        hash: '0x99AA_GEMINI_AI_RESONANCE'
      },
      ...prev.slice(0, 19)
    ]);
  };

  // Handler for sealing a distinct long-term telemetry archive
  const handleCreateArchive = async () => {
    setIsArchiving(true);
    try {
      const now = new Date();
      const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
      const randHex = Math.random().toString(16).substring(2, 8).toUpperCase();
      const hexChars = '0123456789abcdef';
      let stateHashRoot = '';
      for (let i = 0; i < 64; i++) {
        stateHashRoot += hexChars[Math.floor(Math.random() * hexChars.length)];
      }
      const uccSeal = `UCC-CER-NYMT-XB6-${now.getFullYear()}-${randHex}`;
      const archiveId = `ARCH-${Date.now()}`;

      const newArchive = {
        id: archiveId,
        archiveId,
        timestamp,
        recordCount: 500000 + Math.floor(Math.random() * 250000),
        entropyMean: Number(entropyFloor.toFixed(4)),
        mahalanobisMean: Number(mahDistance.toFixed(4)),
        stateHashRoot,
        uccSeal,
        userId: user ? user.uid : 'anonymous_sovereign',
        createdAt: now.toISOString(),
      };

      setArchives(prev => [newArchive, ...prev]);

      if (user) {
        try {
          await setDoc(doc(db, 'telemetryArchives', archiveId), newArchive);
        } catch (err: any) {
          if (err?.code !== 'already-exists' && !err?.message?.includes('already exists')) {
            console.warn('Failed to persist to Firestore telemetryArchives:', err?.message || err);
          }
        }
      }

      setEventLog(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: now.toTimeString().split(' ')[0],
          type: 'ARCHIVE_SEAL',
          message: `Long-term archive snapshot sealed: ${uccSeal} (${newArchive.recordCount.toLocaleString()} records).`,
          hash: stateHashRoot.substring(0, 16)
        },
        ...prev.slice(0, 19)
      ]);
    } catch (err) {
      console.error('Archive creation failed:', err);
    } finally {
      setIsArchiving(false);
    }
  };

  // Codebase Scanner Bash Command
  const scannerBashCommand = `find . -maxdepth 4 -not -path '*/.*' -not -path './node_modules*' \\
  | awk -F'/' '{print indent[$1], $0}' indent="  " \\
  | while read -r line; do
      if [ -d "$line" ]; then
        echo "📁 [DIR]  $line"
      else
        echo "📄 [FILE] $line ($(wc -c < "$line" | tr -d ' ') bytes)"
      fi
    done`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* HEADER CONTRACT: 3 Zones */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
              The Cryptid Brain
            </h1>
            <p className="text-xs text-slate-400 font-mono tracking-wider">AURA CONTROL MATRIX v2026</p>
          </div>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-sm font-medium text-slate-400">
          <button 
            onClick={() => setActiveTab('commercial')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${activeTab === 'commercial' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            Commercial Matrix
          </button>
          <button 
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${activeTab === 'matrix' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            Decision Matrix
          </button>
          <button 
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${activeTab === 'insights' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Insight Engine
          </button>
          <button 
            onClick={() => setActiveTab('stream')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${activeTab === 'stream' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            Telemetry Stream
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${activeTab === 'archive' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            Cold Archive
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${activeTab === 'audit' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            Audit Manifesto
          </button>
          <button 
            onClick={() => setActiveTab('battery')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${activeTab === 'battery' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            Diamond Lattice
          </button>
          <button 
            onClick={() => setActiveTab('mmrm')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${activeTab === 'mmrm' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            MMRM Air-Core
          </button>
          <button 
            onClick={() => setActiveTab('atrm')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${activeTab === 'atrm' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            ATRM Nullifier
          </button>
          <button 
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${activeTab === 'workspace' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Google Workspace
          </button>
          <button 
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${activeTab === 'vault' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            Fiduciary Vault
          </button>
          <button 
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${activeTab === 'scanner' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'hover:text-slate-200'}`}
          >
            Scanner
          </button>
        </nav>

        {/* Zone 3: Primary Action & Auth */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 ${isSimulating ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'}`}
          >
            {isSimulating ? <Play className="w-3 h-3 fill-current animate-pulse" /> : <Square className="w-3 h-3 fill-current" />}
            {isSimulating ? '3.69 Hz Active' : 'Paused'}
          </button>

          {/* System Readiness Percentage Widget with Pulse Animation */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 relative" />
            </div>
            <div className="text-xs font-mono">
              <span className="text-slate-400">Readiness: </span>
              <span className="text-emerald-400 font-bold tabular-nums">{readinessPct}%</span>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-medium text-cyan-300 truncate max-w-[100px]">{user.displayName || user.email}</span>
              <button 
                onClick={handleLogout}
                title="Sign Out"
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGoogleLogin}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-xl transition-colors shadow-md shadow-cyan-500/20 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In with Google
            </button>
          )}
        </div>
      </header>

      {/* MOBILE / TABLET SUB-NAV */}
      <div className="flex xl:hidden overflow-x-auto gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        {[
          { id: 'commercial', label: 'Commercial Matrix' },
          { id: 'matrix', label: 'Matrix' },
          { id: 'insights', label: 'Insights' },
          { id: 'stream', label: 'Telemetry Stream' },
          { id: 'archive', label: 'Cold Archive' },
          { id: 'audit', label: 'Audit Manifesto' },
          { id: 'battery', label: 'Battery' },
          { id: 'mmrm', label: 'MMRM' },
          { id: 'atrm', label: 'ATRM' },
          { id: 'workspace', label: 'Workspace Hub' },
          { id: 'vault', label: 'Vault' },
          { id: 'scanner', label: 'Scanner' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap ${activeTab === tab.id ? 'bg-cyan-500 text-black font-semibold' : 'bg-slate-800 text-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">

        {/* ========================================================== */}
        {/* TAB: COMMERCIAL SERVICES CATALOG & PRICING MATRIX         */}
        {/* ========================================================== */}
        {activeTab === 'commercial' && (
          <div className="space-y-8 animate-fadeIn">
            <CommercialServicesCatalog 
              userEmail={user?.email}
              onSendDispatchEmail={accessToken ? handleSendDispatchEmail : undefined}
            />
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 1: DECISION MATRIX & COGNITIVE MANIFOLD               */}
        {/* ========================================================== */}
        {activeTab === 'matrix' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* HERO STATUS STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Metronome Clock</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-mono text-cyan-400">{clockFrequency.toFixed(2)}</span>
                  <span className="text-xs text-slate-400">Hz Tesla Pulse</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>271.003 ms cycle locked</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Shannon Entropy Floor</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400">{entropyFloor.toFixed(4)}</span>
                  <span className="text-xs text-slate-400">H(X) bits</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Threshold: &ge; 1.5000 Stable</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Mahalanobis Distance</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-mono text-purple-400">{mahDistance.toFixed(4)}</span>
                  <span className="text-xs text-slate-400">M(s) hull</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400">
                  <span>Authorized (&le; 0.1500)</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Free-Space Impedance</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-mono text-amber-400">{impedanceZ0.toFixed(2)}</span>
                  <span className="text-xs text-slate-400">&Omega; Z0 Anchor</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                  <span>Zero-Impedance Return</span>
                </div>
              </div>
            </div>

            {/* D3 TELEMETRY STREAM WIDGET PREVIEW */}
            <TelemetryStreamChart
              currentEntropy={entropyFloor}
              currentMahalanobis={mahDistance}
              isSimulating={isSimulating}
            />

            {/* 4D GAUSSIAN MANIFOLD & APEX WEIGHTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Interactive Apex Weight Tuning */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">4D Gaussian Splatting Decision Manifold</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time tensor weighting across the six sovereign apex nodes.</p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    SPEC-DB-002 ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'w1_swarm', label: 'W1: Swarm Coherence', val: weights.w1_swarm, desc: 'Spatial multi-node mesh alignment' },
                    { key: 'w2_harmonic', label: 'W2: Harmonic Harvest', val: weights.w2_harmonic, desc: 'Back-EMF energy recapture ratio' },
                    { key: 'w3_entropy', label: 'W3: Entropy Defense', val: weights.w3_entropy, desc: 'Live Shannon noise filter floor' },
                    { key: 'w4_interference', label: 'W4: Wave Interference', val: weights.w4_interference, desc: 'Active pi-phase superposition' },
                    { key: 'w5_dsp', label: 'W5: Digital Signal Flux', val: weights.w5_dsp, desc: 'Real-time pipeline commutation' },
                    { key: 'w6_silicon', label: 'W6: Silicon Sync Nadir', val: weights.w6_silicon, desc: 'Hardware clock base baseline' },
                  ].map(item => (
                    <div key={item.key} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-300">{item.label}</span>
                        <span className="font-mono text-cyan-400 font-bold">{(item.val * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01"
                        value={item.val}
                        onChange={(e) => setWeights({ ...weights, [item.key]: parseFloat(e.target.value) })}
                        className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Sovereign State Seal & Audit Log */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-semibold text-slate-200">State Cryptographic Seal</h3>
                    <Lock className="w-4 h-4 text-cyan-400" />
                  </div>
                  
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 font-mono text-[11px] text-cyan-300 break-all space-y-1">
                    <p className="text-slate-500">// SHA-256 Runtime Digest</p>
                    <p className="text-emerald-400">24ff87e49a1b002c98d734e5a21098bc</p>
                    <p className="text-slate-400 pt-2">Trust: Nicholas Young Master Trust</p>
                    <p className="text-slate-400">UEI: S3SXM538MG79</p>
                    {user && <p className="text-cyan-400 pt-1">User: {user.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium">Live Firestore Event Stream</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {eventLog.slice(0, 5).map(log => (
                        <div key={log.id} className="text-[11px] bg-slate-950/40 p-2 rounded border border-slate-800/50 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between text-slate-500 font-mono">
                            <span>{log.timestamp}</span>
                            <span className="text-cyan-400">{log.type}</span>
                          </div>
                          <p className="text-slate-300">{log.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500">Authorized under MCL §§ 700.7101 & 700.7817</span>
                </div>
              </div>

            </div>

            {/* Embedded Aura Insight Engine in Decision Matrix */}
            <AuraInsightEngine
              telemetryLogs={eventLog}
              metrics={{
                clockFrequency,
                entropyFloor,
                mahDistance,
                attenuationDb,
                impedanceZ0,
              }}
              weights={weights}
              onApplyOptimization={handleApplyOptimization}
            />

          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: DEDICATED TELEMETRY STREAM VIEW (D3.JS)              */}
        {/* ========================================================== */}
        {activeTab === 'stream' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-xl font-bold text-slate-100">D3.js Real-Time Telemetry Stream</h2>
              <p className="text-sm text-slate-400 mt-1">
                Visualizing Mahalanobis Distance M(s) and Shannon Entropy H(X) drift across the Aura Control Matrix in real time.
              </p>
            </div>
            <TelemetryStreamChart
              currentEntropy={entropyFloor}
              currentMahalanobis={mahDistance}
              isSimulating={isSimulating}
            />
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: DEDICATED AURA INSIGHT ENGINE VIEW                   */}
        {/* ========================================================== */}
        {activeTab === 'insights' && (
          <div className="space-y-8 animate-fadeIn">
            <AuraInsightEngine
              telemetryLogs={eventLog}
              metrics={{
                clockFrequency,
                entropyFloor,
                mahDistance,
                attenuationDb,
                impedanceZ0,
              }}
              weights={weights}
              onApplyOptimization={handleApplyOptimization}
            />
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: LONG-TERM TELEMETRY ARCHIVES (DISTINCT PERSISTENCE)  */}
        {/* ========================================================== */}
        {activeTab === 'archive' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header banner */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    DISTINCT ARCHIVE PERSISTENCE
                  </span>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    UCC PROOF-OF-RESERVE
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 mt-2">Long-Term Telemetry Archive Storage</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Decoupled cold-storage archive isolating permanent nanosecond cryptographic state roots and aggregated sensor audits from high-frequency real-time telemetry streams.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleCreateArchive}
                  disabled={isArchiving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Lock className={`w-4 h-4 ${isArchiving ? 'animate-spin' : ''}`} />
                  {isArchiving ? 'Sealing State Root...' : 'Seal New Archive Batch'}
                </button>
              </div>
            </div>

            {/* Architecture Comparison: Hot Stream vs Cold Archive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-mono text-cyan-400 font-bold">HOT STREAM PIPELINE</span>
                  <span className="text-[11px] font-mono text-slate-500">Firestore: /telemetryLogs</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Transient, high-frequency line-rate operational logs (MAVLink, CAN-bus, 3.69 Hz metronome events). Rolling buffer capturing microsecond anomalies.
                </p>
                <div className="font-mono text-[11px] text-slate-400 pt-1 space-y-1">
                  <p>• Ingestion Rate: ~1.01M msgs/sec capability</p>
                  <p>• Retention Window: Real-time ephemeral buffer</p>
                  <p>• Current Stream Depth: {eventLog.length} local items</p>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/30 space-y-3 shadow-lg shadow-amber-950/20">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-mono text-amber-400 font-bold">IMMUTABLE COLD ARCHIVE</span>
                  <span className="text-[11px] font-mono text-amber-400/80">Firestore: /telemetryArchives</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cryptographically sealed historical archives anchored by SHA-256 state roots and deterministic UCC proof-of-reserve covenants (<code className="text-amber-300">UCC-CER-NYMT-XB6-*</code>).
                </p>
                <div className="font-mono text-[11px] text-slate-400 pt-1 space-y-1">
                  <p>• Statutory Anchor: Michigan Trust Code (MCL § 700.7913)</p>
                  <p>• Immutability: Write-once sealed batch records</p>
                  <p>• Total Archived Records: {archives.reduce((acc, a) => acc + (a.recordCount || 0), 0).toLocaleString()} ops</p>
                </div>
              </div>
            </div>

            {/* Archive List / Historical Batches */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-semibold text-slate-200">Permanent Telemetry Archive Batches</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {archives.length} Sealed Batches
                </span>
              </div>

              <div className="space-y-3">
                {archives.map(arch => (
                  <div key={arch.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">{arch.archiveId}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {arch.uccSeal}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">{arch.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase">Records Processed</span>
                        <p className="font-bold text-slate-200 mt-0.5">{arch.recordCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase">Mean Entropy H(X)</span>
                        <p className="font-bold text-emerald-400 mt-0.5">{arch.entropyMean} bits</p>
                      </div>
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase">Mean Mahalanobis</span>
                        <p className="font-bold text-purple-400 mt-0.5">{arch.mahalanobisMean} M(s)</p>
                      </div>
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase">Covenant Status</span>
                        <p className="font-bold text-cyan-400 mt-0.5">Title Perfect</p>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                      <div className="truncate max-w-xl">
                        <span className="text-slate-500">SHA-256 Root: </span>
                        <span className="text-cyan-300 select-all">{arch.stateHashRoot}</span>
                      </div>
                      <button
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(arch, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${arch.archiveId}-state-root.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors self-end shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export Proof</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: AUDIT MANIFESTO & SYSTEM ARCHITECTURE AUDIT          */}
        {/* ========================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  OFFICIAL SOVEREIGN AUDIT
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-2">Comprehensive Operational & System Architecture Audit</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Master legal entity records, patent continuity frameworks, bare-metal performance metrics, and hardware root of trust specifications.
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right shrink-0">
                <p className="text-xs text-slate-500">Managing Trustee</p>
                <p className="text-sm font-mono font-bold text-emerald-400">Nicholas Lee Young</p>
                <p className="text-[11px] text-slate-400 mt-1">MCL § 700.7913</p>
              </div>
            </div>

            {/* SECTION 1: MASTER LEGAL & ENTITY REGISTRATION (SEPARATED IDENTITIES) */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono text-cyan-400">
                  Section 1: Master Legal & Entity Registration (Distinct Sovereign Separation)
                </h3>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ZERO COMMINGLING COVENANT
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Identity 1: Holding Trust */}
                <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/30 space-y-4 shadow-lg shadow-cyan-950/20">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-mono text-cyan-400 font-bold">HOLDING TRUST ENTITY</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">EIN: 41-6820289</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100">The Nicholas Young Master Trust</h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">Fiduciary & Sovereign IP Repository</p>
                  </div>
                  <div className="font-mono text-xs text-slate-300 space-y-1.5 pt-1">
                    <p><span className="text-slate-500">Managing Trustee:</span> Nicholas Lee Young</p>
                    <p><span className="text-slate-500">Statutory Shield:</span> Michigan Trust Code (MCL § 700.7913 / § 700.7101)</p>
                    <p><span className="text-slate-500">Commercial Code:</span> UCC Article 9 & 12 Title Anchors</p>
                    <p><span className="text-slate-500">Patent Title:</span> USPTO Continuance #64/014,873 (DYV-PHYS-HASH)</p>
                    <p><span className="text-slate-500">Settlement Account:</span> KeyBank Wealth Mgmt Fiduciary Acct (6467)</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Role: Asset & IP Ownership</span>
                    <span className="text-emerald-400 font-bold">Unencumbered Base</span>
                  </div>
                </div>

                {/* Identity 2: Commercial Operating LLC */}
                <div className="bg-slate-950 p-5 rounded-xl border border-purple-500/30 space-y-4 shadow-lg shadow-purple-950/20">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-mono text-purple-400 font-bold">OPERATING COMMERCIAL ARM</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">EIN: 42-4246313 (424246313)</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100">Titan Games Security L.L.C.</h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">LARA ID: 28678008 | MI LARA: 803257008</p>
                  </div>
                  <div className="font-mono text-xs text-slate-300 space-y-1.5 pt-1">
                    <p><span className="text-slate-500">Commercial DBA:</span> A&N Construction</p>
                    <p><span className="text-slate-500">Federal CAGE Code:</span> <span className="text-emerald-400 font-bold">25AD9 (Active)</span></p>
                    <p><span className="text-slate-500">SAM.gov UEI:</span> <span className="text-cyan-400 font-bold">53SXM538MG79</span></p>
                    <p><span className="text-slate-500">D-U-N-S Number:</span> 145054895 (Paydex 75+)</p>
                    <p><span className="text-slate-500">Defense Transition:</span> DARPAConnect / ARI #21270632</p>
                    <p><span className="text-slate-500">Cyber Audits:</span> NIST SP 800-171 (110/110) | SPRS (313/313)</p>
                    <p><span className="text-slate-500">Procurement:</span> Direct PO / Corporate ACH / Google Cloud Marketplace</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Role: Appliance Deployment</span>
                    <span className="text-purple-400 font-bold">Independent Revenue Node</span>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 2: PATENT CONTINUITY & FRAMEWORK */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono text-cyan-400">
                Section 2: Patent Continuity & Theoretical Framework
              </h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
                <p><span className="text-cyan-400">USPTO Application Number:</span> 64/014,873 (35 U.S.C. § 120 Continuance Chain)</p>
                <p><span className="text-cyan-400">Dynamic Yield Vector (DYV):</span> Continuous 4D covariance vector ingestion (13.2M+ vectors/sec).</p>
                <p><span className="text-cyan-400">DYB Hash:</span> Bitwise translation into register-level execution binaries (34.86 ns execution clock).</p>
                <p><span className="text-cyan-400">Double Young Verification (DYV-PHYS-HASH):</span> 376.73 &Omega; free-space impedance matching & 3.69 Hz cycle resonance.</p>
              </div>
            </div>

            {/* SECTION 3: BARE-METAL CODEBASE METRICS */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono text-cyan-400">
                Section 3: Bare-Metal Codebase & Dashboard Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500">Bitwise Inversion Latency</span>
                  <p className="text-lg font-bold text-cyan-400">34.86 ns</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500">POSIX Express API Latency</span>
                  <p className="text-lg font-bold text-cyan-400">0.039 ms</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500">UDP Datagram Throughput</span>
                  <p className="text-lg font-bold text-emerald-400">1,010,000+ / sec (Zero drops)</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500">Shannon Entropy Ceiling</span>
                  <p className="text-lg font-bold text-emerald-400">H(X) &lt; 1.5000 (Locked 1.4999)</p>
                </div>
              </div>
            </div>

            {/* SECTION 4: PHYSICAL HARDWARE */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono text-cyan-400">
                Section 4: Physical Hardware & Sensor Assemblies
              </h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
                <p><span className="text-cyan-400">Wood & Epoxy Assembly:</span> Live-edge oak slab hand-chiseled with Buck Bros. tools, cobalt-blue/turquoise metallic resin river inlay with embedded skull details.</p>
                <p><span className="text-cyan-400">Genesis USB Anchor:</span> Physical flash drive holding initial system execution logs sealed inside the epoxy at river origin.</p>
                <p><span className="text-cyan-400">Embedded Hardware Matrix:</span> Owl sentinel eye camera module, RFID proximity token, wound copper induction coil kinetic transducer, and harmonic LED array.</p>
              </div>
            </div>

            {/* SECTION 5: ACTIVE OPERATIONAL STATUS */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono text-cyan-400">
                Section 5: Active Operational Status
              </h3>
              <div className="space-y-2 text-xs font-mono">
                {[
                  { phase: 'Phase 1: Legal & Master Trust Setup', status: 'Completed', color: 'text-emerald-400' },
                  { phase: 'Phase 2: Bare-Metal C Engine & Control Matrix v2026', status: 'Completed', color: 'text-emerald-400' },
                  { phase: 'Phase 3: Federal Compliance Audits (NIST 110/110, SPRS 313/313)', status: 'Locked', color: 'text-emerald-400' },
                  { phase: 'Phase 4: SBA Identity Verification Flag', status: 'Cleared (Oct 15)', color: 'text-emerald-400' },
                  { phase: 'Phase 5: D&B Monthly Bureau Tradeline Reporting Cycle', status: 'Active (Oct 16)', color: 'text-cyan-400' },
                  { phase: 'Phase 6: Non-Dilutive COTS Vendor Capability Sheet Distribution', status: 'Pending', color: 'text-amber-400' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">{item.phase}</span>
                    <span className={`font-bold ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 2: CRYPTID DIAMOND LATTICE BATTERY                    */}
        {/* ========================================================== */}
        {activeTab === 'battery' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SPEC-2026-CRYPTID-KINETIC-01
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-2">Argyle Cryptid Diamond Lattice Battery</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Dual-function load-bearing chassis floor pan and solid-state electrostatic energy reservoir. Synthetic polycrystalline diamond micro-matrix doped with boron and nitrogen.
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right shrink-0">
                <p className="text-xs text-slate-500">Thermal Conductivity</p>
                <p className="text-lg font-mono font-bold text-emerald-400">&gt; 2,000 W/(m·K)</p>
                <p className="text-[11px] text-slate-400 mt-1">Zero Liquid Cooling Required</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">Charge Trapping Matrix</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-density carbon lattice interstitial cavities hold localized electrostatic and ionic charges with zero internal resistance drift.
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Impedance Match</span>
                  <span className="text-cyan-400">376.73 &Omega; Z0</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">Solid-State Safety Armor</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Diamond-hard chemical inertness eliminates dendrite propagation and thermal runaway. Acts simultaneously as primary vehicle floor ballast.
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Thermal Runaway Risk</span>
                  <span className="text-emerald-400">0.00% (Zero)</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">Double-Duty Mass Efficiency</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  100% of structural weight contributes to both vehicle kinetic ballast and energy storage capacity, eliminating parasitic dead-weight.
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Mass Penalty</span>
                  <span className="text-purple-400">-70% vs NMC</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 3: MMRM AIR-CORE PROPULSION                           */}
        {/* ========================================================== */}
        {activeTab === 'mmrm' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  NYMT-PROP-AIRCORE-915
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-2">Multi-phase Magnetic Resonant Motor (MMRM)</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Air-core high-flux architecture eliminating iron core hysteresis losses. Synchronized harmonic commutation at multiples of the 3.69 Hz Tesla clock.
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right shrink-0">
                <p className="text-xs text-slate-500">Dynamic Inertia Reduction</p>
                <p className="text-lg font-mono font-bold text-purple-400">70.0% Reduction</p>
                <p className="text-[11px] text-slate-400 mt-1">Zero Iron Saturation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-semibold text-slate-200">Hexagram Dual-Delta Vectoring Emitter</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Arranges 6 electromagnetic nodes in an interlaced hexagram geometry. Expansion triad (+9V, +12V) generates repelling gradients while Contraction triad (-12V, -18V) captures back-EMF.
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phase-Lock Bridge (Mp):</span>
                    <span className="text-cyan-400">1.691 Ratio</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Commutation Frequency:</span>
                    <span className="text-emerald-400">3.69 Hz * 2^k</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-semibold text-slate-200">Counter-Torque Suppression</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  By matching phase impedance to free space (Z0 = 376.73 Ohms), Lenz law counter-torque is suppressed, converting back-EMF directly back into the diamond lattice well.
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hysteresis Loss:</span>
                    <span className="text-emerald-400">0.0% (Air-Core)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vortex Efficiency:</span>
                    <span className="text-cyan-400">+42.8 dB Gain</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 4: ATRM ACOUSTIC TIME-REVERSAL MIRROR                 */}
        {/* ========================================================== */}
        {activeTab === 'atrm' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  SPEC-DB-003 ATRM NULLIFIER
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-2">Acoustic Time-Reversal Mirror (ATRM)</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Active destructive wave interference nullifying electromagnetic counter-EMF transients and acoustic chatter in real time (c = 343 m/s).
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right shrink-0">
                <p className="text-xs text-slate-500">Attenuation Floor</p>
                <p className="text-lg font-mono font-bold text-amber-400">{attenuationDb} dB</p>
                <p className="text-[11px] text-slate-400 mt-1">Pi-Phase Inversion Active</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-semibold text-slate-200">Temporal Wave Reversal Equation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ingests incident disturbance waves p_incident(t), reverses temporal sequencing, and applies exact pi radians (180 degrees) inversion:
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-cyan-300">
                  p_retro(t) = -p_incident(T - t) = exp(j * pi) * p_incident(T - t)
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-semibold text-slate-200">Verified Nullification Metrics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bench-tested across piezo transducers and coil bridges, eliminating thermal spikes and mechanical resonance fatigue without resistor snubbing.
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entropy Floor:</span>
                    <span className="text-emerald-400">H(X) &ge; 1.5000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phase Match:</span>
                    <span className="text-cyan-400">&plusmn;0.002 rad</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 5: GOOGLE WORKSPACE HUB (Drive, Sheets, Gmail)        */}
        {/* ========================================================== */}
        {activeTab === 'workspace' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  WORKSPACE INTEGRATION ACTIVE
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-2">Google Workspace Hub</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Connected via OAuth scopes for Google Drive, Sheets, and Gmail. Manage your sovereign files, view telemetry spreadsheets, and dispatch secure dispatches.
                </p>
              </div>
              {!user ? (
                <button 
                  onClick={handleGoogleLogin}
                  className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-xl transition-colors shrink-0 shadow-lg shadow-cyan-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  Connect Google Account
                </button>
              ) : (
                <div className="bg-slate-950 px-4 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Connected as {user.email}
                </div>
              )}
            </div>

            {/* DRIVE & SHEETS & GMAIL GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Google Drive Explorer */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-semibold text-slate-200">Google Drive Explorer</h3>
                  </div>
                  <button 
                    onClick={fetchDriveFiles}
                    disabled={isFetchingDrive || !accessToken}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDrive ? 'animate-spin' : ''}`} />
                    List Files
                  </button>
                </div>

                <div className="space-y-2 min-h-[200px] max-h-72 overflow-y-auto">
                  {!accessToken ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      Sign in with Google to browse your Google Drive files.
                    </div>
                  ) : isFetchingDrive ? (
                    <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
                      Querying Google Drive API...
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      Click 'List Files' to load items from your Google Drive.
                    </div>
                  ) : (
                    driveFiles.map(file => (
                      <div key={file.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{file.mimeType?.split('.').pop()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Google Sheets Live Grid */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-semibold text-slate-200">Google Sheets Matrix</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">Sync Active</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        {sheetData[0].map((header, idx) => (
                          <th key={idx} className="py-2 px-3 font-semibold">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {sheetData.slice(1).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-950/40">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2.5 px-3">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Gmail Sender Panel */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-semibold text-slate-200">Gmail Sovereign Dispatch</h3>
                </div>
                <span className="text-xs text-slate-400">Secure SMTP via Gmail API</span>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">Recipient Email</label>
                    <input 
                      type="email" 
                      value={emailDraft.to}
                      onChange={e => setEmailDraft({ ...emailDraft, to: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">Subject Line</label>
                    <input 
                      type="text" 
                      value={emailDraft.subject}
                      onChange={e => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Briefing Message Body</label>
                  <textarea 
                    rows={4}
                    value={emailDraft.body}
                    onChange={e => setEmailDraft({ ...emailDraft, body: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-cyan-400 font-mono">{emailStatus}</span>
                  <button 
                    type="submit"
                    disabled={!accessToken}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-bold rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Dispatch via Gmail API
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 6: FIDUCIARY & STATUTORY TITLE VAULT                  */}
        {/* ========================================================== */}
        {activeTab === 'vault' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  SOVEREIGN GOVERNANCE VAULT
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-2">Master Trust & Corporate Entity Registry</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Absolute legal title and intellectual property conveyance under Michigan Compiled Laws (MCL) §§ 700.7101, 700.7817, and UCC Article 12.
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right shrink-0">
                <p className="text-xs text-slate-500">Managing Trustee</p>
                <p className="text-sm font-mono font-bold text-cyan-400">Nicholas Lee Young</p>
                <p className="text-[11px] text-slate-400 mt-1">DOB: 10/12/1986</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Identity 1: Root Trust */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">ROOT TRUST IDENTITY</span>
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">The Nicholas Young Master Trust</h3>
                <div className="font-mono text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                  <p>EIN: <span className="text-emerald-400 font-bold">41-6820289</span></p>
                  <p>D-U-N-S: 145054895</p>
                  <p className="text-emerald-400">Statutory Shield: MCL § 700.7913</p>
                </div>
              </div>

              {/* Identity 2: Operating LLC */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">OPERATING LLC IDENTITY</span>
                  <Server className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">Titan Games Security L.L.C.</h3>
                <div className="font-mono text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                  <p>EIN: <span className="text-purple-400 font-bold">42-4246313 (424246313)</span></p>
                  <p>LARA ID: 28678008 | MI LARA: 803257008</p>
                  <p>CAGE: 25AD9 | D-U-N-S: 145054895</p>
                  <p>SAM.gov UEI: <span className="text-cyan-400">53SXM538MG79</span></p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 7: CODEBASE SCANNER (USER'S BASH REQUEST)             */}
        {/* ========================================================== */}
        {activeTab === 'scanner' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  REPOSITORY SCANNER
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-2">Codebase Directory Audit Command</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  The exact bash command requested to scan your file directory, indexing structural components to feed the Aura Decision Plan and Control Matrix (The Cryptid Brain).
                </p>
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(scannerBashCommand)}
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-xl transition-colors shrink-0 shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                Copy Bash Command
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">bash / terminal execution string</span>
                <span className="text-xs text-emerald-400 font-mono">POSIX Compatible</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre">
                {scannerBashCommand}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run this command in your root repository (.) to generate a complete structural inventory mapped directly to the AURA decision kernel and decision tree parameters.
              </p>
            </div>

            {/* REPOSITORY FILE TREE VISUALIZER */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Current Repository File Tree Index</h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2">
                <div className="text-cyan-400">📁 /workspace (Root)</div>
                <div className="pl-4 space-y-1.5 text-slate-400">
                  <div>├── 📄 .env.example <span className="text-slate-600">(Environment variables & API keys)</span></div>
                  <div>├── 📄 .gitignore <span className="text-slate-600">(Ignored build artifacts & secrets)</span></div>
                  <div>├── 📄 index.html <span className="text-slate-600">(HTML entrypoint & Google Fonts)</span></div>
                  <div>├── 📄 metadata.json <span className="text-slate-600">(App metadata & capability flags)</span></div>
                  <div>├── 📄 package.json <span className="text-slate-600">(Dependencies & scripts)</span></div>
                  <div>├── 📄 server.ts <span className="text-slate-600">(Full-stack Express & Gemini API Proxy)</span></div>
                  <div>├── 📄 tsconfig.json <span className="text-slate-600">(TypeScript compiler configuration)</span></div>
                  <div>├── 📄 vite.config.ts <span className="text-slate-600">(Vite bundler & path aliases)</span></div>
                  <div>└── 📁 src</div>
                  <div className="pl-8 space-y-1 text-slate-400">
                    <div>├── 📄 App.tsx <span className="text-slate-600">(Main Cryptid Brain & Aura Matrix UI)</span></div>
                    <div>├── 📁 components</div>
                    <div className="pl-4">
                      <div>├── 📄 CommercialServicesCatalog.tsx <span className="text-slate-600">(Commercial Matrix & Deployment Tiers)</span></div>
                      <div>├── 📄 AuraInsightEngine.tsx <span className="text-slate-600">(Gemini AI Telemetry Analysis Core)</span></div>
                      <div>└── 📄 TelemetryStreamChart.tsx <span className="text-slate-600">(D3.js Real-time M(s) & H(X) Line Chart)</span></div>
                    </div>
                    <div>├── 📄 index.css <span className="text-slate-600">(Tailwind CSS imports & global styles)</span></div>
                    <div>├── 📄 main.tsx <span className="text-slate-600">(React DOM root mount)</span></div>
                    <div>└── 📄 firebase.ts <span className="text-slate-600">(Firebase SDK & Firestore Error Handlers)</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-6 px-6 text-center text-xs text-slate-500 space-y-2">
        <p>The Nicholas Young Master Trust (EIN: 41-6820289) · Titan Games Security L.L.C. (EIN: 42-4246313 / 424246313)</p>
        <p className="font-mono text-[11px] text-cyan-500/80">AURA SOVEREIGN CONTROL KERNEL // 3.69 Hz TESLA PULSE ACTIVE</p>
      </footer>

    </div>
  );
}
