"use client"; 
import { useCallback, useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { supabase } from "@/lib/supabase"; 

const IBAN = "IT46K0347501605CC0011358676"; 
const PAYPAL_EMAIL = "antonio_caringella@libero.it"; 
const YT_VIDEO_ID = "lp-EO5I60KA"; 
const PRIMARY = "text-blue-800"; 
const BTN = "bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 text-lg shadow-md w-full"; 
const CARD = "bg-sky-50 rounded-3xl shadow-lg p-5 border border-blue-100"; 

export default function BabyRegistry() { 
  const [message, setMessage] = useState(""); 
  const [messages, setMessages] = useState<string[]>([]); 
  const [photos, setPhotos] = useState<{url: string, id: number, likes: number}[]>([]); 
  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [userLikes, setUserLikes] = useState<number[]>([]);

  useEffect(() => {
    const savedLikes = localStorage.getItem("michis_likes");
    if (savedLikes) setUserLikes(JSON.parse(savedLikes));

    const fetchData = async () => {
      const { data: photoData } = await supabase
        .from("Photos")
        .select("*")
        .order("created_at", { ascending: false });
      if (photoData) setPhotos(photoData);

      const { data: msgData } = await supabase
        .from("baby-registry")
        .select("text")
        .order("created_at", { ascending: false });
      if (msgData) setMessages(msgData.map((m) => m.text));
    };
    fetchData();
  }, []);

  const triggerThanks = () => {
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 3000);
  };

  const addMessage = useCallback(async () => { 
    if (!message.trim()) return; 
    const newMessage = message.trim(); 
    const { error } = await supabase.from("baby-registry").insert([{ text: newMessage }]); 
    if (error) { 
      alert(error.message); 
      return; 
    } 
    setMessages((prev) => [newMessage, ...prev]); 
    setMessage(""); 
    triggerThanks();
  }, [message]); 

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    const files = Array.from(e.target.files || []); 
    for (const file of files) { 
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_"); 
      const filePath = `${crypto.randomUUID()}-${safeName}`; 
      const { error: uploadError } = await supabase.storage.from("Photos").upload(filePath, file); 
      if (uploadError) continue; 
      
      const { data: urlData } = supabase.storage.from("Photos").getPublicUrl(filePath); 
      const publicUrl = urlData?.publicUrl; 
      if (publicUrl) { 
        const { data: newPhoto } = await supabase.from("Photos").insert([{ url: publicUrl, likes: 0 }]).select().single();
        if (newPhoto) setPhotos((prev) => [newPhoto, ...prev]); 
      } 
    }
    triggerThanks();
  }; 

  const handleLike = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    
    const isLiked = userLikes.includes(id);
    const newLikesCount = isLiked ? (photo.likes - 1) : (photo.likes + 1);

    const { error } = await supabase.from("Photos").update({ likes: Math.max(0, newLikesCount) }).eq('id', id);
    
    if (!error) {
      setPhotos(prev => prev.map(p => p.id === id ? {...p, likes: Math.max(0, newLikesCount)} : p));
      const updatedUserLikes = isLiked 
        ? userLikes.filter(likeId => likeId !== id) 
        : [...userLikes, id];
      setUserLikes(updatedUserLikes);
      localStorage.setItem("michis_likes", JSON.stringify(updatedUserLikes));
    }
  };

  return ( 
    <div className="min-h-screen flex flex-col items-center p-4 relative font-dreaming text-blue-800"> 
      <style>{` 
        @font-face { font-family: 'Dreaming'; src: url('/fonts/dreaming-outloud-pro.woff') format('woff'); font-weight: normal; font-style: normal; } 
        .font-dreaming { font-family: 'Dreaming', cursive; } 
        @keyframes centerPopMobile { 
          0% { transform: scale(0.7); opacity: 0; } 
          100% { transform: scale(1); opacity: 1; } 
        }
        .animate-center-pop-mobile { animation: centerPopMobile 0.3s ease-out; }
      `}</style> 

      {/* SFONDO FISSO COMPLETO */}
      <div 
        className="fixed inset-0 w-full h-full -z-20 bg-no-repeat bg-top" 
        style={{ 
          backgroundImage: "url('/bg-mobile.png')",
          backgroundSize: "contain", 
          backgroundColor: "#f0f9ff" 
        }} 
      /> 
      {/* VELO BIANCO FISSO */}
      <div className="fixed inset-0 w-full h-full bg-white/60 -z-10" /> 

      <div className="absolute top-4 right-4 z-50"> 
        <Button onClick={() => setMusicOn((v) => !v)} className={BTN + " !w-14 !p-0"}> 
          {musicOn ? "🔊" : "🔇"} 
        </Button> 
      </div> 

      {musicOn && ( 
        <iframe title="music" src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0`} allow="autoplay" className="hidden" /> 
      )} 

      <div className="relative z-10 text-center mt-10 mb-6 px-2"> 
        <h1 className="text-3xl font-bold">Benvenuto</h1> 
        <h2 className="text-5xl font-extrabold mt-1">Michele</h2> 
        <p className="mt-4 text-base leading-relaxed">
          Body e peluche sono adorabili… ma pannolini e notti insonni lo sono un po’ meno 😄 Se vuoi darci una mano, useremo il tutto per affrontare al meglio questa nuova avventura!🦊
        </p> 
        <p className="mt-3 text-lg font-semibold">9 ottobre 2026</p> 
      </div> 

      <div className="w-full max-w-md space-y-5 z-10 relative pb-20"> 
        <div className={CARD}> 
          <h2 className={`text-lg font-semibold ${PRIMARY}`}>💝 Per iniziare questa avventura</h2> 
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi un messaggio" className="mt-2" /> 
          <Button onClick={addMessage} className={`mt-3 ${BTN}`}>Invia 💙</Button> 
          <Button onClick={() => setPaymentOpen(true)} className={`mt-2 ${BTN}`}>Dettagli contributo 🧸</Button> 
        </div> 

        <div className={CARD}> 
          <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>📸 Ricordi</h2> 
          <input id="galleryInput" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" /> 
          <Button className={BTN} onClick={() => document.getElementById("galleryInput")?.click()}>
            Condividi un ricordo per Michi
          </Button> 
          
          <div className="grid grid-cols-3 gap-2 mt-4 max-h-72 overflow-y-auto pr-1 scrollbar-hide"> 
            {photos.map((p, i) => ( 
              <div key={i} className="relative group">
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(p.url)}
                  className="w-full h-24 rounded-xl shadow-sm active:scale-95 transition-transform overflow-hidden border-none p-0 m-0 outline-none"
                  style={{ backgroundImage: `url(${p.url})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'block', WebkitTapHighlightColor: 'transparent' }}
                />
                <button 
                  onClick={(e) => handleLike(p.id, e)}
                  className={`absolute bottom-1 right-1 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1 shadow-sm active:scale-125 transition-all ${userLikes.includes(p.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-black'}`}
                >
                  {userLikes.includes(p.id) ? '❤️' : '🤍'} <span className="font-sans font-bold">{p.likes || 0}</span>
                </button>
              </div>
            ))} 
          </div> 
        </div> 

        <div className={CARD}> 
          <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>💌 Messaggi</h2> 
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1"> 
            {messages.map((m, i) => (  
              <div key={i} className="bg-white border border-blue-50 rounded-xl p-3 text-sm">{m}</div> 
            ))} 
          </div> 
        </div> 
      </div> 

      {showThanks && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 pointer-events-none">
          <div className="bg-white/95 border-2 border-blue-100 rounded-2xl p-4 shadow-xl flex items-center gap-2 animate-center-pop-mobile max-w-[280px]">
            <span className="text-3xl">🧦🧸</span>
            <div className="text-blue-800 font-bold text-sm flex items-center gap-1">
              Grazie mille da Michi! 💙
            </div>
          </div>
        </div>
      )}

      {paymentOpen && ( 
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setPaymentOpen(false)}> 
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}> 
            <h3 className="text-lg font-semibold mb-4 text-blue-800 text-center uppercase tracking-widest">🧸 Contributo</h3> 
            <div className="space-y-3 text-sm"> 
              <div className="p-4 bg-sky-50 rounded-2xl border border-blue-100">
                <p className="font-bold text-blue-400 text-xs uppercase mb-1">IBAN</p>
                <p className="font-mono">{IBAN}</p>
              </div> 
              <div className="p-4 bg-sky-50 rounded-2xl border border-blue-100">
                <p className="font-bold text-blue-400 text-xs uppercase mb-1">PayPal</p>
                <p className="font-mono">{PAYPAL_EMAIL}</p>
              </div> 
            </div> 
            <Button onClick={() => setPaymentOpen(false)} className="mt-5 w-full bg-blue-500 rounded-full py-3">Chiudi</Button> 
          </div> 
        </div> 
      )} 

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[9999]" onClick={() => setSelectedPhoto(null)}>
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Full" onClick={(e) => e.stopPropagation()} />
            <button className="absolute top-0 right-0 p-4 text-white text-6xl leading-none font-light outline-none" onClick={() => setSelectedPhoto(null)}>×</button>
          </div>
        </div>
      )}
    </div> 
  ); 
}