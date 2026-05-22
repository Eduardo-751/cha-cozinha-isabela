import { useEffect, useState, useMemo } from 'react';

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  arrayRemove,
  updateDoc,
  increment,
  arrayUnion
} from 'firebase/firestore';

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import { Link } from 'react-router-dom';
import { db, auth, provider } from './firebase';
import { giftsData } from './data/gifts';
import bgImage from './assets/bg1.jpg';

export default function WeddingSite() {

  const [loadingRSVP, setLoadingRSVP] = useState(false);
  const [user, setUser] = useState(null);
  const [newCompanion, setNewCompanion] = useState('');
  const [confirmationDoc, setConfirmationDoc] = useState(null);
  const [gifts, setGifts] = useState(giftsData);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(3);
  const [confirmed, setConfirmed] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingGift, setLoadingGift] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* =========================================
     AUTH
  ========================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setConfirmed(!!currentUser);
    });

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

  /* =========================================
     CONFIRMAR PRESENÇA
  ========================================= */

  async function handleConfirm(e) {
    e.preventDefault();

    let currentUser = user;

    if (!currentUser) {
      try {
        const result = await signInWithPopup(auth, provider);
        currentUser = result.user;
      } catch (error) {
        console.error(error);
        alert('Login cancelado ou falhou.');
        return;
      }
    }

    try {
      setLoadingRSVP(true);

      const ref = doc(db, 'confirmacoes', currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        alert('Você já confirmou presença ✨');
        return;
      }

      await setDoc(ref, {
        uid: currentUser.uid,
        nome: currentUser.displayName,
        email: currentUser.email,
        foto: currentUser.photoURL,
        confirmadoEm: serverTimestamp(),
        acompanhantes: [],
      });

      setConfirmed(true);
      alert('Presença confirmada com sucesso ✨');

      setConfirmationDoc({
        uid: currentUser.uid,
        nome: currentUser.displayName,
        email: currentUser.email,
        foto: currentUser.photoURL,
        acompanhantes: [],
      });

    } catch (error) {
      console.error(error);
      alert('Erro ao confirmar presença.');
    } finally {
      setLoadingRSVP(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setConfirmed(false);
      setConfirmationDoc(null);
      return;
    }

    let isActive = true;

    async function checkConfirmation() {
      try {
        const confirmationsRef = collection(db, 'confirmacoes');

        const q = query(
          confirmationsRef,
          where('uid', '==', user.uid)
        );

        const snapshot = await getDocs(q);

        if (!isActive) return;

        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          setConfirmed(true);
          setConfirmationDoc({
            id: docData.id,
            ...docData.data(),
          });
        } else {
          setConfirmed(false);
          setConfirmationDoc(null);
        }

      } catch (error) {
        console.error(error);
      }
    }

    checkConfirmation();

    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setConfirmed(false);
      setConfirmationDoc(null);
      return;
    }

    const ref = doc(db, 'confirmacoes', user.uid);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setConfirmed(true);
        setConfirmationDoc({
          id: snap.id,
          ...snap.data(),
        });
      } else {
        setConfirmed(false);
        setConfirmationDoc(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  /* =========================================
     ADICIONAR ACOMPANHANTE 
  ========================================= */
  async function addCompanion() {
    if (!user || !newCompanion.trim()) return;

    try {
      const ref = doc(db, 'confirmacoes', user.uid);

      await updateDoc(ref, {
        acompanhantes: arrayUnion(newCompanion.trim()),
      });

      setNewCompanion('');
    } catch (error) {
      console.error(error);
    }
  }



  /* =========================================
       REMOVER ACOMPANHANTE 
    ========================================= */

  async function removeCompanion(name) {
    if (!user) return;

    try {
      const ref = doc(db, 'confirmacoes', user.uid);

      await updateDoc(ref, {
        acompanhantes: arrayRemove(name),
      });

    } catch (error) {
      console.error(error);
    }
  }

  /* =========================================
     RESERVAR PRESENTE
  ========================================= */

  async function reserveGift(gift) {
    if (!user || loadingGift) return;

    setLoadingGift(true);

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

      if (currentData.reservedCount >= currentData.quantity) {
        alert('Esse presente já foi reservado ✨');
        setLoadingGift(false);
        return;
      }

      const alreadyReserved =
        currentData.reservedBy?.includes(person);

      if (alreadyReserved) {
        alert('Você já reservou este presente ✨');
        setLoadingGift(false);
        return;
      }

      await setDoc(giftRef, {
        quantity: currentData.quantity,
        reservedCount: currentData.reservedCount + 1,
        reservedBy: [...(currentData.reservedBy || []), person,],
      });
    } catch (error) {
      console.error(error);
      alert('Erro ao reservar presente.');
    } finally {
      setLoadingGift(false);
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

      const updatedNames = (data.reservedBy || []).filter(
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

  const sortedGifts = useMemo(() => {
    return [...gifts].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR')
    );
  }, [gifts]);

  const groupedGifts = useMemo(() => {
    const groups = [];

    for (let i = 0; i < sortedGifts.length; i += itemsPerSlide) {
      groups.push(sortedGifts.slice(i, i + itemsPerSlide));
    }

    return groups;
  }, [sortedGifts]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) {
        setItemsPerSlide(1);
      } else if (window.innerWidth < 1280) {
        setItemsPerSlide(2);
      } else {
        setItemsPerSlide(3);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () =>
      window.removeEventListener('resize', handleResize);

  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-[#f7f3ee] text-stone-800 overflow-x-hidden">
      {/* HERO */}

      <section className="relative min-h-screen flex items-center justify-center">

        <div
          className="absolute inset-0 bg-cover bg-center scale-100"
          style={{
            backgroundImage: `url(${bgImage})`,
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

          <h1 className="text-white text-4xl sm:text-5xl md:text-8xl font-serif leading-none mb-10">
            Isabela
          </h1>

          <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-14">
            Um momento especial preparado com carinho
            para celebrar uma nova fase.
          </p>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6">

            {/* CARD 1 - DATA & HORÁRIO */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-10 py-8 rounded-[30px] w-[300px] h-[220px] text-center">

              <p className="uppercase tracking-[0.3em] text-white/60 text-xs mb-4">
                Data & Horário
              </p>

              <p className="text-white text-3xl font-light mb-4">
                04 Julho 2026
              </p>

              <div className="w-full h-px bg-white/20 mb-4" />

              <p className="text-white text-3xl font-light">
                15h00
              </p>

            </div>

            {/* CARD 2 - LOCAL */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-10 py-8 rounded-[30px] w-[300px] h-[220px] text-center">

              <p className="uppercase tracking-[0.3em] text-white/60 text-xs mb-4">
                Local
              </p>

              <p className="text-white text-xl font-light leading-snug mb-2">
                Salão de Festas<br />
                Ibiti Reserva
              </p>

              <p className="text-white/60 text-sm mb-4">
                CEP 18086-776 · Sorocaba/SP
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Ibiti+Reserva+Sorocaba"
                target="_blank"
                rel="noreferrer"
                className="text-white text-sm underline opacity-80 hover:opacity-100 transition"
              >
                Ver no Google Maps →
              </a>

            </div>

          </div>
        </div>
      </section>

      {/* RSVP */}

      <section className="py-32 px-6 ">
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

          {confirmed ? (
            <button className="bg-stone-900 text-white px-10 py-4 rounded-full disabled:opacity-60 disabled:cursor-not-allowed w-[260px]">
              <span className="text-green-300 text-xl">✔</span>
              <span>Presença confirmada</span>
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loadingRSVP || confirmed}
              className="bg-stone-900 text-white px-10 py-4 rounded-full disabled:opacity-60 disabled:cursor-not-allowed w-[260px]"
            >
              {loadingRSVP
                ? 'Confirmando...'
                : confirmed
                  ? 'Presença já confirmada ✔'
                  : 'Confirmar presença'}
            </button>
          )}
          {confirmationDoc && (
            <div className="mt-10 max-w-md mx-auto text-center">
              <h3 className="text-xl font-serif mb-4">
                Você também pode confirmar presença para outras pessoas
              </h3>

              <div className="flex gap-2 mb-4">
                <input
                  value={newCompanion}
                  onChange={(e) => setNewCompanion(e.target.value)}
                  placeholder="Digite o nome da pessoa"
                  className="border p-3 rounded w-full"
                />

                <button
                  onClick={addCompanion}
                  className="bg-stone-900 text-white px-4 rounded"
                >
                  Confirmar
                </button>
              </div>

              <ul className="text-left space-y-1">
                <li className="flex justify-between items-center">
                  <span>
                    {confirmationDoc?.nome}
                  </span>

                  <span className="text-green-500">
                    Confirmado
                  </span>
                </li>
                {confirmationDoc?.acompanhantes?.map((c, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{c}</span>

                    <button
                      onClick={() => removeCompanion(c)}
                      className="text-red-500"
                    >
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
              Será um prazer compartilhar esse momento com você, preparamos algumas sugestões de presente com carinho para esta data.
            </p>
          </div>
          {/* CAROUSEL */}

          <div
            className="relative"
            onTouchStart={(e) => {
              setStartX(e.touches[0].clientX);
              setIsDragging(true);
            }}
            onTouchEnd={(e) => {
              if (!isDragging) return;

              const endX = e.changedTouches[0].clientX;
              const diff = startX - endX;

              if (Math.abs(diff) > 50) {
                if (diff > 0) {
                  nextSlide(); // swipe esquerda
                } else {
                  prevSlide(); // swipe direita
                }
              }

              setIsDragging(false);
            }}
            onMouseDown={(e) => {
              if (!isMobile) return;
              setStartX(e.clientX);
              setIsDragging(true);
            }}
            onMouseUp={(e) => {
              if (!isDragging) return;

              const diff = startX - e.clientX;

              if (Math.abs(diff) > 50) {
                if (diff > 0) nextSlide();
                else prevSlide();
              }

              setIsDragging(false);
            }}
          >

            {/* BOTÃO ESQUERDA */}

            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-[-20px] top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/90
                        backdrop-blur-xl border border-stone-200 shadow-lg flex items-center justify-center hover:bg-stone-900
                        hover:text-white transition duration-300"
            >
              ←
            </button>

            {/* BOTÃO DIREITA */}

            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-[-20px] top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/90
                        backdrop-blur-xl border border-stone-200 shadow-lg flex items-center justify-center hover:bg-stone-900 
                        hover:text-white transitio duration-300"
            >
              →
            </button>

            {/* GRID */}
            {/* CAROUSEL */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                }}
              >

                {groupedGifts.map((group, index) => (
                  <div
                    key={index}
                    className="w-full flex-shrink-0"
                  >

                    {/* GRID DO SLIDE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-4">

                      {group.map((gift) => {
                        const userReserved =
                          gift.reservedBy?.includes(user?.displayName);

                        const unavailable =
                          gift.reservedCount >= gift.quantity;

                        return (
                          <div key={gift.id} className="group w-full">

                            {/* CARD */}
                            <div className="overflow-hidden rounded-[36px] mb-6">
                              <img
                                src={gift.image}
                                alt={gift.name}
                                className="w-full h-[420px] object-cover group-hover:scale-105 transition duration-700"
                              />
                            </div>

                            <div className="flex flex-col justify-between min-h-[220px]">

                              <div>
                                <h3 className="text-3xl font-serif leading-tight min-h-[76px] flex items-start">
                                  {gift.name}
                                </h3>

                                <div className="h-[40px] mt-4">
                                  {(gift.reservedBy || []).length > 0 && (
                                    <p className="text-stone-500 text-sm">
                                      Escolhido por {gift.reservedBy.join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3 pt-4">

                                <button
                                  onClick={() => reserveGift(gift)}
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

                                <div className="h-[56px]">
                                  {userReserved ? (
                                    <button
                                      onClick={() => cancelReservation(gift)}
                                      className="w-full border border-stone-300 text-stone-700 rounded-full py-4 hover:bg-stone-100 transition"
                                    >
                                      Cancelar reserva
                                    </button>
                                  ) : (
                                    <div className="w-full h-full" />
                                  )}
                                </div>

                              </div>

                            </div>

                          </div>
                        );
                      })}

                    </div>
                    <div className="text-center mt-14">
                      <Link
                        to="/presentes"
                        className=" inline-flex items-center justify-center px-8 py-4 rounded-full border border-stone-300 text-stone-800 hover:bg-stone-900 hover:text-white transition"
                      >
                        Ver lista completa
                      </Link>
                    </div>
                  </div>
                ))}

              </div>
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