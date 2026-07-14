import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Users, Calendar, DollarSign, Plus, Trash2, Shuffle, 
  CheckCircle, Lock, Edit2, Save, Share2, ArrowLeft, 
  Beer, Monitor, Target, AlertTriangle, LogOut, Eye
} from 'lucide-react';

// Importações do Firebase
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// ============================================================================
// 1. CONFIGURAÇÕES BASE
// ============================================================================

const BRAND = {
  name: "Copa SMI 2026",
  logo: "/SMI.png",
  arenaLogo: "/ARENA.png",
  arenaLink: "https://www.instagram.com/arenaultrarp/",
  sponsors: [
    { url: "/RPAUTO.png", link: "https://www.instagram.com/ribeiraopires.automoveis/" },
    { url: "/GALTER.png", link: "https://www.instagram.com/galteracessorios/" },
    { url: "/IDEALIZA.png", link: "https://www.instagram.com/idealizaimoveis/" },
    { url: "/EVOLUTION.png", link: "https://www.instagram.com/evolutioncosmeticos/" },
    { url: "/FPA.png", link: "https://www.instagram.com/fpaimports/" }
  ]
};

const ADMIN_PASSWORD = "admin"; 
const UNIFORM_PRICE = 50; 
const GAME_PRICE = 20; 
const DRINK_PRICE = 30;

const INITIAL_PLAYERS = [];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ============================================================================
// 2. COMPONENTES REUTILIZÁVEIS
// ============================================================================

const Card = ({ children, className = "" }) => (
  <div className={`rounded-md border border-[#323238] bg-[#202024] ${className}`}>{children}</div>
);

