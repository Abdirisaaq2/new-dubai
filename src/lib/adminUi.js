"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export function useDebouncedValue(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function useSmartRefetch(refetch, intervalMs = 45000) {
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!document.hidden) refetch({ silent: true });
    }, intervalMs);

    const handleFocus = () => refetch({ silent: true });
    const handleVisibility = () => {
      if (!document.hidden) refetch({ silent: true });
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refetch, intervalMs]);
}

export function isSessionError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const status = error?.status || error?.code;

  return (
    status === 401 ||
    message.includes("jwt") ||
    message.includes("session") ||
    message.includes("not authenticated") ||
    message.includes("invalid refresh token")
  );
}

export async function handleSessionExpiry(error, router) {
  if (!isSessionError(error)) return false;

  await Swal.fire({
    icon: "warning",
    title: "Session expired",
    text: "Fadlan mar kale login samee si aad admin panel-ka u sii isticmaasho.",
    confirmButtonText: "Login",
    confirmButtonColor: "#f5a400",
    background: "#111",
    color: "#fff",
  });

  router.push("/login");
  return true;
}

export async function confirmDialog({
  title,
  text,
  confirmButtonText = "Yes, continue",
}) {
  const result = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#111827",
    reverseButtons: true,
    background: "#fff",
    color: "#111",
  });

  return result.isConfirmed;
}

export function showToast(title, icon = "success") {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  });
}
