"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

const IBAN = "IT46K0347501605CC0011358676";
const PAYPAL_EMAIL = "[antonio_caringella@libero.it](mailto:antonio_caringella@libero.it)";
const YT_VIDEO_ID = "lp-EO5I60KA";

const PRIMARY = "text-blue-800";
const BTN =
"bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 text-lg shadow-md w-full";
const CARD = "bg-sky-50 rounded-3xl shadow-lg p-5";

export default function BabyRegistry() {
const [message, setMessage] = useState("");
const [messages, setMessages] = useState<string[]>([]);
const [photos, setPhotos] = useState<string[]>([]);
const [paymentOpen, setPaymentOpen] = useState(false);
const [musicOn, setMusicOn] = useState(false);

// 📸 FETCH FOTO
useEffect(() => {
const fetchPhotos = async () => {
const { data, error } = await supabase
.from("Photos")
.select("*")
.order("created_at", { ascending: false });

```
  if (error) {
    console.error("FETCH PHOTOS ERROR:", error);
    return;
  }

  if (data) {
    setPhotos(data.map((p) => p.url));
  }
};

fetchPhotos();
```

}, []);

// 💌 FETCH MESSAGGI
useEffect(() => {
const fetchMessages = async () => {
const { data, error } = await supabase
.from("baby-registry")
.select("*")
.order("created_at", { ascending: false });

```
  if (error) {
    console.error("FETCH MESSAGES ERROR:", error);
    return;
  }

  if (data) {
    setMessages(data.map((m) => m.text));
  }
};

fetchMessages();
```

}, []);

// 💌 ADD MESSAGE
const addMessage = useCallback(async () => {
if (!message.trim()) return;

```
const newMessage = message.trim();

const { error } = await supabase.from("baby-registry").insert([
  { text: newMessage },
]);

if (error) {
  console.error("SUPABASE MESSAGE ERROR:", error);
  alert(error.message);
  return;
}

setMessages((prev) => [newMessage, ...prev]);
setMessage("");
```

}, [message]);

// 📤 UPLOAD FOTO
const handlePhotoUpload = async (
e: React.ChangeEvent<HTMLInputElement>
) => {
const files = Array.from(e.target.files || []);

```
for (const file of files) {
  const fileExt = file.name.split(".").pop();

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from("Photos")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("UPLOAD ERROR:", uploadError);
    alert(uploadError.message);
    return;
  }

  const { data: urlData } = supabase.storage
    .from("Photos")
    .getPublicUrl(filePath);

  const publicUrl = urlData?.publicUrl;

  if (!publicUrl) return;

  const { error: dbError } = await supabase.from("Photos").insert([
    { url: publicUrl },
  ]);

  if (dbError) return;

  setPhotos((prev) => [publicUrl, ...prev]);
}
```

};

const babyMessage =
"Body e peluche sono adorabili… ma pannolini e notti insonni lo sono un po’ meno 😄 " +
"Se vuoi darci una mano, useremo il tutto per affrontare al meglio questa nuova avventura!🦊";

return ( <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden font-dreaming text-blue-800"> <style>{`         @font-face {
          font-family: 'Dreaming';
          src: url('/fonts/dreaming-outloud-pro.woff') format('woff');
        }
        .font-dreaming {
          font-family: 'Dreaming', cursive;
        }
      `}</style>

```
  <div
    className="absolute inset-0 bg-no-repeat bg-top bg-cover"
    style={{ backgroundImage: "url('/bg-mobile.png')" }}
  />
  <div className="absolute inset-0 bg-white/70" />

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

  <div className="relative z-10 text-center mt-10 mb-6 px-2">
    <h1 className="text-3xl font-bold">Benvenuto</h1>
    <h2 className="text-5xl font-extrabold mt-1">Michele</h2>
    <p className="mt-4 text-base leading-relaxed">{babyMessage}</p>
    <p className="mt-3 text-lg font-semibold">9 ottobre 2026</p>
  </div>

  <div className="w-full max-w-md space-y-5 z-10">
    <div className={CARD}>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Scrivi un messaggio"
      />
      <Button onClick={addMessage} className={`mt-3 ${BTN}`}>
        Invia 💙
      </Button>
    </div>

    <div className={CARD}>
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
        Upload foto
      </Button>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {photos.map((p, i) => (
          <img key={i} src={p} className="h-24 w-full object-cover" />
        ))}
      </div>
    </div>

    <div className={CARD}>
      {messages.map((m, i) => (
        <div key={i}>{m}</div>
      ))}
    </div>
  </div>
</div>
```

);
}
