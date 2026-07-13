import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Users, Calendar, DollarSign, Plus, Trash2, Shuffle, 
  CheckCircle, Lock, Edit2, Save, Share2, ArrowLeft, 
  Beer, Shirt, Eye, Monitor, Target, AlertTriangle, LogOut
} from 'lucide-react';

// ============================================================================
// 1. CONFIGURAÇÕES BASE
// ============================================================================

const BRAND = {
  name: "Copa SMI 2026",
  logo: "https://lh3.googleusercontent.com/d/1XS6Q4zH9mNDxPMs87FpUpItP5MnW_qsC",
  arenaLogo: "https://lh3.googleusercontent.com/d/1wImrwb5tYtSdyYute9e537Io70FeQG9Y",
  sponsors: [
    "https://lh3.googleusercontent.com/d/14VpsxNk_e2bhXO9q1doBSAe0slVtQEFG",
    "https://lh3.googleusercontent.com/d/1y_W1qiBu6_aYtk2OOsSxaylSfhrnwkwc",
    "https://lh3.googleusercontent.com/d/1WZZE6HIKrMG2IIz6HvUHVjdKaftddlsC",
    "https://lh3.googleusercontent.com/d/1OhsqauvEooQFWXaHE8ivFRAl2BbPo2H8",
    "https://lh3.googleusercontent.com/d/1J6HQpqCa6TiCetkdNLKzpGgPC1lVD7Xr"
  ]
};

const ADMIN_PASSWORD = "admin"; 
const UNIFORM_PRICE = 70; 
const GAME_PRICE = 20; // 10 Dayuse + 10 Caixa
const DRINK_PRICE = 30;

const INITIAL_PLAYERS = [
  { id: 1, name: 'TUM', side: 'L', uniformPaid: false }, { id: 2, name: 'ESTAGY', side: 'L', uniformPaid: false },
  { id: 3, name: 'VENTOLA', side: 'L', uniformPaid: false }, { id: 4, name: 'PEDRÃO', side: 'L', uniformPaid: false },
  { id: 5, name: 'FLEX', side: 'L', uniformPaid: false }, { id: 6, name: 'ALEX', side: 'L', uniformPaid: false },
  { id: 7, name: 'SALES', side: 'L', uniformPaid: false }, { id: 8, name: 'ANDRÉ', side: 'L', uniformPaid: false },
  { id: 9, name: 'KANA', side: 'L', uniformPaid: false }, { id: 10, name: 'MARLINHO', side: 'L', uniformPaid: false },
  { id: 11, name: 'FURTI', side: 'R', uniformPaid: false }, { id: 12, name: 'FÁBIO', side: 'R', uniformPaid: false },
  { id: 13, name: 'NANDO', side: 'R', uniformPaid: false }, { id: 14, name: 'BIEL', side: 'R', uniformPaid: false },
  { id: 15, name: 'GALTER', side: 'R', uniformPaid: false }, { id: 16, name: 'INFIEL', side: 'R', uniformPaid: false },
  { id: 17, name: 'ERIC', side: 'R', uniformPaid: false }, { id: 18, name: 'PAGAS', side: 'R', uniformPaid: false },
  { id: 19, name: 'JORGE', side: 'R', uniformPaid: false }, { id: 20, name: 'BALADA', side: 'R', uniformPaid: false },
  { id: 21, name: 'LUKINHAS', side: 'R', uniformPaid: false }
];

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ============================================================================
// 2. COMPONENTES REUTILIZÁVEIS
// ============================================================================

const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl shadow-lg border border-zinc-800 bg-zinc-900 overflow-hidden ${className}`}>{children}</div>
);

const Button = ({ onClick, children, variant = 'primary', className = "", type = "button" }) => {
  const styles = {
    primary: "bg-red-600 text-white hover:bg-red-500",
    secondary: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
    danger: "bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/60",
    success: "bg-green-600 text-white hover:bg-green-500",
    outline: "border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
  };
  return <button type={type} onClick={onClick} className={`px-3 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all ${styles[variant]} ${className}`}>{children}</button>;
};

const Badge = ({ children, color = "blue" }) => {
  const colors = { red: "bg-red-900/30 text-red-400 border-red-800", gray: "bg-zinc-800 text-zinc-500 border-zinc-700", green: "bg-green-900/30 text-green-400 border-green-800", blue: "bg-blue-900/30 text-blue-400 border-blue-800" };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[color] || colors.gray}`}>{children}</span>;
};

// ============================================================================
// 3. APLICAÇÃO PRINCIPAL
// ============================================================================

