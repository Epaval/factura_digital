import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BcvDollar = () => {
  const [dollarRate, setDollarRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDollarRate = async () => {
      try {
        const response = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial');
        // Accede al campo "promedio" de la respuesta
        setDollarRate(response.data.promedio);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDollarRate();
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className='m-3'>
      <h6>Dólar BCV</h6>
      {/* Muestra el valor del dólar */}
      <p>{dollarRate} Bs/USD</p>
    </div>
  );
};

export default BcvDollar;