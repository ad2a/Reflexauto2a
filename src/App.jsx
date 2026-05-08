import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";

const C = {
  bg: "#0D0D0D",
  surface: "#161616",
  card: "#1C1C1C",
  gold: "#C9A84C",
  goldLight: "#E2C47A",
  text: "#F5F0E8",
  muted: "#888880",
  border: "#2A2A2A",
  green: "#4ADE80",
  red: "#F87171",
};

const LOGO = "./photos/logo/logo.png";

// ═══ FORMSPREE — envoi des demandes par email ═══
const FORMSPREE_URL = "https://formspree.io/f/xjglrdjw";

// ═══ CLOUDINARY — hébergement des fichiers ═══
const CLOUDINARY_CLOUD_NAME = "dokugblpm";
const CLOUDINARY_UPLOAD_PRESET = "reflexauto";

// Upload un fichier sur Cloudinary, retourne l'URL ou null si échec
async function uploadToCloudinary(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    
    // Cloudinary a 3 endpoints selon le type :
    // - /image/upload pour JPG, PNG, etc.
    // - /raw/upload pour PDF, docs, etc.
    // - /auto/upload détecte automatiquement (le plus sûr pour tous les cas)
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudinary error:", response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    // On utilise l'URL sécurisée originale (pas de transformation auto)
    return data.secure_url || data.url || null;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

async function sendToFormspree(type, data, files = []) {
  try {
    // 1. D'abord on upload tous les fichiers sur Cloudinary
    const fileLinks = [];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadToCloudinary(file);
        if (url) {
          fileLinks.push({
            nom: file.name,
            url: url,
            taille: `${(file.size / 1024).toFixed(0)} Ko`
          });
        }
      }
    }
    
    // 2. Ensuite on envoie l'email à Formspree avec les liens des fichiers
    const formData = new FormData();
    formData.append("_subject", `[Reflex Auto 2A] ${type}`);
    formData.append("type_demande", type);
    
    const normalizeKey = (key) => {
      return key
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    };
    
    // Email du client (champ obligatoire pour Formspree, doit être valide)
    if (data.email) {
      formData.append("email", String(data.email));
      formData.append("_replyto", String(data.email));
    }
    
    Object.entries(data).forEach(([key, value]) => {
      const normalKey = normalizeKey(key);
      // On évite de réécrire le champ email déjà ajouté
      if (normalKey === "email") return;
      if (Array.isArray(value)) {
        formData.append(normalKey, value.join(", "));
      } else if (value !== undefined && value !== null && value !== "") {
        formData.append(normalKey, String(value));
      }
    });
    
    // Ajout des liens des fichiers (formaté pour être lisible dans l'email)
    if (fileLinks.length > 0) {
      const linksText = fileLinks.map((f, i) => 
        `📎 Fichier ${i + 1} : ${f.nom} (${f.taille})\n   ➜ ${f.url}`
      ).join("\n\n");
      formData.append("documents_joints", linksText);
      formData.append("nombre_de_fichiers", String(fileLinks.length));
    }
    
    const response = await fetch(FORMSPREE_URL, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Formspree error:", response.status, errorText);
    }
    
    // Erreur si certains fichiers n'ont pas pu être uploadés
    if (files.length > 0 && fileLinks.length < files.length) {
      console.error(`Seulement ${fileLinks.length}/${files.length} fichiers uploadés`);
    }
    
    return response.ok;
  } catch (error) {
    console.error("Erreur d'envoi:", error);
    return false;
  }
}

const MARQUES = ["Alfa Romeo","Audi","BMW","Citroën","Dacia","DS","Ferrari","Fiat","Ford","Honda","Hyundai","Jaguar","Kia","Lamborghini","Land Rover","Maserati","Mazda","Mercedes","Mini","Mitsubishi","Nissan","Opel","Peugeot","Porsche","Renault","Seat","Skoda","Suzuki","Tesla","Toyota","Volkswagen","Volvo"];
const CARBURANTS = ["Essence","Diesel","Hybride","Hybride rechargeable","Électrique","GPL"];
const BOITES = ["Manuelle","Automatique","Semi-automatique"];
const ETATS = ["Parfait état — aucun défaut visible","Très bon état — légères traces d'usage","Bon état — quelques rayures mineures","État correct — défauts visibles","À remettre en état"];

// ═══ STOCK RÉEL REFLEX'AUTO 2A ═══
const STOCK = [
  {
    id:1,
    marque:"Mercedes",
    modele:"Classe E 300 de 9G-Tronic AMG Line",
    annee:2019,
    mec:"31/07/2019",
    km:71580,
    prix:29990,
    carb:"Hybride rechargeable",
    boite:"Automatique",
    ch:194,
    couleur:"Bleu",
    portes:4,
    type:"Berline",
    cat:"vente",
    badge:"Premium",
    description:"Magnifique Mercedes Classe E 300 de hybride rechargeable, finition AMG Line. État neuf, parfaitement entretenue. Idéale pour la route comme pour la ville grâce à son mode 100% électrique.",
    points:["État neuf","Finition AMG Line","Hybride rechargeable","Boîte 9G-Tronic","Intérieur cuir"],
    photos:["./photos/mercedes/1.png","./photos/mercedes/2.png","./photos/mercedes/3.png","./photos/mercedes/4.png","./photos/mercedes/5.png"]
  },
  {
    id:2,
    marque:"Peugeot",
    modele:"2008 1.6 HDI Pack Style",
    annee:2015,
    mec:"04/07/2015",
    km:126580,
    prix:6990,
    carb:"Diesel",
    boite:"Manuelle",
    ch:92,
    couleur:"Gris",
    portes:5,
    type:"SUV Compact",
    cat:"vente",
    badge:"Sans AdBlue",
    description:"Peugeot 2008 Pack Style, version sans AdBlue. Véhicule non-fumeur, toujours entretenu. Révision effectuée à 121 000 km, kit de distribution fait, contrôle technique OK. Idéal premier achat ou seconde voiture.",
    points:["Version sans AdBlue","Non-fumeur","Toujours entretenu","Révision faite à 121 000 km","Kit distribution fait","CT OK"],
    photos:["./photos/peugeot/1.png","./photos/peugeot/2.png","./photos/peugeot/3.png","./photos/peugeot/4.png","./photos/peugeot/5.jpeg"]
  },
];

function Logo({ size = 44 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
      <img src={LOGO} alt="Reflex'Auto 2A" style={{ height: size, width: size, objectFit:"contain" }} />
      <div>
        <div style={{ fontFamily:"'Cormorant Garamond', serif", fontWeight:700, fontSize: size * 0.42, color: C.gold, letterSpacing:1.5, lineHeight:1.1 }}>REFLEX'AUTO 2A</div>
        <div style={{ fontSize: size * 0.2, color: C.muted, letterSpacing:2.5, textTransform:"uppercase" }}>Achat · Vente · Location</div>
      </div>
    </div>
  );
}

function GoldLine() {
  return <div style={{ height:1, background:`linear-gradient(90deg, transparent, ${C.gold}, transparent)`, margin:"32px 0", opacity:0.4 }} />;
}

function Tag({ children, color }) {
  return <span style={{ background: (color||C.gold)+"22", color: color||C.gold, border:`1px solid ${(color||C.gold)}55`, borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:700, letterSpacing:0.5 }}>{children}</span>;
}

