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
  const [signature, setSignature] = useState(""); 
  const [messages, setMessages] = useState<{id: number, text: string, reactions?: any}[]>([]); 
  const [photos, setPhotos] = useState<{url: string, id: number, reactions?: any}[]>([]); 
  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [myMessageIds, setMyMessageIds] = useState<number[]>([]);
  const [myPhotoIds, setMyPhotoIds] = useState<number[]>([]);
  const [myPhotoReactions, setMyPhotoReactions] = useState<Record<number, string>>({});
  const [myMsgReactions, setMyMsgReactions] = useState<Record<number, string>>({});

  useEffect(() => {
    const savedMsgIds = localStorage.getItem("my_messages");
    if (savedMsgIds) setMyMessageIds(JSON.parse(savedMsgIds));
    const savedPhotoIds = localStorage.getItem("my_photos");
    if (savedPhotoIds) setMyPhotoIds(JSON.parse(savedPhotoIds));
    const savedPReac = localStorage.getItem("my_p_reac");
    if (savedPReac) setMyPhotoReactions(JSON.parse(savedPReac));
    const savedMReac = localStorage.getItem("my_m_reac");
    if (savedMReac) setMyMsgReactions(JSON.parse(savedMReac));

    const fetchData = async () => {
      const { data: photoData } = await supabase.from("Photos").select("*").order("created_at", { ascending: false });
      if (photoData) setPhotos(photoData);
      const { data: msgData } = await supabase.from("baby-registry").select("*").order("created_at", { ascending: false });
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
    const finalMsg = signature.trim() ? `${message.trim()} \n\n— ${signature.trim()}` : message.trim();
    const { data, error } = await supabase.from("baby-registry").insert([{ text: finalMsg, reactions: {} }]).select().single(); 
    if (error) { alert(error.message); return; } 
    if (data) {
        setMessages((prev) => [data, ...prev]);
        const updatedIds = [...myMessageIds, data.id];
        setMyMessageIds(updatedIds);
        localStorage.setItem("my_messages", JSON.stringify(updatedIds));
    }
    setMessage(""); 
    setSignature("");
    triggerThanks();
  }, [message, signature, myMessageIds]); 

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    const files = Array.from(e.target.files || []); 
    const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
    for (const file of files) { 
      try {
        const compressedFile = await imageCompression(file, options);
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
      } catch (err) { console.error(err); }
    }
    triggerThanks();
  }; 

  const handleGenericReaction = async (id: number, emoji: string, type: 'photo' | 'msg') => {
    const items = type === 'photo' ? photos : messages;
    const item = items.find(i => i.id === id);
    if (!item) return;

    const currentReactions = { ...(item.reactions || {}) };
    const myCurrentReactions = type === 'photo' ? myPhotoReactions : myMsgReactions;
    const previousEmoji = myCurrentReactions[id];
    let updatedMyReactions = { ...myCurrentReactions };

    if (previousEmoji === emoji) {
      currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
      delete updatedMyReactions[id];
    } else {
      if (previousEmoji) currentReactions[previousEmoji] = Math.max(0, (currentReactions[previousEmoji] || 1) - 1);
      currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
      updatedMyReactions[id] = emoji;
    }

    const table = type === 'photo' ? "Photos" : "baby-registry";
    const { error } = await supabase.from(table).update({ reactions: currentReactions }).eq('id', id);
    
    if (!error) {
      if (type === 'photo') {
        setPhotos(prev => prev.map(p => p.id === id ? { ...p, reactions: currentReactions } : p));
        setMyPhotoReactions(updatedMyReactions);
        localStorage.setItem("my_p_reac", JSON.stringify(updatedMyReactions));
      } else {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, reactions: currentReactions } : m));
        setMyMsgReactions(updatedMyReactions);
        localStorage.setItem("my_m_reac", JSON.stringify(updatedMyReactions));
      }
    }
  };

  const deletePhoto = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Vuoi davvero cancellare questa foto?")) return;
    await supabase.from("Photos").delete().eq('id', id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const deleteMessage = async (id: number) => {
    if (!confirm("Vuoi davvero cancellare questo messaggio?")) return;
    await supabase.from("baby-registry").delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
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
      <div className="fixed inset-0 w-full h-full -z-20 bg-no-repeat bg-top pointer-events-none" style={{ backgroundImage: "url('/bg-mobile.png')", backgroundSize: "145%", backgroundColor: "#f0f9ff", marginTop: "-1px" }} /> 
      <div className="fixed inset-0 w-full h-full bg-white/60 -z-10 pointer-events-none" /> 

      <div className="absolute top-4 right-4 z-50"> 
        <Button onClick={() => setMusicOn((v) => !v)} className={BTN + " !w-14 !p-0"}>{musicOn ? "🔊" : "🔇"}</Button> 
      </div> 

      {musicOn && <iframe title="music" src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0`} allow="autoplay" className="hidden" />} 

      <div className="relative z-10 text-center mt-16 mb-6 px-4"> 
        <h1 className="text-3xl font-bold">Benvenuto</h1> 
        <h2 className="text-5xl font-extrabold mt-1 text-blue-900">Michele</h2> 
        <div className="mt-6 space-y-4 text-base leading-relaxed max-w-sm mx-auto text-blue-800">
          <p>Abbiamo creato questo spazio per raccogliere i vostri <b>messaggi</b> e le <b>foto ricordo</b> più belle, così da iniziare a scrivere insieme il primo capitolo della vita di Michi.</p>
          <p>Sappiamo che body e peluche sono adorabili… ma pannolini e notti insonni lo sono un po’ meno 😄 Se desiderate partecipare a questa avventura con un piccolo pensiero, ve ne saremo molto grati e ci aiuterete ad affrontare al meglio ogni nuova sfida! 🦊</p>
        </div>
        <p className="mt-4 text-lg font-semibold border-t border-blue-200 pt-4 inline-block px-8">9 ottobre 2026</p> 
      </div> 

      <div className="w-full max-w-md space-y-5 z-10 relative pb-20"> 
        <div className={CARD}> 
          <h2 className={`text-lg font-semibold ${PRIMARY}`}>💝 Per iniziare questa avventura</h2> 
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi un messaggio" className="mt-2" /> 
          <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Tua firma (opzionale)" className="mt-2 text-sm italic" /> 
          <Button onClick={addMessage} className={`mt-3 ${BTN}`}>Invia 💙</Button> 
          <Button onClick={() => setPaymentOpen(true)} className={`mt-2 ${BTN}`}>Un pensiero per Michi 🧸</Button> 
        </div> 

        <div className={CARD}> 
          <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>📸 Ricordi</h2> 
          <input id="galleryInput" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" /> 
          <Button className={BTN} onClick={() => document.getElementById("galleryInput")?.click()}>Condividi un ricordo per Michi</Button> 
          
          {/* GRIGLIA A 3 COLONNE PER ANTEPRIME PIU' PICCOLE */}
          <div className="grid grid-cols-3 gap-2 mt-4 max-h-[500px] overflow-y-auto pr-1"> 
            {photos.map((p) => ( 
              <div key={p.id} className="relative flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-blue-50">
                <div onClick={() => setSelectedPhoto(p.url)} className="w-full h-24 bg-gray-100">
                  <img src={p.url} className="w-full h-full object-cover" alt="Foto" />
                </div>
                {myPhotoIds.includes(p.id) && (
                    <button onClick={(e) => deletePhoto(p.id, e)} className="absolute top-1 left-1 bg-red-500/80 text-white rounded-full p-1 z-10"><Trash2 size={10} /></button>
                )}
                <div className="flex justify-around items-center py-1 bg-sky-50/50">
                    {REACTIONS.map(emoji => (
                        <button key={emoji} onClick={() => handleGenericReaction(p.id, emoji, 'photo')} className={`flex flex-col items-center transition-all ${myPhotoReactions[p.id] === emoji ? 'scale-110 bg-blue-100 rounded-md px-0.5' : ''}`}>
                            <span className="text-xs">{emoji}</span>
                            <span className="text-[8px] font-sans font-bold">{p.reactions?.[emoji] || 0}</span>
                        </button>
                    ))}
                </div>
              </div>
            ))} 
          </div> 
        </div> 

        <div className={CARD}> 
          <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>💌 Messaggi</h2> 
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1"> 
            {messages.map((m) => (  
              <div key={m.id} className="bg-white border border-blue-50 rounded-xl p-3 shadow-sm">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-sm whitespace-pre-wrap">{m.text}</span>
                    {myMessageIds.includes(m.id) && (
                        <button onClick={() => deleteMessage(m.id)} className="text-red-300"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div className="flex gap-4 border-t border-gray-50 pt-2">
                    {REACTIONS.map(emoji => (
                      <button key={emoji} onClick={() => handleGenericReaction(m.id, emoji, 'msg')} className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${myMsgReactions[m.id] === emoji ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                        <span className="text-xs">{emoji}</span>
                        <span className="text-[10px] font-sans font-bold">{m.reactions?.[emoji] || 0}</span>
                      </button>
                    ))}
                  </div>
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

      {/* POPUP RINGRAZIAMENTO CON ICONE RIPRISTINATE */}
      {showThanks && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none px-6">
          <div className="bg-white p-4 rounded-2xl shadow-xl animate-center-pop-mobile text-blue-800 font-bold flex items-center gap-2">
            <span>🧦 🧸</span>
            <span>Grazie mille da Michi! 💙</span>
          </div>
        </div>
      )}

      {selectedPhoto && <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[9999]" onClick={() => setSelectedPhoto(null)}><img src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Zoom" /></div>}
    </div> 
  ); 
}