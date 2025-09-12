import { useState, useEffect } from 'react';

/**
 * Bir değeri "debounce" eden custom hook.
 * @param {*} value - Debounce edilecek değer (örn: arama terimi).
 * @param {number} delay - Milisaniye cinsinden gecikme süresi.
 * @returns {*} - Gecikme süresi sonunda güncellenen değer.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Değer değiştiğinde bir zamanlayıcı başlat.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Bir sonraki `useEffect` çalışmadan önce veya bileşen unmount olduğunda
    // önceki zamanlayıcıyı temizle. Bu, her tuş vuruşunda zamanlayıcının sıfırlanmasını sağlar.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Sadece `value` veya `delay` değiştiğinde yeniden çalışır.

  return debouncedValue;
}
