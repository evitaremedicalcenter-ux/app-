import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ─── Constantes ────────────────────────────────────────────────────────────
const PLATFORMS = {
  facebook:  { label:"Facebook",  color:"#1877F2", icon:"ti-brand-facebook",  bg:"#E7F0FD" },
  instagram: { label:"Instagram", color:"#E1306C", icon:"ti-brand-instagram", bg:"#FCE8F0" },
  whatsapp:  { label:"WhatsApp",  color:"#25D366", icon:"ti-brand-whatsapp",  bg:"#E6FAF0" },
};
const QUICK_REPLIES = [
  "¡Hola! Bienvenido a Evitare 👋 ¿En qué podemos ayudarte?",
  "Nuestro horario es Lun-Vie 8am-7pm y Sáb 9am-3pm.",
  "Con gusto te atiendo. ¿Puedes darme más detalles?",
  "Gracias por contactarnos. Te respondemos en breve ⏱️",
];
const ALMACENES = ["Clínica Principal", "Hospital Angeles — Zapopan", "Hospital Country — GDL"];
const STATUS_COLOR = { pendiente:"#F59E0B", "en curso":"#3B82F6", resuelto:"#10B981" };
const CITA_COLORS  = { pendiente:"#F59E0B", confirmada:"#3B82F6", realizada:"#10B981", cancelada:"#EF4444" };
const FACTURA_COLORS = { Timbrada:"#10B981", Pendiente:"#F59E0B", Cancelada:"#EF4444" };