function NavBar({ page, setPage }) {
  const [open, setOpen] = useState(false);
  const nav = [
    { id:"home", label:"Accueil" },
    { id:"stock", label:"Véhicules" },
    { id:"rachat", label:"Rachat / Dépôt" },
    { id:"location", label:"Location" },
    { id:"cartegrise", label:"Carte Grise" },
    { id:"contact", label:"Contact" },
  ];
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(13,13,13,0.97)", backdropFilter:"blur(16px)", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", height:70, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div onClick={() => { setPage("home"); setOpen(false); }}>
          <Logo size={40} />
        </div>
        <div style={{ display:"flex", gap:2 }} className="desk-nav">
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              background: page===n.id ? C.gold : "transparent",
              color: page===n.id ? C.bg : C.muted,
              border:"none", borderRadius:8, padding:"9px 16px", cursor:"pointer",
              fontWeight:600, fontSize:13, fontFamily:"inherit", transition:"all .2s",
            }}>{n.label}</button>
          ))}
        </div>
        <button onClick={() => setOpen(!open)} className="mob-btn" style={{ background:"none", border:"none", color:C.text, fontSize:26, cursor:"pointer" }}>☰</button>
      </div>
      {open && (
        <div style={{ background:C.surface, borderTop:`1px solid ${C.border}`, padding:"12px 24px", display:"flex", flexDirection:"column", gap:4 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setOpen(false); }} style={{
              background: page===n.id ? C.gold : "transparent", color: page===n.id ? C.bg : C.text,
              border:"none", borderRadius:8, padding:"13px 16px", cursor:"pointer", fontWeight:600, textAlign:"left", fontFamily:"inherit", fontSize:15
            }}>{n.label}</button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ═══ HOME ═══
function HomePage({ setPage, setSelectedVehicle }) {
  return (
    <div>
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", padding:"110px 24px 60px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 50% at 50% 10%, rgba(201,168,76,0.13) 0%, transparent 70%)", pointerEvents:"none" }} />

        <div style={{ marginBottom:32 }}>
          <img src={LOGO} alt="Reflex'Auto 2A" style={{ width:160, height:160, objectFit:"contain" }} />
        </div>

        <div style={{ fontSize:13, letterSpacing:5, color:C.gold, textTransform:"uppercase", marginBottom:16, fontWeight:600 }}>Porto-Vecchio · Corse du Sud</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(40px,8vw,80px)", fontWeight:700, color:C.text, margin:"0 0 20px", lineHeight:1.05 }}>
          L'automobile<br /><span style={{ color:C.gold }}>autrement.</span>
        </h1>
        <p style={{ fontSize:"clamp(15px,2vw,18px)", color:C.muted, maxWidth:520, margin:"0 0 44px", lineHeight:1.8 }}>
          Rachat cash immédiat, dépôt-vente premium à 490€, vente de véhicules sélectionnés et location estivale à Porto-Vecchio.
        </p>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
          <button onClick={() => setPage("rachat")} style={{ background:C.gold, color:C.bg, border:"none", borderRadius:12, padding:"16px 32px", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
            Estimer mon véhicule →
          </button>
          <button onClick={() => setPage("stock")} style={{ background:"transparent", color:C.text, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 32px", fontWeight:600, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
            Voir nos annonces
          </button>
        </div>
      </div>

      {/* VÉHICULES À LA UNE */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px 80px" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:12, letterSpacing:4, color:C.gold, textTransform:"uppercase", marginBottom:12 }}>Disponibles maintenant</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(28px,4vw,44px)", color:C.text, margin:0 }}>Véhicules à la Une</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))", gap:24 }}>
          {STOCK.slice(0,2).map(v => (
            <div key={v.id} onClick={() => { setSelectedVehicle(v); setPage("vehicule"); }}
              style={{ background:C.card, borderRadius:18, overflow:"hidden", border:`1px solid ${C.border}`, cursor:"pointer", transition:"all .3s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold+"80";e.currentTarget.style.transform="translateY(-4px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
              <div style={{ background:C.surface, height:240, overflow:"hidden", position:"relative" }}>
                <img src={v.photos[0]} alt={v.modele} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                {v.badge && <div style={{ position:"absolute", top:14, left:14 }}><Tag>{v.badge}</Tag></div>}
              </div>
              <div style={{ padding:24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:18, color:C.text }}>{v.marque}</div>
                    <div style={{ color:C.muted, fontSize:14 }}>{v.modele}</div>
                  </div>
                  <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, fontWeight:700, color:C.gold }}>{v.prix.toLocaleString("fr-FR")} €</div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, fontSize:12, color:C.muted, marginTop:12 }}>
                  <span>📅 {v.annee}</span>
                  <span>·</span>
                  <span>🛣 {v.km.toLocaleString("fr-FR")} km</span>
                  <span>·</span>
                  <span>⛽ {v.carb}</span>
                  <span>·</span>
                  <span>💪 {v.ch} ch</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div style={{ background:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"64px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontSize:12, letterSpacing:4, color:C.gold, textTransform:"uppercase", marginBottom:12 }}>Ce que nous proposons</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(28px,4vw,44px)", color:C.text, margin:0 }}>Nos Services</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px,1fr))", gap:20 }}>
            {[
              { icon:"💰", titre:"Rachat Cash", desc:"Nous rachetons votre véhicule immédiatement, en dessous de la cote, sans contrôle technique ni démarches.", cta:"Faire estimer", page:"rachat" },
              { icon:"🏅", titre:"Dépôt-Vente 490€", desc:"Nettoyage, annonce pro, gestion des appels et visites, papiers de cession inclus. Tranquillité totale.", cta:"En savoir plus", page:"rachat" },
              { icon:"🚗", titre:"Vente", desc:"Sélection de véhicules d'occasion contrôlés. Des modèles premium à des prix justes à Porto-Vecchio.", cta:"Voir le stock", page:"stock" },
              { icon:"🌴", titre:"Location Estivale", desc:"Profitez de la Corse au volant d'un véhicule de qualité. Location à la journée ou à la semaine.", cta:"Réserver", page:"location" },
              { icon:"📄", titre:"Carte Grise 49€", desc:"Service en ligne, partout en France. Habilités SIV, nous traitons toutes vos démarches d'immatriculation.", cta:"Démarrer ma demande", page:"cartegrise" },
            ].map((s,i) => (
              <div key={i} style={{ background:C.card, borderRadius:18, padding:28, border:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ fontSize:36 }}>{s.icon}</div>
                <h3 style={{ color:C.text, fontWeight:800, margin:0, fontSize:18, fontFamily:"'Cormorant Garamond', serif", letterSpacing:0.5 }}>{s.titre}</h3>
                <p style={{ color:C.muted, fontSize:14, lineHeight:1.8, margin:0, flex:1 }}>{s.desc}</p>
                <button onClick={() => setPage(s.page)} style={{ background:"transparent", color:C.gold, border:`1px solid ${C.gold}55`, borderRadius:8, padding:"9px 16px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit", textAlign:"left" }}>
                  {s.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"80px auto", padding:"0 24px", textAlign:"center" }}>
        <div style={{ fontSize:12, letterSpacing:4, color:C.gold, textTransform:"uppercase", marginBottom:12 }}>Pourquoi Reflex'Auto 2A</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(26px,4vw,40px)", color:C.text, margin:"0 0 48px" }}>La transparence avant tout</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:32 }}>
          {[
            ["📍", "Porto-Vecchio", "Quartier Poretta, 20137"],
            ["⚡", "Réponse rapide", "Retour par email sous 24h"],
            ["🔒", "Zéro surprise", "Prix fixe pour le dépôt-vente"],
            ["🤝", "Gestion complète", "De l'annonce aux papiers"],
          ].map(([ic,t,s],i) => (
            <div key={i}>
              <div style={{ fontSize:36, marginBottom:12 }}>{ic}</div>
              <div style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:15 }}>{t}</div>
              <div style={{ color:C.muted, fontSize:13 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ FICHE VÉHICULE ═══
function VehiculePage({ vehicle, setPage }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ nom:"", email:"", message:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  if (!vehicle) {
    setPage("stock");
    return null;
  }

  const handleSubmit = async () => {
    setSending(true);
    setError(null);
    const success = await sendToFormspree(
      `Demande d'info — ${vehicle.marque} ${vehicle.modele}`,
      {
        ...form,
        "Véhicule": `${vehicle.marque} ${vehicle.modele}`,
        "Prix": `${vehicle.prix} €`,
        "Année": vehicle.annee,
        "Kilométrage": `${vehicle.km} km`,
      }
    );
    setSending(false);
    if (success) {
      setContactSent(true);
    } else {
      setError("Erreur d'envoi. Contactez-nous à Reflexauto2a@gmail.com");
    }
  };

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"100px 24px 60px" }}>
      <button onClick={() => setPage("stock")} style={{ background:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:"inherit", fontSize:13, marginBottom:24 }}>
        ← Retour au stock
      </button>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"start" }} className="vehicule-grid">

        <div>
          <div style={{ background:C.surface, borderRadius:18, overflow:"hidden", aspectRatio:"4/3", marginBottom:12, border:`1px solid ${C.border}` }}>
            <img src={vehicle.photos[photoIdx]} alt={vehicle.modele} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${vehicle.photos.length}, 1fr)`, gap:8 }}>
            {vehicle.photos.map((p,i) => (
              <div key={i} onClick={() => setPhotoIdx(i)} style={{
                aspectRatio:"4/3", borderRadius:8, overflow:"hidden", cursor:"pointer",
                border:`2px solid ${photoIdx===i ? C.gold : "transparent"}`,
                opacity: photoIdx===i ? 1 : 0.6, transition:"all .2s"
              }}>
                <img src={p} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            ))}
          </div>
        </div>

        <div>
          {vehicle.badge && <Tag>{vehicle.badge}</Tag>}
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(28px,4vw,42px)", color:C.text, margin:"12px 0 4px", lineHeight:1.1 }}>{vehicle.marque}</h1>
          <div style={{ color:C.muted, fontSize:18, marginBottom:20 }}>{vehicle.modele}</div>

          <div style={{ background:`linear-gradient(135deg, ${C.gold}15, ${C.gold}05)`, border:`1px solid ${C.gold}40`, borderRadius:14, padding:"20px 24px", marginBottom:24 }}>
            <div style={{ fontSize:13, color:C.muted, marginBottom:4 }}>Prix de vente</div>
            <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:42, fontWeight:700, color:C.gold }}>{vehicle.prix.toLocaleString("fr-FR")} €</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>TTC</div>
          </div>

          <h3 style={{ color:C.text, fontFamily:"'Cormorant Garamond', serif", fontSize:20, margin:"0 0 14px" }}>Caractéristiques</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
            {[
              ["📅","1ère mise en circulation", vehicle.mec],
              ["🛣","Kilométrage", `${vehicle.km.toLocaleString("fr-FR")} km`],
              ["⛽","Carburant", vehicle.carb],
              ["⚙️","Boîte", vehicle.boite],
              ["💪","Puissance", `${vehicle.ch} ch`],
              ["🎨","Couleur", vehicle.couleur],
              ["🚪","Portes", vehicle.portes],
              ["🚗","Type", vehicle.type],
            ].map(([ic,k,v],i) => (
              <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px" }}>
                <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 }}>{ic} {k}</div>
                <div style={{ color:C.text, fontWeight:700, fontSize:14 }}>{v}</div>
              </div>
            ))}
          </div>

          <h3 style={{ color:C.text, fontFamily:"'Cormorant Garamond', serif", fontSize:20, margin:"0 0 12px" }}>Description</h3>
          <p style={{ color:C.muted, lineHeight:1.8, fontSize:14, marginBottom:20 }}>{vehicle.description}</p>

          {vehicle.points?.length>0 && (
            <>
              <h3 style={{ color:C.text, fontFamily:"'Cormorant Garamond', serif", fontSize:20, margin:"0 0 12px" }}>Points forts</h3>
              <div style={{ marginBottom:24, display:"flex", flexDirection:"column", gap:8 }}>
                {vehicle.points.map((p,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, color:C.text, fontSize:14 }}>
                    <span style={{ color:C.green, fontSize:18 }}>✓</span>{p}
                  </div>
                ))}
              </div>
            </>
          )}

          <button onClick={() => setShowContact(true)} style={{ width:"100%", background:C.gold, color:C.bg, border:"none", borderRadius:12, padding:"16px", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
            ✉️ Je suis intéressé(e)
          </button>
        </div>
      </div>

      {showContact && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={() => { setShowContact(false); setContactSent(false); }}>
          <div style={{ background:C.card, borderRadius:20, padding:32, maxWidth:440, width:"100%", border:`1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            {!contactSent ? (
              <>
                <h3 style={{ color:C.text, margin:"0 0 6px", fontFamily:"'Cormorant Garamond', serif", fontSize:22 }}>Demande d'information</h3>
                <p style={{ color:C.muted, fontSize:13, margin:"0 0 20px" }}>{vehicle.marque} {vehicle.modele} · {vehicle.prix.toLocaleString("fr-FR")} €</p>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <input value={form.nom} onChange={e=>set("nom",e.target.value)} placeholder="Votre nom *" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:12, color:C.text, fontFamily:"inherit" }} />
                  <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="Votre email *" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:12, color:C.text, fontFamily:"inherit" }} />
                  <textarea value={form.message} onChange={e=>set("message",e.target.value)} placeholder="Votre message..." rows={4} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:12, color:C.text, fontFamily:"inherit", resize:"none" }} />
                  <button disabled={sending} onClick={() => { if(form.nom && form.email && !sending) handleSubmit(); }} style={{ background: sending ? C.border : C.gold, color:C.bg, border:"none", borderRadius:10, padding:14, fontWeight:800, cursor:sending ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
                    {sending ? "Envoi en cours..." : "Envoyer ma demande"}
                  </button>
                  {error && (
                    <div style={{ background:"#7F1D1D33", border:`1px solid #F8717180`, borderRadius:8, padding:10, color:"#FCA5A5", fontSize:12 }}>
                      ⚠️ {error}
                    </div>
                  )}
                  <button onClick={() => setShowContact(false)} style={{ background:"transparent", color:C.muted, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>Annuler</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"12px 0" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                <h3 style={{ color:C.green, margin:"0 0 10px", fontFamily:"'Cormorant Garamond', serif" }}>Demande envoyée !</h3>
                <p style={{ color:C.muted, fontSize:14, lineHeight:1.7 }}>Nous vous répondrons à<br /><strong style={{color:C.text}}>{form.email}</strong> très rapidement.</p>
                <button onClick={() => { setShowContact(false); setContactSent(false); setForm({nom:"",email:"",message:""}); }} style={{ marginTop:16, background:C.gold, color:C.bg, border:"none", borderRadius:8, padding:"10px 24px", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>Fermer</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ STOCK ═══
function StockPage({ setSelectedVehicle, setPage }) {
  const [filtre, setFiltre] = useState({ marque:"", carb:"", budget:50000 });
  const vehicules = STOCK.filter(v => v.cat==="vente" &&
    (!filtre.marque || v.marque===filtre.marque) &&
    (!filtre.carb || v.carb===filtre.carb) &&
    v.prix <= filtre.budget
  );
  const totalVentes = STOCK.filter(v=>v.cat==="vente").length;

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"100px 24px 60px" }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ fontSize:12, letterSpacing:4, color:C.gold, textTransform:"uppercase", marginBottom:12 }}>{totalVentes} véhicule{totalVentes>1?"s":""} disponible{totalVentes>1?"s":""}</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(32px,5vw,52px)", color:C.text, margin:"0 0 10px" }}>Nos Véhicules à Vendre</h1>
        <p style={{ color:C.muted }}>Sélectionnés et contrôlés — Porto-Vecchio, Corse</p>
      </div>

      <div style={{ background:C.card, borderRadius:14, padding:"18px 24px", border:`1px solid ${C.border}`, marginBottom:32, display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
        <select value={filtre.marque} onChange={e=>setFiltre(f=>({...f,marque:e.target.value}))} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", color:C.text, fontFamily:"inherit", fontSize:14 }}>
          <option value="">Toutes marques</option>
          {[...new Set(STOCK.filter(v=>v.cat==="vente").map(v=>v.marque))].map(m=><option key={m}>{m}</option>)}
        </select>
        <select value={filtre.carb} onChange={e=>setFiltre(f=>({...f,carb:e.target.value}))} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", color:C.text, fontFamily:"inherit", fontSize:14 }}>
          <option value="">Tous carburants</option>
          {CARBURANTS.map(c=><option key={c}>{c}</option>)}
        </select>
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:200 }}>
          <span style={{ color:C.muted, fontSize:13, whiteSpace:"nowrap" }}>Budget :</span>
          <input type="range" min={5000} max={50000} step={500} value={filtre.budget} onChange={e=>setFiltre(f=>({...f,budget:+e.target.value}))} style={{ flex:1 }} />
          <span style={{ color:C.gold, fontWeight:700, whiteSpace:"nowrap", minWidth:80 }}>{filtre.budget.toLocaleString("fr-FR")} €</span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))", gap:20 }}>
        {vehicules.map(v => (
          <div key={v.id} onClick={()=>{ setSelectedVehicle(v); setPage("vehicule"); }}
            style={{ background:C.card, borderRadius:16, overflow:"hidden", border:`1px solid ${C.border}`, transition:"all .3s", cursor:"pointer" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold+"80";e.currentTarget.style.transform="translateY(-4px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
            <div style={{ background:C.surface, height:200, overflow:"hidden", position:"relative" }}>
              <img src={v.photos[0]} alt={v.modele} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              {v.badge && <div style={{ position:"absolute", top:12, left:12 }}><Tag>{v.badge}</Tag></div>}
              <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(13,13,13,0.85)", color:C.gold, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
                📷 {v.photos.length}
              </div>
            </div>
            <div style={{ padding:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:17, color:C.text }}>{v.marque}</div>
                  <div style={{ color:C.muted, fontSize:14 }}>{v.modele}</div>
                </div>
                <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:C.gold }}>{v.prix.toLocaleString("fr-FR")} €</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
                {[["📅",v.annee],["🛣",`${v.km.toLocaleString("fr-FR")} km`],["⛽",v.carb],["⚙️",v.boite],["💪",`${v.ch} ch`],["🎨",v.couleur]].map(([ic,val],i)=>(
                  <div key={i} style={{ background:C.surface, borderRadius:8, padding:"6px 10px", display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.muted }}>
                    <span>{ic}</span><span style={{color:C.text}}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ width:"100%", background:C.gold, color:C.bg, borderRadius:10, padding:"11px", fontWeight:800, fontSize:13, fontFamily:"inherit", textAlign:"center" }}>
                Voir le détail →
              </div>
            </div>
          </div>
        ))}
      </div>

      {vehicules.length===0 && (
        <div style={{ textAlign:"center", padding:60, color:C.muted }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
          <p>Aucun véhicule ne correspond à vos critères.</p>
        </div>
      )}
    </div>
  );
}

// ═══ RACHAT ═══
function RachatPage() {
  const [service, setService] = useState("rachat");
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [imgs, setImgs] = useState([]); // tableau de vrais fichiers File
  const [form, setForm] = useState({
    nom:"", email:"", marque:"", modele:"", annee:"", km:"",
    carburant:"", boite:"", puissance:"", couleur:"",
    etat:"", rayures:"", observations:""
  });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const inp = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px", color:C.text, fontSize:15, fontFamily:"inherit", boxSizing:"border-box", outline:"none" };
  const lbl = { display:"block", color:C.muted, fontSize:12, marginBottom:6, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" };

  const canNext = form.marque && form.annee && form.km && form.etat;
  const canSend = form.nom && form.email;

  const handleImgsAdd = (newFiles) => {
    setImgs(prev => [...prev, ...Array.from(newFiles)]);
  };
  const removeImg = (idx) => setImgs(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setSending(true);
    setError(null);
    const success = await sendToFormspree(
      service === "rachat" ? "Rachat Cash" : "Dépôt-Vente 490€",
      {
        ...form,
        "Nombre de photos": imgs.length,
      },
      imgs
    );
    setSending(false);
    if (success) {
      setSent(true);
    } else {
      setError("Une erreur est survenue. Merci de nous contacter directement à Reflexauto2a@gmail.com");
    }
  };

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"100px 24px 60px" }}>
      <div style={{ textAlign:"center", marginBottom:52 }}>
        <div style={{ fontSize:12, letterSpacing:4, color:C.gold, textTransform:"uppercase", marginBottom:12 }}>Rachat & Dépôt-Vente</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(32px,5vw,56px)", color:C.text, margin:"0 0 12px" }}>Vendez votre véhicule</h1>
        <p style={{ color:C.muted, maxWidth:520, margin:"0 auto", lineHeight:1.8 }}>Choisissez la formule qui vous convient. Nous vous répondons par email avec notre meilleure proposition.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, maxWidth:780, margin:"0 auto 48px" }} className="services-grid">
        {[
          { id:"rachat", icon:"💰", titre:"Rachat Cash Immédiat", points:["Argent versé rapidement","Sans contrôle technique","Sans démarches administratives","Offre sous 24h par email"], prix:"Offre personnalisée", color:C.gold },
          { id:"depot", icon:"🏅", titre:"Dépôt-Vente Premium", points:["Nettoyage du véhicule","Annonce professionnelle","Gestion des appels & visites","Papiers de cession inclus"], prix:"490 € tout inclus", color:"#4ADE80" },
        ].map(s => (
          <div key={s.id} onClick={() => setService(s.id)} style={{
            border:`2px solid ${service===s.id ? s.color : C.border}`,
            borderRadius:18, padding:28, cursor:"pointer",
            background: service===s.id ? s.color+"12" : C.card,
            transition:"all .25s"
          }}>
            <div style={{ fontSize:40, marginBottom:12 }}>{s.icon}</div>
            <h3 style={{ color:C.text, fontWeight:800, margin:"0 0 16px", fontSize:17 }}>{s.titre}</h3>
            <ul style={{ padding:"0 0 0 18px", margin:"0 0 20px", color:C.muted, fontSize:14, lineHeight:2 }}>
              {s.points.map((p,i) => <li key={i}>{p}</li>)}
            </ul>
            <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:s.color }}>{s.prix}</div>
          </div>
        ))}
      </div>

      {!sent ? (
        <div style={{ background:C.card, borderRadius:20, padding:"36px 32px", border:`1px solid ${C.border}`, maxWidth:780, margin:"0 auto" }}>
          <h2 style={{ color:C.text, margin:"0 0 8px", fontSize:22, fontFamily:"'Cormorant Garamond', serif" }}>
            {service==="rachat" ? "💰 Formulaire de rachat" : "🏅 Formulaire dépôt-vente"}
          </h2>
          <p style={{ color:C.muted, margin:"0 0 28px", fontSize:14 }}>Remplissez ce formulaire, nous vous répondons par email sous 24h.</p>

          {step===1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div><label style={lbl}>Marque *</label>
                  <select value={form.marque} onChange={e=>set("marque",e.target.value)} style={inp}>
                    <option value="">Sélectionner</option>
                    {MARQUES.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Modèle</label>
                  <input value={form.modele} onChange={e=>set("modele",e.target.value)} placeholder="Ex: Clio, Golf..." style={inp} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
                <div><label style={lbl}>Année *</label>
                  <select value={form.annee} onChange={e=>set("annee",e.target.value)} style={inp}>
                    <option value="">Année</option>
                    {Array.from({length:25},(_,i)=>2025-i).map(y=><option key={y}>{y}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Kilométrage *</label>
                  <input type="number" value={form.km} onChange={e=>set("km",e.target.value)} placeholder="Ex: 85000" style={inp} />
                </div>
                <div><label style={lbl}>Puissance (ch)</label>
                  <input type="number" value={form.puissance} onChange={e=>set("puissance",e.target.value)} placeholder="Ex: 130" style={inp} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
                <div><label style={lbl}>Carburant</label>
                  <select value={form.carburant} onChange={e=>set("carburant",e.target.value)} style={inp}>
                    <option value="">Type</option>
                    {CARBURANTS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Boîte</label>
                  <select value={form.boite} onChange={e=>set("boite",e.target.value)} style={inp}>
                    <option value="">Boîte</option>
                    {BOITES.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Couleur</label>
                  <input value={form.couleur} onChange={e=>set("couleur",e.target.value)} placeholder="Ex: Noir, Blanc..." style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>État général *</label>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {ETATS.map(e=>(
                    <div key={e} onClick={()=>set("etat",e)} style={{
                      border:`2px solid ${form.etat===e ? C.gold : C.border}`,
                      borderRadius:10, padding:"12px 16px", cursor:"pointer",
                      background: form.etat===e ? C.gold+"15" : "transparent",
                      color: form.etat===e ? C.text : C.muted,
                      fontWeight: form.etat===e ? 700 : 400,
                      fontSize:14, transition:"all .2s"
                    }}>{e}</div>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Rayures, bosses, dommages</label>
                <textarea value={form.rayures} onChange={e=>set("rayures",e.target.value)}
                  placeholder="Décrivez précisément les dommages visibles..."
                  rows={3} style={{...inp, resize:"vertical"}} />
              </div>

              <div>
                <label style={lbl}>Observations & informations complémentaires</label>
                <textarea value={form.observations} onChange={e=>set("observations",e.target.value)}
                  placeholder="Entretien à jour, carnet de révisions, 2 clés, contrôle technique..."
                  rows={3} style={{...inp, resize:"vertical"}} />
              </div>

              <div>
                <label style={lbl}>Photos du véhicule (optionnel)</label>
                <div style={{ border:`2px dashed ${C.border}`, borderRadius:12, padding:24, textAlign:"center", color:C.muted, fontSize:14, cursor:"pointer" }}
                  onClick={() => document.getElementById("photo-input").click()}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📸</div>
                  <div>Cliquez pour ajouter des photos</div>
                  <div style={{ fontSize:12, marginTop:4 }}>JPG, PNG — extérieur, intérieur, compteur (plusieurs à la fois)</div>
                  <input id="photo-input" type="file" multiple accept="image/*" style={{ display:"none" }}
                    onChange={e => { handleImgsAdd(e.target.files); e.target.value = ""; }} />
                </div>
                {imgs.length>0 && (
                  <div style={{ marginTop:8, background:C.surface, borderRadius:10, padding:12 }}>
                    <div style={{ color:C.green, fontWeight:700, fontSize:13, marginBottom:8, display:"flex", justifyContent:"space-between" }}>
                      <span>✅ {imgs.length} photo{imgs.length>1?"s":""}</span>
                      <button onClick={() => setImgs([])} style={{ background:"transparent", color:C.red, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Tout retirer</button>
                    </div>
                    {imgs.map((f, i) => (
                      <div key={i} style={{ color:C.muted, fontSize:12, padding:"4px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span>📷 {f.name}</span>
                        <button onClick={() => removeImg(i)} style={{ background:"transparent", color:C.red, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button disabled={!canNext} onClick={()=>setStep(2)} style={{
                background: canNext ? C.gold : C.border, color: C.bg, border:"none",
                borderRadius:12, padding:16, fontWeight:800, fontSize:15,
                cursor: canNext ? "pointer" : "not-allowed", fontFamily:"inherit"
              }}>Continuer → Mes coordonnées</button>
            </div>
          )}

          {step===2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ background:C.surface, borderRadius:12, padding:16, border:`1px solid ${C.border}`, marginBottom:4 }}>
                <div style={{ fontSize:13, color:C.muted, marginBottom:8, fontWeight:700 }}>📋 Récapitulatif véhicule</div>
                <div style={{ color:C.text, fontSize:14 }}>{form.marque} {form.modele} · {form.annee} · {parseInt(form.km||0).toLocaleString("fr-FR")} km · {form.etat?.split("—")[0]}</div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div><label style={lbl}>Nom & Prénom *</label>
                  <input value={form.nom} onChange={e=>set("nom",e.target.value)} placeholder="Jean Dupont" style={inp} />
                </div>
                <div><label style={lbl}>Email *</label>
                  <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="votre@email.com" style={inp} />
                </div>
              </div>

              <div style={{ background:`${C.gold}15`, border:`1px solid ${C.gold}40`, borderRadius:12, padding:16 }}>
                <div style={{ color:C.gold, fontWeight:700, marginBottom:6, fontSize:14 }}>
                  {service==="rachat" ? "💰 Rachat Cash" : "🏅 Dépôt-Vente 490€"}
                </div>
                <div style={{ color:C.muted, fontSize:13, lineHeight:1.8 }}>
                  {service==="rachat"
                    ? "Nous étudierons votre dossier et vous enverrons une offre de rachat cash sous 24h à l'adresse email indiquée."
                    : "Notre équipe vous contactera par email pour organiser la prise en charge de votre véhicule. Forfait tout inclus : 490€."}
                </div>
              </div>

              <div style={{ display:"flex", gap:12 }}>
                <button onClick={()=>setStep(1)} style={{ flex:1, background:"transparent", color:C.text, border:`1px solid ${C.border}`, borderRadius:12, padding:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>← Retour</button>
                <button disabled={!canSend || sending} onClick={handleSubmit} style={{
                  flex:2, background: (canSend && !sending) ? C.gold : C.border, color:C.bg, border:"none",
                  borderRadius:12, padding:14, fontWeight:800, cursor: (canSend && !sending) ? "pointer" : "not-allowed", fontFamily:"inherit"
                }}>{sending ? "Envoi en cours..." : "✉️ Envoyer ma demande"}</button>
              </div>
              {error && (
                <div style={{ background:"#7F1D1D33", border:`1px solid #F8717180`, borderRadius:10, padding:14, color:"#FCA5A5", fontSize:13, marginTop:8 }}>
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background:C.card, borderRadius:20, padding:48, border:`1px solid ${C.gold}40`, maxWidth:600, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
          <h2 style={{ color:C.green, fontSize:26, margin:"0 0 12px", fontFamily:"'Cormorant Garamond', serif" }}>Demande envoyée !</h2>
          <p style={{ color:C.muted, lineHeight:1.9, margin:"0 0 24px" }}>
            Merci <strong style={{color:C.text}}>{form.nom}</strong> !<br />
            Nous avons bien reçu votre demande concernant votre <strong style={{color:C.text}}>{form.marque} {form.modele}</strong>.<br />
            Nous vous répondrons à <strong style={{color:C.gold}}>{form.email}</strong> dans les meilleurs délais.
          </p>
          <button onClick={()=>{setSent(false);setStep(1);setForm({nom:"",email:"",marque:"",modele:"",annee:"",km:"",carburant:"",boite:"",puissance:"",couleur:"",etat:"",rayures:"",observations:""});setImgs([]);}} style={{ background:"transparent", color:C.gold, border:`1px solid ${C.gold}`, borderRadius:10, padding:"10px 24px", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
            Nouvelle demande
          </button>
        </div>
      )}
    </div>
  );
}

// ═══ LOCATION ═══
function LocationPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ nom:"", email:"", debut:"", fin:"", vehicule:"", message:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px", color:C.text, fontSize:15, fontFamily:"inherit", boxSizing:"border-box", outline:"none" };
  const lbl = { display:"block", color:C.muted, fontSize:12, marginBottom:6, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" };
  const canSend = form.nom && form.email;

  const handleSubmit = async () => {
    setSending(true);
    setError(null);
    const success = await sendToFormspree("Demande de Location", form);
    setSending(false);
    if (success) {
      setSent(true);
    } else {
      setError("Une erreur est survenue. Merci de nous contacter directement à Reflexauto2a@gmail.com");
    }
  };

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"100px 24px 60px" }}>
      <div style={{ textAlign:"center", marginBottom:52 }}>
        <div style={{ fontSize:12, letterSpacing:4, color:C.gold, textTransform:"uppercase", marginBottom:12 }}>Saison Estivale · Porto-Vecchio</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(32px,5vw,52px)", color:C.text, margin:"0 0 12px" }}>Location de Véhicules</h1>
        <p style={{ color:C.muted, maxWidth:520, margin:"0 auto", lineHeight:1.8 }}>Profitez de la Corse du Sud au volant d'un véhicule de qualité. Location à la journée ou à la semaine.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:48 }}>
        {[["🌴","Corse du Sud","Porto-Vecchio & environs"],["📅","Location courte","À la journée ou semaine"],["✅","Véhicules récents","Entretenus et assurés"],["✉️","Réservation","Par email uniquement"]].map(([ic,t,s],i)=>(
          <div key={i} style={{ background:C.card, borderRadius:14, padding:20, border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ fontSize:30, marginBottom:10 }}>{ic}</div>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4, fontSize:14 }}>{t}</div>
            <div style={{ color:C.muted, fontSize:12 }}>{s}</div>
          </div>
        ))}
      </div>

      {!sent ? (
        <div style={{ background:C.card, borderRadius:20, padding:32, border:`1px solid ${C.border}` }}>
          <h2 style={{ color:C.text, margin:"0 0 8px", fontSize:22, fontFamily:"'Cormorant Garamond', serif" }}>Demande de location</h2>
          <p style={{ color:C.muted, margin:"0 0 24px", fontSize:14 }}>Précisez vos besoins, nous vous proposerons un véhicule adapté à votre demande et vos dates par email.</p>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div><label style={lbl}>Nom & Prénom *</label>
                <input value={form.nom} onChange={e=>set("nom",e.target.value)} style={inp} />
              </div>
              <div><label style={lbl}>Email *</label>
                <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} style={inp} />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div><label style={lbl}>Date de début</label>
                <input type="date" value={form.debut} onChange={e=>set("debut",e.target.value)} style={inp} />
              </div>
              <div><label style={lbl}>Date de fin</label>
                <input type="date" value={form.fin} onChange={e=>set("fin",e.target.value)} style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Type de véhicule souhaité</label>
              <select value={form.vehicule} onChange={e=>set("vehicule",e.target.value)} style={inp}>
                <option value="">Indifférent</option>
                <option>Citadine (économique)</option>
                <option>Compacte / Berline</option>
                <option>SUV / Crossover</option>
                <option>Familiale 7 places</option>
                <option>Cabriolet</option>
                <option>Premium</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Précisions complémentaires</label>
              <textarea value={form.message} onChange={e=>set("message",e.target.value)}
                placeholder="Nombre de conducteurs, âge du conducteur principal, options souhaitées (GPS, siège bébé...)"
                rows={4} style={{...inp, resize:"vertical"}} />
            </div>
            <button disabled={!canSend || sending} onClick={handleSubmit} style={{
              background: (canSend && !sending) ? C.gold : C.border, color:C.bg, border:"none",
              borderRadius:12, padding:16, fontWeight:800, fontSize:15,
              cursor: (canSend && !sending) ? "pointer" : "not-allowed", fontFamily:"inherit"
            }}>{sending ? "Envoi en cours..." : "✉️ Envoyer ma demande de location"}</button>
            {error && (
              <div style={{ background:"#7F1D1D33", border:`1px solid #F8717180`, borderRadius:10, padding:14, color:"#FCA5A5", fontSize:13 }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background:C.card, borderRadius:20, padding:48, border:`1px solid ${C.gold}40`, textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🌴</div>
          <h2 style={{ color:C.green, fontSize:26, margin:"0 0 12px", fontFamily:"'Cormorant Garamond', serif" }}>Demande envoyée !</h2>
          <p style={{ color:C.muted, lineHeight:1.9 }}>
            Merci <strong style={{color:C.text}}>{form.nom}</strong> !<br />
            Nous reviendrons vers vous à <strong style={{color:C.gold}}>{form.email}</strong><br />avec une proposition adaptée à vos dates.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══ CARTE GRISE ═══
const DEMARCHES = [
  {
    id:"titulaire",
    icon:"🔄",
    titre:"Changement de titulaire",
    desc:"Achat d'un véhicule d'occasion",
    docs:[
      "Carte grise barrée et signée par l'ancien propriétaire (mention « vendu le … » + date + heure + signature)",
      "Certificat de cession (formulaire Cerfa 15776)",
      "Justificatif de domicile de moins de 6 mois",
      "Pièce d'identité recto/verso",
      "Permis de conduire",
      "Certificat de situation administrative (non-gage) de moins de 15 jours",
      "Contrôle technique de moins de 6 mois (si véhicule > 4 ans)"
    ]
  },
  {
    id:"duplicata",
    icon:"🔁",
    titre:"Duplicata (perte/vol)",
    desc:"Carte grise perdue, volée ou détériorée",
    docs:[
      "Déclaration de perte (formulaire Cerfa 13753) ou de vol (récépissé de la police/gendarmerie)",
      "Justificatif de domicile de moins de 6 mois",
      "Pièce d'identité recto/verso",
      "Permis de conduire",
      "Contrôle technique en cours de validité (si véhicule > 4 ans)"
    ]
  },
  {
    id:"adresse",
    icon:"📍",
    titre:"Changement d'adresse",
    desc:"Déménagement",
    docs:[
      "Carte grise actuelle",
      "Nouveau justificatif de domicile de moins de 6 mois",
      "Pièce d'identité recto/verso"
    ]
  },
  {
    id:"premiere",
    icon:"✨",
    titre:"Première immatriculation",
    desc:"Véhicule neuf",
    docs:[
      "Certificat de conformité européen (COC) délivré par le constructeur",
      "Facture d'achat du véhicule",
      "Justificatif de domicile de moins de 6 mois",
      "Pièce d'identité recto/verso",
      "Permis de conduire",
      "Quitus fiscal (si véhicule acheté dans l'UE)"
    ]
  },
  {
    id:"importe",
    icon:"🌍",
    titre:"Véhicule importé",
    desc:"Véhicule acheté à l'étranger",
    docs:[
      "Carte grise étrangère originale",
      "Facture d'achat",
      "Quitus fiscal (délivré par le centre des impôts)",
      "Certificat de conformité européen (ou réception à titre isolé)",
      "Contrôle technique français de moins de 6 mois",
      "Justificatif de domicile de moins de 6 mois",
      "Pièce d'identité recto/verso",
      "Permis de conduire"
    ]
  }
];

function CarteGrisePage() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]); // tableau de vrais fichiers File
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ nom:"", email:"", tel:"", adresse:"", immat:"", marque:"", modele:"", message:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px", color:C.text, fontSize:15, fontFamily:"inherit", boxSizing:"border-box", outline:"none" };
  const lbl = { display:"block", color:C.muted, fontSize:12, marginBottom:6, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" };
  const canSend = form.nom && form.email && form.tel;

  const demarche = DEMARCHES.find(d => d.id===selected);

  const handleFilesAdd = (newFiles) => {
    // Ajoute aux fichiers existants au lieu de remplacer
    const filesArray = Array.from(newFiles);
    setFiles(prev => [...prev, ...filesArray]);
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setSending(true);
    setError(null);
    const success = await sendToFormspree(
      `Carte Grise — ${demarche?.titre || ""}`,
      {
        ...form,
        "Démarche": demarche?.titre,
        "Nombre de fichiers": files.length,
      },
      files
    );
    setSending(false);
    if (success) {
      setSent(true);
    } else {
      setError("Une erreur est survenue. Merci de nous contacter directement à Reflexauto2a@gmail.com");
    }
  };

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"100px 24px 60px" }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ fontSize:12, letterSpacing:4, color:C.gold, textTransform:"uppercase", marginBottom:12 }}>Service Habilité SIV · Partout en France</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(32px,5vw,52px)", color:C.text, margin:"0 0 12px" }}>Carte Grise en Ligne</h1>
        <p style={{ color:C.muted, maxWidth:580, margin:"0 auto", lineHeight:1.8 }}>Toutes vos démarches d'immatriculation, traitées par un professionnel habilité. <strong style={{color:C.gold}}>49 € de frais de service</strong> + taxes administratives officielles.</p>
      </div>

      {/* AVANTAGES */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:48 }}>
        {[
          ["✅","Habilités SIV","Agréés Ministère de l'Intérieur"],
          ["🇫🇷","Partout en France","Continent & îles"],
          ["💶","Tarif fixe 49€","Frais de service unique"],
          ["⚡","Traitement rapide","Suivi par email"],
        ].map(([ic,t,s],i)=>(
          <div key={i} style={{ background:C.card, borderRadius:14, padding:20, border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ fontSize:30, marginBottom:10 }}>{ic}</div>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4, fontSize:14 }}>{t}</div>
            <div style={{ color:C.muted, fontSize:12 }}>{s}</div>
          </div>
        ))}
      </div>

      {!sent ? (
        <>
          {/* ÉTAPE 1 - CHOIX DE LA DÉMARCHE */}
          {step===1 && (
            <div style={{ background:C.card, borderRadius:20, padding:32, border:`1px solid ${C.border}` }}>
              <h2 style={{ color:C.text, margin:"0 0 8px", fontSize:22, fontFamily:"'Cormorant Garamond', serif" }}>1. Choisissez votre démarche</h2>
              <p style={{ color:C.muted, margin:"0 0 24px", fontSize:14 }}>Sélectionnez le type d'immatriculation dont vous avez besoin.</p>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14, marginBottom:24 }}>
                {DEMARCHES.map(d => (
                  <div key={d.id} onClick={() => setSelected(d.id)} style={{
                    border:`2px solid ${selected===d.id ? C.gold : C.border}`,
                    borderRadius:14, padding:20, cursor:"pointer",
                    background: selected===d.id ? C.gold+"12" : C.surface,
                    transition:"all .25s"
                  }}>
                    <div style={{ fontSize:30, marginBottom:8 }}>{d.icon}</div>
                    <div style={{ fontWeight:700, color:C.text, marginBottom:4, fontSize:15 }}>{d.titre}</div>
                    <div style={{ color:C.muted, fontSize:12 }}>{d.desc}</div>
                  </div>
                ))}
              </div>

              <button disabled={!selected} onClick={()=>setStep(2)} style={{
                width:"100%",
                background: selected ? C.gold : C.border, color:C.bg, border:"none",
                borderRadius:12, padding:16, fontWeight:800, fontSize:15,
                cursor: selected ? "pointer" : "not-allowed", fontFamily:"inherit"
              }}>Continuer →</button>
            </div>
          )}

          {/* ÉTAPE 2 - DOCUMENTS REQUIS + UPLOAD */}
          {step===2 && demarche && (
            <div style={{ background:C.card, borderRadius:20, padding:32, border:`1px solid ${C.border}` }}>
              <h2 style={{ color:C.text, margin:"0 0 8px", fontSize:22, fontFamily:"'Cormorant Garamond', serif" }}>2. Documents requis — {demarche.titre}</h2>
              <p style={{ color:C.muted, margin:"0 0 24px", fontSize:14 }}>Voici la liste des documents à fournir. Préparez-les en photo ou PDF (recto-verso quand nécessaire).</p>

              <div style={{ background:C.surface, borderRadius:12, padding:20, border:`1px solid ${C.border}`, marginBottom:24 }}>
                {demarche.docs.map((d,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:12, color:C.text, fontSize:14, lineHeight:1.6 }}>
                    <span style={{ color:C.gold, fontWeight:800, minWidth:24 }}>{String(i+1).padStart(2,"0")}</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>

              <div>
                <label style={lbl}>📤 Uploadez vos documents *</label>
                <div style={{ border:`2px dashed ${C.gold}50`, borderRadius:12, padding:32, textAlign:"center", cursor:"pointer", background:C.surface, transition:"all .2s" }}
                  onClick={() => document.getElementById("cg-files").click()}>
                  <div style={{ fontSize:40, marginBottom:10 }}>📂</div>
                  <div style={{ color:C.text, fontWeight:700, marginBottom:4 }}>Cliquez pour ajouter des fichiers</div>
                  <div style={{ color:C.muted, fontSize:13 }}>Vous pouvez sélectionner plusieurs documents à la fois</div>
                  <div style={{ color:C.muted, fontSize:12, marginTop:4 }}>Photos JPG/PNG ou PDF — recto-verso si besoin</div>
                  <input id="cg-files" type="file" multiple accept="image/*,application/pdf" style={{ display:"none" }}
                    onChange={e => {
                      handleFilesAdd(e.target.files);
                      e.target.value = ""; // permet de réajouter le même fichier si besoin
                    }} />
                </div>
                {files.length>0 && (
                  <div style={{ marginTop:12, background:C.surface, borderRadius:10, padding:14 }}>
                    <div style={{ color:C.green, fontWeight:700, fontSize:13, marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span>✅ {files.length} fichier{files.length>1?"s":""} sélectionné{files.length>1?"s":""}</span>
                      <button onClick={() => setFiles([])} style={{ background:"transparent", color:C.red, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600 }}>
                        Tout retirer
                      </button>
                    </div>
                    {files.map((f, i) => (
                      <div key={i} style={{ color:C.muted, fontSize:13, padding:"6px 0", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
                        <span>📄 {f.name}</span>
                        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                          <span style={{color:C.text}}>{(f.size/1024).toFixed(0)} Ko</span>
                          <button onClick={() => removeFile(i)} style={{ background:"transparent", color:C.red, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:14 }} title="Retirer ce fichier">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                      <button onClick={() => document.getElementById("cg-files").click()} style={{ background:"transparent", color:C.gold, border:`1px dashed ${C.gold}`, borderRadius:8, padding:"8px 14px", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600, width:"100%" }}>
                        + Ajouter d'autres fichiers
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display:"flex", gap:12, marginTop:24 }}>
                <button onClick={()=>setStep(1)} style={{ flex:1, background:"transparent", color:C.text, border:`1px solid ${C.border}`, borderRadius:12, padding:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>← Retour</button>
                <button onClick={()=>setStep(3)} style={{ flex:2, background:C.gold, color:C.bg, border:"none", borderRadius:12, padding:14, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>Continuer →</button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 - INFOS PERSO */}
          {step===3 && demarche && (
            <div style={{ background:C.card, borderRadius:20, padding:32, border:`1px solid ${C.border}` }}>
              <h2 style={{ color:C.text, margin:"0 0 8px", fontSize:22, fontFamily:"'Cormorant Garamond', serif" }}>3. Vos informations</h2>
              <p style={{ color:C.muted, margin:"0 0 24px", fontSize:14 }}>Pour traiter votre dossier et vous tenir informé.</p>

              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div><label style={lbl}>Nom & Prénom *</label>
                    <input value={form.nom} onChange={e=>set("nom",e.target.value)} placeholder="Jean Dupont" style={inp} />
                  </div>
                  <div><label style={lbl}>Téléphone *</label>
                    <input value={form.tel} onChange={e=>set("tel",e.target.value)} placeholder="06 XX XX XX XX" style={inp} />
                  </div>
                </div>
                <div><label style={lbl}>Email *</label>
                  <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="votre@email.com" style={inp} />
                </div>
                <div><label style={lbl}>Adresse complète</label>
                  <input value={form.adresse} onChange={e=>set("adresse",e.target.value)} placeholder="N° Rue, Code postal, Ville" style={inp} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
                  <div><label style={lbl}>Immatriculation</label>
                    <input value={form.immat} onChange={e=>set("immat",e.target.value)} placeholder="AA-123-AA" style={inp} />
                  </div>
                  <div><label style={lbl}>Marque</label>
                    <input value={form.marque} onChange={e=>set("marque",e.target.value)} placeholder="Peugeot..." style={inp} />
                  </div>
                  <div><label style={lbl}>Modèle</label>
                    <input value={form.modele} onChange={e=>set("modele",e.target.value)} placeholder="208..." style={inp} />
                  </div>
                </div>
                <div><label style={lbl}>Précisions complémentaires</label>
                  <textarea value={form.message} onChange={e=>set("message",e.target.value)} rows={3} placeholder="Toute info utile pour traiter votre dossier..." style={{...inp, resize:"vertical"}} />
                </div>

                <div style={{ background:`${C.gold}15`, border:`1px solid ${C.gold}40`, borderRadius:12, padding:16 }}>
                  <div style={{ color:C.gold, fontWeight:700, marginBottom:8, fontSize:14 }}>📋 Récapitulatif</div>
                  <div style={{ color:C.muted, fontSize:13, lineHeight:1.8 }}>
                    Démarche : <strong style={{color:C.text}}>{demarche.titre}</strong><br/>
                    Documents fournis : <strong style={{color:C.text}}>{files.length} fichier{files.length>1?"s":""}</strong><br/>
                    Frais de service : <strong style={{color:C.gold}}>49 €</strong> (hors taxes administratives)
                  </div>
                </div>

                <div style={{ display:"flex", gap:12 }}>
                  <button onClick={()=>setStep(2)} style={{ flex:1, background:"transparent", color:C.text, border:`1px solid ${C.border}`, borderRadius:12, padding:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>← Retour</button>
                  <button disabled={!canSend || sending} onClick={handleSubmit} style={{
                    flex:2, background: (canSend && !sending) ? C.gold : C.border, color:C.bg, border:"none",
                    borderRadius:12, padding:14, fontWeight:800, cursor: (canSend && !sending) ? "pointer" : "not-allowed", fontFamily:"inherit"
                  }}>{sending ? "Envoi en cours..." : "✉️ Envoyer ma demande"}</button>
                </div>
                {error && (
                  <div style={{ background:"#7F1D1D33", border:`1px solid #F8717180`, borderRadius:10, padding:14, color:"#FCA5A5", fontSize:13, marginTop:8 }}>
                    ⚠️ {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ background:C.card, borderRadius:20, padding:48, border:`1px solid ${C.gold}40`, textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>📄</div>
          <h2 style={{ color:C.green, fontSize:26, margin:"0 0 12px", fontFamily:"'Cormorant Garamond', serif" }}>Demande reçue !</h2>
          <p style={{ color:C.muted, lineHeight:1.9, margin:"0 0 20px" }}>
            Merci <strong style={{color:C.text}}>{form.nom}</strong> !<br/>
            Votre demande de <strong style={{color:C.text}}>{demarche?.titre.toLowerCase()}</strong> a bien été reçue.
          </p>
          <div style={{ background:C.surface, borderRadius:12, padding:20, marginBottom:24, textAlign:"left" }}>
            <div style={{ color:C.gold, fontWeight:700, marginBottom:10, fontSize:13 }}>📌 Prochaines étapes</div>
            <div style={{ color:C.muted, fontSize:13, lineHeight:1.9 }}>
              <strong style={{color:C.text}}>1.</strong> Nous vérifions vos documents sous 24h<br/>
              <strong style={{color:C.text}}>2.</strong> Nous vous envoyons un devis détaillé par email à <strong style={{color:C.gold}}>{form.email}</strong><br/>
              <strong style={{color:C.text}}>3.</strong> Après règlement, nous instruisons le dossier auprès de l'ANTS<br/>
              <strong style={{color:C.text}}>4.</strong> Vous recevez votre carte grise par courrier sécurisé
            </div>
          </div>
          <button onClick={()=>{setSent(false);setStep(1);setSelected(null);setFiles([]);setForm({nom:"",email:"",tel:"",adresse:"",immat:"",marque:"",modele:"",message:""});}} style={{ background:"transparent", color:C.gold, border:`1px solid ${C.gold}`, borderRadius:10, padding:"10px 24px", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
            Nouvelle demande
          </button>
        </div>
      )}
    </div>
  );
}

// ═══ CONTACT ═══
function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ nom:"", email:"", objet:"", message:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const canSend = form.nom && form.email && form.message;

  const handleSubmit = async () => {
    setSending(true);
    setError(null);
    const success = await sendToFormspree("Contact général", form);
    setSending(false);
    if (success) {
      setSent(true);
    } else {
      setError("Une erreur est survenue. Merci de nous contacter directement à Reflexauto2a@gmail.com");
    }
  };

  return (
    <div style={{ maxWidth:800, margin:"0 auto", padding:"100px 24px 60px" }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ fontSize:12, letterSpacing:4, color:C.gold, textTransform:"uppercase", marginBottom:12 }}>Nous écrire</div>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(32px,5vw,52px)", color:C.text, margin:"0 0 10px" }}>Contact</h1>
        <p style={{ color:C.muted }}>Nous préférons l'email pour un suivi sérieux et personnalisé de chaque demande.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:40 }}>
        {[
          { icon:"📧", titre:"Email", val:"Reflexauto2a@gmail.com", sub:"Réponse sous 24h" },
          { icon:"📍", titre:"Localisation", val:"Quartier Poretta", sub:"Porto-Vecchio 20137 · Corse" },
          { icon:"🕐", titre:"Disponibilité", val:"Lun – Sam", sub:"9h00 – 19h00" },
        ].map((c,i)=>(
          <div key={i} style={{ background:C.card, borderRadius:14, padding:24, border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>{c.icon}</div>
            <div style={{ fontWeight:700, color:C.gold, marginBottom:4, fontSize:13, textTransform:"uppercase", letterSpacing:1 }}>{c.titre}</div>
            <div style={{ color:C.text, fontWeight:600, marginBottom:4, fontSize:14, wordBreak:"break-word" }}>{c.val}</div>
            <div style={{ color:C.muted, fontSize:12 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {!sent ? (
        <div style={{ background:C.card, borderRadius:20, padding:32, border:`1px solid ${C.border}` }}>
          <h2 style={{ color:C.text, margin:"0 0 20px", fontFamily:"'Cormorant Garamond', serif", fontSize:24 }}>Envoyer un message</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <input value={form.nom} onChange={e=>set("nom",e.target.value)} placeholder="Nom & Prénom *" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:12, color:C.text, fontFamily:"inherit" }} />
              <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="Email *" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:12, color:C.text, fontFamily:"inherit" }} />
            </div>
            <input value={form.objet} onChange={e=>set("objet",e.target.value)} placeholder="Objet de votre message" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:12, color:C.text, fontFamily:"inherit" }} />
            <textarea value={form.message} onChange={e=>set("message",e.target.value)} placeholder="Votre message... *" rows={5} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:12, color:C.text, fontFamily:"inherit", resize:"vertical" }} />
            <button disabled={!canSend || sending} onClick={handleSubmit} style={{ background:(canSend && !sending) ? C.gold : C.border, color:C.bg, border:"none", borderRadius:10, padding:14, fontWeight:800, cursor:(canSend && !sending) ? "pointer" : "not-allowed", fontFamily:"inherit", fontSize:15 }}>
              {sending ? "Envoi en cours..." : "Envoyer →"}
            </button>
            {error && (
              <div style={{ background:"#7F1D1D33", border:`1px solid #F8717180`, borderRadius:10, padding:14, color:"#FCA5A5", fontSize:13 }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background:C.card, borderRadius:20, padding:48, border:`1px solid ${C.gold}40`, textAlign:"center" }}>
          <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
          <h2 style={{ color:C.green, fontFamily:"'Cormorant Garamond', serif", margin:"0 0 10px" }}>Message envoyé !</h2>
          <p style={{ color:C.muted }}>Nous vous répondrons sous 24h à votre adresse email.</p>
        </div>
      )}
    </div>
  );
}

// ═══ APP ═══
export default function App() {
  const [page, setPage] = useState("home");
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
      html { scroll-behavior: smooth; }
      body { font-family: 'Outfit', sans-serif; background: ${C.bg}; color: ${C.text}; -webkit-font-smoothing: antialiased; }
      select option { background: ${C.surface}; color: ${C.text}; }
      input::placeholder, textarea::placeholder { color: ${C.muted}; }
      input:focus, textarea:focus, select:focus { outline: 2px solid ${C.gold}50; border-color: ${C.gold}80 !important; }
      input[type=range] { accent-color: ${C.gold}; }
      input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
      @media (min-width: 769px) { .mob-btn { display: none !important; } }
      @media (max-width: 768px) {
        .desk-nav { display: none !important; }
        .vehicule-grid { grid-template-columns: 1fr !important; }
        .services-grid { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => { window.scrollTo({ top:0, behavior:"smooth" }); }, [page]);

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <Analytics />
      <NavBar page={page} setPage={setPage} />

      {page==="home" && <HomePage setPage={setPage} setSelectedVehicle={setSelectedVehicle} />}
      {page==="stock" && <StockPage setSelectedVehicle={setSelectedVehicle} setPage={setPage} />}
      {page==="vehicule" && <VehiculePage vehicle={selectedVehicle} setPage={setPage} />}
      {page==="rachat" && <RachatPage />}
      {page==="location" && <LocationPage />}
      {page==="cartegrise" && <CarteGrisePage />}
      {page==="contact" && <ContactPage />}

      <footer style={{ background:C.surface, borderTop:`1px solid ${C.border}`, padding:"40px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:32, marginBottom:32 }}>
            <div>
              <Logo size={36} />
              <p style={{ color:C.muted, fontSize:13, marginTop:14, lineHeight:1.8 }}>
                Achat, vente, dépôt-vente et location de véhicules à Porto-Vecchio, Corse du Sud.
              </p>
            </div>
            <div>
              <div style={{ color:C.gold, fontWeight:700, fontSize:12, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Services</div>
              {["Rachat cash","Dépôt-Vente 490€","Vente de véhicules","Location estivale","Carte Grise 49€"].map(s=>(
                <div key={s} style={{ color:C.muted, fontSize:13, marginBottom:8 }}>{s}</div>
              ))}
            </div>
            <div>
              <div style={{ color:C.gold, fontWeight:700, fontSize:12, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Contact</div>
              <div style={{ color:C.muted, fontSize:13, lineHeight:2 }}>
                📍 Quartier Poretta<br />Porto-Vecchio 20137<br />Corse du Sud<br /><br />
                📧 Reflexauto2a@gmail.com
              </div>
            </div>
          </div>
          <GoldLine />
          <div style={{ textAlign:"center", color:C.muted, fontSize:12 }}>
            © 2025 Reflex'Auto 2A · Tous droits réservés · Quartier Poretta, Porto-Vecchio 20137
          </div>
        </div>
      </footer>
    </div>
  );
}
