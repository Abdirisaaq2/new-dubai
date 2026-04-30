"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/supabaseAuth";

const SESSION_STARTED_AT_KEY = "new-dubai-session-started-at";
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export default function SessionTimeout() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function expireSession() {
      localStorage.removeItem(SESSION_STARTED_AT_KEY);
      await supabase.auth.signOut();
      router.replace("/login");
    }

    async function syncSessionStart() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        localStorage.removeItem(SESSION_STARTED_AT_KEY);
        return;
      }

      if (!localStorage.getItem(SESSION_STARTED_AT_KEY)) {
        localStorage.setItem(SESSION_STARTED_AT_KEY, String(Date.now()));
      }
    }

    const checkSession = async () => {
      const startedAt = Number(localStorage.getItem(SESSION_STARTED_AT_KEY));

      if (!startedAt) {
        await syncSessionStart();
        return;
      }

      if (Date.now() - startedAt >= SESSION_MAX_AGE_MS) {
        await expireSession();
      }
    };

    syncSessionStart();

    const intervalId = window.setInterval(checkSession, 15000);
    const timeoutId = window.setTimeout(checkSession, SESSION_MAX_AGE_MS);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        localStorage.removeItem(SESSION_STARTED_AT_KEY);
        return;
      }

      if (event === "SIGNED_IN") {
        localStorage.setItem(SESSION_STARTED_AT_KEY, String(Date.now()));
      }
    });

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
