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
            <Input type="password" placeholder="La Password..." value={passwordInput} onChange={(e) => setPasswordInput(e.target.value