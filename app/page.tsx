"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

const BUCKET = "Photos"; // 👈 IMPORTANTE (come il tuo)
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
        console.error("Errore fetch messages:", error);
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
        console.error("Errore fetch photos:", error);
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
      {
        text: newMessage,
      },
    ]);

    if (error) {
      console.error("Errore insert message:", error);
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

      // upload storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file);

      if (uploadError) {
        console.error("Errore upload:", uploadError);
        alert("Errore upload foto");
        continue;
      }

      // get url
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

      const publicUrl = data?.publicUrl;

      if (!publicUrl) {
        console.error("URL non generato");
        continue;
      }

      // salva su DB
      const { error: dbError } = await supabase.from("photos").insert([
        {
          url: publicUrl,
        },
      ]);

      if (dbError) {
        console.error("Errore DB foto:", dbError);
        continue;
      }

      // aggiorna UI
      setPhotos((prev) => [publicUrl, ...prev]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 text-blue-800">

      {/* MESSAGGI */}
      <div className={CARD + " w-full max-w-md"}>
        <h2 className={`text-lg font-semibold ${PRIMARY}`}>
          💝 Messaggio
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
      </div>

      {/* FOTO */}
      <div className={CARD + " w-full max-w-md mt-4"}>
        <h2 className={`text-lg font-semibold ${PRIMARY}`}>
          📸 Foto
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

      {/* LISTA MESSAGGI */}
      <div className={CARD + " w-full max-w-md mt-4"}>
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
  );
}