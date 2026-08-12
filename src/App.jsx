import { useState, useEffect, useRef } from "react";

/* ─── constants ─── */
const FOULS = [
  "Speaking out of turn","Revealing role information","Signals during voting",
  "Excessive table noise","Speaking after elimination","Threatening players",
  "Insulting players","Discussing role outside turn","Using phone","Showing cards",
];
const R = { civ:"civ", mafia:"mafia", don:"don", sheriff:"sheriff" };
const RC = {
  civ:    { bg:"#7a1515", text:"#fff",    label:"Civilian" },
  mafia:  { bg:"#0e0e1e", text:"#ccc",    label:"Mafia"    },
  don:    { bg:"#0e0e1e", text:"#FFD700", label:"Don"      },
  sheriff:{ bg:"#0c3060", text:"#7ec8f7", label:"Sheriff"  },
};

function shuffle() {
  const r = [R.don,R.mafia,R.mafia,...Array(6).fill(R.civ),R.sheriff];
  for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}
  return r;
}

/* ─── auto-start countdown ─── */
function Timer({sec, color="#c0392b", label, rk, onEnd}) {
  const [left,setLeft]=useState(sec);
  const [run,setRun]=useState(true);
  const ref=useRef();
  useEffect(()=>{setLeft(sec);setRun(true);},[rk]);
  useEffect(()=>{
    if(run&&left>0){ref.current=setInterval(()=>setLeft(t=>{if(t<=1){clearInterval(ref.current);onEnd?.();return 0;}return t-1;}),1000);}
    else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[run]);
  const pct=left/sec, C=2*Math.PI*40, m=Math.floor(left/60), s=left%60;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
      {label&&<div style={{fontSize:10,color:"#777",letterSpacing:1,textTransform:"uppercase"}}>{label}</div>}
      <div style={{position:"relative",width:88,height:88}}>
        <svg width="88" height="88" style={{transform:"rotate(-90deg)"}}>
          <circle cx="44" cy="44" r="38" fill="none" stroke="#1e1e1e" strokeWidth="6"/>
          <circle cx="44" cy="44" r="38" fill="none" stroke={left===0?"#333":color} strokeWidth="6"
            strokeDasharray={C} strokeDashoffset={C*(1-pct)} strokeLinecap="round"
            style={{transition:"stroke-dashoffset 0.95s linear"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:18,fontWeight:800,color:left<=10&&run&&left>0?"#e74c3c":"#ddd",fontFamily:"monospace"}}>
            {m}:{String(s).padStart(2,"0")}
          </span>
        </div>
      </div>
      <button onClick={()=>{if(left===0){setLeft(sec);setRun(true);}else setRun(r=>!r);}}
        style={{background:run&&left>0?"#2a2a2a":color,border:"none",borderRadius:6,color:"#fff",padding:"4px 14px",cursor:"pointer",fontSize:11,fontWeight:700}}>
        {left===0?"↺":run?"⏸":"▶"}
      </button>
    </div>
  );
}

