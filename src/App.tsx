import Popup from "./components/Popup";
import Settings from "./components/Settings";
import { HashRouter, Routes, Route } from 'react-router-dom';

function App() {
  
  return(
    <HashRouter>
      <Routes>
        <Route path="/" element={<Popup />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}

export default App;