export default function TournamentApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [staffTab, setStaffTab] = useState('menu'); 
  const [activeStageId, setActiveStageId] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareMode, setShareMode] = useState(false);
  const [tvMode, setTvMode] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  
  const loadState = (key, initial) => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch (e) { return initial; }
  };

  const [players, setPlayers] = useState(() => loadState('SMI_V55_PLAYERS', INITIAL_PLAYERS));
  const [transactions, setTransactions] = useState(() => loadState('SMI_V55_TRANS', []));
  const [stages, setStages] = useState(() => loadState('SMI_V55_STAGES', MONTHS.map((m, i) => ({
      id: i+1, name: m, status: 'upcoming', nextDate: "", q2Available: true,
      confirmed: [], entries: [], pairs: [], groups: [], matches: [], penalties: [],
      tv: { q1: null, q2: null }
  }))));

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', side: 'R', uniformPaid: false });
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerSide, setNewPlayerSide] = useState("R");
  const [newTrans, setNewTrans] = useState({ desc: "", amount: "", type: "out" });
  const [showTransForm, setShowTransForm] = useState(false);
  const [numGroupsToDraw, setNumGroupsToDraw] = useState(2);
  const [penaltyForm, setPenaltyForm] = useState({ playerId: "", type: "uniform" });
  const [finMonth, setFinMonth] = useState(1);
  const [matchToFinish, setMatchToFinish] = useState(null);

  useEffect(() => { localStorage.setItem('SMI_V55_PLAYERS', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('SMI_V55_TRANS', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('SMI_V55_STAGES', JSON.stringify(stages)); }, [stages]);

  // --- LÓGICA CORE ---
  
  const ranking = useMemo(() => {
    let raw = players.map(p => {
      let pts=0, j=0, pf=0, ps=0, v=0;
      stages.forEach(s => {
        if (s.status !== 'upcoming') {
           const pair = s.pairs.find(x => x.p1 === p.id || x.p2 === p.id);
           if (pair) {
               j++;
               if (s.status === 'finished') pts += (pair.pts || 0);
           }
           s.matches.forEach(m => {
             if (m.f) {
                const inA = m.pa.p1 === p.id || m.pa.p2 === p.id;
                const inB = m.pb.p1 === p.id || m.pb.p2 === p.id;
                if (inA) { pf+=m.sA; ps+=m.sB; if(m.sA>m.sB) v++; }
                else if (inB) { pf+=m.sB; ps+=m.sA; if(m.sB>m.sA) v++; }
             }
           });
           s.penalties.filter(pen=>pen.pid===p.id).forEach(pen => pts += pen.pts);
        }
      });
      return { ...p, pts, j, pf, ps, s: pf-ps, v };
    });
    return raw.sort((a,b) => b.v - a.v || b.s - a.s || b.pf - a.pf || a.ps - b.ps);
  }, [players, stages]);

  const financials = useMemo(() => {
    const totalUniforms = players.filter(p=>p.uniformPaid).length * UNIFORM_PRICE;
    const s = stages.find(x=>x.id === finMonth);
    let drink = 0, game = 0, dayuse = 0, caixa = 0;
    
    s?.entries.forEach(e => {
        if (e.paid) {
            if (e.drink) drink += DRINK_PRICE;
            if (e.play) { game += GAME_PRICE; dayuse += 10; caixa += 10; }
        }
    });

    const outs = transactions.filter(t=>t.sid===finMonth && t.type==='out').reduce((acc,t)=>acc+t.val,0);
    
    let totalIncome = totalUniforms;
    let totalExpense = 0;
    stages.forEach(st => {
        st.entries.forEach(e => {
            if(e.paid) {
                if(e.drink) totalIncome += DRINK_PRICE;
                if(e.play) totalIncome += GAME_PRICE;
            }
        });
    });
    transactions.forEach(t => t.type === 'in' ? totalIncome+=t.val : totalExpense+=t.val);

    return { drink, game, dayuse, caixa, outs, totalBalance: totalIncome - totalExpense, totalUniforms };
  }, [stages, transactions, players, finMonth]);

  const getStageRank = (sid) => {
      const s = stages.find(x=>x.id === sid);
      if(!s || s.pairs.length === 0) return [];
      return s.pairs.map(p => {
          const ms = s.matches.filter(m => (m.pa.id===p.id || m.pb.id===p.id) && m.f);
          let v=0, pf=0, ps=0;
          ms.forEach(m => {
              const my = m.pa.id===p.id ? m.sA : m.sB;
              const op = m.pa.id===p.id ? m.sB : m.sA;
              pf+=my; ps+=op; if(my>op) v++;
          });
          return { ...p, v, s: pf-ps, pf, ps };
      }).sort((a,b) => b.v - a.v || b.s - a.s || b.pf - a.pf);
  };

  // --- HANDLERS ---
  const updateStage = (sid, data) => setStages(stages.map(s => s.id === sid ? { ...s, ...data } : s));
  
  const handleLogin = (e) => {
    e.preventDefault();
    const pwdInput = document.getElementById('global-pwd');
    if (pwdInput && pwdInput.value === ADMIN_PASSWORD) {
        setIsAdmin(true);
        pwdInput.value = '';
    } else {
        alert("Senha incorreta!");
    }
  };

  const savePlayerEdit = (pid) => {
    setPlayers(players.map(p => p.id === pid ? { ...p, ...editForm } : p));
    setEditingPlayerId(null);
  };

  const handleAddPlayer = () => { if(newPlayerName) { setPlayers([...players, {id:Date.now(), name:newPlayerName, side:newPlayerSide, uniformPaid:false}]); setShowAddPlayerForm(false); setNewPlayerName(""); }};
  const removePlayer = (pid) => { if(window.confirm("Remover atleta?")) setPlayers(players.filter(p=>p.id!==pid)); };
  
  const toggleCheckin = (sid, pid) => {
    const s = stages.find(x=>x.id===sid);
    const isConf = s.confirmed.includes(pid);
    const nConf = isConf ? s.confirmed.filter(id=>id!==pid) : [...s.confirmed, pid];
    let nEnt = [...s.entries];
    if(!isConf && !nEnt.find(e=>e.pid===pid)) {
        nEnt.push({pid, drink:false, paid:false, play:true});
    }
    updateStage(sid, { confirmed: nConf, entries: nEnt });
  };

  const toggleEntryProp = (sid, pid, prop) => {
    const s = stages.find(x=>x.id===sid);
    const nEnt = s.entries.map(e=>e.pid===pid?{...e, [prop]:!e[prop]}:e);
    updateStage(sid, { entries: nEnt });
  };

  const drawGroups = (sid) => {
      const s = stages.find(x=>x.id===sid);
      const playingIds = s.entries.filter(e=>e.play).map(e=>e.pid);
      const pool = players.filter(p=>s.confirmed.includes(p.id) && playingIds.includes(p.id));
      
      if(pool.length < 2) return alert("Mínimo 2 jogadores para jogar.");
      
      let r = pool.filter(p=>p.side==='R'), l = pool.filter(p=>p.side==='L');
      let safe=0; while(Math.abs(r.length-l.length)>1 && safe<50){ if(r.length>l.length)l.push({...r.pop(),temp:'L'}); else r.push({...l.pop(),temp:'R'}); safe++; }
      
      const shuff = arr => arr.sort(()=>Math.random()-0.5);
      r=shuff(r); l=shuff(l);
      const pairs=[]; const len=Math.min(r.length, l.length);
      for(let i=0; i<len; i++) pairs.push({id:i+1, p1:r[i].id, p2:l[i].id, pts:0});

      const groups = Array.from({length:numGroupsToDraw}, (_,i)=>({id:i+1, name:`Grupo ${String.fromCharCode(65+i)}`, pairs:[]}));
      pairs.forEach((p,i)=> { groups[i%numGroupsToDraw].pairs.push(p); p.g=groups[i%numGroupsToDraw].id; });

      let matches=[], mid=1;
      const groupMatches = groups.map(g => {
          const gm=[]; for(let i=0; i<g.pairs.length; i++) for(let j=i+1; j<g.pairs.length; j++) gm.push({gId:g.id, pa:g.pairs[i], pb:g.pairs[j]});
          return gm;
      });
      const maxLen = Math.max(...groupMatches.map(gm=>gm.length), 0);
      for(let i=0; i<maxLen; i++) {
          groups.forEach((_, gIdx) => {
              if(groupMatches[gIdx][i]) matches.push({id:mid++, stage:'group', ...groupMatches[gIdx][i], sA:0, sB:0, f:false});
          });
      }
      updateStage(sid, {pairs, groups, matches, status:'active'});
  };

  const genMataMata = (sid) => {
      const s = stages.find(x=>x.id===sid);
      const ranked = getStageRank(sid);
      let next=[];
      if(ranked.length < 8) { 
          const t = ranked.slice(0,4);
          if(t.length===4) next = [{id:200, stage:'sf', pa:t[0], pb:t[3], sA:0, sB:0, f:false}, {id:201, stage:'sf', pa:t[1], pb:t[2], sA:0, sB:0, f:false}];
      } else { 
          const t = ranked.slice(0,8);
          next = [
              {id:100, stage:'qf', pa:t[0], pb:t[7], sA:0, sB:0, f:false}, {id:101, stage:'qf', pa:t[1], pb:t[6], sA:0, sB:0, f:false},
              {id:102, stage:'qf', pa:t[2], pb:t[5], sA:0, sB:0, f:false}, {id:103, stage:'qf', pa:t[3], pb:t[4], sA:0, sB:0, f:false}
          ];
      }
      updateStage(sid, { matches: [...s.matches, ...next] });
  };
  
  const advanceBracket = (sid, round) => {
     const s = stages.find(x=>x.id===sid);
     const done = s.matches.filter(m=>m.stage===round && m.f);
     let next=[];
     if(round==='qf' && done.length===4) {
         const w = done.map(m=>m.sA>m.sB?m.pa:m.pb);
         next=[{id:200, stage:'sf', pa:w[0], pb:w[3], sA:0, sB:0, f:false}, {id:201, stage:'sf', pa:w[1], pb:w[2], sA:0, sB:0, f:false}];
     }
     if(round==='sf' && done.length===2) {
         const w = done.map(m=>m.sA>m.sB?m.pa:m.pb); const l = done.map(m=>m.sA>m.sB?m.pb:m.pa);
         next=[{id:300, stage:'final', pa:w[0], pb:w[1], sA:0, sB:0, f:false}, {id:301, stage:'3rd', pa:l[0], pb:l[1], sA:0, sB:0, f:false}];
     }
     updateStage(sid, { matches: [...s.matches, ...next] });
  };

  const finishStage = (sid) => {
      const s = stages.find(x=>x.id===sid);
      const pointsMap = {};
      s.matches.filter(m=>m.stage==='qf').forEach(m=>{ const l=m.sA>m.sB?m.pb:m.pa; pointsMap[l.id]=1; });
      const f = s.matches.find(m=>m.stage==='final');
      const t3 = s.matches.find(m=>m.stage==='3rd');
      if(f){ const w=f.sA>f.sB?f.pa:f.pb; const l=f.sA>f.sB?f.pb:f.pa; pointsMap[w.id]=5; pointsMap[l.id]=4; }
      if(t3){ const w=t3.sA>t3.sB?t3.pa:t3.pb; const l=t3.sA>t3.sB?t3.pb:t3.pa; pointsMap[w.id]=3; pointsMap[l.id]=2; }
      const newPairs = s.pairs.map(p => ({ ...p, pts: pointsMap[p.id] || 0 }));
      updateStage(sid, { pairs: newPairs, status: 'finished' });
  };

  const addPenalty = (sid) => { if(penaltyForm.playerId){ const s=stages.find(x=>x.id===sid); updateStage(sid, { penalties: [...s.penalties, { id: Date.now(), pid: parseInt(penaltyForm.playerId), type: penaltyForm.type, pts: -1 }] }); }};

  // --- VIEWS ---
  if(shareMode) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-zinc-900 w-full max-w-md border-4 border-red-600 rounded-xl overflow-hidden shadow-2xl relative">
            <div className="bg-red-600 p-6 flex flex-col items-center justify-center"><img src={BRAND.logo} alt="Logo" className="h-16 mb-2 drop-shadow-lg" /><h1 className="text-3xl font-black text-white italic tracking-tighter">RANKING OFICIAL</h1></div>
            <div className="p-4"><table className="w-full text-left text-zinc-300 text-sm">
                <thead><tr className="border-b-2 border-zinc-800 text-xs text-zinc-500 uppercase tracking-widest"><th className="py-2">Pos</th><th>Atleta</th>{showAdvancedStats&&<th className="text-center">V</th>}<th className="text-right">Pts</th></tr></thead>
                <tbody>{ranking.filter(p => p.j > 0 || p.pts !== 0).slice(0,15).map((p,i) => (
                    <tr key={p.id} className="border-b border-zinc-800/50">
                      <td className={`py-2 font-black ${i===0?'text-yellow-400 text-lg':i<3?'text-zinc-300':'text-zinc-600'}`}>{i+1}º</td>
                      <td className="font-bold text-white uppercase">{p.name} <span className="text-[10px] text-zinc-600 ml-1 font-normal">({p.side})</span></td>
                      {showAdvancedStats && <td className="text-center text-zinc-500">{p.v}</td>}
                      <td className="text-right font-black text-white text-base">{p.pts}</td>
                    </tr>
                ))}</tbody>
              </table></div>
            <div className="bg-black p-4 flex justify-between items-center"><div className="flex gap-3 grayscale opacity-50">{BRAND.sponsors.slice(0,3).map((s,i)=><img key={i} src={s} alt="Sponsor" className="h-4 object-contain" />)}</div><img src={BRAND.arenaLogo} alt="Arena" className="h-6 grayscale opacity-50"/></div>
          </div>
          <button onClick={()=>setShareMode(false)} className="fixed bottom-6 right-6 bg-zinc-800 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-zinc-700 transition"><ArrowLeft className="w-4 h-4"/> Voltar</button>
        </div>
      );
  }

  if(tvMode) {
      const stage = stages.find(s=>s.id===activeStageId) || stages[0];
      const stageRank = getStageRank(stage.id);
      
      return (
          <div className="h-screen bg-black text-white flex flex-col p-4 gap-4 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900"><img src={BRAND.logo} alt="Logo" className="h-10"/><div className="text-right"><div className="text-xs text-yellow-500 font-bold uppercase">Ao Vivo</div><div className="text-lg font-bold">{stage?.name}</div></div><button onClick={()=>setTvMode(false)} className="opacity-0 hover:opacity-100">X</button></div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                  {[stage.tv.q1, stage.tv.q2].map((mid, idx) => {
                      if (idx===1 && !stage.q2Available) return <Card key={idx} className="flex items-center justify-center bg-zinc-950"><img src={BRAND.logo} alt="Logo" className="h-20 opacity-10 grayscale"/></Card>;
                      const m = stage.matches.find(x=>x.id===mid);
                      if (!m) return <Card key={idx} className="h-full flex items-center justify-center bg-zinc-950 border-zinc-800"><img src={BRAND.logo} alt="Logo" className="h-32 opacity-10 grayscale"/></Card>;
                      return (
                          <Card key={idx} className="h-full flex flex-col justify-center items-center p-4 relative overflow-hidden bg-zinc-950 border-zinc-800">
                               <div className="absolute top-2 left-2 text-[10px] uppercase text-zinc-500 font-bold border border-zinc-800 px-2 py-1 rounded">{m.stage}</div>
                               <div className="flex w-full h-full justify-between items-center gap-2">
                                   <div className="flex-1 text-center"><div className="text-3xl font-black text-white truncate">{players.find(p=>p.id===m.pa.p1)?.name}</div><div className="text-xl font-bold text-zinc-500 truncate">{players.find(p=>p.id===m.pa.p2)?.name}</div></div>
                                   <div className="px-4 text-8xl font-black text-yellow-500 tabular-nums">{m.sA}<span className="text-zinc-800 text-6xl mx-2">:</span>{m.sB}</div>
                                   <div className="flex-1 text-center"><div className="text-3xl font-black text-white truncate">{players.find(p=>p.id===m.pb.p1)?.name}</div><div className="text-xl font-bold text-zinc-500 truncate">{players.find(p=>p.id===m.pb.p2)?.name}</div></div>
                               </div>
                          </Card>
                      )
                  })}
              </div>
              <div className="h-44">
                  <Card className="h-full bg-zinc-950 border-zinc-800 p-2 overflow-hidden flex">
                      <div className="flex w-full h-full gap-2">
                          <div className="flex-1 border-r border-zinc-800 pr-2">
                              <div className="text-[10px] font-bold text-blue-500 mb-1 text-center">Top 4 (Classificados)</div>
                              <table className="w-full text-center text-[10px] text-zinc-400"><thead className="text-zinc-600 border-b border-zinc-800"><tr><th className="text-left">D</th><th>V</th><th>S</th><th>PF</th></tr></thead><tbody className="divide-y divide-zinc-800/50">{stageRank.slice(0,4).map(r=><tr key={r.id}><td className="text-left text-white font-bold py-1">D{r.id}</td><td className="text-green-500 font-bold">{r.v}</td><td>{r.s}</td><td>{r.pf}</td></tr>)}</tbody></table>
                          </div>
                          <div className="flex-1 pl-2">
                              <div className="text-[10px] font-bold text-zinc-600 mb-1 text-center">Restante</div>
                              <table className="w-full text-center text-[10px] text-zinc-400"><thead className="text-zinc-600 border-b border-zinc-800"><tr><th className="text-left">D</th><th>V</th><th>S</th><th>PF</th></tr></thead><tbody className="divide-y divide-zinc-800/50">{stageRank.slice(4,8).map(r=><tr key={r.id}><td className="text-left text-zinc-400 font-bold py-1">D{r.id}</td><td>{r.v}</td><td>{r.s}</td><td>{r.pf}</td></tr>)}</tbody></table>
                          </div>
                      </div>
                  </Card>
              </div>
              <div className="h-16 bg-zinc-900 rounded-xl flex items-center justify-between px-8"><div className="flex gap-4 grayscale opacity-70">{BRAND.sponsors.map((s,i)=><img key={i} src={s} alt="Sponsor" className="h-6 object-contain"/>)}</div><img src={BRAND.arenaLogo} alt="Arena" className="h-8 grayscale opacity-50" /></div>
          </div>
      );
  }

  // --- MAIN APP RENDER ---
  return (
    <div className="min-h-screen bg-[#09090b] font-sans text-zinc-200 pb-28">
      <header className="bg-[#09090b]/90 border-b border-zinc-800 p-4 sticky top-0 z-40 flex justify-between items-center max-w-5xl mx-auto">
         <div className="flex items-center gap-3"><img src={BRAND.logo} alt="Logo" className="h-10" /><h1 className="text-xl font-black italic text-white uppercase">{BRAND.name}</h1></div>
         <div className="flex gap-2">{isAdmin && <button onClick={()=>setTvMode(true)} className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-1"><Monitor className="w-3 h-3"/> TV</button>} <button onClick={()=>isAdmin ? setIsAdmin(false) : setActiveTab('staff')} className="text-[10px] bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full flex items-center gap-1 border border-zinc-700">{isAdmin ? <LogOut className="w-3 h-3"/> : <Lock className="w-3 h-3"/>} {isAdmin ? 'Sair' : 'Login'}</button></div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-6 border-l-4 border-yellow-500 bg-zinc-900/50"><p className="text-[10px] text-yellow-500 uppercase font-black tracking-widest">Líder do Ranking</p><h3 className="text-3xl font-black text-white italic">{ranking[0]?.name || '-'}</h3><div className="flex gap-3 mt-4"><div className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded text-xs text-yellow-400 font-bold">{ranking[0]?.pts || 0} PTS</div><div className="bg-zinc-800 border border-zinc-700 px-3 py-1 rounded text-xs text-zinc-400 font-bold">V: {ranking[0]?.v || 0}</div></div></Card>
                    <Card className="p-6 border-l-4 border-red-600 bg-zinc-900/50"><p className="text-[10px] text-red-500 uppercase font-black tracking-widest">Próxima Etapa</p><h3 className="text-2xl font-bold text-white mt-1 uppercase">{stages.find(s=>s.status!=='finished')?.name || 'Encerrada'}</h3><div className="mt-4 flex gap-2 items-center"><Badge color="red">{stages.find(s=>s.status!=='finished')?.status==='active'?'Em Andamento':'Aguardando'}</Badge>{stages.find(s=>s.status!=='finished')?.nextDate && <span className="text-xs font-bold text-zinc-400">{new Date(stages.find(s=>s.status!=='finished').nextDate+'T12:00:00').toLocaleDateString('pt-BR')}</span>}</div></Card>
                </div>
                <Card className="p-0 border-zinc-800">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between"><h3 className="font-bold text-white flex gap-2 items-center"><Trophy className="w-4 h-4 text-yellow-500"/> Geral</h3><div className="flex gap-2"><Button variant="secondary" onClick={()=>setShowAdvancedStats(!showAdvancedStats)}><Eye className="w-4 h-4"/></Button><Button variant="secondary" onClick={()=>setShareMode(true)} className="text-[10px] h-8 gap-1"><Share2 className="w-3 h-3"/> Postar</Button></div></div>
                    <div className="overflow-x-auto"><table className="w-full text-left text-sm text-zinc-300"><thead className="text-[10px] text-zinc-500 border-b border-zinc-800 uppercase tracking-wider bg-zinc-950/50"><tr><th className="p-3">Pos</th><th>Atleta</th>{showAdvancedStats && <th className="text-center">J</th>}{showAdvancedStats && <><th className="text-center text-green-500">V</th><th className="text-center text-blue-400">S</th><th className="text-center text-zinc-400">PF</th><th className="text-center text-zinc-600">PS</th></>}<th className="text-right p-3">Pts</th></tr></thead><tbody>{ranking.map((p,i)=><tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800"><td className="p-3 font-bold text-yellow-500">{i+1}º</td><td>{p.name} <span className="text-[10px] text-zinc-600 ml-1">({p.side})</span></td>{showAdvancedStats && <td className="text-center text-xs">{p.j}</td>}{showAdvancedStats && <><td className="text-center font-bold text-white">{p.v}</td><td className="text-center font-bold text-blue-500">{p.s>0?`+${p.s}`:p.s}</td><td className="text-center text-xs text-zinc-400">{p.pf}</td><td className="text-center text-xs text-zinc-600">{p.ps}</td></>}<td className="text-right p-3 font-black text-white text-base">{p.pts}</td></tr>)}</tbody></table></div>
                </Card>
            </div>
        )}

        {activeTab === 'stages' && (
            <div className="space-y-4 animate-in fade-in">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">{stages.map(st => (<button key={st.id} onClick={() => setActiveStageId(st.id)} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold border transition-all ${activeStageId === st.id ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-900/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}>{st.name}</button>))}</div>
                {(() => {
                    const s = stages.find(x=>x.id===activeStageId);
                    if(!s) return null;
                    return (
                        <div className="space-y-4">
                            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                                <div><h2 className="text-xl font-bold text-white">{s.name}</h2><div className="mt-1"><Badge color={s.status === 'finished' ? 'gray' : 'green'}>{s.status === 'finished' ? 'Finalizada' : s.status === 'active' ? 'Em andamento' : 'Inscrições'}</Badge></div></div>
                                {isAdmin && <div className="flex gap-2 items-center"><div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-700"><input type="checkbox" checked={s.q2Available} onChange={(e)=>updateStage(s.id, {q2Available:e.target.checked})} className="rounded bg-zinc-800 border-zinc-600"/><span className="text-[10px] text-zinc-400">Q2 ON</span></div>{s.status==='active' && <Button variant="success" onClick={()=>finishStage(s.id)}>Encerrar Etapa</Button>}</div>}
                            </div>
                            
                            {isAdmin && (s.status === 'upcoming' || s.status === 'registration') && (
                                <Card className="p-6 border-l-4 border-l-red-600">
                                    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                                        <h3 className="font-bold text-lg flex items-center gap-2 text-white"><Users className="w-5 h-5 text-red-500" /> Check-in (Staff)</h3>
                                        <div className="flex gap-2 items-center">{s.status === 'upcoming' ? (<div className="flex gap-2"><input type="date" className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded p-2" onChange={(e)=>updateStage(s.id, {nextDate:e.target.value})} /><Button onClick={() => updateStage(s.id, {status:'registration'})}>Abrir</Button></div>) : (<><select className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded p-2" value={numGroupsToDraw} onChange={(e) => setNumGroupsToDraw(parseInt(e.target.value))}><option value="1">1 Grupo</option><option value="2">2 Grupos</option><option value="3">3 Grupos</option><option value="4">4 Grupos</option></select><Button onClick={() => drawGroups(s.id)}><Shuffle className="w-4 h-4" /> Sortear</Button></>)}</div>
                                    </div>
                                    {s.status === 'registration' && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{players.map(p => { const c = s.confirmed.includes(p.id); const e = s.entries.find(x=>x.pid===p.id); return <div key={p.id} className={`p-3 border rounded-lg cursor-pointer transition-all ${c ? 'bg-red-900/10 border-red-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-500'}`} onClick={()=>toggleCheckin(s.id, p.id)}><div className="flex justify-between items-center"><span className={`font-bold text-sm ${c?'text-red-400':'text-zinc-400'}`}>{p.name}</span><span className="text-xs text-zinc-500">{p.side}</span></div>{c && <div className="flex gap-1 mt-3 items-center pt-2 border-t border-zinc-700/50"><button onClick={(ev)=>{ev.stopPropagation(); toggleEntryProp(s.id, p.id, 'paid')}} className={`flex-1 h-7 rounded flex items-center justify-center font-bold text-[10px] ${e?.paid?'bg-green-600 text-white':'bg-zinc-800 text-zinc-500'}`}>$ PAGO</button><button onClick={(ev)=>{ev.stopPropagation(); toggleEntryProp(s.id, p.id, 'drink')}} className={`flex-1 h-7 rounded flex items-center justify-center font-bold text-[10px] ${e?.drink?'bg-amber-600 text-white':'bg-zinc-800 text-zinc-500'}`}><Beer className="w-3 h-3 mx-auto"/></button><div onClick={ev=>{ev.stopPropagation();toggleEntryProp(s.id, p.id, 'play')}} className={`flex-1 h-7 rounded flex items-center justify-center border font-bold text-[10px] transition-all ${e?.play?'bg-blue-600 border-blue-500 text-white':'bg-zinc-800 border-zinc-700 text-zinc-500'}`}><Target className="w-3 h-3 mr-1"/> Jogar?</div></div>}</div> })}</div>)}
                                </Card>
                            )}

                            {(s.status === 'active' || s.status === 'finished') && (
                                <div className="space-y-4">
                                    <Card className="p-4 border-zinc-800"><div className="mb-4 text-white font-bold text-sm uppercase">Duplas Definidas</div><div className="grid grid-cols-2 gap-3">{s.pairs?.map(p=><div key={p.id} className="bg-zinc-800 p-2 rounded text-xs flex justify-between items-center border border-zinc-700"><span className="font-bold text-zinc-500 mr-2">D{p.id}</span><div className="text-right"><div className="text-white font-bold">{players.find(x=>x.id===p.p1)?.name}</div><div className="text-zinc-400">{players.find(x=>x.id===p.p2)?.name}</div></div></div>)}</div></Card>
                                    <Card className="p-4 border-zinc-800">
                                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white text-sm uppercase">Fase de Grupos</h3>{isAdmin && !s.matches.find(m=>m.stage==='qf') && <Button variant="outline" className="text-xs" onClick={()=>genMataMata(s.id)}>Gerar Mata-Mata</Button>}</div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {s.groups?.map(g => {
                                                const stats = g.pairs.map(pair => {
                                                    const pairMatches = s.matches.filter(m => (m.pa?.id === pair.id || m.pb?.id === pair.id) && m.f);
                                                    let v=0, pro=0, contra=0;
                                                    pairMatches.forEach(m => {
                                                        const my = m.pa.id === pair.id ? m.sA : m.sB; const op = m.pa.id === pair.id ? m.sB : m.sA;
                                                        pro += my; contra += op; if (my > op) v++;
                                                    });
                                                    return { ...pair, v, s: pro - contra, pro, contra };
                                                }).sort((a, b) => b.v - a.v || b.s - a.s || b.pro - a.pro);

                                                return (
                                                <div key={g.id} className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
                                                    <div className="bg-zinc-950 px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800">{g.name}</div>
                                                    <table className="w-full text-center text-[10px] text-zinc-400 mb-2">
                                                        <thead className="bg-zinc-900/50 text-zinc-500"><tr><th className="py-1 px-1 text-left pl-2">Dupla</th><th className="text-green-500">V</th><th className="text-blue-500">S</th><th>PF</th><th>PS</th></tr></thead>
                                                        <tbody>{stats.map(row=>(<tr key={row.id} className="border-b border-zinc-800/50"><td className="py-1 px-1 text-left pl-2 font-bold text-white">D{row.id}</td><td className="font-bold text-green-500">{row.v}</td><td className="font-bold text-blue-400">{row.s}</td><td>{row.pro}</td><td>{row.contra}</td></tr>))}</tbody>
                                                    </table>
                                                    <div className="p-2 bg-zinc-950/50 font-bold text-[10px] text-center text-zinc-500 uppercase tracking-widest border-y border-zinc-700">Jogos</div>
                                                    <div className="divide-y divide-zinc-700/50">{s.matches?.filter(m=>m.gId===g.id).map(m => (
                                                        <div key={m.id} className="p-2 flex justify-between items-center text-xs text-zinc-300">
                                                            <span className="w-10 font-bold">D{m.pa?.id}</span>
                                                            <div className="flex gap-2 items-center"><input type="number" disabled={!isAdmin} className={`w-8 h-8 text-center border rounded font-bold ${isAdmin?'bg-black border-zinc-600 text-white':'bg-transparent border-transparent text-white'}`} value={m.sA} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sA:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/><span className="text-zinc-600 font-bold">x</span><input type="number" disabled={!isAdmin} className={`w-8 h-8 text-center border rounded font-bold ${isAdmin?'bg-black border-zinc-600 text-white':'bg-transparent border-transparent text-white'}`} value={m.sB} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sB:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/>{isAdmin && !m.f && <button onClick={()=>setMatchToFinish({sid:s.id, mid:m.id})} className="text-green-500 ml-1 bg-green-500/10 p-1 rounded hover:bg-green-500 hover:text-white transition"><CheckCircle className="w-4 h-4"/></button>}</div>
                                                            <span className="w-10 text-right font-bold">D{m.pb?.id}</span>
                                                            {isAdmin && <div className="flex gap-1 ml-2"><button onClick={()=>updateStage(s.id,{tv:{...s.tv, q1:m.id}})} className={`w-6 h-6 text-[8px] border rounded flex items-center justify-center ${s.tv?.q1===m.id?'bg-red-600 border-red-600 text-white':'border-zinc-600 text-zinc-500 hover:border-red-600'}`}>Q1</button>{s.q2Available && <button onClick={()=>updateStage(s.id,{tv:{...s.tv, q2:m.id}})} className={`w-6 h-6 text-[8px] border rounded flex items-center justify-center ${s.tv?.q2===m.id?'bg-red-600 border-red-600 text-white':'border-zinc-600 text-zinc-500 hover:border-red-600'}`}>Q2</button>}</div>}
                                                        </div>
                                                    ))}</div>
                                                </div>
                                            )})}
                                        </div>
                                    </Card>
                                    
                                    {/* MATA MATA */}
                                    {s.matches.some(m=>m.stage==='qf') && (
                                        <div className="mt-8 pt-8 border-t border-zinc-800">
                                            <h3 className="font-bold text-center text-yellow-500 mb-4 uppercase tracking-widest text-sm">Fase Final</h3>
                                            <div className="overflow-x-auto pb-4"><div className="flex justify-center gap-4 min-w-[600px]">
                                                <div className="w-40 space-y-2"><div className="text-center text-[10px] text-zinc-500 uppercase font-bold mb-2">Quartas</div>{s.matches.filter(m=>m.stage==='qf').map(m=>(<div key={m.id} className="bg-zinc-800 p-2 rounded-lg text-xs border border-zinc-700 shadow-md"><div className="flex justify-between items-center mb-1"><span className="font-bold">D{m.pa?.id}</span><input disabled={!isAdmin} className="w-6 h-6 bg-black text-center text-white rounded border border-zinc-700" value={m.sA} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sA:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div><div className="flex justify-between items-center"><span className="font-bold">D{m.pb?.id}</span><input disabled={!isAdmin} className="w-6 h-6 bg-black text-center text-white rounded border border-zinc-700" value={m.sB} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sB:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div>{isAdmin && !m.f && <button onClick={()=>setMatchToFinish({sid:s.id, mid:m.id})} className="w-full mt-2 bg-green-900/30 text-green-500 border border-green-900/50 py-1 rounded text-[10px]">Encerrar</button>}</div>))}{isAdmin && !s.matches.find(m=>m.stage==='sf') && <Button className="w-full text-[10px] mt-2" onClick={()=>advanceBracket(s.id, 'qf')}>Gerar Semi</Button>}</div>
                                                <div className="w-40 space-y-4 pt-6"><div className="text-center text-[10px] text-blue-500 uppercase font-bold mb-2">Semi</div>{s.matches.filter(m=>m.stage==='sf').map(m=>(<div key={m.id} className="bg-zinc-800 p-2 rounded-lg text-xs border border-blue-900/50 shadow-md shadow-blue-900/20"><div className="flex justify-between items-center mb-1"><span className="font-bold">D{m.pa?.id}</span><input disabled={!isAdmin} className="w-6 h-6 bg-black text-center text-white rounded border border-zinc-700" value={m.sA} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sA:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div><div className="flex justify-between items-center"><span className="font-bold">D{m.pb?.id}</span><input disabled={!isAdmin} className="w-6 h-6 bg-black text-center text-white rounded border border-zinc-700" value={m.sB} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sB:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div>{isAdmin && !m.f && <button onClick={()=>setMatchToFinish({sid:s.id, mid:m.id})} className="w-full mt-2 bg-green-900/30 text-green-500 border border-green-900/50 py-1 rounded text-[10px]">Encerrar</button>}</div>))}{isAdmin && s.matches.find(m=>m.stage==='sf') && !s.matches.find(m=>m.stage==='final') && <Button className="w-full text-[10px] mt-2" onClick={()=>advanceBracket(s.id, 'sf')}>Gerar Final</Button>}</div>
                                                <div className="w-48 space-y-4 pt-12"><div className="text-center text-[10px] text-yellow-500 uppercase font-bold mb-2">Final</div>{s.matches.filter(m=>m.stage==='final').map(m=>(<div key={m.id} className="bg-gradient-to-b from-yellow-900/30 to-black border border-yellow-600/50 p-4 rounded-xl text-sm shadow-xl shadow-yellow-900/20 scale-110"><div className="flex justify-between items-center mb-3"><span className="font-black text-white">D{m.pa?.id}</span><input disabled={!isAdmin} className="w-8 h-8 text-center bg-black border border-yellow-600 text-yellow-400 font-black rounded" value={m.sA} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sA:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div><div className="flex justify-between items-center"><span className="font-black text-white">D{m.pb?.id}</span><input disabled={!isAdmin} className="w-8 h-8 text-center bg-black border border-yellow-600 text-yellow-400 font-black rounded" value={m.sB} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sB:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div>{isAdmin && !m.f && <button onClick={()=>setMatchToFinish({sid:s.id, mid:m.id})} className="w-full mt-4 bg-yellow-600 text-black font-bold py-1 rounded text-[10px] uppercase tracking-widest">Encerrar Final</button>}</div>))}{s.matches.filter(m=>m.stage==='3rd').map(m=>(<div key={m.id} className="mt-8 pt-4 border-t border-zinc-800 text-center"><div className="text-[9px] text-zinc-500 mb-2 uppercase font-bold">3º LUGAR</div><div className="bg-zinc-800 p-2 rounded-lg text-xs flex justify-between items-center border border-zinc-700"><span className="font-bold">D{m.pa?.id}</span><div className="flex gap-1 items-center"><input disabled={!isAdmin} className="w-5 bg-black text-center text-white border border-zinc-700 rounded" value={m.sA} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sA:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/> <span className="text-[10px] text-zinc-600">x</span> <input disabled={!isAdmin} className="w-5 bg-black text-center text-white border border-zinc-700 rounded" value={m.sB} onChange={e=>{const nm=s.matches.map(x=>x.id===m.id?{...x,sB:Number(e.target.value)}:x); updateStage(s.id,{matches:nm})}}/></div><span className="font-bold">D{m.pb?.id}</span></div>{isAdmin && !m.f && <button onClick={()=>setMatchToFinish({sid:s.id, mid:m.id})} className="w-full mt-2 bg-zinc-700 text-zinc-300 py-1 rounded text-[10px]">Encerrar 3º</button>}</div>))}</div>
                                            </div></div>
                                        </div>
                                    )}

                                    {isAdmin && (
                                        <Card className="p-4 border-red-900/30 bg-red-950/10 mt-6">
                                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">Penalidades (Multas)</h4>
                                            <div className="flex flex-wrap gap-2 mb-2"><select className="bg-zinc-900 border border-zinc-700 text-white rounded p-2 text-xs flex-1" value={penaltyForm.playerId} onChange={e=>setPenaltyForm({...penaltyForm, playerId: e.target.value})}><option value="">Selecione o Infrator</option>{players.filter(p => s.confirmed.includes(p.id)).map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select><select className="bg-zinc-900 border border-zinc-700 text-white rounded p-2 text-xs flex-1" value={penaltyForm.type} onChange={e=>setPenaltyForm({...penaltyForm, type: e.target.value})}><option value="wo">Ausência (W.O)</option><option value="uniform">Sem Uniforme Oficial</option></select><Button variant="danger" onClick={() => addPenalty(s.id)} className="text-xs h-9">Multar</Button></div>
                                            {s.penalties?.map(p=>(<div key={p.id} className="text-xs text-red-400 flex justify-between bg-red-950/20 p-2 rounded mb-1 border border-red-900/20"><span>{players.find(x=>x.id===p.pid)?.name} ({p.type === 'wo' ? 'Ausência' : 'Uniforme'})</span><div className="flex items-center gap-2"><span className="font-bold">-1 pt</span><button onClick={()=>{const ns=stages.find(x=>x.id===s.id); updateStage(s.id, { penalties: ns.penalties.filter(x => x.id !== p.id) });}}><Trash2 className="w-3 h-3 hover:text-red-300"/></button></div></div>))}
                                        </Card>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
            <div className="animate-in fade-in">
                {!isAdmin ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
                        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600"></div>
                            <Lock className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Staff Hub</h3>
                            <p className="text-sm text-zinc-500 mb-6">Acesso restrito à organização.</p>
                            <form onSubmit={handleLogin} className="flex flex-col gap-3">
                                <input type="password" id="global-pwd" placeholder="Senha" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-4 py-3 text-center tracking-widest outline-none focus:border-red-600 transition" />
                                <Button type="submit" className="py-3">ENTRAR</Button>
                            </form>
                            <div className="mt-8 pt-4 border-t border-zinc-800">
                                <button onClick={()=>{if(window.confirm('CUIDADO! Isso apagará TODOS os dados do aplicativo. Continuar?')){localStorage.clear();window.location.reload()}}} className="text-[10px] text-red-900 border border-red-900/30 px-3 py-1 rounded hover:bg-red-900 hover:text-white transition">RESETAR DADOS DO APP</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-lg space-y-4">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-white">Painel de Controle</h2><button onClick={()=>setIsAdmin(false)} className="text-red-500 flex items-center gap-1 text-xs font-bold"><LogOut className="w-4 h-4"/> Sair</button></div>
                        {staffTab === 'menu' && (
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={()=>setStaffTab('players')} className="p-6 rounded-xl border flex flex-col items-center gap-3 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-red-600 hover:text-white transition-all"><Users className="w-8 h-8"/> <span className="font-bold tracking-widest text-xs uppercase">Atletas</span></button>
                                <button onClick={()=>setStaffTab('financial')} className="p-6 rounded-xl border flex flex-col items-center gap-3 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-green-600 hover:text-white transition-all"><DollarSign className="w-8 h-8"/> <span className="font-bold tracking-widest text-xs uppercase">Financeiro</span></button>
                                <button onClick={()=>setTvMode(true)} className="col-span-2 p-6 rounded-xl border bg-gradient-to-r from-red-900 to-black border-red-800 text-white hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-900/20"><Monitor className="w-8 h-8"/> <span className="font-black text-lg tracking-widest">ABRIR MODO TV</span></button>
                            </div>
                        )}
                        {staffTab !== 'menu' && (
                            <div className="animate-in slide-in-from-right">
                                <button onClick={()=>setStaffTab('menu')} className="mb-4 flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-bold transition"><ArrowLeft className="w-4 h-4"/> VOLTAR AO MENU</button>
                                
                                {staffTab === 'players' && (
                                     <Card className="p-4 border-zinc-800">
                                        <div className="flex justify-between mb-4 items-center"><h3 className="font-bold text-white text-sm uppercase tracking-widest">Gestão de Atletas</h3>{!showAddPlayerForm && <Button onClick={() => setShowAddPlayerForm(true)} className="text-xs h-8"><Plus className="w-3 h-3"/> Novo</Button>}</div>
                                        {showAddPlayerForm && (<div className="bg-zinc-950 p-4 rounded-lg mb-4 border border-zinc-700 shadow-inner"><h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Novo Atleta</h4><input className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 mb-3 text-sm text-white focus:border-red-500 outline-none" placeholder="Nome Completo" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} /><div className="flex gap-2 mb-4"><select className="bg-zinc-900 border border-zinc-700 rounded p-2 text-sm flex-1 text-white focus:border-red-500 outline-none" value={newPlayerSide} onChange={e => setNewPlayerSide(e.target.value)}><option value="R">Lado Direita (R)</option><option value="L">Lado Esquerda (L)</option></select></div><div className="flex gap-2"><Button onClick={handleAddPlayer} className="flex-1">Salvar Atleta</Button><Button variant="secondary" onClick={() => setShowAddPlayerForm(false)}>Cancelar</Button></div></div>)}
                                        <div className="divide-y divide-zinc-800 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">{players.map(p => (<div key={p.id} className="py-3 flex flex-col gap-2">{editingPlayerId === p.id ? (<div className="bg-zinc-950 p-3 rounded border border-zinc-700"><input className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 mb-2 text-sm text-white" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} /><div className="flex gap-2 mb-2"><select className="bg-zinc-900 border border-zinc-700 rounded p-2 text-sm flex-1 text-white" value={editForm.side} onChange={e=>setEditForm({...editForm, side: e.target.value})}><option value="R">Direita (R)</option><option value="L">Esquerda (L)</option></select></div><label className="flex items-center gap-2 text-sm mb-3 cursor-pointer text-zinc-300"><input type="checkbox" checked={editForm.uniformPaid} onChange={e=>setEditForm({...editForm, uniformPaid: e.target.checked})} className="rounded bg-zinc-700 border-zinc-600" /><span>Uniforme Pago (R$70)</span></label><div className="flex gap-2"><Button variant="success" className="text-xs flex-1" onClick={() => savePlayerEdit(p.id)}><Save className="w-3 h-3"/> Salvar</Button><Button variant="secondary" className="text-xs" onClick={() => setEditingPlayerId(null)}>Cancelar</Button></div></div>) : (<div className="flex justify-between items-center"><div><div className="font-bold text-zinc-200 text-sm">{p.name}</div><div className="text-[10px] text-zinc-500 flex gap-2 items-center mt-1"><Badge color={p.side === 'R' ? 'blue' : 'green'}>{p.side}</Badge>{p.uniformPaid ? (<span className="text-green-500 flex items-center gap-1 font-bold"><CheckCircle className="w-3 h-3"/> Uniforme OK</span>) : (<span className="text-zinc-600 flex items-center gap-1">Uniforme Pendente</span>)}</div></div><div className="flex gap-2"><Button variant="secondary" onClick={() => { setEditingPlayerId(p.id); setEditForm({name: p.name, side: p.side, uniformPaid: p.uniformPaid}); }} className="p-2 h-8 w-8 bg-transparent border-zinc-800 hover:bg-zinc-800"><Edit2 className="w-3 h-3"/></Button><Button variant="danger" onClick={()=>removePlayer(p.id)} className="p-2 h-8 w-8 bg-transparent border-zinc-800"><Trash2 className="w-3 h-3 text-red-500"/></Button></div></div>)}</div>))}</div>
                                     </Card>
                                )}

                                {staffTab === 'financial' && (
                                    <div className="space-y-6">
                                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">{MONTHS.map((m,i)=>(<button key={i} onClick={()=>setFinMonth(i+1)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${finMonth===i+1?'bg-green-600 text-white border-green-600 shadow-lg shadow-green-900/30':'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>{m}</button>))}</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Card className="p-4 border-green-900/30 bg-green-950/10 text-center flex flex-col justify-center relative overflow-hidden"><div className="absolute top-0 right-0 p-2 opacity-10"><DollarSign className="w-12 h-12 text-green-500"/></div><div className="text-[10px] text-green-500 font-bold uppercase tracking-widest mb-1 relative z-10">Inscrições (Total)</div><div className="text-2xl font-black text-white relative z-10">R$ {financials.game}</div><div className="text-[9px] text-zinc-500 mt-2 bg-black/40 py-1 rounded inline-block px-2 mx-auto relative z-10">DayUse: R${financials.dayuse} | Caixa: R${financials.caixa}</div></Card>
                                            <Card className="p-4 border-amber-900/30 bg-amber-950/10 text-center flex flex-col justify-center relative overflow-hidden"><div className="absolute top-0 right-0 p-2 opacity-10"><Beer className="w-12 h-12 text-amber-500"/></div><div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1 relative z-10">Bebidas (Bar)</div><div className="text-2xl font-black text-white relative z-10">R$ {financials.drink}</div></Card>
                                            <Card className="p-4 border-blue-900/30 bg-blue-950/10 text-center flex flex-col justify-center relative overflow-hidden"><div className="absolute top-0 right-0 p-2 opacity-10"><Shirt className="w-12 h-12 text-blue-500"/></div><div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1 relative z-10">Uniformes (Anual)</div><div className="text-2xl font-black text-white relative z-10">R$ {financials.totalUniforms}</div></Card>
                                            <Card className="p-4 border-red-900/30 bg-red-950/10 text-center flex flex-col justify-center relative overflow-hidden"><div className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1 relative z-10">Saídas / Despesas</div><div className="text-2xl font-black text-white relative z-10">R$ {financials.outs}</div></Card>
                                        </div>
                                        <Card className="p-4 border-zinc-800 bg-zinc-900">
                                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white text-sm uppercase tracking-widest">Caixa Geral (Balanço)</h3><div className={`px-3 py-1 rounded font-bold text-sm ${financials.totalBalance>=0?'bg-green-600/20 text-green-500 border border-green-600/30':'bg-red-600/20 text-red-500 border border-red-600/30'}`}>R$ {financials.totalBalance}</div></div>
                                            <div className="pt-4 border-t border-zinc-800 mt-4">
                                                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-zinc-400 text-xs uppercase">Lançamentos Extras (Mês Atual)</h3><Button onClick={() => setShowTransForm(!showTransForm)} variant="secondary" className="text-[10px] h-7">{showTransForm ? 'Cancelar' : 'Nova Entrada/Saída'}</Button></div>
                                                {showTransForm && <div className="bg-zinc-950 p-4 rounded-lg mb-4 border border-zinc-800 grid gap-3"><input className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm outline-none focus:border-blue-500" placeholder="Descrição do lançamento" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc: e.target.value})} /><div className="flex gap-2"><div className="relative flex-1"><span className="absolute left-3 top-2 text-zinc-500">R$</span><input className="bg-zinc-900 border border-zinc-700 rounded p-2 pl-8 w-full text-white text-sm outline-none focus:border-blue-500" type="number" placeholder="0.00" value={newTrans.amount} onChange={e=>setNewTrans({...newTrans, amount: e.target.value})} /></div><select className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm outline-none" value={newTrans.type} onChange={e=>setNewTrans({...newTrans, type: e.target.value})}><option value="out">Saída (Despesa)</option><option value="in">Entrada (Receita)</option></select></div><Button className="w-full text-xs py-3" variant="success" onClick={() => { if(newTrans.desc && newTrans.amount) { setTransactions([...transactions, { id: Date.now(), sid: finMonth, desc: newTrans.desc, val: parseFloat(newTrans.amount), type: newTrans.type, date: new Date().toLocaleDateString() }]); setShowTransForm(false); setNewTrans({desc:'', amount:'', type:'out'}); } }}>Confirmar Lançamento</Button></div>}
                                                <div className="space-y-2">{transactions.filter(t=>t.sid===finMonth).length === 0 && <p className="text-xs text-zinc-600 italic text-center py-4">Nenhum lançamento extra neste mês.</p>} {transactions.filter(t=>t.sid===finMonth).map(t => (<div key={t.id} className="flex justify-between items-center text-xs border-b border-zinc-800/50 pb-2 text-zinc-300"><span>{t.date} - {t.desc}</span><div className="flex items-center gap-3"><span className={`font-black ${t.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>{t.type === 'in' ? '+' : '-'} R$ {t.val}</span><button onClick={()=>setTransactions(transactions.filter(x=>x.id!==t.id))}><Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-500"/></button></div></div>))}</div>
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        <div className="mt-12 pt-8 pb-4 border-t border-zinc-800 flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity">
            <h4 className="text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Patrocinadores Oficiais</h4>
            <div className="flex justify-center items-center gap-4 flex-wrap grayscale brightness-0 invert transition-all">{BRAND.sponsors.map((s, idx) => (<img key={idx} src={s} alt="patrocinio" className="h-8 object-contain opacity-70 hover:opacity-100 transition-opacity" />))}</div>
            <div className="mt-6 flex flex-col items-center gap-2"><img src={BRAND.arenaLogo} alt="Arena" className="h-12 opacity-80 grayscale brightness-0 invert" /></div>
        </div>
      </main>

      <div className="fixed bottom-6 inset-x-6 max-w-sm mx-auto z-50">
        <nav className="bg-zinc-900/95 backdrop-blur-xl rounded-full shadow-2xl shadow-black border border-zinc-800 px-6 py-4 flex justify-between items-center">
            {[{ id: 'dashboard', icon: Trophy, label: 'Ranking' }, { id: 'stages', icon: Calendar, label: 'Etapas' }, { id: 'staff', icon: Lock, label: 'Staff' }].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === item.id ? 'text-red-600 scale-110 -translate-y-1' : 'text-zinc-600 hover:text-zinc-300'}`}>
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'fill-red-600/10' : ''}`} />
                <span className="text-[9px] font-bold uppercase tracking-wide">{item.label}</span>
              </button>
            ))}
        </nav>
      </div>

      {/* CONFIRM MODAL */}
      {matchToFinish && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
              <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-black text-white mb-2">Encerrar Partida?</h3>
                  <p className="text-zinc-400 text-sm mb-6">Confirme se o placar está correto.</p>
                  <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1 py-3" onClick={()=>setMatchToFinish(null)}>Cancelar</Button>
                      <Button variant="success" className="flex-1 py-3" onClick={() => {
                         const s = stages.find(x=>x.id===matchToFinish.sid);
                         const newMatches = s.matches.map(m=>m.id===matchToFinish.mid ? {...m, f:true} : m);
                         updateStage(matchToFinish.sid, {matches:newMatches});
                         setMatchToFinish(null);
                      }}>Confirmar</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}