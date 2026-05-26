import { useState } from "react";

const PLATFORMS = {
  facebook:  { label: "Facebook",  color: "#1877F2", icon: "ti-brand-facebook",  bg: "#E7F0FD" },
  instagram: { label: "Instagram", color: "#E1306C", icon: "ti-brand-instagram", bg: "#FCE8F0" },
  whatsapp:  { label: "WhatsApp",  color: "#25D366", icon: "ti-brand-whatsapp",  bg: "#E6FAF0" },
};

const INIT_CONTACTS = [
  { id:1, name:"María González",  platform:"whatsapp",  phone:"+52 442 123 4567", lastMsg:"¿Tienen disponibilidad para mañana?", time:"10:32", unread:2, status:"pendiente", tag:"cliente" },
  { id:2, name:"Carlos Ramírez",  platform:"facebook",  phone:"+52 442 987 6543", lastMsg:"Quiero información sobre sus precios",  time:"09:15", unread:1, status:"pendiente", tag:"prospecto" },
  { id:3, name:"Ana Herrera",     platform:"instagram", phone:"+52 442 555 1234", lastMsg:"Me encantó el producto 🔥",             time:"08:50", unread:0, status:"resuelto",  tag:"cliente" },
  { id:4, name:"Luis Torres",     platform:"whatsapp",  phone:"+52 442 321 9876", lastMsg:"¿Hacen envíos a CDMX?",                time:"Ayer",  unread:3, status:"pendiente", tag:"prospecto" },
  { id:5, name:"Sofía Mendoza",   platform:"facebook",  phone:"+52 442 654 3210", lastMsg:"Gracias por la atención!",             time:"Ayer",  unread:0, status:"resuelto",  tag:"cliente" },
  { id:6, name:"Roberto Díaz",    platform:"instagram", phone:"+52 442 111 2233", lastMsg:"¿Cuál es el horario de atención?",     time:"Lun",   unread:1, status:"en curso",  tag:"prospecto" },
];

const INIT_CHATS = {
  1: [
    { from:"user", text:"Hola, buenas tardes!", time:"10:20" },
    { from:"agent", text:"¡Hola María! 👋 Bienvenida a Evitare. ¿En qué puedo ayudarte?", time:"10:20" },
    { from:"user", text:"¿Tienen disponibilidad para mañana?", time:"10:32" },
  ],
  2: [
    { from:"user", text:"Buenos días, quiero información sobre sus precios", time:"09:15" },
  ],
  3: [
    { from:"user", text:"Me encantó el producto 🔥", time:"08:50" },
    { from:"agent", text:"¡Muchas gracias Ana! Nos alegra mucho 😊", time:"08:51" },
  ],
  4: [{ from:"user", text:"¿Hacen envíos a CDMX?", time:"Ayer" }],
  5: [{ from:"user", text:"Gracias por la atención!", time:"Ayer" }, { from:"agent", text:"¡Con gusto! Fue un placer atenderte 🌟", time:"Ayer" }],
  6: [{ from:"user", text:"¿Cuál es el horario de atención?", time:"Lun" }],
};

const QUICK_REPLIES = [
  "¡Hola! Bienvenido a Evitare 👋 ¿En qué podemos ayudarte?",
  "Nuestro horario es Lunes a Viernes 8am-6pm y Sábados 9am-2pm.",
  "Con gusto te atiendo. ¿Puedes darme más detalles?",
  "Gracias por contactarnos. Te respondemos en breve ⏱️",
];

