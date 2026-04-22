"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

const IBAN = "IT46K0347501605CC0011358676";
const PAYPAL_EMAIL = "antonio_caringella@libero.it";
const YT_VIDEO_ID = "lp-EO5I60KA";

const PRIMARY = "text-blue-800";
const BTN =
  "bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 text-lg shadow-md w-full";
const CARD =
  "bg-sky-50 rounded-3xl shadow-lg p-5"; // 👈 celeste chiaro

export default function BabyRegistry() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

useEffect(() => {
  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setPhotos(data.map((p) => p.url));
    }
  };

  fetchPhotos();
}, []);

const addMessage = useCallback(async () => {
  if (!message.trim()) return;

  const newMessage = message.trim();

  const { error } = await supabase.from("messages").insert([
    { text: newMessage },
  ]);

  if (error) {
    console.error(error);
    alert("Errore invio messaggio");
    return;
  }

  setMessages((prev) => [newMessage, ...prev]);
  setMessage("");
}, [message]);

const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);

  for (const file of files) {
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("Photos") // 👈 MAIUSCOLA
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Errore upload");
      continue;
    }

    const { data } = supabase.storage
      .from("Photos")
      .getPublicUrl(fileName);

    const publicUrl = data?.publicUrl;

    if (!publicUrl) continue;

    const { error: dbError } = await supabase.from("photos").insert([
      { url: publicUrl },
    ]);

    if (dbError) {
      console.error(dbError);
      continue;
    }

    setPhotos((prev) => [publicUrl, ...prev]);
  }
};

  const babyMessage =
    "Body e peluche sono adorabili… ma pannolini e notti insonni lo sono un po’ meno 😄 " +
    "Se vuoi darci una mano, useremo il tutto per affrontare al meglio questa nuova avventura!🦊";

  return (
    <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden font-dreaming text-blue-800">
      
      {/* FONT CUSTOM */}
      <style>{`
        @font-face {
          font-family: 'Dreaming';
          src: url('/fonts/dreaming-outloud-pro.woff') format('woff');
          font-weight: normal;
          font-style: normal;
        }
        .font-dreaming {
          font-family: 'Dreaming', cursive;
        }

        .float-slow {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-no-repeat bg-top bg-cover"
        style={{ backgroundImage: "url('/bg-mobile.png')" }}
      />
      <div className="absolute inset-0 bg-white/70" />

      {/* MUSIC */}
      <div className="absolute top-4 right-4 z-50">
        <Button onClick={() => setMusicOn((v) => !v)} className={BTN}>
          {musicOn ? "🔊" : "🔇"}
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

      {/* HEADER */}
      <div className="relative z-10 text-center mt-10 mb-6 px-2">
        <h1 className="text-3xl font-bold">Benvenuto</h1>
        <h2 className="text-5xl font-extrabold mt-1">Michele</h2>

        <p className="mt-4 text-base leading-relaxed">
          {babyMessage}
        </p>

        <p className="mt-3 text-lg font-semibold">
          9 ottobre 2026
        </p>
      </div>

      {/* CONTENT */}
      <div className="w-full max-w-md space-y-5 z-10">

        {/* MESSAGGIO */}
        <div className={CARD}>
          <h2 className={`text-lg font-semibold ${PRIMARY}`}>
            💝 Per iniziare questa avventura
          </h2>

          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Scrivi un messaggio"
            className="mt-2"
          />

          <Button onClick={addMessage} className={`mt-3 ${BTN}`}>
            Invia 💙
          </Button>

          <Button
            type="button"
            onClick={() => setPaymentOpen(true)}
            className={`mt-2 ${BTN}`}
          >
            Dettagli contributo 🧸
          </Button>
        </div>

        {/* FOTO */}
        <div className={CARD}>
          <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>
            📸 Ricordi
          </h2>

          <input
            id="galleryInput"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />

          <Button
            className={BTN}
            onClick={() =>
              document.getElementById("galleryInput")?.click()
            }
          >
            Condividi un ricordo per Miki
          </Button>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {photos.map((p, i) => (
              <img
                key={i}
                src={p}
                className="w-full h-24 object-cover rounded-xl"
              />
            ))}
          </div>
        </div>

        {/* MESSAGGI */}
        <div className={CARD}>
          <h2 className={`text-lg font-semibold mb-3 ${PRIMARY}`}>
            💌 Messaggi
          </h2>

          <div className="space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-3 text-sm"
              >
                {m}
              </div>
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
            <h3 className="text-lg font-semibold mb-4">
              🧸 Contributo
            </h3>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-sky-50 rounded-xl">
                <p className="font-semibold">IBAN</p>
                <p>{IBAN}</p>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl">
                <p className="font-semibold">PayPal</p>
                <p>{PAYPAL_EMAIL}</p>
              </div>
            </div>

            <Button
              onClick={() => setPaymentOpen(false)}
              className="mt-5 w-full"
            >
              Chiudi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}