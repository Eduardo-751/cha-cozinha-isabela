export default function WeddingSite() {
  const guests = [
    'Ana Márcia',
    'Natália Aparecida',
    'Soeli Camargo',
    'Jéssica Santos',
    'Mariana Camargo',
  ];
  const gifts = [
    {
      name: 'Jogo de Panelas',
      store: 'Magazine Luiza',
      reserved: false,
      reservedBy: '',
      link: '#',
    },
    {
      name: 'Air Fryer',
      store: 'Amazon',
      reserved: true,
      reservedBy: 'Mariana Silva',
      link: '#',
    },
    {
      name: 'Jogo de Cama',
      store: 'Camicado',
      reserved: false,
      reservedBy: '',
      link: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-stone-800">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1600&auto=format&fit=crop"
          alt="Casamento"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="uppercase tracking-[0.4em] text-sm mb-6 text-stone-600">
            Chá de Cozinha
          </p>

          <h1 className="text-5xl md:text-8xl font-extralight mb-8 text-stone-900 leading-tight">
            Isabela
          </h1>

          <p className="text-lg md:text-2xl max-w-2xl mx-auto text-stone-700 leading-relaxed">
            Estamos muito felizes em celebrar esse momento especial com você.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-10">
        <div className="bg-white/90 backdrop-blur rounded-[32px] shadow-lg p-10 border border-stone-100">
          <h2 className="text-4xl font-extralight mb-8 text-stone-900">Informações</h2>

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

        <div className="bg-white/90 backdrop-blur rounded-[32px] shadow-lg p-10 border border-stone-100">
          <h2 className="text-4xl font-extralight mb-8 text-stone-900">Confirmação de Presença</h2>

          <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();

                const form = e.currentTarget;
                const input = form.querySelector('input');
                const guestName = input.value.trim();

                const authorized = guests.some(
                  (guest) =>
                    guest.toLowerCase() === guestName.toLowerCase()
                );

                if (!authorized) {
                  alert('Seu nome não está na lista de convidadas.');
                  return;
                }

                alert('Presença confirmada com sucesso ✨');
              }}
            >
            <input
              type="text"
              placeholder="Digite seu nome completo"
              className="w-full border border-stone-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-stone-300"
            />

            <button
              type="submit"
              className="w-full bg-stone-900 text-white rounded-2xl py-4 text-lg hover:scale-[1.01] transition duration-300 shadow-md"
            >
              Confirmar presença
            </button>
          </form>
        </div>
      </section>

      <section className="bg-stone-50 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-sm text-stone-500 mb-3">
              Sugestões de Presentes
            </p>

            <h2 className="text-4xl font-light mb-4">
              Sugestões para o Chá de Cozinha
            </h2>

            <p className="text-stone-600 max-w-2xl mx-auto">
              Sua presença já vai deixar esse dia ainda mais especial, mas também deixei algumas sugestões de presentes para quem quiser participar desse momento com carinho.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {gifts.map((gift) => (
              <div
                key={gift.name}
                className="bg-white border border-stone-100 rounded-[32px] p-7 hover:-translate-y-1 hover:shadow-xl transition duration-300"
              >
                <div className="h-44 rounded-3xl bg-gradient-to-br from-stone-100 to-stone-200 mb-6" />

                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl">{gift.name}</h3>

                  <div
                    className={`text-xs px-3 py-1 rounded-full ${
                      gift.reserved
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {gift.reserved ? 'Reservado' : 'Disponível'}
                  </div>
                </div>

                <p className="text-stone-500 mb-3">{gift.store}</p>

                {gift.reserved && (
                  <p className="text-sm text-stone-600 mb-5">
                    Escolhido por <span className="font-medium">{gift.reservedBy}</span>
                  </p>
                )}

                {!gift.reserved && <div className="mb-5" />}

                <div className="space-y-3">
                  <button
                    className={`w-full rounded-2xl py-3 transition ${
                      gift.reserved
                        ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                        : 'bg-stone-900 text-white hover:opacity-90'
                    }`}
                    disabled={gift.reserved}
                  >
                    {gift.reserved
                      ? 'Presente já escolhido'
                      : 'Quero presentear'}
                  </button>

                  <a
                    href={gift.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full border border-stone-900 text-stone-900 rounded-2xl py-3 hover:bg-stone-900 hover:text-white transition"
                  >
                    Ver presente
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-14 text-center text-stone-500 text-sm border-t border-stone-100 bg-white">
        Esperamos você para celebrar esse momento especial ✨
      </footer>
    </div>
  );
}
