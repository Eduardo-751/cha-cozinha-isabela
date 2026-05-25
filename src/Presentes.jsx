import { useEffect, useState } from 'react';

import {
    collection,
    onSnapshot,
    doc,
    getDoc,
    setDoc,
} from 'firebase/firestore';

import {
    onAuthStateChanged,
} from 'firebase/auth';

import { db, auth } from './firebase';
import { giftsData } from './data/gifts';
import { Link } from 'react-router-dom';

export default function Presentes() {
    const [gifts, setGifts] = useState(giftsData);
    const [user, setUser] = useState(null);
    const [loadingGift, setLoadingGift] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

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

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'presentes'),
            (snapshot) => {

                const reservedData = {};

                snapshot.forEach((doc) => {
                    reservedData[doc.id] = doc.data();
                });

                setGifts(() => {
                    return gifts.map((gift) => {

                        const firebaseGift =
                            reservedData[gift.id];

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
                });
            }
        );

        return () => unsubscribe();
    }, []);

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

            if (
                currentData.reservedCount >=
                currentData.quantity
            ) {
                toast('Esse presente já foi reservado');
                return;
            }

            const alreadyReserved =
                currentData.reservedBy?.includes(person);

            if (alreadyReserved) {
                toast('Você já reservou este presente');
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

            toast.success('Presente reservado ✨');

        } catch (error) {

            console.error(error);

            toast.error('Erro ao reservar');

        } finally {

            setLoadingGift(false);
        }
    }

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


    return (
        <div className="min-h-screen bg-[#f7f3ee] px-6 py-20">

            <div className="max-w-[1800px] mx-auto">

                <div className="flex items-center justify-between mb-16">

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

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8">

                    {gifts.map((gift) => {

                        const userReserved =
                            gift.reservedBy?.includes(user?.displayName);

                        const unavailable =
                            (gift.reservedCount || 0) >= (gift.quantity || 1);

                        return (
                            <div
                                key={gift.id}
                                className="bg-white rounded-[32px] overflow-hidden p-4"
                            >

                                <div className="overflow-hidden rounded-[24px]">
                                    <img
                                        src={gift.image}
                                        alt={gift.name}
                                        className="w-full h-[320px] object-cover hover:scale-105 transition duration-700"
                                    />
                                </div>

                                <div className="pt-5">

                                    <h2 className="text-xl font-serif leading-tight mb-2">
                                        {gift.name}
                                    </h2>

                                    <p className="text-sm text-stone-500 mb-4">
                                        Disponível{" "}
                                        {(gift.quantity || 1) - (gift.reservedCount || 0)}
                                        {" "}de {gift.quantity || 1}
                                    </p>

                                    {(gift.reservedBy || []).length > 0 && (
                                        <div className="flex flex-col gap-1 mb-4">

                                            {gift.reservedBy.map((person, index) => (
                                                <p
                                                    key={index}
                                                    className="text-sm text-stone-500"
                                                >
                                                    Escolhido por {person}
                                                </p>
                                            ))}

                                        </div>
                                    )}

                                    <button
                                        onClick={() => reserveGift(gift)}
                                        disabled={unavailable}
                                        className={`w-full rounded-full py-4 transition ${unavailable
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
                                            onClick={() => cancelReservation(gift)}
                                            className="w-full mt-3 border border-stone-300 rounded-full py-4 hover:bg-stone-100 transition"
                                        >
                                            Cancelar reserva
                                        </button>
                                    )}

                                    {gift.link && (
                                        <a
                                            href={gift.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block text-center text-sm text-stone-500 hover:text-stone-900 transition mt-4"
                                        >
                                            Ver referência →
                                        </a>
                                    )}

                                </div>

                            </div>
                        );
                    })}

                </div>

            </div>

        </div>
    );
}