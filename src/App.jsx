import { useEffect, useState } from 'react';

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import { db, auth, provider } from './firebase';

import { giftsData } from './data/gifts';

export default function WeddingSite() {
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);

  const [gifts, setGifts] = useState(giftsData);

  const [currentSlide, setCurrentSlide] = useState(0);

  const itemsPerSlide = 3;

  /* =========================================
     AUTH
  ========================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  async function loginGoogle() {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  }

  /* =========================================
     PRESENTES FIREBASE
  ========================================= */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'presentes'),
      (snapshot) => {
        const reservedData = {};

        snapshot.forEach((doc) => {
          reservedData[doc.id] = doc.data();
        });

        const updatedGifts = giftsData.map((gift) => {
          const firebaseGift = reservedData[gift.id];

          if (!firebaseGift) return gift;

          return {
            ...gift,
            reservedCount:
              firebaseGift.reservedCount || 0,

            reservedBy:
              firebaseGift.reservedBy || [],

            quantity:
              firebaseGift.quantity || 1,
          };
        });

        setGifts(updatedGifts);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================================
     CONFIRMAR PRESENÇA
  ========================================= */

  async function handleConfirm(e) {
    e.preventDefault();

    const normalizedName = guestName.trim();

    if (!normalizedName) {
      alert('Digite seu nome.');
      return;
    }

    try {
      setLoading(true);

      const confirmationsRef = collection(
        db,
        'confirmacoes'
      );

      const q = query(
        confirmationsRef,
        where('nome', '==', normalizedName)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert(
          'Esse nome já confirmou presença ✨'
        );

        setLoading(false);
        return;
      }

      await addDoc(confirmationsRef, {
        nome: normalizedName,
        confirmadoEm: serverTimestamp(),
      });

      alert(
        'Presença confirmada com sucesso ✨'
      );

      setGuestName('');
    } catch (error) {
      console.error(error);
      alert('Erro ao confirmar presença.');
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     RESERVAR PRESENTE
  ========================================= */

  async function reserveGift(gift) {
    if (!user) {
      alert(
        'Faça login com Google para reservar.'
      );

      return;
    }

    try {
      const person = user.displayName;

      const giftRef = doc(
        db,
        'presentes',
        String(gift.id)
      );

      const giftSnap = await getDoc(giftRef);

      let currentData = {
        reservedCount: 0,
        reservedBy: [],
        quantity: gift.quantity,
      };

      if (giftSnap.exists()) {
        currentData = giftSnap.data();
      }

      if (
        currentData.reservedCount >=
        currentData.quantity
      ) {
        alert(
          'Esse presente já foi reservado ✨'
        );

        return;
      }

      const alreadyReserved =
        currentData.reservedBy?.includes(person);

      if (alreadyReserved) {
        alert(
          'Você já reservou este presente ✨'
        );

        return;
      }

      await setDoc(giftRef, {
        quantity: currentData.quantity,

        reservedCount:
          currentData.reservedCount + 1,

        reservedBy: [
          ...(currentData.reservedBy || []),
          person,
        ],
      });

      alert(
        'Presente reservado com sucesso ✨'
      );
    } catch (error) {
      console.error(error);

      alert('Erro ao reservar presente.');
    }
  }

  /* =========================================
     CANCELAR RESERVA
  ========================================= */

  async function cancelReservation(gift) {
    if (!user) return;

    try {
      const person = user.displayName;

      const giftRef = doc(
        db,
        'presentes',
        String(gift.id)
      );

      const giftSnap = await getDoc(giftRef);

      if (!giftSnap.exists()) {
        return;
      }

      const data = giftSnap.data();

      const updatedNames =
        data.reservedBy.filter(
          (name) => name !== person
        );

      await setDoc(giftRef, {
        ...data,

        reservedCount: Math.max(
          data.reservedCount - 1,
          0
        ),

        reservedBy: updatedNames,
      });

      alert('Reserva cancelada ✨');
    } catch (error) {
      console.error(error);
    }
  }

  /* =========================================
     CAROUSEL
  ========================================= */

  const totalSlides = Math.ceil(
    gifts.length / itemsPerSlide
  );

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev + 1 >= totalSlides ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev - 1 < 0 ? totalSlides - 1 : prev - 1
    );
  };

  const visibleGifts = gifts.slice(
    currentSlide * itemsPerSlide,
    currentSlide * itemsPerSlide +
    itemsPerSlide
  );

  return (
    <div className="bg-[#f7f3ee] text-stone-800 overflow-hidden">
      {/* HERO */}

      <section className="relative min-h-screen flex items-center justify-center">

        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2000&auto=format&fit=crop')",
          }}
        />

        <div className="absolute inset-0 bg-black/40" />

        {/* NAV */}

        <div className="absolute top-0 left-0 w-full z-30 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">

            {user ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-2 rounded-full">

                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div className="hidden md:block">
                  <p className="text-white text-sm">
                    {user.displayName}
                  </p>

                  <p className="text-white/60 text-xs">
                    conectado
                  </p>
                </div>

                <button
                  onClick={logout}
                  className="text-white/70 hover:text-white text-sm transition"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={loginGoogle}
                className="bg-white text-stone-900 px-6 py-3 rounded-full hover:scale-[1.02] transition duration-300 shadow-2xl"
              >
                Entrar com Google
              </button>
            )}
          </div>
        </div>

        {/* HERO CONTENT */}

        <div className="relative z-20 text-center px-6">

          <p className="uppercase tracking-[0.5em] text-white/70 text-sm mb-8">
            Chá de Cozinha
          </p>

          <h1 className="text-white text-6xl md:text-8xl font-serif leading-none mb-10">
            Isabela
          </h1>

          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-14">
            Um momento especial preparado com carinho
            para celebrar uma nova fase.
          </p>

          <div className="flex flex-wrap justify-center gap-5">

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-10 py-6 rounded-[30px] min-w-[220px]">

              <p className="uppercase tracking-[0.3em] text-white/60 text-xs mb-3">
                Data
              </p>

              <p className="text-white text-3xl font-light">
                04 Julho 2026
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-10 py-6 rounded-[30px] min-w-[220px]">

              <p className="uppercase tracking-[0.3em] text-white/60 text-xs mb-3">
                Horário
              </p>

              <p className="text-white text-3xl font-light">
                15h00
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP */}

      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">

          <p className="uppercase tracking-[0.3em] text-stone-400 text-sm mb-4">
            Confirmação
          </p>

          <h2 className="text-5xl md:text-6xl font-serif mb-8">
            Esperamos você
          </h2>

          <p className="text-stone-500 text-lg leading-relaxed mb-14">
            Sua presença tornará esse dia ainda mais
            inesquecível ✨
          </p>

          <form
            onSubmit={handleConfirm}
            className="space-y-5"
          >
            <input
              type="text"
              value={guestName}
              onChange={(e) =>
                setGuestName(e.target.value)
              }
              placeholder="Digite seu nome completo"
              className="w-full bg-white border border-stone-200 rounded-full px-8 py-5 text-center text-lg outline-none focus:ring-2 focus:ring-stone-300 shadow-sm"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-stone-900 text-white px-10 py-5 rounded-full text-lg hover:scale-[1.02] transition duration-300"
            >
              {loading
                ? 'Confirmando...'
                : 'Confirmar presença'}
            </button>
          </form>
        </div>
      </section>

      {/* PRESENTES */}

      <section className="py-32 px-6 bg-white">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-20">

            <p className="uppercase tracking-[0.3em] text-stone-400 text-sm mb-4">
              Lista de Presentes
            </p>

            <h2 className="text-5xl md:text-6xl font-serif mb-8">
              Sugestões Especiais
            </h2>

            <p className="text-stone-500 max-w-2xl mx-auto text-lg">
              Sua presença já é um presente, mas
              deixamos algumas sugestões para quem
              quiser participar desse momento com
              carinho ✨
            </p>
          </div>
          {/* CAROUSEL */}

          <div className="relative">

            {/* BOTÃO ESQUERDA */}

            <button
              onClick={prevSlide}
              className="
      absolute
      left-[-20px]
      top-1/2
      -translate-y-1/2
      z-20
      w-14
      h-14
      rounded-full
      bg-white/90
      backdrop-blur-xl
      border
      border-stone-200
      shadow-lg
      flex
      items-center
      justify-center
      hover:bg-stone-900
      hover:text-white
      transition
      duration-300
    "
            >
              ←
            </button>

            {/* BOTÃO DIREITA */}

            <button
              onClick={nextSlide}
              className="
      absolute
      right-[-20px]
      top-1/2
      -translate-y-1/2
      z-20
      w-14
      h-14
      rounded-full
      bg-white/90
      backdrop-blur-xl
      border
      border-stone-200
      shadow-lg
      flex
      items-center
      justify-center
      hover:bg-stone-900
      hover:text-white
      transition
      duration-300
    "
            >
              →
            </button>

            {/* GRID */}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">

              {visibleGifts.map((gift) => {

                const userReserved =
                  gift.reservedBy?.includes(
                    user?.displayName
                  );

                const unavailable =
                  gift.reservedCount >=
                  gift.quantity;

                return (
                  <div
                    key={gift.id}
                    className="group"
                  >
                    <div className="overflow-hidden rounded-[36px] mb-6">

                      <img
                        src={gift.image}
                        alt={gift.name}
                        className="w-full h-[420px] object-cover group-hover:scale-105 transition duration-700"
                      />
                    </div>

                    <div className="flex flex-col justify-between min-h-[220px]">

                      <div>

                        <h3 className="
      text-3xl
      font-serif
      leading-tight
      min-h-[76px]
      flex
      items-start
    ">
                          {gift.name}
                        </h3>

                        <div className="h-[40px] mt-4">
                          {gift.reservedBy.length > 0 && (
                            <p className="text-stone-500 text-sm">
                              Escolhido por{' '}
                              {gift.reservedBy.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 pt-4">

                        <button
                          onClick={() =>
                            reserveGift(gift)
                          }
                          disabled={unavailable}
                          className={`w-full rounded-full py-4 transition duration-300 ${unavailable
                              ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                              : 'bg-stone-900 text-white hover:opacity-90'
                            }`}
                        >
                          {unavailable
                            ? 'Presente reservado'
                            : 'Quero presentear'}
                        </button>

                        {userReserved && (
                          <button
                            onClick={() =>
                              cancelReservation(gift)
                            }
                            className="w-full border border-stone-300 text-stone-700 rounded-full py-4 hover:bg-stone-100 transition"
                          >
                            Cancelar reserva
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="py-24 text-center bg-[#f7f3ee]">

        <h2 className="text-5xl font-serif mb-6">
          Esperamos você ✨
        </h2>

        <p className="text-stone-500">
          Será um dia inesquecível.
        </p>
      </footer>
    </div>
  );
}