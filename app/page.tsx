"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import {
Trash2,
Copy,
Check,
AlertCircle,
Menu,
X,
Home,
Camera,
MessageSquare,
Lock,
Plus,
ExternalLink,
Gift
} from "lucide-react";

import imageCompression from "browser-image-compression";

const IBAN="IT46K0347501605CC0011358676";
const PAYPAL_EMAIL="antonio_caringella@libero.it";
const YT_VIDEO_ID="lp-EO5I60KA";

const PRIMARY="text-blue-800";
const BTN="bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 text-lg shadow-md w-full font-bold";
const CARD="bg-sky-50 rounded-3xl shadow-lg p-5 border border-blue-100";

const REACTIONS=["❤️","🧸","✨","👶"];

const ACCESS_PASSWORD="Babonzo!";
const ADMIN_PASSWORD="Babonzo@";

export default function BabyRegistry(){

const [message,setMessage]=useState("");
const [signature,setSignature]=useState("");

const [messages,setMessages]=useState<
{id:number,text:string,reactions?:any}[]
>([]);

const [photos,setPhotos]=useState<
{url:string,id:number,reactions?:any}[]
>([]);

const [wishes,setWishes]=useState<
{
id:number,
name:string,
link:string,
image_url:string,
is_purchased:boolean
}[]
>([]);

const [wishModalOpen,setWishModalOpen]=useState(false);
const [isAddingWish,setIsAddingWish]=useState(false);

const [newWish,setNewWish]=useState({
name:"",
link:"",
imageFile:null as File | null
});

const [adminPassInput,setAdminPassInput]=useState("");
const [wishToDelete,setWishToDelete]=useState<number | null>(null);

const [paymentOpen,setPaymentOpen]=useState(false);
const [musicOn,setMusicOn]=useState(false);
const [selectedPhoto,setSelectedPhoto]=useState<string|null>(null);
const [showThanks,setShowThanks]=useState(false);
const [copiedField,setCopiedField]=useState<string|null>(null);
const [isMenuOpen,setIsMenuOpen]=useState(false);

const [currentView,setCurrentView]=useState<
'all'|'photos'|'messages'|'wishes'
>('all');

const [deleteConfirm,setDeleteConfirm]=useState<
{id:number,type:'photo'|'msg'}|null
>(null);

const [isAuthenticated,setIsAuthenticated]=useState(false);
const [passwordInput,setPasswordInput]=useState("");
const [passError,setPassError]=useState(false);

const [myMessageIds,setMyMessageIds]=useState<number[]>([]);
const [myPhotoIds,setMyPhotoIds]=useState<number[]>([]);
const [myPurchasedWishIds,setMyPurchasedWishIds]=useState<number[]>([]);
const [myPhotoReactions,setMyPhotoReactions]=useState<Record<number,string>>({});
const [myMsgReactions,setMyMsgReactions]=useState<Record<number,string>>({});

useEffect(()=>{
const authStatus=localStorage.getItem("baby_auth");
if(authStatus==="true") setIsAuthenticated(true);

const savedView=localStorage.getItem("last_view");
if(savedView) setCurrentView(savedView as any);

const savedMsgs=localStorage.getItem("my_messages");
if(savedMsgs) setMyMessageIds(JSON.parse(savedMsgs));

const savedPhotos=localStorage.getItem("my_photos");
if(savedPhotos) setMyPhotoIds(JSON.parse(savedPhotos));

const savedP=localStorage.getItem("my_purchased_wishes");
if(savedP) setMyPurchasedWishIds(JSON.parse(savedP));

const pReac=localStorage.getItem("my_p_reac");
if(pReac) setMyPhotoReactions(JSON.parse(pReac));

const mReac=localStorage.getItem("my_m_reac");
if(mReac) setMyMsgReactions(JSON.parse(mReac));

},[]);

useEffect(()=>{
localStorage.setItem("last_view",currentView);
},[currentView]);

const fetchData=async()=>{

const {data:pData}=await supabase
.from("Photos")
.select("*")
.order("created_at",{ascending:false});

if(pData){
setPhotos(
pData.map(p=>({
...p,
reactions:p.reactions || {}
}))
);
}

const {data:mData}=await supabase
.from("baby-registry")
.select("*")
.order("created_at",{ascending:false});

if(mData){
setMessages(
mData.map(m=>({
...m,
reactions:m.reactions || {}
}))
);
}

const {data:wData}=await supabase
.from("Wishes")
.select("*")
.order("created_at",{ascending:false});

if(wData) setWishes(wData);

};

useEffect(()=>{
if(isAuthenticated){
fetchData();
}
},[isAuthenticated]);

const handleLogin=(e?:React.FormEvent)=>{
if(e)e.preventDefault();

if(passwordInput===ACCESS_PASSWORD){
localStorage.setItem("baby_auth","true");
setIsAuthenticated(true);
}else{
setPassError(true);
setTimeout(()=>setPassError(false),2000);
}
};

const checkAdminPass=()=>{
if(adminPassInput===ADMIN_PASSWORD){
setIsAddingWish(true);
setAdminPassInput("");
}else{
alert("Password errata!");
}
};

const handleAdminDelete=()=>{
if(adminPassInput===ADMIN_PASSWORD){
if(wishToDelete){
deleteWish(wishToDelete);
}
}else{
alert("Password errata");
}
};



/* WISHES ADD WITH wish-images BUCKET */

const addWish=async()=>{

if(!newWish.name.trim()) return;

let imgUrl=
`https://ui-avatars.com/api/?name=${encodeURIComponent(
newWish.name
)}&background=f0f9ff&color=0369a1&size=256`;

if(newWish.imageFile){

try{

const compressedFile=
await imageCompression(
newWish.imageFile,
{
maxSizeMB:0.7,
maxWidthOrHeight:1200,
useWebWorker:true
}
);

const filePath=
`wish-${Date.now()}-${crypto.randomUUID()}-${newWish.imageFile.name.replace(
/[^a-zA-Z0-9.\-_]/g,
"_"
)}`;

const {error:uploadError}=await supabase
.storage
.from("wish-images")
.upload(
filePath,
compressedFile,
{
cacheControl:"3600",
upsert:false
}
);

if(!uploadError){

const {data:urlData}=
supabase
.storage
.from("wish-images")
.getPublicUrl(filePath);

if(urlData?.publicUrl){
imgUrl=urlData.publicUrl;
}

}

}catch(e){
console.error(e);
}

}

else if(newWish.link){

try{
const domain=
new URL(newWish.link).hostname;

imgUrl=
`https://logo.clearbit.com/${domain}`;

}catch(e){}

}

const {data,error}=await supabase
.from("Wishes")
.insert([{
name:newWish.name,
link:newWish.link,
image_url:imgUrl,
is_purchased:false
}])
.select()
.single();

if(!error && data){

setWishes([
data,
...wishes
]);

setWishModalOpen(false);
setIsAddingWish(false);

setNewWish({
name:"",
link:"",
imageFile:null
});

}

};



const togglePurchased=async(
id:number,
currentStatus:boolean
)=>{

if(
currentStatus &&
!myPurchasedWishIds.includes(id)
){
alert(
"Solo chi ha segnato il regalo può annullare."
);
return;
}

const {error}=await supabase
.from("Wishes")
.update({
is_purchased:!currentStatus
})
.eq("id",id);

if(!error){

setWishes(
wishes.map(w=>
w.id===id
? {...w,is_purchased:!currentStatus}
: w
)
);

let updated=[...myPurchasedWishIds];

if(!currentStatus){
updated.push(id);
}else{
updated=
updated.filter(
x=>x!==id
);
}

setMyPurchasedWishIds(updated);

localStorage.setItem(
"my_purchased_wishes",
JSON.stringify(updated)
);

}

};

const deleteWish=async(id:number)=>{

const {error}=await supabase
.from("Wishes")
.delete()
.eq("id",id);

if(!error){

setWishes(
wishes.filter(
w=>w.id!==id
)
);

setWishToDelete(null);
setAdminPassInput("");
setWishModalOpen(false);

}

};

const addMessage=useCallback(
async()=>{

if(!message.trim()) return;

const finalMsg=
signature.trim()
?`${message.trim()}\n\n— ${signature.trim()}`
:message.trim();

const {data,error}=await supabase
.from("baby-registry")
.insert([
{
text:finalMsg,
reactions:{}
}
])
.select()
.single();

if(!error && data){

setMessages(
prev=>[data,...prev]
);

setMyMessageIds(prev=>{
const up=[...prev,data.id];
localStorage.setItem(
"my_messages",
JSON.stringify(up)
);
return up;
});

setMessage("");
setSignature("");
triggerThanks();

}

},
[message,signature]
);

const handlePhotoUpload=async(
e:React.ChangeEvent<HTMLInputElement>
)=>{

const files=
Array.from(
e.target.files || []
);

const options={
maxSizeMB:0.8,
maxWidthOrHeight:1280,
useWebWorker:true
};

for(const file of files){

try{

const compressed=
await imageCompression(
file,
options
);

const filePath=
`${crypto.randomUUID()}-${file.name.replace(
/[^a-zA-Z0-9.\-_]/g,
"_"
)}`;

await supabase
.storage
.from("Photos")
.upload(
filePath,
compressed
);

const {data:urlData}=
supabase.storage
.from("Photos")
.getPublicUrl(filePath);

if(urlData?.publicUrl){

const {data:newP}=await supabase
.from("Photos")
.insert([
{
url:urlData.publicUrl,
reactions:{}
}
])
.select()
.single();

if(newP){

setPhotos(
prev=>[
newP,
...prev
]
);

}

}

}catch(e){
console.error(e);
}

}

triggerThanks();

};

const triggerThanks=()=>{
setShowThanks(true);
setTimeout(
()=>setShowThanks(false),
3000
);
};


if(!isAuthenticated){

return(
<div className='min-h-screen flex items-center justify-center bg-sky-50 p-6'>
<div className='bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm text-center'>
<Lock className='mx-auto mb-6 text-blue-500' size={35}/>
<h2 className='text-4xl font-bold mb-8'>
Benvenuto
</h2>

<Input
type='password'
placeholder='Password'
value={passwordInput}
onChange={(e)=>
setPasswordInput(
e.target.value
)
}
/>

<Button
onClick={()=>handleLogin()}
className={`mt-4 ${BTN}`}
>
Entra ✨
</Button>

</div>
</div>
)

}



return(
<div className='min-h-screen p-4 pb-20 bg-sky-50'>

<div className='fixed top-4 left-4 right-4 flex justify-between z-50'>

<Button
onClick={()=>setIsMenuOpen(true)}
className='!w-12 !h-12 rounded-2xl'
>
<Menu/>
</Button>

{currentView==="wishes" ? (

<Button
onClick={()=>setWishModalOpen(true)}
className='bg-blue-500 !w-12 !h-12 rounded-2xl'
>
<Plus/>
</Button>

):(

<Button
onClick={()=>setMusicOn(v=>!v)}
className='!w-12 !h-12 rounded-2xl'
>
{musicOn?"🔊":"🔇"}
</Button>

)}

</div>


<div className='mt-24 max-w-md mx-auto space-y-5'>


{(currentView==="all" || currentView==="wishes") && (

<div className='space-y-4'>

{wishes.map(w=>(

<div
key={w.id}
className={`rounded-3xl p-4 shadow-md border flex gap-4 ${
w.is_purchased
? 'bg-gray-100'
:'bg-white'
}`}
>

<div className='w-20 h-20 rounded-2xl overflow-hidden bg-sky-50'>
<img
src={w.image_url}
className='w-full h-full object-cover'
alt={w.name}
/>
</div>

<div className='flex-1'>

<h3 className='font-bold text-blue-900'>
{w.name}
</h3>

{w.link && !w.is_purchased &&(
<a
href={w.link}
target='_blank'
className='text-xs text-blue-500 flex gap-1 mt-1'
>
<ExternalLink size={12}/>
Vedi prodotto
</a>
)}

<div className='flex justify-between mt-4'>

<button
onClick={()=>
togglePurchased(
w.id,
w.is_purchased
)
}
className='text-xs bg-sky-100 px-3 py-2 rounded-full'
>
{w.is_purchased
?'Ho cambiato idea'
:'Segna acquistato'}
</button>

<button
onClick={()=>{
setWishToDelete(w.id);
setWishModalOpen(true);
}}
className='text-red-400'
>
<Trash2 size={18}/>
</button>

</div>

</div>

</div>

))}

</div>

)}

{/* MODAL AGGIUNTA DESIDERIO */}

{wishModalOpen && (

<div className='fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6'>

<div className='bg-white rounded-3xl p-6 w-full max-w-sm'>

{!isAddingWish ? (

<>
<h3 className='text-center mb-4 font-bold'>
Area Genitori
</h3>

<Input
type='password'
placeholder='Password'
value={adminPassInput}
onChange={(e)=>
setAdminPassInput(
e.target.value
)}
/>

<div className='flex gap-3 mt-4'>
<Button
variant='ghost'
onClick={()=>{
setWishModalOpen(false);
}}
className='flex-1'
>
Annulla
</Button>

<Button
onClick={
wishToDelete
?handleAdminDelete
:checkAdminPass
}
className='flex-1 bg-blue-500'
>
Conferma
</Button>
</div>
</>

):(

<div className='space-y-4'>

<h3 className='text-center font-bold'>
Nuovo desiderio
</h3>

<Input
placeholder='Nome oggetto'
value={newWish.name}
onChange={(e)=>
setNewWish({
...newWish,
name:e.target.value
})
}
/>

<Input
placeholder='Link prodotto'
value={newWish.link}
onChange={(e)=>
setNewWish({
...newWish,
link:e.target.value
})
}
/>

<input
type='file'
accept='image/*'
onChange={(e)=>
setNewWish({
...newWish,
imageFile:
e.target.files?.[0] || null
})
}
className='w-full border rounded-2xl p-3'
/>

{newWish.imageFile && (
<img
src={URL.createObjectURL(
newWish.imageFile
)}
className='w-28 h-28 rounded-2xl mx-auto object-cover'
alt='preview'
/>
)}

<Button
onClick={addWish}
className='w-full bg-blue-500'
>
Aggiungi ✨
</Button>

</div>

)}

</div>

</div>

)}

</div>

{/* MESSAGGI */}

{(currentView==="all" || currentView==="messages") && (

<div className={CARD}>

<h2 className={`text-lg font-semibold ${PRIMARY}`}>
💌 Messaggi
</h2>

<Input
value={message}
onChange={(e)=>
setMessage(e.target.value)
}
placeholder='Scrivi un messaggio'
className='mt-2'
/>

<Input
value={signature}
onChange={(e)=>
setSignature(e.target.value)
}
placeholder='Firma (opzionale)'
className='mt-2'
/>

<Button
onClick={addMessage}
className={`mt-3 ${BTN}`}
>
Invia 💙
</Button>

<div className='space-y-4 mt-6 border-t pt-4'>

{messages
.slice(
0,
currentView==="all"
?5
:undefined
)
.map(m=>(

<div
key={m.id}
className='bg-white rounded-xl p-3 shadow-sm'
>

<div className='flex justify-between mb-2'>

<span className='text-sm whitespace-pre-wrap'>
{m.text}
</span>

{myMessageIds.includes(m.id) &&(
<button
onClick={()=>
setDeleteConfirm({
id:m.id,
type:"msg"
})
}
>
<Trash2
size={14}
className='text-red-400'
/>
</button>
)}

</div>

<div className='flex gap-3 pt-2'>

{REACTIONS.map(emoji=>(

<button
key={emoji}
className='px-2 py-1 rounded-full bg-sky-50'
>
{emoji}
</button>

))}

</div>

</div>

))}

</div>

</div>

)}



{/* FOTO */}

{(currentView==="all" || currentView==="photos") && (

<div className={CARD}>

<h2 className={`text-lg font-semibold ${PRIMARY}`}>
📸 Ricordi
</h2>

<input
id='galleryInput'
type='file'
accept='image/*'
multiple
onChange={handlePhotoUpload}
className='hidden'
/>

<Button
className={BTN}
onClick={()=>
document
.getElementById(
"galleryInput"
)
?.click()
}
>
Condividi un ricordo ✨
</Button>


<div className='grid grid-cols-3 gap-2 mt-4'>

{photos
.slice(
0,
currentView==="all"
?6
:undefined
)
.map(p=>(

<div
key={p.id}
className='relative bg-white rounded-xl overflow-hidden shadow'
>

<div
onClick={()=>
setSelectedPhoto(
p.url
)
}
className='h-24'
>

<img
src={p.url}
className='w-full h-full object-cover'
alt='foto'
/>

</div>

{myPhotoIds.includes(p.id)&&(

<button
onClick={()=>
setDeleteConfirm({
id:p.id,
type:"photo"
})
}
className='absolute top-1 left-1 bg-red-500 rounded-full p-1 text-white'
>
<Trash2 size={12}/>
</button>

)}

<div className='flex justify-around py-1 bg-sky-50'>

{REACTIONS.map(r=>(
<span key={r}>
{r}
</span>
))}

</div>

</div>

))}

</div>

</div>

)}



{/* CONTRIBUTO */}

{currentView==="all" && (

<div className={CARD}>

<h2 className={`text-lg font-semibold ${PRIMARY}`}>
💝 Un pensiero per Michi
</h2>

<p className='text-sm mt-2'>
Se desideri partecipare clicca sotto
</p>

<Button
onClick={()=>
setPaymentOpen(true)
}
className={`mt-3 ${BTN}`}
>
Un pensiero per Michi 🧸
</Button>

</div>

)}


</div>


{/* MODAL CONTRIBUTO */}

{paymentOpen && (

<div
className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4'
onClick={()=>
setPaymentOpen(false)
}
>

<div
className='bg-white rounded-3xl p-6 w-full max-w-md'
onClick={(e)=>
e.stopPropagation()
}
>

<h3 className='text-center font-bold text-blue-800 mb-5'>
🧸 Un pensiero per Michi
</h3>


<div className='space-y-3'>

<div className='p-4 bg-sky-50 rounded-2xl flex justify-between items-center'>

<div>
<p className='text-xs uppercase'>
IBAN
</p>

<p className='font-mono text-xs'>
{IBAN}
</p>

</div>

<button
onClick={()=>{
navigator.clipboard.writeText(
IBAN
);
setCopiedField("iban");
}}
>
{copiedField==="iban"
?<Check/>
:<Copy/>
}
</button>

</div>


<div className='p-4 bg-orange-50 rounded-2xl flex justify-between items-center'>

<div>
<p className='text-xs uppercase'>
PayPal
</p>

<p className='font-mono text-xs'>
{PAYPAL_EMAIL}
</p>
</div>

<button
onClick={()=>{
navigator.clipboard.writeText(
PAYPAL_EMAIL
);
setCopiedField(
"paypal"
);
}}
>
{copiedField==="paypal"
?<Check/>
:<Copy/>
}
</button>

</div>

</div>

<Button
onClick={()=>
setPaymentOpen(false)
}
className='mt-5 w-full bg-blue-500'
>
Chiudi
</Button>

</div>

</div>

)}



{/* DELETE CONFIRM */}

{deleteConfirm && (

<div className='fixed inset-0 bg-black/40 flex items-center justify-center z-[300]'>

<div className='bg-white rounded-3xl p-6 max-w-xs w-full text-center'>

<AlertCircle
size={32}
className='mx-auto mb-4 text-red-500'
/>

<h3 className='font-bold mb-4'>
Sei sicuro?
</h3>

<div className='flex gap-3'>

<Button
variant='ghost'
onClick={()=>
setDeleteConfirm(null)
}
className='flex-1'
>
Annulla
</Button>

<Button
className='flex-1 bg-red-500'
onClick={async()=>{

const {id,type}=
deleteConfirm;

const table=
type==="photo"
?"Photos"
:"baby-registry";

await supabase
.from(table)
.delete()
.eq(
"id",
id
);

if(type==="photo"){
setPhotos(prev=>
prev.filter(
p=>p.id!==id
)
);
}else{
setMessages(prev=>
prev.filter(
m=>m.id!==id
)
);
}

setDeleteConfirm(
null
);

}}
>
Elimina
</Button>

</div>

</div>

</div>

)}



{/* THANK YOU */}

{showThanks &&(

<div className='fixed inset-0 z-[250] flex items-center justify-center bg-black/10'>

<div className='bg-white p-6 rounded-2xl shadow-2xl font-bold'>

🧸 Grazie da Michi 💙

</div>

</div>

)}



{/* ZOOM FOTO */}

{selectedPhoto &&(

<div
className='fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] p-4'
onClick={()=>
setSelectedPhoto(null)
}
>

<img
src={selectedPhoto}
className='max-w-full max-h-[90vh] rounded-xl'
alt='zoom'
/>

</div>

)}

</div>
);

}