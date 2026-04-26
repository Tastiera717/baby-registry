"use client"; 
import { useCallback, useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { supabase } from "@/lib/supabase"; 
import { Trash2, Copy, Check, AlertCircle, Menu, X, Home, Camera, MessageSquare, Lock, Plus, ExternalLink, Gift } from "lucide-react"; 
import imageCompression from 'browser-image-compression';

// COSTANTI
const IBAN = "IT46K0347501605CC0011358676"; 
const PAYPAL_EMAIL = "antonio_caringella@libero.it"; 
const YT_VIDEO_ID = "lp-EO5I60KA"; 
const PRIMARY = "text-blue-800"; 
const BTN = "bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 text-lg shadow-md w-full font-bold"; 
const CARD = "bg-sky-50 rounded-3xl shadow-lg p-5 border border-blue-100"; 
const REACTIONS = ["❤️", "🧸", "✨", "👶"];
const ACCESS_PASSWORD = "Babonzo!"; 
const ADMIN_PASSWORD = "Babonzo@"; 

export default function BabyRegistry() { 
  // State Messaggi e Foto
  const [message, setMessage] = useState(""); 
  const [signature, setSignature] = useState(""); 
  const [messages, setMessages] = useState<{id: number, text: string, reactions?: any}[]>([]); 
  const [photos, setPhotos] = useState<{url: string, id: number, reactions?: any}[]>([]); 
  
  // State Lista Desideri
  const [wishes, setWishes] = useState<{id: number, name: string, link: string, image_url: string, is_purchased: boolean}[]>([]);
  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [isAddingWish, setIsAddingWish] = useState(false);
  const [newWish, setNewWish] = useState({ name: "", link: "" });
  const [adminPassInput, setAdminPassInput] = useState("");
  const [wishToDelete, setWishToDelete] = useState<number | null>(null);

  // State UI/UX
  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'all' | 'photos' | 'messages' | 'wishes'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{id: number, type: 'photo' | 'msg'} | null>(null);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passError, setPassError] = useState(false);

  // Local Storage IDs
  const [myMessageIds, setMyMessageIds] = useState<number[]>([]);
  const [myPhotoIds, setMyPhotoIds] = useState<number[]>([]);
  const [myPurchasedWishIds, setMyPurchasedWishIds] = useState<number[]>([]);
  const [myPhotoReactions, setMyPhotoReactions] = useState<Record<number, string>>({});
  const [myMsgReactions, setMyMsgReactions] = useState<Record<number, string>>({});

  // INIZIALIZZAZIONE
  useEffect(() => {
    const authStatus = localStorage.getItem("baby_auth");
    if (authStatus === "true") setIsAuthenticated(true);
    const savedView = localStorage.getItem("last_view");
    if (savedView) setCurrentView(savedView as any);
    const savedMsgs = localStorage.getItem("my_messages");
    if (savedMsgs) setMyMessageIds(JSON.parse(savedMsgs));
    const savedPhotos = localStorage.getItem("my_photos");
    if (savedPhotos) setMyPhotoIds(JSON.parse(savedPhotos));
    const savedPReac = localStorage.getItem("my_p_reac");
    if (savedPReac) setMyPhotoReactions(JSON.parse(savedPReac));
    const savedMReac = localStorage.getItem("my_m_reac");
    if (savedMReac) setMyMsgReactions(JSON.parse(savedMReac));
    const savedPurchased = localStorage.getItem("my_purchased_wishes");
    if (savedPurchased) setMyPurchasedWishIds(JSON.parse(savedPurchased));
  }, []);

  useEffect(() => {
    localStorage.setItem("last_view", currentView);
  }, [currentView]);

  const fetchData = async () => {
    const { data: pData } = await supabase.from("Photos").select("*").order("created_at", { ascending: false });
    if (pData) setPhotos(pData.map(p => ({ ...p, reactions: p.reactions || {} })));
    const { data: mData } = await supabase.from("baby-registry").select("*").order("created_at", { ascending: false });
    if (mData) setMessages(mData.map(m => ({ ...m, reactions: m.reactions || {} })));
    const { data: wData } = await supabase.from("Wishes").select("*").order("created_at", { ascending: false });
    if (wData) setWishes(wData);
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === ACCESS_PASSWORD) {
     localStorage.setItem("baby_auth", "true");
      setIsAuthenticated(true);
    } else {
      setPassError(true);
      setTimeout(() => setPassError(false), 2000);
    }
  };

  const checkAdminPass = () => {
    if (adminPassInput === ADMIN_PASSWORD) {
        setIsAddingWish(true);
        setAdminPassInput("");
    } else {
        alert("Password errata!");
    }
  };

  const handleAdminDelete = () => {
    if (adminPassInput === ADMIN_PASSWORD) {
        if (wishToDelete) deleteWish(wishToDelete);
    } else {
        alert("Password errata!");
    }
  };

  const addWish = async () => {
    if (!newWish.name) return;
    let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(newWish.name)}&background=f0f9ff&color=0369a1&size=256`;
    if (newWish.link) {
        try { 
          const domain = new URL(newWish.link).hostname;
          imgUrl = `https://logo.clearbit.com/${domain}`; 
        } catch(e) {}
    }
    const { data, error } = await supabase.from("Wishes").insert([{ 
        name: newWish.name, 
        link: newWish.link, 
        image_url: imgUrl,
        is_purchased: false 
    }]).select().single();
    if (!error && data) {
        setWishes([data, ...wishes]);
        setWishModalOpen(false);
        setIsAddingWish(false);
        setNewWish({ name: "", link: "" });
    }
  };

  const togglePurchased = async (id: number, currentStatus: boolean) => {
    if (currentStatus && !myPurchasedWishIds.includes(id)) {
        alert("Solo chi ha segnato il regalo come acquistato può annullare questa azione.");
        return;
    }
    const { error } = await supabase.from("Wishes").update({ is_purchased: !currentStatus }).eq('id', id);
    if (!error) {
        setWishes(wishes.map(w => w.id === id ? { ...w, is_purchased: !currentStatus } : w));
        let updatedIds = [...myPurchasedWishIds];
        if (!currentStatus) { updatedIds.push(id); } else { updatedIds = updatedIds.filter(item => item !== id); }
        setMyPurchasedWishIds(updatedIds);
        localStorage.setItem("my_purchased_wishes", JSON.stringify(updatedIds));
    }
  };

  const deleteWish = async (id: number) => {
    const { error } = await supabase.from("Wishes").delete().eq('id', id);
    if (!error) {
        setWishes(wishes.filter(w => w.id !== id));
        setWishToDelete(null);
        setAdminPassInput("");
        setWishModalOpen(false);
    }
  };

  const addMessage = useCallback(async () => {
    if (!message.trim()) return; 
    const finalMsg = signature.trim() ? `${message.trim()} \n\n— ${signature.trim()}` : message.trim();
    const { data, error } = await supabase.from("baby-registry").insert([{ text: finalMsg, reactions: {} }]).select().single(); 
    if (!error && data) {
        setMessages((prev) => [data, ...prev]);
        setMyMessageIds((prev) => {
            const up = [...prev, data.id];
            localStorage.setItem("my_messages", JSON.stringify(up));
            return up;
        });
        setMessage(""); setSignature(""); triggerThanks();
    }
  }, [message, signature]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    const files = Array.from(e.target.files || []); 
    const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
    for (const file of files) { 
      try {
        const compressedFile = await imageCompression(file, options);
        const filePath = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`; 
        await supabase.storage.from("Photos").upload(filePath, compressedFile); 
        const { data: urlData } = supabase.storage.from("Photos").getPublicUrl(filePath); 
        if (urlData?.publicUrl) { 
          const { data: newP } = await supabase.from("Photos").insert([{ url: urlData.publicUrl, reactions: {} }]).select().single();
          if (newP) {
              setPhotos((prev) => [newP, ...prev]);
              setMyPhotoIds((prev) => {
                  const up = [...prev, newP.id];
                  localStorage.setItem("my_photos", JSON.stringify(up));
                  return up;
              });
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
    const myCurrent = type === 'photo' ? myPhotoReactions : myMsgReactions;
    const prevEmoji = myCurrent[id];
    let updatedMy = { ...myCurrent };
    if (prevEmoji === emoji) {
        currentReactions[emoji] = Math.max(0, (Number(currentReactions[emoji]) || 1) - 1);
        delete updatedMy[id];
    } else {
        if (prevEmoji) currentReactions[prevEmoji] = Math.max(0, (Number(currentReactions[prevEmoji]) || 1) - 1);
        currentReactions[emoji] = (Number(currentReactions[emoji]) || 0) + 1;
        updatedMy[id] = emoji;
    }
    const table = type === 'photo' ? "Photos" : "baby-registry";
    const { error } = await supabase.from(table).update({ reactions: currentReactions }).eq('id', id);
    if (!error) {
        if (type === 'photo') {
            setPhotos(prev => prev.map(p => p.id === id ? { ...p, reactions: currentReactions } : p));
            setMyPhotoReactions(updatedMy);
            localStorage.setItem("my_p_reac", JSON.stringify(updatedMy));
        } else {
            setMessages(prev => prev.map(m => m.id === id ? { ...m, reactions: currentReactions } : m));
            setMyMsgReactions(updatedMy);
            localStorage.setItem("my_m_reac", JSON.stringify(updatedMy));
        }
    }
  };

  const triggerThanks = () => { setShowThanks(true); setTimeout(() => setShowThanks(false), 3000); };
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-sky-50 relative font-dreaming text-center overflow-hidden">
        <style>{`@font-face { font-family: 'Dreaming'; src: url('/fonts/dreaming-outloud-pro.woff') format('woff'); }`}</style>
        <div className="fixed inset-0 w-full h-full -z-10 bg-no-repeat bg-top opacity-30" style={{ backgroundImage: "url('/bg-mobile.png')", backgroundSize: "145%" }} />
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-blue-100 animate-center-pop-mobile">
          <Lock size={35} className="mx-auto mb-6 text-blue-500" />
          <h2 className="text-4xl font-extrabold text-blue-900 mb-8 tracking-tight">Benvenuto</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="password" placeholder="La Password..." value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className={`text-center py-6 rounded-2xl border-2 ${passError ? 'border-red-400' : 'border-blue-100'}`} />
            <Button onClick={() => handleLogin()} className={BTN}>Entra ✨</Button>
          </form>
        </div>
      </div>
    );
  }

  return ( 
    <div className="min-h-screen w-full flex flex-col items-center p-4 relative font-dreaming text-blue-800 overflow-x-hidden pb-20"> 
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
        <Button onClick={() => setIsMenuOpen(true)} className="bg-white/80 backdrop-blur-md border border-blue-100 shadow-md !w-12 !h-12 !p-0 rounded-2xl text-blue-600"><Menu size={24} /></Button>
        {currentView === 'wishes' ? (
             <Button onClick={() => setWishModalOpen(true)} className="bg-blue-500 text-white shadow-md !w-12 !h-12 !p-0 rounded-2xl"><Plus size={24} /></Button>
        ) : (
             <Button onClick={() => setMusicOn((v) => !v)} className="bg-white/80 backdrop-blur-md border border-blue-100 shadow-md !w-12 !h-12 !p-0 rounded-2xl">{musicOn ? "🔊" : "🔇"}</Button>
        )}
      </div>

      <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className={`absolute top-0 left-0 h-full w-72 bg-white transition-transform duration-300 p-6 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="flex justify-between items-center mb-10 text-blue-900 font-bold text-xl">Menu <X onClick={() => setIsMenuOpen(false)} /></div>
              <nav className="space-y-4 font-sans font-bold">
                  <button onClick={() => { setCurrentView('all'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'all' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}><Home size={20} /> Home Page</button>
                  <button onClick={() => { setCurrentView('photos'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'photos' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}><Camera size={20} /> Tutti i Ricordi</button>
                  <button onClick={() => { setCurrentView('messages'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'messages' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}><MessageSquare size={20} /> Tutti i Messaggi</button>
                  <button onClick={() => { setCurrentView('wishes'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'wishes' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}><Gift size={20} /> Lista dei desideri</button>
              </nav>
          </div>
      </div>

      {musicOn && <iframe title="music" src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0`} allow="autoplay" className="hidden" />} 

      <div className="relative z-10 text-center mt-20 mb-6 px-4"> 
          {currentView === 'all' ? (
              <>
                <h1 className="text-3xl font-bold">Benvenuto</h1> 
                <h2 className="text-5xl font-extrabold mt-1 text-blue-900">Michele</h2> 
                <div className="mt-6 space-y-4 text-base leading-relaxed max-w-sm mx-auto text-blue-800">
                    <p>Abbiamo creato questo spazio per raccogliere i vostri <b>messaggi</b> e le <b>foto ricordo</b> più belle, così da iniziare a scrivere insieme il primo capitolo della vita di Michi! 💙</p>
                    <p>Sappiamo che body e peluche sono adorabili… ma pannolini e notti insonni lo sono un po’ meno 😄 Se desiderate partecipare a questa avventura con un piccolo pensiero, ve ne saremo molto grati! 🦊</p>
                </div>
                <p className="mt-4 text-lg font-semibold border-t border-blue-200 pt-4 inline-block px-8 font-sans">9 Ottobre 2026</p> 
              </>
          ) : (
              <h2 className="text-4xl font-extrabold text-blue-900">
                {currentView === 'photos' && '📸 Ricordi'}
                {currentView === 'messages' && '💌 Messaggi'}
                {currentView === 'wishes' && '🎁 Lista Desideri'}
              </h2>
          )}
      </div>

      <div className="w-full max-w-md space-y-5 z-10 relative px-2"> 
        
        {(currentView === 'all' || currentView === 'messages') && (
            <div className={CARD}> 
              <h2 className={`text-lg font-semibold ${PRIMARY}`}>💌 Messaggi</h2> 
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi un messaggio" className="mt-2" /> 
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Tua firma (opzionale)" className="mt-2 text-sm italic" /> 
              <Button onClick={addMessage} className={`mt-3 ${BTN}`}>Invia 💙</Button> 
              <div className="space-y-4 mt-6 border-t border-blue-100 pt-4"> 
                {messages.slice(0, currentView === 'all' ? 5 : undefined).map((m) => ( 
                    <div key={m.id} className="bg-white border border-blue-50 rounded-xl p-3 shadow-sm">
                        <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-sm whitespace-pre-wrap font-sans">{m.text}</span>
                            {myMessageIds.includes(m.id) && (
                                <button onClick={() => setDeleteConfirm({id: m.id, type: 'msg'})} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
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
              {currentView === 'all' && (
                  <Button variant="ghost" onClick={() => setCurrentView('messages')} className="w-full mt-4 text-blue-400 text-xs uppercase font-bold">Vedi tutti i messaggi</Button>
              )}
           </div> 
        )}

        {currentView === 'all' && (
            <div className={CARD}> 
              <h2 className={`text-lg font-semibold ${PRIMARY}`}>💝 Per iniziare questa avventura</h2> 
              <p className="mt-2 text-sm text-blue-800/80 italic">Se desideri partecipare con un pensiero clicca sotto</p>
              <Button onClick={() => setPaymentOpen(true)} className={`mt-3 ${BTN}`}>Un pensiero per Michi 🧸</Button>
              <Button onClick={() => setCurrentView('wishes')} className={`mt-3 ${BTN}`}>Lista dei desideri 🎁</Button>
           </div> 
        )}

        {currentView === 'wishes' && (
            <div className="space-y-4 animate-center-pop-mobile">
                {wishes.length === 0 && <p className="text-center italic opacity-50 pt-10">La lista è in fase di allestimento... 🧸</p>}
                {wishes.map((w) => (
                    <div key={w.id} className={`relative rounded-3xl p-4 shadow-md border flex items-center gap-4 transition-all overflow-hidden ${w.is_purchased ? 'bg-gray-100 border-gray-200 grayscale-[0.8]' : 'bg-white border-blue-100'}`}>
                        {w.is_purchased && <div className="absolute inset-0 bg-gray-400/20 pointer-events-none z-10" />}
                        
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-sky-50 flex-shrink-0">
                           <img src={w.image_url} className={`w-full h-full object-cover ${w.is_purchased ? 'opacity-50' : ''}`} alt={w.name} onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}&background=f0f9ff&color=0369a1`} />
                        </div>
                        
                        <div className="flex-1 overflow-hidden relative min-h-[90px] py-1">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className={`font-sans font-bold text-blue-900 truncate leading-tight ${w.is_purchased ? 'line-through text-gray-500' : ''}`}>{w.name}</h3>
                                {w.is_purchased && (
                                   <span className="bg-red-500 text-white px-2 py-0.5 rounded-full font-bold text-[9px] shadow-sm border border-white uppercase flex-shrink-0 z-20">Preso! 🎁</span>
                                )}
                            </div>
                            
                            {w.link && !w.is_purchased && (
                                <a href={w.link} target="_blank" className="text-blue-500 text-xs flex items-center gap-1 mt-1 underline"><ExternalLink size={12} /> Vedi Prodotto</a>
                            )}
                            
                            <div className="flex items-center gap-2 mt-4">
                                {(!w.is_purchased || myPurchasedWishIds.includes(w.id)) && (
                                  <button onClick={() => togglePurchased(w.id, w.is_purchased)} className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-full transition-all z-20 ${w.is_purchased ? 'bg-white text-red-500 border border-red-200 shadow-sm' : 'bg-sky-100 text-blue-600'}`}>
                                      {w.is_purchased ? 'Ho cambiato idea' : 'Segna come Acquistato'}
                                  </button>
                                )}
                            </div>
                            
                            {/* CESTINO POSIZIONATO IN BASSO A DESTRA */}
                            <button 
                                onClick={() => { setWishToDelete(w.id); setWishModalOpen(true); }} 
                                className="absolute bottom-0 right-0 p-2 text-red-400 hover:text-red-600 transition-colors z-30"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {(currentView === 'all' || currentView === 'photos') && (
            <div className={CARD}> 
                <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>📸 Ricordi</h2> 
                <input id="galleryInput" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" /> 
                <Button className={BTN} onClick={() => document.getElementById("galleryInput")?.click()}>Condividi un ricordo per Michi ✨</Button> 
                <div className={`grid ${currentView === 'photos' ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mt-4`}> 
                    {photos.slice(0, currentView === 'all' ? 6 : undefined).map((p) => ( 
                    <div key={p.id} className="relative flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-sky-200">
                        <div onClick={() => setSelectedPhoto(p.url)} className={`w-full ${currentView === 'photos' ? 'h-40' : 'h-24'} bg-gray-100`}>
                            <img src={p.url} className="w-full h-full object-cover" alt="Foto" />
                        </div>
                        {myPhotoIds.includes(p.id) && (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({id: p.id, type: 'photo'}); }} className="absolute top-1 left-1 bg-red-500/80 text-white rounded-full p-1 z-10"><Trash2 size={12} /></button>
                        )}
                        <div className="flex justify-around items-center py-1 bg-sky-50/50">
                            {REACTIONS.map(emoji => (
                                <button key={emoji} onClick={() => handleGenericReaction(p.id, emoji, 'photo')} className={`flex flex-col items-center ${myPhotoReactions[p.id] === emoji ? 'scale-110 bg-blue-100 rounded-md px-0.5' : ''}`}>
                                    <span className="text-xs">{emoji}</span>
                                    <span className="text-[8px] font-sans font-bold">{p.reactions?.[emoji] || 0}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    ))} 
                </div> 
                {currentView === 'all' && (
                    <Button variant="ghost" onClick={() => setCurrentView('photos')} className="w-full mt-4 text-blue-400 text-xs uppercase font-bold">Vedi tutti i ricordi</Button>
                )}
           </div> 
        )}
      </div> 

      {paymentOpen && ( 
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] px-4" onClick={() => setPaymentOpen(false)}> 
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-center-pop-mobile" onClick={(e) => e.stopPropagation()}> 
            <h3 className="text-lg font-semibold mb-2 text-blue-800 text-center uppercase tracking-widest">🧸 Un pensiero per Michi</h3> 
            <p className="text-center text-xs text-blue-600/70 mb-5 font-sans leading-relaxed">Qualora desideri partecipare con un contributo libero trovi sotto le informazioni che possono servirti</p>
            <div className="space-y-3"> 
              <div className="p-4 bg-sky-50 rounded-2xl border border-blue-100 flex justify-between items-center">
                <div className="overflow-hidden"><p className="font-bold text-blue-400 text-[10px] uppercase mb-1">IBAN</p><p className="font-mono text-xs truncate">{IBAN}</p></div>
                <button onClick={() => copyToClipboard(IBAN, 'iban')} className="ml-2 p-2 bg-white rounded-xl shadow-sm text-blue-500">{copiedField === 'iban' ? <Check size={18} /> : <Copy size={18} />}</button>
              </div> 
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
                <div><p className="font-bold text-orange-400 text-[10px] uppercase mb-1">PayPal</p><p className="font-mono text-xs">{PAYPAL_EMAIL}</p></div>
                <button onClick={() => copyToClipboard(PAYPAL_EMAIL, 'paypal')} className="ml-2 p-2 bg-white rounded-xl shadow-sm text-orange-500">{copiedField === 'paypal' ? <Check size={18} /> : <Copy size={18} />}</button>
              </div> 
            </div> 
            <Button onClick={() => setPaymentOpen(false)} className="mt-5 w-full bg-blue-500 rounded-full py-3">Chiudi</Button> 
          </div> 
        </div> 
      )} 

      {wishModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[200] px-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-center-pop-mobile">
                {!isAddingWish ? (
                    <div className="text-center">
                        <Lock className="mx-auto mb-4 text-blue-400" />
                        <h3 className="text-xl font-bold mb-4 font-sans">Area Genitori</h3>
                        <Input type="password" placeholder="Inserisci Password..." value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} className="mb-4 text-center" />
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => { setWishModalOpen(false); setWishToDelete(null); }} className="flex-1 font-sans">Annulla</Button>
                            <Button onClick={wishToDelete ? handleAdminDelete : checkAdminPass} className={`flex-1 font-sans ${wishToDelete ? 'bg-red-500 text-white' : 'bg-blue-500'}`}>Conferma</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 font-sans">
                        <h3 className="font-bold text-center text-blue-900">Nuovo Desiderio</h3>
                        <Input placeholder="Nome Oggetto (es. Passeggino)" value={newWish.name} onChange={(e) => setNewWish({ ...newWish, name: e.target.value })} />
                        <Input placeholder="Link Prodotto (opzionale)" value={newWish.link} onChange={(e) => setNewWish({ ...newWish, link: e.target.value })} />
                        <Button onClick={addWish} className="w-full bg-blue-500">Aggiungi ✨</Button>
                        <Button variant="ghost" onClick={() => { setIsAddingWish(false); setWishModalOpen(false); }} className="w-full">Chiudi</Button>
                    </div>
                )}
            </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[300] px-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-center-pop-mobile text-center border border-blue-50">
                <AlertCircle size={32} className="mx-auto mb-4 text-red-500" />
                <h3 className="text-xl font-bold text-blue-900 mb-2 font-sans">Sei sicuro?</h3>
                <div className="flex gap-3 mt-6">
                    <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="flex-1 font-sans">Annulla</Button>
                    <Button className="flex-1 bg-red-500 font-sans" onClick={async () => {
                        const { id, type } = deleteConfirm;
                        const table = type === 'photo' ? "Photos" : "baby-registry";
                        await supabase.from(table).delete().eq('id', id);
                        if (type === 'photo') setPhotos(prev => prev.filter(p => p.id !== id));
                        else setMessages(prev => prev.filter(m => m.id !== id));
                        setDeleteConfirm(null);
                   }}>Elimina</Button>
                </div>
            </div>
        </div>
      )}

      {showThanks && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/10 backdrop-blur-sm px-6">
          <div className="bg-white p-6 rounded-2xl shadow-2xl animate-center-pop-mobile text-blue-800 font-bold flex items-center gap-3">
            <span className="text-xl">🧦 🧸</span> <span className="text-lg">Grazie da Michi!💙</span>
          </div>
        </div>
      )}

      {selectedPhoto && <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[9999]" onClick={() => setSelectedPhoto(null)}><img src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Zoom" /></div>}
    </div> 
  ); 
}