// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ModalSesionAbierta from './components/ModalSesionAbierta';

// 🔒 Bloqueo de múltiples pestañas
const lockKey = 'caja_session_lock';

// Verificar si ya hay una pestaña abierta
if (localStorage.getItem(lockKey)) {
  // Si hay una sesión activa, pregunta al usuario
  const continuar = window.confirm(
  "🔒 Sesión activa detectada\n\n" +
  "Ya existe una sesión abierta en otra pestaña o dispositivo.\n" +
  "Si continúas, se cerrará automáticamente la sesión anterior.\n\n" +
  "¿Deseas abrir una nueva sesión?"
);

  if (continuar) {
    // El usuario decide abrir nueva sesión
    // No hacemos nada, solo continuamos (la nueva sesión borrará la anterior al iniciar)
  } else {
    // El usuario cancela → cerrar esta pestaña
    alert("Acceso cancelado. Mantén la sesión en la pestaña original.");
    window.close(); // Cierra la pestaña (solo funciona en algunos navegadores)
    // Alternativa: redirigir a una página de advertencia
    window.location.replace("/bloqueado.html");
    throw new Error("Múltiple pestaña bloqueada");
  }
}

// Marcar que esta pestaña está activa
localStorage.setItem(lockKey, Date.now().toString());

// Escuchar si otra pestaña inicia sesión
const channel = new BroadcastChannel('sesion_caja');

// Si otra pestaña inicia sesión, cierra esta
channel.onmessage = (event) => {
  if (event.data.type === 'NUEVA_SESION') {
    alert('Tu sesión ha sido cerrada porque se abrió en otra pestaña.');
    localStorage.removeItem(lockKey);
    window.location.reload(); // Redirige al login
  }
};

// Cuando esta pestaña inicia sesión, avisa a otras
const iniciarNuevaSesion = () => {
  localStorage.setItem(lockKey, Date.now().toString());
  channel.postMessage({ type: 'NUEVA_SESION' });
};

// Exponer la función para que otros componentes la usen
window.iniciarNuevaSesion = iniciarNuevaSesion;

// Cuando esta pestaña se cierra, libera el bloqueo
window.addEventListener('beforeunload', () => {
  const currentLock = localStorage.getItem(lockKey);
  if (currentLock && currentLock === localStorage.getItem(lockKey)) {
    localStorage.removeItem(lockKey);
  }
});

// Renderizar la app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);