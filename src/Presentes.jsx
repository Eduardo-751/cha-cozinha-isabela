import { useEffect, useState } from 'react';

import {
  collection,
  onSnapshot,
} from 'firebase/firestore';

import { db } from './firebase';
import { giftsData } from './data/gifts';

import { Link } from 'react-router-dom';

export default function Presentes() {
  const [gifts, setGifts] = useState(giftsData);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'presentes'),
      (snapshot) => {
        const reservedData = {};

        snapshot.forEach((doc) => {
          reservedData[doc.id] = doc.data();
        });

        setGifts(() => {
          return giftsData.map((gift) => {
            const firebaseGift = reservedData[gift.id];

            if (!firebaseGift) return gift;

            return {
              ...gift,
              reservedCount: firebaseGift.reservedCount || 0,
              reservedBy: firebaseGift.reservedBy || [],
              quantity: firebaseGift.quantity || 1,
            };
          });
        });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f3ee] px-6 py-20">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-16">

          <div>
            <h1 className="text-5xl font-serif mb-4">
              Lista de Presentes
            </h1>

            <p className="text-stone-500">
              Escolha um presente especial ✨
            </p>
          </div>

          <Link
            to="/"
            className="border border-stone-300 px-6 py-3 rounded-full hover:bg-stone-900 hover:text-white transition"
          >
            Voltar
          </Link>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">

          {gifts.map((gift) => {
            const unavailable =
              gift.reservedCount >= gift.quantity;

            return (
              <div
                key={gift.id}
                className="bg-white rounded-[32px] overflow-hidden"
              >
                <img
                  src={gift.image}
                  alt={gift.name}
                  className="w-full h-[420px] object-cover"
                />

                <div className="p-6">

                  <h2 className="text-2xl font-serif mb-4">
                    {gift.name}
                  </h2>

                  {(gift.reservedBy || []).length > 0 && (
                    <p className="text-stone-500 text-sm mb-4">
                      Escolhido por {gift.reservedBy.join(', ')}
                    </p>
                  )}

                  <button
                    disabled={unavailable}
                    className={`w-full py-4 rounded-full transition ${
                      unavailable
                        ? 'bg-stone-200 text-stone-500'
                        : 'bg-stone-900 text-white'
                    }`}
                  >
                    {unavailable
                      ? 'Presente reservado'
                      : 'Disponível'}
                  </button>

                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}