// ─── Helpers UI ────────────────────────────────────────────────────────────
const Badge = ({ color, label }) => (
  <span style={{ fontSize:9, padding:"2px 8px", borderRadius:10, background:color+"20", color, fontWeight:700 }}>{label}</span>
);
const Btn = ({ onClick, children, style={}, color="#111827" }) => (
  <button onClick={onClick} style={{ padding:"7px 14px", fontSize:12, fontWeight:600, border:"none", borderRadius:8, cursor:"pointer", background:color, color:"#fff", display:"flex", alignItems:"center", gap:5, ...style }}>{children}</button>
);
const Input = ({ label, ...props }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:4 }}>{label}</div>}
    <input {...props} style={{ width:"100%", padding:"8px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box", ...props.style }} />
  </div>
);
const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:4 }}>{label}</div>}
    <select {...props} style={{ width:"100%", padding:"8px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, outline:"none", background:"#fff", ...props.style }}>{children}</select>
  </div>
);
const Modal = ({ title, onClose, children }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }}>
    <div style={{ background:"#fff", borderRadius:16, padding:28, width:460, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#111827" }}>{title}</h3>
        <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", fontSize:20, color:"#9CA3AF" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);
const Toast = ({ msg }) => msg ? (
  <div style={{ position:"fixed", bottom:24, right:24, background:"#111827", color:"#fff", padding:"12px 20px", borderRadius:12, fontSize:13, fontWeight:600, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,0.25)", display:"flex", alignItems:"center", gap:8 }}>
    <i className="ti ti-check" style={{ color:"#10B981" }} /> {msg}
  </div>
) : null;

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: MENSAJES / CRM
// ═══════════════════════════════════════════════════════════════════════════
function SeccionMensajes({ toast }) {
  const [contacts, setContacts]   = useState([]);
  const [chats, setChats]         = useState({});
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState("all");
  const [msgInput, setMsgInput]   = useState("");
  const [tab, setTab]             = useState("chat");
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ nombre:"", telefono:"", plataforma:"whatsapp", etiqueta:"prospecto" });
  const [note, setNote]           = useState("");
  const endRef = useRef();

  async function loadContacts() {
    const { data } = await supabase.from("contactos").select("*").order("created_at", { ascending:false });
    if (data) { setContacts(data); if (!selected && data.length) setSelected(data[0].id); }
    setLoading(false);
  }
  async function loadMsgs(id) {
    const { data } = await supabase.from("mensajes").select("*").eq("contacto_id", id).order("created_at");
    if (data) setChats(prev => ({ ...prev, [id]: data }));
  }
  useEffect(() => { loadContacts(); }, []);
  useEffect(() => { if (selected) { loadMsgs(selected); setNote(contacts.find(c=>c.id===selected)?.notas||""); } }, [selected]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chats, selected]);

  // Suscripción realtime
  useEffect(() => {
    const ch = supabase.channel("mensajes_rt")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"mensajes" }, payload => {
        const m = payload.new;
        setChats(prev => ({ ...prev, [m.contacto_id]: [...(prev[m.contacto_id]||[]), m] }));
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const contact = contacts.find(c => c.id === selected);
  const pl = contact ? PLATFORMS[contact.plataforma] : null;
  const msgs = chats[selected] || [];
  const filtered = contacts.filter(c => {
    const matchP = filter === "all" || c.plataforma === filter;
    const matchS = c.nombre.toLowerCase().includes(search.toLowerCase());
    return matchP && matchS;
  });

  async function selectContact(id) {
    setSelected(id);
    setTab("chat");
    await supabase.from("contactos").update({ mensajes_sin_leer:0 }).eq("id", id);
    setContacts(prev => prev.map(c => c.id===id ? {...c, mensajes_sin_leer:0} : c));
  }
  async function sendMsg() {
    if (!msgInput.trim() || !selected) return;
    const tiempo = new Date().toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});
    const { data } = await supabase.from("mensajes").insert({ contacto_id:selected, de:"agent", texto:msgInput, tiempo }).select().single();
    if (data) setChats(prev => ({ ...prev, [selected]:[...(prev[selected]||[]), data] }));
    await supabase.from("contactos").update({ ultimo_mensaje:msgInput, tiempo:"Ahora", estado:"en curso" }).eq("id", selected);
    setContacts(prev => prev.map(c => c.id===selected ? {...c, ultimo_mensaje:msgInput, tiempo:"Ahora", estado:"en curso"} : c));
    setMsgInput("");
  }
  async function changeStatus(status) {
    await supabase.from("contactos").update({ estado:status }).eq("id", selected);
    setContacts(prev => prev.map(c => c.id===selected ? {...c, estado:status} : c));
    toast("Estado actualizado");
  }
  async function saveNote() {
    await supabase.from("contactos").update({ notas:note }).eq("id", selected);
    toast("Nota guardada");
  }
  async function addContact() {
    if (!form.nombre) return;
    const { data } = await supabase.from("contactos").insert({ ...form, mensajes_sin_leer:0, estado:"pendiente", ultimo_mensaje:"Nuevo contacto", tiempo:"Ahora" }).select().single();
    if (data) { setContacts(prev => [data, ...prev]); setSelected(data.id); }
    setShowForm(false); setForm({ nombre:"", telefono:"", plataforma:"whatsapp", etiqueta:"prospecto" });
    toast("Contacto agregado");
  }
  async function deleteContact(id) {
    if (!confirm("¿Eliminar este contacto y sus mensajes?")) return;
    await supabase.from("contactos").delete().eq("id", id);
    setContacts(prev => prev.filter(c => c.id !== id));
    if (selected === id) setSelected(contacts[0]?.id || null);
    toast("Contacto eliminado");
  }

  const stats = { total:contacts.length, pendiente:contacts.filter(c=>c.estado==="pendiente").length, resuelto:contacts.filter(c=>c.estado==="resuelto").length };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* SIDEBAR */}
      <div style={{ width:310, background:"#fff", borderRight:"1px solid #E5E7EB", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:14, borderBottom:"1px solid #E5E7EB" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontWeight:700, fontSize:13, color:"#111827" }}>Conversaciones</span>
            <Btn onClick={()=>setShowForm(true)} color="#10B981" style={{ padding:"5px 10px", fontSize:11 }}>
              <i className="ti ti-plus" /> Nuevo
            </Btn>
          </div>
          <div style={{ display:"flex", gap:4, marginBottom:8 }}>
            {["all","facebook","instagram","whatsapp"].map(p => (
              <button key={p} onClick={()=>setFilter(p)} style={{ flex:1, padding:"4px 0", fontSize:10, fontWeight:600, border:"none", borderRadius:6, cursor:"pointer", background:filter===p?(p==="all"?"#111827":PLATFORMS[p]?.color):"#F3F4F6", color:filter===p?"#fff":"#6B7280" }}>
                {p==="all" ? "Todos" : <i className={`ti ${PLATFORMS[p].icon}`} />}
              </button>
            ))}
          </div>
          <input placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:"100%", padding:"7px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box" }} />
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {loading && <div style={{ padding:20, textAlign:"center", color:"#9CA3AF", fontSize:13 }}>Cargando...</div>}
          {filtered.map(c => {
            const p = PLATFORMS[c.plataforma]||PLATFORMS.whatsapp;
            return (
              <div key={c.id} onClick={()=>selectContact(c.id)} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #F9FAFB", background:selected===c.id?"#F0FDF4":"transparent", borderLeft:selected===c.id?"3px solid #10B981":"3px solid transparent", position:"relative" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:p.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:p.color, fontSize:14 }}>{c.nombre[0]}</div>
                    <div style={{ position:"absolute", bottom:0, right:0, width:13, height:13, borderRadius:"50%", background:p.color, border:"2px solid #fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <i className={`ti ${p.icon}`} style={{ color:"#fff", fontSize:7 }} />
                    </div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontWeight:600, fontSize:13, color:"#111827" }}>{c.nombre}</span>
                      <span style={{ fontSize:10, color:"#9CA3AF" }}>{c.tiempo}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#6B7280", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.ultimo_mensaje}</div>
                    <div style={{ display:"flex", gap:4, marginTop:2, alignItems:"center" }}>
                      <Badge color={STATUS_COLOR[c.estado]||"#6B7280"} label={c.estado} />
                      {c.mensajes_sin_leer>0 && <Badge color="#EF4444" label={c.mensajes_sin_leer} />}
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();deleteContact(c.id);}} style={{ border:"none", background:"none", cursor:"pointer", color:"#EF4444", fontSize:13, opacity:0.5, padding:"2px 4px" }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding:"10px 16px", borderTop:"1px solid #E5E7EB", display:"flex", justifyContent:"space-around" }}>
          {[["Total",stats.total,"#6B7280"],["Pendientes",stats.pendiente,"#F59E0B"],["Resueltos",stats.resuelto,"#10B981"]].map(([l,v,c])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
              <div style={{ fontSize:9, color:"#9CA3AF" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA CHAT */}
      {contact ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"10px 18px", background:"#fff", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:pl.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:pl.color, fontSize:15 }}>{contact.nombre[0]}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{contact.nombre}</div>
              <div style={{ fontSize:11, color:"#6B7280" }}>{contact.telefono} · <span style={{ color:pl.color }}>{pl.label}</span></div>
            </div>
            {["chat","contacto"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding:"5px 12px", fontSize:11, fontWeight:600, border:"none", borderRadius:8, cursor:"pointer", background:tab===t?"#111827":"#F3F4F6", color:tab===t?"#fff":"#6B7280" }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
            <select value={contact.estado} onChange={e=>changeStatus(e.target.value)} style={{ padding:"5px 8px", fontSize:11, fontWeight:600, border:"1px solid #E5E7EB", borderRadius:8, cursor:"pointer", color:STATUS_COLOR[contact.estado], outline:"none" }}>
              {["pendiente","en curso","resuelto"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {tab==="chat" ? (
            <>
              <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:8, background:"#F9FAFB" }}>
                {msgs.map((m,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:m.de==="agent"?"flex-end":"flex-start" }}>
                    <div style={{ maxWidth:"65%", padding:"9px 13px", borderRadius:m.de==="agent"?"16px 4px 16px 16px":"4px 16px 16px 16px", background:m.de==="agent"?"#111827":"#fff", color:m.de==="agent"?"#fff":"#111827", fontSize:13, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
                      {m.texto}
                      <div style={{ fontSize:10, marginTop:3, opacity:0.55, textAlign:"right" }}>{m.tiempo}</div>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div style={{ padding:"6px 14px", background:"#fff", borderTop:"1px solid #F3F4F6", display:"flex", gap:6, overflowX:"auto", flexShrink:0 }}>
                {QUICK_REPLIES.map((r,i)=>(
                  <button key={i} onClick={()=>setMsgInput(r)} style={{ whiteSpace:"nowrap", padding:"4px 10px", fontSize:11, border:"1px solid #E5E7EB", borderRadius:20, background:"#F9FAFB", cursor:"pointer", color:"#374151" }}>{r.slice(0,28)}…</button>
                ))}
              </div>
              <div style={{ padding:"10px 14px", background:"#fff", borderTop:"1px solid #E5E7EB", display:"flex", gap:8, flexShrink:0 }}>
                <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="Escribe un mensaje..." style={{ flex:1, padding:"9px 13px", border:"1px solid #E5E7EB", borderRadius:12, fontSize:13, outline:"none" }} />
                <Btn onClick={sendMsg}><i className="ti ti-send" /> Enviar</Btn>
              </div>
            </>
          ) : (
            <div style={{ flex:1, overflowY:"auto", padding:20, background:"#F9FAFB" }}>
              <div style={{ background:"#fff", borderRadius:14, padding:18, marginBottom:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Información</h3>
                {[["Nombre",contact.nombre],["Teléfono",contact.telefono||"—"],["Plataforma",pl.label],["Etiqueta",contact.etiqueta],["Estado",contact.estado]].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #F3F4F6", fontSize:13 }}>
                    <span style={{ color:"#6B7280" }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"#fff", borderRadius:14, padding:18, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Notas del Agente</h3>
                <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Escribe notas sobre este contacto..." style={{ width:"100%", minHeight:90, padding:10, border:"1px solid #E5E7EB", borderRadius:10, fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
                <Btn onClick={saveNote} style={{ marginTop:8 }} color="#10B981"><i className="ti ti-device-floppy" /> Guardar nota</Btn>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#9CA3AF", fontSize:14 }}>Selecciona un contacto</div>
      )}

      {showForm && (
        <Modal title="Nuevo Contacto" onClose={()=>setShowForm(false)}>
          <Input label="Nombre completo *" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej. María González" />
          <Input label="Teléfono" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="+52 442 123 4567" />
          <Select label="Plataforma" value={form.plataforma} onChange={e=>setForm({...form,plataforma:e.target.value})}>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
          </Select>
          <Select label="Etiqueta" value={form.etiqueta} onChange={e=>setForm({...form,etiqueta:e.target.value})}>
            <option value="prospecto">Prospecto</option>
            <option value="cliente">Cliente</option>
          </Select>
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <Btn onClick={addContact} color="#10B981" style={{ flex:1, justifyContent:"center" }}><i className="ti ti-plus" /> Agregar</Btn>
            <Btn onClick={()=>setShowForm(false)} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: INVENTARIO
// ═══════════════════════════════════════════════════════════════════════════
function SeccionInventario({ toast }) {
  const [vacunas, setVacunas]       = useState([]);
  const [movs, setMovs]             = useState([]);
  const [subTab, setSubTab]         = useState("catalogo");
  const [filtroAlm, setFiltroAlm]   = useState("todos");
  const [showForm, setShowForm]     = useState(false);
  const [showMov, setShowMov]       = useState(null); // 'entrada'|'salida'|'transferencia'
  const [editItem, setEditItem]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const VFORM = { nombre:"", fabricante:"", lote:"", caducidad:"", dosis_disponibles:0, stock_minimo:10, almacen:"Clínica Principal", precio:"" };
  const [form, setForm]             = useState(VFORM);
  const MFORM = { vacuna_id:"", dosis:1, almacen_origen:"Clínica Principal", almacen_destino:"", motivo:"", personal:"", paciente:"", monto:"" };
  const [mform, setMform]           = useState(MFORM);

  async function load() {
    const [{ data:v }, { data:m }] = await Promise.all([
      supabase.from("vacunas").select("*").order("nombre"),
      supabase.from("movimientos").select("*").order("created_at", { ascending:false }).limit(100)
    ]);
    if (v) setVacunas(v);
    if (m) setMovs(m);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function estadoVacuna(v) {
    if (v.dosis_disponibles === 0) return "agotado";
    if (v.dosis_disponibles <= v.stock_minimo) return "bajo";
    return "disponible";
  }
  const ESTCOLOR = { disponible:"#10B981", bajo:"#F59E0B", agotado:"#EF4444" };

  async function saveVacuna() {
    if (!form.nombre) return;
    const payload = { ...form, dosis_disponibles:Number(form.dosis_disponibles), stock_minimo:Number(form.stock_minimo), precio:form.precio?Number(form.precio):null, estado:estadoVacuna({ dosis_disponibles:Number(form.dosis_disponibles), stock_minimo:Number(form.stock_minimo) }) };
    if (editItem) {
      const { data } = await supabase.from("vacunas").update(payload).eq("id", editItem.id).select().single();
      if (data) setVacunas(prev => prev.map(v => v.id===editItem.id ? data : v));
      toast("Vacuna actualizada");
    } else {
      const { data } = await supabase.from("vacunas").insert(payload).select().single();
      if (data) setVacunas(prev => [...prev, data]);
      toast("Vacuna agregada");
    }
    setShowForm(false); setEditItem(null); setForm(VFORM);
  }
  async function deleteVacuna(id) {
    if (!confirm("¿Eliminar esta vacuna?")) return;
    await supabase.from("vacunas").delete().eq("id", id);
    setVacunas(prev => prev.filter(v => v.id !== id));
    toast("Vacuna eliminada");
  }
  async function registrarMovimiento() {
    if (!mform.vacuna_id || !mform.dosis) return;
    const vacuna = vacunas.find(v => v.id === Number(mform.vacuna_id));
    if (!vacuna) return;
    const payload = { ...mform, tipo:showMov, vacuna_nombre:vacuna.nombre, dosis:Number(mform.dosis), monto:mform.monto?Number(mform.monto):null };
    const { data } = await supabase.from("movimientos").insert(payload).select().single();
    if (data) setMovs(prev => [data, ...prev]);
    // Actualizar stock
    let nuevaDosis = vacuna.dosis_disponibles;
    if (showMov==="entrada") nuevaDosis += Number(mform.dosis);
    if (showMov==="salida")  nuevaDosis = Math.max(0, nuevaDosis - Number(mform.dosis));
    const nuevoEstado = nuevaDosis===0?"agotado":nuevaDosis<=vacuna.stock_minimo?"bajo":"disponible";
    await supabase.from("vacunas").update({ dosis_disponibles:nuevaDosis, estado:nuevoEstado }).eq("id", vacuna.id);
    setVacunas(prev => prev.map(v => v.id===vacuna.id ? {...v, dosis_disponibles:nuevaDosis, estado:nuevoEstado} : v));
    setShowMov(null); setMform(MFORM);
    toast(`Movimiento de ${showMov} registrado`);
  }

  const filtered = filtroAlm==="todos" ? vacunas : vacunas.filter(v=>v.almacen===filtroAlm);
  const stats = { total:vacunas.length, dosis:vacunas.reduce((a,v)=>a+v.dosis_disponibles,0), vencer:vacunas.filter(v=>{ const d=new Date(v.caducidad); return (d-new Date())<30*864e5 && d>new Date(); }).length, bajos:vacunas.filter(v=>v.estado!=="disponible").length };

  return (
    <div style={{ padding:24, overflowY:"auto", height:"100%" }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {[["💉","Vacunas en catálogo",stats.total,"tipos registrados","#3B82F6"],["📦","Dosis disponibles",stats.dosis,"todos los almacenes","#10B981"],["⚠️","Próximas a vencer",stats.vencer,"en 30 días","#F59E0B"],["🚨","Stock bajo / agotado",stats.bajos,"requieren reorden","#EF4444"]].map(([ic,label,val,sub,col])=>(
          <div key={label} style={{ background:"#fff", borderRadius:12, padding:"16px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", borderTop:`3px solid ${col}` }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{ic}</div>
            <div style={{ fontSize:22, fontWeight:800, color:col }}>{val}</div>
            <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:2 }}>{label}</div>
            <div style={{ fontSize:11, color:"#9CA3AF" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {["catalogo","movimientos"].map(t=>(
            <button key={t} onClick={()=>setSubTab(t)} style={{ padding:"6px 14px", fontSize:12, fontWeight:600, border:"none", borderRadius:8, cursor:"pointer", background:subTab===t?"#111827":"#F3F4F6", color:subTab===t?"#fff":"#6B7280" }}>
              {t==="catalogo"?"📋 Catálogo":"📊 Movimientos"}
            </button>
          ))}
          <select value={filtroAlm} onChange={e=>setFiltroAlm(e.target.value)} style={{ padding:"6px 10px", fontSize:12, border:"1px solid #E5E7EB", borderRadius:8, outline:"none" }}>
            <option value="todos">Todos los almacenes</option>
            {ALMACENES.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <Btn onClick={()=>setShowMov("entrada")} color="#10B981"><i className="ti ti-plus" /> Entrada</Btn>
            <Btn onClick={()=>setShowMov("salida")} color="#EF4444"><i className="ti ti-minus" /> Salida</Btn>
            <Btn onClick={()=>setShowMov("transferencia")} color="#3B82F6"><i className="ti ti-arrows-exchange" /> Transferir</Btn>
            <Btn onClick={()=>{setEditItem(null);setForm(VFORM);setShowForm(true);}} color="#111827"><i className="ti ti-plus" /> Nueva vacuna</Btn>
          </div>
        </div>
      </div>

      {/* Tabla catálogo */}
      {subTab==="catalogo" && (
        <div style={{ background:"#fff", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr style={{ background:"#F9FAFB" }}>
              {["Vacuna","Lote","Fabricante","Caducidad","Dosis","Stock mín.","Almacén","Estado","Acciones"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6B7280", borderBottom:"1px solid #E5E7EB" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={9} style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Cargando...</td></tr>
              : filtered.map(v=>(
                <tr key={v.id} style={{ borderBottom:"1px solid #F3F4F6" }}>
                  <td style={{ padding:"10px 14px", fontWeight:600 }}>{v.nombre}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{v.lote||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{v.fabricante||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{v.caducidad||"—"}</td>
                  <td style={{ padding:"10px 14px", fontWeight:700 }}>{v.dosis_disponibles}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{v.stock_minimo}</td>
                  <td style={{ padding:"10px 14px", fontSize:12 }}>{v.almacen}</td>
                  <td style={{ padding:"10px 14px" }}><Badge color={ESTCOLOR[v.estado]||"#6B7280"} label={v.estado} /></td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:4 }}>
                      <button onClick={()=>{setEditItem(v);setForm({...v,caducidad:v.caducidad||""});setShowForm(true);}} style={{ border:"none", background:"#EFF6FF", color:"#3B82F6", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️ Editar</button>
                      <button onClick={()=>deleteVacuna(v.id)} style={{ border:"none", background:"#FEF2F2", color:"#EF4444", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla movimientos */}
      {subTab==="movimientos" && (
        <div style={{ background:"#fff", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr style={{ background:"#F9FAFB" }}>
              {["Fecha","Tipo","Vacuna","Dosis","Almacén","Motivo","Personal"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6B7280", borderBottom:"1px solid #E5E7EB" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {movs.map(m=>(
                <tr key={m.id} style={{ borderBottom:"1px solid #F3F4F6" }}>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{m.created_at?.slice(0,10)}</td>
                  <td style={{ padding:"10px 14px" }}><Badge color={m.tipo==="entrada"?"#10B981":m.tipo==="salida"?"#EF4444":"#3B82F6"} label={m.tipo} /></td>
                  <td style={{ padding:"10px 14px", fontWeight:600 }}>{m.vacuna_nombre}</td>
                  <td style={{ padding:"10px 14px" }}>{m.dosis}</td>
                  <td style={{ padding:"10px 14px", fontSize:12 }}>{m.almacen_origen||m.almacen_destino}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{m.motivo||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{m.personal||"—"}</td>
                </tr>
              ))}
              {movs.length===0 && <tr><td colSpan={7} style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Sin movimientos registrados</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Vacuna */}
      {showForm && (
        <Modal title={editItem?"Editar Vacuna":"Nueva Vacuna"} onClose={()=>{setShowForm(false);setEditItem(null);setForm(VFORM);}}>
          <Input label="Nombre *" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej. BCG" />
          <Input label="Fabricante" value={form.fabricante} onChange={e=>setForm({...form,fabricante:e.target.value})} placeholder="Ej. Sanofi" />
          <Input label="Número de lote" value={form.lote} onChange={e=>setForm({...form,lote:e.target.value})} placeholder="Ej. BCG-2024-01" />
          <Input label="Caducidad" type="date" value={form.caducidad} onChange={e=>setForm({...form,caducidad:e.target.value})} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Input label="Dosis disponibles" type="number" value={form.dosis_disponibles} onChange={e=>setForm({...form,dosis_disponibles:e.target.value})} />
            <Input label="Stock mínimo" type="number" value={form.stock_minimo} onChange={e=>setForm({...form,stock_minimo:e.target.value})} />
          </div>
          <Select label="Almacén" value={form.almacen} onChange={e=>setForm({...form,almacen:e.target.value})}>
            {ALMACENES.map(a=><option key={a} value={a}>{a}</option>)}
          </Select>
          <Input label="Precio ($)" type="number" value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})} placeholder="0.00" />
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={saveVacuna} color="#10B981" style={{ flex:1, justifyContent:"center" }}><i className="ti ti-device-floppy" /> Guardar</Btn>
            <Btn onClick={()=>{setShowForm(false);setEditItem(null);setForm(VFORM);}} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal Movimiento */}
      {showMov && (
        <Modal title={`Registrar ${showMov.charAt(0).toUpperCase()+showMov.slice(1)}`} onClose={()=>setShowMov(null)}>
          <Select label="Vacuna *" value={mform.vacuna_id} onChange={e=>setMform({...mform,vacuna_id:e.target.value})}>
            <option value="">Seleccionar vacuna...</option>
            {vacunas.map(v=><option key={v.id} value={v.id}>{v.nombre} (stock: {v.dosis_disponibles})</option>)}
          </Select>
          <Input label="Dosis *" type="number" value={mform.dosis} onChange={e=>setMform({...mform,dosis:e.target.value})} />
          <Select label={showMov==="transferencia"?"Almacén origen":"Almacén"} value={mform.almacen_origen} onChange={e=>setMform({...mform,almacen_origen:e.target.value})}>
            {ALMACENES.map(a=><option key={a} value={a}>{a}</option>)}
          </Select>
          {showMov==="transferencia" && (
            <Select label="Almacén destino" value={mform.almacen_destino} onChange={e=>setMform({...mform,almacen_destino:e.target.value})}>
              <option value="">Seleccionar...</option>
              {ALMACENES.map(a=><option key={a} value={a}>{a}</option>)}
            </Select>
          )}
          {showMov==="salida" && <Input label="Paciente" value={mform.paciente} onChange={e=>setMform({...mform,paciente:e.target.value})} placeholder="Nombre del paciente" />}
          <Input label="Motivo" value={mform.motivo} onChange={e=>setMform({...mform,motivo:e.target.value})} placeholder="Motivo del movimiento" />
          <Input label="Personal responsable" value={mform.personal} onChange={e=>setMform({...mform,personal:e.target.value})} placeholder="Nombre del empleado" />
          {showMov==="salida" && <Input label="Monto ($)" type="number" value={mform.monto} onChange={e=>setMform({...mform,monto:e.target.value})} />}
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={registrarMovimiento} color="#10B981" style={{ flex:1, justifyContent:"center" }}>Registrar</Btn>
            <Btn onClick={()=>setShowMov(null)} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: CITAS
// ═══════════════════════════════════════════════════════════════════════════
function SeccionCitas({ toast }) {
  const [citas, setCitas]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const FORM0 = { paciente:"", servicio:"", fecha:"", hora:"", almacen:"Clínica Principal", estado:"pendiente", telefono:"", notas:"" };
  const [form, setForm]       = useState(FORM0);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("citas").select("*").order("fecha").order("hora");
    if (data) setCitas(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function saveCita() {
    if (!form.paciente) return;
    if (editItem) {
      const { data } = await supabase.from("citas").update(form).eq("id", editItem.id).select().single();
      if (data) setCitas(prev => prev.map(c => c.id===editItem.id ? data : c));
      toast("Cita actualizada");
    } else {
      const { data } = await supabase.from("citas").insert(form).select().single();
      if (data) setCitas(prev => [...prev, data]);
      toast("Cita agendada");
    }
    setShowForm(false); setEditItem(null); setForm(FORM0);
  }
  async function deleteCita(id) {
    if (!confirm("¿Eliminar esta cita?")) return;
    await supabase.from("citas").delete().eq("id", id);
    setCitas(prev => prev.filter(c => c.id !== id));
    toast("Cita eliminada");
  }
  async function changeEstado(id, estado) {
    await supabase.from("citas").update({ estado }).eq("id", id);
    setCitas(prev => prev.map(c => c.id===id ? {...c, estado} : c));
    toast("Estado actualizado");
  }

  const stats = ["pendiente","confirmada","realizada","cancelada"].map(e=>({ label:e, count:citas.filter(c=>c.estado===e).length }));

  return (
    <div style={{ padding:24, overflowY:"auto", height:"100%" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {stats.map(({ label, count })=>(
          <div key={label} style={{ background:"#fff", borderRadius:12, padding:"14px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", borderTop:`3px solid ${CITA_COLORS[label]||"#6B7280"}` }}>
            <div style={{ fontSize:22, fontWeight:800, color:CITA_COLORS[label] }}>{count}</div>
            <div style={{ fontSize:12, fontWeight:600, color:"#374151", textTransform:"capitalize" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:700, color:"#111827" }}>📅 Citas</span>
        <Btn onClick={()=>{setEditItem(null);setForm(FORM0);setShowForm(true);}} color="#10B981"><i className="ti ti-plus" /> Nueva cita</Btn>
      </div>
      <div style={{ background:"#fff", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ background:"#F9FAFB" }}>
            {["Paciente","Servicio","Fecha","Hora","Almacén","Estado","Acciones"].map(h=>(
              <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6B7280", borderBottom:"1px solid #E5E7EB" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Cargando...</td></tr>
            : citas.map(c=>(
              <tr key={c.id} style={{ borderBottom:"1px solid #F3F4F6" }}>
                <td style={{ padding:"10px 14px", fontWeight:600 }}>{c.paciente}</td>
                <td style={{ padding:"10px 14px", color:"#6B7280" }}>{c.servicio||"—"}</td>
                <td style={{ padding:"10px 14px", color:"#6B7280" }}>{c.fecha||"—"}</td>
                <td style={{ padding:"10px 14px", color:"#6B7280" }}>{c.hora||"—"}</td>
                <td style={{ padding:"10px 14px", fontSize:12 }}>{c.almacen}</td>
                <td style={{ padding:"10px 14px" }}>
                  <select value={c.estado} onChange={e=>changeEstado(c.id,e.target.value)} style={{ padding:"3px 8px", fontSize:11, border:"1px solid #E5E7EB", borderRadius:6, color:CITA_COLORS[c.estado], fontWeight:600, outline:"none" }}>
                    {["pendiente","confirmada","realizada","cancelada"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ padding:"10px 14px" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>{setEditItem(c);setForm({paciente:c.paciente,servicio:c.servicio||"",fecha:c.fecha||"",hora:c.hora||"",almacen:c.almacen,estado:c.estado,telefono:c.telefono||"",notas:c.notas||""});setShowForm(true);}} style={{ border:"none", background:"#EFF6FF", color:"#3B82F6", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️</button>
                    <button onClick={()=>deleteCita(c.id)} style={{ border:"none", background:"#FEF2F2", color:"#EF4444", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && citas.length===0 && <tr><td colSpan={7} style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Sin citas registradas</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editItem?"Editar Cita":"Nueva Cita"} onClose={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}}>
          <Input label="Paciente *" value={form.paciente} onChange={e=>setForm({...form,paciente:e.target.value})} placeholder="Nombre completo" />
          <Input label="Teléfono" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="+52 442 123 4567" />
          <Select label="Servicio" value={form.servicio} onChange={e=>setForm({...form,servicio:e.target.value})}>
            <option value="">Seleccionar...</option>
            {["Vacunación","Tamiz Neonatal","Ruta a Domicilio","Nutrición","Análisis Clínicos","Paquete Familiar","Paquete Bebé","Paquete Senior"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Input label="Fecha" type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} />
            <Input label="Hora" type="time" value={form.hora} onChange={e=>setForm({...form,hora:e.target.value})} />
          </div>
          <Select label="Almacén / Sucursal" value={form.almacen} onChange={e=>setForm({...form,almacen:e.target.value})}>
            {ALMACENES.map(a=><option key={a} value={a}>{a}</option>)}
          </Select>
          <Select label="Estado" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
            {["pendiente","confirmada","realizada","cancelada"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:4 }}>Notas</div>
            <textarea value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Observaciones adicionales..." style={{ width:"100%", padding:"8px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, outline:"none", resize:"vertical", minHeight:70, boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={saveCita} color="#10B981" style={{ flex:1, justifyContent:"center" }}><i className="ti ti-device-floppy" /> Guardar</Btn>
            <Btn onClick={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: LEADS
// ═══════════════════════════════════════════════════════════════════════════
function SeccionLeads({ toast }) {
  const [leads, setLeads]       = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const FORM0 = { nombre:"", servicio:"", zona:"", fuente:"WhatsApp", estado:"nuevo", telefono:"", notas:"" };
  const [form, setForm]         = useState(FORM0);
  const [loading, setLoading]   = useState(true);
  const LEAD_COLOR = { nuevo:"#3B82F6", contactado:"#F59E0B", interesado:"#8B5CF6", convertido:"#10B981", perdido:"#EF4444" };

  async function load() {
    const { data } = await supabase.from("contactos").select("*").order("created_at", { ascending:false });
    if (data) setLeads(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function saveLead() {
    if (!form.nombre) return;
    if (editItem) {
      const { data } = await supabase.from("contactos").update(form).eq("id", editItem.id).select().single();
      if (data) setLeads(prev => prev.map(l => l.id===editItem.id ? data : l));
      toast("Lead actualizado");
    } else {
      const payload = { ...form, plataforma:"whatsapp", ultimo_mensaje:"Lead agregado manualmente", tiempo:"Ahora", mensajes_sin_leer:0 };
      const { data } = await supabase.from("contactos").insert(payload).select().single();
      if (data) setLeads(prev => [data, ...prev]);
      toast("Lead agregado");
    }
    setShowForm(false); setEditItem(null); setForm(FORM0);
  }
  async function deleteLead(id) {
    if (!confirm("¿Eliminar este lead?")) return;
    await supabase.from("contactos").delete().eq("id", id);
    setLeads(prev => prev.filter(l => l.id !== id));
    toast("Lead eliminado");
  }

  return (
    <div style={{ padding:24, overflowY:"auto", height:"100%" }}>
      <div style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:700, color:"#111827" }}>◈ Leads — {leads.length} registros</span>
        <Btn onClick={()=>{setEditItem(null);setForm(FORM0);setShowForm(true);}} color="#10B981"><i className="ti ti-plus" /> Agregar lead</Btn>
      </div>
      <div style={{ background:"#fff", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ background:"#F9FAFB" }}>
            {["Nombre","Teléfono","Servicio","Fuente","Estado","Fecha","Acciones"].map(h=>(
              <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6B7280", borderBottom:"1px solid #E5E7EB" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Cargando...</td></tr>
            : leads.map(l=>(
              <tr key={l.id} style={{ borderBottom:"1px solid #F3F4F6" }}>
                <td style={{ padding:"10px 14px", fontWeight:600 }}>{l.nombre}</td>
                <td style={{ padding:"10px 14px", color:"#6B7280" }}>{l.telefono||"—"}</td>
                <td style={{ padding:"10px 14px", color:"#6B7280" }}>{l.servicio||l.etiqueta||"—"}</td>
                <td style={{ padding:"10px 14px", color:"#6B7280" }}>{l.fuente||PLATFORMS[l.plataforma]?.label||"—"}</td>
                <td style={{ padding:"10px 14px" }}><Badge color={LEAD_COLOR[l.estado]||STATUS_COLOR[l.estado]||"#6B7280"} label={l.estado} /></td>
                <td style={{ padding:"10px 14px", color:"#6B7280", fontSize:12 }}>{l.created_at?.slice(0,10)}</td>
                <td style={{ padding:"10px 14px" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>{setEditItem(l);setForm({nombre:l.nombre,servicio:l.servicio||"",zona:l.zona||"",fuente:l.fuente||"WhatsApp",estado:l.estado,telefono:l.telefono||"",notas:l.notas||""});setShowForm(true);}} style={{ border:"none", background:"#EFF6FF", color:"#3B82F6", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️</button>
                    <button onClick={()=>deleteLead(l.id)} style={{ border:"none", background:"#FEF2F2", color:"#EF4444", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && leads.length===0 && <tr><td colSpan={7} style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Sin leads registrados</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editItem?"Editar Lead":"Nuevo Lead"} onClose={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}}>
          <Input label="Nombre *" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Nombre completo" />
          <Input label="Teléfono" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="+52 442 123 4567" />
          <Select label="Servicio de interés" value={form.servicio} onChange={e=>setForm({...form,servicio:e.target.value})}>
            <option value="">Seleccionar...</option>
            {["Vacunación","Tamiz Neonatal","Ruta a Domicilio","Nutrición","Análisis Clínicos","Paquete Familiar","Paquete Bebé","Paquete Senior"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="Zona / Colonia" value={form.zona} onChange={e=>setForm({...form,zona:e.target.value})} placeholder="Ej. Monraz" />
          <Select label="Fuente" value={form.fuente} onChange={e=>setForm({...form,fuente:e.target.value})}>
            {["WhatsApp","Facebook","Instagram","Referido","Llamada","Página web","Otro"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Estado" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
            {["pendiente","en curso","resuelto"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:4 }}>Notas</div>
            <textarea value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Observaciones..." style={{ width:"100%", padding:"8px 10px", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13, outline:"none", resize:"vertical", minHeight:70, boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={saveLead} color="#10B981" style={{ flex:1, justifyContent:"center" }}><i className="ti ti-device-floppy" /> Guardar</Btn>
            <Btn onClick={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN: FACTURACIÓN
// ═══════════════════════════════════════════════════════════════════════════
function SeccionFacturacion({ toast }) {
  const [facturas, setFacturas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const FORM0 = { folio:"", paciente:"", servicio:"", monto:"", fecha:new Date().toISOString().slice(0,10), estado:"Pendiente" };
  const [form, setForm]         = useState(FORM0);
  const [loading, setLoading]   = useState(true);

  async function load() {
    const { data } = await supabase.from("facturas").select("*").order("created_at", { ascending:false });
    if (data) setFacturas(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function nextFolio() {
    const { data } = await supabase.from("facturas").select("folio").order("created_at", { ascending:false }).limit(1);
    if (data && data.length) {
      const n = parseInt(data[0].folio.replace("FAC-","")) + 1;
      return "FAC-" + String(n).padStart(4,"0");
    }
    return "FAC-0001";
  }

  async function saveFactura() {
    if (!form.paciente) return;
    const folio = form.folio || await nextFolio();
    const payload = { ...form, folio, monto:Number(form.monto) };
    if (editItem) {
      const { data } = await supabase.from("facturas").update(payload).eq("id", editItem.id).select().single();
      if (data) setFacturas(prev => prev.map(f => f.id===editItem.id ? data : f));
      toast("Factura actualizada");
    } else {
      const { data } = await supabase.from("facturas").insert(payload).select().single();
      if (data) setFacturas(prev => [data, ...prev]);
      toast("Factura registrada");
    }
    setShowForm(false); setEditItem(null); setForm(FORM0);
  }
  async function deleteFactura(id) {
    if (!confirm("¿Eliminar esta factura?")) return;
    await supabase.from("facturas").delete().eq("id", id);
    setFacturas(prev => prev.filter(f => f.id !== id));
    toast("Factura eliminada");
  }
  async function changeEstado(id, estado) {
    await supabase.from("facturas").update({ estado }).eq("id", id);
    setFacturas(prev => prev.map(f => f.id===id ? {...f, estado} : f));
  }

  const total = facturas.filter(f=>f.estado==="Timbrada").reduce((a,f)=>a+Number(f.monto||0),0);
  const pendientes = facturas.filter(f=>f.estado==="Pendiente").length;

  return (
    <div style={{ padding:24, overflowY:"auto", height:"100%" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:22 }}>
        {[["🧾","Facturas emitidas",facturas.filter(f=>f.estado==="Timbrada").length,"este mes","#10B981"],["💰","Total facturado","$"+total.toLocaleString(),"facturas timbradas","#3B82F6"],["⏳","Pendientes por emitir",pendientes,"requieren timbrado","#F59E0B"]].map(([ic,label,val,sub,col])=>(
          <div key={label} style={{ background:"#fff", borderRadius:12, padding:"16px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", borderTop:`3px solid ${col}` }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{ic}</div>
            <div style={{ fontSize:22, fontWeight:800, color:col }}>{val}</div>
            <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:2 }}>{label}</div>
            <div style={{ fontSize:11, color:"#9CA3AF" }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background:"#E0F2FE", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:24 }}>🧾</span>
        <div>
          <div style={{ fontWeight:700, fontSize:13 }}>ecoFactura — CFDI 4.0</div>
          <div style={{ fontSize:12, color:"#0369A1" }}>Sistema de facturación electrónica · Guadalajara, México</div>
        </div>
        <a href="https://www.ecofactura.mx" target="_blank" rel="noreferrer" style={{ marginLeft:"auto", padding:"7px 14px", background:"#0369A1", color:"#fff", borderRadius:8, fontSize:12, fontWeight:600, textDecoration:"none" }}>Abrir ecoFactura ↗</a>
      </div>

      <div style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:700, color:"#111827" }}>📋 Facturas registradas</span>
        <Btn onClick={()=>{setEditItem(null);setForm(FORM0);setShowForm(true);}} color="#10B981"><i className="ti ti-plus" /> Nueva factura</Btn>
      </div>

      <div style={{ background:"#fff", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ background:"#F9FAFB" }}>
            {["Folio","Paciente","Servicio","Monto","Fecha","Estado","Acciones"].map(h=>(
              <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6B7280", borderBottom:"1px solid #E5E7EB" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Cargando...</td></tr>
            : facturas.map(f=>(
              <tr key={f.id} style={{ borderBottom:"1px solid #F3F4F6" }}>
                <td style={{ padding:"10px 14px", fontWeight:700, color:"#3B82F6" }}>{f.folio}</td>
                <td style={{ padding:"10px 14px", fontWeight:600 }}>{f.paciente}</td>
                <td style={{ padding:"10px 14px", color:"#6B7280" }}>{f.servicio||"—"}</td>
                <td style={{ padding:"10px 14px", fontWeight:700 }}>${Number(f.monto||0).toLocaleString()}</td>
                <td style={{ padding:"10px 14px", color:"#6B7280" }}>{f.fecha}</td>
                <td style={{ padding:"10px 14px" }}>
                  <select value={f.estado} onChange={e=>changeEstado(f.id,e.target.value)} style={{ padding:"3px 8px", fontSize:11, border:"1px solid #E5E7EB", borderRadius:6, color:FACTURA_COLORS[f.estado], fontWeight:600, outline:"none" }}>
                    {["Pendiente","Timbrada","Cancelada"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ padding:"10px 14px" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>{setEditItem(f);setForm({folio:f.folio,paciente:f.paciente,servicio:f.servicio||"",monto:f.monto,fecha:f.fecha,estado:f.estado});setShowForm(true);}} style={{ border:"none", background:"#EFF6FF", color:"#3B82F6", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️</button>
                    <button onClick={()=>deleteFactura(f.id)} style={{ border:"none", background:"#FEF2F2", color:"#EF4444", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && facturas.length===0 && <tr><td colSpan={7} style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Sin facturas registradas</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editItem?"Editar Factura":"Nueva Factura"} onClose={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}}>
          <Input label="Folio (auto si está vacío)" value={form.folio} onChange={e=>setForm({...form,folio:e.target.value})} placeholder="FAC-0001" />
          <Input label="Paciente *" value={form.paciente} onChange={e=>setForm({...form,paciente:e.target.value})} placeholder="Nombre completo" />
          <Select label="Servicio" value={form.servicio} onChange={e=>setForm({...form,servicio:e.target.value})}>
            <option value="">Seleccionar...</option>
            {["Vacunación","Tamiz Neonatal","Ruta a Domicilio","Nutrición","Análisis Clínicos","Paquete Familiar","Paquete Bebé","Paquete Senior"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="Monto ($)" type="number" value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} placeholder="0.00" />
          <Input label="Fecha" type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} />
          <Select label="Estado" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
            {["Pendiente","Timbrada","Cancelada"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={saveFactura} color="#10B981" style={{ flex:1, justifyContent:"center" }}><i className="ti ti-device-floppy" /> Guardar</Btn>
            <Btn onClick={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [section, setSection] = useState("mensajes");
  const [toastMsg, setToastMsg] = useState("");

  function toast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  }

  const NAV = [
    { id:"mensajes",    icon:"ti-message-circle", label:"Mensajes" },
    { id:"inventario",  icon:"ti-vaccine",         label:"Inventario" },
    { id:"citas",       icon:"ti-calendar",        label:"Citas" },
    { id:"leads",       icon:"ti-users",           label:"Leads" },
    { id:"facturacion", icon:"ti-receipt",         label:"Facturación" },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"Inter,sans-serif", background:"#F3F4F6" }}>
      {/* SIDEBAR NAV */}
      <div style={{ width:220, background:"#111827", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"18px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#00dfc4,#0a1f5c)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <i className="ti ti-heartbeat" style={{ color:"#fff", fontSize:18 }} />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:"#fff" }}>Evitare</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>Medical Center</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"12px 8px" }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setSection(n.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", marginBottom:2, border:"none", borderRadius:10, cursor:"pointer", background:section===n.id?"rgba(0,223,196,0.15)":"transparent", color:section===n.id?"#00dfc4":"rgba(255,255,255,0.6)", fontSize:13, fontWeight:section===n.id?700:500, textAlign:"left", transition:"all 0.2s" }}>
              <i className={`ti ${n.icon}`} style={{ fontSize:17 }} />
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textAlign:"center" }}>Evitare CRM v2.0</div>
          <div style={{ fontSize:10, color:"rgba(0,223,196,0.6)", textAlign:"center" }}>● Conectado a Supabase</div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {section==="mensajes"    && <SeccionMensajes    toast={toast} />}
        {section==="inventario"  && <SeccionInventario  toast={toast} />}
        {section==="citas"       && <SeccionCitas       toast={toast} />}
        {section==="leads"       && <SeccionLeads       toast={toast} />}
        {section==="facturacion" && <SeccionFacturacion toast={toast} />}
      </div>

      <Toast msg={toastMsg} />
    </div>
  );
}
