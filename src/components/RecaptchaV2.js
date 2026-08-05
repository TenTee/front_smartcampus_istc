"use client";

import React, { useEffect, useRef, useCallback } from "react";

const SCRIPT_ID = "smartcampus-recaptcha-script";
let recaptchaPromise;

function loadRecaptcha() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("reCAPTCHA can only be loaded in the browser."),
    );
  }

  if (window.grecaptcha && window.grecaptcha.render) {
    return Promise.resolve(window.grecaptcha);
  }

  if (recaptchaPromise) {
    return recaptchaPromise;
  }

  recaptchaPromise = new Promise((resolve, reject) => {
    const callbackName = "__smartCampusRecaptchaOnLoad";
    window[callbackName] = () => {
      if (window.grecaptcha && window.grecaptcha.render) {
        resolve(window.grecaptcha);
      } else {
        reject(new Error("Google reCAPTCHA failed to initialize."));
      }
    };

    if (document.getElementById(SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?onload=${callbackName}&render=explicit`;
    script.async = true;
    script.defer = true;
    script.onerror = () =>
      reject(new Error("Failed to load Google reCAPTCHA script."));
    document.head.appendChild(script);
  });

  return recaptchaPromise;
}

export default function RecaptchaV2({
  siteKey,
  onChange,
  theme = "light",
  size = "normal",
  tabindex = 0,
  sx,
}) {
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
    if (!siteKey) return undefined;
    if (widgetIdRef.current !== null) return undefined;

    let mounted = true;
    loadRecaptcha()
      .then((grecaptcha) => {
        if (!mounted || !containerRef.current || widgetIdRef.current !== null)
          return;
        widgetIdRef.current = grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: handleCallback,
          "expired-callback": handleExpired,
          theme,
          size,
          tabindex,
        });
      })
      .catch((error) => {
        console.error(error);
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
