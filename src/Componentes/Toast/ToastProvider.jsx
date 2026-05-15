/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from 'react';
import styles from './Toast.module.css';

// Global function to trigger a toast from ANYWHERE without needing context
export const showToast = (message, type = 'info', title = '') => {
  const event = new CustomEvent('show-toast', { detail: { message, type, title } });
  window.dispatchEvent(event);
};

export default function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleShow = (e) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, ...e.detail }]);
      
      // Auto-hide after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, hiding: true } : t));
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 300); // Wait for fade out animation
      }, 4000); 
    };

    window.addEventListener('show-toast', handleShow);
    return () => window.removeEventListener('show-toast', handleShow);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, hiding: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  };

  return (
    <div className={styles.toastContainer}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]} ${t.hiding ? styles.hiding : ''}`}>
          <div className={styles.icon}>
            {t.type === 'success' && <ion-icon name="checkmark-circle" />}
            {t.type === 'error' && <ion-icon name="alert-circle" />}
            {t.type === 'info' && <ion-icon name="information-circle" />}
          </div>
          <div className={styles.content}>
            {t.title && <span className={styles.title}>{t.title}</span>}
            <span className={styles.message}>{t.message}</span>
          </div>
          <button className={styles.closeBtn} onClick={() => removeToast(t.id)}>
            <ion-icon name="close-outline" />
          </button>
        </div>
      ))}
    </div>
  );
}
