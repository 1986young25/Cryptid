import React, { useState, useId } from 'react';
import { 
  Shield, 
  Building2, 
  Cpu, 
  Terminal, 
  Coins, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Copy, 
  Check, 
  Sliders, 
  Lock, 
  Download, 
  Mail, 
  Briefcase, 
  Zap, 
  Sparkles,
  Compass,
  FileCheck2,
  HardDrive,
  Radio,
  Share2
} from 'lucide-react';

interface CommercialServicesCatalogProps {
  userEmail?: string | null;
  onSendDispatchEmail?: (subject: string, body: string) => Promise<boolean>;
}

export const CommercialServicesCatalog: React.FC<CommercialServicesCatalogProps> = ({
  userEmail,
  onSendDispatchEmail,
}) => {
  const [activeCatalogPillar, setActiveCatalogPillar] = useState<number>(1);
  const [selectedTier, setSelectedTier] = useState<'tier0' | 'tier1' | 'tier2' | 'tier3'>('tier2');
  
  // Tier 0 Calculator state
  const [developerMonthlyRevenue, setDeveloperMonthlyRevenue] = useState<number>(6500);

  // Tier 1 Calculator state
  const [tier1Nodes, setTier1Nodes] = useState<number>(2);
  const [tier1BillingCycle, setTier1BillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Tier 2 Calculator state
  const [tier2AdditionalNodes, setTier2AdditionalNodes] = useState<number>(3);

  // Tier 3 Calculator state
  const [tier3ContractBudget, setTier3ContractBudget] = useState<number>(350000);

  // Add-on selection state
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({
    'bare-metal-bench': 2,
    'can-mavlink-tune': 1,
    'ledger-migration': 2, // 2 million records
    'airgap-dr': 0,
    'trust-ip-consult': 1,
    'executive-advisory': 8 // 8 hours
  });

  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Unique IDs for accessibility
  const devRevSliderId = useId();
  const tier1NodesSliderId = useId();
  const tier2OverageSliderId = useId();
  const tier3BudgetSliderId = useId();

  // Pricing calculations
  const calculateTier0 = () => {
    const floor = 2000;
    const taxableGross = Math.max(0, developerMonthlyRevenue - floor);
    const monthlyRoyalty = taxableGross * 0.30;
    const developerRetained = developerMonthlyRevenue - monthlyRoyalty;
    return {
      monthlyRoyalty,
      developerRetained,
      floor,
      termMonths: 60,
      total5YearRoyalty: monthlyRoyalty * 60,
    };
  };

  const calculateTier1 = () => {
    const onboarding = 7500 * tier1Nodes;
    if (tier1BillingCycle === 'annual') {
      const annualBase = 48000 * tier1Nodes;
      return {
        annualCost: annualBase + onboarding,
        recurringYearly: annualBase,
        effectiveMonthly: (annualBase / 12),
        onboarding,
        savingsAnnual: (4500 * 12 - 48000) * tier1Nodes
      };
    } else {
      const monthlyBase = 4500 * tier1Nodes;
      return {
        annualCost: (monthlyBase * 12) + onboarding,
        recurringYearly: monthlyBase * 12,
        effectiveMonthly: monthlyBase,
        onboarding,
        savingsAnnual: 0
      };
    }
  };

  const calculateTier2 = () => {
    const clusterBase = 195000; // includes 5 master nodes + 20 edge satellites
    const overageMonthly = tier2AdditionalNodes * 3200;
    const annualOverage = overageMonthly * 12;
    return {
      totalAnnual: clusterBase + annualOverage,
      clusterBase,
      overageMonthly,
      totalMasterNodes: 5 + tier2AdditionalNodes,
      totalEdgeSatellites: 20 + (tier2AdditionalNodes * 4),
    };
  };

  // Addons metadata
  const addonDefinitions = [
    {
      id: 'bare-metal-bench',
      name: 'Bare-Metal Hardware Node Provisioning & Benchmarking',
      billing: 'Flat Rate / Node',
      unitCost: 3500,
      unitLabel: 'nodes',
      desc: 'Physical rack isolation, custom POSIX daemon binding, line-rate socket tuning, and hardware baseline certification.'
    },
    {
      id: 'can-mavlink-tune',
      name: 'Custom Vehicle CAN / MAVLink Physical Signal Tuning',
      billing: 'Fixed Engagement (2-week sprint)',
      unitCost: 15000,
      unitLabel: 'sprints',
      desc: 'MAVLink 14550 vector lock, real-time sensor conditioning (EMA α=0.2), and 10-cycle persistence debounce.'
    },
    {
      id: 'ledger-migration',
      name: 'Enterprise Fiduciary Ledger Migration (CSV/SQL -> UCC Seals)',
      billing: 'Per 1M Records',
      unitCost: 5000,
      unitLabel: 'million records',
      desc: 'Deterministic transformation of legacy enterprise database logs into line-rate UCC-CER-NYMT-XB6 state hashes.'
    },
    {
      id: 'airgap-dr',
      name: 'On-Premises Air-Gapped Disaster Recovery Deployment',
      billing: 'Fixed Fee',
      unitCost: 25000,
      unitLabel: 'deployments',
      desc: 'Full sovereign failover appliance deployment capable of autonomous warm reboot without external network reachability.'
    },
    {
      id: 'trust-ip-consult',
      name: 'Statutory Trust & IP Titling Architectural Consultation',
      billing: 'Retainer / Engagement',
      unitCost: 10000,
      unitLabel: 'engagements',
      desc: 'MCL § 700.7913 statutory verification, patent continuation linkage under USPTO #64/014,873, and unencumbered asset titling.'
    },
    {
      id: 'executive-advisory',
      name: 'Executive Systems Architecture Advisory (Nicholas Lee Young)',
      billing: 'Hourly Retainer ($500/hr, 4 hr min)',
      unitCost: 500,
      unitLabel: 'hours',
      desc: 'Direct consultation on asymmetric systems engineering, zero-commingling treasury governance, and DARPA SBIR alignment.'
    }
  ];

  const calculateAddonsTotal = () => {
    return addonDefinitions.reduce((acc, addon) => {
      const qty = selectedAddons[addon.id] || 0;
      return acc + (qty * addon.unitCost);
    }, 0);
  };

  const getEstimatedGrandTotal = () => {
    const addonsTotal = calculateAddonsTotal();
    if (selectedTier === 'tier0') {
      return {
        label: 'Developer Upfront + Addons',
        upfront: addonsTotal,
        note: 'Tier 0 stack license is $0.00 upfront with 30% gross royalty above $2,000/mo'
      };
    }
    if (selectedTier === 'tier1') {
      const t1 = calculateTier1();
      return {
        label: 'Annual Commitment + Calibration + Addons',
        upfront: t1.annualCost + addonsTotal,
        note: `Includes ${tier1Nodes} node(s) with ${tier1BillingCycle === 'annual' ? 'annual pre-payment' : 'monthly billing structure'}`
      };
    }
    if (selectedTier === 'tier2') {
      const t2 = calculateTier2();
      return {
        label: 'Google Cloud Marketplace Spend Commit',
        upfront: t2.totalAnnual + addonsTotal,
        note: `Covers 5 core + ${tier2AdditionalNodes} overage master nodes, drawdown via cloudcommerceprocurement`
      };
    }
    return {
      label: 'Federal Defense Milestone Base + Addons',
      upfront: tier3ContractBudget + addonsTotal,
      note: 'Fixed-Price or Cost-Plus Milestone Draw under Active CAGE/SAM clearance'
    };
  };

  const generateRequisitionDoc = () => {
    const t0 = calculateTier0();
    const t1 = calculateTier1();
    const t2 = calculateTier2();
    const grand = getEstimatedGrandTotal();

    return `TITAN GAMES SECURITY L.L.C. // COMMERCIAL REQUISITION & STATEMENT OF INTENT
════════════════════════════════════════════════════════════════════════════════════
HOLDING TRUST   : The Nicholas Young Master Trust (EIN: 41-6820289)
OPERATING ARM   : Titan Games Security L.L.C. (EIN: 42-4246313 / 42-4264313 | LARA ID: 28678008)
CLEARANCES      : CAGE: 25AD9 | SAM.gov: 53SXM538MG79 | DUNS: 145054895 | ARI/DARPA: #21270632
PROCUREMENT     : Direct PO / Corporate ACH / Google Cloud Marketplace (cloudcommerceprocurement)
COMPLIANCE      : NIST SP 800-171 Rev 2 (110/110) | DoD SPRS (313/313) | Experian Intelliscore A
════════════════════════════════════════════════════════════════════════════════════

1. SELECTED COMMERCIAL TIER: ${selectedTier.toUpperCase()}
${selectedTier === 'tier0' ? `
* Program: The Second Chance Sovereign Forge (Humanitarian Reentry Covenant)
* Upfront Stack Licensing: $0.00 USD
* Exemption Floor: First $2,000.00/month 100% retained by developer
* Royalty Structure: 30% Gross Covenant on revenue exceeding $2,000.00/mo
* Projected Developer Monthly Gross: $${developerMonthlyRevenue.toLocaleString()}
* Monthly Covenant Settlement: $${t0.monthlyRoyalty.toLocaleString()}
* Developer Net Retained: $${t0.developerRetained.toLocaleString()}
* Term: Exactly 60 calendar months (5 years) -> 100% Expiration & Complete Independence` : ''}${selectedTier === 'tier1' ? `
* Program: Sovereign Edge Appliance (Commercial / Industrial Bare-Metal)
* Nodes Provisioned: ${tier1Nodes} node(s)
* Billing Cadence: ${tier1BillingCycle.toUpperCase()}
* One-Time Onboarding & Calibration: $${t1.onboarding.toLocaleString()}
* Annual License Total: $${t1.recurringYearly.toLocaleString()}
* Combined Year 1 Capital Outlay: $${t1.annualCost.toLocaleString()}
* SLA Level: 99.9% Deterministic Hardware Uptime` : ''}${selectedTier === 'tier2' ? `
* Program: Enterprise Hyperscale Mesh & Marketplace Suite
* Primary Enterprise Cluster: $195,000.00/year (5 Master Nodes + 20 Edge Satellites)
* Additional Master Nodes: ${tier2AdditionalNodes} node(s) @ $3,200.00/mo ($${(t2.overageMonthly * 12).toLocaleString()}/yr)
* Total Deployment Footprint: ${t2.totalMasterNodes} Master Nodes + ${t2.totalEdgeSatellites} Satellite Nodes
* Total Annual Marketplace Commitment: $${t2.totalAnnual.toLocaleString()}
* Billing Channel: Google Cloud Marketplace Drawdown (cloudcommerceprocurement.googleapis.com)
* SLA Level: 99.99% Hardware Enclave with Sub-Hour Emergency Response` : ''}${selectedTier === 'tier3' ? `
* Program: Federal Defense, Aerospace & Critical Infrastructure (SBIR/STTR & Direct)
* Baseline Milestone Draw: $${tier3ContractBudget.toLocaleString()} USD
* Engagement Model: Fixed-Price Milestone Contract / Cost-Plus Incentive Subcontract
* Hardware Enclave: Air-Gapped Zero-Cloud Bare-Metal POSIX Enclaves
* Vector Resonance: Z_0 = 376.5 Ω ATRM Free-Space Matching & 3.69 Hz Tesla Synchrony
* Patent Continuity: Formalities Letter verification under USPTO #64/014,873` : ''}

2. SPECIALIZED PROFESSIONAL SERVICES & ADD-ONS:
${addonDefinitions.map(a => {
  const count = selectedAddons[a.id] || 0;
  if (count === 0) return null;
  return `* ${a.name} [${count} ${a.unitLabel}]: $${(count * a.unitCost).toLocaleString()}`;
}).filter(Boolean).join('\n') || '* None selected'}
Add-ons Subtotal: $${calculateAddonsTotal().toLocaleString()}

3. FINANCIAL SUMMARY & SETTLEMENT DISPATCH:
* Grand Requisition Estimate: $${grand.upfront.toLocaleString()} USD
* Settlement Channels: Net-30 Invoicing (Paydex 75+), Google Cloud Marketplace Drawdown, or Corporate ACH
* Fiduciary Settlement: Titan Games Security L.L.C. operating account -> The Nicholas Young Master Trust (EIN: 41-6820289)

Generated via Titan Games Security Commercial Dispatch Matrix: ${new Date().toISOString()}`;
  };

  const handleCopyQuote = () => {
    const text = generateRequisitionDoc();
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  const handleDownloadPO = () => {
    const text = generateRequisitionDoc();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TITAN_REQUISITION_${selectedTier.toUpperCase()}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEmailDispatch = async () => {
    if (!onSendDispatchEmail) {
      setEmailStatus('Workspace dispatch is available when signed in with Google.');
      setTimeout(() => setEmailStatus(null), 4000);
      return;
    }
    setIsSendingEmail(true);
    setEmailStatus('Dispatching commercial requisition package via Google Workspace Gmail...');
    try {
      const subject = `[COMMERCIAL REQUISITION] Titan Games Security - Tier ${selectedTier.toUpperCase()} Requisition Spec`;
      const body = generateRequisitionDoc();
      const success = await onSendDispatchEmail(subject, body);
      if (success) {
        setEmailStatus('Requisition statement transmitted successfully to your Google Workspace account.');
      } else {
        setEmailStatus('Transmit notice: Please verify Gmail send permissions in Google Workspace tab.');
      }
    } catch {
      setEmailStatus('Notice: Ensure Google Workspace token is active.');
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setEmailStatus(null), 5000);
    }
  };

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 0: MASTER ENTITY & CLEARANCES BANNER                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Banner Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
                Commercial Matrix & Deployment Tiers
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-slate-400">Cash-Flowing Sovereign Framework</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-cyan-400 shrink-0" />
              TITAN GAMES SECURITY L.L.C.
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Commercial Services Catalog, Federal Contracting Vehicles & Sovereign Reentry Covenant
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={handleCopyQuote}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors font-medium border border-slate-700/60"
            >
              {copiedQuote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedQuote ? 'Copied to Clipboard' : 'Copy Requisition Spec'}
            </button>
            <button
              onClick={handleDownloadPO}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors font-medium border border-slate-700/60"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Download .TXT Requisition
            </button>
            {onSendDispatchEmail && (
              <button
                onClick={handleEmailDispatch}
                disabled={isSendingEmail}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                {isSendingEmail ? 'Dispatching...' : 'Email Requisition via Gmail'}
              </button>
            )}
          </div>
        </div>

        {emailStatus && (
          <div className="mt-3 p-3 bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-300 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{emailStatus}</span>
          </div>
        )}

        {/* Master Identity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 text-xs font-mono">
          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold">Root Holding Trust</span>
            <div className="font-bold text-slate-200">The Nicholas Young Master Trust</div>
            <div className="text-cyan-400">EIN: 41-6820289</div>
            <div className="text-[11px] text-slate-400 font-sans">Governed under MCL § 700.7913</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold">Operating Entity</span>
            <div className="font-bold text-slate-200">Titan Games Security L.L.C.</div>
            <div className="text-cyan-400">EIN: 42-4246313 · 42-4264313</div>
            <div className="text-[11px] text-slate-400 font-sans">LARA ID: 28678008 · DBA: A&N</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold">Federal Clearances</span>
            <div className="text-emerald-400 font-bold">CAGE: 25AD9 (Active)</div>
            <div className="text-slate-300">SAM.gov: 53SXM538MG79</div>
            <div className="text-[11px] text-slate-400 font-sans">DUNS: 145054895 · DARPA ARI #21270632</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold">Procurement & Scores</span>
            <div className="text-amber-300 font-bold">NIST SP 800-171: 110/110</div>
            <div className="text-slate-300">DoD SPRS: 313/313 · Exp. Grade A</div>
            <div className="text-[11px] text-cyan-400 truncate">cloudcommerceprocurement</div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: COMPREHENSIVE CATALOG OF SERVICES (5 PILLARS)            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Part 1</span>
            <h3 className="text-lg font-bold text-white">Comprehensive Catalog of Services</h3>
            <p className="text-xs text-slate-400">
              Five core engineering disciplines bridging bare-metal enclaves, cyber-physical kinetic filtering, and cryptographic title ledgers.
            </p>
          </div>
          
          {/* Pillar Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs font-medium">
            {[
              { id: 1, label: '1. Sovereign Edge' },
              { id: 2, label: '2. Kinetic & Robotics' },
              { id: 3, label: '3. Fiduciary Audit' },
              { id: 4, label: '4. Hyperscale AI' },
              { id: 5, label: '5. Second Chance' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveCatalogPillar(p.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeCatalogPillar === p.id 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pillar Details */}
        {activeCatalogPillar === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <HardDrive className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">Bare-Metal POSIX Runtime Deployment</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hardening physical client server racks, ruggedized field laptops, and industrial nodes into zero-cloud-rent POSIX enclaves that process compute, memory bounds, and state operations independently of hyperscaler uptime.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-cyan-400">
                Daemon: sovereign_node.py · C1M Throughput
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">In-Memory Shannon Entropy Defense Gates</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integration of mathematical payload sieves (H(X) &lt; 1.5000) that intercept and neutralize code-injection, memory buffer exploits, and hostile scripts at line rate via bitwise inversion (~arr) before CPU parsing.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
                Clock: 34.86 ns execution clock · Zero drops
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">Modulo-9 Plane Separation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Architectural decoupling of inbound telemetry buses using digital root modulo-9 filters to mathematically guarantee that raw sensor data streams can never bridge into control registers or privileged operating system daemon shells.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-purple-400">
                Invariant: root(sanitized) ∈ [1..9] isolations
              </div>
            </div>
          </div>
        )}

        {activeCatalogPillar === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Radio className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">MAVLink & CAN Bus Signal Conditioning</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time physical filtering of vehicle and drone swarm sensors using Exponential Moving Average (α=0.2) smoothing and 10-cycle persistence debounce logic, eliminating mechanical false alarms caused by road shock, ballistic vibration, or acoustic noise.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-cyan-400">
                Protocol: MAVLink Port 14550 · α=0.2 EMA
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">Dynamic Wave-Impedance Tuning</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synchronizing communication transmission timing with free-space wave impedance invariants (Z₀ = 376.5 Ω / 376.73 Ω) and harmonic metronomic cadences (3.69 Hz / 271.003 ms) for secure, resonant mesh routing and phase-conjugated transmission.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-amber-400">
                Anchor: ATRM -42.6 dB phase conjugation
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Compass className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">4D Geospatial Digital Twin Ingress</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-velocity binding of physical mobile field units (ruggedized nodes, tactical field phones) to central coordinate command anchors with sub-second GIS rasterization (.geojson, .kml) and live AI anomaly detection.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
                Rate: 13.2M+ vectors/sec covariance ingest
              </div>
            </div>
          </div>
        )}

        {activeCatalogPillar === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">Nanosecond State-Sealing Integration</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Replacing vulnerable, human-editable application logs with local, line-rate SQLite and plaintext audit ledgers anchored by SHA-256 state roots, guaranteeing absolute non-repudiation during defense or corporate forensic reviews.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-cyan-400">
                Storage: Dual-commit SQLite + CSV export
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">UCC Proof-of-Reserve Engines</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generating automated, tamper-proof state hashes prefixed with UCC-CER-NYMT-XB6-... that deterministically link software runtime performance directly to balance-sheet assets, fiduciary trust reserves, and statutory title filings.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
                Prefix: UCC-CER-NYMT-XB6-2026-TITAN
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Terminal className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">CDC Persistence Daemons</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous background logging daemons (cdc_feedback.py) that track every database delta with nanosecond timestamps, providing indisputable real-time proof of solvency and operational compliance for regulatory and audit bodies.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-purple-400">
                Daemon: cdc_feedback.py · Non-stop delta loop
              </div>
            </div>
          </div>
        )}

        {activeCatalogPillar === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">Inverted Hyperscale AI Bridging</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configuring Google Cloud (Vertex AI, Gemini 2.5/3.8 Flash) as an external auxiliary reasoning tool, allowing enterprise customers to perform semantic analysis and telemetry triage without ceding root execution authority or data residency.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-cyan-400">
                Architecture: Edge-Authoritative Auxiliary AI
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">Actions API Dispatch & Edge Tool-Calling</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated routing of bare-metal triggers to cloud actions, notifications, and webhooks via actions.googleapis.com while maintaining strict zero-trust boundary seals and zero inbound network holes.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-amber-400">
                Gateway: actions.googleapis.com outbound
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Building2 className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">Marketplace Procurement Integration</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Assisting corporate clients in routing software acquisition through Google Cloud Marketplace billing (cloudcommerceprocurement) to draw down existing committed cloud spend while deploying zero-cloud-rent hardware.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
                Vehicle: cloudcommerceprocurement.googleapis.com
              </div>
            </div>
          </div>
        )}

        {activeCatalogPillar === 5 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Coins className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">The Second Chance Sovereign Forge</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Empowering returning citizens and formerly incarcerated developers to launch sovereign software and cybersecurity operations with $0.00 upfront capital. Complete turnkey distribution of functional edge software engines, POSIX daemons, and security filters.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
                Capital Required: $0.00 Upfront Acquisition
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-slate-100 text-sm">ISRA Reentry Covenant Administration</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated tracking of commercial covenants via sovereign cryptographic ledgers, ensuring fair, capped 5-year royalty collection (30% gross) strictly above the first $2,000/month living expense exemption floor, culminating in 100% royalty expiration.
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-cyan-400">
                Floor: First $2,000/mo exempt · Term: 60 Months
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: COMMERCIAL PRICING ARCHITECTURE & DEPLOYMENT TIERS      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Part 2</span>
            <h3 className="text-lg font-bold text-white">Commercial Pricing Architecture & Deployment Tiers</h3>
            <p className="text-xs text-slate-400">
              Select a deployment tier to configure nodes, review deliverables, and calculate exact commercial settlement outlays.
            </p>
          </div>
        </div>

        {/* 4 Deployment Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* TIER 0 */}
          <div 
            onClick={() => setSelectedTier('tier0')}
            className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
              selectedTier === 'tier0'
                ? 'bg-slate-900 border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">TIER 0</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Humanitarian
                </span>
              </div>
              <h4 className="text-base font-bold text-white">Second Chance Forge</h4>
              <div className="space-y-1">
                <div className="text-2xl font-black text-emerald-400">$0.00</div>
                <div className="text-xs text-slate-400 font-mono">Upfront acquisition cost</div>
              </div>
              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>30% Gross (Revenue &gt; $2k/mo)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>$2,000/mo Living Expense Floor</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Exact 60-Month Sunset (5 Yrs)</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Post-Term: 100% Free & Clear</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* TIER 1 */}
          <div 
            onClick={() => setSelectedTier('tier1')}
            className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
              selectedTier === 'tier1'
                ? 'bg-slate-900 border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase">TIER 1</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                  Industrial
                </span>
              </div>
              <h4 className="text-base font-bold text-white">Commercial Appliance</h4>
              <div className="space-y-1">
                <div className="text-2xl font-black text-cyan-400">$4,500</div>
                <div className="text-xs text-slate-400 font-mono">per month / node ($48k/yr upfront)</div>
              </div>
              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>SLA: 99.9% Deterministic</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Shannon Entropy Sieve (H &lt; 1.5)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>MAVLink / CAN Debounce (α=0.2)</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Calibration: $7,500 / node</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </div>
          </div>

          {/* TIER 2 */}
          <div 
            onClick={() => setSelectedTier('tier2')}
            className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
              selectedTier === 'tier2'
                ? 'bg-slate-900 border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-purple-400 font-semibold uppercase">TIER 2</span>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                  Marketplace
                </span>
              </div>
              <h4 className="text-base font-bold text-white">Enterprise Hyperscale</h4>
              <div className="space-y-1">
                <div className="text-2xl font-black text-purple-400">$195,000</div>
                <div className="text-xs text-slate-400 font-mono">annual cluster (5 master + 20 edge)</div>
              </div>
              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>SLA: 99.99% Hardware Enclave</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Google Cloud Commit Drawdown</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Dual SQLite + CDC State Seals</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Overage: $3,200/mo/master</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            </div>
          </div>

          {/* TIER 3 */}
          <div 
            onClick={() => setSelectedTier('tier3')}
            className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
              selectedTier === 'tier3'
                ? 'bg-slate-900 border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-400 font-semibold uppercase">TIER 3</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  Defense / SBIR
                </span>
              </div>
              <h4 className="text-base font-bold text-white">Defense & Aerospace</h4>
              <div className="space-y-1">
                <div className="text-2xl font-black text-amber-400">$150k – $750k+</div>
                <div className="text-xs text-slate-400 font-mono">firm-fixed or cost-plus milestone</div>
              </div>
              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>CAGE: 25AD9 & SAM.gov Active</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Air-Gapped Zero-Cloud Hardware</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Patent Continuity (#64/014,873)</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>DARPA ARI #21270632 Ready</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>

        </div>

        {/* Selected Tier Interactive Configuration & Simulator */}
        <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Interactive Tier Deployment Modeler: {selectedTier.toUpperCase()}
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">Real-time parameters</span>
          </div>

          {selectedTier === 'tier0' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <label htmlFor={devRevSliderId} className="text-xs font-semibold text-slate-300 flex justify-between">
                    <span>Developer Monthly Gross Revenue</span>
                    <span className="text-emerald-400 font-mono font-bold">${developerMonthlyRevenue.toLocaleString()} / mo</span>
                  </label>
                  <input 
                    id={devRevSliderId}
                    type="range"
                    min="1500"
                    max="30000"
                    step="500"
                    value={developerMonthlyRevenue}
                    onChange={(e) => setDeveloperMonthlyRevenue(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Under the Sovereign Reentry Covenant, the first <strong className="text-emerald-400">$2,000.00/mo</strong> is 100% retained by the developer as a basic living expense floor. The 30% royalty applies solely to gross earnings exceeding $2,000.00/mo.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Living Expense Exemption:</span>
                    <span className="text-slate-200 font-bold">$2,000.00 / mo</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Taxable Revenue Band:</span>
                    <span className="text-slate-200">${Math.max(0, developerMonthlyRevenue - 2000).toLocaleString()} / mo</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-2">
                    <span>Titan 30% Gross Royalty:</span>
                    <span>${calculateTier0().monthlyRoyalty.toLocaleString()} / mo</span>
                  </div>
                  <div className="flex justify-between text-cyan-300 font-bold">
                    <span>Developer Net Retained:</span>
                    <span>${calculateTier0().developerRetained.toLocaleString()} / mo</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Covenant Term: 60 months (5 years) -&gt; 100% Royalty Expiration and complete unencumbered ownership.
                  </div>
                </div>
              </div>

              {/* Tier 0 Deliverables */}
              <div className="border-t border-slate-800 pt-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">Included Deliverables:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Pre-configured POSIX daemon templates (sovereign_node.py, proxy_shield.py)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>In-memory Shannon Entropy threat filter module (H(X) &lt; 1.5000)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Local immutable SQLite audit ledger pipeline with nanosecond timestamps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Integration access to the Titan developer mesh and verified peer network</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTier === 'tier1' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor={tier1NodesSliderId} className="text-xs font-semibold text-slate-300 flex justify-between">
                      <span>Physical Hardware Nodes</span>
                      <span className="text-cyan-400 font-mono font-bold">{tier1Nodes} Node{tier1Nodes > 1 ? 's' : ''}</span>
                    </label>
                    <input 
                      id={tier1NodesSliderId}
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={tier1Nodes}
                      onChange={(e) => setTier1Nodes(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Billing Cadence:</span>
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        onClick={() => setTier1BillingCycle('annual')}
                        className={`px-3 py-1 rounded-md transition-all font-medium ${tier1BillingCycle === 'annual' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400'}`}
                      >
                        Annual ($48,000/yr upfront - 11% off)
                      </button>
                      <button
                        onClick={() => setTier1BillingCycle('monthly')}
                        className={`px-3 py-1 rounded-md transition-all font-medium ${tier1BillingCycle === 'monthly' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400'}`}
                      >
                        Monthly ($4,500/mo)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>One-Time Silicon Calibration:</span>
                    <span className="text-slate-200">${calculateTier1().onboarding.toLocaleString()} ($7.5k/node)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Annual License Base:</span>
                    <span className="text-slate-200">${calculateTier1().recurringYearly.toLocaleString()} / yr</span>
                  </div>
                  {calculateTier1().savingsAnnual > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Annual Upfront Discount:</span>
                      <span>-${calculateTier1().savingsAnnual.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-cyan-300 font-bold border-t border-slate-800 pt-2">
                    <span>Year 1 Total Outlay:</span>
                    <span>${calculateTier1().annualCost.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    SLA: 99.9% Deterministic · Standard 8x5 business day support
                  </div>
                </div>
              </div>

              {/* Tier 1 Deliverables */}
              <div className="border-t border-slate-800 pt-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">Included Deliverables:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Native x86 / ARM64 bare-metal daemon deployment with dedicated memory bounds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Active in-memory Shannon Entropy security sieve (H(X) &lt; 1.5) running at line rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>MAVLink / CAN bus telemetry conditioning with EMA (α=0.2) debounce filters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Local SQLite audit ledger capturing real-time nanosecond timestamps</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTier === 'tier2' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <label htmlFor={tier2OverageSliderId} className="text-xs font-semibold text-slate-300 flex justify-between">
                    <span>Additional Master Nodes (Beyond 5 Included)</span>
                    <span className="text-purple-400 font-mono font-bold">+{tier2AdditionalNodes} Master Nodes</span>
                  </label>
                  <input 
                    id={tier2OverageSliderId}
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={tier2AdditionalNodes}
                    onChange={(e) => setTier2AdditionalNodes(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Base enterprise cluster provides <strong>5 Master Nodes + 20 Edge Satellites</strong> for $195,000/yr. Each additional master node is billed at <strong>$3,200/month</strong>, eligible for immediate drawdown against existing Google Cloud committed platform credits.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Enterprise Cluster Base:</span>
                    <span className="text-slate-200 font-bold">$195,000.00 / yr</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Master Node Overage ({tier2AdditionalNodes} nodes):</span>
                    <span className="text-slate-200">${(calculateTier2().overageMonthly * 12).toLocaleString()} / yr</span>
                  </div>
                  <div className="flex justify-between text-purple-300 font-bold border-t border-slate-800 pt-2">
                    <span>Total Annual Cloud Spend Drawdown:</span>
                    <span>${calculateTier2().totalAnnual.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Total Managed Footprint:</span>
                    <span className="text-slate-200">{calculateTier2().totalMasterNodes} Masters / {calculateTier2().totalEdgeSatellites} Satellites</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Procurement: Direct or cloudcommerceprocurement.googleapis.com · SLA: 99.99% Hardware Enclave
                  </div>
                </div>
              </div>

              {/* Tier 2 Deliverables */}
              <div className="border-t border-slate-800 pt-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">Included Deliverables:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Full deployment of the Titan 4D Enclave & Telemetry Twin command dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Dual-commit storage pipeline: Local high-speed SQLite + continuous CSV compliance exports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Google Cloud Agent Platform (Project NYMT26) with Vertex AI (Gemini Flash/Pro) semantic triage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Autonomous CDC feedback daemon (cdc_feedback.py) generating verified UCC-CER-NYMT state seals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>24/7/365 mission-critical support with guaranteed sub-hour response SLA</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTier === 'tier3' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <label htmlFor={tier3BudgetSliderId} className="text-xs font-semibold text-slate-300 flex justify-between">
                    <span>Statement of Work (SOW) Milestone Baseline</span>
                    <span className="text-amber-400 font-mono font-bold">${tier3ContractBudget.toLocaleString()} USD</span>
                  </label>
                  <input 
                    id={tier3BudgetSliderId}
                    type="range"
                    min="150000"
                    max="1000000"
                    step="25000"
                    value={tier3ContractBudget}
                    onChange={(e) => setTier3ContractBudget(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tailored for federal defense prime contractors, municipal tracking operations, and defense agencies operating under SBIR/STTR solicitations (DARPA-PA-26-07). Active CAGE <strong>25AD9</strong> and SAM.gov registration.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Contracting Model:</span>
                    <span className="text-slate-200">Fixed-Price Milestone / Cost-Plus</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Prime / Sub Contractor CAGE:</span>
                    <span className="text-emerald-400 font-bold">25AD9 (Active)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SAM.gov UEI:</span>
                    <span className="text-slate-200">53SXM538MG79</span>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold border-t border-slate-800 pt-2">
                    <span>Target Solicitation Allocation:</span>
                    <span>${tier3ContractBudget.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    NIST SP 800-171: 110/110 · SPRS: 313/313 · DARPAConnect ARI #21270632
                  </div>
                </div>
              </div>

              {/* Tier 3 Deliverables */}
              <div className="border-t border-slate-800 pt-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">Included Deliverables:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Air-gapped, zero-cloud bare-metal tactical hardware security enclaves</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Hardened spatial coordinate tracking over custom GIS overlays (.geojson, .kml)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Vacuum wave impedance synchronization (Z₀ = 376.5 Ω) and 3.69 Hz cycle resonance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Formalities Letter verification under USPTO Patent Application #64/014,873</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 3: SPECIALIZED PROFESSIONAL SERVICES & ADD-ONS TABLE       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Part 3</span>
            <h3 className="text-lg font-bold text-white">Specialized Professional Services & Implementation Add-Ons</h3>
            <p className="text-xs text-slate-400">
              Granular engineering sprint modules and fiduciary consultations billable directly into project requisitions.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-mono">Selected Add-Ons Subtotal:</span>
            <div className="text-lg font-bold font-mono text-cyan-400">${calculateAddonsTotal().toLocaleString()}</div>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase">
                <th className="py-3 px-4 font-semibold">Service Module</th>
                <th className="py-3 px-4 font-semibold">Billing Model</th>
                <th className="py-3 px-4 font-semibold">Rate / Pricing</th>
                <th className="py-3 px-4 font-semibold text-center">Requisition Units</th>
                <th className="py-3 px-4 font-semibold text-right">Extended Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {addonDefinitions.map((addon) => {
                const count = selectedAddons[addon.id] || 0;
                const subtotal = count * addon.unitCost;
                return (
                  <tr key={addon.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{addon.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{addon.desc}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {addon.billing}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-300 font-semibold whitespace-nowrap">
                      ${addon.unitCost.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
                        <button
                          onClick={() => {
                            setSelectedAddons(prev => ({
                              ...prev,
                              [addon.id]: Math.max(0, (prev[addon.id] || 0) - 1)
                            }));
                          }}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-slate-100">{count}</span>
                        <button
                          onClick={() => {
                            setSelectedAddons(prev => ({
                              ...prev,
                              [addon.id]: (prev[addon.id] || 0) + 1
                            }));
                          }}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-right text-slate-100 whitespace-nowrap">
                      ${subtotal.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 4: COMMERCIAL TERMS & SETTLEMENT CHANNELS                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Part 4</span>
          <h3 className="text-lg font-bold text-white">Commercial Terms & Settlement Channels</h3>
          <p className="text-xs text-slate-400">
            Three certified corporate settlement channels ensuring zero-friction capital flows and unencumbered asset accumulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          
          {/* Channel 1 */}
          <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold font-mono">
              <Briefcase className="w-4 h-4" />
              <span>Standard Invoicing (Net-30)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Available for verified commercial and defense prime accounts holding <strong>D-U-N-S Paydex scores of 75+</strong> or established corporate credit facilities (Mercury IO, Ramp, Stripe Issuing).
            </p>
            <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px] font-mono">
              D-U-N-S: 145054895 · ACH / Fedwire
            </div>
          </div>

          {/* Channel 2 */}
          <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-semibold font-mono">
              <Building2 className="w-4 h-4" />
              <span>Pre-Committed Cloud Spend</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Enterprise clients can settle Tier 2 software licenses directly via their existing <strong>Google Cloud Billing account</strong>, utilizing committed marketplace credits (<code className="text-purple-300">cloudcommerceprocurement</code>).
            </p>
            <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px] font-mono">
              Marketplace API: cloudcommerceprocurement
            </div>
          </div>

          {/* Channel 3 */}
          <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono">
              <Shield className="w-4 h-4" />
              <span>Internal Trust Accounting</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              All royalties, node licenses, and contract disbursements settle directly into the commercial operating accounts of <strong>Titan Games Security L.L.C.</strong>, with net retained earnings transferring to <strong>The Nicholas Young Master Trust (EIN 41-6820289)</strong>.
            </p>
            <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px] font-mono">
              Governing Code: MCL § 700.7913
            </div>
          </div>

        </div>

        {/* Grand Total Callout & Dispatch Actions */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {getEstimatedGrandTotal().label}
            </span>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              ${getEstimatedGrandTotal().upfront.toLocaleString()} USD
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{getEstimatedGrandTotal().note}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyQuote}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors font-medium border border-slate-700 text-xs"
            >
              {copiedQuote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedQuote ? 'Copied' : 'Copy Requisition'}
            </button>
            <button
              onClick={handleDownloadPO}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-colors shadow-md shadow-cyan-500/20 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export Formal Requisition (.TXT)
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
