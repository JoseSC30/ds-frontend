import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/principal');
    } catch (error) {
      setError('Error al iniciar sesión: ' + error.message);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleLogin} className="auth-form">
        <h2>Iniciar Sesión</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Iniciar Sesión</button>
      <div>
        <p>¿No tienes cuenta? <a href="/register">Regístrate</a></p>
      </div>
      </form>
    </div>
  );
};

export default Login;