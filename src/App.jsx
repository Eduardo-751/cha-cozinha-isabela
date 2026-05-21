import { useEffect, useState } from 'react';
import { giftsData } from './data/gifts';
import { db } from './firebase';

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

/* =========================
   IMAGENS
========================= */

import queijeiraImg from './assets/queijeira.jpg';
import jarraImg from './assets/jarra.jpg';
import espremedorImg from './assets/espremedor.jpg';
import tabuaImg from './assets/tabua.jpg';
import assadeiraImg from './assets/assadeira.jpg';

/* =========================
   COMPONENT
========================= */

export default function WeddingSite() {
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [gifts, setGifts] = useState(giftsData);

  /* =========================
     LISTA DE PRESENTES
  ========================= */

  import { giftsData } from './data/gifts';

  /* =========================
     CONFIRMAR PRESENÇA
  ========================= */

  async function handleConfirm(e) {
    e.preventDefault();

    const normalizedName = guestName.trim();

    if (!normalizedName) {
      alert('Digite seu nome.');
      return;
    }

    try {
      setLoading(true);

      const confirmationsRef = collection(db, 'confirmacoes');

      // verifica se já confirmou
      const q = query(
        confirmationsRef,
        where('nome', '==', normalizedName)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert('Esse nome já confirmou presença ✨');
        setLoading(false);
        return;
      }

      // salva confirmação
      await addDoc(confirmationsRef, {
        nome: normalizedName,
        confirmadoEm: serverTimestamp(),
      });

      alert('Presença confirmada com sucesso ✨');

      setGuestName('');
    } catch (error) {
      console.error('ERRO FIREBASE:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     RESERVAR PRESENTE
  ========================= */

  function reserveGift(giftId) {
    const person = prompt('Digite seu nome');

    if (!person) return;

    setGifts((prev) =>
      prev.map((gift) =>
        gift.id === giftId
          ? {
              ...gift,
              reserved: true,
              reservedBy: person,
            }
          : gift
      )
    );

    alert('Presente reservado com sucesso ✨');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfcfb] to-[#f5efe8] text-stone-800 font-[sans-serif]">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center scale-105" />

        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-5 py-2 rounded-full border border-stone-200 shadow-sm mb-8">
            <span className="text-xs tracking-[0.35em] uppercase text-stone-600">
              Chá de Cozinha
            </span>
          </div>

          <h1 className="text-5xl md:text-8xl font-extralight tracking-tight text-stone-900 leading-none mb-8">
            Isabela de
            <br />
            Lurdes Lima Manoel
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-2xl text-stone-700 leading-relaxed mb-10">
            Um momento especial preparado com carinho para celebrar uma nova fase.
            Sua presença tornará esse dia ainda mais inesquecível ✨
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="bg-white rounded-3xl px-8 py-5 shadow-[0_15px_60px_rgba(0,0,0,0.06)] border border-stone-100 min-w-[220px]">
              <p className="text-sm uppercase tracking-[0.3em] text-stone-500 mb-2">
                Data
              </p>

              <p className="text-2xl font-light text-stone-900">
                04 Julho 2026
              </p>
            </div>

            <div className="bg-white rounded-3xl px-8 py-5 shadow-[0_15px_60px_rgba(0,0,0,0.06)] border border-stone-100 min-w-[220px]">
              <p className="text-sm uppercase tracking-[0.3em] text-stone-500 mb-2">
                Horário
              </p>

              <p className="text-2xl font-light text-stone-900">
                15h00
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INFO + RSVP */}
      <section className="max-w-6xl mx-auto px-6 -mt-24 relative z-20 grid md:grid-cols-2 gap-8">
        {/* INFO */}
        <div className="bg-white/90 backdrop-blur rounded-[36px] shadow-[0_15px_60px_rgba(0,0,0,0.06)] p-10 border border-stone-100">
          <h2 className="text-4xl font-extralight mb-8 text-stone-900">
            Informações
          </h2>

          <div className="space-y-4 text-stone-600">
            <div>
              <p className="font-medium text-stone-900">Data</p>
              <p>04 de Julho de 2026</p>
            </div>

            <div>
              <p className="font-medium text-stone-900">Horário</p>
              <p>15h00</p>
            </div>

            <div>
              <p className="font-medium text-stone-900">Local</p>
              <p>Rua Padre Livio Emilio Calliari</p>
            </div>
          </div>
        </div>

        {/* CONFIRMAÇÃO */}
        <div className="bg-white/90 backdrop-blur rounded-[36px] shadow-[0_15px_60px_rgba(0,0,0,0.06)] p-10 border border-stone-100">
          <h2 className="text-4xl font-extralight mb-8 text-stone-900">
            Confirmação de Presença
          </h2>

          <form className="space-y-4" onSubmit={handleConfirm}>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full border border-stone-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-stone-300"
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl py-4 text-lg transition duration-300 shadow-md ${
                loading
                  ? 'bg-stone-400 text-white cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:scale-[1.01]'
              }`}
            >
              {loading ? 'Confirmando...' : 'Confirmar presença'}
            </button>
          </form>
        </div>
      </section>

      {/* PRESENTES */}
      <section className="bg-gradient-to-b from-[#f5f1eb] to-[#fcfaf7] py-28 px-6 mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-sm text-stone-500 mb-3">
              Sugestões de Presentes
            </p>

            <h2 className="text-4xl font-light mb-4">
              Sugestões para o Chá de Cozinha
            </h2>

            <p className="text-stone-600 max-w-2xl mx-auto">
              Sua presença já vai deixar esse dia ainda mais especial,
              mas também deixei algumas sugestões de presentes para quem quiser
              participar desse momento com carinho.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className="bg-white border border-stone-100 rounded-[36px] overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition duration-300"
              >
                <img
                  src={gift.image}
                  alt={gift.name}
                  className="h-64 w-full object-cover"
                />

                <div className="p-7">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-2xl font-light text-stone-900">
                      {gift.name}
                    </h3>

                    <div
                      className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                        gift.reserved
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {gift.reserved ? 'Reservado' : 'Disponível'}
                    </div>
                  </div>

                  {gift.reserved ? (
                    <p className="text-stone-600 mb-6">
                      Escolhido por{' '}
                      <span className="font-medium">
                        {gift.reservedBy}
                      </span>
                    </p>
                  ) : (
                    <div className="mb-6" />
                  )}

                  <button
                    onClick={() => reserveGift(gift.id)}
                    disabled={gift.reserved}
                    className={`w-full rounded-2xl py-4 transition ${
                      gift.reserved
                        ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                        : 'bg-stone-900 text-white hover:opacity-90'
                    }`}
                  >
                    {gift.reserved
                      ? 'Presente já escolhido'
                      : 'Quero presentear'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 text-center text-stone-400 text-sm tracking-[0.2em] uppercase border-t border-stone-100 bg-white mt-10">
        Esperamos você para celebrar esse momento especial ✨
      </footer>
    </div>
  );
}