const Button = ({ onClick, children, variant = 'primary', className = "", type = "button", disabled = false }) => {
  const styles = {
    primary: "bg-red-600 text-white hover:bg-red-700 transition-colors",
    secondary: "bg-transparent text-[#C4C4CC] hover:text-[#E1E1E6] hover:bg-[#29292E] transition-colors",
    danger: "bg-transparent text-red-500 hover:bg-red-500/10 transition-colors",
    success: "bg-[#04D361] text-white hover:bg-[#04b856] transition-colors",
    outline: "bg-transparent border border-[#323238] text-[#C4C4CC] hover:bg-[#29292E] transition-colors",
    accent: "bg-yellow-500 text-[#121214] hover:bg-yellow-400 transition-colors"
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 ${styles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>{children}</button>;
};

const Badge = ({ children, color = "gray" }) => {
  const colors = { 
    red: "bg-red-500/10 text-red-500", gray: "bg-[#29292E] text-[#8D8D99]", 
    green: "bg-[#04D361]/10 text-[#04D361]", blue: "bg-blue-500/10 text-blue-500",
    yellow: "bg-yellow-500/10 text-yellow-500"
  };
  return <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colors[color] || colors.gray}`}>{children}</span>;
};

// ============================================================================
// 3. APLICAÇÃO PRINCIPAL (COM FIREBASE)
// ============================================================================

export default function TournamentApp() {
  const [loadingDB, setLoadingDB] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeStageId, setActiveStageId] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareMode, setShareMode] = useState(false);
  const [tvMode, setTvMode] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  
  // Estados da Nuvem
  const [players, setPlayers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stages, setStages] = useState([]);
  const [bets, setBets] = useState([]);

  // Modais e Formulários
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', side: 'R', uniformPaid: false, manualPts: 0 });
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerSide, setNewPlayerSide] = useState("R");
  const [newTrans, setNewTrans] = useState({ desc: "", amount: "", type: "out" });
  const [showTransForm, setShowTransForm] = useState(false);
  const [numGroupsToDraw, setNumGroupsToDraw] = useState(2);
  const [penaltyForm, setPenaltyForm] = useState({ playerId: "", type: "uniform" });
  const [finMonth, setFinMonth] = useState(1);
  const [matchToFinish, setMatchToFinish] = useState(null);

  // SMI BET Auth
  const [loggedBettorId, setLoggedBettorId] = useState(null);
  const [betLoginId, setBetLoginId] = useState("");
  const [betPassword, setBetPassword] = useState("");
  const [betView, setBetView] = useState('jogos');
  const [tempBet, setTempBet] = useState({});

  // --- SINCRONIZAÇÃO COM FIREBASE ---
  useEffect(() => {
    let unsubs = [];
    const setupDB = async () => {
        try {
            // Verifica se o banco já foi criado, senão cria as coleções iniciais
            const snap = await getDoc(doc(db, "smi", "stages"));
            if (!snap.exists()) {
                await setDoc(doc(db, "smi", "players"), { list: INITIAL_PLAYERS });
                await setDoc(doc(db, "smi", "transactions"), { list: [] });
                await setDoc(doc(db, "smi", "bets"), { list: [] });
                await setDoc(doc(db, "smi", "stages"), { list: MONTHS.map((m, i) => ({
                    id: i+1, name: m, status: 'upcoming', nextDate: "", q2Available: true,
                    confirmed: [], entries: [], pairs: [], groups: [], matches: [], penalties: [],
                    tv: { q1: null, q2: null }
                }))});
            }

            // Escuta as alterações na nuvem em tempo real
            unsubs = [
                onSnapshot(doc(db, "smi", "players"), d => { if(d.exists()) setPlayers(d.data().list || []) }),
                onSnapshot(doc(db, "smi", "stages"), d => { if(d.exists()) setStages(d.data().list || []) }),
                onSnapshot(doc(db, "smi", "transactions"), d => { if(d.exists()) setTransactions(d.data().list || []) }),
                onSnapshot(doc(db, "smi", "bets"), d => { if(d.exists()) setBets(d.data().list || []) })
            ];
            setLoadingDB(false);
        } catch (error) {
            console.error("Erro ao conectar no Firebase:", error);
            alert("Erro de conexão com o banco. Verifique suas regras do Firestore.");
        }
    };
    setupDB();
    return () => unsubs.forEach(u => u());
  }, []);

  // FUNÇÕES DE ESCRITA NA NUVEM
  const syncPlayers = (arr) => setDoc(doc(db, "smi", "players"), { list: arr });
  const syncStages = (arr) => setDoc(doc(db, "smi", "stages"), { list: arr });
  const syncTrans = (arr) => setDoc(doc(db, "smi", "transactions"), { list: arr });
  const syncBets = (arr) => setDoc(doc(db, "smi", "bets"), { list: arr });

  // --- LÓGICA DE DADOS (RANKING) ---
  const ranking = useMemo(() => {
    let raw = players.map(p => {
      let pts = p.manualPts || 0, j=0, pf=0, ps=0, v=0;
      stages.forEach(s => {
        if (s.status !== 'upcoming') {
           const pair = s?.pairs?.find(x => x.p1 === p.id || x.p2 === p.id);
           if (pair) { j++; if (s.status === 'finished') pts += (pair.pts || 0); }
           s?.matches?.forEach(m => {
             if (m.f) {
                const inA = m.pa?.p1 === p.id || m.pa?.p2 === p.id;
                const inB = m.pb?.p1 === p.id || m.pb?.p2 === p.id;
                if (inA) { pf+=m.sA; ps+=m.sB; if(m.sA>m.sB) v++; }
                else if (inB) { pf+=m.sB; ps+=m.sA; if(m.sB>m.sA) v++; }
             }
           });
           s?.penalties?.filter(pen=>pen.pid===p.id).forEach(pen => pts += pen.pts);
        }
      });
      return { ...p, pts, j, pf, ps, s: pf-ps, v };
    });
    return raw.sort((a,b) => b.v - a.v || b.s - a.s || b.pf - a.pf || a.ps - b.ps);
  }, [players, stages]);

  const betRanking = useMemo(() => {
    const allMatches = stages.flatMap(s => s.matches || []);
    let raw = players.map(p => {
        let betPts = 0, acertosPlacar = 0, acertosVencedor = 0;
        bets.filter(b => b.pid === p.id).forEach(b => {
            const m = allMatches.find(x => x.id === b.mid);
            if (m && m.f) {
                if (m.sA === b.sA && m.sB === b.sB) { betPts += 5; acertosPlacar++; } 
                else if ((m.sA > m.sB && b.sA > b.sB) || (m.sA < m.sB && b.sA < b.sB)) { betPts += 2; acertosVencedor++; }
            }
        });
        return { ...p, betPts, acertosPlacar, acertosVencedor };
    });
    return raw.filter(x => x.betPts > 0 || bets.some(b => b.pid === x.id)).sort((a,b) => b.betPts - a.betPts || b.acertosPlacar - a.acertosPlacar);
  }, [players, stages, bets]);

  const financials = useMemo(() => {
    const totalUniforms = players.filter(p=>p.uniformPaid).length * UNIFORM_PRICE;
    const s = stages.find(x=>x.id === finMonth);
    let drink = 0, game = 0, dayuse = 0, caixa = 0;
    
    s?.entries?.forEach(e => {
        if (e.paid) { if (e.drink) drink += DRINK_PRICE; if (e.play) { game += GAME_PRICE; dayuse += 10; caixa += 10; } }
    });

    const outs = transactions.filter(t=>t.sid===finMonth && t.type==='out').reduce((acc,t)=>acc+t.val,0);
    let totalIncome = totalUniforms; let totalExpense = 0;
    stages.forEach(st => { st?.entries?.forEach(e => { if(e.paid) { if(e.drink) totalIncome += DRINK_PRICE; if(e.play) totalIncome += GAME_PRICE; } }); });
    transactions.forEach(t => t.type === 'in' ? totalIncome+=t.val : totalExpense+=t.val);

    return { drink, game, dayuse, caixa, outs, totalBalance: totalIncome - totalExpense, totalUniforms };
  }, [stages, transactions, players, finMonth]);

  const getStageRank = (sid) => {
      const s = stages.find(x=>x.id === sid);
      if(!s || !s.pairs || s.pairs.length === 0) return [];
      return s.pairs.map(p => {
          const ms = (s.matches || []).filter(m => (m.pa?.id===p.id || m.pb?.id===p.id) && m.f);
          let v=0, pf=0, ps=0;
          ms.forEach(m => {
              const my = m.pa?.id===p.id ? m.sA : m.sB;
              const op = m.pa?.id===p.id ? m.sB : m.sA;
              pf+=my; ps+=op; if(my>op) v++;
          });
          return { ...p, v, s: pf-ps, pf, ps };
      }).sort((a,b) => b.v - a.v || b.s - a.s || b.pf - a.pf);
  };

  // --- HANDLERS COM FIREBASE ---
  const updateStage = (sid, data) => syncStages(stages.map(s => s.id === sid ? { ...s, ...data } : s));
  
  const handleLogin = (e) => {
    e.preventDefault(); const pwdInput = document.getElementById('global-pwd');
    if (pwdInput && pwdInput.value === ADMIN_PASSWORD) { setIsAdmin(true); setActiveTab('dashboard'); pwdInput.value = ''; } 
    else { alert("Senha incorreta!"); }
  };
  const handleLogout = () => { setIsAdmin(false); if (activeTab === 'financial_hub') setActiveTab('dashboard'); };

  const handleBetLogin = (e) => {
      e.preventDefault();
      if (!betLoginId) return alert("Selecione seu nome.");
      if (betPassword === "123") { setLoggedBettorId(Number(betLoginId)); setBetPassword(""); } 
      else { alert("Senha incorreta. (Dica de teste: use 123)"); }
  };

  const handleSaveBet = (mid, sA, sB) => {
      if(sA === undefined || sB === undefined || sA === "" || sB === "") return;
      const existing = bets.find(b => b.mid === mid && b.pid === loggedBettorId);
      if(existing) { syncBets(bets.map(b => b.id === existing.id ? { ...b, sA: Number(sA), sB: Number(sB) } : b)); } 
      else { syncBets([...bets, { id: Date.now(), mid, pid: loggedBettorId, sA: Number(sA), sB: Number(sB) }]); }
      setTempBet({...tempBet, [mid]: undefined}); 
  };

  const savePlayerEdit = (pid) => { syncPlayers(players.map(p => p.id === pid ? { ...p, ...editForm, manualPts: Number(editForm.manualPts) || 0 } : p)); setEditingPlayerId(null); };
  const handleAddPlayer = () => { if(newPlayerName) { syncPlayers([...players, {id:Date.now(), name:newPlayerName, side:newPlayerSide, uniformPaid:false, manualPts: 0}]); setShowAddPlayerForm(false); setNewPlayerName(""); }};
  const removePlayer = (pid) => { if(window.confirm("Remover atleta?")) syncPlayers(players.filter(p=>p.id!==pid)); };
  
  const toggleCheckin = (sid, pid) => { const s = stages.find(x=>x.id===sid); const isConf = s.confirmed.includes(pid); const nConf = isConf ? s.confirmed.filter(id=>id!==pid) : [...s.confirmed, pid]; let nEnt = [...s.entries]; if(!isConf && !nEnt.find(e=>e.pid===pid)) { nEnt.push({pid, drink:false, paid:false, play:true}); } updateStage(sid, { confirmed: nConf, entries: nEnt }); };
  const toggleEntryProp = (sid, pid, prop) => { const s = stages.find(x=>x.id===sid); const nEnt = s.entries.map(e=>e.pid===pid?{...e, [prop]:!e[prop]}:e); updateStage(sid, { entries: nEnt }); };
  const redoDraw = (sid) => { if(window.confirm("Isso apagará jogos e apostas da etapa. Confirmar?")) { updateStage(sid, { status: 'registration', pairs: [], groups: [], matches: [], tv: { q1: null, q2: null } }); } };
  
  const drawGroups = (sid) => {
      const s = stages.find(x=>x.id===sid); const playingIds = s.entries.filter(e=>e.play).map(e=>e.pid); const pool = players.filter(p=>s.confirmed.includes(p.id) && playingIds.includes(p.id));
      if(pool.length < 2) return alert("Mínimo 2 jogadores para jogar.");
      let r = pool.filter(p=>p.side==='R'), l = pool.filter(p=>p.side==='L');
      let safe=0; while(Math.abs(r.length-l.length)>1 && safe<50){ if(r.length>l.length)l.push({...r.pop(),temp:'L'}); else r.push({...l.pop(),temp:'R'}); safe++; }
      const shuff = arr => arr.sort(()=>Math.random()-0.5); r=shuff(r); l=shuff(l);
      const pairs=[]; const len=Math.min(r.length, l.length);
      for(let i=0; i<len; i++) pairs.push({id:i+1, p1:r[i].id, p2:l[i].id, pts:0});
      const groups = Array.from({length:numGroupsToDraw}, (_,i)=>({id:i+1, name:`Grupo ${String.fromCharCode(65+i)}`, pairs:[]}));
      pairs.forEach((p,i)=> { groups[i%numGroupsToDraw].pairs.push(p); p.g=groups[i%numGroupsToDraw].id; });
      let matches=[], mid=Date.now(); 
      const groupMatches = groups.map(g => { const gm=[]; for(let i=0; i<g.pairs.length; i++) for(let j=i+1; j<g.pairs.length; j++) gm.push({gId:g.id, pa:g.pairs[i], pb:g.pairs[j]}); return gm; });
      const maxLen = Math.max(...groupMatches.map(gm=>gm.length), 0);
      for(let i=0; i<maxLen; i++) { groups.forEach((_, gIdx) => { if(groupMatches[gIdx][i]) matches.push({id:mid++, stage:'group', ...groupMatches[gIdx][i], sA:0, sB:0, f:false}); }); }
      updateStage(sid, {pairs, groups, matches, status:'active'});
  };

  const genMataMata = (sid) => {
      const s = stages.find(x=>x.id===sid); const ranked = getStageRank(sid); let next=[], base = Date.now();
      if(ranked.length < 8) { 
          const t = ranked.slice(0,4);
          if(t.length===4) next = [{id:base+1, stage:'sf', pa:t[0], pb:t[3], sA:0, sB:0, f:false}, {id:base+2, stage:'sf', pa:t[1], pb:t[2], sA:0, sB:0, f:false}];
      } else { 
          const t = ranked.slice(0,8);
          next = [ {id:base+1, stage:'qf', pa:t[0], pb:t[7], sA:0, sB:0, f:false}, {id:base+2, stage:'qf', pa:t[1], pb:t[6], sA:0, sB:0, f:false}, {id:base+3, stage:'qf', pa:t[2], pb:t[5], sA:0, sB:0, f:false}, {id:base+4, stage:'qf', pa:t[3], pb:t[4], sA:0, sB:0, f:false} ];
      }
      updateStage(sid, { matches: [...(s.matches || []), ...next] });
  };
  
  const advanceBracket = (sid, round) => {
     const s = stages.find(x=>x.id===sid); const done = (s.matches || []).filter(m=>m.stage===round && m.f); let next=[], base = Date.now();
     if(round==='qf' && done.length===4) { const w = done.map(m=>m.sA>m.sB?m.pa:m.pb); next=[{id:base+1, stage:'sf', pa:w[0], pb:w[3], sA:0, sB:0, f:false}, {id:base+2, stage:'sf', pa:w[1], pb:w[2], sA:0, sB:0, f:false}]; }
     if(round==='sf' && done.length===2) { const w = done.map(m=>m.sA>m.sB?m.pa:m.pb); const l = done.map(m=>m.sA>m.sB?m.pb:m.pa); next=[{id:base+3, stage:'final', pa:w[0], pb:w[1], sA:0, sB:0, f:false}, {id:base+4, stage:'3rd', pa:l[0], pb:l[1], sA:0, sB:0, f:false}]; }
     updateStage(sid, { matches: [...(s.matches || []), ...next] });
  };

  const finishStage = (sid) => {
      const s = stages.find(x=>x.id===sid); const pointsMap = {};
      (s.matches || []).filter(m=>m.stage==='qf').forEach(m=>{ const l=m.sA>m.sB?m.pb:m.pa; pointsMap[l.id]=1; });
      const f = (s.matches || []).find(m=>m.stage==='final'); const t3 = (s.matches || []).find(m=>m.stage==='3rd');
      if(f){ const w=f.sA>f.sB?f.pa:f.pb; const l=f.sA>f.sB?f.pb:f.pa; pointsMap[w.id]=5; pointsMap[l.id]=4; }
      if(t3){ const w=t3.sA>t3.sB?t3.pa:t3.pb; const l=t3.sA>t3.sB?t3.pb:t3.pa; pointsMap[w.id]=3; pointsMap[l.id]=2; }
      const newPairs = (s.pairs || []).map(p => ({ ...p, pts: pointsMap[p.id] || 0 })); updateStage(sid, { pairs: newPairs, status: 'finished' });
  };

  const addPenalty = (sid) => { if(penaltyForm.playerId){ const s=stages.find(x=>x.id===sid); updateStage(sid, { penalties: [...(s.penalties || []), { id: Date.now(), pid: parseInt(penaltyForm.playerId), type: penaltyForm.type, pts: -1 }] }); }};

  const menuItems = [
    { id: 'dashboard', icon: Trophy, label: 'Ranking Geral' },
    { id: 'stages', icon: Calendar, label: 'Etapas' },
    { id: 'bet_hub', icon: Target, label: 'SMI Bet' }, 
    { id: 'players_hub', icon: Users, label: 'Atletas' }
  ];
  if (isAdmin) { menuItems.push({ id: 'financial_hub', icon: DollarSign, label: 'Financeiro' }); }
  const currentTabLabel = menuItems.find(i => i.id === activeTab)?.label || 'Acesso Restrito';

  // --- TELA DE CARREGAMENTO DO FIREBASE ---
  if (loadingDB) {
      return <div className="h-screen w-screen bg-[#121214] flex flex-col items-center justify-center space-y-4"><Target className="w-12 h-12 text-red-600 animate-spin" /><span className="text-[#8D8D99] font-bold tracking-widest text-xs uppercase animate-pulse">Conectando à Nuvem...</span></div>;
  }

  // --- VISTA COMPARTILHAMENTO ---
  if(shareMode) {
      return (
        <div className="min-h-screen bg-[#121214] flex items-center justify-center p-4">
          <div className="bg-[#202024] w-full max-w-md rounded-md overflow-hidden shadow-2xl border border-[#323238] relative">
            <div className="bg-red-600 p-6 flex flex-col items-center justify-center"><img src={BRAND.logo} alt="Logo" className="h-16 mb-2 drop-shadow-md" /><h1 className="text-2xl font-black text-white uppercase tracking-tight">Ranking Oficial</h1></div>
            <div className="p-4"><table className="w-full text-left text-[#C4C4CC] text-sm">
                <thead><tr className="border-b border-[#323238] text-xs text-[#8D8D99] uppercase tracking-wider"><th className="pb-2">Pos</th><th className="pb-2">Atleta</th>{showAdvancedStats&&<th className="text-center pb-2">V</th>}<th className="text-right pb-2">Pts</th></tr></thead>
                <tbody className="divide-y divide-[#323238]">{ranking.filter(p => p.j > 0 || p.pts !== 0).slice(0,15).map((p,i) => (
                    <tr key={p.id}>
                      <td className={`py-3 font-bold ${i===0?'text-yellow-500 text-lg':i<3?'text-[#E1E1E6]':'text-[#8D8D99]'}`}>{i+1}º</td>
                      <td className="font-bold text-[#E1E1E6] uppercase">{p.name} <span className="text-[10px] text-[#8D8D99] ml-1 font-normal">({p.side})</span></td>
                      {showAdvancedStats && <td className="text-center text-[#8D8D99]">{p.v}</td>}
                      <td className="text-right font-black text-[#E1E1E6] text-base">{p.pts}</td>
                    </tr>
                ))}</tbody>
              </table></div>
            <div className="bg-[#121214] p-4 flex justify-between items-center border-t border-[#323238]"><div className="flex gap-3 grayscale opacity-50">{BRAND.sponsors.slice(0,3).map((s,i)=><img key={i} src={s.url} alt="Sponsor" className="h-4 object-contain" />)}</div><img src={BRAND.arenaLogo} alt="Arena" className="h-6 grayscale opacity-50"/></div>
          </div>
          <button onClick={()=>setShareMode(false)} className="fixed bottom-6 right-6 bg-[#202024] border border-[#323238] text-[#E1E1E6] px-6 py-3 rounded-md font-bold shadow-lg flex items-center gap-2 hover:bg-[#29292E] transition-all"><ArrowLeft className="w-4 h-4"/> Voltar</button>
        </div>
      );
  }

  // --- MODO TV (TELÃO DA ARENA) ---
  if(tvMode) {
      const stage = stages.find(s=>s.id===activeStageId) || stages[0];
      const stageRank = getStageRank(stage?.id);
      
      return (
          <div className="h-screen bg-[#09090A] text-[#E1E1E6] flex flex-col p-6 gap-6 font-sans">
              <div className="flex justify-between items-center pb-4 border-b border-[#323238]"><img src={BRAND.logo} alt="Logo" className="h-12"/><div className="text-right"><div className="text-xs text-[#04D361] font-bold uppercase tracking-widest flex items-center justify-end gap-2"><span className="w-2 h-2 rounded-full bg-[#04D361] animate-pulse"></span> Ao Vivo</div><div className="text-xl font-black uppercase tracking-tight">{stage?.name || 'Aguardando'}</div></div><button onClick={()=>setTvMode(false)} className="opacity-0 hover:opacity-100">X</button></div>
              <div className="flex-1 grid grid-cols-2 gap-6">
                  {[stage?.tv?.q1, stage?.tv?.q2].map((mid, idx) => {
                      if (idx===1 && !stage?.q2Available) return <Card key={idx} className="flex items-center justify-center bg-[#121214] border-[#323238]"><img src={BRAND.logo} alt="Logo" className="h-24 opacity-5 grayscale"/></Card>;
                      const m = stage?.matches?.find(x=>x.id===mid);
                      if (!m) return <Card key={idx} className="h-full flex items-center justify-center bg-[#121214] border-[#323238]"><img src={BRAND.logo} alt="Logo" className="h-24 opacity-5 grayscale"/></Card>;
                      
                      return (
                          <Card key={idx} className="h-full flex flex-col justify-center items-center p-6 relative overflow-hidden bg-[#202024]">
                               <div className="absolute top-4 left-4 text-xs uppercase text-[#8D8D99] font-bold tracking-widest">{m?.stage}</div>
                               <div className="flex w-full h-full justify-between items-center gap-4">
                                   <div className="flex-1 text-center space-y-2"><div className="text-4xl font-black text-[#E1E1E6] truncate uppercase">{players.find(p=>p.id===m?.pa?.p1)?.name || 'Dupla'}</div><div className="text-2xl font-bold text-[#8D8D99] truncate uppercase">{players.find(p=>p.id===m?.pa?.p2)?.name || 'A'}</div></div>
                                   <div className="px-6 text-8xl font-black text-yellow-500 tabular-nums">{m?.sA || 0}<span className="text-[#323238] text-6xl mx-4">:</span>{m?.sB || 0}</div>
                                   <div className="flex-1 text-center space-y-2"><div className="text-4xl font-black text-[#E1E1E6] truncate uppercase">{players.find(p=>p.id===m?.pb?.p1)?.name || 'Dupla'}</div><div className="text-2xl font-bold text-[#8D8D99] truncate uppercase">{players.find(p=>p.id===m?.pb?.p2)?.name || 'B'}</div></div>
                               </div>
                          </Card>
                      )
                  })}
              </div>
              <div className="h-48">
                  <Card className="h-full bg-[#121214] border-[#323238] p-4 flex">
                      <div className="flex w-full h-full gap-4">
                          <div className="flex-1 border-r border-[#323238] pr-4">
                              <div className="text-xs font-bold text-[#04D361] mb-2 uppercase tracking-widest">Classificados (Top 4)</div>
                              <table className="w-full text-left text-xs text-[#C4C4CC]"><thead className="text-[#8D8D99] uppercase"><tr><th className="pb-2">Dupla</th><th className="pb-2 text-center">V</th><th className="pb-2 text-center">S</th><th className="pb-2 text-center">PF</th></tr></thead><tbody className="divide-y divide-[#323238]">{stageRank.slice(0,4).map(r=><tr key={r.id}><td className="py-2 text-[#E1E1E6] font-bold">D{r.id}</td><td className="text-center text-[#04D361] font-bold">{r.v}</td><td className="text-center">{r.s}</td><td className="text-center">{r.pf}</td></tr>)}</tbody></table>
                          </div>
                          <div className="flex-1 pl-4">
                              <div className="text-xs font-bold text-[#8D8D99] mb-2 uppercase tracking-widest">Aguardando / Eliminados</div>
                              <table className="w-full text-left text-xs text-[#8D8D99]"><thead className="uppercase"><tr><th className="pb-2">Dupla</th><th className="pb-2 text-center">V</th><th className="pb-2 text-center">S</th><th className="pb-2 text-center">PF</th></tr></thead><tbody className="divide-y divide-[#323238]/50">{stageRank.slice(4,8).map(r=><tr key={r.id}><td className="py-2 font-bold">D{r.id}</td><td className="text-center">{r.v}</td><td className="text-center">{r.s}</td><td className="text-center">{r.pf}</td></tr>)}</tbody></table>
                          </div>
                      </div>
                  </Card>
              </div>
              <div className="h-16 bg-[#202024] rounded-md flex items-center justify-between px-8 border border-[#323238]"><div className="flex gap-6 grayscale opacity-60">{BRAND.sponsors.map((s,i)=><img key={i} src={s.url} alt="Sponsor" className="h-6 object-contain"/>)}</div><img src={BRAND.arenaLogo} alt="Arena" className="h-8 grayscale opacity-50" /></div>
          </div>
      );
  }

  // --- ESTRUTURA DASHBOARD HÍBRIDO ---
  return (
    <div className="min-h-screen bg-[#121214] font-sans text-[#E1E1E6] flex">
      
      {/* SIDEBAR (PC) */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-[#202024] border-r border-[#323238] p-6 fixed left-0 top-0 z-30 justify-between">
         <div className="space-y-8">
            <div className="flex items-center gap-3"><img src={BRAND.logo} alt="Logo" className="h-8 w-8 rounded object-cover" /><div className="truncate"><h1 className="text-sm font-bold text-[#E1E1E6] uppercase">{BRAND.name}</h1><p className="text-[10px] text-[#8D8D99] uppercase tracking-wider">Painel Organizador</p></div></div>
            <nav className="space-y-2">{menuItems.map(item => { const Icon = item.icon; const isActive = activeTab === item.id; return (
               <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-all ${isActive ? 'bg-[#29292E] text-[#E1E1E6] border-l-2 border-red-600' : 'text-[#C4C4CC] hover:text-[#E1E1E6] hover:bg-[#29292E]'}`}><Icon className="w-5 h-5"/>{item.label}</button>
            )})}
            </nav>
         </div>
         <div className="pt-4 border-t border-[#323238]">
            {isAdmin ? (
               <div className="space-y-2"><div className="text-[10px] text-[#04D361] font-bold tracking-widest uppercase px-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#04D361]"></span> Staff Online</div><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold text-[#8D8D99] hover:bg-[#29292E] hover:text-red-500 transition-colors"><LogOut className="w-4 h-4"/>Encerrar Sessão</button></div>
            ) : (
               <button onClick={() => setActiveTab('admin_login')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold text-[#8D8D99] hover:bg-[#29292E] hover:text-[#E1E1E6] transition-colors"><Lock className="w-4 h-4"/>Acesso Restrito</button>
            )}
         </div>
      </aside>

      {/* ÁREA CENTRAL */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
         <header className="bg-[#121214]/90 backdrop-blur-md border-b border-[#323238] p-5 sticky top-0 z-20 flex justify-between items-center max-w-5xl w-full mx-auto md:px-8">
            <div className="flex items-center gap-3 md:hidden"><img src={BRAND.logo} alt="Logo" className="h-8" /><h1 className="text-md font-black text-white uppercase">{BRAND.name}</h1></div>
            <div className="hidden md:flex flex-col"><h2 className="text-lg font-bold text-[#E1E1E6]">{currentTabLabel}</h2></div>
            <div className="flex gap-2">
               {isAdmin && activeTab === 'stages' && <button onClick={()=>setTvMode(true)} className="text-[10px] font-bold tracking-wider uppercase bg-[#202024] text-[#E1E1E6] border border-[#323238] px-3 py-1.5 rounded-md flex items-center gap-2 hover:bg-[#29292E] transition-all"><Monitor className="w-4 h-4"/> Ligar TV</button>}
               <div className="md:hidden">{isAdmin ? <button onClick={handleLogout} className="p-2 rounded-md text-red-500 hover:bg-[#29292E]"><LogOut className="w-5 h-5"/></button> : <button onClick={()=>setActiveTab('admin_login')} className="p-2 rounded-md text-[#8D8D99] hover:bg-[#29292E]"><Lock className="w-5 h-5"/></button>}</div>
            </div>
         </header>

         <main className="max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
            
            {/* === ABA 1: RANKING GERAL === */}
            {activeTab === 'dashboard' && (
               <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Card className="p-6 border-l-2 border-yellow-500"><p className="text-xs text-[#8D8D99] uppercase font-bold tracking-widest">Líder do Campeonato</p><h3 className="text-3xl font-black text-[#E1E1E6] uppercase mt-2">{ranking[0]?.name || '-'}</h3><div className="flex gap-2 mt-4"><div className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded text-xs font-bold">{ranking[0]?.pts || 0} PTS</div><div className="bg-[#29292E] text-[#C4C4CC] px-3 py-1 rounded text-xs font-bold">V: {ranking[0]?.v || 0}</div></div></Card>
                     <Card className="p-6 border-l-2 border-red-600"><p className="text-xs text-[#8D8D99] uppercase font-bold tracking-widest">Mês Operante</p><h3 className="text-2xl font-black text-[#E1E1E6] mt-2 uppercase">{stages.find(s=>s.status!=='finished')?.name || 'Encerrada'}</h3><div className="mt-4 flex gap-2 items-center"><Badge color={stages.find(s=>s.status!=='finished')?.status==='active'?'green':'gray'}>{stages.find(s=>s.status!=='finished')?.status==='active'?'Em Andamento':'Aguardando'}</Badge>{stages.find(s=>s.status!=='finished')?.nextDate && <span className="text-xs font-bold text-[#8D8D99]">{new Date(stages.find(s=>s.status!=='finished').nextDate+'T12:00:00').toLocaleDateString('pt-BR')}</span>}</div></Card>
                  </div>
                  <Card className="p-0">
                     <div className="p-6 border-b border-[#323238] flex justify-between items-center"><h3 className="font-bold text-[#E1E1E6] flex gap-2 items-center text-lg"><Trophy className="w-5 h-5 text-yellow-500"/> Classificação Geral</h3><div className="flex gap-2"><Button variant="secondary" onClick={()=>setShowAdvancedStats(!showAdvancedStats)} className="px-2 py-1"><Eye className="w-4 h-4"/></Button><Button variant="secondary" onClick={()=>setShareMode(true)} className="text-[10px] py-1 gap-1"><Share2 className="w-3 h-3"/> Exportar</Button></div></div>
                     <div className="overflow-x-auto"><table className="w-full text-left text-sm text-[#C4C4CC]"><thead className="text-xs text-[#8D8D99] border-b border-[#323238] uppercase tracking-wider bg-[#29292E]"><tr><th className="p-4 font-medium">Pos</th><th className="font-medium">Atleta</th>{showAdvancedStats && <th className="text-center font-medium">J</th>}{showAdvancedStats && <><th className="text-center font-medium">V</th><th className="text-center font-medium">S</th><th className="text-center font-medium">PF</th><th className="text-center font-medium">PS</th></>}<th className="text-right p-4 font-medium">Pts</th></tr></thead><tbody className="divide-y divide-[#323238]">{ranking.map((p,i)=><tr key={p.id} className="hover:bg-[#29292E] transition-colors"><td className="p-4 font-bold text-yellow-500">{i+1}º</td><td className="font-bold text-[#E1E1E6] uppercase">{p.name} <span className="text-[10px] text-[#8D8D99] ml-1 font-normal">({p.side})</span></td>{showAdvancedStats && <td className="text-center text-xs text-[#8D8D99]">{p.j}</td>}{showAdvancedStats && <><td className="text-center font-bold text-[#E1E1E6]">{p.v}</td><td className="text-center font-bold text-blue-400">{p.s>0?`+${p.s}`:p.s}</td><td className="text-center text-xs text-[#8D8D99]">{p.pf}</td><td className="text-center text-xs text-[#8D8D99]">{p.ps}</td></>}<td className="text-right p-4 font-bold text-[#E1E1E6] text-base">{p.pts}</td></tr>)}</tbody></table>{ranking.length === 0 && <p className="text-center text-sm text-[#8D8D99] py-12">Nenhum atleta cadastrado.</p>}</div>
                  </Card>
               </div>
            )}

            {/* === ABA: SMI BET === */}
            {activeTab === 'bet_hub' && (
               <div className="space-y-6 animate-in fade-in duration-200">
                   {!loggedBettorId ? (
                       <div className="flex flex-col items-center justify-center min-h-[50vh]">
                           <Card className="p-8 w-full max-w-sm text-center border-yellow-500/30">
                               <Target className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                               <h3 className="text-2xl font-black text-[#E1E1E6] mb-1 uppercase tracking-tight">SMI BET</h3>
                               <p className="text-sm text-[#8D8D99] mb-6">Aposte nos jogos e suba no ranking da resenha.</p>
                               <form onSubmit={handleBetLogin} className="flex flex-col gap-4">
                                   <select className="w-full bg-[#121214] border border-[#323238] text-[#E1E1E6] rounded-md px-4 py-3 outline-none focus:border-yellow-500 font-bold" value={betLoginId} onChange={e=>setBetLoginId(e.target.value)}>
                                       <option value="">Quem é você?</option>
                                       {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                   </select>
                                   <input type="password" placeholder="Senha do Atleta" className="w-full bg-[#121214] border border-[#323238] text-[#E1E1E6] rounded-md px-4 py-3 text-center text-sm tracking-widest outline-none focus:border-yellow-500" value={betPassword} onChange={e=>setBetPassword(e.target.value)} />
                                   <Button type="submit" variant="accent" className="py-3 mt-2">Entrar para Apostar</Button>
                                   <p className="text-[10px] text-[#8D8D99] mt-2 italic">Acesso Restrito: Digite 123</p>
                               </form>
                           </Card>
                       </div>
                   ) : (
                       <div className="space-y-6">
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#202024] p-6 rounded-md border border-[#323238]">
                               <div>
                                   <h2 className="text-lg font-bold text-[#8D8D99]">Bem-vindo de volta,</h2>
                                   <p className="text-2xl font-black text-[#E1E1E6] uppercase">{players.find(p=>p.id===loggedBettorId)?.name}</p>
                               </div>
                               <div className="flex gap-4 items-center w-full md:w-auto">
                                   <div className="bg-[#121214] border border-yellow-500/50 px-4 py-2 rounded-md text-center flex-1 md:flex-none">
                                       <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Seus Pontos</div>
                                       <div className="text-2xl font-black text-white">{betRanking.find(x=>x.id===loggedBettorId)?.betPts || 0}</div>
                                   </div>
                                   <button onClick={()=>setLoggedBettorId(null)} className="p-3 bg-[#29292E] text-[#8D8D99] hover:text-red-500 rounded-md transition-colors"><LogOut className="w-5 h-5"/></button>
                               </div>
                           </div>
                           
                           <div className="flex gap-2 overflow-x-auto border-b border-[#323238] pb-4">
                               <button onClick={()=>setBetView('jogos')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${betView === 'jogos' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' : 'bg-[#202024] text-[#8D8D99] border-[#323238] hover:bg-[#29292E]'}`}>Palpites Abertos</button>
                               <button onClick={()=>setBetView('ranking')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${betView === 'ranking' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' : 'bg-[#202024] text-[#8D8D99] border-[#323238] hover:bg-[#29292E]'}`}>Ranking da Resenha</button>
                           </div>

                           {betView === 'jogos' && (
                               <div className="space-y-4">
                                   <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-[#04D361] animate-pulse"></span> <span className="text-xs text-[#8D8D99] font-bold uppercase">Jogos Disponíveis</span></div>
                                   <div className="grid md:grid-cols-2 gap-4">
                                       {stages.find(s=>s.status==='active')?.matches?.filter(m=>!m.f).map(m => {
                                           const myBet = bets.find(b => b.mid === m.id && b.pid === loggedBettorId);
                                           const isEditing = tempBet[m.id] !== undefined;
                                           const sAToShow = isEditing ? tempBet[m.id].sA : (myBet ? myBet.sA : '');
                                           const sBToShow = isEditing ? tempBet[m.id].sB : (myBet ? myBet.sB : '');

                                           return (
                                           <Card key={m.id} className="p-4 border-l-2 border-l-[#323238] hover:border-l-yellow-500 transition-colors">
                                               <div className="flex justify-between items-center mb-4 border-b border-[#323238] pb-2">
                                                   <Badge color="gray">{m.stage}</Badge>
                                                   {myBet && !isEditing && <Badge color="green"><CheckCircle className="w-3 h-3 inline mr-1"/>Palpite Salvo</Badge>}
                                               </div>
                                               <div className="flex justify-between items-center gap-4">
                                                   <div className="text-center flex-1"><div className="font-black text-[#E1E1E6] text-sm uppercase truncate">{players.find(p=>p.id===m.pa?.p1)?.name || 'D?'}</div><div className="font-bold text-[#8D8D99] text-xs uppercase truncate">{players.find(p=>p.id===m.pa?.p2)?.name || 'A'}</div></div>
                                                   <div className="flex items-center gap-2">
                                                       <input type="number" disabled={myBet && !isEditing} className={`w-10 h-10 text-center rounded-md font-black text-lg outline-none transition-colors ${myBet && !isEditing ? 'bg-[#121214] text-yellow-500 border border-yellow-500/30' : 'bg-[#29292E] text-[#E1E1E6] border border-[#323238] focus:border-yellow-500'}`} placeholder="-" value={sAToShow} onChange={e=>setTempBet({...tempBet, [m.id]:{sA:e.target.value, sB:tempBet[m.id]?.sB||''}})} />
                                                       <span className="text-[#8D8D99] font-bold">x</span>
                                                       <input type="number" disabled={myBet && !isEditing} className={`w-10 h-10 text-center rounded-md font-black text-lg outline-none transition-colors ${myBet && !isEditing ? 'bg-[#121214] text-yellow-500 border border-yellow-500/30' : 'bg-[#29292E] text-[#E1E1E6] border border-[#323238] focus:border-yellow-500'}`} placeholder="-" value={sBToShow} onChange={e=>setTempBet({...tempBet, [m.id]:{sA:tempBet[m.id]?.sA||'', sB:e.target.value}})} />
                                                   </div>
                                                   <div className="text-center flex-1"><div className="font-black text-[#E1E1E6] text-sm uppercase truncate">{players.find(p=>p.id===m.pb?.p1)?.name || 'D?'}</div><div className="font-bold text-[#8D8D99] text-xs uppercase truncate">{players.find(p=>p.id===m.pb?.p2)?.name || 'B'}</div></div>
                                               </div>
                                               <div className="mt-4 pt-4 border-t border-[#323238] flex justify-end">
                                                   {myBet && !isEditing ? (
                                                       <Button variant="secondary" onClick={()=>setTempBet({...tempBet, [m.id]: {sA: myBet.sA, sB: myBet.sB}})} className="text-[10px]">Alterar Palpite</Button>
                                                   ) : (
                                                       <Button variant="accent" onClick={()=>handleSaveBet(m.id, tempBet[m.id]?.sA, tempBet[m.id]?.sB)} disabled={!tempBet[m.id]?.sA || !tempBet[m.id]?.sB}>Gravar Palpite</Button>
                                                   )}
                                               </div>
                                           </Card>
                                       )})}
                                       {(!stages.find(s=>s.status==='active')?.matches || stages.find(s=>s.status==='active')?.matches?.filter(m=>!m.f).length === 0) && (
                                           <div className="col-span-full p-8 text-center bg-[#202024] rounded-md border border-[#323238]"><Target className="w-8 h-8 text-[#323238] mx-auto mb-2"/><p className="text-[#8D8D99] text-sm font-bold">Nenhum jogo em andamento.</p></div>
                                       )}
                                   </div>
                               </div>
                           )}

                           {betView === 'ranking' && (
                               <Card className="p-0 border-yellow-500/20">
                                   <div className="p-6 border-b border-[#323238] flex justify-between items-center"><h3 className="font-bold text-[#E1E1E6] flex gap-2 items-center text-lg"><Target className="w-5 h-5 text-yellow-500"/> Ranking SMI Bet</h3><Badge color="yellow">Placar Exato: 5pts | Vencedor: 2pts</Badge></div>
                                   <div className="overflow-x-auto"><table className="w-full text-left text-sm text-[#C4C4CC]"><thead className="text-xs text-[#8D8D99] border-b border-[#323238] uppercase tracking-wider bg-[#29292E]"><tr><th className="p-4 font-medium">Pos</th><th className="font-medium">Palpiteiro</th><th className="text-center font-medium">Cravadas</th><th className="text-center font-medium">Acertos</th><th className="text-right p-4 font-medium">Pts Totais</th></tr></thead><tbody className="divide-y divide-[#323238]">{betRanking.map((p,i)=><tr key={p.id} className="hover:bg-[#29292E] transition-colors"><td className="p-4 font-bold text-yellow-500">{i+1}º</td><td className="font-bold text-[#E1E1E6] uppercase">{p.name}</td><td className="text-center font-bold text-[#04D361]">{p.acertosPlacar}</td><td className="text-center text-xs text-[#8D8D99]">{p.acertosVencedor}</td><td className="text-right p-4 font-black text-yellow-500 text-lg">{p.betPts}</td></tr>)}</tbody></table>{betRanking.length === 0 && <p className="text-center text-sm text-[#8D8D99] py-12">Nenhum palpite computado ainda.</p>}</div>
                               </Card>
                           )}
                       </div>
                   )}
               </div>
            )}

            {/* === ABA 2: GERENCIADOR DE ETAPAS === */}
            {activeTab === 'stages' && (
               <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-[#323238]">{stages.map(st => (<button key={st.id} onClick={() => setActiveStageId(st.id)} className={`whitespace-nowrap px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${activeStageId === st.id ? 'bg-red-600/10 text-red-500 border-red-600' : 'bg-[#202024] text-[#8D8D99] border-[#323238] hover:bg-[#29292E] hover:text-[#C4C4CC]'}`}>{st.name}</button>))}</div>
                  {(() => {
                     const s = stages.find(x=>x.id===activeStageId); if(!s) return null;
                     return (
                        <div className="space-y-6">
                           <div className="bg-[#202024] p-6 rounded-md border border-[#323238] flex justify-between items-center">
                              <div><h2 className="text-2xl font-black text-[#E1E1E6] uppercase">{s.name}</h2><div className="mt-2"><Badge color={s.status === 'finished' ? 'gray' : s.status === 'active' ? 'green' : 'blue'}>{s.status === 'finished' ? 'Finalizada' : s.status === 'active' ? 'Em andamento' : 'Inscrições'}</Badge></div></div>
                              {isAdmin && <div className="flex gap-3 items-center"><div className="flex items-center gap-2 bg-[#121214] px-3 py-2 rounded-md border border-[#323238]"><input type="checkbox" checked={s.q2Available} onChange={(e)=>updateStage(s.id, {q2Available:e.target.checked})} className="rounded bg-[#202024] border-[#323238] text-red-600 focus:ring-0"/><span className="text-xs font-bold text-[#8D8D99]">Q2 LIVE</span></div>{(s.status === 'active' || s.status === 'finished') && <Button variant="danger" onClick={() => redoDraw(s.id)}>Resetar Sorteio</Button>}{s.status==='active' && <Button variant="success" onClick={()=>finishStage(s.id)}>Concluir Etapa</Button>}</div>}
                           </div>
                           
                           {isAdmin && (s.status === 'upcoming' || s.status === 'registration') && (
                              <Card className="p-6 border-l-2 border-red-600">
                                 <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                                    <h3 className="font-bold text-[#E1E1E6] text-lg flex items-center gap-2 uppercase tracking-wide"><Users className="w-5 h-5 text-red-500" /> Presença & Sorteio</h3>
                                    <div className="flex gap-2 items-center">{s.status === 'upcoming' ? (<div className="flex gap-2"><input type="date" className="bg-[#121214] border border-[#323238] text-[#E1E1E6] text-sm rounded-md px-3 py-2 outline-none focus:border-red-500" onChange={(e)=>updateStage(s.id, {nextDate:e.target.value})} /><Button onClick={() => updateStage(s.id, {status:'registration'})}>Abrir Chamada</Button></div>) : (<><select className="bg-[#121214] border border-[#323238] text-[#E1E1E6] text-sm rounded-md px-3 py-2 outline-none focus:border-red-500" value={numGroupsToDraw} onChange={(e) => setNumGroupsToDraw(parseInt(e.target.value))}><option value="1">1 Grupo</option><option value="2">2 Grupos</option><option value="3">3 Grupos</option><option value="4">4 Grupos</option></select><Button onClick={() => drawGroups(s.id)}><Shuffle className="w-4 h-4" /> Sortear Chaves</Button></>)}</div>
                                 </div>
                                 {s.status === 'registration' && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{players.map(p => { const c = (s.confirmed || []).includes(p.id); const e = (s.entries || []).find(x=>x.pid===p.id); return <div key={p.id} className={`p-4 border rounded-md cursor-pointer transition-colors ${c ? 'bg-red-500/10 border-red-500/30' : 'bg-[#121214] border-[#323238] hover:border-[#8D8D99]'}`} onClick={()=>toggleCheckin(s.id, p.id)}><div className="flex justify-between items-center"><span className={`font-bold text-sm uppercase ${c?'text-red-500':'text-[#8D8D99]'}`}>{p.name}</span><Badge color={p.side==='R'?'blue':'green'}>{p.side}</Badge></div>{c && <div className="flex gap-2 mt-4 items-center pt-4 border-t border-[#323238]"><button onClick={(ev)=>{ev.stopPropagation(); toggleEntryProp(s.id, p.id, 'paid')}} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${e?.paid?'bg-[#04D361] text-white':'bg-[#29292E] text-[#8D8D99] hover:bg-[#323238]'}`}>Pago</button><button onClick={(ev)=>{ev.stopPropagation(); toggleEntryProp(s.id, p.id, 'drink')}} className={`px-4 py-1.5 rounded transition-colors ${e?.drink?'bg-yellow-500 text-[#121214]':'bg-[#29292E] text-[#8D8D99] hover:bg-[#323238]'}`}><Beer className="w-3.5 h-3.5"/></button><div onClick={ev=>{ev.stopPropagation();toggleEntryProp(s.id, p.id, 'play')}} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase text-center transition-colors ${e?.play?'bg-blue-600 text-white':'bg-[#29292E] text-[#8D8D99] hover:bg-[#323238]'}`}>Joga</div></div>}</div> })}</div>)}
                              </Card>
                           )}

                           {(s.status === 'active' || s.status === 'finished') && (
                              <div className="space-y-6">
                                 <Card className="p-6"><div className="mb-4 text-[#8D8D99] font-bold text-xs uppercase tracking-wider">Duplas Formadas</div><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{(s.pairs || [])?.map(p=><div key={p.id} className="bg-[#121214] p-3 rounded-md flex justify-between items-center border border-[#323238]"><span className="font-bold text-[#8D8D99] text-xs">D{p.id}</span><div className="text-right truncate flex-1"><div className="text-[#E1E1E6] font-bold text-xs uppercase truncate">{players.find(x=>x.id===p.p1)?.name}</div><div className="text-[#8D8D99] font-bold text-[10px] uppercase truncate">{players.find(x=>x.id===p.p2)?.name}</div></div></div>)}</div></Card>
                                 <Card className="p-6">
                                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-[#E1E1E6] text-sm uppercase tracking-wider">Fase de Grupos</h3>{isAdmin && !s.matches?.find(m=>m.stage==='qf') && <Button variant="outline" onClick={()=>genMataMata(s.id)}>Gerar Mata-Mata</Button>}</div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                       {(s.groups || [])?.map(g => {
                                          const stats = (g.pairs || []).map(pair => {
                                             const pairMatches = (s.matches || []).filter(m => (m.pa?.id === pair.id || m.pb?.id === pair.id) && m.f);
                                             let v=0, pro=0, contra=0;
                                             pairMatches.forEach(m => {
                                                   const my = m.pa?.id === pair.id ? m.sA : m.sB; const op = m.pa?.id === pair.id ? m.sB : m.sA;
                                                   pro += my; contra += op; if (my > op) v++;
                                             });
                                             return { ...pair, v, s: pro - contra, pro, contra };
                                          }).sort((a, b) => b.v - a.v || b.s - a.s || b.pro - a.pro);

                                          return (
                                          <div key={g.id} className="bg-[#121214] rounded-md border border-[#323238] overflow-hidden">
                                             <div className="bg-[#29292E] px-4 py-2 text-xs font-bold text-[#E1E1E6] uppercase tracking-widest border-b border-[#323238]">{g.name}</div>
                                             <table className="w-full text-center text-xs text-[#C4C4CC] mb-2">
                                                   <thead className="text-[#8D8D99] font-medium uppercase border-b border-[#323238]/50"><tr><th className="py-3 px-1 text-left pl-4 font-medium">Dupla</th><th className="font-medium">V</th><th className="font-medium">S</th><th className="font-medium">PF</th><th className="font-medium">PS</th></tr></thead>
                                                   <tbody className="divide-y divide-[#323238]/50">{stats.map(row=>(<tr key={row.id} className="hover:bg-[#202024]"><td className="py-2.5 px-1 text-left pl-4 font-bold text-[#E1E1E6]">D{row.id}</td><td className="font-bold text-[#04D361]">{row.v}</td><td className="font-bold text-blue-400">{row.s}</td><td>{row.pro}</td><td>{row.contra}</td></tr>))}</tbody>
                                             </table>
                                             <div className="p-2 bg-[#202024] font-bold text-[10px] text-center text-[#8D8D99] uppercase tracking-widest border-y border-[#323238]">Confrontos</div>
                                             <div className="divide-y divide-[#323238]/50">{(s.matches || [])?.filter(m=>m.gId===g.id).map(m => (
                                                   <div key={m.id} className="p-4 flex justify-between items-center text-sm text-[#E1E1E6] hover:bg-[#202024] transition-colors">
                                                      <span className="w-8 font-bold text-[#8D8D99]">D{m.pa?.id}</span>
                                                      <div className="flex gap-2 items-center"><input type="number" disabled={!isAdmin} className={`w-10 h-10 text-center rounded-md font-bold text-base ${isAdmin?'bg-[#202024] border border-[#323238] focus:border-red-500 outline-none':'bg-transparent border-transparent'}`} value={m.sA} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sA:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/><span className="text-[#8D8D99] font-bold">x</span><input type="number" disabled={!isAdmin} className={`w-10 h-10 text-center rounded-md font-bold text-base ${isAdmin?'bg-[#202024] border border-[#323238] focus:border-red-500 outline-none':'bg-transparent border-transparent'}`} value={m.sB} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sB:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/>{isAdmin && !m.f && <button onClick={()=>setMatchToFinish({sid:s.id, mid:m.id})} className="text-[#04D361] ml-2 p-2 rounded hover:bg-[#04D361]/10 transition-colors"><CheckCircle className="w-5 h-5"/></button>}</div>
                                                      <span className="w-8 text-right font-bold text-[#8D8D99]">D{m.pb?.id}</span>
                                                      {isAdmin && <div className="flex gap-1 ml-4"><button onClick={()=>updateStage(s.id,{tv:{...(s.tv || {}), q1:m.id}})} className={`w-7 h-7 text-[9px] font-bold rounded flex items-center justify-center transition-colors ${s.tv?.q1===m.id?'bg-red-600 text-white':'bg-[#29292E] text-[#8D8D99] hover:bg-[#323238]'}`}>Q1</button>{s.q2Available && <button onClick={()=>updateStage(s.id,{tv:{...(s.tv || {}), q2:m.id}})} className={`w-7 h-7 text-[9px] font-bold rounded flex items-center justify-center transition-colors ${s.tv?.q2===m.id?'bg-red-600 text-white':'bg-[#29292E] text-[#8D8D99] hover:bg-[#323238]'}`}>Q2</button>}</div>}
                                                   </div>
                                             ))}</div>
                                          </div>
                                       )})}
                                    </div>
                                 </Card>
                                 
                                 {/* MATA MATA */}
                                 {(s.matches || [])?.some(m=>m.stage==='qf') && (
                                    <div className="mt-8 pt-8 border-t border-[#323238]">
                                       <h3 className="font-bold text-center text-yellow-500 mb-6 uppercase tracking-widest text-sm">Fase Final (Mata-Mata)</h3>
                                       <div className="overflow-x-auto pb-4"><div className="flex justify-center gap-6 min-w-[600px]">
                                          <div className="w-40 space-y-4"><div className="text-center text-[10px] text-[#8D8D99] uppercase font-bold tracking-widest mb-4">Quartas</div>{(s.matches || []).filter(m=>m.stage==='qf').map(m=>(<div key={m.id} className="bg-[#202024] p-3 rounded-md text-sm border border-[#323238] shadow-sm"><div className="flex justify-between items-center mb-2"><span className="font-bold text-[#8D8D99]">D{m.pa?.id}</span><input disabled={!isAdmin} type="number" className="w-8 h-8 bg-[#121214] text-center text-[#E1E1E6] rounded border border-[#323238] outline-none" value={m.sA} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sA:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div><div className="flex justify-between items-center"><span className="font-bold text-[#8D8D99]">D{m.pb?.id}</span><input disabled={!isAdmin} type="number" className="w-8 h-8 bg-[#121214] text-center text-[#E1E1E6] rounded border border-[#323238] outline-none" value={m.sB} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sB:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div>{isAdmin && !m.f && <button onClick={()=>setMatchToFinish({sid:s.id, mid:m.id})} className="w-full mt-3 bg-transparent text-[#04D361] border border-[#04D361]/30 hover:bg-[#04D361]/10 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">Encerrar</button>}</div>))}{isAdmin && !s.matches.find(m=>m.stage==='sf') && <Button variant="outline" className="w-full mt-4" onClick={()=>advanceBracket(s.id, 'qf')}>Montar Semi</Button>}</div>
                                          <div className="w-40 space-y-8 pt-8"><div className="text-center text-[10px] text-blue-500 uppercase font-bold tracking-widest mb-4">Semi-Final</div>{(s.matches || []).filter(m=>m.stage==='sf').map(m=>(<div key={m.id} className="bg-[#202024] p-3 rounded-md text-sm border border-blue-500/30 shadow-sm"><div className="flex justify-between items-center mb-2"><span className="font-bold text-[#8D8D99]">D{m.pa?.id}</span><input disabled={!isAdmin} type="number" className="w-8 h-8 bg-[#121214] text-center text-[#E1E1E6] rounded border border-[#323238] outline-none" value={m.sA} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sA:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div><div className="flex justify-between items-center"><span className="font-bold text-[#8D8D99]">D{m.pb?.id}</span><input disabled={!isAdmin} type="number" className="w-8 h-8 bg-[#121214] text-center text-[#E1E1E6] rounded border border-[#323238] outline-none" value={m.sB} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sB:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div>{isAdmin && !m.f && <button onClick={()=>setMatchToFinish({sid:s.id, mid:m.id})} className="w-full mt-3 bg-transparent text-[#04D361] border border-[#04D361]/30 hover:bg-[#04D361]/10 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">Encerrar</button>}</div>))}{isAdmin && s.matches.find(m=>m.stage==='sf') && !s.matches.find(m=>m.stage==='final') && <Button variant="outline" className="w-full mt-4" onClick={()=>advanceBracket(s.id, 'sf')}>Montar Final</Button>}</div>
                                          <div className="w-48 space-y-6 pt-16"><div className="text-center text-[10px] text-yellow-500 uppercase font-bold tracking-widest mb-4">Grande Final</div>{(s.matches || []).filter(m=>m.stage==='final').map(m=>(<div key={m.id} className="bg-[#202024] border border-yellow-500/50 p-5 rounded-md text-sm shadow-md"><div className="flex justify-between items-center mb-4"><span className="font-black text-[#E1E1E6]">D{m.pa?.id}</span><input disabled={!isAdmin} type="number" className="w-10 h-10 text-center bg-[#121214] border border-[#323238] text-yellow-500 font-bold rounded-md outline-none" value={m.sA} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sA:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div><div className="flex justify-between items-center"><span className="font-black text-[#E1E1E6]">D{m.pb?.id}</span><input disabled={!isAdmin} type="number" className="w-10 h-10 text-center bg-[#121214] border border-[#323238] text-yellow-500 font-bold rounded-md outline-none" value={m.sB} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sB:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div>{isAdmin && !m.f && <Button className="w-full mt-5 bg-yellow-500 hover:bg-yellow-600 text-[#121214]" onClick={()=>setMatchToFinish({sid:s.id, mid:m.id})}>Encerrar Decisão</Button>}</div>))}{(s.matches || []).filter(m=>m.stage==='3rd').map(m=>(<div key={m.id} className="mt-8 pt-6 border-t border-[#323238] text-center"><div className="text-[10px] text-[#8D8D99] mb-3 uppercase font-bold tracking-widest">3º Lugar</div><div className="bg-[#121214] p-3 rounded-md flex justify-between items-center border border-[#323238]"><span className="font-bold text-[#8D8D99]">D{m.pa?.id}</span><div className="flex gap-2 items-center"><input disabled={!isAdmin} type="number" className="w-8 h-8 bg-[#202024] text-center text-[#E1E1E6] border border-[#323238] rounded font-bold outline-none" value={m.sA} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sA:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/> <span className="text-[10px] text-[#8D8D99]">x</span> <input disabled={!isAdmin} type="number" className="w-8 h-8 bg-[#202024] text-center text-[#E1E1E6] border border-[#323238] rounded font-bold outline-none" value={m.sB} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sB:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div><span className="font-bold text-[#8D8D99]">D{m.pb?.id}</span></div>{isAdmin && !m.f && <Button variant="secondary" className="w-full mt-3" onClick={()=>setMatchToFinish({sid:s.id, mid:m.id})}>Encerrar 3º</Button>}</div>))}</div>
                                       </div></div>
                                    </div>
                                 )}

                                 {isAdmin && (
                                    <Card className="p-6 border-red-500/30">
                                       <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4">Penalidades da Etapa</h4>
                                       <div className="flex flex-wrap gap-3 mb-4"><select className="bg-[#121214] border border-[#323238] text-[#E1E1E6] rounded-md px-4 py-2 text-sm flex-1 outline-none focus:border-red-500" value={penaltyForm.playerId} onChange={e=>setPenaltyForm({...penaltyForm, playerId: e.target.value})}><option value="">Selecione o Infrator</option>{players.filter(p => (s.confirmed || []).includes(p.id)).map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select><select className="bg-[#121214] border border-[#323238] text-[#E1E1E6] rounded-md px-4 py-2 text-sm flex-1 outline-none focus:border-red-500" value={penaltyForm.type} onChange={e=>setPenaltyForm({...penaltyForm, type: e.target.value})}><option value="wo">Ausência Indevida (W.O)</option><option value="uniform">Sem Uniforme Oficial</option></select><Button variant="danger" onClick={() => addPenalty(s.id)}>Aplicar Multa</Button></div>
                                       {(s.penalties || [])?.map(p=>(<div key={p.id} className="text-sm text-red-400 flex justify-between bg-red-500/10 p-3 rounded-md mb-2 border border-red-500/20"><span>{players.find(x=>x.id===p.pid)?.name} ({p.type === 'wo' ? 'W.O.' : 'Falta Uniforme'})</span><div className="flex items-center gap-4"><span className="font-bold">-1 pt</span><button onClick={()=>{const ns=stages.find(x=>x.id===s.id); updateStage(s.id, { penalties: ns.penalties.filter(x => x.id !== p.id) });}}><Trash2 className="w-4 h-4 text-red-500/60 hover:text-red-500"/></button></div></div>))}
                                    </Card>
                                 )}
                              </div>
                           )}
                        </div>
                     );
                  })()}
               </div>
            )}

            {/* === ABA 3: GESTÃO DE ATLETAS === */}
            {activeTab === 'players_hub' && (
               <div className="space-y-6 animate-in fade-in duration-200">
                  <Card className="p-6">
                     <div className="flex justify-between mb-6 items-center"><h3 className="font-bold text-[#E1E1E6] text-lg">Elenco Registrado</h3>{isAdmin && !showAddPlayerForm && <Button onClick={() => setShowAddPlayerForm(true)}><Plus className="w-4 h-4"/> Novo Atleta</Button>}</div>
                     {showAddPlayerForm && (<div className="bg-[#121214] p-6 rounded-md mb-6 border border-[#323238] max-w-lg"><h4 className="text-xs font-bold text-[#8D8D99] uppercase tracking-widest mb-4">Dados do Jogador</h4><input className="w-full bg-[#202024] border border-[#323238] rounded-md p-3 mb-4 text-sm text-[#E1E1E6] focus:border-red-500 outline-none" placeholder="Nome Completo" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} /><div className="flex gap-3 mb-6"><select className="bg-[#202024] border border-[#323238] rounded-md p-3 text-sm flex-1 text-[#E1E1E6] focus:border-red-500 outline-none" value={newPlayerSide} onChange={e => setNewPlayerSide(e.target.value)}><option value="R">Lado Direito (R)</option><option value="L">Lado Esquerdo (L)</option></select></div><div className="flex gap-3"><Button onClick={handleAddPlayer} className="flex-1" variant="success">Cadastrar</Button><Button variant="secondary" onClick={() => setShowAddPlayerForm(false)}>Cancelar</Button></div></div>)}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">{players.map(p => (<div key={p.id} className="p-4 bg-[#121214] border border-[#323238] rounded-md">{editingPlayerId === p.id ? (<div className="space-y-4"><input className="w-full bg-[#202024] border border-[#323238] rounded-md px-3 py-2 text-sm text-[#E1E1E6] outline-none" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} /><div className="flex gap-3"><select className="bg-[#202024] border border-[#323238] rounded-md px-3 py-2 text-sm flex-1 text-[#E1E1E6] outline-none" value={editForm.side} onChange={e=>setEditForm({...editForm, side: e.target.value})}><option value="R">Direito (R)</option><option value="L">Esquerdo (L)</option></select></div><div className="flex items-center justify-between bg-[#202024] px-4 py-2 rounded-md border border-[#323238]"><label className="text-xs font-bold text-[#8D8D99] uppercase tracking-wider">Bônus Ranking:</label><input type="number" className="w-16 bg-[#121214] border border-[#323238] rounded px-2 py-1 text-sm text-yellow-500 font-bold text-center outline-none" value={editForm.manualPts} onChange={e=>setEditForm({...editForm, manualPts: e.target.value})} /></div><div className="flex gap-2 pt-2"><Button variant="success" className="flex-1" onClick={() => savePlayerEdit(p.id)}>Salvar</Button><Button variant="secondary" onClick={() => setEditingPlayerId(null)}>Voltar</Button></div></div>) : (<div className="flex justify-between items-center"><div><div className="font-bold text-[#E1E1E6] text-base uppercase">{p.name}</div><div className="text-[10px] flex flex-wrap gap-x-3 gap-y-2 items-center mt-2"><Badge color={p.side === 'R' ? 'blue' : 'green'}>{p.side === 'R' ? 'Direito' : 'Esquerdo'}</Badge>{p.manualPts > 0 && <span className="text-yellow-500 font-bold">+{p.manualPts} PTS REGISTRO</span>}</div></div>{isAdmin && <div className="flex gap-2"><Button variant="secondary" onClick={() => { setEditingPlayerId(p.id); setEditForm({name: p.name, side: p.side, uniformPaid: p.uniformPaid, manualPts: p.manualPts || 0}); }} className="px-3 py-2"><Edit2 className="w-4 h-4"/></Button><Button variant="danger" onClick={()=>removePlayer(p.id)} className="px-3 py-2"><Trash2 className="w-4 h-4"/></Button></div>}</div>)}</div>))}</div>{players.length === 0 && <p className="text-center text-sm text-[#8D8D99] py-8">Nenhum atleta na lista.</p>}</Card>
               </div>
            )}

            {/* === ABA 4: SISTEMA FINANCEIRO (SÓ ADMIN) === */}
            {isAdmin && activeTab === 'financial_hub' && (
               <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-[#323238]">{MONTHS.map((m,i)=>(<button key={i} onClick={()=>setFinMonth(i+1)} className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${finMonth===i+1?'bg-red-600 text-white':'bg-[#202024] text-[#8D8D99] border border-[#323238] hover:bg-[#29292E] hover:text-[#C4C4CC]'}`}>{m}</button>))}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     <Card className="p-5 border-t-4 border-t-[#04D361]"><div className="text-[10px] text-[#8D8D99] font-bold uppercase tracking-widest mb-2">Inscrições Jogos</div><div className="text-2xl font-black text-[#E1E1E6]">R$ {financials.game}</div><div className="text-[10px] text-[#8D8D99] mt-2">DayUse: R${financials.dayuse} | Cx: R${financials.caixa}</div></Card>
                     <Card className="p-5 border-t-4 border-t-yellow-500"><div className="text-[10px] text-[#8D8D99] font-bold uppercase tracking-widest mb-2">Movimento Bar</div><div className="text-2xl font-black text-[#E1E1E6]">R$ {financials.drink}</div></Card>
                     <Card className="p-5 border-t-4 border-t-blue-500"><div className="text-[10px] text-[#8D8D99] font-bold uppercase tracking-widest mb-2">Fardamentos</div><div className="text-2xl font-black text-[#E1E1E6]">R$ {financials.totalUniforms}</div></Card>
                     <Card className="p-5 border-t-4 border-t-red-500"><div className="text-[10px] text-[#8D8D99] font-bold uppercase tracking-widest mb-2">Custos / Despesas</div><div className="text-2xl font-black text-[#E1E1E6]">R$ {financials.outs}</div></Card>
                  </div>
                  <Card className="p-6">
                     <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-[#E1E1E6] text-sm uppercase tracking-wider">Balanço Operacional</h3><div className={`px-4 py-1.5 rounded-md font-black text-sm ${financials.totalBalance>=0?'bg-[#04D361]/10 text-[#04D361]':'bg-red-500/10 text-red-500'}`}>R$ {financials.totalBalance}</div></div>
                     <div className="pt-6 border-t border-[#323238]">
                        <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-[#8D8D99] text-xs uppercase tracking-wider">Lançamentos Avulsos</h3><Button onClick={() => setShowTransForm(!showTransForm)} variant="secondary">{showTransForm ? 'Ocultar Form' : 'Novo Registro Extra'}</Button></div>
                        {showTransForm && <div className="bg-[#121214] p-5 rounded-md mb-6 border border-[#323238] grid gap-4 max-w-lg"><input className="bg-[#202024] border border-[#323238] rounded-md px-4 py-3 text-[#E1E1E6] text-sm outline-none focus:border-red-500" placeholder="Finalidade/Descrição" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc: e.target.value})} /><div className="flex gap-3"><div className="relative flex-1"><span className="absolute left-4 top-3 text-[#8D8D99] text-sm font-bold">R$</span><input className="bg-[#202024] border border-[#323238] rounded-md py-3 pr-3 pl-10 w-full text-[#E1E1E6] text-sm outline-none focus:border-red-500 font-bold" type="number" placeholder="0.00" value={newTrans.amount} onChange={e=>setNewTrans({...newTrans, amount: e.target.value})} /></div><select className="bg-[#202024] border border-[#323238] rounded-md px-4 py-3 text-[#E1E1E6] text-sm outline-none focus:border-red-500" value={newTrans.type} onChange={e=>setNewTrans({...newTrans, type: e.target.value})}><option value="out">Despesa (Saída)</option><option value="in">Receita (Entrada)</option></select></div><Button className="w-full mt-2" variant="success" onClick={() => { if(newTrans.desc && newTrans.amount) { syncTrans([...transactions, { id: Date.now(), sid: finMonth, desc: newTrans.desc, val: parseFloat(newTrans.amount), type: newTrans.type, date: new Date().toLocaleDateString() }]); setShowTransForm(false); setNewTrans({desc:'', amount:'', type:'out'}); } }}>Confirmar Transação</Button></div>}
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">{transactions.filter(t=>t.sid===finMonth).length === 0 && <p className="text-sm text-[#8D8D99] text-center py-6">Sem registros manuais lançados neste mês.</p>} {transactions.filter(t=>t.sid===finMonth).map(t => (<div key={t.id} className="flex justify-between items-center text-sm bg-[#121214] p-4 rounded-md border border-[#323238] text-[#C4C4CC]"><span>{t.date} <span className="text-[#8D8D99] mx-2">|</span> <strong className="text-[#E1E1E6]">{t.desc}</strong></span><div className="flex items-center gap-6"><span className={`font-bold ${t.type === 'in' ? 'text-[#04D361]' : 'text-red-500'}`}>{t.type === 'in' ? '+' : '-'} R$ {t.val}</span><button onClick={()=>syncTrans(transactions.filter(x=>x.id!==t.id))} className="p-2 hover:bg-[#29292E] rounded transition-colors"><Trash2 className="w-4 h-4 text-[#8D8D99] hover:text-red-500"/></button></div></div>))}</div>
                     </div>
                  </Card>
               </div>
            )}

            {/* === ABA EXTRA: LOGIN INTERNO ADMIN === */}
            {activeTab === 'admin_login' && (
               <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-200">
                  <div className="bg-[#202024] border border-[#323238] p-8 rounded-md shadow-lg w-full max-w-sm text-center">
                     <Lock className="w-10 h-10 text-[#8D8D99] mx-auto mb-4" />
                     <h3 className="text-xl font-bold text-[#E1E1E6] mb-1">Acesso Organizador</h3>
                     <p className="text-sm text-[#8D8D99] mb-8">Insira a credencial da diretoria.</p>
                     <form onSubmit={handleLogin} className="flex flex-col gap-4">
                           <input type="password" id="global-pwd" placeholder="Senha de acesso" className="w-full bg-[#121214] border border-[#323238] text-[#E1E1E6] rounded-md px-4 py-3 text-center text-sm tracking-widest outline-none focus:border-red-500 transition-colors" />
                           <Button type="submit">Entrar no Sistema</Button>
                     </form>
                     {isAdmin && <div className="mt-8 pt-6 border-t border-[#323238]"><button onClick={async ()=>{if(window.confirm('CUIDADO EXTREMO! Isso limpará TODOS OS DADOS na nuvem. Continuar?')){ await syncPlayers([]); await syncTrans([]); await syncBets([]); await syncStages(MONTHS.map((m, i) => ({ id: i+1, name: m, status: 'upcoming', nextDate: "", q2Available: true, confirmed: [], entries: [], pairs: [], groups: [], matches: [], penalties: [], tv: { q1: null, q2: null } }))); window.location.reload(); }}} className="text-[10px] font-bold text-red-500 uppercase hover:underline">Zerar Banco de Dados</button></div>}
                  </div>
               </div>
            )}
         </main>

         <footer className="mt-auto p-6 md:px-8 border-t border-[#323238] flex flex-col md:flex-row items-center justify-center md:justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity w-full max-w-5xl mx-auto pb-28 md:pb-6">
            <div className="flex justify-center md:justify-start items-center gap-4 flex-wrap grayscale brightness-0 invert">
               {BRAND.sponsors.map((s, idx) => (
                  <a key={idx} href={s.link} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                     <img src={s.url} alt="patrocinio" className="h-5 md:h-6 object-contain" />
                  </a>
               ))}
            </div>
            <a href={BRAND.arenaLink} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform">
               <img src={BRAND.arenaLogo} alt="Arena" className="h-8 md:h-10 opacity-80 grayscale brightness-0 invert" />
            </a>
         </footer>
      </div>

      {/* 3. BARRA DE NAVEGAÇÃO MOBILE */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#202024] border-t border-[#323238] pb-safe shadow-2xl">
         <nav className="flex justify-around items-center p-3">
            {menuItems.map(item => { const Icon = item.icon; const isSel = activeTab === item.id; return (
               <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1.5 transition-colors ${isSel ? (item.id==='bet_hub'?'text-yellow-500':'text-red-500') : 'text-[#8D8D99] hover:text-[#C4C4CC]'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
               </button>
            )})}
         </nav>
      </div>

      {/* MODAL DE SEGURANÇA PLACAR */}
      {matchToFinish && (
          <div className="fixed inset-0 bg-[#121214]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
              <div className="bg-[#202024] border border-[#323238] p-8 rounded-md w-full max-w-sm text-center shadow-2xl">
                  <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-lg font-bold text-[#E1E1E6] mb-2 uppercase">Arquivar Placar?</h3>
                  <p className="text-[#8D8D99] text-sm mb-8">Confirme se as parciais digitadas conferem com a mesa.</p>
                  <div className="flex gap-4">
                      <Button variant="secondary" className="flex-1 py-3" onClick={()=>setMatchToFinish(null)}>Voltar</Button>
                      <Button variant="success" className="flex-1 py-3" onClick={() => {
                         const s = stages.find(x=>x.id===matchToFinish.sid);
                         const newMatches = s.matches.map(m=>m.id===matchToFinish.mid ? {...m, f:true} : m);
                         updateStage(matchToFinish.sid, {matches:newMatches}); setMatchToFinish(null);
                      }}>Confirmar Placar</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}