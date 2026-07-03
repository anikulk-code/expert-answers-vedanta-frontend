import React from 'react';
import { Route, Routes } from 'react-router-dom';
import GitaLanding from './GitaLanding';
import GitaChapter from './GitaChapter';
import GitaVerse from './GitaVerse';

function GitaRoutes() {
  return (
    <div className="gita-shell">
      <Routes>
        <Route index element={<GitaLanding />} />
        <Route path=":chapter" element={<GitaChapter />} />
        <Route path=":chapter/:verse" element={<GitaVerse />} />
      </Routes>
    </div>
  );
}

export default GitaRoutes;
