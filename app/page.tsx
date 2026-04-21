"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export const calculateDaysLeft = (dueDate: Date): number => {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const IBAN = "IT46K0347501605CC0011358676";
const PAYPAL_EMAIL = "antonio_caringella@libero.it";
const YT_VIDEO_ID = "lp-EO5I60KA";

const PRIMARY = "text-sky-900";
const BTN = "bg-blue-500 hover:bg-blue-600 text-white rounded-full py-3 text-lg shadow-md";
const CARD = "bg-white rounded-3xl shadow-xl";

export default function BabyRegistry() {
  const dueDate = useMemo(() => new Date("2026-10-09"), []);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  const daysLeft = useMemo(() => calculateDaysLeft(dueDate), [dueDate]);

  const progress = useMemo(() => {
    const total = 280;
    return Math.min(100, Math.max(0, ((total - daysLeft) / total) * 100));
  }, [daysLeft]);

 useEffect(() => {
  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setMessages(data.map((m) => m.text));
    }
  };

  fetchMessages();
}, []);

  useEffect(() => {
    localStorage.setItem("baby_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("baby_photos", JSON.stringify(photos));
  }, [photos]);

const addMessage = useCallback(async () => {
  if (!message.trim()) return;

  await supabase.from("messages").insert([
    { text: message.trim() }
  ]);

  setMessage("");
  setPaymentOpen(true);
}, [message]);

const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);

  for (const file of files) {
    const fileName = `${Date.now()}-${file.name}`;

    // upload su Supabase
    await supabase.storage
      .from("photos")
      .upload(fileName, file);

    // prendi URL pubblico
    const { data } = supabase.storage
      .from("photos")
      .getPublicUrl(fileName);

    if (data?.publicUrl) {
      setPhotos((prev) => [data.publicUrl, ...prev]);
    }
  }
};

  const babyMessage =
    "Body e peluche sono adorabili… ma pannolini e notti insonni lo sono un po’ meno 😄 " +
    "Se vuoi darci una mano, useremo il tutto per affrontare al meglio questa nuova avventura!🦊";

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden">

{/* BACKGROUND MOBILE PERFECT */}
<div
  className="absolute inset-0 bg-no-repeat bg-top bg-cover"
  style={{
    backgroundImage: "url('/bg-mobile.png')"
  }}
/>

{/* overlay leggero */}
<div className="absolute inset-0 bg-white/70" />
      <style>{`
        .animate-gradient {
          background-size: 400% 400%;
          animation: gradientMove 12s ease infinite;
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .float-slow {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      {/* MUSIC */}
      <div className="absolute top-4 right-4 z-50">
        <Button className={BTN} onClick={() => setMusicOn((v) => !v)}>
          {musicOn ? "🔊 Musica" : "🔇 Musica"}
        </Button>
      </div>

      {musicOn && (
        <iframe
          title="music"
          src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0`}
          allow="autoplay"
          className="hidden"
        />
      )}

      {/* FLOATING LAYER */}
      <div className="absolute inset-0 pointer-events-none">
        {/* animals */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-10 right-10 text-4xl float-slow">🦊</div>
          <div className="absolute top-1/3 left-5 text-3xl float-slow">🐻</div>
          <div className="absolute bottom-20 left-10 text-4xl float-slow">🐰</div>
          <div className="absolute bottom-10 right-1/4 text-3xl float-slow">🐥</div>
          <div className="absolute top-1/2 right-20 text-3xl float-slow">🐼</div>
          <div className="absolute top-1/4 right-1/2 text-2xl float-slow">🦁</div>
        </div>

        {/* original floating */}
        <div className="absolute top-1/2 left-1/4 text-xl float-slow">✨</div>
        <div className="absolute bottom-1/4 right-1/3 text-xl float-slow">☁️</div>
        <div className="absolute bottom-32 right-16 text-2xl float-slow">🍼</div>
      </div>

      {/* HEADER */}
  <div className="relative z-10 text-center mt-10 mb-6 px-4">

  <h1 className="text-4xl md:text-5xl font-bold text-blue-800">
    Benvenuto
  </h1>

  <h2 className="text-5xl md:text-6xl font-extrabold text-blue-700">
    Michele
  </h2>

  <p className="mt-4 text-base md:text-lg text-blue-900 leading-relaxed">
    Body e peluche sono adorabili...  
    ma pannolini e notti insonni lo sono un po’ meno 😄  
    Se vuoi darci una mano, useremo il tutto per affrontare al meglio questa nuova avventura! 🦊
  </p>

  <p className="mt-3 text-xl font-semibold text-blue-800">
    9 ottobre 2026
  </p>

  <div className="w-full max-w-xs h-6 bg-white rounded-full mx-auto mt-4 flex items-center justify-center shadow">
    <div
      className="h-2 bg-blue-500 rounded-full"
      style={{ width: `${progress}%` }}
    />
    <span className="absolute text-xs font-semibold text-blue-900">
      {daysLeft} giorni
    </span>
  </div>

</div>

      {/* CONTENT */}
      <div className="w-full max-w-md mx-auto space-y-6 relative z-10 px-3">

        <div className={CARD + " rounded-3xl shadow p-5"}>
          <h2 className={`text-xl font-semibold ${PRIMARY}`}>💝 Per iniziare questa avventura</h2>

          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi un messaggio" />

          <Button onClick={addMessage} className={`mt-3 w-full rounded-full ${BTN}`}>Invia 💙</Button>

          <Button type="button" onClick={() => setPaymentOpen(true)} className={`mt-2 w-full rounded-full ${BTN}`}>Dettagli contributo 🧸</Button>
        </div>

        <div className={CARD + " rounded-3xl shadow p-5"}>
          <h2 className={`text-xl font-semibold ${PRIMARY} mb-3`}>📸 Ricordi</h2>

          <input id="galleryInput" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />

          <Button className={`w-full rounded-full ${BTN}`} onClick={() => document.getElementById("galleryInput")?.click()}>
            Condividi un ricordo per Miki
          </Button>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {photos.map((p, i) => (
              <img key={i} src={p} className="w-full h-24 object-cover rounded-xl shadow" />
            ))}
          </div>
        </div>

        <div className={CARD + " rounded-3xl shadow p-5"}>
          <h2 className={`text-xl font-semibold ${PRIMARY} mb-3`}>💌 Messaggi dolcissimi</h2>

          <div className="space-y-2">
            {messages.length === 0 && <p className="text-sm text-gray-500">Nessun messaggio ancora 💙</p>}
            {messages.map((m, i) => (
              <div key={i} className="bg-sky-50 rounded-2xl p-3 text-sm text-sky-900">{m}</div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL */}
      {paymentOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setPaymentOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-xl font-semibold ${PRIMARY} mb-4`}>🧸 Dettagli contributo</h3>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-sky-50 rounded-2xl">
                <p className="font-semibold">💳 IBAN</p>
                <p className="break-all">{IBAN}</p>
              </div>

              <div className="p-3 bg-pink-50 rounded-2xl">
                <p className="font-semibold">🅿️ PayPal</p>
                <p className="break-all">{PAYPAL_EMAIL}</p>
              </div>
            </div>

            <Button onClick={() => setPaymentOpen(false)} className="mt-5 w-full rounded-full">
              Chiudi
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}

if (typeof window !== "undefined") {
  console.assert(calculateDaysLeft(new Date(Date.now() + 86400000)) === 1);
  console.assert(calculateDaysLeft(new Date(Date.now() - 86400000)) === 0);
}
