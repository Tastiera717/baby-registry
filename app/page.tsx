"use client"; 
import { useCallback, useEffect, useMemo, useState } from "react"; 
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { supabase } from "@/lib/supabase"; 
const IBAN = "IT46K0347501605CC0011358676"; 
const PAYPAL_EMAIL = "antonio_caringella@libero.it"; 
const YT_VIDEO_ID = "lp-EO5I60KA"; 
const PRIMARY = "text-blue-800"; 
const BTN = 
"bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 text-lg shadow-md w-full"; 
const CARD = 
"bg-sky-50 rounded-3xl shadow-lg p-5"; // 👈 celeste chiaro 
export default function BabyRegistry() { 
const [message, setMessage] = useState(""); 
const [messages, setMessages] = useState<string[]>([]); 
const [photos, setPhotos] = useState<string[]>([]); 
const [paymentOpen, setPaymentOpen] = useState(false); 
const [musicOn, setMusicOn] = useState(false);
const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
useEffect(() => {
  const fetchData = async () => {
    // Scarica le Foto
    const { data: photoData, error: photoError } = await supabase
      .from("Photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (photoError) console.error("Errore foto:", photoError);
    else if (photoData) setPhotos(photoData.map((p) => p.url));

    // Scarica i Messaggi dalla tabella baby-registry
    const { data: msgData, error: msgError } = await supabase
      .from("baby-registry")
      .select("text")
      .order("created_at", { ascending: false });

    if (msgError) console.error("Errore messaggi:", msgError);
    else if (msgData) setMessages(msgData.map((m) => m.text));
  };

  fetchData();
}, []);
const addMessage = useCallback(async () => { 
  if (!message.trim()) return; 

  const newMessage = message.trim(); 

  // Questa riga ora è pulita e corretta
  const { error } = await supabase
    .from("baby-registry")
    .insert([{ text: newMessage }]); 

  if (error) { 
    console.error("SUPABASE ERROR:", error); 
    alert(error.message); 
    return; 
  } 

  setMessages((prev) => [newMessage, ...prev]); 
  setMessage(""); 
}, [message]); 
const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
const files = Array.from(e.target.files || []); 
for (const file of files) { 
const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_"); 
// ✅ path ULTRA SAFE (NO ERRORI SUPABASE) 
const filePath = `${crypto.randomUUID()}-${safeName}`; 
// 📤 UPLOAD STORAGE 
const { error: uploadError } = await supabase.storage.from("Photos") 
.upload(filePath, file, { 
cacheControl: "3600", 
upsert: false, 
}); 
if (uploadError) { 
console.error("UPLOAD ERROR:", uploadError); 
alert(uploadError.message); 
return; 
} 
// 🔗 PUBLIC URL 
const { data: urlData } = supabase.storage.from("Photos") 
.getPublicUrl(filePath); 
const publicUrl = urlData?.publicUrl; 
if (!publicUrl) { 
console.error("PUBLIC URL ERROR"); 
return; 
} 
// 💾 SAVE DB (TABELLA Photos) 
const { error: dbError } = await supabase.from("Photos").insert([ 
{ url: publicUrl }, 
]); 
if (dbError) { 
console.error("DB ERROR:", dbError); 
return; 
} 
// ⚡ UI UPDATE 
setPhotos((prev) => [publicUrl, ...prev]); 
} 
}; 
const babyMessage = 
"Body e peluche sono adorabili… ma pannolini e notti insonni lo sono un po’ meno 😄 " + 
"Se vuoi darci una mano, useremo il tutto per affrontare al meglio questa nuova avventura!🦊"; 
return ( 
<div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden font-dreaming text-blue-800"> 
{/* FONT CUSTOM */} 
<style>{` 
@font-face { 
font-family: 'Dreaming'; 
src: url('/fonts/dreaming-outloud-pro.woff') format('woff'); 
font-weight: normal; 
font-style: normal; 
} 
.font-dreaming { 
font-family: 'Dreaming', cursive; 
} 
.float-slow { 
animation: float 6s ease-in-out infinite; 
} 
@keyframes float { 
0% { transform: translateY(0px); } 
50% { transform: translateY(-10px); } 
100% { transform: translateY(0px); } 
} 
`}</style> 
{/* BACKGROUND */} 
<div 
className="absolute inset-0 bg-no-repeat bg-top bg-cover" 
style={{ backgroundImage: "url('/bg-mobile.png')" }} 
/> 
<div className="absolute inset-0 bg-white/70" /> 
{/* MUSIC */} 
<div className="absolute top-4 right-4 z-50"> 
<Button onClick={() => setMusicOn((v) => !v)} className={BTN}> 
{musicOn ? "🔊" : "🔇"} 
</Button> 
</div> 
{musicOn && ( 
<iframe 
title="music" 
src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0`} 
allow="autoplay" 
className="hidden" 
/> 
)} 
{/* HEADER */} 
<div className="relative z-10 text-center mt-10 mb-6 px-2"> 
<h1 className="text-3xl font-bold">Benvenuto</h1> 
<h2 className="text-5xl font-extrabold mt-1">Michele</h2> 
<p className="mt-4 text-base leading-relaxed"> 
{babyMessage} 
</p> 
<p className="mt-3 text-lg font-semibold"> 
9 ottobre 2026 
</p> 
</div> 
{/* CONTENT */} 
<div className="w-full max-w-md space-y-5 z-10"> 
{/* MESSAGGIO */} 
<div className={CARD}> 
<h2 className={`text-lg font-semibold ${PRIMARY}`}> 
💝 Per iniziare questa avventura 
</h2> 
<Input 
value={message} 
onChange={(e) => setMessage(e.target.value)} 
placeholder="Scrivi un messaggio" 
className="mt-2" 
/> 
<Button onClick={addMessage} className={`mt-3 ${BTN}`}> 
Invia 💙 
</Button> 
<Button 
type="button" 
onClick={() => setPaymentOpen(true)} 
className={`mt-2 ${BTN}`} 
> 
Dettagli contributo 🧸 
</Button> 
</div> 
{/* FOTO */} 
<div className={CARD}> 
<h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}> 
📸 Ricordi 
</h2> 
<input 
id="galleryInput" 
type="file" 
accept="image/*" 
multiple 
onChange={handlePhotoUpload} 
className="hidden" 
/> 
<Button 
className={BTN} 
onClick={() => 
document.getElementById("galleryInput")?.click() 
} 
> 
Condividi un ricordo per Miki 
</Button> 
{/* FOTO */}
<div className={CARD}>
  <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>📸 Ricordi</h2>
  <input
    id="galleryInput"
    type="file"
    accept="image/*"
    multiple
    onChange={handlePhotoUpload}
    className="hidden"
  />
  <Button
    className={BTN}
    onClick={() => document.getElementById("galleryInput")?.click()}
  >
    Condividi un ricordo per Miki
  </Button>

  {/* GRIGLIA CORRETTA - Un solo contenitore */}
  <div className="grid grid-cols-3 gap-2 mt-4">
    {photos.map((p, i) => (
      <div
        key={i}
        // Usiamo onClick semplice ma con proprietà CSS che forzano il tocco
        onClick={() => setSelectedPhoto(p)}
        className="w-full h-24 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-transform"
        style={{
          backgroundImage: `url(${p})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          WebkitTapHighlightColor: 'transparent', // Rimuove il fastidioso quadrato blu al tocco
          touchAction: 'manipulation'
        }}
      />
    ))}
  </div>
