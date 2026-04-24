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
  const [messages, setMessages] = useState<{id: number, text: string, reactions?: any}[]>([]); 
  const [photos, setPhotos] = useState<{url: string, id: number, reactions?: any}[]>([]); 
  const [paymentOpen, setPaymentOpen] = useState(false); 
  const [musicOn, setMusicOn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'all' | 'photos' | 'messages'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{id: number, type: 'photo' | 'msg'} | null>(null);

  const [myMessageIds, setMyMessageIds] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("my_messages");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [myPhotoIds, setMyPhotoIds] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("my_photos");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [myPhotoReactions, setMyPhotoReactions] = useState<Record<number, string>>({});
  const [myMsgReactions, setMyMsgReactions] = useState<Record<number, string>>({});

  useEffect(() => {
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
    if (error) return; 
    if (data) {
        setMessages((prev) => [data, ...prev]);
        setMyMessageIds((prevIds) => {
            const updated = [...prevIds, data.id];
            localStorage.setItem("my_messages", JSON.stringify(updated));
            return updated;
        });
    }
    setMessage(""); setSignature(""); triggerThanks();
  }, [message, signature]); 

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
              setMyPhotoIds((prevIds) => {
                  const updated = [...prevIds, newPhoto.id];
                  localStorage.setItem("my_photos", JSON.stringify(updated));
                  return updated;
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

  const confirmDeletion = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    const table = type === 'photo' ? "Photos" : "baby-registry";
    await supabase.from(table).delete().eq('id', id);
    
    if (type === 'photo') {
      setPhotos(prev => prev.filter(p => p.id !== id));
      setMyPhotoIds(prev => {
          const updated = prev.filter(i => i !== id);
          localStorage.setItem("my_photos", JSON.stringify(updated));
          return updated;
      });
    } else {
      setMessages(prev => prev.filter(m => m.id !== id));
      setMyMessageIds(prev => {
          const updated = prev.filter(i => i !== id);
          localStorage.setItem("my_messages", JSON.stringify(updated));
          return updated;
      });
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
                      <MessageSquare size={22} /> <span className="font-sans font-bold">Messaggi</span>
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
        
        {/* BOX INVIO MESSAGGIO (In Home e Messaggi) */}
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
                        <div key={m.id} className="bg-white border border-blue-50 rounded-xl p-3 shadow-sm">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <span className="text-sm whitespace-pre-wrap">{m.text}</span>
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
              )}
            </div> 
        )}

        {/* BOX FOTO (In Home e Foto) */}
        {(currentView === 'all' || currentView === 'photos') && (
            <div className={CARD}> 
                <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>📸 Ricordi</h2> 
                <input id="galleryInput" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" /> 
                <Button className={BTN} onClick={() => document.getElementById("galleryInput")?.click()}>Condividi un ricordo per Michi</Button> 
                <div className={`grid ${currentView === 'photos' ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mt-4 overflow-y-auto pr-1`}> 
                    {photos.map((p) => ( 
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

        {/* LISTA MESSAGGI (Solo in Home) */}
        {currentView === 'all' && (
            <div className={CARD}> 
                <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>💌 Messaggi</h2> 
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1"> 
                    {messages.map((m) => (  
                    <div key={m.id} className="bg-white border border-blue-50 rounded-xl p-3 shadow-sm">
                        <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-sm whitespace-pre-wrap">{m.text}</span>
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
                <Button variant="ghost" onClick={() => setCurrentView('messages')} className="w-full mt-2 text-blue-400 text-xs uppercase font-bold">Vedi tutti i messaggi</Button>
            </div> 
        )}
      </div> 

      {/* MODALI RIMASTI INVARIATI */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[300] px-6">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-center-pop-mobile text-center border border-blue-50">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><AlertCircle size={32} /></div>
                <h3 className="text-xl font-bold text-blue-900 mb-2 font-sans">Sei sicuro?</h3>
                <p className="text-sm text-blue-800/70 mb-6 font-sans">Vuoi eliminare questo {deleteConfirm.type === 'photo' ? 'ricordo' : 'messaggio'}?</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-full bg-gray-100 text-gray-600 font-bold font-sans text-sm">Annulla</button>
                    <button onClick={confirmDeletion} className="flex-1 py-3 rounded-full bg-red-500 text-white font-bold shadow-md font-sans text-sm">Elimina</button>
                </div>
            </div>
        </div>
      )}

      {showThanks && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/10 backdrop-blur-sm px-6">
          <div className="bg-white p-6 rounded-2xl shadow-2xl animate-center-pop-mobile text-blue-800 font-bold flex items-center gap-3">
            <span className="text-xl">🧦 🧸</span> <span className="text-lg">Grazie da Michi! 💙</span>
          </div>
        </div>
      )}

      {paymentOpen && ( 
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] px-4" onClick={() => setPaymentOpen(false)}> 
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-center-pop-mobile" onClick={(e) => e.stopPropagation()}> 
            <h3 className="text-lg font-semibold mb-4 text-blue-800 text-center uppercase tracking-widest">🧸 Un pensiero per Michi</h3> 
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

      {selectedPhoto && <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[9999]" onClick={() => setSelectedPhoto(null)}><img src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Zoom" /></div>}
    </div> 
  ); 
}