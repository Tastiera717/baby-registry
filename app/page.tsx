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

  return ( 
    <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden font-dreaming text-blue-800"> 
      <style>{` 
        @font-face { font-family: 'Dreaming'; src: url('/fonts/dreaming-outloud-pro.woff') format('woff'); } 
        .font-dreaming { font-family: 'Dreaming', cursive; } 
      `}</style> 

      <div className="absolute inset-0 bg-no-repeat bg-top bg-cover" style={{ backgroundImage: "url('/bg-mobile.png')" }} /> 
      <div className="absolute inset-0 bg-white/70" /> 

      <div className="absolute top-4 right-4 z-50"> 
        <Button onClick={() => setMusicOn((v) => !v)} className="bg-white/50 rounded-full p-2 text-2xl shadow-sm"> 
          {musicOn ? "🔊" : "🔇"} 
        </Button> 
      </div> 

      {musicOn && ( 
        <iframe title="music" src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}`} allow="autoplay" className="hidden" /> 
      )} 

      <div className="relative z-10 text-center mt-10 mb-6 px-2"> 
        <h1 className="text-3xl font-bold uppercase tracking-widest">Benvenuto</h1> 
        <h2 className="text-6xl font-extrabold mt-1 text-blue-600">Michele</h2> 
        <p className="mt-4 text-base leading-relaxed max-w-xs mx-auto">
          Se vuoi darci una mano, useremo il tutto per affrontare al meglio questa nuova avventura!🦊
        </p> 
        <p className="mt-3 text-lg font-semibold italic">9 ottobre 2026</p> 
      </div> 

      <div className="w-full max-w-md space-y-5 z-10 relative"> 
        <div className={CARD}> 
          <h2 className={`text-lg font-semibold ${PRIMARY}`}>💝 Per iniziare</h2> 
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi un messaggio" className="mt-2 bg-white" /> 
          <Button onClick={addMessage} className={`mt-3 ${BTN}`}>Invia 💙</Button> 
          <Button onClick={() => setPaymentOpen(true)} className={`mt-2 ${BTN