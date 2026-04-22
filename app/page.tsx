"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

const BUCKET = "Photos"; // 👈 come il tuo
const IBAN = "IT46K0347501605CC0011358676";
const PAYPAL_EMAIL = "antonio_caringella@libero.it";

const PRIMARY = "text-blue-800";
const BTN =
  "bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 text-lg shadow-md w-full";
const CARD = "bg-sky-50 rounded-3xl shadow-lg p-5";

export default function BabyRegistry() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // 🔵 FETCH MESSAGGI
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setMessages(data.map((m) => m.text));
    };

    fetchMessages();
  }, []);

  // 🔵 FETCH FOTO
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

      setPhotos(data.map((p) => p.url));
    };

    fetchPhotos();
  }, []);

  // 🟢 INVIO MESSAGGIO
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

  // 🟢 UPLOAD FOTO
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        continue;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
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

  return (
    <div className="min-h-screen flex flex-col items-center p-4 relative text-blue-800">

      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: "url('/bg-mobile.png')" }}
      />
      <div className="absolute inset-0 bg-white/70" />

      {/* HEADER */}
      <div className="relative z-10 text-center mt-10 mb-6 px-2">
        <h1 className="text-3xl font-bold">Benvenuto</h1>
        <h2 className="text-5xl font-extrabold mt-1">Michele</h2>

        <p className="mt-4 text-base">
          Body e peluche sono adorabili… ma pannolini e notti insonni lo sono un po’ meno 😄
          Se vuoi darci una mano, useremo il tutto per affrontare al meglio questa nuova avventura!
        </p>

        <p className="mt-3 text-lg font-semibold">9 ottobre 2026</p>
      </div>

      {/* CONTENT */}
      <div className="w-full max-w-md space-y-5 z-10">

        {/* MESSAGGIO */}
        <div className={CARD}>
          <h2 className={`text-lg font-semibold ${PRIMARY}`}>
            💝 Scrivi un messaggio
          </h2>

          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2"
          />

          <Button onClick={addMessage} className={`mt-3 ${BTN}`}>
            Invia 💙
          </Button>

          <Button
            onClick={() => setPaymentOpen(true)}
            className={`mt-2 ${BTN}`}
          >
            Dettagli contributo 🧸
          </Button>
        </div>

        {/* FOTO */}
        <div className={CARD}>
          <h2 className={`text-lg font-semibold ${PRIMARY}`}>
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
            Carica foto
          </Button>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {photos.map((p, i) => (
              <img key={i} src={p} className="w-full h-24 object-cover rounded-xl" />
            ))}
          </div>
        </div>

        {/* MESSAGGI */}
        <div className={CARD}>
          <h2 className={`text-lg font-semibold ${PRIMARY}`}>
            💌 Messaggi
          </h2>

          {messages.map((m, i) => (
            <div key={i} className="bg-white p-3 rounded-xl mt-2">
              {m}
            </div>
          ))}
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