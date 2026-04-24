"use client"; 
import { useCallback, useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { supabase } from "@/lib/supabase"; 
import { Trash2, Copy, Check, Menu, X, Home, Camera, MessageSquare } from "lucide-react"; 
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
  const [messages, setMessages] = useState<any[]>([]); 
  const [photos, setPhotos] = useState<any[]>([]); 
  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: number, type: 'photo' | 'msg'} | null>(null);
  const [myId, setMyId] = useState<string>("");

  const [currentView, setCurrentView] = useState<'all' | 'photos' | 'messages'>(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("current_view") as any) || 'all';
    return 'all';
  });

  // Gestione ID e Caricamento dati iniziali
  useEffect(() => {
    let id = localStorage.getItem("baby_user_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("baby_user_id", id);
    }
    setMyId(id);
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("current_view", currentView);
  }, [currentView]);

  const fetchData = async () => {
    try {
      const { data: photoData } = await supabase.from("Photos").select("*").order("created_at", { ascending: false });
      const { data: msgData } = await supabase.from("baby-registry").select("*").order("created_at", { ascending: false });
      if (photoData) setPhotos(photoData);
      if (msgData) setMessages(msgData);
    } catch (err) { console.error("Errore fetch:", err); }
  };

  const triggerThanks = () => {
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 3000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const addMessage = async () => { 
    if (!message.trim()) return; 
    const finalMsg = signature.trim() ? `${message.trim()} \n\n— ${signature.trim()}` : message.trim();
    
    const { data, error } = await supabase.from("baby-registry").insert([{ 
        text: finalMsg, 
        reactions: {},
        owner_id: myId 
    }]).select(); 

    if (error) {
      console.error("Errore DB:", error.message);
      return;
    }
    
    if (data) {
      setMessages(prev => [data[0], ...prev]);
      setMessage(""); setSignature(""); 
      triggerThanks();
    }
  }; 

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    const files = Array.from(e.target.files || []); 
    if (files.length === 0) return;
    
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
    
    for (const file of files) { 
      try {
        const compressedFile = await imageCompression(file, options);
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
        
        const { error: uploadError } = await supabase.storage.from("Photos").upload(fileName, compressedFile); 
        if (uploadError) throw uploadError; 
        
        const { data: urlData } = supabase.storage.from("Photos").getPublicUrl(fileName); 
        
        const { data: dbData, error: dbError } = await supabase.from("Photos").insert([{ 
            url: urlData.publicUrl, 
            reactions: {},
            owner_id: myId 
        }]).select();

        if (dbError) throw dbError;
        if (dbData) setPhotos(prev => [dbData[0], ...prev]);
      } catch (err) { console.error("Errore caricamento:", err); }
    }
    triggerThanks();
  }; 

  const confirmDeletion = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    const table = type === 'photo' ? "Photos" : "baby-registry";
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      if (type === 'photo') setPhotos(prev => prev.filter(p => p.id !== id));
      else setMessages(prev => prev.filter(m => m.id !== id));
    }
    setDeleteConfirm(null);
  };

  return ( 
    <div className="min-h-screen w-full flex flex-col items-center p-4 relative font-dreaming text-blue-800 overflow-x-hidden"> 
      <style>{` 
        @font-face { font-family: 'Dreaming'; src: url('/fonts/dreaming-outloud-pro.woff') format('woff'); } 
        .font-dreaming { font-family: 'Dreaming', cursive; } 
        @keyframes centerPopMobile { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-center-pop-mobile { animation: centerPopMobile 0.3s ease-out; }
      `}</style> 

      <div className="fixed top-4 left-4 right-4 z-[100] flex justify-between items-center">
        <Button onClick={() => setIsMenuOpen(true)} className="bg-white/80 backdrop-blur-md border border-blue-100 shadow-md !w-12 !h-12 !p-0 rounded-2xl text-blue-600"><Menu size={24} /></Button>
        <Button onClick={() => setMusicOn((v) => !v)} className="bg-white/80 backdrop-blur-md border border-blue-100 shadow-md !w-12 !h-12 !p-0 rounded-2xl">{musicOn ? "🔊" : "🔇"}</Button>
      </div>

      {/* Menu Laterale */}
      <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className={`absolute top-0 left-0 h-full w-72 bg-white shadow-2xl transition-transform duration-300 flex flex-col p-6 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="flex justify-between items-center mb-10">
                  <span className="font-bold text-xl text-blue-900">Menu</span>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-blue-50 rounded-full text-blue-600"><X size={20} /></button>
              </div>
              <nav className="space-y-4 flex-1">
                  <button onClick={() => { setCurrentView('all'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'all' ? 'bg-blue-500 text-white' : 'bg-sky-50 text-blue-800'}`}><Home size={22} /> <span className="font-sans font-bold ml-2">Home Page</span></button>
                  <button onClick={() => { setCurrentView('photos'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'photos' ? 'bg-blue-500 text-white' : 'bg-sky-50 text-blue-800'}`}><Camera size={22} /> <span className="font-sans font-bold ml-2">Tutte le Foto</span></button>
                  <button onClick={() => { setCurrentView('messages'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'messages' ? 'bg-blue-500 text-white' : 'bg-sky-50 text-blue-800'}`}><MessageSquare size={22} /> <span className="font-sans font-bold ml-2">Tutti i messaggi</span></button>
              </nav>
          </div>
      </div>

      <div className="relative z-10 text-center mt-20 mb-6 px-4"> 
          <h1 className="text-3xl font-bold">Benvenuto</h1> 
          <h2 className="text-5xl font-extrabold mt-1 text-blue-900">Michele</h2> 
      </div>

      <div className="w-full max-w-md space-y-5 z-10 relative pb-20 px-2"> 
        {/* Box Messaggio */}
        <div className={CARD}> 
          <h2 className={`text-lg font-semibold ${PRIMARY}`}>💝 Lascia un pensiero</h2> 
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi qui..." className="mt-2 bg-white" /> 
          <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Tua firma" className="mt-2 text-sm italic bg-white" /> 
          <Button onClick={addMessage} className={`mt-3 ${BTN}`}>Invia 💙</Button> 
          {currentView === 'all' && <Button onClick={() => setPaymentOpen(true)} className="mt-2 bg-amber-400 hover:bg-amber-500 text-white rounded-full py-4 text-lg shadow-md w-full font-bold">Un pensiero per Michi 🧸</Button>}
        </div>

        {/* Sezione Foto */}
        <div className={CARD}> 
            <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>📸 Foto Ricordo</h2> 
            <input id="galleryInput" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" /> 
            <Button className={BTN} onClick={() => document.getElementById("galleryInput")?.click()}>Carica Foto</Button> 
            <div className="grid grid-cols-3 gap-2 mt-4"> 
                {photos.slice(0, 6).map((p) => ( 
                <div key={p.id} className="relative h-24 bg-white rounded-xl overflow-hidden border border-sky-200">
                    <img src={p.url} className="w-full h-full object-cover" onClick={() => setSelectedPhoto(p.url)} />
                    {p.owner_id === myId && <button onClick={() => setDeleteConfirm({id: p.id, type: 'photo'})} className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full"><Trash2 size={10} /></button>}
                </div>
                ))} 
            </div> 
        </div>

        {/* Elenco Messaggi */}
        <div className={CARD}>
            <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>💌 Ultimi Messaggi</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {messages.map((m) => (
                    <div key={m.id} className="bg-white p-3 rounded-xl border border-blue-50 text-sm flex justify-between">
                        <span className="whitespace-pre-wrap">{m.text}</span>
                        {m.owner_id === myId && <button onClick={() => setDeleteConfirm({id: m.id, type: 'msg'})} className="text-red-300 ml-2"><Trash2 size={14} /></button>}
                    </div>
                ))}
            </div>
        </div>
      </div> 

      {/* Modal Pagamento (BOX PICCOLI) */}
      {paymentOpen && ( 
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] px-6" onClick={() => setPaymentOpen(false)}> 
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl" onClick={(e) => e.stopPropagation()}> 
            <h3 className="text-sm font-bold mb-4 text-blue-800 text-center uppercase tracking-tighter">🧸 Un pensiero per Michi</h3> 
            
            <div className="space-y-3"> 
              {/* Box IBAN piccolo */}
              <div className="p-3 bg-sky-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-blue-400 leading-none">IBAN</p>
                  <p className="font-mono text-[9px] text-blue-900 mt-1">{IBAN}</p>
                </div>
                <button onClick={() => copyToClipboard(IBAN, 'iban')} className="p-1.5 bg-white rounded-lg text-blue-500 shadow-sm">
                  {copiedField === 'iban' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              {/* Box PayPal piccolo */}
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-orange-400 leading-none">PAYPAL</p>
                  <p className="font-mono text-[10px] text-orange-900 mt-1">{PAYPAL_EMAIL}</p>
                </div>
                <button onClick={() => copyToClipboard(PAYPAL_EMAIL, 'paypal')} className="p-1.5 bg-white rounded-lg text-orange-500 shadow-sm">
                  {copiedField === 'paypal' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div> 

            <Button onClick={() => setPaymentOpen(false)} className="mt-6 w-full bg-blue-500 rounded-full py-2 text-sm font-bold">Chiudi</Button> 
          </div> 
        </div> 
      )} 

      {/* Pop-up ringraziamento */}
      {showThanks && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
            <div className="bg-white/