import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import Login from './components/Loogin';
import Diagrama from './components/Diagrama';


function App() {
  return (
    // <div className="App">
    //   <Diagram />
    // </div>
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<Login />} /> */}
        <Route className="App" path="/" element={<Diagrama />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
