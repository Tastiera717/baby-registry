"use client"; 
import { useCallback, useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { supabase } from "@/lib/supabase"; 
import { Trash2, Copy, Check, AlertCircle, Menu, X, Home, Camera, MessageSquare } from "lucide-react"; 
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
  const [messages, setMessages] = useState<{id: number, text: string, reactions?: any, owner_id?: string}[]>([]); 
  const [photos, setPhotos] = useState<{url: string, id: number, reactions?: any, owner_id?: string}[]>([]); 
  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: number, type: 'photo' | 'msg'} | null>(null);

  // Mantiene la vista corrente dopo il refresh
  const [currentView, setCurrentView] = useState<'all' | 'photos' | 'messages'>(() => {
    if (typeof window !== "undefined") {
      const savedView = localStorage.getItem("current_view");
      return (savedView as 'all' | 'photos' | 'messages') || 'all';
    }
    return 'all';
  });

  // Salva la vista quando cambia
  useEffect(() => {
    localStorage.setItem("current_view", currentView);
  }, [currentView]);

  // ID utente persistente per la cancellazione dei propri contenuti
  const [myId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("baby_user_id");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("baby_user_id", id);
      }
      return id;
    }
    return "";
  });

  const [myPhotoReactions, setMyPhotoReactions] = useState<Record<number, string>>({});
  const [myMsgReactions, setMyMsgReactions] = useState<Record<number, string>>({});

  const fetchData = async () => {
    const { data: photoData } = await supabase.from("Photos").select("*").order("created_at", { ascending: false });
    const { data: msgData } = await supabase.from("baby-registry").select("*").order("created_at", { ascending: false });
    
    // Assicuriamoci che le reazioni siano inizializzate se null
    if (photoData) setPhotos(photoData.map(p => ({...p, reactions: p.reactions || {}})));
    if (msgData) setMessages(msgData.map(m => ({...m, reactions: m.reactions || {}})));
  };

  useEffect(() => {
    const savedPReac = localStorage.getItem("my_p_reac");
    if (savedPReac) setMyPhotoReactions(JSON.parse(savedPReac));
    const savedMReac = localStorage.getItem("my_m_reac");
    if (savedMReac) setMyMsgReactions(JSON.parse(savedMReac));
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
    const { data, error } = await supabase.from("baby-registry").insert([{ 
        text: finalMsg, 
        reactions: {},
        owner_id: myId 
    }]).select().single(); 
    if (error) return; 
    if (data) setMessages((prev) => [{...data, reactions: {}}, ...prev]);
    setMessage(""); setSignature(""); triggerThanks();
  }, [message, signature, myId]); 

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
          const { data: newPhoto } = await supabase.from("Photos").insert([{ 
              url: urlData.publicUrl, 
              reactions: {},
              owner_id: myId 
          }]).select().single();
          if (newPhoto) setPhotos((prev) => [{...newPhoto, reactions: {}}, ...prev]);
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
      currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 0) - 1);
      delete updatedMyReactions[id];
    } else {
      if (previousEmoji) currentReactions[previousEmoji] = Math.max(0, (currentReactions[previousEmoji] || 0) - 1);
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

  const confirmDeletion = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    const table = type === 'photo' ? "Photos" : "baby-registry";
    await supabase.from(table).delete().eq('id', id);
    
    if (type === 'photo') {
      setPhotos(prev => prev.filter(p => p.id !== id));
    } else {
      setMessages(prev => prev.filter(m => m.id !== id));
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
        .top-bar-fill { position: fixed; top: 0; left: 0; right: 0; height: env(safe-area-inset-top, 44px); background-color: #f0f9ff; z-index: 100; }
      `}</style> 

      <div className="top-bar-fill" />
      <div className="fixed inset-0 w-full h-full -z-20 bg-no-repeat bg-top pointer-events-none" style={{ backgroundImage: "url('/bg-mobile.png')", backgroundSize: "145%", backgroundColor: "#f0f9ff", marginTop: "-1px" }} /> 
      <div className="fixed inset-0 w-full h-full bg-white/60 -z-10 pointer-events-none" /> 

      <div className="fixed top-4 left-4 right-4 z-[100] flex justify-between items-center">
        <Button onClick={() => setIsMenuOpen(true)} className="bg-white/80 backdrop-blur-md border border-blue-100 shadow-md !w-12 !h-12 !p-0 rounded-2xl text-blue-600">
            <Menu size={24} />
        </Button>
        <Button onClick={() => setMusicOn((v) => !v)} className="bg-white/80 backdrop-blur-md border border-blue-100 shadow-md !w-12 !h-12 !p-0 rounded-2xl">
            {musicOn ? "🔊" : "🔇"}
        </Button>
      </div>

      {/* MENU LATERALE */}
      <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className={`absolute top-0 left-0 h-full w-72 bg-white shadow-2xl transition-transform duration-300 flex flex-col p-6 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="flex justify-between items-center mb-10">
                  <span className="font-bold text-xl text-blue-900">Menu</span>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-blue-50 rounded-full text-blue-600"><X size={20} /></button>
              </div>
              <nav className="space-y-4 flex-1">
                  <button onClick={() => { setCurrentView('all'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentView === 'all' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}>
                      <Home size={22} /> <span className="font-sans font-bold">Home Page</span>
                  </button>
                  <button onClick={() => { setCurrentView('photos'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentView === 'photos' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}>
                      <Camera size={22} /> <span className="font-sans font-bold">Tutte le Foto</span>
                  </button>
                  <button onClick={() => { setCurrentView('messages'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentView === 'messages' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}>
                      <MessageSquare size={22} /> <span className="font-sans font-bold">Tutti i messaggi</span>
                  </button>
              </nav>
          </div>
      </div>

      {musicOn && <iframe title="music" src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0`} allow="autoplay" className="hidden" />} 

      {/* HEADER TITOLO */}
      <div className="relative z-10 text-center mt-20 mb-6 px-4"> 
          {currentView === 'all' ? (
              <>
                <h1 className="text-3xl font-bold">Benvenuto</h1> 
                <h2 className="text-5xl font-extrabold mt-1 text-blue-900">Michele</h2> 
                <div className="mt-6 space-y-4 text-base leading-relaxed max-w-sm mx-auto text-blue-800">
                    <p>Abbiamo creato questo spazio per raccogliere i vostri <b>messaggi</b> e le <b>foto ricordo</b> più belle, così da iniziare a scrivere insieme il primo capitolo della vita di Michi.</p>
                    <p>Sappiamo che body e peluche sono adorabili… ma pannolini e notti insonni lo sono un po’ meno 😄 Se desiderate partecipare a questa avventura con un piccolo pensiero, ve ne saremo molto grati e ci aiuterete ad affrontare al meglio ogni nuova sfida! 🦊</p>
                </div>
                <p className="mt-4 text-lg font-semibold border-t border-blue-200 pt-4 inline-block px-8">9 ottobre 2026</p> 
              </>
          ) : (
              <h2 className="text-4xl font-extrabold text-blue-900">
                  {currentView === 'photos' ? '📸 Foto Ricordo' : '💌 Messaggi'}
              </h2>
          )}
      </div>

      <div className="w-full max-w-md space-y-5 z-10 relative pb-20 px-2"> 
        
        {/* BOX INVIO MESSAGGIO */}
        {(currentView === 'all' || currentView === 'messages') && (
            <div className={CARD}> 
              <h2 className={`text-lg font-semibold ${PRIMARY}`}>💝 Per iniziare questa avventura</h2> 
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi un messaggio" className="mt-2" /> 
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Tua firma (opzionale)" className="mt-2 text-sm italic" /> 
              <Button onClick={addMessage} className={`mt-3 ${BTN}`}>Invia 💙</Button> 
              {currentView === 'all' && <Button onClick={() => setPaymentOpen(true)} className={`mt-2 ${BTN}`}>Un pensiero per Michi 🧸</Button>}
              
              {currentView === 'messages' && (
                  <div className="space-y-4 mt-6 border-t border-blue-100 pt-4 max-h-[60vh] overflow-y-auto"> 
                    {messages.map((m) => (  
                        <div key={m.id} className="bg-white border border-blue-50 rounded-xl p-