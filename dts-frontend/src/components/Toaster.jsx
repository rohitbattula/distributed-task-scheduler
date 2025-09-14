import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

const ToastCtx = createContext(null);

export function ToasterProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((type, text, ttl = 3500) => {
    const id = crypto.randomUUID();
    setItems((xs) => [...xs, { id, type, text }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), ttl);
  }, []);

  const api = useMemo(
    () => ({
      success: (t) => push("success", t),
      error: (t) => push("error", t),
      info: (t) => push("info", t),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-wrap">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
