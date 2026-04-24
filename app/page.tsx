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

  const [currentView, setCurrentView] = useState<'all' | 'photos' | 'messages'>(() => {
    if (typeof window !== "undefined") {
      const savedView = localStorage.getItem("current_view");
      return (savedView as 'all' | 'photos' | 'messages') || 'all';
    }
    return 'all';
  });

  useEffect(() => {
    localStorage.setItem("current_view", currentView);
  }, [currentView]);

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