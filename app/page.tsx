"use client";
/>
<Button onClick={handleLogin} className='mt-4'>Entra</Button>
</div>
</div>
)
}

return(
<div className='min-h-screen p-4 pb-20 bg-sky-50'>

<div className='fixed top-4 left-4 right-4 flex justify-between'>
<Button onClick={()=>setIsMenuOpen(true)}><Menu/></Button>
<Button onClick={()=>setWishModalOpen(true)}><Plus/></Button>
</div>

<div className='mt-24 max-w-md mx-auto space-y-5'>

<div className={CARD}>
<h2>🎁 Lista Desideri</h2>
{wishes.map(w=>(
<div key={w.id} className='bg-white p-4 rounded-3xl flex gap-4'>
<img src={w.image_url} className='w-20 h-20 rounded-2xl object-cover'/>
<div className='flex-1'>
<h3>{w.name}</h3>
{w.link && (
<a href={w.link} target='_blank'>Vedi prodotto</a>
)}
<div className='flex justify-between mt-3'>
<button onClick={()=>togglePurchased(w.id,w.is_purchased)}>
Segna acquistato
</button>
<button onClick={()=>{
setWishToDelete(w.id);
setWishModalOpen(true)
}}>
<Trash2 size={18}/>
</button>
</div>
</div>
</div>
))}
</div>

<div className={CARD}>
<h2>💌 Messaggi</h2>
<Input
value={message}
onChange={(e)=>setMessage(e.target.value)}
/>
<Button onClick={addMessage} className='mt-3'>Invia</Button>
</div>

<div className={CARD}>
<input
id='galleryInput'
type='file'
multiple
className='hidden'
onChange={handlePhotoUpload}
/>
<Button onClick={()=>document.getElementById('galleryInput')?.click()}>
Carica Foto
</Button>
</div>

</div>

{/* PARTE 2 INCOLLARE QUI */
{wishModalOpen && (
<div className='fixed inset-0 bg-black/40 flex items-center justify-center p-6'>
<div className='bg-white rounded-3xl p-6 w-full max-w-sm'>

{!isAddingWish ? (
<>
<Input
type='password'
value={adminPassInput}
onChange={(e)=>setAdminPassInput(e.target.value)}
placeholder='Password'
/>
<div className='flex gap-3 mt-4'>
<Button onClick={()=>setWishModalOpen(false)}>
Annulla
</Button>
<Button onClick={wishToDelete?handleAdminDelete:checkAdminPass}>
Conferma
</Button>
</div>
</>
):(
<>
<Input
placeholder='Nome oggetto'
value={newWish.name}
onChange={(e)=>setNewWish({...newWish,name:e.target.value})}
/>

<Input
placeholder='Link prodotto'
value={newWish.link}
onChange={(e)=>setNewWish({...newWish,link:e.target.value})}
/>

<input
 type='file'
 accept='image/*'
 onChange={(e)=>
setNewWish({
...newWish,
imageFile:e.target.files?.[0]||null
})
}
/>

{newWish.imageFile && (
<img
src={URL.createObjectURL(newWish.imageFile)}
className='w-28 h-28 mx-auto rounded-2xl mt-3 object-cover'
/>
)}

<Button
onClick={addWish}
className='w-full mt-4 bg-blue-500'
>
Aggiungi
</Button>
</>
)}

</div>
</div>
}