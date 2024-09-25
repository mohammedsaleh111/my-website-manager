'use client';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

const LOCAL_STORAGE_KEY = 'links';

export default function Home() {
  const [links, setLinks] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [activeIndex, setActiveIndex] = useState(null); // لتتبع النافذة التي يتم تكبيرها
  const [editIndex, setEditIndex] = useState(null);

  // تحميل الروابط من Local Storage و Firebase
  useEffect(() => {
    const savedLinks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];

    // تحميل الروابط من Firebase
    const fetchLinksFromFirestore = async () => {
      const querySnapshot = await getDocs(collection(db, 'links'));
      const firestoreLinks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // دمج الروابط بدون تكرار
      const mergedLinks = [...firestoreLinks, ...savedLinks].filter(
        (link, index, self) =>
          index === self.findIndex((l) => l.url === link.url)
      );

      setLinks(mergedLinks);
    };

    fetchLinksFromFirestore();
  }, []);

  // حفظ وتحديث الرابط
  const handleSave = async () => {
    if (!name || !url) return;

    const newLink = { name, url };

    if (editIndex !== null) {
      // تعديل الرابط في القائمة
      const updatedLinks = links.map((link, index) =>
        index === editIndex ? { ...link, name, url } : link
      );

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLinks));
      setLinks(updatedLinks);

      // تعديل الرابط في Firebase إذا كان موجودًا
      const linkToUpdate = links[editIndex];
      if (linkToUpdate.id) {
        const linkRef = doc(db, 'links', linkToUpdate.id);
        await updateDoc(linkRef, { name, url });
      }

      setEditIndex(null);
    } else {
      // إضافة رابط جديد
      const updatedLinks = [...links, newLink].filter(
        (link, index, self) =>
          index === self.findIndex((l) => l.url === link.url)
      );

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLinks));
      setLinks(updatedLinks);

      // حفظ الرابط في Firestore
      await addDoc(collection(db, 'links'), newLink);
    }

    // مسح الحقول
    setName('');
    setUrl('');
  };

  // تعديل الرابط
  const handleEdit = (index) => {
    const linkToEdit = links[index];
    setName(linkToEdit.name);
    setUrl(linkToEdit.url);
    setEditIndex(index);
  };

  // حذف الرابط
  const handleDelete = async (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLinks));
    setLinks(updatedLinks);

    // حذف الرابط من Firebase إذا كان موجودًا
    const linkToDelete = links[index];
    if (linkToDelete.id) {
      const linkRef = doc(db, 'links', linkToDelete.id);
      await deleteDoc(linkRef);
    }
  };

  const handleCardClick = (index, link) => {
    setActiveIndex(index); // تعيين الكارد الذي سيتم تكبيره
    const formattedUrl = link.url.startsWith('http://') || link.url.startsWith('https://') 
    ? link.url 
    : 'https://' + link.url;
    setTimeout(() => {
      window.location.href = formattedUrl; // افتح الرابط بعد انتهاء الأنيميشن
    }, 1000); // تأخير لمدة ثانية (1000 ميلي ثانية) بعد التكبير
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">My Bookmarks</h1>
      <input
        type="text"
        placeholder="Site Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 mr-2"
      />
      <input
        type="url"
        placeholder="Site URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border p-2 mr-2"
      />
      <button onClick={handleSave} className="bg-blue-500 text-white p-2">
        {editIndex !== null ? 'Update Bookmark' : 'Add Bookmark'}
      </button>
      <div className="grid grid-cols-4 gap-4 mt-4">
        {links.map((link, index) => (
          <div 
            key={index} 
            className={`border p-4 cursor-pointer transition-transform duration-1000 ${activeIndex === index ? 'scale-150' : ''}`} // إضافة التحويل CSS
            onClick={() => handleCardClick(index, link)}
          >
            <Image
              src={`https://www.google.com/s2/favicons?domain=${link.url}`}
              alt={`${link.name} favicon`}
              className="w-8 h-8 mb-2"
            />
            <h2 className="font-bold">{link.name}</h2>
            <div className="flex justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(index);
                }}
                className="text-green-500 mt-2"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(index);
                }}
                className="text-red-500 mt-2"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
