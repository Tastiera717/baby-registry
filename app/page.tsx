"use client"; 
import { useCallback, useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { supabase } from "@/lib/supabase"; 
import { Trash2, Copy, Check, AlertCircle, Menu, X, Home, Camera, MessageSquare, Lock, Plus, ExternalLink, Gift } from "lucide-react"; 
import imageCompression from 'browser-image-compression';

const IBAN = "IT46K0347501605CC0011358676"; 
const PAYPAL_EMAIL = "antonio_caringella@libero.it"; 
const YT_VIDEO_ID = "lp-EO5I60KA"; 
const PRIMARY = "text-blue-800"; 
const BTN = "bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 text-lg shadow-md w-full"; 
const CARD = "bg-sky-50 rounded-3xl shadow-lg p-5 border border-blue-100"; 
const REACTIONS = ["❤️", "🧸", "✨", "👶"];
const ACCESS_PASSWORD = "Babonzo!"; 
const ADMIN_PASSWORD = "Babonzo@"; 

export default function BabyRegistry() { 
  const [message, setMessage] = useState(""); 
  const [signature, setSignature] = useState(""); 
  const [messages, setMessages] = useState<{id: number, text: string, reactions?: any}[]>([]); 
  const [photos, setPhotos] = useState<{url: string, id: number, reactions?: any}[]>([]); 
  const [wishes, setWishes] = useState<{id: number, name: string, link: string, image_url: string, is_purchased: boolean}[]>([]);
  
  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passError, setPassError] = useState(false);
  const [currentView, setCurrentView] = useState<'all' | 'photos' | 'messages' | 'wishes'>('all');

  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [newWish, setNewWish] = useState({ name: "", link: "" });
  const [isAddingWish, setIsAddingWish] = useState(false); 
  const [wishToDelete, setWishToDelete] = useState<number | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{id: number, type: 'photo' | 'msg'} | null>(null);
  const [myMessageIds, setMyMessageIds] = useState<number[]>([]);
  const [myPhotoIds, setMyPhotoIds] = useState<number[]>([]);
  const [myPurchasedIds, setMyPurchasedIds] = useState<number[]>([]); // Per tracciare chi ha comprato cosa
  const [myPhotoReactions, setMyPhotoReactions] = useState<Record<number, string>>({});
  const [myMsgReactions, setMyMsgReactions] = useState<Record<number, string>>({});

  useEffect(() => {
    const authStatus = localStorage.getItem("baby_auth");
    if (authStatus === "true") setIsAuthenticated(true);
    
    // Funzionalità: Ritorno sulla stessa pagina al Refresh
    const savedView = localStorage.getItem("last_view");
    if (savedView) setCurrentView(savedView as any);

    const savedPurchased = localStorage.getItem("my_purchased_wishes");
    if (savedPurchased) setMyPurchasedIds(JSON.parse(savedPurchased));
  }, []);

  // Ogni volta che cambia la vista, la salviamo
  useEffect(() => {
    localStorage.setItem("last_view", currentView);
  }, [currentView]);

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

  const checkAdminPass = () => {
    if (adminPassInput === ADMIN_PASSWORD) {
        setIsAddingWish(true);
        setAdminPassInput("");
    } else {
        alert("Password errata!");
    }
  };

  const addWish = async () => {
    if (!newWish.name) return;
    const imgUrl = newWish.link ? `https://logo.clearbit.com/${new URL(newWish.link).hostname}` : "https://placehold.co/400x400/sky/white?text=Regalo";
    const { data, error } = await supabase.from("Wishes").insert([{ name: newWish.name, link: newWish.link, image_url: imgUrl, is_purchased: false }]).select().single();
    if (!error && data) {
        setWishes([data, ...wishes]);
        setWishModalOpen(false);
        setIsAddingWish(false);
        setNewWish({ name: "", link: "" });
    }
  };

  const togglePurchased = async (id: number, currentStatus: boolean) => {
    // Funzionalità: Controllo se l'utente è autorizzato a cambiare idea
    if (currentStatus && !myPurchasedIds.includes(id)) {
        alert("Solo chi ha segnato l'oggetto come acquistato può annullare l'azione! 😊");
        return;
    }

    const newStatus = !currentStatus;
    const { error } = await supabase.from("Wishes").update({ is_purchased: newStatus }).eq('id', id);
    if (!error) {
        setWishes(wishes.map(w => w.id === id ? { ...w, is_purchased: newStatus } : w));
        
        let updatedPurchased = [...myPurchasedIds];
        if (newStatus) {
            updatedPurchased.push(id);
        } else {
            updatedPurchased = updatedPurchased.filter(wishId => wishId !== id);
        }
        setMyPurchasedIds(updatedPurchased);
        localStorage.setItem("my_purchased_wishes", JSON.stringify(updatedPurchased));
    }
  };

  const deleteWish = async (id: number) => {
    if (adminPassInput !== ADMIN_PASSWORD) { alert("Password errata!"); return; }
    const { error } = await supabase.from("Wishes").delete().eq('id', id);
    if (!error) {
        setWishes(wishes.filter(w => w.id !== id));
        setWishToDelete(null);
        setAdminPassInput("");
    }
  };

  const addMessage = useCallback(async () => { 
    if (!message.trim()) return; 
    const finalMsg = signature.trim() ? `${message.trim()} \n\n— ${signature.trim()}` : message.trim();
    const { data, error } = await supabase.from("baby-registry").insert([{ text: finalMsg, reactions: {} }]).select().single(); 
    if (!error && data) {
        setMessages((prev) => [data, ...prev]);
        setMessage(""); setSignature(""); triggerThanks();
    }
  }, [message, signature]);

  const triggerThanks = () => { setShowThanks(true); setTimeout(() => setShowThanks(false), 3000); };
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-sky-50 relative font-dreaming overflow-hidden text-center">
        <style>{`@font-face { font-family: 'Dreaming'; src: url('/fonts/dreaming-outloud-pro.woff') format('woff'); }`}</style>
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-blue-100">
          <Lock size={35} className="mx-auto mb-6 text-blue-500" />
          <h2 className="text-3xl font-extrabold text-blue-900 mb-2">Benvenuto</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="password" placeholder="La Password..." value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="text-center rounded-2xl" />
            <Button onClick={() => handleLogin()} className={BTN}>Entra ✨</Button>
          </form>
        </div>
      </div>
    );
  }

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
        {currentView === 'wishes' && (
            <Button onClick={() => setWishModalOpen(true)} className="bg-blue-500 text-white shadow-md !w-12 !h-12 !p-0 rounded-2xl"><Plus size={24} /></Button>
        )}
      </div>

      <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className={`absolute top-0 left-0 h-full w-72 bg-white transition-transform duration-300 p-6 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="flex justify-between items-center mb-10 text-blue-900 font-bold">Menu <X onClick={() => setIsMenuOpen(false)} /></div>
              <nav className="space-y-4 font-sans font-bold">
                  <button onClick={() => { setCurrentView('all'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'all' ? 'bg-blue-500 text-white' : 'bg-sky-50'}`}><Home size={20} /> Home</button>
                  <button onClick={() => { setCurrentView('photos'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'photos' ? 'bg-blue-500 text-white' : 'bg-sky-50'}`}><Camera size={20} /> Ricordi</button>
                  <button onClick={() => { setCurrentView('messages'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'messages' ? 'bg-blue-500 text-white' : 'bg-sky-50'}`}><MessageSquare size={20} /> Messaggi</button>
                  <button onClick={() => { setCurrentView('wishes'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${currentView === 'wishes' ? 'bg-blue-500 text-white' : 'bg-sky-50'}`}><Gift size={20} /> Lista dei desideri</button>
              </nav>
          </div>
      </div>

      <div className="relative z-10 text-center mt-20 mb-6 px-4"> 
          {currentView === 'all' ? (
              <>
                <h1 className="text-3xl font-bold">Benvenuto</h1> 
                <h2 className="text-5xl font-extrabold mt-1 text-blue-900">Michele</h2> 
              </>
          ) : (
              <h2 className="text-4xl font-extrabold text-blue-900">
                {currentView === 'photos' && '📸 Ricordi'}
                {currentView === 'messages' && '💌 Messaggi'}
                {currentView === 'wishes' && '🎁 Lista Desideri'}
              </h2>
          )}
      </div>

      <div className="w-full max-w-md space-y-5 z-10 relative pb-20 px-2"> 
        
        {currentView === 'all' && (
            <div className={CARD}> 
              <h2 className={`text-lg font-semibold ${PRIMARY}`}>💝 Per iniziare questa avventura</h2> 
              <p className="mt-2 text-sm text-blue-800/80 italic">Se desideri partecipare con un pensiero clicca sotto</p>
              <Button onClick={() => setPaymentOpen(true)} className={`mt-3 ${BTN}`}>Un pensiero per Michi 🧸</Button>
              <Button onClick={() => setCurrentView('wishes')} className="mt-3 bg-white border-2 border-blue-100 text-blue-500 rounded-full py-4 text-lg shadow-sm w-full font-bold">Lista dei desideri 🎁</Button>
            </div> 
        )}

        {currentView === 'wishes' && (
            <div className="space-y-4">
                {wishes.length === 0 && <p className="text-center italic opacity-50 pt-10">La lista è in fase di allestimento... 🧸</p>}
                {wishes.map((w) => (
                    <div key={w.id} className={`relative bg-white rounded-3xl p-4 shadow-md border flex items-center gap-4 transition-all overflow-hidden ${w.is_purchased ? 'bg-gray-100 border-gray-300 opacity-80' : 'border-blue-100'}`}>
                        {/* Funzionalità: Pop up in alto a destra fisso */}
                        {w.is_purchased && (
                          <div className="absolute top-2 right-2 z-10">
                             <span className="bg-red-500 text-white px-2 py-1 rounded-lg font-bold text-[9px] shadow-sm uppercase animate-center-pop-mobile">Regalo Preso! 🎁</span>
                          </div>
                        )}
                        
                        <img src={w.image_url} className={`w-20 h-20 rounded-2xl object-cover bg-sky-50 ${w.is_purchased ? 'grayscale' : ''}`} alt={w.name} />
                        <div className="flex-1 overflow-hidden">
                            <h3 className={`font-sans font-bold text-blue-900 truncate ${w.is_purchased ? 'line-through opacity-50' : ''}`}>{w.name}</h3>
                            {w.link && !w.is_purchased && (
                                <a href={w.link} target="_blank" className="text-blue-500 text-xs flex items-center gap-1 mt-1 underline"><ExternalLink size={12} /> Vedi Prodotto</a>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                                <button 
                                    onClick={() => togglePurchased(w.id, w.is_purchased)} 
                                    className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-full transition-all ${!w.is_purchased ? 'bg-sky-100 text-blue-600' : 'bg-red-500 text-white'}`}
                                >
                                    {w.is_purchased ? 'Ho cambiato idea' : 'Segna come acquistato'}
                                </button>
                                <button onClick={() => setWishToDelete(w.id)} className="p-2 text-red-300 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {currentView === 'all' && (
            <div className={CARD}>
                 <h2 className={`text-lg font-semibold ${PRIMARY}`}>📸 Ricordi recenti</h2>
                 <div className="grid grid-cols-3 gap-2 mt-3">
                    {photos.slice(0, 3).map(p => <img key={p.id} src={p.url} className="h-20 w-full object-cover rounded-xl" alt="Memory" />)}
                 </div>
                 <Button variant="ghost" onClick={() => setCurrentView('photos')} className="w-full mt-4 text-blue-400 text-xs uppercase font-bold">Vedi tutti i ricordi</Button>
            </div>
        )}
      </div> 

      {paymentOpen && ( 
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] px-4" onClick={() => setPaymentOpen(false)}> 
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-center-pop-mobile" onClick={(e) => e.stopPropagation()}> 
            <h3 className="text-lg font-semibold mb-2 text-blue-800 text-center uppercase tracking-widest">🧸 Un pensiero per Michi</h3> 
            <p className="text-center text-xs text-blue-600/70 mb-5 font-sans">Qualora desideri partecipare con un contributo libero trovi sotto le informazioni che possono servirti</p>
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
                        <input type="password" placeholder="Inserisci Password..." value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} className="w-full mb-4 text-center border p-2 rounded-xl" />
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setWishModalOpen(false)} className="flex-1">Annulla</Button>
                            <Button onClick={checkAdminPass} className="flex-1 bg-blue-500">Conferma</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 font-sans">
                        <h3 className="font-bold text-center">Nuovo Desiderio</h3>
                        <Input placeholder="Nome Oggetto (es. Passeggino)" value={newWish.name} onChange={(e) => setNewWish({ ...newWish, name: e.target.value })} />
                        <Input placeholder="Link Prodotto (opzionale)" value={newWish.link} onChange={(e) => setNewWish({ ...newWish, link: e.target.value })} />
                        <Button onClick={addWish} className="w-full bg-blue-500">Aggiungi ✨</Button>
                        <Button variant="ghost" onClick={() => { setIsAddingWish(false); setWishModalOpen(false); }} className="w-full">Chiudi</Button>
                    </div>
                )}
            </div>
        </div>
      )}

      {wishToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[200] px-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-center-pop-mobile text-center">
                <AlertCircle className="mx-auto mb-4 text-red-500" />
                <h3 className="font-bold mb-4 font-sans">Conferma eliminazione</h3>
                <input type="password" placeholder="Inserisci Password..." value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} className="w-full mb-4 text-center border p-2 rounded-xl" />
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setWishToDelete(null)} className="flex-1">Annulla</Button>
                    <Button onClick={() => deleteWish(wishToDelete)} className="flex-1 bg-red-500">Elimina</Button>
                </div>
            </div>
        </div>
      )}
    </div> 
  ); 
}