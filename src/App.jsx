import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ─── Config ────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = "289192581941-2bi1eu0nas3q7g1tevumbe0acrv2n7ci.apps.googleusercontent.com";
const GOOGLE_SCOPES    = "https://www.googleapis.com/auth/calendar";
const EVITARE_BLUE     = "#5BB8E8";
const ALMACENES        = ["Clinica Principal", "Hospital Angeles - Zapopan", "Hospital Country - GDL"];
const HOURS            = Array.from({length:14}, (_,i) => i+7);
const FACTURA_COLORS   = { Timbrada:"#10B981", Pendiente:"#F59E0B", Cancelada:"#EF4444" };
const STATUS_COLOR     = { pendiente:"#F59E0B", "en curso":"#3B82F6", resuelto:"#10B981" };

// ─── UI Helpers ────────────────────────────────────────────────────────────
const Badge = ({ color, label }) => (
  <span style={{ fontSize:9, padding:"2px 8px", borderRadius:10, background:color+"22", color, fontWeight:700 }}>{label}</span>
);
const Btn = ({ onClick, children, style={}, color=EVITARE_BLUE }) => (
  <button onClick={onClick} style={{ padding:"7px 14px", fontSize:12, fontWeight:600, border:"none", borderRadius:8, cursor:"pointer", background:color, color:"#fff", display:"flex", alignItems:"center", gap:5, ...style }}>{children}</button>
);
const Input = ({ label, ...props }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>{label}</div>}
    <input {...props} style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #E5E7EB", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box", transition:"border 0.2s", ...props.style }}
      onFocus={e=>e.target.style.borderColor=EVITARE_BLUE}
      onBlur={e=>e.target.style.borderColor="#E5E7EB"} />
  </div>
);
const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>{label}</div>}
    <select {...props} style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #E5E7EB", borderRadius:8, fontSize:13, outline:"none", background:"#fff", ...props.style }}>{children}</select>
  </div>
);
const Modal = ({ title, onClose, children, width=480 }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }}>
    <div style={{ background:"#fff", borderRadius:16, padding:28, width, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.18)" }}>
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
    <span style={{ color:EVITARE_BLUE }}>✓</span> {msg}
  </div>
) : null;

