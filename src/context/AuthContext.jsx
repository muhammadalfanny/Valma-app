import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const ambilProfil = async (userId, id) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (id !== requestId.current) return;

    if (error) {
      console.error("Gagal mengambil role:", error);
      setRole("user");
      return;
    }

    console.log("ROLE DARI DATABASE:", data?.role);
    setRole(data?.role || "user");
  };

  const prosesSession = async (session) => {
    const id = ++requestId.current;

    setLoading(true);
    setRole(null);
    setUser(session?.user || null);

    if (session?.user) {
      await ambilProfil(session.user.id, id);
    }

    if (id === requestId.current) {
      setLoading(false);
    }
  };

  useEffect(() => {
    let aktif = true;

    const mulai = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (aktif) {
        await prosesSession(session);
      }
    };

    mulai();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!aktif) return;
        await prosesSession(session);
      }
    );

    return () => {
      aktif = false;
      requestId.current++;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