/* ─── player chip ─── */
function Chip({p,num,onClick,selected,showRole}) {
  const rc=RC[p.role]||RC.civ;
  const muted=p.fouls>=3&&!p.eliminated;
  return(
    <div onClick={()=>!p.eliminated&&onClick?.(num)} style={{
      width:76,height:76,borderRadius:10,flexShrink:0,
      background:p.eliminated?"#080808":showRole?rc.bg:"#181828",
      border:selected?"2px solid #FFD700":p.eliminated?"1px solid #181818":muted?"1px solid #8b4513":"1px solid #22223a",
      cursor:onClick&&!p.eliminated?"pointer":"default",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,
      position:"relative",opacity:p.eliminated?0.35:1,
      boxShadow:selected?"0 0 10px #FFD70044":"none",transition:"all .12s",
    }}>
      <div style={{fontSize:21,fontWeight:900,lineHeight:1,color:showRole?rc.text:"#d0d0d0"}}>
        {num}{showRole&&p.role===R.don&&<span style={{fontSize:9}}>🎩</span>}
      </div>
      <div style={{fontSize:9,color:"#666",maxWidth:68,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {p.name||`P${num}`}
      </div>
      {showRole&&<div style={{fontSize:8,background:"rgba(255,255,255,0.1)",borderRadius:3,padding:"1px 4px",color:rc.text}}>{rc.label}</div>}
      {muted&&<div style={{fontSize:7,color:"#cd853f",fontWeight:700}}>SILENT</div>}
      {p.fouls>0&&<div style={{position:"absolute",top:2,right:2,background:p.fouls>=4?"#8b0000":p.fouls>=3?"#8b4513":"#c0392b",color:"#fff",borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700}}>{p.fouls}</div>}
      {p.eliminated&&<div style={{position:"absolute",inset:0,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:22,color:"#2a2a2a"}}>✕</span></div>}
    </div>
  );
}

/* ─── night music ─── */
function NightMusic() {
  return(
    <div style={{marginBottom:10}}>
      <iframe width="100%" height="80" frameBorder="0"
        src="https://www.youtube.com/embed/CdbHAzNB1n0?autoplay=1&mute=0"
        allow="autoplay; encrypted-media"
        style={{borderRadius:7,display:"block"}}/>
    </div>
  );
}

/* ─── PDF ─── */
function printPDF(state) {
  const {players,judge,gameNum,winner,bestMoveNoms,firstKilled,allShots,voteLog,gameLog}=state;
  const donP=players.findIndex(p=>p.role===R.don)+1;
  const sherP=players.findIndex(p=>p.role===R.sheriff)+1;
  const shots=Object.entries(allShots||{}).map(([s,t])=>`${s}→${t}`).join(", ")||"—";
  const kills=players.filter(p=>p.eliminated).map((p,_,arr)=>`${players.indexOf(p)+1}`).join(", ")||"—";

  const playerRows=players.map((p,i)=>{
    const fc=Array(5).fill("").map((_,j)=>
      `<td style="border:1px solid #aaa;width:13px;height:14px;text-align:center;font-size:9px">${j<p.fouls?"✓":""}</td>`
    ).join("");
    return`<tr>
      <td style="border:1px solid #aaa;padding:2px 3px;font-size:10px;text-align:center">${i+1}</td>
      <td style="border:1px solid #aaa;padding:2px 5px;font-size:10px">${p.name||"—"}</td>
      <td style="border:1px solid #aaa;padding:2px 3px;font-size:10px;text-align:center">${RC[p.role]?.label[0]||"?"}</td>
      ${fc}
      <td style="border:1px solid #aaa;padding:2px 3px;font-size:10px;text-align:center">${p.eliminated?"✕":""}</td>
    </tr>`;
  }).join("");

  const vTables=(voteLog||[]).slice(0,5).map((v,i)=>{
    const cands=v.candidates||[];
    const ph=cands.map(n=>`<td style="border:1px solid #aaa;padding:1px 3px;font-size:9px;text-align:center">${n}</td>`).join("");
    const vh=cands.map(n=>`<td style="border:1px solid #aaa;padding:1px 3px;font-size:9px;text-align:center">${v.votes?.[n]??""}</td>`).join("");
    const rh=cands.map(n=>`<td style="border:1px solid #aaa;padding:1px 3px;font-size:9px;text-align:center">${v.revotes?.[n]??""}</td>`).join("");
    const ex=Array(Math.max(0,6-cands.length)).fill(`<td style="border:1px solid #aaa;width:18px">&nbsp;</td>`).join("");
    return`<div style="margin-bottom:6px">
      <div style="background:#ddd;padding:2px 5px;font-size:9px;font-weight:bold">Vote ${i+1}${v.out?` — eliminated: ${v.out}`:""}</div>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="border:1px solid #aaa;padding:1px 4px;font-size:8px;background:#f0f0f0">Player</td>${ph}${ex}</tr>
        <tr><td style="border:1px solid #aaa;padding:1px 4px;font-size:8px;background:#f0f0f0">Votes</td>${vh}${ex}</tr>
        <tr><td style="border:1px solid #aaa;padding:1px 4px;font-size:8px;background:#f0f0f0">Re-vote</td>${rh}${ex}</tr>
      </table>
    </div>`;
  }).join("");

  const logHtml=(gameLog||[]).map(l=>`[${l.t}] ${l.msg}`).join("<br>");

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Mafia #${gameNum||"?"}</title>
<style>body{font-family:Arial,sans-serif;margin:10px;font-size:10px;color:#000}table{border-collapse:collapse}@page{size:A4;margin:8mm}@media print{body{margin:0}}</style>
</head><body>
<table style="width:100%;border-collapse:collapse;margin-bottom:7px">
  <tr><td colspan="3" style="border:2px solid #333;padding:3px 7px;font-size:13px;font-weight:bold;text-align:center">LEVEL UP. MAFIA ENTERTAINMENT CLUB</td></tr>
  <tr>
    <td style="border:1px solid #aaa;padding:2px 5px">Date: <b>${new Date().toLocaleDateString("en-GB")}</b></td>
    <td style="border:1px solid #aaa;padding:2px 5px;text-align:center">Judge: <b>${judge||"—"}</b></td>
    <td style="border:1px solid #aaa;padding:2px 5px;text-align:right">Game #: <b>${gameNum||"—"}</b></td>
  </tr>
</table>
<div style="display:flex;gap:10px;align-items:flex-start">
  <div style="flex:1.3;min-width:0">
    <table style="border-collapse:collapse;width:100%;margin-bottom:6px">
      <thead><tr style="background:#ddd">
        <th style="border:1px solid #aaa;padding:2px 3px;width:17px">#</th>
        <th style="border:1px solid #aaa;padding:2px 4px;text-align:left">Nickname</th>
        <th style="border:1px solid #aaa;padding:2px 3px;width:22px">Role</th>
        <th style="border:1px solid #aaa;padding:2px 3px" colspan="5">Fouls</th>
        <th style="border:1px solid #aaa;padding:2px 3px;width:17px">Out</th>
      </tr></thead>
      <tbody>${playerRows}</tbody>
    </table>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="border:1px solid #aaa;padding:2px 4px;font-weight:bold;background:#eee;font-size:9px">Best Move</td>
          <td style="border:1px solid #aaa;padding:2px 4px;font-size:9px;color:#c00;font-weight:bold">${firstKilled?`${firstKilled}`:"—"}</td>
          <td style="border:1px solid #aaa;padding:2px 4px;font-size:9px">${bestMoveNoms?.map(n=>`${n}`).join(" / ")||"—"}</td></tr>
      <tr><td style="border:1px solid #aaa;padding:2px 4px;font-weight:bold;background:#eee;font-size:9px">Kills</td>
          <td colspan="2" style="border:1px solid #aaa;padding:2px 4px;font-size:9px">${kills}</td></tr>
      <tr><td style="border:1px solid #aaa;padding:2px 4px;font-weight:bold;background:#eee;font-size:9px">Winners</td>
          <td colspan="2" style="border:1px solid #aaa;padding:2px 4px;font-size:11px;font-weight:bold;color:#c00">${winner==="mafia"?"MAFIA":winner==="civilians"?"CIVILIANS":"—"}</td></tr>
      <tr><td style="border:1px solid #aaa;padding:2px 4px;font-weight:bold;background:#eee;font-size:9px">Don / Sheriff</td>
          <td colspan="2" style="border:1px solid #aaa;padding:2px 4px;font-size:9px">Don: <b>${donP||"—"}</b> &nbsp; Sheriff: <b>${sherP||"—"}</b></td></tr>
      <tr><td style="border:1px solid #aaa;padding:2px 4px;font-weight:bold;background:#eee;font-size:9px">Night shots</td>
          <td colspan="2" style="border:1px solid #aaa;padding:2px 4px;font-size:9px">${shots}</td></tr>
    </table>
  </div>
  <div style="flex:1;min-width:0">${vTables||"<p style='font-size:10px;color:#888'>No votes recorded.</p>"}</div>
</div>
<div style="margin-top:8px;border:1px solid #ccc;padding:5px;font-size:9px;line-height:1.5">
  <b>Game log:</b><br>${logHtml||"—"}
</div>
</body></html>`;

  try {
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`mafia_game_${gameNum||"1"}.html`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  } catch(e) {
    alert("File generation error: "+e.message);
  }
}

/* ════════════════ APP ════════════════ */
export default function App() {
  /* ── state ── */
  const [sc, setSc] = useState("setup"); // screen
  const [players, setPlayers] = useState(Array(10).fill(null).map(()=>({name:"",role:R.civ,fouls:0,eliminated:false,points:0})));
  const [judge, setJudge] = useState("");
  const [gameNum, setGameNum] = useState("");
  const [showRoles, setShowRoles] = useState(false);
  const [day, setDay] = useState(1);

  /* speech */
  const [speechOrder, setSpeechOrder] = useState([]); // 0-based seat indices for this day, in order
  const [speechPos, setSpeechPos] = useState(0);      // current position in speechOrder
  const [speechKey, setSpeechKey] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);      // first seat index of Day 1; increments each day

  /* day nominations */
  const [dayNoms, setDayNoms] = useState([]);

  /* last word */
  const [lwPlayer, setLwPlayer] = useState(null); // num (1-based) of player giving last word
  const [lwKey, setLwKey] = useState(0);
  const [lwNext, setLwNext] = useState("day"); // where to go after last word: "day" or "voting_done"

  /* voting */
  const [noms, setNoms] = useState([]);
  const [vStage, setVStage] = useState("initial"); // initial|defense|revote|raise_both|done
  const [vRound, setVRound] = useState({});
  const [rv, setRv] = useState({});
  const [tied, setTied] = useState([]);
  const [defIdx, setDefIdx] = useState(0);
  const [defKey, setDefKey] = useState(0);
  const [rbFor, setRbFor] = useState("");
  const [voteLog, setVoteLog] = useState([]);

  /* night */
  const [nightPh, setNightPh] = useState("mafia");
  const [shots, setShots] = useState({});
  const [allShots, setAllShots] = useState({});
  const [shooterSel, setShooterSel] = useState(null);
  const [donChk, setDonChk] = useState(null);
  const [sherChk, setSherChk] = useState(null);
  const [nightKilled, setNightKilled] = useState(null);
  const [firstKilled, setFirstKilled] = useState(null);
  const [bestNoms, setBestNoms] = useState([]);
  const [bestDone, setBestDone] = useState(false);
  const [showBest, setShowBest] = useState(false);

  /* meta */
  const [winner, setWinner] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [foulModal, setFoulModal] = useState(null);
  const [kickModal, setKickModal] = useState(null);
  const [showLog, setShowLog] = useState(false);

  /* dealing phase */
  const [dealCards, setDealCards] = useState([]); // shuffled roles array (10 items)
  const [dealPicked, setDealPicked] = useState([]); // which card indices have been picked
  const [dealCurrent, setDealCurrent] = useState(0); // which player's turn (0-based)
  const [dealReveal, setDealReveal] = useState(null); // { playerIdx, cardIdx, role } — currently shown
  const [dealConfirmed, setDealConfirmed] = useState(false); // player has seen the role

  /* nick history */
  const [history, setHistory] = useState(()=>{try{return JSON.parse(localStorage.getItem("mafiaH")||"[]");}catch{return[];}});
  const [sugg, setSugg] = useState(Array(10).fill([]));
  useEffect(()=>{try{localStorage.setItem("mafiaH",JSON.stringify(history));}catch{}}, [history]);

  const log = msg => setGameLog(p=>[...p,{t:new Date().toLocaleTimeString(),msg}]);

  /* ── helpers ── */
  const alive = (ps=players) => ps.filter(p=>!p.eliminated);
  const mafiaAlive = () => players.filter(p=>!p.eliminated&&(p.role===R.mafia||p.role===R.don));

  function checkWin(ps) {
    const ma=ps.filter(p=>!p.eliminated&&(p.role===R.mafia||p.role===R.don)).length;
    const ca=ps.filter(p=>!p.eliminated&&(p.role===R.civ||p.role===R.sheriff)).length;
    if(ma===0){setWinner("civilians");setSc("end");return true;}
    if(ma>=ca){setWinner("mafia");setSc("end");return true;}
    return false;
  }

  function eliminate(ps, num) {
    return ps.map((p,i)=>i===num-1?{...p,eliminated:true}:p);
  }

  /* ── nick suggestions ── */
  function handleName(i, val) {
    setPlayers(p=>p.map((pl,j)=>j===i?{...pl,name:val}:pl));
    const m=val.length>0?history.filter(n=>n.toLowerCase().startsWith(val.toLowerCase())&&n!==val).slice(0,6):[];
    setSugg(s=>s.map((x,j)=>j===i?m:x));
  }
  function pickSugg(i, name) {
    setPlayers(p=>p.map((pl,j)=>j===i?{...pl,name}:pl));
    setSugg(s=>s.map((x,j)=>j===i?[]:x));
  }

  /* ── start game ── */
  function startGame() {
    const roles=shuffle();
    setDealCards(roles.map((role,i)=>({role,origIdx:i})));
    setDealPicked([]);
    setDealCurrent(0);
    setDealReveal(null);
    setDealConfirmed(false);
    setHistory(prev=>[...new Set([...prev,...players.map(p=>p.name.trim()).filter(Boolean)])]);
    log("Cards shuffled. Dealing phase begins.");
    setSc("dealing");
  }

  /* ── dealing phase ── */
  // dealCards = remaining cards [{role,origIdx}], renumbered 1..N each turn
  function pickCard(pos) {
    const card = dealCards[pos];
    setDealReveal({ playerIdx: dealCurrent, displayNum: pos+1, role: card.role });
    setDealConfirmed(false);
    setPlayers(p=>p.map((pl,i)=>i===dealCurrent?{...pl,role:card.role}:pl));
    setDealCards(prev=>prev.filter((_,i)=>i!==pos));
  }

  function confirmDeal() {
    setDealReveal(null);
    if(dealCurrent >= 9) {
      log("All cards dealt.");
      setSc("roles");
    } else {
      setDealCurrent(c=>c+1);
    }
  }

  /* ── speech order ──
     Day N starts at seat (dayOffset + N - 1) % 10 (0-based).
     Within the day, order is circular: start seat, start+1, ..., 9, 0, 1, ... start-1
     Skip eliminated or silenced (≥3 fouls).
  */
  function buildOrder(ps, startSeat) {
    const order=[];
    for(let i=0;i<10;i++){
      const idx=(startSeat+i)%10;
      if(!ps[idx].eliminated&&ps[idx].fouls<3) order.push(idx);
    }
    return order;
  }

  function goDay(d, offsetForThisDay) {
    const start=(offsetForThisDay)%10;
    const order=buildOrder(players, start);
    setSpeechOrder(order);
    setSpeechPos(0);
    setSpeechKey(k=>k+1);
    setDayNoms([]); setNoms([]);
    setLwPlayer(null);
    setSc("day");
    log(`Day ${d} — speech order: ${order.map(i=>`${i+1}`).join("→")}`);
  }

  function nextSpeech() {
    setSpeechPos(pos=>{
      let next=pos+1;
      // skip anyone eliminated/silenced since order built
      while(next<speechOrder.length){
        const idx=speechOrder[next];
        if(!players[idx].eliminated&&players[idx].fouls<3) break;
        next++;
      }
      setSpeechKey(k=>k+1);
      return next>=speechOrder.length?speechOrder.length:next; // -1 not needed, length = done
    });
  }

  const currentSpeaker = speechPos < speechOrder.length ? speechOrder[speechPos] : -1; // 0-based index

  /* ── nominations ── */
  function toggleNom(num) {
    if(dayNoms.includes(num)){
      setDayNoms(p=>p.filter(x=>x!==num));
      log(`P${num} removed from ballot.`);
    } else {
      setDayNoms(p=>[...p,num]);
      const who=currentSpeaker>=0?`P${currentSpeaker+1} (${players[currentSpeaker]?.name})`:"judge";
      log(`P${num} nominated by ${who}.`);
    }
  }

  /* ── fouls ── */
  function addFoul(num, reason) {
    log(`Foul P${num}: ${reason}`);
    setFoulModal(null);
    setPlayers(prev=>{
      const newFouls=prev[num-1].fouls+1;
      if(newFouls>=4) {
        const ps=prev.map((p,i)=>i===num-1?{...p,fouls:newFouls,eliminated:true}:p);
        log(`P${num} eliminated — 4 fouls.`);
        setTimeout(()=>checkWin(ps),0);
        return ps;
      }
      if(newFouls===3) log(`P${num} — 3 fouls: speech revoked.`);
      return prev.map((p,i)=>i===num-1?{...p,fouls:newFouls}:p);
    });
  }

  function kickPlayer(num) {
    setKickModal(null);
    setPlayers(ps=>{
      const np=eliminate(ps,num);
      log(`P${num} removed from table by judge.`);
      setTimeout(()=>checkWin(np),0);
      return np;
    });
  }

  /* ── voting ── */
  function goVoting() {
    if(dayNoms.length===0) return;
    if(dayNoms.length===1){
      // single nominee → last word then eliminate, no vote
      setLwPlayer(dayNoms[0]);
      setLwKey(k=>k+1);
      setLwNext("day");
      setVoteLog(h=>[...h,{day,candidates:[...dayNoms],votes:{[dayNoms[0]]:"auto"},revotes:null,out:dayNoms[0]}]);
      log(`Single nominee P${dayNoms[0]} — last word then elimination.`);
      setSc("lastword");
      return;
    }
    setNoms([...dayNoms]);
    setVRound({}); setRv({}); setTied([]);
    setVStage("initial"); setDefIdx(0); setRbFor("");
    setSc("voting"); log(`Voting begins (Day ${day}).`);
  }

  function maxTied(counts, cands) {
    if(!cands.length) return [];
    const max=Math.max(...cands.map(n=>counts[n]||0));
    return cands.filter(n=>(counts[n]||0)===max);
  }

  function confirmVote() {
    const filled={};
    noms.forEach(n=>{filled[n]=vRound[n]??0;});
    setVRound(filled);
    const nonZero=noms.filter(n=>filled[n]>0);
    log(`Vote: ${noms.map(n=>`P${n}:${filled[n]}`).join(", ")}`);
    if(nonZero.length===0){
      setVoteLog(h=>[...h,{day,candidates:[...noms],votes:filled,revotes:null,out:null}]);
      log("All 0 — no elimination."); setVStage("done"); return;
    }
    const t=maxTied(filled,nonZero);
    if(t.length===1){
      setVoteLog(h=>[...h,{day,candidates:[...noms],votes:filled,revotes:null,out:t[0]}]);
      setLwPlayer(t[0]); setLwKey(k=>k+1); setLwNext("voting_done");
      log(`P${t[0]} gets last word.`); setSc("lastword");
    } else {
      setTied(t); setDefIdx(0); setDefKey(k=>k+1); setVRound(filled);
      setVStage("defense"); log(`Tie: P${t.join(", P")} — shootout.`);
    }
  }

  function confirmRevote() {
    const filled2={};
    tied.forEach(n=>{filled2[n]=rv[n]??0;});
    setRv(filled2);
    const nonZero2=tied.filter(n=>filled2[n]>0);
    log(`Re-vote: ${tied.map(n=>`P${n}:${filled2[n]}`).join(", ")}`);
    if(nonZero2.length===0){setVStage("raise_both");log("All 0 — raise-both.");return;}
    const t2=maxTied(filled2,nonZero2);
    if(t2.length===1){
      setVoteLog(h=>[...h,{day,candidates:[...noms],votes:vRound,revotes:filled2,out:t2[0]}]);
      setLwPlayer(t2[0]); setLwKey(k=>k+1); setLwNext("voting_done");
      log(`P${t2[0]} gets last word.`); setSc("lastword");
    } else {setTied(t2);setVStage("raise_both");log("Still tied — raise-both.");}
  }

  function confirmRaiseBoth() {
    const forV=parseInt(rbFor)||0;
    const need=Math.floor(alive().length/2)+1;
    log(`Raise-both: ${forV}/${need}`);
    if(forV>=need){
      let ps=players;
      tied.forEach(n=>{ps=eliminate(ps,n);log(`P${n} eliminated (raise-both).`);});
      setPlayers(ps);
      setVoteLog(h=>[...h,{day,candidates:[...noms],votes:vRound,revotes:rv,out:tied.join("+")}]);
      if(!checkWin(ps)) setVStage("done");
    } else {
      setVoteLog(h=>[...h,{day,candidates:[...noms],votes:vRound,revotes:rv,out:null}]);
      log("Raise-both rejected."); setVStage("done");
    }
  }

  /* ── last word ── */
  function finishLastWord() {
    if(!lwPlayer) return;
    const num=lwPlayer;
    const np=eliminate(players,num);
    setPlayers(np);
    log(`P${num} (${players[num-1]?.name}) eliminated.`);
    setLwPlayer(null);
    if(checkWin(np)) return;
    if(lwNext==="voting_done"){setVStage("done");setSc("voting");}
    else setSc("day");
  }

  /* ── night ── */
  function startNight() {
    setShots({}); setShooterSel(null);
    setDonChk(null); setSherChk(null); setNightKilled(null);
    setNightPh("mafia"); setSc("night"); log(`Night ${day} begins.`);
  }

  function confirmShots() {
    const mafiaCount = mafiaAlive().length;
    const tally={};
    Object.values(shots).forEach(t=>{tally[t]=(tally[t]||0)+1;});
    const top=Object.entries(tally).sort((a,b)=>b[1]-a[1])[0];
    if(!top) return;

    const topCount = parseInt(top[1]);
    const t = parseInt(top[0]);

    setAllShots(prev=>({...prev,...shots}));

    // MISSED SHOT: if mafia didn't all shoot same target → nobody dies
    if(topCount < mafiaCount) {
      log(`Night ${day}: MISSED SHOT — mafia disagreed. Nobody killed.`);
      setNightKilled(null);
      setNightPh("don");
      return;
    }

    const np=eliminate(players,t);
    setPlayers(np); setNightKilled(t);
    log(`Night ${day}: ${t} (${players[t-1]?.name}) killed.`);
    if(!firstKilled) setFirstKilled(t);
    if(!checkWin(np)) setNightPh("don");
  }

  function handleNightEnd() {
    const nextDay=day+1;
    const newOffset=dayOffset+1; // shift start by 1 each day
    setDay(nextDay);
    setDayOffset(newOffset);
    if(firstKilled&&!bestDone) setShowBest(true);
    goDay(nextDay, newOffset);
  }

  /* ── PDF export ── */
  function doExport() {
    printPDF({players,judge,gameNum,winner,bestMoveNoms:bestNoms,firstKilled,allShots,voteLog,gameLog});
  }

  /* ════════════════ RENDER ════════════════ */
  const aliveCount=alive().length;
  const mafCount=mafiaAlive().length;

  return(
    <div style={{minHeight:"100vh",background:"#09090f",color:"#e0e0e0",fontFamily:"'Georgia',serif"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        input{background:#141424;border:1px solid #28283a;border-radius:7px;color:#e0e0e0;padding:7px 10px;font-family:inherit;font-size:13px;outline:none;width:100%}
        input:focus{border-color:#c0392b}
        .btn{background:#c0392b;border:none;border-radius:8px;color:#fff;padding:8px 18px;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;transition:all .13s}
        .btn:hover{background:#e74c3c}.btn:disabled{opacity:.35;cursor:not-allowed}
        .dk{background:#181828;border:1px solid #282838;color:#999}.dk:hover{background:#1e1e30}
        .gd{background:#6a4a06}.gd:hover{background:#b8860b}
        .sm{padding:3px 9px;font-size:11px;border-radius:6px}
        .card{background:#0f0f1e;border:1px solid #1a1a2c;border-radius:13px;padding:16px;margin-bottom:10px}
        .bdg{display:inline-block;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase}
        .nb{background:#0a0a14;border:1px solid #22223a;color:#555}
        .db{background:#2a1600;border:1px solid #6a3a00;color:#b87000}
        .vb{background:#08182a;border:1px solid #18426a;color:#4a9abe}
        .nr{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#0a0a16;border-radius:8px;margin-bottom:5px;border:1px solid #181828}
        .vi{width:64px;text-align:center;font-size:14px;font-weight:700;padding:5px}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px}
      `}</style>

      {/* TOPBAR */}
      <div style={{background:"#060610",borderBottom:"1px solid #141424",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,background:"#c0392b",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🃏</div>
          <div>
            <div style={{fontWeight:700,fontSize:13}}>SPORTS MAFIA</div>
            <div style={{fontSize:9,color:"#3a3a4a"}}>{judge&&`${judge}`}{gameNum&&` · #${gameNum}`}{sc!=="setup"&&` · Day ${day}`}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {sc!=="setup"&&<span style={{fontSize:10,color:"#444",marginRight:4}}>Alive:<b style={{color:"#777",marginLeft:2}}>{aliveCount}</b> Mafia:<b style={{color:"#c0392b",marginLeft:2}}>{mafCount}</b></span>}
          {sc!=="setup"&&<button className="btn dk sm" onClick={()=>setShowLog(x=>!x)}>📋</button>}
          <button className="btn gd sm" onClick={doExport}>⬇ PDF</button>
        </div>
      </div>

      <div style={{maxWidth:700,margin:"0 auto",padding:"16px 12px"}}>

        {/* ══ SETUP ══ */}
        {sc==="setup"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:22}}>
              <h1 style={{fontSize:22,fontWeight:800,letterSpacing:2,marginBottom:4}}>NEW GAME</h1>
              <p style={{color:"#444",fontSize:12}}>3 mafia (1 don) · 6 civilians · 1 sheriff</p>
            </div>
            <div className="card">
              <div style={{display:"flex",gap:9}}>
                <div style={{flex:1}}><label style={{fontSize:10,color:"#555",display:"block",marginBottom:3}}>JUDGE</label><input value={judge} onChange={e=>setJudge(e.target.value)} placeholder="Judge name"/></div>
                <div style={{width:80}}><label style={{fontSize:10,color:"#555",display:"block",marginBottom:3}}>GAME #</label><input value={gameNum} onChange={e=>setGameNum(e.target.value)} placeholder="1"/></div>
              </div>
            </div>
            <div className="card">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                {players.map((p,i)=>(
                  <div key={i} style={{position:"relative"}}>
                    <label style={{fontSize:10,color:"#555",display:"block",marginBottom:3}}>PLAYER {i+1}</label>
                    <input value={p.name} onChange={e=>handleName(i,e.target.value)} placeholder="Nickname…" autoComplete="off"/>
                    {sugg[i]?.length>0&&(
                      <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#141424",border:"1px solid #28283a",borderRadius:7,zIndex:30,overflow:"hidden",marginTop:2,boxShadow:"0 4px 12px #000a"}}>
                        {sugg[i].map((s,j)=>(
                          <div key={j} onClick={()=>pickSugg(i,s)}
                            style={{padding:"6px 10px",cursor:"pointer",fontSize:12,color:"#bbb",borderBottom:"1px solid #1e1e2e"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#1c1c2e"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{s}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {history.length>0&&<div style={{marginTop:9,fontSize:10,color:"#444",display:"flex",alignItems:"center",gap:7}}>
                <span>💾 {history.length} saved</span>
                <button className="btn dk sm" style={{fontSize:9}} onClick={()=>{setHistory([]);localStorage.removeItem("mafiaH");}}>Clear</button>
              </div>}
            </div>
            <button className="btn" style={{width:"100%",padding:11,fontSize:14}} onClick={startGame} disabled={players.filter(p=>p.name.trim()).length<10}>🎲 Deal Cards & Start</button>
          </div>
        )}

        {/* ══ DEALING ══ */}
        {sc==="dealing"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:16}}>
              <span className="bdg nb">РАЗДАЧА КАРТ</span>
              <h2 style={{fontSize:17,fontWeight:700,marginTop:8,color:"#e0e0e0"}}>
                {dealReveal
                  ? `Игрок ${dealReveal.playerIdx+1} — ${players[dealReveal.playerIdx]?.name}`
                  : `Ход игрока ${dealCurrent+1} — ${players[dealCurrent]?.name}`}
              </h2>
              <p style={{fontSize:11,color:"#555",marginTop:4}}>
                {dealReveal
                  ? "Посмотри на свою карту. Покажи только себе."
                  : `Выбери карту (1–${dealCards.length})`}
              </p>
            </div>

            {/* Role reveal overlay */}
            {dealReveal&&(()=>{
              const rc=RC[dealReveal.role]||RC.civ;
              return(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",zIndex:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18}}>
                  <div style={{fontSize:12,color:"#444",letterSpacing:1,textTransform:"uppercase"}}>Карта #{dealReveal.displayNum}</div>
                  <div style={{width:160,height:220,borderRadius:14,background:rc.bg,border:`3px solid ${rc.text}55`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,boxShadow:`0 0 50px ${rc.text}33`}}>
                    <div style={{fontSize:50,lineHeight:1}}>
                      {dealReveal.role===R.don?"🎩":dealReveal.role===R.mafia?"🔫":dealReveal.role===R.sheriff?"⭐":"👤"}
                    </div>
                    <div style={{fontSize:22,fontWeight:900,color:rc.text,letterSpacing:1}}>{rc.label.toUpperCase()}</div>
                    <div style={{fontSize:11,color:rc.text+"88",marginTop:4}}>Игрок {dealReveal.playerIdx+1}</div>
                  </div>
                  <button className="btn" style={{marginTop:10,padding:"10px 32px",fontSize:14}} onClick={confirmDeal}>
                    {dealCurrent>=9?"✓ Все карты розданы →":"Понял, закрыть →"}
                  </button>
                  <div style={{fontSize:10,color:"#252525"}}>Не показывай карту другим игрокам</div>
                </div>
              );
            })()}

            {/* Card grid — renumbered each turn */}
            {!dealReveal&&(
              <div style={{
                display:"grid",
                gridTemplateColumns:`repeat(${Math.min(dealCards.length,5)},1fr)`,
                gap:10,maxWidth:420,margin:"0 auto",padding:"0 8px"
              }}>
                {dealCards.map((card,pos)=>(
                  <button key={pos} onClick={()=>pickCard(pos)}
                    style={{
                      height:110,borderRadius:12,
                      border:"1px solid #c0392b",
                      background:"#0f0f1e",
                      cursor:"pointer",
                      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,
                      transition:"all .15s",
                      boxShadow:"0 0 12px #c0392b22",
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.background="#1a0a0e";e.currentTarget.style.borderColor="#e74c3c";e.currentTarget.style.boxShadow="0 0 20px #e74c3c44";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="#0f0f1e";e.currentTarget.style.borderColor="#c0392b";e.currentTarget.style.boxShadow="0 0 12px #c0392b22";}}
                  >
                    <div style={{fontSize:28}}>🃏</div>
                    <div style={{fontSize:20,fontWeight:900,color:"#c0392b"}}>{pos+1}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Progress dots */}
            {!dealReveal&&(
              <div style={{marginTop:18,display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap"}}>
                {players.map((p,i)=>(
                  <div key={i} style={{
                    fontSize:10,padding:"3px 9px",borderRadius:6,
                    background:i<dealCurrent?"#0a150a":i===dealCurrent?"#1a0a0a":"#0a0a14",
                    border:`1px solid ${i<dealCurrent?"#2a4a2a":i===dealCurrent?"#c0392b":"#1a1a2a"}`,
                    color:i<dealCurrent?"#4a8a4a":i===dealCurrent?"#e74c3c":"#333",
                    fontWeight:i===dealCurrent?700:400,
                  }}>{i+1}{i<dealCurrent?" ✓":""}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ROLES ══ */}
        {sc==="roles"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:14}}><span className="bdg nb">CARDS DEALT</span><h2 style={{fontSize:17,fontWeight:700,marginTop:6}}>Show each card privately</h2></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center",marginBottom:16}}>{players.map((p,i)=><Chip key={i} p={p} num={i+1} showRole={showRoles}/>)}</div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button className="btn dk" onClick={()=>setShowRoles(r=>!r)}>{showRoles?"🙈 Hide":"👁 Reveal"}</button>
              <button className="btn" onClick={()=>{setSc("night1");setNightPh("mafia");log("Night 1 begins.");}}>🌙 Night 1 →</button>
            </div>
          </div>
        )}

        {/* ══ NIGHT 1 ══ */}
        {sc==="night1"&&(
          <div>
            <NightMusic/>
            <div style={{textAlign:"center",marginBottom:14}}><span className="bdg nb">NIGHT 1</span>
              <h2 style={{fontSize:17,fontWeight:700,marginTop:6}}>
                {nightPh==="mafia"&&"🌙 Mafia Awakens"}
                {nightPh==="sheriff"&&"👮 Sheriff Identifies"}
                {nightPh==="seating"&&"🪑 Free Seating"}
              </h2>
            </div>
            <div className="card" style={{textAlign:"center"}}>
              {nightPh==="mafia"&&<><p style={{color:"#666",fontSize:12,marginBottom:14}}>Mafia opens eyes. 60 sec.</p><Timer sec={60} color="#7a0000" label="Mafia" rk="n1m"/><br/><button className="btn" style={{marginTop:8}} onClick={()=>{setNightPh("sheriff");log("Sheriff phase.");}}>Sheriff →</button></>}
              {nightPh==="sheriff"&&<><p style={{color:"#666",fontSize:12,marginBottom:14}}>Sheriff identifies. 10 sec.</p><Timer sec={10} color="#1a5090" label="Sheriff" rk="n1s"/><br/><button className="btn" style={{marginTop:8}} onClick={()=>{setNightPh("seating");log("Free seating.");}}>Seating →</button></>}
              {nightPh==="seating"&&<><p style={{color:"#666",fontSize:12,marginBottom:14}}>Free seating. 20 sec.</p><Timer sec={20} color="#1a5030" label="Seating" rk="n1fs"/><br/><button className="btn" style={{marginTop:8}} onClick={()=>{setDay(1);setDayOffset(0);goDay(1,0);}}>☀ Day 1 →</button></>}
            </div>
          </div>
        )}

        {/* ══ DAY ══ */}
        {sc==="day"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:10}}><span className="bdg db">DAY {day}</span></div>

            {/* BEST MOVE */}
            {showBest&&!bestDone&&firstKilled&&(
              <div className="card" style={{border:"1px solid #4a3800",background:"#100e00",marginBottom:10}}>
                <div style={{fontSize:13,color:"#FFD700",fontWeight:700,marginBottom:5}}>⭐ Best Move — P{firstKilled} ({players[firstKilled-1]?.name})</div>
                <p style={{fontSize:11,color:"#888",marginBottom:10}}>First victim names 3 suspected Mafia.</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:9}}>
                  {players.map((p,i)=>!p.eliminated&&i+1!==firstKilled&&(
                    <button key={i} onClick={()=>{
                      if(bestNoms.includes(i+1)) setBestNoms(p=>p.filter(x=>x!==i+1));
                      else if(bestNoms.length<3) setBestNoms(p=>[...p,i+1]);
                    }}
                      style={{background:bestNoms.includes(i+1)?"#3a2800":"#141424",border:`1px solid ${bestNoms.includes(i+1)?"#FFD700":"#28283a"}`,borderRadius:7,color:bestNoms.includes(i+1)?"#FFD700":"#bbb",padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:bestNoms.includes(i+1)?700:400}}>
                      {i+1} — {p.name}
                    </button>
                  ))}
                </div>
                {bestNoms.length===3&&(()=>{const c=bestNoms.filter(n=>players[n-1]?.role===R.mafia||players[n-1]?.role===R.don).length;return<div style={{fontSize:11,color:"#FFD700",marginBottom:9}}>P{bestNoms.join(", P")} — {c}/3 correct</div>;})()}
                <div style={{display:"flex",gap:7}}>
                  <button className="btn dk sm" onClick={()=>setShowBest(false)}>Skip</button>
                  <button className="btn gd" disabled={bestNoms.length<3} onClick={()=>{log(`Best Move P${firstKilled}: P${bestNoms.join(", P")}`);setBestDone(true);setShowBest(false);}}>✓ Record</button>
                </div>
              </div>
            )}

            {/* PLAYER GRID */}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:12}}>
              {players.map((p,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <Chip p={p} num={i+1} showRole={showRoles} selected={dayNoms.includes(i+1)}/>
                  <div style={{display:"flex",gap:2}}>
                    {!p.eliminated&&(
                      <button className="btn dk sm"
                        title={currentSpeaker>=0?`P${currentSpeaker+1} nominates P${i+1}`:`Toggle P${i+1}`}
                        style={{padding:"2px 6px",fontSize:9,borderColor:dayNoms.includes(i+1)?"#c0392b":"#28283a",color:dayNoms.includes(i+1)?"#e74c3c":"#666",background:dayNoms.includes(i+1)?"#2a0a0a":"#181828"}}
                        onClick={()=>toggleNom(i+1)}>+V</button>
                    )}
                    <button className="btn dk sm" style={{padding:"2px 6px",fontSize:9,borderColor:"#3a1414",color:"#a04040"}} onClick={()=>setFoulModal(i+1)}>F</button>
                    {!p.eliminated&&<button className="btn dk sm" style={{padding:"2px 5px",fontSize:9,borderColor:"#2a1a1a",color:"#664444"}} onClick={()=>setKickModal(i+1)}>✕</button>}
                  </div>
                </div>
              ))}
            </div>

            {/* SPEECHES */}
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                <div style={{fontSize:11,fontWeight:700,color:"#777",letterSpacing:.5}}>SPEECHES</div>
                <div style={{fontSize:9,color:"#444"}}>
                  order: {speechOrder.map((idx,pos)=>(
                    <span key={idx} style={{marginRight:2,color:pos===speechPos?"#e74c3c":pos<speechPos?"#333":"#666",fontWeight:pos===speechPos?700:400}}>{idx+1}</span>
                  ))}
                </div>
              </div>
              {currentSpeaker>=0?(
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:18}}>
                  <Timer sec={60} color="#b07800" label={`${currentSpeaker+1}`} rk={speechKey} onEnd={nextSpeech}/>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    <button className="btn dk" onClick={nextSpeech}>⏭ End Speech</button>
                    <div style={{fontSize:9,color:"#444",textAlign:"center"}}>Press <b style={{color:"#e74c3c"}}>+V</b> to nominate</div>
                  </div>
                </div>
              ):(
                <p style={{color:"#333",fontSize:11,textAlign:"center"}}>All speeches done.</p>
              )}
            </div>

            {/* BALLOT */}
            {dayNoms.length>0&&(
              <div className="card">
                <div style={{fontSize:10,color:"#555",marginBottom:6,fontWeight:700,letterSpacing:.5}}>
                  BALLOT {dayNoms.length===1&&<span style={{color:"#e74c3c",marginLeft:5}}>⚠ 1 nominee — last word then auto-eliminate</span>}
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {dayNoms.map(n=>(
                    <div key={n} style={{display:"flex",alignItems:"center",gap:4,background:"#180f0f",border:"1px solid #381414",borderRadius:6,padding:"3px 8px",fontSize:11}}>
                      <span style={{fontWeight:700,color:"#e74c3c"}}>P{n}</span>
                      <span style={{color:"#666"}}>{players[n-1]?.name}</span>
                      <button onClick={()=>{setDayNoms(p=>p.filter(x=>x!==n));log(`P${n} removed from ballot.`);}} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:12,lineHeight:1}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:8}}>
              <button className="btn dk" style={{flex:1}} onClick={()=>setShowRoles(r=>!r)}>{showRoles?"🙈":"👁"}</button>
              {dayNoms.length>0
                ?<button className="btn" style={{flex:3}} onClick={goVoting}>{dayNoms.length===1?"⚖ Last Word & Eliminate":"🗳 Voting →"}</button>
                :<button className="btn dk" style={{flex:3}} onClick={startNight}>🌙 Night (no vote)</button>}
            </div>
          </div>
        )}

        {/* ══ LAST WORD ══ */}
        {sc==="lastword"&&lwPlayer&&(
          <div>
            <div style={{textAlign:"center",marginBottom:14}}>
              <span className="bdg" style={{background:"#1e0a00",border:"1px solid #8b3000",color:"#e07030"}}>LAST WORD</span>
              <h2 style={{fontSize:17,fontWeight:700,marginTop:6}}>P{lwPlayer} — Final Speech</h2>
            </div>
            <div className="card" style={{textAlign:"center"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:14}}>
                <div style={{width:54,height:54,background:"#1a0a0a",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:26,color:"#e74c3c",border:"1px solid #3a1414"}}>{lwPlayer}</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:17,fontWeight:700}}>{players[lwPlayer-1]?.name}</div>
                  <div style={{fontSize:11,color:"#888"}}>60 seconds to speak</div>
                </div>
              </div>
              <Timer sec={60} color="#8b2000" label="Last word" rk={lwKey}/>
              <div style={{marginTop:14}}>
                <button className="btn" style={{background:"#8b0000",padding:"10px 24px",fontSize:14}} onClick={finishLastWord}>
                  ✕ Eliminate P{lwPlayer} — Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ VOTING ══ */}
        {sc==="voting"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:14}}>
              <span className="bdg vb">VOTING · DAY {day}</span>
              <h2 style={{fontSize:17,fontWeight:700,marginTop:6}}>
                {vStage==="initial"&&"Round 1"}
                {vStage==="defense"&&`🔫 Shootout ${defIdx+1}/${tied.length}`}
                {vStage==="revote"&&"Re-vote"}
                {vStage==="raise_both"&&"Double Tie — Raise Both?"}
                {vStage==="done"&&"Voting Complete ✓"}
              </h2>
            </div>

            {vStage==="initial"&&(
              <div className="card">
                <div style={{fontSize:10,color:"#555",marginBottom:9,fontWeight:700,letterSpacing:.5}}>ENTER VOTES (0 = no votes)</div>
                {noms.map(n=>(
                  <div key={n} className="nr">
                    <div style={{width:34,height:34,background:"#181828",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:"#e74c3c",flexShrink:0}}>{n}</div>
                    <div style={{flex:1,fontSize:12,fontWeight:700}}>{players[n-1]?.name}</div>
                    <input type="number" min="0" max="10" className="vi" value={vRound[n]??""} onChange={e=>setVRound(r=>({...r,[n]:e.target.value===""?undefined:parseInt(e.target.value)||0}))} placeholder="0"/>
                    <span style={{fontSize:10,color:"#444",width:26}}>votes</span>
                    <button onClick={()=>{setNoms(p=>p.filter(x=>x!==n));setVRound(r=>{const c={...r};delete c[n];return c;});}} style={{background:"none",border:"1px solid #281818",borderRadius:5,color:"#663333",cursor:"pointer",fontSize:11,padding:"2px 6px"}}>✕</button>
                  </div>
                ))}
                {noms.length===0&&<p style={{color:"#444",fontSize:11,textAlign:"center",padding:"8px 0"}}>No candidates.</p>}
                <div style={{display:"flex",justifyContent:"space-between",marginTop:11}}>
                  <button className="btn dk sm" onClick={()=>setSc("day")}>← Back</button>
                  <button className="btn" onClick={confirmVote} disabled={noms.length===0}>Confirm →</button>
                </div>
              </div>
            )}

            {vStage==="defense"&&(
              <div className="card" style={{textAlign:"center"}}>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:"#555",marginBottom:5,fontWeight:700}}>DEFENDING</div>
                  <div style={{display:"inline-flex",alignItems:"center",gap:12,background:"#0c1520",border:"1px solid #18406a",borderRadius:9,padding:"9px 16px"}}>
                    <div style={{width:44,height:44,background:"#181828",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:21,color:"#e74c3c"}}>{tied[defIdx]}</div>
                    <div style={{textAlign:"left"}}>
                      <div style={{fontSize:14,fontWeight:700}}>{players[tied[defIdx]-1]?.name}</div>
                      <div style={{fontSize:10,color:"#4a7a9a"}}>30 seconds</div>
                    </div>
                  </div>
                </div>
                <Timer sec={30} color="#1a5a90" label="Defense" rk={defKey}/>
                <div style={{display:"flex",gap:7,justifyContent:"center",marginTop:13}}>
                  <button className="btn dk" onClick={()=>setDefKey(k=>k+1)}>↺</button>
                  <button className="btn" onClick={()=>{
                    if(defIdx+1<tied.length){setDefIdx(i=>i+1);setDefKey(k=>k+1);}
                    else{setRv({});setVStage("revote");log("Re-vote.");}
                  }}>{defIdx+1<tied.length?`Next: P${tied[defIdx+1]} →`:"Re-vote →"}</button>
                </div>
                <div style={{marginTop:11,display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap"}}>
                  {tied.map((n,i)=>(
                    <div key={n} style={{padding:"3px 9px",borderRadius:7,background:i===defIdx?"#0c1820":"#0a0a14",border:`1px solid ${i===defIdx?"#285070":"#181828"}`,fontSize:11,color:i===defIdx?"#6aacce":i<defIdx?"#3a6a3a":"#333"}}>
                      P{n} {i<defIdx?"✓":""}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vStage==="revote"&&(
              <div className="card">
                <div style={{fontSize:10,color:"#555",marginBottom:6,fontWeight:700,letterSpacing:.5}}>RE-VOTE — tied only</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:11}}>
                  {tied.map(n=><div key={n} style={{padding:"3px 9px",borderRadius:6,background:"#111120",border:"1px solid #22223a",fontSize:11}}>P{n} — {players[n-1]?.name} <span style={{color:"#444"}}>({vRound[n]||0} prev)</span></div>)}
                </div>
                {tied.map(n=>(
                  <div key={n} className="nr">
                    <div style={{width:34,height:34,background:"#181828",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:"#e74c3c",flexShrink:0}}>{n}</div>
                    <div style={{flex:1,fontSize:12,fontWeight:700}}>{players[n-1]?.name}</div>
                    <input type="number" min="0" max="10" className="vi" value={rv[n]??""} onChange={e=>setRv(r=>({...r,[n]:e.target.value===""?undefined:parseInt(e.target.value)||0}))} placeholder="0"/>
                    <span style={{fontSize:10,color:"#444",width:26}}>votes</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
                  <button className="btn" onClick={confirmRevote}>Confirm →</button>
                </div>
              </div>
            )}

            {vStage==="raise_both"&&(
              <div className="card">
                <div style={{fontSize:10,color:"#555",marginBottom:8,fontWeight:700,letterSpacing:.5}}>JOINT ELIMINATION</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:11}}>
                  {tied.map(n=><div key={n} style={{padding:"4px 11px",borderRadius:7,background:"#180e0e",border:"1px solid #421818",fontSize:12,fontWeight:700,color:"#e74c3c"}}>P{n} — {players[n-1]?.name}</div>)}
                </div>
                {(()=>{
                  const forV=parseInt(rbFor)||0, need=Math.floor(aliveCount/2)+1;
                  return(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginBottom:13}}>
                      <div style={{background:"#0c160c",border:"1px solid #183018",borderRadius:9,padding:"14px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                        <div style={{fontSize:10,color:"#3a7a3a",fontWeight:700}}>VOTED FOR — eliminate all</div>
                        <input type="number" min="0" max={aliveCount} className="vi" value={rbFor} onChange={e=>setRbFor(e.target.value)} placeholder="0" style={{width:84,fontSize:19}}/>
                        <div style={{fontSize:10,color:"#3a3a3a"}}>need {need} of {aliveCount}</div>
                      </div>
                      {rbFor!==""&&<div style={{padding:"6px 14px",background:"#0a0a14",borderRadius:7,fontSize:11,color:"#888",textAlign:"center"}}>
                        {forV>=need?"✅ Majority — all eliminated":`❌ Not enough (${forV}/${need})`}
                      </div>}
                    </div>
                  );
                })()}
                <button className="btn" style={{width:"100%"}} onClick={confirmRaiseBoth} disabled={rbFor===""}>Confirm →</button>
              </div>
            )}

            {vStage==="done"&&(
              <div className="card" style={{textAlign:"center"}}>
                <div style={{fontSize:34,marginBottom:6}}>✓</div>
                <p style={{color:"#888",fontSize:13,marginBottom:16}}>Voting complete.</p>
                <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                  <button className="btn dk" onClick={()=>setSc("day")}>← Back to Day</button>
                  <button className="btn" onClick={startNight}>🌙 Night {day} →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ NIGHT ══ */}
        {sc==="night"&&(
          <div>
            <NightMusic/>
            <div style={{textAlign:"center",marginBottom:14}}><span className="bdg nb">NIGHT {day}</span>
              <h2 style={{fontSize:17,fontWeight:700,marginTop:6}}>
                {nightPh==="mafia"&&"🔫 Mafia Shots"}
                {nightPh==="don"&&"🎩 Don Checks"}
                {nightPh==="sheriff"&&"👮 Sheriff Checks"}
                {nightPh==="done"&&"Night Complete"}
              </h2>
            </div>

            {nightPh==="mafia"&&(
              <div className="card">
                <p style={{color:"#666",fontSize:11,marginBottom:11}}>Select shooter → select target. All alive players are valid targets.</p>
                <div style={{marginBottom:11}}>
                  <div style={{fontSize:10,color:"#444",marginBottom:5,fontWeight:700,letterSpacing:.5}}>SHOOTER</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {mafiaAlive().map(p=>{const num=players.indexOf(p)+1;return(
                      <button key={num} onClick={()=>setShooterSel(num)}
                        style={{background:shooterSel===num?"#c0392b":"#141424",border:`1px solid ${shooterSel===num?"#c0392b":"#28283a"}`,borderRadius:7,color:"#fff",padding:"5px 11px",cursor:"pointer",fontSize:11,fontWeight:700}}>
                        {num}{p.role===R.don?"🎩":""} {p.name}
                      </button>
                    );})}
                  </div>
                </div>
                {shooterSel&&(
                  <div style={{marginBottom:11}}>
                    <div style={{fontSize:10,color:"#444",marginBottom:5,fontWeight:700,letterSpacing:.5}}>P{shooterSel} TARGET (all alive)</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {players.map((p,i)=>{
                        if(p.eliminated) return null;
                        const num=i+1;
                        const isSelf=num===shooterSel;
                        return(
                          <button key={i} onClick={()=>{setShots(s=>({...s,[shooterSel]:num}));log(`Night ${day}: P${shooterSel}→P${num}.`);setShooterSel(null);}}
                            style={{background:"#141424",border:`1px solid ${isSelf?"#5a1a1a":"#28283a"}`,borderRadius:7,color:isSelf?"#884444":"#bbb",padding:"5px 10px",cursor:"pointer",fontSize:11}}>
                            {num} — {p.name}{isSelf?" (self)":""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {Object.keys(shots).length>0&&(
                  <div style={{padding:"8px 10px",background:"#0a0a14",borderRadius:7,fontSize:11,marginBottom:11,border:"1px solid #181828"}}>
                    <div style={{fontSize:10,color:"#444",marginBottom:3,fontWeight:700}}>RECORDED SHOTS</div>
                    {Object.entries(shots).map(([sh,tg])=>(
                      <div key={sh} style={{marginBottom:2,display:"flex",alignItems:"center",gap:5}}>
                        P<b style={{color:"#e74c3c"}}>{sh}</b> ({players[parseInt(sh)-1]?.name}) → P<b style={{color:"#ccc"}}>{tg}</b> ({players[parseInt(tg)-1]?.name})
                        <button onClick={()=>setShots(s=>{const c={...s};delete c[sh];return c;})} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:11}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn" disabled={Object.keys(shots).length===0} onClick={confirmShots}>Confirm Shots →</button>
              </div>
            )}

            {nightPh==="don"&&(
              <div className="card">
                <p style={{color:"#666",fontSize:11,marginBottom:11}}>Don checks if a player is the Sheriff.</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:11}}>
                  {players.map((p,i)=>!p.eliminated&&(
                    <button key={i} onClick={()=>{setDonChk(i+1);log(`Don checked P${i+1}.`);}}
                      style={{background:donChk===i+1?"#3a2c00":"#141424",border:`1px solid ${donChk===i+1?"#b8860b":"#28283a"}`,borderRadius:7,color:"#ddd",padding:"5px 10px",cursor:"pointer",fontSize:11}}>
                      {i+1} — {p.name}
                    </button>
                  ))}
                </div>
                {donChk&&<div style={{padding:"7px 10px",background:"#0a0a14",borderRadius:7,fontSize:11,marginBottom:11}}>P{donChk}: {players[donChk-1]?.role===R.sheriff?"✅ IS Sheriff":"❌ Not Sheriff"}</div>}
                <button className="btn" onClick={()=>setNightPh("sheriff")}>Sheriff Phase →</button>
              </div>
            )}

            {nightPh==="sheriff"&&(
              <div className="card">
                <p style={{color:"#666",fontSize:11,marginBottom:11}}>Sheriff checks if a player is Mafia.</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:11}}>
                  {players.map((p,i)=>!p.eliminated&&(
                    <button key={i} onClick={()=>{setSherChk(i+1);log(`Sheriff checked P${i+1}.`);}}
                      style={{background:sherChk===i+1?"#0a2848":"#141424",border:`1px solid ${sherChk===i+1?"#1a6fb5":"#28283a"}`,borderRadius:7,color:"#ddd",padding:"5px 10px",cursor:"pointer",fontSize:11}}>
                      {i+1} — {p.name}
                    </button>
                  ))}
                </div>
                {sherChk&&<div style={{padding:"7px 10px",background:"#0a0a14",borderRadius:7,fontSize:11,marginBottom:11}}>P{sherChk}: {(players[sherChk-1]?.role===R.mafia||players[sherChk-1]?.role===R.don)?"🔴 IS Mafia":"✅ Not Mafia"}</div>}
                <button className="btn" onClick={()=>setNightPh("done")}>Night Complete →</button>
              </div>
            )}

            {nightPh==="done"&&(
              <div className="card" style={{textAlign:"center"}}>
                <div style={{fontSize:30,marginBottom:6}}>🌙</div>
                <p style={{color:"#888",fontSize:13,marginBottom:16}}>Night {day} complete.</p>
                <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                  <button className="btn dk" onClick={()=>setSc("voting")}>← Voting</button>
                  <button className="btn" onClick={handleNightEnd}>☀ Day {day+1} →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ END ══ */}
        {sc==="end"&&(
          <div style={{textAlign:"center"}}>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:48,marginBottom:6}}>{winner==="mafia"?"🖤":"❤️"}</div>
              <h1 style={{fontSize:24,fontWeight:900,letterSpacing:2,color:winner==="mafia"?"#555":"#e74c3c"}}>{winner==="mafia"?"MAFIA WINS":"CIVILIANS WIN"}</h1>
              <div style={{marginTop:6,fontSize:11,color:"#555"}}>Mafia: {players.filter(p=>p.role===R.mafia||p.role===R.don).map(p=>`P${players.indexOf(p)+1} ${p.name}`).join(", ")}</div>
            </div>
            <div className="card">
              <div style={{fontSize:10,fontWeight:700,color:"#555",marginBottom:10,letterSpacing:.5}}>FINAL ROLES</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>{players.map((p,i)=><Chip key={i} p={p} num={i+1} showRole/>)}</div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:4}}>
              <button className="btn gd" onClick={doExport}>⬇ Download Protocol</button>
              <button className="btn dk" onClick={()=>{
                setSc("setup");setDay(1);setDayOffset(0);setSpeechOffset&&setSpeechOffset(0);
                setPlayers(Array(10).fill(null).map(()=>({name:"",role:R.civ,fouls:0,eliminated:false,points:0})));
                setGameLog([]);setWinner(null);setDayNoms([]);setNoms([]);setVRound({});setRv({});
                setTied([]);setShots({});setAllShots({});setDonChk(null);setSherChk(null);
                setBestNoms([]);setBestDone(false);setShowBest(false);setFirstKilled(null);
                setNightKilled(null);setLwPlayer(null);setVoteLog([]);setVStage("initial");setRbFor("");
              }}>New Game</button>
            </div>
          </div>
        )}
      </div>

      {/* LOG */}
      {showLog&&(
        <div style={{position:"fixed",right:10,top:52,width:256,background:"#060610",border:"1px solid #141424",borderRadius:11,padding:11,zIndex:60,maxHeight:"50vh",overflow:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
            <span style={{fontSize:10,fontWeight:700,color:"#555"}}>GAME LOG</span>
            <button onClick={()=>setShowLog(false)} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:13}}>✕</button>
          </div>
          {gameLog.length===0&&<p style={{color:"#222",fontSize:10}}>No events.</p>}
          {[...gameLog].reverse().map((l,i)=>(
            <div key={i} style={{fontSize:9,color:"#555",borderBottom:"1px solid #0e0e18",padding:"2px 0"}}>
              <span style={{color:"#2a2a2a"}}>{l.t}</span> {l.msg}
            </div>
          ))}
        </div>
      )}

      {/* FOUL MODAL */}
      {foulModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#0c0c1a",border:"1px solid #c0392b",borderRadius:13,padding:18,width:320,maxHeight:"76vh",overflow:"auto"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#e74c3c",marginBottom:3}}>FOUL — P{foulModal}</div>
            <div style={{fontSize:11,color:"#555",marginBottom:3}}>{players[foulModal-1]?.name}</div>
            <div style={{fontSize:10,color:"#666",marginBottom:11}}>
              Fouls: <b style={{color:players[foulModal-1]?.fouls>=3?"#cd853f":"#aaa"}}>{players[foulModal-1]?.fouls}</b>
              {players[foulModal-1]?.fouls===2&&<span style={{color:"#cd853f",marginLeft:5}}>⚠ Next = SILENT</span>}
              {players[foulModal-1]?.fouls===3&&<span style={{color:"#e74c3c",marginLeft:5}}>⚠ Next = ELIMINATED</span>}
            </div>
            {FOULS.map((f,i)=>(
              <button key={i} onClick={()=>addFoul(foulModal,f)}
                style={{display:"block",width:"100%",textAlign:"left",background:"#0e0e18",border:"1px solid #181828",borderRadius:6,color:"#aaa",padding:"6px 10px",cursor:"pointer",marginBottom:4,fontSize:11}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#c0392b";e.currentTarget.style.color="#fff";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#181828";e.currentTarget.style.color="#aaa";}}>
                {f}
              </button>
            ))}
            <button className="btn dk" style={{width:"100%",marginTop:6}} onClick={()=>setFoulModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* KICK MODAL */}
      {kickModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#0c0c1a",border:"1px solid #8b0000",borderRadius:13,padding:18,width:290}}>
            <div style={{fontSize:14,fontWeight:700,color:"#e74c3c",marginBottom:5}}>Remove P{kickModal} from table?</div>
            <div style={{fontSize:13,color:"#888",marginBottom:16}}>{players[kickModal-1]?.name}</div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn dk" style={{flex:1}} onClick={()=>setKickModal(null)}>Cancel</button>
              <button className="btn" style={{flex:1,background:"#8b0000"}} onClick={()=>kickPlayer(kickModal)}>✕ Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
