import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DiagramaClases from './components/DiagramaClases';
import Principal from './components/Principal';
import Login from './components/Login';
import Register from './components/Register';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route className="App" path="/diagrama/:nombreDiagrama/:coleccion/:existe" element={<DiagramaClases />} />
        <Route path="/principal" element={<Principal />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