// ─── Logo SVG Evitare ───────────────────────────────────────────────────────
const EvitareLogo = ({ size=40 }) => (
  <img src="/logo-evitare.jpg" alt="Evitare" style={{ height:size, width:"auto", objectFit:"contain" }} />
);

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    const { data, error: err } = await supabase
      .from("usuarios_crm")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .eq("password_hash", password)
      .eq("activo", true)
      .single();
    setLoading(false);
    if (err || !data) { setError("Correo o contraseña incorrectos"); return; }
    onLogin(data);
  }

  return (
    <div style={{ minHeight:"100vh", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:400, padding:"0 24px" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:8 }}>
            <EvitareLogo size={48} />
            <span style={{ fontSize:28, fontWeight:700, color:"#111827", letterSpacing:"-0.5px" }}>Evitare</span>
          </div>
          <p style={{ fontSize:14, color:"#6B7280", margin:0 }}>Panel de administración</p>
        </div>

        {/* Card */}
        <div style={{ background:"#fff", border:"1.5px solid #E5E7EB", borderRadius:16, padding:"32px 28px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize:18, fontWeight:700, color:"#111827", marginBottom:4, textAlign:"center" }}>Iniciar sesión</h2>
          <p style={{ fontSize:13, color:"#6B7280", textAlign:"center", marginBottom:24 }}>Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Correo electrónico</div>
              <input
                type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                placeholder="usuario@evitare.mx"
                style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #E5E7EB", borderRadius:9, fontSize:13, outline:"none", boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor=EVITARE_BLUE}
                onBlur={e=>e.target.style.borderColor="#E5E7EB"}
              />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Contraseña</div>
              <div style={{ position:"relative" }}>
                <input
                  type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ width:"100%", padding:"11px 40px 11px 14px", border:"1.5px solid #E5E7EB", borderRadius:9, fontSize:13, outline:"none", boxSizing:"border-box" }}
                  onFocus={e=>e.target.style.borderColor=EVITARE_BLUE}
                  onBlur={e=>e.target.style.borderColor="#E5E7EB"}
                />
                <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", border:"none", background:"none", cursor:"pointer", color:"#9CA3AF", fontSize:14 }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#DC2626", display:"flex", alignItems:"center", gap:8 }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width:"100%", padding:"13px", background: loading ? "#93C5FD" : EVITARE_BLUE, color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor: loading ? "not-allowed" : "pointer", transition:"background 0.2s" }}>
              {loading ? "Verificando..." : "Ingresar al panel"}
            </button>
          </form>
        </div>

        <p style={{ textAlign:"center", fontSize:12, color:"#9CA3AF", marginTop:20 }}>
          Evitare Medical Center © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN — Gestión de usuarios
// ═══════════════════════════════════════════════════════════════════════════
function SeccionConfiguracion({ usuario, toast }) {
  const [usuarios, setUsuarios]   = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const PERMS_DEFAULT = { mensajes:false, inventario:false, calendario:false, leads:false, facturacion:false };
  const FORM0 = { nombre:"", email:"", password_hash:"", rol:"operador", permisos:PERMS_DEFAULT, activo:true };
  const [form, setForm]           = useState(FORM0);
  const [loading, setLoading]     = useState(true);
  const isMaster                  = usuario.rol === "master";

  async function load() {
    const { data } = await supabase.from("usuarios_crm").select("*").order("created_at");
    if (data) setUsuarios(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function setPerm(key, val) {
    setForm(prev => ({ ...prev, permisos: { ...prev.permisos, [key]: val } }));
  }
  function setRol(rol) {
    const allTrue  = { mensajes:true, inventario:true, calendario:true, leads:true, facturacion:true };
    const allFalse = { mensajes:false, inventario:false, calendario:false, leads:false, facturacion:false };
    setForm(prev => ({ ...prev, rol, permisos: rol==="master" ? allTrue : allFalse }));
  }

  async function saveUsuario() {
    if (!form.nombre || !form.email || !form.password_hash) return;
    const payload = { ...form, email: form.email.trim().toLowerCase() };
    if (editItem) {
      const { data } = await supabase.from("usuarios_crm").update(payload).eq("id", editItem.id).select().single();
      if (data) setUsuarios(prev => prev.map(u => u.id===editItem.id ? data : u));
      toast("Usuario actualizado");
    } else {
      const { data } = await supabase.from("usuarios_crm").insert(payload).select().single();
      if (data) setUsuarios(prev => [...prev, data]);
      toast("Usuario creado");
    }
    setShowForm(false); setEditItem(null); setForm(FORM0);
  }
  async function toggleActivo(u) {
    const activo = !u.activo;
    await supabase.from("usuarios_crm").update({ activo }).eq("id", u.id);
    setUsuarios(prev => prev.map(x => x.id===u.id ? {...x, activo} : x));
    toast(activo ? "Usuario activado" : "Usuario desactivado");
  }
  async function deleteUsuario(id) {
    if (!confirm("¿Eliminar este usuario permanentemente?")) return;
    await supabase.from("usuarios_crm").delete().eq("id", id);
    setUsuarios(prev => prev.filter(u => u.id !== id));
    toast("Usuario eliminado");
  }

  const MODULOS = [
    { key:"mensajes",    label:"💬 Mensajes" },
    { key:"inventario",  label:"💉 Inventario" },
    { key:"calendario",  label:"📅 Calendario" },
    { key:"leads",       label:"◈ Leads" },
    { key:"facturacion", label:"🧾 Facturación" },
  ];

  if (!isMaster) return (
    <div style={{ padding:40, textAlign:"center", color:"#6B7280" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
      <p>Solo el usuario master puede gestionar configuraciones.</p>
    </div>
  );

  return (
    <div style={{ padding:24, overflowY:"auto", height:"100%" }}>
      <div style={{ background:"#fff", borderRadius:14, padding:20, marginBottom:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", border:`2px solid ${EVITARE_BLUE}22` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <EvitareLogo size={32} />
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:"#111827" }}>Evitare Medical Center</div>
            <div style={{ fontSize:12, color:"#6B7280" }}>Panel de administración · Guadalajara, Jalisco</div>
          </div>
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:700, color:"#111827", fontSize:15 }}>👥 Gestión de Usuarios</span>
        <Btn onClick={()=>{setEditItem(null);setForm(FORM0);setShowForm(true);}}>+ Nuevo usuario</Btn>
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {loading && <div style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Cargando...</div>}
        {usuarios.map(u => (
          <div key={u.id} style={{ background:"#fff", borderRadius:14, padding:"16px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:16, border: u.id===usuario.id ? `2px solid ${EVITARE_BLUE}` : "2px solid transparent" }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:u.rol==="master"?EVITARE_BLUE+"22":"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
              {u.rol==="master" ? "👑" : "👤"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontWeight:700, fontSize:14, color:"#111827" }}>{u.nombre}</span>
                {u.id===usuario.id && <span style={{ fontSize:10, background:EVITARE_BLUE+"22", color:EVITARE_BLUE, padding:"1px 8px", borderRadius:10, fontWeight:700 }}>Tú</span>}
                <Badge color={u.activo?"#10B981":"#EF4444"} label={u.activo?"Activo":"Inactivo"} />
                <Badge color={u.rol==="master"?EVITARE_BLUE:"#6B7280"} label={u.rol} />
              </div>
              <div style={{ fontSize:12, color:"#6B7280", marginBottom:6 }}>{u.email}</div>
              {u.rol !== "master" && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {Object.entries(u.permisos||{}).filter(([,v])=>v).map(([k]) => (
                    <span key={k} style={{ fontSize:10, background:"#EFF6FF", color:EVITARE_BLUE, padding:"2px 8px", borderRadius:8, fontWeight:600 }}>{k}</span>
                  ))}
                  {Object.entries(u.permisos||{}).every(([,v])=>!v) && <span style={{ fontSize:11, color:"#9CA3AF" }}>Sin permisos asignados</span>}
                </div>
              )}
              {u.rol === "master" && <div style={{ fontSize:11, color:EVITARE_BLUE, fontWeight:600 }}>Acceso completo a todos los módulos</div>}
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button onClick={()=>{setEditItem(u);setForm({nombre:u.nombre,email:u.email,password_hash:u.password_hash,rol:u.rol,permisos:u.permisos||PERMS_DEFAULT,activo:u.activo});setShowForm(true);}} style={{ border:`1.5px solid ${EVITARE_BLUE}`, background:"#fff", color:EVITARE_BLUE, borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:600 }}>✏️ Editar</button>
              {u.id !== usuario.id && (
                <>
                  <button onClick={()=>toggleActivo(u)} style={{ border:"1.5px solid #E5E7EB", background:"#fff", color:"#374151", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                    {u.activo ? "🚫 Desactivar" : "✅ Activar"}
                  </button>
                  <button onClick={()=>deleteUsuario(u.id)} style={{ border:"1.5px solid #FCA5A5", background:"#FEF2F2", color:"#EF4444", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:600 }}>🗑️</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title={editItem?"Editar Usuario":"Nuevo Usuario"} onClose={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}}>
          <Input label="Nombre completo *" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej. Carlos Ramírez" />
          <Input label="Correo electrónico *" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="usuario@evitare.mx" />
          <Input label="Contraseña *" type="text" value={form.password_hash} onChange={e=>setForm({...form,password_hash:e.target.value})} placeholder="Contraseña de acceso" />
          <Select label="Rol" value={form.rol} onChange={e=>setRol(e.target.value)}>
            <option value="operador">Operador (permisos específicos)</option>
            <option value="master">Master (acceso total)</option>
          </Select>

          {form.rol === "operador" && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#374151", marginBottom:10 }}>PERMISOS DE MÓDULOS</div>
              <div style={{ display:"grid", gap:8 }}>
                {MODULOS.map(({ key, label }) => (
                  <label key={key} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#F9FAFB", borderRadius:10, cursor:"pointer", border: form.permisos[key] ? `1.5px solid ${EVITARE_BLUE}` : "1.5px solid #E5E7EB" }}>
                    <input type="checkbox" checked={form.permisos[key]||false} onChange={e=>setPerm(key,e.target.checked)} style={{ width:16, height:16, accentColor:EVITARE_BLUE }} />
                    <span style={{ fontSize:13, fontWeight:600, color: form.permisos[key] ? "#111827" : "#6B7280" }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom:12 }}>
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
              <input type="checkbox" checked={form.activo} onChange={e=>setForm({...form,activo:e.target.checked})} style={{ width:16, height:16, accentColor:EVITARE_BLUE }} />
              <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Usuario activo</span>
            </label>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={saveUsuario} style={{ flex:1, justifyContent:"center" }}>💾 Guardar</Btn>
            <Btn onClick={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MENSAJES
// ═══════════════════════════════════════════════════════════════════════════
function SeccionMensajes({ toast }) {
  const [contacts, setContacts] = useState([]);
  const [chats, setChats]       = useState({});
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState("all");
  const [msgInput, setMsgInput] = useState("");
  const [tab, setTab]           = useState("chat");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ nombre:"", telefono:"", plataforma:"whatsapp", etiqueta:"prospecto" });
  const [note, setNote]         = useState("");
  const endRef = useRef();

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

  const contact = contacts.find(c => c.id === selected);
  const pl = contact ? PLATFORMS[contact.plataforma] : null;
  const msgs = chats[selected] || [];
  const filtered = contacts.filter(c => (filter==="all"||c.plataforma===filter) && c.nombre.toLowerCase().includes(search.toLowerCase()));

  async function selectContact(id) {
    setSelected(id); setTab("chat");
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
    if (!confirm("¿Eliminar este contacto?")) return;
    await supabase.from("contactos").delete().eq("id", id);
    setContacts(prev => prev.filter(c => c.id !== id));
    if (selected===id) setSelected(null);
    toast("Contacto eliminado");
  }

  const stats = { total:contacts.length, pendiente:contacts.filter(c=>c.estado==="pendiente").length, resuelto:contacts.filter(c=>c.estado==="resuelto").length };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <div style={{ width:310, background:"#fff", borderRight:"1px solid #E5E7EB", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:14, borderBottom:"1px solid #E5E7EB" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontWeight:700, fontSize:13 }}>Conversaciones</span>
            <Btn onClick={()=>setShowForm(true)} style={{ padding:"5px 10px", fontSize:11 }}>+ Nuevo</Btn>
          </div>
          <div style={{ display:"flex", gap:4, marginBottom:8 }}>
            {["all","facebook","instagram","whatsapp"].map(p => (
              <button key={p} onClick={()=>setFilter(p)} style={{ flex:1, padding:"4px 0", fontSize:10, fontWeight:600, border:"none", borderRadius:6, cursor:"pointer", background:filter===p?(p==="all"?EVITARE_BLUE:PLATFORMS[p]?.color):"#F3F4F6", color:filter===p?"#fff":"#6B7280" }}>
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
              <div key={c.id} onClick={()=>selectContact(c.id)} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #F9FAFB", background:selected===c.id?EVITARE_BLUE+"11":"transparent", borderLeft:selected===c.id?`3px solid ${EVITARE_BLUE}`:"3px solid transparent" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:p.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:p.color, fontSize:14 }}>{c.nombre[0]}</div>
                    <div style={{ position:"absolute", bottom:0, right:0, width:13, height:13, borderRadius:"50%", background:p.color, border:"2px solid #fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <i className={`ti ${p.icon}`} style={{ color:"#fff", fontSize:7 }} />
                    </div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontWeight:600, fontSize:13 }}>{c.nombre}</span>
                      <span style={{ fontSize:10, color:"#9CA3AF" }}>{c.tiempo}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#6B7280", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.ultimo_mensaje}</div>
                    <div style={{ display:"flex", gap:4, marginTop:2 }}>
                      <Badge color={STATUS_COLOR[c.estado]||"#6B7280"} label={c.estado} />
                      {c.mensajes_sin_leer>0 && <Badge color="#EF4444" label={c.mensajes_sin_leer} />}
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();deleteContact(c.id);}} style={{ border:"none", background:"none", cursor:"pointer", color:"#EF4444", opacity:0.5 }}>✕</button>
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

      {contact ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"10px 18px", background:"#fff", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:pl.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:pl.color, fontSize:15 }}>{contact.nombre[0]}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{contact.nombre}</div>
              <div style={{ fontSize:11, color:"#6B7280" }}>{contact.telefono} · <span style={{ color:pl.color }}>{pl.label}</span></div>
            </div>
            {["chat","contacto"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding:"5px 12px", fontSize:11, fontWeight:600, border:"none", borderRadius:8, cursor:"pointer", background:tab===t?EVITARE_BLUE:"#F3F4F6", color:tab===t?"#fff":"#6B7280" }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
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
                    <div style={{ maxWidth:"65%", padding:"9px 13px", borderRadius:m.de==="agent"?"16px 4px 16px 16px":"4px 16px 16px 16px", background:m.de==="agent"?EVITARE_BLUE:"#fff", color:m.de==="agent"?"#fff":"#111827", fontSize:13, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
                      {m.texto}
                      <div style={{ fontSize:10, marginTop:3, opacity:0.6, textAlign:"right" }}>{m.tiempo}</div>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div style={{ padding:"6px 14px", background:"#fff", borderTop:"1px solid #F3F4F6", display:"flex", gap:6, overflowX:"auto", flexShrink:0 }}>
                {QUICK_REPLIES.map((r,i)=>(
                  <button key={i} onClick={()=>setMsgInput(r)} style={{ whiteSpace:"nowrap", padding:"4px 10px", fontSize:11, border:`1px solid ${EVITARE_BLUE}44`, borderRadius:20, background:EVITARE_BLUE+"11", cursor:"pointer", color:EVITARE_BLUE, fontWeight:600 }}>{r.slice(0,28)}…</button>
                ))}
              </div>
              <div style={{ padding:"10px 14px", background:"#fff", borderTop:"1px solid #E5E7EB", display:"flex", gap:8, flexShrink:0 }}>
                <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="Escribe un mensaje..." style={{ flex:1, padding:"9px 13px", border:`1.5px solid ${EVITARE_BLUE}55`, borderRadius:12, fontSize:13, outline:"none" }} />
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
                <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Escribe notas..." style={{ width:"100%", minHeight:90, padding:10, border:"1px solid #E5E7EB", borderRadius:10, fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
                <Btn onClick={saveNote} style={{ marginTop:8 }}>💾 Guardar nota</Btn>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#9CA3AF", fontSize:14 }}>Selecciona un contacto</div>
      )}

      {showForm && (
        <Modal title="Nuevo Contacto" onClose={()=>setShowForm(false)}>
          <Input label="Nombre *" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} />
          <Input label="Teléfono" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} />
          <Select label="Plataforma" value={form.plataforma} onChange={e=>setForm({...form,plataforma:e.target.value})}>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
          </Select>
          <Select label="Etiqueta" value={form.etiqueta} onChange={e=>setForm({...form,etiqueta:e.target.value})}>
            <option value="prospecto">Prospecto</option>
            <option value="cliente">Cliente</option>
          </Select>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={addContact} style={{ flex:1, justifyContent:"center" }}>+ Agregar</Btn>
            <Btn onClick={()=>setShowForm(false)} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVENTARIO
// ═══════════════════════════════════════════════════════════════════════════
function SeccionInventario({ toast }) {
  const [vacunas, setVacunas]     = useState([]);
  const [movs, setMovs]           = useState([]);
  const [subTab, setSubTab]       = useState("catalogo");
  const [filtroAlm, setFiltroAlm] = useState("todos");
  const [showForm, setShowForm]   = useState(false);
  const [showMov, setShowMov]     = useState(null);
  const [editItem, setEditItem]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const VFORM = { nombre:"", fabricante:"", lote:"", caducidad:"", dosis_disponibles:0, stock_minimo:10, almacen:"Clinica Principal", precio:"" };
  const [form, setForm]           = useState(VFORM);
  const MFORM = { vacuna_id:"", dosis:1, almacen_origen:"Clinica Principal", almacen_destino:"", motivo:"", personal:"", paciente:"", monto:"" };
  const [mform, setMform]         = useState(MFORM);

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

  function estadoVacuna(d, m) { return d===0?"agotado":d<=m?"bajo":"disponible"; }
  const ESTCOLOR = { disponible:"#10B981", bajo:"#F59E0B", agotado:"#EF4444" };

  async function saveVacuna() {
    if (!form.nombre) return;
    const payload = { ...form, dosis_disponibles:Number(form.dosis_disponibles), stock_minimo:Number(form.stock_minimo), precio:form.precio?Number(form.precio):null, estado:estadoVacuna(Number(form.dosis_disponibles),Number(form.stock_minimo)) };
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
    if (!confirm("¿Eliminar?")) return;
    await supabase.from("vacunas").delete().eq("id", id);
    setVacunas(prev => prev.filter(v => v.id !== id));
    toast("Eliminada");
  }
  async function registrarMovimiento() {
    if (!mform.vacuna_id || !mform.dosis) return;
    const vacuna = vacunas.find(v => v.id === Number(mform.vacuna_id));
    if (!vacuna) return;
    await supabase.from("movimientos").insert({ ...mform, tipo:showMov, vacuna_nombre:vacuna.nombre, dosis:Number(mform.dosis), monto:mform.monto?Number(mform.monto):null });
    let nd = vacuna.dosis_disponibles;
    if (showMov==="entrada") nd += Number(mform.dosis);
    if (showMov==="salida")  nd = Math.max(0, nd - Number(mform.dosis));
    const ne = estadoVacuna(nd, vacuna.stock_minimo);
    await supabase.from("vacunas").update({ dosis_disponibles:nd, estado:ne }).eq("id", vacuna.id);
    setVacunas(prev => prev.map(v => v.id===vacuna.id ? {...v, dosis_disponibles:nd, estado:ne} : v));
    setShowMov(null); setMform(MFORM); load(); toast(`Movimiento registrado`);
  }

  const filtered = filtroAlm==="todos" ? vacunas : vacunas.filter(v=>v.almacen===filtroAlm);
  const stats = { total:vacunas.length, dosis:vacunas.reduce((a,v)=>a+v.dosis_disponibles,0), vencer:vacunas.filter(v=>{ const d=new Date(v.caducidad); return (d-new Date())<30*864e5&&d>new Date(); }).length, bajos:vacunas.filter(v=>v.estado!=="disponible").length };

  return (
    <div style={{ padding:24, overflowY:"auto", height:"100%" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {[["💉","Vacunas",stats.total,"en catálogo",EVITARE_BLUE],["📦","Dosis",stats.dosis,"disponibles","#10B981"],["⚠️","Por vencer",stats.vencer,"en 30 días","#F59E0B"],["🚨","Bajo stock",stats.bajos,"requieren reorden","#EF4444"]].map(([ic,label,val,sub,col])=>(
          <div key={label} style={{ background:"#fff", borderRadius:12, padding:"16px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", borderTop:`3px solid ${col}` }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{ic}</div>
            <div style={{ fontSize:22, fontWeight:800, color:col }}>{val}</div>
            <div style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{label}</div>
            <div style={{ fontSize:11, color:"#9CA3AF" }}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {["catalogo","movimientos"].map(t=>(
            <button key={t} onClick={()=>setSubTab(t)} style={{ padding:"6px 14px", fontSize:12, fontWeight:600, border:"none", borderRadius:8, cursor:"pointer", background:subTab===t?EVITARE_BLUE:"#F3F4F6", color:subTab===t?"#fff":"#6B7280" }}>
              {t==="catalogo"?"📋 Catálogo":"📊 Movimientos"}
            </button>
          ))}
          <select value={filtroAlm} onChange={e=>setFiltroAlm(e.target.value)} style={{ padding:"6px 10px", fontSize:12, border:"1px solid #E5E7EB", borderRadius:8, outline:"none" }}>
            <option value="todos">Todos los almacenes</option>
            {ALMACENES.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <Btn onClick={()=>setShowMov("entrada")} color="#10B981">+ Entrada</Btn>
            <Btn onClick={()=>setShowMov("salida")} color="#EF4444">− Salida</Btn>
            <Btn onClick={()=>setShowMov("transferencia")} color="#8B5CF6">⇄ Transferir</Btn>
            <Btn onClick={()=>{setEditItem(null);setForm(VFORM);setShowForm(true);}}>+ Nueva vacuna</Btn>
          </div>
        </div>
      </div>
      {subTab==="catalogo" && (
        <div style={{ background:"#fff", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr style={{ background:"#F9FAFB" }}>
              {["Vacuna","Lote","Fabricante","Caducidad","Dosis","Almacén","Estado","Acciones"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6B7280", borderBottom:"1px solid #E5E7EB" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Cargando...</td></tr>
              : filtered.map(v=>(
                <tr key={v.id} style={{ borderBottom:"1px solid #F3F4F6" }}>
                  <td style={{ padding:"10px 14px", fontWeight:600 }}>{v.nombre}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{v.lote||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{v.fabricante||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{v.caducidad||"—"}</td>
                  <td style={{ padding:"10px 14px", fontWeight:700 }}>{v.dosis_disponibles}</td>
                  <td style={{ padding:"10px 14px", fontSize:12 }}>{v.almacen}</td>
                  <td style={{ padding:"10px 14px" }}><Badge color={ESTCOLOR[v.estado]||"#6B7280"} label={v.estado} /></td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:4 }}>
                      <button onClick={()=>{setEditItem(v);setForm({...v,caducidad:v.caducidad||""});setShowForm(true);}} style={{ border:"none", background:EVITARE_BLUE+"22", color:EVITARE_BLUE, borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️</button>
                      <button onClick={()=>deleteVacuna(v.id)} style={{ border:"none", background:"#FEF2F2", color:"#EF4444", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
                  <td style={{ padding:"10px 14px" }}><Badge color={m.tipo==="entrada"?"#10B981":m.tipo==="salida"?"#EF4444":"#8B5CF6"} label={m.tipo} /></td>
                  <td style={{ padding:"10px 14px", fontWeight:600 }}>{m.vacuna_nombre}</td>
                  <td style={{ padding:"10px 14px" }}>{m.dosis}</td>
                  <td style={{ padding:"10px 14px", fontSize:12 }}>{m.almacen_origen||m.almacen_destino}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{m.motivo||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#6B7280" }}>{m.personal||"—"}</td>
                </tr>
              ))}
              {movs.length===0 && <tr><td colSpan={7} style={{ padding:24, textAlign:"center", color:"#9CA3AF" }}>Sin movimientos</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <Modal title={editItem?"Editar Vacuna":"Nueva Vacuna"} onClose={()=>{setShowForm(false);setEditItem(null);setForm(VFORM);}}>
          <Input label="Nombre *" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} />
          <Input label="Fabricante" value={form.fabricante} onChange={e=>setForm({...form,fabricante:e.target.value})} />
          <Input label="Lote" value={form.lote} onChange={e=>setForm({...form,lote:e.target.value})} />
          <Input label="Caducidad" type="date" value={form.caducidad} onChange={e=>setForm({...form,caducidad:e.target.value})} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Input label="Dosis" type="number" value={form.dosis_disponibles} onChange={e=>setForm({...form,dosis_disponibles:e.target.value})} />
            <Input label="Stock mínimo" type="number" value={form.stock_minimo} onChange={e=>setForm({...form,stock_minimo:e.target.value})} />
          </div>
          <Select label="Almacén" value={form.almacen} onChange={e=>setForm({...form,almacen:e.target.value})}>
            {ALMACENES.map(a=><option key={a} value={a}>{a}</option>)}
          </Select>
          <Input label="Precio ($)" type="number" value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})} />
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={saveVacuna} style={{ flex:1, justifyContent:"center" }}>💾 Guardar</Btn>
            <Btn onClick={()=>{setShowForm(false);setEditItem(null);setForm(VFORM);}} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
        </Modal>
      )}
      {showMov && (
        <Modal title={`Registrar ${showMov.charAt(0).toUpperCase()+showMov.slice(1)}`} onClose={()=>setShowMov(null)}>
          <Select label="Vacuna *" value={mform.vacuna_id} onChange={e=>setMform({...mform,vacuna_id:e.target.value})}>
            <option value="">Seleccionar...</option>
            {vacunas.map(v=><option key={v.id} value={v.id}>{v.nombre} (stock: {v.dosis_disponibles})</option>)}
          </Select>
          <Input label="Dosis *" type="number" value={mform.dosis} onChange={e=>setMform({...mform,dosis:e.target.value})} />
          <Select label="Almacén origen" value={mform.almacen_origen} onChange={e=>setMform({...mform,almacen_origen:e.target.value})}>
            {ALMACENES.map(a=><option key={a} value={a}>{a}</option>)}
          </Select>
          {showMov==="transferencia" && (
            <Select label="Almacén destino" value={mform.almacen_destino} onChange={e=>setMform({...mform,almacen_destino:e.target.value})}>
              <option value="">Seleccionar...</option>
              {ALMACENES.map(a=><option key={a} value={a}>{a}</option>)}
            </Select>
          )}
          {showMov==="salida" && <Input label="Paciente" value={mform.paciente} onChange={e=>setMform({...mform,paciente:e.target.value})} />}
          <Input label="Motivo" value={mform.motivo} onChange={e=>setMform({...mform,motivo:e.target.value})} />
          <Input label="Personal" value={mform.personal} onChange={e=>setMform({...mform,personal:e.target.value})} />
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
// GOOGLE CALENDAR
// ═══════════════════════════════════════════════════════════════════════════
function SeccionCalendario({ toast }) {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded]   = useState(false);
  const [signedIn, setSignedIn]     = useState(false);
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [viewDate, setViewDate]     = useState(new Date());
  const [showForm, setShowForm]     = useState(false);
  const [editEvent, setEditEvent]   = useState(null);
  const tokenClientRef              = useRef(null);
  const EFORM = { titulo:"", fecha:new Date().toISOString().slice(0,10), horaInicio:"09:00", horaFin:"10:00", descripcion:"", lugar:"Evitare Medical Center" };
  const [form, setForm]             = useState(EFORM);

  useEffect(() => {
    const s1 = document.createElement("script");
    s1.src = "https://apis.google.com/js/api.js";
    s1.onload = () => { window.gapi.load("client", async () => { await window.gapi.client.init({ discoveryDocs:["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"] }); setGapiLoaded(true); }); };
    document.body.appendChild(s1);
    const s2 = document.createElement("script");
    s2.src = "https://accounts.google.com/gsi/client";
    s2.onload = () => {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({ client_id:GOOGLE_CLIENT_ID, scope:GOOGLE_SCOPES, callback:async(resp)=>{ if(resp.error)return; setSignedIn(true); await loadEvents(); } });
      setGisLoaded(true);
    };
    document.body.appendChild(s2);
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const start = new Date(viewDate); start.setHours(0,0,0,0);
      const end   = new Date(viewDate); end.setHours(23,59,59,999);
      const res = await window.gapi.client.calendar.events.list({ calendarId:"primary", timeMin:start.toISOString(), timeMax:end.toISOString(), singleEvents:true, orderBy:"startTime", maxResults:50 });
      setEvents(res.result.items||[]);
    } catch(e) { console.error(e); }
    setLoading(false);
  }
  useEffect(() => { if (signedIn) loadEvents(); }, [viewDate]);

  async function saveEvent() {
    if (!form.titulo) return;
    const event = { summary:form.titulo, description:form.descripcion, location:form.lugar, start:{ dateTime:`${form.fecha}T${form.horaInicio}:00`, timeZone:"America/Mexico_City" }, end:{ dateTime:`${form.fecha}T${form.horaFin}:00`, timeZone:"America/Mexico_City" } };
    try {
      if (editEvent) { await window.gapi.client.calendar.events.update({ calendarId:"primary", eventId:editEvent.id, resource:event }); toast("Cita actualizada"); }
      else { await window.gapi.client.calendar.events.insert({ calendarId:"primary", resource:event }); toast("Cita creada"); }
      setShowForm(false); setEditEvent(null); setForm(EFORM); await loadEvents();
    } catch(e) { toast("Error al guardar"); }
  }
  async function deleteEvent(id) {
    if (!confirm("¿Eliminar esta cita?")) return;
    try { await window.gapi.client.calendar.events.delete({ calendarId:"primary", eventId:id }); setEvents(prev=>prev.filter(e=>e.id!==id)); toast("Cita eliminada"); } catch(e) { toast("Error"); }
  }

  const weekStart = new Date(viewDate); weekStart.setDate(viewDate.getDate()-viewDate.getDay());
  const weekDays  = Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; });
  const today     = new Date();
  const COLORS    = [EVITARE_BLUE,"#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4"];
  const meses     = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const diasS     = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  function fmtTime(dt) { if(!dt)return""; return new Date(dt).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"}); }
  function getTop(ev) { const s=ev.start.dateTime?new Date(ev.start.dateTime):new Date(ev.start.date); return Math.max(0,(s.getHours()+s.getMinutes()/60-7)*60); }
  function getHeight(ev) { const s=ev.start.dateTime?new Date(ev.start.dateTime):new Date(ev.start.date); const e=ev.end.dateTime?new Date(ev.end.dateTime):new Date(ev.end.date); return Math.max(30,(e-s)/60000); }

  if (!signedIn) return (
    <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"#F9FAFB" }}>
      <div style={{ textAlign:"center", padding:48, background:"#fff", borderRadius:20, boxShadow:"0 4px 24px rgba(0,0,0,0.08)", maxWidth:380, border:`2px solid ${EVITARE_BLUE}33` }}>
        <EvitareLogo size={52} />
        <h2 style={{ fontSize:20, fontWeight:700, color:"#111827", margin:"16px 0 8px" }}>Conectar Google Calendar</h2>
        <p style={{ fontSize:14, color:"#6B7280", marginBottom:28, lineHeight:1.6 }}>Conecta tu cuenta para ver y gestionar citas directamente en el panel.</p>
        <button onClick={()=>tokenClientRef.current?.requestAccessToken({prompt:"consent"})} style={{ padding:"12px 28px", background:"#4285F4", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:10, margin:"0 auto" }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#fff" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></svg>
          Conectar con Google
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#fff" }}>
      <div style={{ padding:"12px 20px", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={()=>{ const d=new Date(viewDate); d.setDate(d.getDate()-7); setViewDate(d); }} style={{ border:"1px solid #E5E7EB", background:"#fff", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:16 }}>‹</button>
        <button onClick={()=>setViewDate(new Date())} style={{ border:`1.5px solid ${EVITARE_BLUE}`, background:EVITARE_BLUE+"11", borderRadius:8, padding:"5px 14px", cursor:"pointer", fontSize:12, fontWeight:700, color:EVITARE_BLUE }}>Hoy</button>
        <button onClick={()=>{ const d=new Date(viewDate); d.setDate(d.getDate()+7); setViewDate(d); }} style={{ border:"1px solid #E5E7EB", background:"#fff", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:16 }}>›</button>
        <h2 style={{ fontSize:15, fontWeight:700, color:"#111827", flex:1 }}>{meses[weekDays[0].getMonth()]} {weekDays[0].getDate()} – {meses[weekDays[6].getMonth()]} {weekDays[6].getDate()}, {weekDays[0].getFullYear()}</h2>
        <Btn onClick={()=>{setEditEvent(null);setForm({...EFORM,fecha:viewDate.toISOString().slice(0,10)});setShowForm(true);}}>+ Nueva cita</Btn>
        <button onClick={loadEvents} style={{ border:"1px solid #E5E7EB", background:"#fff", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12 }}>🔄</button>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"52px repeat(7,1fr)", borderBottom:"1px solid #E5E7EB", background:"#F9FAFB", position:"sticky", top:0, zIndex:2 }}>
          <div />
          {weekDays.map((d,i) => {
            const isToday = d.toDateString()===today.toDateString();
            const isSel   = d.toDateString()===viewDate.toDateString();
            return (
              <div key={i} onClick={()=>setViewDate(new Date(d))} style={{ padding:"10px 0", textAlign:"center", cursor:"pointer", borderLeft:"1px solid #E5E7EB" }}>
                <div style={{ fontSize:11, color:"#6B7280", fontWeight:600 }}>{diasS[d.getDay()]}</div>
                <div style={{ width:30, height:30, borderRadius:"50%", background:isToday?EVITARE_BLUE:isSel?EVITARE_BLUE+"22":"transparent", color:isToday?"#fff":isSel?EVITARE_BLUE:"#111827", fontWeight:isToday||isSel?700:400, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", margin:"4px auto 0" }}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"52px repeat(7,1fr)" }}>
          <div style={{ borderRight:"1px solid #E5E7EB" }}>
            {HOURS.map(h => <div key={h} style={{ height:60, borderBottom:"1px solid #F3F4F6", padding:"2px 6px 0", textAlign:"right" }}><span style={{ fontSize:10, color:"#9CA3AF" }}>{h}:00</span></div>)}
          </div>
          {weekDays.map((d,di) => {
            const dayEvs = events.filter(ev=>(ev.start.dateTime||ev.start.date)?.slice(0,10)===d.toISOString().slice(0,10));
            const isToday = d.toDateString()===today.toDateString();
            return (
              <div key={di} style={{ borderLeft:"1px solid #E5E7EB", position:"relative", background:isToday?EVITARE_BLUE+"08":"transparent" }}>
                {HOURS.map(h=><div key={h} style={{ height:60, borderBottom:"1px solid #F3F4F6" }} />)}
                {dayEvs.map((ev,ei) => (
                  <div key={ev.id} onClick={()=>{ const s=ev.start.dateTime?new Date(ev.start.dateTime):null; const e2=ev.end.dateTime?new Date(ev.end.dateTime):null; setEditEvent(ev); setForm({ titulo:ev.summary||"", fecha:(ev.start.dateTime||ev.start.date)?.slice(0,10)||"", horaInicio:s?`${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`:"09:00", horaFin:e2?`${String(e2.getHours()).padStart(2,"0")}:${String(e2.getMinutes()).padStart(2,"0")}`:"10:00", descripcion:ev.description||"", lugar:ev.location||"" }); setShowForm(true); }} style={{ position:"absolute", left:2, right:2, top:getTop(ev)+"px", height:Math.max(getHeight(ev),22)+"px", background:COLORS[ei%COLORS.length]+"22", borderLeft:`3px solid ${COLORS[ei%COLORS.length]}`, borderRadius:"0 6px 6px 0", padding:"2px 6px", cursor:"pointer", overflow:"hidden", zIndex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:COLORS[ei%COLORS.length], whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ev.summary}</div>
                    {getHeight(ev)>30 && <div style={{ fontSize:10, color:"#6B7280" }}>{fmtTime(ev.start.dateTime)} – {fmtTime(ev.end.dateTime)}</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {events.filter(ev=>(ev.start.dateTime||ev.start.date)?.slice(0,10)===viewDate.toISOString().slice(0,10)).length>0 && (
        <div style={{ borderTop:"1px solid #E5E7EB", padding:"10px 16px", background:"#F9FAFB", flexShrink:0, maxHeight:180, overflowY:"auto" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#6B7280", marginBottom:8 }}>CITAS — {viewDate.toLocaleDateString("es",{weekday:"long",day:"numeric",month:"long"})}</div>
          {events.filter(ev=>(ev.start.dateTime||ev.start.date)?.slice(0,10)===viewDate.toISOString().slice(0,10)).map((ev,i)=>(
            <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"#fff", borderRadius:10, marginBottom:6, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ width:4, height:32, background:COLORS[i%COLORS.length], borderRadius:2, flexShrink:0 }} />
              <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:13 }}>{ev.summary}</div><div style={{ fontSize:11, color:"#6B7280" }}>{fmtTime(ev.start.dateTime)} – {fmtTime(ev.end.dateTime)}{ev.location?` · ${ev.location}`:""}</div></div>
              <button onClick={()=>deleteEvent(ev.id)} style={{ border:"none", background:"#FEF2F2", color:"#EF4444", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11 }}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editEvent?"Editar Cita":"Nueva Cita"} onClose={()=>{setShowForm(false);setEditEvent(null);setForm(EFORM);}}>
          <Input label="Título / Paciente *" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} placeholder="Ej. Vacunación - María González" />
          <Input label="Fecha" type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Input label="Hora inicio" type="time" value={form.horaInicio} onChange={e=>setForm({...form,horaInicio:e.target.value})} />
            <Input label="Hora fin" type="time" value={form.horaFin} onChange={e=>setForm({...form,horaFin:e.target.value})} />
          </div>
          <Input label="Lugar" value={form.lugar} onChange={e=>setForm({...form,lugar:e.target.value})} />
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#374151", marginBottom:4 }}>Notas</div>
            <textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #E5E7EB", borderRadius:8, fontSize:13, outline:"none", resize:"vertical", minHeight:70, boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={saveEvent} style={{ flex:1, justifyContent:"center" }}>💾 Guardar en Google Calendar</Btn>
            <Btn onClick={()=>{setShowForm(false);setEditEvent(null);setForm(EFORM);}} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
          {editEvent && <button onClick={()=>deleteEvent(editEvent.id)} style={{ width:"100%", marginTop:8, padding:"8px", background:"#FEF2F2", color:"#EF4444", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 }}>🗑️ Eliminar esta cita</button>}
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════════════════════════════
function SeccionLeads({ toast }) {
  const [leads, setLeads]       = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const FORM0 = { nombre:"", servicio:"", zona:"", fuente:"WhatsApp", estado:"pendiente", telefono:"", notas:"" };
  const [form, setForm]         = useState(FORM0);
  const [loading, setLoading]   = useState(true);
  const LEAD_COLOR = { pendiente:"#F59E0B", "en curso":"#3B82F6", resuelto:"#10B981" };

  async function load() { const { data } = await supabase.from("contactos").select("*").order("created_at",{ascending:false}); if(data)setLeads(data); setLoading(false); }
  useEffect(()=>{load();},[]);

  async function saveLead() {
    if (!form.nombre) return;
    if (editItem) { const { data } = await supabase.from("contactos").update(form).eq("id",editItem.id).select().single(); if(data)setLeads(prev=>prev.map(l=>l.id===editItem.id?data:l)); toast("Actualizado"); }
    else { const { data } = await supabase.from("contactos").insert({...form,plataforma:"whatsapp",ultimo_mensaje:"Lead manual",tiempo:"Ahora",mensajes_sin_leer:0}).select().single(); if(data)setLeads(prev=>[data,...prev]); toast("Lead agregado"); }
    setShowForm(false); setEditItem(null); setForm(FORM0);
  }
  async function deleteLead(id) { if(!confirm("¿Eliminar?"))return; await supabase.from("contactos").delete().eq("id",id); setLeads(prev=>prev.filter(l=>l.id!==id)); toast("Eliminado"); }

  return (
    <div style={{ padding:24, overflowY:"auto", height:"100%" }}>
      <div style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:700, color:"#111827" }}>◈ Leads — {leads.length} registros</span>
        <Btn onClick={()=>{setEditItem(null);setForm(FORM0);setShowForm(true);}}>+ Agregar lead</Btn>
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
                <td style={{ padding:"10px 14px", color:"#6B7280" }}>{l.fuente||"—"}</td>
                <td style={{ padding:"10px 14px" }}><Badge color={LEAD_COLOR[l.estado]||"#6B7280"} label={l.estado} /></td>
                <td style={{ padding:"10px 14px", color:"#6B7280", fontSize:12 }}>{l.created_at?.slice(0,10)}</td>
                <td style={{ padding:"10px 14px" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>{setEditItem(l);setForm({nombre:l.nombre,servicio:l.servicio||"",zona:l.zona||"",fuente:l.fuente||"WhatsApp",estado:l.estado,telefono:l.telefono||"",notas:l.notas||""});setShowForm(true);}} style={{ border:"none", background:EVITARE_BLUE+"22", color:EVITARE_BLUE, borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️</button>
                    <button onClick={()=>deleteLead(l.id)} style={{ border:"none", background:"#FEF2F2", color:"#EF4444", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title={editItem?"Editar Lead":"Nuevo Lead"} onClose={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}}>
          <Input label="Nombre *" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} />
          <Input label="Teléfono" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} />
          <Select label="Servicio" value={form.servicio} onChange={e=>setForm({...form,servicio:e.target.value})}>
            <option value="">Seleccionar...</option>
            {["Vacunación","Tamiz Neonatal","Ruta a Domicilio","Nutrición","Análisis Clínicos","Paquete Familiar","Paquete Bebé","Paquete Senior"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="Zona" value={form.zona} onChange={e=>setForm({...form,zona:e.target.value})} />
          <Select label="Fuente" value={form.fuente} onChange={e=>setForm({...form,fuente:e.target.value})}>
            {["WhatsApp","Facebook","Instagram","Referido","Llamada","Página web","Otro"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Estado" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
            {["pendiente","en curso","resuelto"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={saveLead} style={{ flex:1, justifyContent:"center" }}>💾 Guardar</Btn>
            <Btn onClick={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}} color="#6B7280" style={{ flex:1, justifyContent:"center" }}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTURACIÓN
// ═══════════════════════════════════════════════════════════════════════════
function SeccionFacturacion({ toast }) {
  const [facturas, setFacturas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const FORM0 = { folio:"", paciente:"", servicio:"", monto:"", fecha:new Date().toISOString().slice(0,10), estado:"Pendiente" };
  const [form, setForm]         = useState(FORM0);
  const [loading, setLoading]   = useState(true);

  async function load() { const { data } = await supabase.from("facturas").select("*").order("created_at",{ascending:false}); if(data)setFacturas(data); setLoading(false); }
  useEffect(()=>{load();},[]);

  async function nextFolio() { const { data } = await supabase.from("facturas").select("folio").order("created_at",{ascending:false}).limit(1); if(data&&data.length){const n=parseInt(data[0].folio.replace("FAC-",""))+1;return"FAC-"+String(n).padStart(4,"0");} return"FAC-0001"; }

  async function saveFactura() {
    if (!form.paciente) return;
    const folio = form.folio||await nextFolio();
    const payload = {...form, folio, monto:Number(form.monto)};
    if (editItem) { const { data } = await supabase.from("facturas").update(payload).eq("id",editItem.id).select().single(); if(data)setFacturas(prev=>prev.map(f=>f.id===editItem.id?data:f)); toast("Actualizada"); }
    else { const { data } = await supabase.from("facturas").insert(payload).select().single(); if(data)setFacturas(prev=>[data,...prev]); toast("Factura registrada"); }
    setShowForm(false); setEditItem(null); setForm(FORM0);
  }
  async function deleteFactura(id) { if(!confirm("¿Eliminar?"))return; await supabase.from("facturas").delete().eq("id",id); setFacturas(prev=>prev.filter(f=>f.id!==id)); toast("Eliminada"); }
  async function changeEstado(id,estado) { await supabase.from("facturas").update({estado}).eq("id",id); setFacturas(prev=>prev.map(f=>f.id===id?{...f,estado}:f)); }

  const total = facturas.filter(f=>f.estado==="Timbrada").reduce((a,f)=>a+Number(f.monto||0),0);

  return (
    <div style={{ padding:24, overflowY:"auto", height:"100%" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:22 }}>
        {[["🧾","Emitidas",facturas.filter(f=>f.estado==="Timbrada").length,"este mes","#10B981"],["💰","Total","$"+total.toLocaleString(),"timbradas",EVITARE_BLUE],["⏳","Pendientes",facturas.filter(f=>f.estado==="Pendiente").length,"por timbrar","#F59E0B"]].map(([ic,label,val,sub,col])=>(
          <div key={label} style={{ background:"#fff", borderRadius:12, padding:"16px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", borderTop:`3px solid ${col}` }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{ic}</div>
            <div style={{ fontSize:22, fontWeight:800, color:col }}>{val}</div>
            <div style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{label}</div>
            <div style={{ fontSize:11, color:"#9CA3AF" }}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:"#E0F2FE", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:24 }}>🧾</span>
        <div><div style={{ fontWeight:700, fontSize:13 }}>ecoFactura — CFDI 4.0</div><div style={{ fontSize:12, color:"#0369A1" }}>Facturación electrónica · Guadalajara</div></div>
        <a href="https://www.ecofactura.mx" target="_blank" rel="noreferrer" style={{ marginLeft:"auto", padding:"7px 14px", background:"#0369A1", color:"#fff", borderRadius:8, fontSize:12, fontWeight:600, textDecoration:"none" }}>Abrir ↗</a>
      </div>
      <div style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:700 }}>📋 Facturas</span>
        <Btn onClick={()=>{setEditItem(null);setForm(FORM0);setShowForm(true);}}>+ Nueva factura</Btn>
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
                <td style={{ padding:"10px 14px", fontWeight:700, color:EVITARE_BLUE }}>{f.folio}</td>
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
                    <button onClick={()=>{setEditItem(f);setForm({folio:f.folio,paciente:f.paciente,servicio:f.servicio||"",monto:f.monto,fecha:f.fecha,estado:f.estado});setShowForm(true);}} style={{ border:"none", background:EVITARE_BLUE+"22", color:EVITARE_BLUE, borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>✏️</button>
                    <button onClick={()=>deleteFactura(f.id)} style={{ border:"none", background:"#FEF2F2", color:"#EF4444", borderRadius:6, padding:"4px 8px", cursor:"pointer", fontSize:11, fontWeight:600 }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title={editItem?"Editar Factura":"Nueva Factura"} onClose={()=>{setShowForm(false);setEditItem(null);setForm(FORM0);}}>
          <Input label="Folio" value={form.folio} onChange={e=>setForm({...form,folio:e.target.value})} placeholder="Auto" />
          <Input label="Paciente *" value={form.paciente} onChange={e=>setForm({...form,paciente:e.target.value})} />
          <Select label="Servicio" value={form.servicio} onChange={e=>setForm({...form,servicio:e.target.value})}>
            <option value="">Seleccionar...</option>
            {["Vacunación","Tamiz Neonatal","Ruta a Domicilio","Nutrición","Análisis Clínicos","Paquete Familiar","Paquete Bebé","Paquete Senior"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="Monto ($)" type="number" value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} />
          <Input label="Fecha" type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} />
          <Select label="Estado" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
            {["Pendiente","Timbrada","Cancelada"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={saveFactura} style={{ flex:1, justifyContent:"center" }}>💾 Guardar</Btn>
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
  const [usuario, setUsuario]   = useState(null);
  const [section, setSection]   = useState("mensajes");
  const [toastMsg, setToastMsg] = useState("");

  function toast(msg) { setToastMsg(msg); setTimeout(()=>setToastMsg(""), 2500); }

  function handleLogin(u) {
    setUsuario(u);
    // Ir al primer módulo con permiso
    if (u.rol==="master") { setSection("mensajes"); return; }
    const p = u.permisos||{};
    const first = ["mensajes","inventario","calendario","leads","facturacion"].find(k=>p[k]);
    setSection(first||"mensajes");
  }

  function handleLogout() { setUsuario(null); setSection("mensajes"); }

  if (!usuario) return <LoginPage onLogin={handleLogin} />;

  const permisos = usuario.rol==="master"
    ? { mensajes:true, inventario:true, calendario:true, leads:true, facturacion:true, configuracion:true }
    : { ...usuario.permisos, configuracion:false };

  const NAV = [
    { id:"mensajes",      icon:"ti-message-circle", label:"Mensajes",        show: permisos.mensajes },
    { id:"inventario",    icon:"ti-vaccine",         label:"Inventario",      show: permisos.inventario },
    { id:"calendario",    icon:"ti-calendar",        label:"Citas",           show: permisos.calendario },
    { id:"leads",         icon:"ti-users",           label:"Leads",           show: permisos.leads },
    { id:"facturacion",   icon:"ti-receipt",         label:"Facturación",     show: permisos.facturacion },
    { id:"configuracion", icon:"ti-settings",        label:"Configuración",   show: usuario.rol==="master" },
  ].filter(n=>n.show);

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"Inter,sans-serif", background:"#F3F4F6" }}>
      {/* Sidebar */}
      <div style={{ width:220, background:"#fff", borderRight:"1.5px solid #E5E7EB", display:"flex", flexDirection:"column", flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:"20px 18px 16px", borderBottom:"1.5px solid #E5E7EB" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <EvitareLogo size={34} />
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#111827", letterSpacing:"-0.3px" }}>Evitare</div>
              <div style={{ fontSize:10, color:"#9CA3AF" }}>Medical Center</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 10px" }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setSection(n.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", marginBottom:2, border:"none", borderRadius:10, cursor:"pointer", background:section===n.id?EVITARE_BLUE+"18":"transparent", color:section===n.id?EVITARE_BLUE:"#374151", fontSize:13, fontWeight:section===n.id?700:500, textAlign:"left", borderLeft:section===n.id?`3px solid ${EVITARE_BLUE}`:"3px solid transparent" }}>
              <i className={`ti ${n.icon}`} style={{ fontSize:17 }} />
              {n.label}
            </button>
          ))}
        </nav>

        {/* Usuario */}
        <div style={{ padding:"12px 14px", borderTop:"1.5px solid #E5E7EB" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:EVITARE_BLUE+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:EVITARE_BLUE, flexShrink:0 }}>
              {usuario.nombre[0].toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:12, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{usuario.nombre}</div>
              <div style={{ fontSize:10, color:usuario.rol==="master"?EVITARE_BLUE:"#9CA3AF", fontWeight:600 }}>{usuario.rol}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width:"100%", padding:"7px", background:"#FEF2F2", color:"#EF4444", border:"1px solid #FCA5A5", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600 }}>
            ⎋ Cerrar sesión
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {section==="mensajes"      && permisos.mensajes      && <SeccionMensajes      toast={toast} />}
        {section==="inventario"    && permisos.inventario    && <SeccionInventario    toast={toast} />}
        {section==="calendario"    && permisos.calendario    && <SeccionCalendario    toast={toast} />}
        {section==="leads"         && permisos.leads         && <SeccionLeads         toast={toast} />}
        {section==="facturacion"   && permisos.facturacion   && <SeccionFacturacion   toast={toast} />}
        {section==="configuracion" && usuario.rol==="master" && <SeccionConfiguracion usuario={usuario} toast={toast} />}
        {!NAV.find(n=>n.id===section) && (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:"#9CA3AF" }}>
            <EvitareLogo size={48} />
            <p style={{ fontSize:14 }}>No tienes permiso para ver este módulo.</p>
          </div>
        )}
      </div>

      <Toast msg={toastMsg} />
    </div>
  );
}