export default function App() {
  const [contacts, setContacts] = useState(INIT_CONTACTS);
  const [chats, setChats] = useState(INIT_CHATS);
  const [selected, setSelected] = useState(1);
  const [filter, setFilter] = useState("all");
  const [msgInput, setMsgInput] = useState("");
  const [tab, setTab] = useState("chat");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const contact = contacts.find(c => c.id === selected);
  const pl = contact ? PLATFORMS[contact.platform] : null;
  const msgs = chats[selected] || [];

  const filtered = contacts.filter(c => {
    const matchPlatform = filter === "all" || c.platform === filter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchPlatform && matchSearch;
  });

  function selectContact(id) {
    setSelected(id);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    setTab("chat");
  }

  function sendMsg() {
    if (!msgInput.trim()) return;
    const msg = { from: "agent", text: msgInput, time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) };
    setChats(prev => ({ ...prev, [selected]: [...(prev[selected] || []), msg] }));
    setContacts(prev => prev.map(c => c.id === selected ? { ...c, lastMsg: msgInput, time: "Ahora", status: "en curso" } : c));
    setMsgInput("");
  }

  function changeStatus(status) {
    setContacts(prev => prev.map(c => c.id === selected ? { ...c, status } : c));
  }

  const statusColor = { pendiente: "#F59E0B", "en curso": "#3B82F6", resuelto: "#10B981" };
  const stats = { total: contacts.length, pendiente: contacts.filter(c=>c.status==="pendiente").length, resuelto: contacts.filter(c=>c.status==="resuelto").length };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"Inter,sans-serif", background:"#F3F4F6" }}>

      {/* SIDEBAR */}
      <div style={{ width:320, background:"#fff", borderRight:"1px solid #E5E7EB", display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ padding:"16px", borderBottom:"1px solid #E5E7EB" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#00dfc4,#0a1f5c)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <i className="ti ti-heartbeat" style={{ color:"#fff", fontSize:18 }} />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:"#111827" }}>Evitare CRM</div>
              <div style={{ fontSize:11, color:"#6B7280" }}>Panel de Mensajes</div>
            </div>
          </div>
          {/* Filtros plataforma */}
          <div style={{ display:"flex", gap:4, marginBottom:8 }}>
            {["all","facebook","instagram","whatsapp"].map(p => (
              <button key={p} onClick={() => setFilter(p)} style={{
                flex:1, padding:"4px 0", fontSize:10, fontWeight:600, border:"none", borderRadius:6, cursor:"pointer",
                background: filter===p ? (p==="all"?"#111827": PLATFORMS[p]?.color) : "#F3F4F6",
                color: filter===p ? "#fff" : "#6B7280"
              }}>
                {p==="all" ? "Todos" : <i className={`ti ${PLATFORMS[p].icon}`} />}
              </button>
            ))}
          </div>
          <input
            placeholder="🔍 Buscar contacto..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:12, outline:"none" }}
          />
        </div>

        {/* Lista contactos */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.map(c => {
            const p = PLATFORMS[c.platform];
            return (
              <div key={c.id} onClick={() => selectContact(c.id)} style={{
                padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #F9FAFB",
                background: selected===c.id ? "#F0FDF4" : "transparent",
                borderLeft: selected===c.id ? "3px solid #10B981" : "3px solid transparent",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:p.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:p.color, fontSize:15 }}>
                      {c.name[0]}
                    </div>
                    <div style={{ position:"absolute", bottom:0, right:0, width:14, height:14, borderRadius:"50%", background:p.color, border:"2px solid #fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <i className={`ti ${p.icon}`} style={{ color:"#fff", fontSize:8 }} />
                    </div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontWeight:600, fontSize:13, color:"#111827" }}>{c.name}</span>
                      <span style={{ fontSize:10, color:"#9CA3AF" }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#6B7280", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.lastMsg}</div>
                    <div style={{ display:"flex", gap:4, marginTop:3, alignItems:"center" }}>
                      <span style={{ fontSize:9, padding:"1px 6px", borderRadius:10, background:statusColor[c.status]+"20", color:statusColor[c.status], fontWeight:600 }}>{c.status}</span>
                      {c.unread > 0 && <span style={{ fontSize:9, padding:"1px 6px", borderRadius:10, background:"#EF4444", color:"#fff", fontWeight:700 }}>{c.unread}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats footer */}
        <div style={{ padding:"12px 16px", borderTop:"1px solid #E5E7EB", display:"flex", justifyContent:"space-around" }}>
          {[["Total", stats.total, "#6B7280"], ["Pendientes", stats.pendiente, "#F59E0B"], ["Resueltos", stats.resuelto, "#10B981"]].map(([l,v,c]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
              <div style={{ fontSize:9, color:"#9CA3AF" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      {contact && (
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          {/* Header chat */}
          <div style={{ padding:"12px 20px", background:"#fff", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:pl.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:pl.color, fontSize:16 }}>
              {contact.name[0]}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#111827" }}>{contact.name}</div>
              <div style={{ fontSize:11, color:"#6B7280" }}>{contact.phone} · <span style={{ color:pl.color }}>{pl.label}</span></div>
            </div>
            {/* Tabs */}
            <div style={{ display:"flex", gap:4 }}>
              {["chat","contacto"].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding:"5px 12px", fontSize:12, fontWeight:600, border:"none", borderRadius:8, cursor:"pointer",
                  background: tab===t ? "#111827" : "#F3F4F6", color: tab===t ? "#fff" : "#6B7280"
                }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
              ))}
            </div>
            {/* Status */}
            <select value={contact.status} onChange={e => changeStatus(e.target.value)} style={{
              padding:"5px 8px", fontSize:11, fontWeight:600, border:"1px solid #E5E7EB", borderRadius:8, cursor:"pointer",
              color: statusColor[contact.status], outline:"none"
            }}>
              {["pendiente","en curso","resuelto"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {tab === "chat" ? (
            <>
              {/* Mensajes */}
              <div style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:10, background:"#F9FAFB" }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ display:"flex", justifyContent: m.from==="agent" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth:"65%", padding:"10px 14px", borderRadius: m.from==="agent" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      background: m.from==="agent" ? "#111827" : "#fff",
                      color: m.from==="agent" ? "#fff" : "#111827",
                      fontSize:13, boxShadow:"0 1px 4px rgba(0,0,0,0.08)"
                    }}>
                      {m.text}
                      <div style={{ fontSize:10, marginTop:4, opacity:0.6, textAlign:"right" }}>{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Respuestas rápidas */}
              <div style={{ padding:"8px 16px", background:"#fff", borderTop:"1px solid #F3F4F6", display:"flex", gap:6, overflowX:"auto" }}>
                {QUICK_REPLIES.map((r, i) => (
                  <button key={i} onClick={() => setMsgInput(r)} style={{
                    whiteSpace:"nowrap", padding:"4px 10px", fontSize:11, border:"1px solid #E5E7EB",
                    borderRadius:20, background:"#F9FAFB", cursor:"pointer", color:"#374151"
                  }}>{r.slice(0,30)}…</button>
                ))}
              </div>

              {/* Input */}
              <div style={{ padding:"12px 16px", background:"#fff", borderTop:"1px solid #E5E7EB", display:"flex", gap:8 }}>
                <input
                  value={msgInput} onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && sendMsg()}
                  placeholder="Escribe un mensaje..."
                  style={{ flex:1, padding:"10px 14px", border:"1px solid #E5E7EB", borderRadius:12, fontSize:13, outline:"none" }}
                />
                <button onClick={sendMsg} style={{
                  padding:"10px 18px", background:"#111827", color:"#fff", border:"none", borderRadius:12, cursor:"pointer", fontWeight:600, fontSize:13
                }}>Enviar <i className="ti ti-send" /></button>
              </div>
            </>
          ) : (
            /* Tab Contacto */
            <div style={{ flex:1, overflowY:"auto", padding:24, background:"#F9FAFB" }}>
              <div style={{ background:"#fff", borderRadius:16, padding:20, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:16 }}>Información del Contacto</h3>
                {[["Nombre", contact.name], ["Teléfono", contact.phone], ["Plataforma", pl.label], ["Etiqueta", contact.tag], ["Estado", contact.status]].map(([l,v]) => (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #F3F4F6", fontSize:13 }}>
                    <span style={{ color:"#6B7280" }}>{l}</span>
                    <span style={{ fontWeight:600, color:"#111827" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"#fff", borderRadius:16, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:12 }}>Notas del Agente</h3>
                <textarea
                  value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Escribe notas sobre este contacto..."
                  style={{ width:"100%", minHeight:100, padding:12, border:"1px solid #E5E7EB", borderRadius:10, fontSize:13, outline:"none", resize:"vertical" }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