</div>
{/* MESSAGGI */} 
<div className={CARD}> 
<h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}> 
💌 Messaggi 
</h2> 
<div className="space-y-2"> 
{messages.map((m, i) => ( 
<div 
key={i} 
className="bg-white rounded-xl p-3 text-sm" 
> 
{m} 
</div> 
))} 
</div> 
</div> 
</div> 
{/* MODAL */} 
{paymentOpen && ( 
<div 
className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" 
onClick={() => setPaymentOpen(false)} 
> 
<div 
className="bg-white rounded-3xl p-6 w-[90%] max-w-md" 
onClick={(e) => e.stopPropagation()} 
> 
<h3 className="text-lg font-semibold mb-4"> 
🧸 Contributo 
</h3> 
<div className="space-y-3 text-sm"> 
<div className="p-3 bg-sky-50 rounded-xl"> 
<p className="font-semibold">IBAN</p> 
<p>{IBAN}</p> 
</div> 
<div className="p-3 bg-sky-50 rounded-xl"> 
<p className="font-semibold">PayPal</p> 
<p>{PAYPAL_EMAIL}</p> 
</div> 
</div> 
<Button 
onClick={() => setPaymentOpen(false)} 
className="mt-5 w-full" 
> 
Chiudi 
</Button> 
</div> 
</div> 
)} 
{/* LIGHTBOX PER FOTO A TUTTO SCHERMO */}
{selectedPhoto && (
  <div
    className="fixed inset-0 bg-black/95 flex items-center justify-center p-4"
    style={{ 
      zIndex: 9999, // Forza sopra ogni cosa
      touchAction: 'none' 
    }}
    onClick={() => setSelectedPhoto(null)}
  >
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        src={selectedPhoto}
        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        alt="Foto ingrandita"
        // Evita che il click sulla foto venga ignorato
        onClick={(e) => {
          e.stopPropagation();
          setSelectedPhoto(null);
        }}
      />
      {/* Tasto X più grande e isolato */}
      <div 
        className="absolute top-0 right-0 p-4 text-white text-5xl font-light cursor-pointer"
        onClick={() => setSelectedPhoto(null)}
      >
        ×
      </div>
    </div>
  </div>
)}
</div> 
); 
}
