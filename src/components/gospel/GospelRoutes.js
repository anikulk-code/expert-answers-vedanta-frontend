import React from 'react';
import { Route, Routes } from 'react-router-dom';
import GospelLanding from './GospelLanding';
import GospelChapter from './GospelChapter';
import GospelSearch from './GospelSearch';

function GospelRoutes() {
  return (
    <div className="gita-shell">
      <div className="gita-page">
        <GospelSearch />
      </div>
      <Routes>
        <Route index element={<GospelLanding />} />
        <Route path=":chapter" element={<GospelChapter />} />
      </Routes>
    </div>
  );
}

export default GospelRoutes;
