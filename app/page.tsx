"use client"; 
import { useCallback, useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { supabase } from "@/lib/supabase"; 
import { Trash2, Copy, Check } from "lucide-react"; 
import imageCompression from 'browser-image-compression';

const IBAN = "IT46K0347501605CC0011358676"; 
const PAYPAL_EMAIL = "antonio_caringella@libero.it"; 
const YT_VIDEO_ID = "lp-EO5I60KA"; 
const PRIMARY = "text-blue-800"; 
const BTN = "bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 text-lg shadow-md w-full"; 
const CARD = "bg-sky-50 rounded-3xl shadow-lg p-5 border border-blue-100"; 

const REACTIONS = ["❤️", "🧸", "✨", "👶"];

export default function BabyRegistry() { 
  const [message, setMessage] = useState(""); 
  const [messages, setMessages] = useState<{id: number, text: string}[]>([]); 
  const [photos, setPhotos] = useState<{url: string, id: number, reactions?: any}[]>([]); 
  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [myMessageIds, setMyMessageIds] = useState<number[]>([]);
  const [myPhotoIds, setMyPhotoIds] = useState<number[]>([]);
  // Stato per ricordare quale reazione ha messo l'utente su ogni foto {photoId: "emoji"}
  const [myReactions, setMyReactions] = useState<Record<number, string>>({});

  useEffect(() => {
    const savedMsgIds = localStorage.getItem("my_messages");
    if (savedMsgIds) setMyMessageIds(JSON.parse(savedMsgIds));
    const savedPhotoIds = localStorage.getItem("my_photos");
    if (savedPhotoIds) setMyPhotoIds(JSON.parse(savedPhotoIds));
    const savedReactions = localStorage.getItem("my_photo_reactions");
    if (savedReactions) setMyReactions(JSON.parse(savedReactions));

    const fetchData = async () => {
      const { data: photoData } = await supabase.from("Photos").select("*").order("created_at", { ascending: false });
      if (photoData) setPhotos(photoData);
      const { data: msgData } = await supabase.from("baby-registry").select("id, text").order("created_at", { ascending: false });
      if (msgData) setMessages(msgData);
    };
    fetchData();
  }, []);

  const triggerThanks = () => {
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 3000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const addMessage = useCallback(async () => { 
    if (!message.trim()) return; 
    const { data, error } = await supabase.from("baby-registry").insert([{ text: message.trim() }]).select().single(); 
    if (error) { alert(error.message); return; } 
    if (data) {
        setMessages((prev) => [data, ...prev]);
        const updatedIds = [...myMessageIds, data.id];
        setMyMessageIds(updatedIds);
        localStorage.setItem("my_messages", JSON.stringify(updatedIds));
    }
    setMessage(""); 
    triggerThanks();
  }, [message, myMessageIds]); 

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    const files = Array.from(e.target.files || []); 
    const compressionOptions = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
    for (const file of files) { 
      try {
        const compressedFile = await imageCompression(file, compressionOptions);
        const filePath = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`; 
        const { error: uploadError } = await supabase.storage.from("Photos").upload(filePath, compressedFile); 
        if (uploadError) continue; 
        const { data: urlData } = supabase.storage.from("Photos").getPublicUrl(filePath); 
        if (urlData?.publicUrl) { 
          const { data: newPhoto } = await supabase.from("Photos").insert([{ url: urlData.publicUrl, reactions: {} }]).select().single();
          if (newPhoto) {
              setPhotos((prev) => [newPhoto, ...prev]);
              const updatedIds = [...myPhotoIds, newPhoto.id];
              setMyPhotoIds(updatedIds);
              localStorage.setItem("my_photos", JSON.stringify(updatedIds));
          }
        } 
      } catch (error) { console.error(error); }
    }
    triggerThanks();
  }; 

  const handleReaction = async (id: number, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    const currentDBReactions = { ...(photo.reactions || {}) };
    const previousEmoji = myReactions[id];
    let updatedMyReactions = { ...myReactions };

    // Se clicco la stessa emoji: la tolgo
    if (previousEmoji === emoji) {
      currentDBReactions[emoji] = Math.max(0, (currentDBReactions[emoji] || 1) - 1);
      delete updatedMyReactions[id];
    } else {
      // Se c'era un'altra emoji prima, tolgo il voto a quella vecchia
      if (previousEmoji) {
        currentDBReactions[previousEmoji] = Math.max(0, (currentDBReactions[previousEmoji] || 1) - 1);
      }
      // Aggiungo il voto alla nuova emoji
      currentDBReactions[emoji] = (currentDBReactions[emoji] || 0) + 1;
      updatedMyReactions[id] = emoji;
    }

    const { error } = await supabase.from("Photos").update({ reactions: currentDBReactions }).eq('id', id);
    if (!error) {
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, reactions: currentDBReactions } : p));
      setMyReactions(updatedMyReactions);
      localStorage.setItem("my_photo_reactions", JSON.stringify(updatedMyReactions));
    }
  };

  const deletePhoto = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Vuoi davvero cancellare questa foto?")) return;
    const { error } = await supabase.from("Photos").delete().eq('id', id);
    if (!error) {
        setPhotos(prev => prev.filter(p => p.id !== id));
        const updatedIds = myPhotoIds.filter(pid => pid !== id);
        setMyPhotoIds(updatedIds);
        localStorage.setItem("my_photos", JSON.stringify(updatedIds));
    }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm("Vuoi cancellare questo messaggio?")) return;
    const { error } = await supabase.from("baby-registry").delete().eq('id', id);
    if (!error) {
        setMessages(prev => prev.filter(m => m.id !== id));
        const updatedIds = myMessageIds.filter(mid => mid !== id);
        setMyMessageIds(updatedIds);
        localStorage.setItem("my_messages", JSON.stringify(updatedIds));
    }
  };

  return ( 
    <div className="min-h-screen w-full flex flex-col items-center p-4 relative font-dreaming text-blue-800 overflow-x-hidden"> 
      <style>{` 
        @font-face { font-family: 'Dreaming'; src: url('/fonts/dreaming-outloud-pro.woff') format('woff'); } 
        .font-dreaming { font-family: 'Dreaming', cursive; } 
        @keyframes centerPopMobile { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-center-pop-mobile { animation: centerPopMobile 0.3s ease-out; }
        .top-bar-fill { position: fixed; top: 0; left: 0; right: 0; height: env(safe-area-inset-top, 44px); background-color: #f0f9ff; z-index: 100; }
      `}</style> 

      <div className="top-bar-fill" />
      <div className="fixed inset-0 w-full h-full -z-20 bg-no-repeat bg-top pointer-events-none" style={{ backgroundImage: "url('/bg-mobile.png')", backgroundSize: "145%", backgroundColor: "#f0f9ff" }} /> 
      <div className="fixed inset-0 w-full h-full bg-white/60 -z-10 pointer-events-none" /> 

      <div className="absolute top-4 right-4 z-50"> 
        <Button onClick={() => setMusicOn((v) => !v)} className={BTN + " !w-14 !p-0"}>{musicOn ? "🔊" : "🔇"}</Button> 
      </div> 

      {musicOn && <iframe title="music" src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0`} allow="autoplay" className="hidden" />} 

      <div className="relative z-10 text-center mt-16 mb-6 px-4"> 
        <h1 className="text-3xl font-bold">Benvenuto</h1> 
        <h2 className="text-5xl font-extrabold mt-1 text-blue-900">Michele</h2> 
        <div className="mt-6 space-y-4 text-base leading-relaxed max-w-sm mx-auto">
          <p>Abbiamo creato questo spazio per raccogliere i vostri <b>messaggi</b> e le <b>foto ricordo</b> più belle.</p>
          <p>Se desiderate partecipare con un piccolo pensiero, ve ne saremo grati! 🦊</p>
        </div>
        <p className="mt-4 text-lg font-semibold border-t border-blue-200 pt-4 inline-block px-8">9 ottobre 2026</p> 
      </div> 

      <div className="w-full max-w-md space-y-5 z-10 relative pb-20"> 
        <div className={CARD}> 
          <h2 className={`text-lg font-semibold ${PRIMARY}`}>💝 Per iniziare questa avventura</h2> 
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi un messaggio" className="mt-2" /> 
          <Button onClick={addMessage} className={`mt-3 ${BTN}`}>Invia 💙</Button> 
          <Button onClick={() => setPaymentOpen(true)} className={`mt-2 ${BTN}`}>Un pensiero per Michi 🧸</Button> 
        </div> 

        <div className={CARD}> 
          <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>📸 Ricordi</h2> 
          <input id="galleryInput" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" /> 
          <Button className={BTN} onClick={() => document.getElementById("galleryInput")?.click()}>Condividi un ricordo</Button> 
          
          <div className="grid grid-cols-2 gap-4 mt-4 max-h-[500px] overflow-y-auto pr-1"> 
            {photos.map((p) => ( 
              <div key={p.id} className="relative flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-blue-50">
                <div onClick={() => setSelectedPhoto(p.url)} className="w-full h-32 bg-gray-100">
                  <img src={p.url} className="w-full h-full object-cover" alt="Foto" />
                </div>
                
                {myPhotoIds.includes(p.id) && (
                    <button onClick={(e) => deletePhoto(p.id, e)} className="absolute top-1 left-1 bg-red-500/80 text-white rounded-full p-1.5 z-10"><Trash2 size={12} /></button>
                )}

                {/* BARRA REACTION FISSA */}
                <div className="flex justify-around items-center py-2 bg-sky-50/50">
                    {REACTIONS.map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={(e) => handleReaction(p.id, emoji, e)} 
                          className={`flex flex-col items-center transition-transform active:scale-150 ${myReactions[p.id] === emoji ? 'bg-blue-200/50 rounded-lg px-1 scale-110' : ''}`}
                        >
                            <span className="text-base">{emoji}</span>
                            <span className="text-[10px] font-sans font-bold text-blue-900">{p.reactions?.[emoji] || 0}</span>
                        </button>
                    ))}
                </div>
              </div>
            ))} 
          </div> 
        </div> 

        <div className={CARD}> 
          <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>💌 Messaggi</h2> 
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1"> 
            {messages.map((m) => (  
              <div key={m.id} className="bg-white border border-blue-50 rounded-xl p-3 text-sm flex justify-between items-start gap-2">
                  <span>{m.text}</span>
                  {myMessageIds.includes(m.id) && (
                      <button onClick={() => deleteMessage(m.id)} className="text-red-300"><Trash2 size={14} /></button>
                  )}
              </div> 
            ))} 
          </div> 
        </div> 
      </div> 

      {paymentOpen && ( 
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] px-4" onClick={() => setPaymentOpen(false)}> 
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-center-pop-mobile" onClick={(e) => e.stopPropagation()}> 
            <h3 className="text-lg font-semibold mb-4 text-blue-800 text-center uppercase tracking-widest">🧸 Un pensiero per Michi</h3> 
            <div className="space-y-3"> 
              <div className="p-4 bg-sky-50 rounded-2xl border border-blue-100 flex justify-between items-center">
                <div className="overflow-hidden">
                    <p className="font-bold text-blue-400 text-[10px] uppercase mb-1">IBAN</p>
                    <p className="font-mono text-xs truncate">{IBAN}</p>
                </div>
                <button onClick={() => copyToClipboard(IBAN, 'iban')} className="ml-2 p-2 bg-white rounded-xl shadow-sm text-blue-500">
                    {copiedField === 'iban' ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div> 
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
                <div>
                    <p className="font-bold text-orange-400 text-[10px] uppercase mb-1">PayPal</p>
                    <p className="font-mono text-xs">{PAYPAL_EMAIL}</p>
                </div>
                <button onClick={() => copyToClipboard(PAYPAL_EMAIL, 'paypal')} className="ml-2 p-2 bg-white rounded-xl shadow-sm text-orange-500">
                    {copiedField === 'paypal' ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div> 
            </div> 
            <Button onClick={() => setPaymentOpen(false)} className="mt-5 w-full bg-blue-500 rounded-full py-3">Chiudi</Button> 
          </div> 
        </div> 
      )} 

      {showThanks && <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"><div className="bg-white p-4 rounded-2xl shadow-xl animate-center-pop-mobile text-blue-800 font-bold">Grazie mille da Michi! 💙</div></div>}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[9999]" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Full" />
        </div>
      )}
    </div> 
  ); 
}