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

type ViewType = 'all' | 'photos' | 'messages' | 'wishes';

export default function BabyRegistry() { 
  // State
  const [message, setMessage] = useState(""); 
  const [signature, setSignature] = useState(""); 
  const [messages, setMessages] = useState<{id: number, text: string, reactions?: any}[]>([]); 
  const [photos, setPhotos] = useState<{url: string, id: number, reactions?: any}[]>([]); 
  const [wishes, setWishes] = useState<{id: number, name: string, link: string, image_url: string, is_purchased: boolean}[]>([]);
  
  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [isAddingWish, setIsAddingWish] = useState(false);
  const [newWish, setNewWish] = useState({ name: "", link: "" });
  const [adminPassInput, setAdminPassInput] = useState("");
  const [wishToDelete, setWishToDelete] = useState<number | null>(null);

  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('all');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passError, setPassError] = useState(false);

  // Local Storage per sicurezza e persistenza refresh
  const [myMessageIds, setMyMessageIds] = useState<number[]>([]);
  const [myPhotoIds, setMyPhotoIds] = useState<number[]>([]);
  const [myPurchasedIds, setMyPurchasedIds] = useState<number[]>([]);
  const [myPhotoReactions, setMyPhotoReactions] = useState<Record<number, string>>({});
  const [myMsgReactions, setMyMsgReactions] = useState<Record<number, string>>({});

  useEffect(() => {
    const authStatus = localStorage.getItem("baby_auth");
    if (authStatus === "true") setIsAuthenticated(true);

    // PERSISTENZA PAGINA AL REFRESH
    const savedView = localStorage.getItem("last_view") as ViewType;
    if (savedView) setCurrentView(savedView);

    const savedMsgs = localStorage.getItem("my_messages");
    if (savedMsgs) setMyMessageIds(JSON.parse(savedMsgs));
    const savedPhotos = localStorage.getItem("my_photos");
    if (savedPhotos) setMyPhotoIds(JSON.parse(savedPhotos));
    const savedPurchased = localStorage.getItem("my_purchased_wishes");
    if (savedPurchased) setMyPurchasedIds(JSON.parse(savedPurchased));
    const savedPReac = localStorage.getItem("my_p_reac");
    if (savedPReac) setMyPhotoReactions(JSON.parse(savedPReac));
    const savedMReac = localStorage.getItem("my_m_reac");
    if (savedMReac) setMyMsgReactions(JSON.parse(savedMReac));
  }, []);

  const changeView = (view: ViewType) => {
    setCurrentView(view);
    localStorage.setItem("last_view", view); // Salva la vista corrente
    setIsMenuOpen(false);
  };

  const fetchData = async () => {
    const { data: pData } = await supabase.from("Photos").select("*").order("created_at", { ascending: false });
    if (pData) setPhotos(pData.map(p => ({ ...p, reactions: p.reactions || {} })));
    const { data: mData } = await supabase.from("baby-registry").select("*").order("created_at", { ascending: false });
    if (mData) setMessages(mData.map(m => ({ ...m, reactions: m.reactions || {} })));
    const { data: wData } = await supabase.from("Wishes").select("*").order("created_at", { ascending: false });
    if (wData) setWishes(wData);
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);

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

  // LOGICA DESIDERI (MODIFICATA)
  const togglePurchased = async (id: number, currentStatus: boolean) => {
    if (currentStatus && !myPurchasedIds.includes(id)) {
        alert("Solo chi ha segnato l'oggetto come acquistato può annullare l'azione! 😊");
        return;
    }
    const newStatus = !currentStatus;
    const { error } = await supabase.from("Wishes").update({ is_purchased: newStatus }).eq('id', id);
    if (!error) {
        setWishes(wishes.map(w => w.id === id ? { ...w, is_purchased: newStatus } : w));
        let updated = newStatus ? [...myPurchasedIds, id] : myPurchasedIds.filter(x => x !== id);
        setMyPurchasedIds(updated);
        localStorage.setItem("my_purchased_wishes", JSON.stringify(updated));
    }
  };

  const checkAdminPass = () => {
    if (adminPassInput === ADMIN_PASSWORD) { setIsAddingWish(true); setAdminPassInput(""); }
    else { alert("Password errata!"); }
  };

  const addWish = async () => {
    if (!newWish.name) return;
    let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(newWish.name)}&background=f0f9ff&color=0369a1&size=256`;
    const { data, error } = await supabase.from("Wishes").insert([{ name: newWish.name, link: newWish.link, image_url: imgUrl, is_purchased: false }]).select().single();
    if (!error && data) { setWishes([data, ...wishes]); setWishModalOpen(false); setIsAddingWish(false); setNewWish({ name: "", link: "" }); }
  };

  const deleteWish = async (id: number) => {
    if (adminPassInput !== ADMIN_PASSWORD) { alert("Password errata!"); return; }
    const { error } = await supabase.from("Wishes").delete().eq('id', id);
    if (!error) { setWishes(wishes.filter(w => w.id !== id)); setWishToDelete(null); setAdminPassInput(""); }
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
          <h2 className="text-4xl font-extrabold text-blue-900 mb-8">Benvenuto</h2>
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
      `}</style> 

      <div className="fixed inset-0 w-full h-full -z-20 bg-no-repeat bg-top pointer-events-none" style={{ backgroundImage: "url('/bg-mobile.png')", backgroundSize: "145%", backgroundColor: "#f0f9ff" }} /> 
      <div className="fixed inset-0 w-full h-full bg-white/60 -z-10 pointer-events-none" /> 

      <div className="fixed top-4 left-4 right-4 z-[100] flex justify-between items-center">
        <Button onClick={() => setIsMenuOpen(true)} className="bg-white/80 backdrop-blur-md border border-blue-100 shadow-md !w-12 !h-12 !p-0 rounded-2xl text-blue-600"><Menu size={24} /></Button>
        {currentView === 'wishes' ? (
             <Button onClick={() => setWishModalOpen(true)} className="bg-blue-500 text-white shadow-md !w-12 !h-12 !p-0 rounded-2xl"><Plus size={24} /></Button>
        ) : (
             <Button onClick={() => setMusicOn((v) => !v)} className="bg-white/80 backdrop-blur-md border border-blue-100 shadow-md !w-12 !h-12 !p-0 rounded-2xl">{musicOn ? "🔊" : "🔇"}</Button>
        )}
      </div>

      {/* MENU LATERALE */}
      <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className={`absolute top-0 left-0 h-full w-72 bg-white transition-transform duration-300 p-6 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="flex justify-between items-center mb-10 text-blue-900 font-bold text-xl">Menu <X onClick={() => setIsMenuOpen(false)} /></div>
              <nav className="space-y-4 font-sans font-bold">
                  <button onClick={() => changeView('all')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'all' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}><Home size={20} /> Home Page</button>
                  <button onClick={() => changeView('photos')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'photos' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}><Camera size={20} /> Tutti i Ricordi</button>
                  <button onClick={() => changeView('messages')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'messages' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}><MessageSquare size={20} /> Tutti i Messaggi</button>
                  <button onClick={() => changeView('wishes')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'wishes' ? 'bg-blue-500 text-white shadow-lg' : 'bg-sky-50 text-blue-800'}`}><Gift size={20} /> Lista dei desideri</button>
              </nav>
          </div>
      </div>

      {musicOn && <iframe title="music" src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0`} allow="autoplay" className="hidden" />} 

      {/* HEADER CON TESTI ORIGINALI */}
      <div className="relative z-10 text-center mt-20 mb-6 px-4"> 
          {currentView === 'all' ? (
              <>
                <h1 className="text-3xl font-bold italic">In attesa di...</h1> 
                <h2 className="text-6xl font-extrabold mt-1 text-blue-900">Michele</h2> 
                <div className="mt-6 space-y-4 text-lg leading-relaxed max-w-sm mx-auto">
                    <p>Abbiamo creato questo spazio per raccogliere i vostri <b>messaggi</b> e le <b>foto ricordo</b> più belle!</p>
                    <p>E se desiderate partecipare con un piccolo pensiero alla nascita di Michele, ve ne saremo immensamente grati! 🦊</p>
                </div>
                <p className="mt-4 text-xl font-semibold border-t border-blue-200 pt-4 inline-block px-8">9 Ottobre 2026</p> 
              </>
          ) : (
              <h2 className="text-4xl font-extrabold text-blue-900 uppercase">
                {currentView === 'photos' && '📸 Ricordi'}
                {currentView === 'messages' && '💌 Messaggi'}
                {currentView === 'wishes' && '🎁 Lista Desideri'}
              </h2>
          )}
      </div>

      <div className="w-full max-w-md space-y-5 z-10 relative px-2"> 
        
        {/* BOX CONTRIBUTO (TESTO ORIGINALE) */}
        {currentView === 'all' && (
            <div className={CARD}> 
              <h2 className={`text-lg font-semibold text-center ${PRIMARY}`}>💝 Per aiutarci a accogliere Michele</h2> 
              <Button onClick={() => setPaymentOpen(true)} className={`mt-3 ${BTN}`}>Fai un pensiero per Michele 🧸</Button>
              <Button onClick={() => changeView('wishes')} className={`mt-3 ${BTN}`}>Lista dei desideri 🎁</Button>
            </div> 
        )}

        {/* LISTA DESIDERI (MODIFICATA COME RICHIESTO) */}
        {currentView === 'wishes' && (
            <div className="space-y-4 animate-center-pop-mobile">
                {wishes.map((w) => (
                    <div key={w.id} className={`relative bg-white rounded-3xl p-4 shadow-md border flex items-center gap-4 transition-all overflow-hidden ${w.is_purchased ? 'border-gray-300 bg-gray-100 opacity-80' : 'border-blue-100'}`}>
                        {w.is_purchased && (
                          <div className="absolute top-2 right-2 z-10">
                             <span className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-[10px] shadow-md uppercase animate-center-pop-mobile">Regalo Preso! 🎁</span>
                          </div>
                        )}
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-sky-50 flex-shrink-0">
                           <img src={w.image_url} className={`w-full h-full object-cover ${w.is_purchased ? 'grayscale' : ''}`} alt={w.name} onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}`} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className={`font-sans font-bold text-blue-900 truncate ${w.is_purchased ? 'line-through text-gray-500' : ''}`}>{w.name}</h3>
                            <div className="flex items-center gap-2 mt-3">
                                <button 
                                  onClick={() => togglePurchased(w.id, w.is_purchased)} 
                                  className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-full transition-all z-20 
                                    ${!w.is_purchased ? 'bg-sky-100 text-blue-600' : 
                                      myPurchasedIds.includes(w.id) ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                                >
                                    {!w.is_purchased ? 'Segna come Acquistato' : 
                                     myPurchasedIds.includes(w.id) ? 'Ho cambiato idea' : 'Già prenotato'}
                                </button>
                                <button onClick={() => setWishToDelete(w.id)} className="p-2 text-red-300 hover:text-red-500 z-20"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* BOX RICORDI (TESTO ORIGINALE) */}
        {(currentView === 'all' || currentView === 'photos') && (
            <div className={CARD}> 
                <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>📸 Condividi i tuoi ricordi</h2> 
                <input id="galleryInput" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" /> 
                <Button className={BTN} onClick={() => document.getElementById("galleryInput")?.click()}>Carica i tuoi ricordi ✨</Button> 
                <div className={`grid ${currentView === 'photos' ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mt-4`}> 
                    {photos.slice(0, currentView === 'all' ? 6 : undefined).map((p) => ( 
                    <div key={p.id} className="relative flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-sky-200">
                        <div onClick={() => setSelectedPhoto(p.url)} className="w-full h-24 bg-gray-100">
                            <img src={p.url} className="w-full h-full object-cover" alt="Foto" />
                        </div>
                        <div className="flex justify-around items-center py-1">
                            {REACTIONS.map(emoji => (
                                <button key={emoji} onClick={() => handleGenericReaction(p.id, emoji, 'photo')} className={`flex flex-col items-center ${myPhotoReactions[p.id] === emoji ? 'bg-blue-100 rounded-md px-0.5' : ''}`}>
                                    <span className="text-xs">{emoji}</span>
                                    <span className="text-[8px] font-sans font-bold">{p.reactions?.[emoji] || 0}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    ))} 
                </div> 
            </div> 
        )}

        {/* BOX MESSAGGI */}
        {(currentView === 'all' || currentView === 'messages') && (
            <div className={CARD}> 
              <h2 className={`text-lg font-semibold ${PRIMARY}`}>💌 Invia un messaggio a Michele</h2> 
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi qui il tuo messaggio..." className="mt-2" /> 
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Tua firma (opzionale)" className="mt-2 text-sm italic" /> 
              <Button onClick={addMessage} className={`mt-3 ${BTN}`}>Invia Messaggio 💙</Button> 
              <div className="space-y-4 mt-6 border-t border-blue-100 pt-4"> 
                {messages.slice(0, currentView === 'all' ? 5 : undefined).map((m) => (  
                    <div key={m.id} className="bg-white border border-blue-50 rounded-xl p-3 shadow-sm">
                        <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-sm font-sans whitespace-pre-wrap">{m.text}</span>
                            {myMessageIds.includes(m.id) && (
                                <button onClick={async () => {
                                    const { error } = await supabase.from("baby-registry").delete().eq('id', m.id);
                                    if(!error) setMessages(messages.filter(x => x.id !== m.id));
                                }} className="text-red-300 hover:text-red-500"><Trash2 size={14} /></button>
                            )}
                        </div>
                        <div className="flex gap-4 pt-2">
                            {REACTIONS.map(emoji => (
                                <button key={emoji} onClick={() => handleGenericReaction(m.id, emoji, 'msg')} className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${myMsgReactions[m.id] === emoji ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                                    <span className="text-xs">{emoji}</span>
                                    <span className="text-[10px] font-sans font-bold">{m.reactions?.[emoji] || 0}</span>
                                </button>
                            ))}
                        </div>
                    </div> 
                ))} 
              </div>
            </div> 
        )}
      </div> 

      {/* MODALE PENSIERO (TESTO ORIGINALE) */}
      {paymentOpen && ( 
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] px-4" onClick={() => setPaymentOpen(false)}> 
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-center-pop-mobile" onClick={(e) => e.stopPropagation()}> 
            <h3 className="text-lg font-semibold mb-5 text-blue-800 text-center uppercase tracking-wider">Un piccolo pensiero per Michele 🧸</h3> 
            <div className="space-y-3"> 
              <div className="p-4 bg-sky-50 rounded-2xl border flex justify-between items-center">
                <div className="overflow-hidden"><p className="font-bold text-blue-400 text-[10px] uppercase mb-1">IBAN</p><p className="font-mono text-xs truncate">{IBAN}</p></div>
                <button onClick={() => copyToClipboard(IBAN, 'iban')} className="p-2 bg-white rounded-xl text-blue-500">{copiedField === 'iban' ? <Check size={18} /> : <Copy size={18} />}</button>
              </div> 
              <div className="p-4 bg-orange-50 rounded-2xl border flex justify-between items-center">
                <div><p className="font-bold text-orange-400 text-[10px] uppercase mb-1">PayPal</p><p className="font-mono text-xs">{PAYPAL_EMAIL}</p></div>
                <button onClick={() => copyToClipboard(PAYPAL_EMAIL, 'paypal')} className="p-2 bg-white rounded-xl text-orange-500">{copiedField === 'paypal' ? <Check size={18} /> : <Copy size={18} />}</button>
              </div> 
            </div> 
            <Button onClick={() => setPaymentOpen(false)} className="mt-5 w-full bg-blue-500 rounded-full">Chiudi</Button> 
          </div> 
        </div> 
      )} 

      {/* MODALE AGGIUNGI DESIDERIO */}
      {wishModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] px-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                {!isAddingWish ? (
                    <div className="text-center font-sans">
                        <Lock className="mx-auto mb-4 text-blue-400" />
                        <h3 className="text-xl font-bold mb-4">Area Genitori</h3>
                        <Input type="password" placeholder="Password Admin" value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} className="mb-4 text-center" />
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setWishModalOpen(false)} className="flex-1">Annulla</Button>
                            <Button onClick={checkAdminPass} className="flex-1 bg-blue-500">Entra</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 font-sans">
                        <h3 className="font-bold text-center text-lg">Nuovo Desiderio</h3>
                        <Input placeholder="Nome Oggetto" value={newWish.name} onChange={(e) => setNewWish({ ...newWish, name: e.target.value })} />
                        <Input placeholder="Link (opzionale)" value={newWish.link} onChange={(e) => setNewWish({ ...newWish, link: e.target.value })} />
                        <Button onClick={addWish} className="w-full bg-blue-500">Aggiungi ✨</Button>
                        <Button variant="ghost" onClick={() => { setIsAddingWish(false); setWishModalOpen(false); }} className="w-full">Chiudi</Button>
                    </div>
                )}
            </div>
        </div>
      )}

      {selectedPhoto && <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[9999]" onClick={() => setSelectedPhoto(null)}><img src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Zoom" /></div>}
    </div> 
  ); 
}