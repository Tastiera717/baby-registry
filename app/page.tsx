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
  const [photos, setPhotos] = useState<{url: string, id: number, reactions: any}[]>([]); 
  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [myMessageIds, setMyMessageIds] = useState<number[]>([]);
  const [myPhotoIds, setMyPhotoIds] = useState<number[]>([]);

  useEffect(() => {
    const savedMsgIds = localStorage.getItem("my_messages");
    if (savedMsgIds) setMyMessageIds(JSON.parse(savedMsgIds));
    const savedPhotoIds = localStorage.getItem("my_photos");
    if (savedPhotoIds) setMyPhotoIds(JSON.parse(savedPhotoIds));

    const fetchData = async () => {
      const { data: photoData } = await supabase.from("Photos").select("*").order("created_at", { ascending: false });
      if (photoData) setPhotos(photoData);

      const { data: msgData } = await supabase.from("baby-registry").select("id, text").order("created_at", { ascending: false });
      if (msgData) setMessages(msgData);
    };
    fetchData();
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const addMessage = useCallback(async () => { 
    if (!message.trim()) return; 
    const { data, error } = await supabase.from("baby-registry").insert([{ text: message.trim() }]).select().single(); 
    if (error) return alert(error.message); 
    if (data) {
        setMessages((prev) => [data, ...prev]);
        const updatedIds = [...myMessageIds, data.id];
        setMyMessageIds(updatedIds);
        localStorage.setItem("my_messages", JSON.stringify(updatedIds));
    }
    setMessage(""); 
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 3000);
  }, [message, myMessageIds]); 

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
        const { data: newPhoto } = await supabase.from("Photos").insert([{ url: urlData.publicUrl, reactions: {} }]).select().single();
        if (newPhoto) {
            setPhotos((prev) => [newPhoto, ...prev]);
            const updatedIds = [...myPhotoIds, newPhoto.id];
            setMyPhotoIds(updatedIds);
            localStorage.setItem("my_photos", JSON.stringify(updatedIds));
        }
      } catch (err) { console.error(err); }
    }
  }; 

  const handleReaction = async (photoId: number, reaction: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    const currentReactions = photo.reactions || {};
    const newValue = (currentReactions[reaction] || 0) + 1;
    const updatedReactions = { ...currentReactions, [reaction]: newValue };

    const { error } = await supabase.from("Photos").update({ reactions: updatedReactions }).eq('id', photoId);
    if (!error) {
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, reactions: updatedReactions } : p));
    }
  };

  const deleteMessage = async (id: number) => {
    if (confirm("Cancellarlo?")) {
      await supabase.from("baby-registry").delete().eq('id', id);
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  const deletePhoto = async (id: number) => {
    if (confirm("Cancellare la foto?")) {
      await supabase.from("Photos").delete().eq('id', id);
      setPhotos(prev => prev.filter(p => p.id !== id));
    }
  };

  return ( 
    <div className="min-h-screen w-full flex flex-col items-center p-4 relative font-dreaming text-blue-800 overflow-x-hidden"> 
      <style>{` 
        @font-face { font-family: 'Dreaming'; src: url('/fonts/dreaming-outloud-pro.woff') format('woff'); } 
        .font-dreaming { font-family: 'Dreaming', cursive; } 
        .top-bar-fill { position: fixed; top: 0; left: 0; right: 0; height: env(safe-area-inset-top, 44px); background-color: #f0f9ff; z-index: 100; }
      `}</style> 

      <div className="top-bar-fill" />
      <div className="fixed inset-0 w-full h-full -z-20" style={{ backgroundImage: "url('/bg-mobile.png')", backgroundSize: "145%", backgroundPosition: "top", backgroundColor: "#f0f9ff" }} /> 
      <div className="fixed inset-0 w-full h-full bg-white/60 -z-10" /> 

      <div className="absolute top-4 right-4 z-50"> 
        <Button onClick={() => setMusicOn(!musicOn)} className={BTN + " !w-14 !p-0"}>{musicOn ? "🔊" : "🔇"}</Button> 
      </div> 

      {musicOn && <iframe title="music" src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}`} allow="autoplay" className="hidden" />} 

      <div className="relative z-10 text-center mt-16 mb-6 px-4"> 
        <h1 className="text-3xl font-bold">Benvenuto</h1> 
        <h2 className="text-5xl font-extrabold mt-1 text-blue-900">Michele</h2> 
        <p className="mt-6 text-base leading-relaxed max-w-sm mx-auto">
          Abbiamo creato questo spazio per raccogliere messaggi e foto ricordo per Michi. 
          Pannolini e nanna sono le nostre nuove sfide! Se volete aiutarci con un pensiero, ve ne saremo grati. 🦊
        </p>
        <p className="mt-4 text-lg font-semibold border-t border-blue-200 pt-4 inline-block px-8">9 ottobre 2026</p> 
      </div> 

      <div className="w-full max-w-md space-y-5 z-10 pb-20"> 
        <div className={CARD}> 
          <h2 className="text-lg font-semibold">💝 Lascia un pensiero</h2> 
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi qui..." className="mt-2" /> 
          <Button onClick={addMessage} className={"mt-3 " + BTN}>Invia 💙</Button> 
          <Button onClick={() => setPaymentOpen(true)} className={"mt-2 " + BTN}>Un pensiero per Michi 🧸</Button> 
        </div> 

        <div className={CARD}> 
          <h2 className="text-lg font-semibold mb-3">📸 Album di Michi</h2> 
          <input id="galleryInput" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" /> 
          <Button className={BTN} onClick={() => document.getElementById("galleryInput")?.click()}>Carica Foto</Button> 
          
          <div className="grid grid-cols-2 gap-3 mt-4 overflow-y-auto pr-1"> 
            {photos.map((p) => ( 
              <div key={p.id} className="relative bg-white p-1 rounded-2xl shadow-sm">
                <div onClick={() => setSelectedPhoto(p.url)} className="w-full h-40 rounded-xl overflow-hidden bg-gray-100">
                  <img src={p.url} className="w-full h-full object-cover" alt="Ricordo" />
                </div>
                
                {myPhotoIds.includes(p.id) && (
                    <button onClick={() => deletePhoto(p.id)} className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg"><Trash2 size={14}/></button>
                )}

                {/* Reazioni Rapide */}
                <div className="flex justify-around mt-2 p-1 bg-sky-100/50 rounded-lg">
                  {REACTIONS.map(emoji => (
                    <button key={emoji} onClick={() => handleReaction(p.id, emoji)} className="text-sm flex flex-col items-center">
                      <span>{emoji}</span>
                      <span className="text-[10px] font-bold font-sans">{(p.reactions && p.reactions[emoji]) || 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))} 
          </div> 
        </div> 

        <div className={CARD}> 
          <h2 className="text-lg font-semibold mb-3">💌 I vostri messaggi</h2> 
          <div className="space-y-2 max-h-60 overflow-y-auto"> 
            {messages.map((m) => (  
              <div key={m.id} className="bg-white border border-blue-50 rounded-xl p-3 text-sm flex justify-between items-start">
                  <span>{m.text}</span>
                  {myMessageIds.includes(m.id) && (
                      <button onClick={() => deleteMessage(m.id)} className="text-red-300"><Trash2 size={14} /></button>
                  )}
              </div> 
            ))} 
          </div> 
        </div> 
      </div> 

      {/* POPUP PAGAMENTI CON COPIA */}
      {paymentOpen && ( 
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4" onClick={() => setPaymentOpen(false)}> 
          <div className="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl animate-center-pop-mobile" onClick={(e) => e.stopPropagation()}> 
            <h3 className="text-xl font-bold mb-6 text-blue-800 text-center uppercase">🧸 Un pensiero per Michi</h3> 
            <div className="space-y-4"> 
              
              <div className="p-4 bg-sky-50 rounded-2xl border border-blue-100 relative">
                <p className="font-bold text-blue-400 text-[10px] uppercase mb-1">IBAN</p>
                <p className="font-mono text-sm break-all pr-10">{IBAN}</p>
                <button onClick={() => copyToClipboard(IBAN, 'iban')} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm text-blue-500">
                  {copiedField === 'iban' ? <Check size={18}/> : <Copy size={18}/>}
                </button>
              </div> 

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 relative">
                <p className="font-bold text-orange-400 text-[10px] uppercase mb-1">PayPal</p>
                <p className="font-mono text-sm pr-10">{PAYPAL_EMAIL}</p>
                <button onClick={() => copyToClipboard(PAYPAL_EMAIL, 'paypal')} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm text-orange-500">
                  {copiedField === 'paypal' ? <Check size={18}/> : <Copy size={18}/>}
                </button>
              </div> 

            </div> 
            <Button onClick={() => setPaymentOpen(false)} className="mt-8 w-full bg-blue-500 rounded-full py-4 text-white font-bold">Chiudi</Button> 
          </div> 
        </div> 
      )} 

      {/* Foto Zoom e Grazie (Invariati) */}
      {showThanks && <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"><div className="bg-white p-4 rounded-2xl shadow-xl animate-center-pop-mobile text-blue-800 font-bold">Grazie mille da Michi! 💙</div></div>}
      {selectedPhoto && <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[9999]" onClick={() => setSelectedPhoto(null)}><img src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg" alt="Full" /></div>}
    </div> 
  ); 
}