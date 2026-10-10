"use client";

import React, { useEffect, useRef, useCallback } from "react";

const SCRIPT_ID = "smartcampus-recaptcha-script";
let recaptchaPromise;

function loadRecaptcha() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.grecaptcha && window.grecaptcha.render) {
    return Promise.resolve(window.grecaptcha);
  }

  if (recaptchaPromise) {
    return recaptchaPromise;
  }

  recaptchaPromise = new Promise((resolve) => {
    const callbackName = "__smartCampusRecaptchaOnLoad";
    const cleanup = () => {
      recaptchaPromise = null;
      delete window[callbackName];
    };

    const resolveSuccess = () => {
      cleanup();
      if (window.grecaptcha && window.grecaptcha.render) {
        resolve(window.grecaptcha);
      } else {
        resolve(null);
      }
    };

    const fail = () => {
      cleanup();
      resolve(null);
    };

    window[callbackName] = () => {
      resolveSuccess();
    };

    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolveSuccess();
        return;
      }

      existingScript.addEventListener(
        "load",
        () => {
          resolveSuccess();
        },
        { once: true },
      );

      existingScript.addEventListener(
        "error",
        () => {
          fail();
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?onload=${callbackName}&render=explicit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      fail();
    };
    script.onload = () => {
      script.dataset.loaded = "true";
    };
    document.head.appendChild(script);
  });

  return recaptchaPromise;
}

export default function RecaptchaV2({
  siteKey: siteKeyProp,
  onChange,
  theme = "light",
  size = "normal",
  tabindex = 0,
  sx,
}) {
  const siteKey =
    siteKeyProp || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const handleCallback = useCallback((token) => {
    onChangeRef.current?.(token);
  }, []);

  const handleExpired = useCallback(() => {
    onChangeRef.current?.("");
  }, []);

  useEffect(() => {
    if (!siteKey) {
      if (widgetIdRef.current !== null) {
        widgetIdRef.current = null;
      }
      return undefined;
    }

    if (widgetIdRef.current !== null) return undefined;

    let mounted = true;
    loadRecaptcha().then((grecaptcha) => {
      if (!mounted || !containerRef.current || widgetIdRef.current !== null)
        return;

      if (!grecaptcha || !grecaptcha.render) {
        return;
      }

      try {
        widgetIdRef.current = grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: handleCallback,
          "expired-callback": handleExpired,
          theme,
          size,
          tabindex,
        });
      } catch (error) {
        console.warn("reCAPTCHA render failed:", error);
        widgetIdRef.current = null;
      }
    });

    return () => {
      mounted = false;
    };
  }, [siteKey, theme, size, tabindex, handleCallback, handleExpired]);

  if (!siteKey) {
    return (
      <div style={{ color: "#d32f2f", padding: "0.75rem 0" }}>
        La clé reCAPTCHA n&apos;est pas configurée. Ajoutez
        `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: 78,
        overflow: "visible",
        position: "relative",
        zIndex: 1,
        ...sx,
      }}
    />
  );
}
