import { BrowserRouter, Routes, Route } from 'react-router-dom';

import WeddingSite from './WeddingSite';
import Presentes from './Presentes';
import ScrollToTop from './ScrollToTop';

export default function App() {
  return (
    <BrowserRouter>

      <ScrollToTop />

      <Routes>
        <Route path="/" element={<WeddingSite />} />

        <Route
          path="/presentes"
          element={<Presentes />}
        />
      </Routes>

    </BrowserRouter>
  );
}