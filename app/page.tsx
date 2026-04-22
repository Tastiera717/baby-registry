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
const CARD = "bg-sky-50 rounded-3xl shadow-lg p-5"; 

export default function BabyRegistry() { 
  const [message, setMessage] = useState(""); 
  const [messages, setMessages] = useState<string[]>([]); 
  const [photos, setPhotos] = useState<string[]>([]); 
  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: photoData } = await supabase
        .from("Photos")
        .select("*")
        .order("created_at", { ascending: false });
      if (photoData) setPhotos(photoData.map((p) => p.url));

      const { data: msgData } = await supabase
        .from("baby-registry")
        .select("text")
        .order("created_at", { ascending: false });
      if (msgData) setMessages(msgData.map((m) => m.text));
    };
    fetchData();
  }, []);

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
        await supabase.from("Photos").insert([{ url: publicUrl }]); 
        setPhotos((prev) => [publicUrl, ...prev]); 
      } 
    } 
  }; 

  const babyMessage = "Body e peluche sono adorabili… ma pannolini e notti insonni lo sono un po’ meno 😄 Se vuoi darci una mano, useremo il tutto per affrontare al meglio questa nuova avventura!🦊"; 

  return ( 
    <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden font-dreaming text-blue-800"> 
      {/* FONT CUSTOM RIPRISTINATO */}
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
      `}</style> 

      <div className="absolute inset-0 bg-no-repeat bg-top bg-cover" style={{ backgroundImage: "url('/bg-mobile.png')" }} /> 
      <div className="absolute inset-0 bg-white/70" /> 

      <div className="absolute top-4 right-4 z-50"> 
        <Button onClick={() => setMusicOn((v) => !v)} className={BTN}> 
          {musicOn ? "🔊" : "🔇"} 
        </Button> 
      </div> 

      {musicOn && ( 
        <iframe title="music" src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0`} allow="autoplay" className="hidden" /> 
      )} 

      {/* HEADER RIPRISTINATO */}
      <div className="relative z-10 text-center mt-10 mb-6 px-2"> 
        <h1 className="text-3xl font-bold">Benvenuto</h1> 
        <h2 className="text-5xl font-extrabold mt-1">Michele</h2> 
        <p className="mt-4 text-base leading-relaxed">
          {babyMessage}
        </p> 
        <p className="mt-3 text-lg font-semibold">9 ottobre 2026</p> 
      </div> 

      <div className="w-full max-w-md space-y-5 z-10 relative"> 
        {/* MESSAGGIO RIPRISTINATO */}
        <div className={CARD}> 
          <h2 className={`text-lg font-semibold ${PRIMARY}`}>💝 Per iniziare questa avventura</h2> 
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi un messaggio" className="mt-2" /> 
          <Button onClick={addMessage} className={`mt-3 ${BTN}`}>Invia 💙</Button> 
          <Button onClick={() => setPaymentOpen(true)} className={`mt-2 ${BTN}`}>Dettagli contributo 🧸</Button> 
        </div> 

        {/* FOTO RIPRISTINATO */}
        <div className={CARD}> 
          <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>📸 Ricordi</h2> 
          <input id="galleryInput" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" /> 
          <Button className={BTN} onClick={() => document.getElementById("galleryInput")?.click()}>
            Condividi un ricordo per Miki
          </Button> 
          
          <div className="grid grid-cols-3 gap-2 mt-4"> 
            {photos.map((p, i) => ( 
              <button
                key={i} 
                type="button"
                onClick={() => setSelectedPhoto(p)}
                className="w-full h-24 rounded-xl shadow-sm active:scale-95 transition-transform overflow-hidden border-none p-0 m-0 outline-none"
                style={{ 
                  backgroundImage: `url(${p})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center',
                  WebkitTapHighlightColor: 'transparent',
                  display: 'block'
                }}
              />
            ))} 
          </div> 
        </div> 

        {/* MESSAGGI RIPRISTINATO */}
        <div className={CARD}> 
          <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>💌 Messaggi</h2> 
          <div className="space-y-2"> 
            {messages.map((m, i) => ( 
              <div key={i} className="bg-white rounded-xl p-3 text-sm">{m}</div> 
            ))} 
          </div> 
        </div> 
      </div> 

      {paymentOpen && ( 
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPaymentOpen(false)}> 
          <div className="bg-white rounded-3xl p-6 w-[90%] max-w-md" onClick={(e) => e.stopPropagation()}> 
            <h3 className="text-lg font-semibold mb-4 text-blue-800">🧸 Contributo</h3> 
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
            <Button onClick={() => setPaymentOpen(false)} className="mt-5 w-full">Chiudi</Button> 
          </div> 
        </div> 
      )} 

      {/* LIGHTBOX PER FOTO A TUTTO SCHERMO */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[9999]" 
          style={{ touchAction: 'none' }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={selectedPhoto} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
              alt="Anteprima"
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
              className="absolute top-0 right-0 p-4 text-white text-6xl leading-none font-light outline-none"
              onClick={() => setSelectedPhoto(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div> 
  ); 
}