import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear(); // Obtener el año actual

    return (
        <footer className="bg-dark text-white text-center py-3 mt-5">
            <p>&copy; {currentYear} Factura Digital Inteligente(FADIN). Todos los derechos reservados. Realizado por: Julio Pérez</p>
        </footer>
    );
};

export default Footer;