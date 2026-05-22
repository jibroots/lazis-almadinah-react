'use client';
import { useEffect, useState } from 'react';

export default function PWAUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        // Cek apakah ada update
        if (reg.waiting) {
          setUpdateAvailable(true);
        }
      });
    }
  }, []);

  const updateApp = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] bg-emerald-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-bounce">
      <div>
        <p className="font-bold text-sm">Pembaruan Tersedia!</p>
        <p className="text-[10px] opacity-80">Klik perbarui untuk mendapatkan fitur terbaru.</p>
      </div>
      <button 
        onClick={updateApp}
        className="bg-white text-emerald-900 px-4 py-2 rounded-xl text-xs font-extrabold"
      >
        Perbarui
      </button>
    </div>
  );
}