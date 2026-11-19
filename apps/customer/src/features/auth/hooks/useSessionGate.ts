import { useSessionStore } from "@/lib/store";
import { authenticateWithBackend } from "@datxe/shared";
import { getAuth, onAuthStateChanged, type User } from "@react-native-firebase/auth";
import { useEffect, useState } from "react";
import { classifyCustomerSessionFailure } from "../sessionGateHelpers";

export function useSessionGate() {
  const [destination, setDestination] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [shouldSuggestLogin, setShouldSuggestLogin] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let generation = 0;
    const timer = setTimeout(() => {
      if (active) setWaiting(true);
    }, 8000);

    const unsubscribe = onAuthStateChanged(getAuth(), (user: User | null) => {
      const version = ++generation;
      if (!user) {
        if (active) setDestination("/(auth)/login");
        return;
      }
      if (!user.phoneNumber) {
        if (active) setDestination("/(auth)/add-phone-number");
        return;
      }

      void authenticateWithBackend("customer", user)
        .then((profile) => {
          if (!active || version !== generation) return;
          if (profile.role !== "CUSTOMER") {
            setError("Tài khoản này không dành cho ứng dụng khách hàng. Hãy đăng nhập bằng tài khoản phù hợp.");
            setShouldSuggestLogin(true);
            return;
          }
          useSessionStore.getState().setUser(profile);
          setDestination(profile.phoneNumber ? "/(tabs)/home" : "/(auth)/add-phone-number");
        })
        .catch((cause: unknown) => {
          if (!active || version !== generation) return;
          const outcome = classifyCustomerSessionFailure(cause);
          if (outcome.kind === "navigate") {
            setDestination(outcome.destination);
            return;
          }
          setError(outcome.message);
          setShouldSuggestLogin(outcome.shouldSuggestLogin);
        });
    });

    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [attempt]);

  const retry = () => {
    setError("");
    setShouldSuggestLogin(false);
    setWaiting(false);
    setAttempt((current) => current + 1);
  };

  return { destination, error, shouldSuggestLogin, waiting, retry };
}
