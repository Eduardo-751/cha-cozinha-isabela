import { BrowserRouter, Routes, Route } from 'react-router-dom';

import WeddingSite from './WeddingSite';
import Presentes from './Presentes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Página principal */}
        <Route
          path="/"
          element={<WeddingSite />}
        />

        {/* Página da lista completa */}
        <Route
          path="/presentes"
          element={<Presentes />}
        />

      </Routes>
    </BrowserRouter>
  );
}