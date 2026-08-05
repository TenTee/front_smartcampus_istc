"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { authService } from "../../services/api/services";
import { getApiErrorMessage } from "../../services/api/client";
import RecaptchaV2 from "../../components/RecaptchaV2";

const schema = yup.object({
  username: yup.string().required("Le nom d'utilisateur est requis"),
  password: yup
    .string()
    .min(6, "Minimum 6 caractères")
    .required("Le mot de passe est requis"),
});

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaError, setRecaptchaError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const onSubmit = async (values) => {
    if (!recaptchaToken) {
      setRecaptchaError("Veuillez compléter le reCAPTCHA.");
      return;
    }

    setSubmitError("");
    setRecaptchaError("");
    try {
      const payload = { ...values, recaptcha_token: recaptchaToken };
      const data = await authService.login(payload);

      const accessToken = data?.access;
      if (!accessToken) {
        throw new Error("Token introuvable dans la reponse API.");
      }

      localStorage.setItem("token", accessToken);
      if (data?.refresh) {
        localStorage.setItem("refreshToken", data.refresh);
      }
      localStorage.setItem("loginTime", Date.now().toString());

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem(
          "user_role",
          data.user.role || data.user.role_code || "",
        );
      } else if (data?.role || data?.role_code) {
        localStorage.setItem("user_role", data.role || data.role_code || "");
      }

      // Extract permissions from JWT token and store them
      let isFormateur = false;
      try {
        const base64Url = accessToken.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        );
        const decoded = JSON.parse(jsonPayload);
        if (decoded.permissions) {
          const permsToStore = { ...decoded.permissions };
          if (decoded.is_superuser) permsToStore.is_superuser = true;
          localStorage.setItem(
            "user_permissions",
            JSON.stringify(permsToStore),
          );
        } else if (decoded.is_superuser) {
          localStorage.setItem(
            "user_permissions",
            JSON.stringify({ is_superuser: true }),
          );
        }
        if (decoded.is_formateur) {
          isFormateur = true;
          localStorage.setItem("is_formateur", "true");
        }
      } catch (e) {}

      if (data?.user?.is_formateur) {
        isFormateur = true;
        localStorage.setItem("is_formateur", "true");
      }

      document.cookie = `token=${accessToken}; path=/; max-age=${6 * 60 * 60}`;

      window.dispatchEvent(new Event("appConfigChanged"));

      const role = localStorage.getItem("user_role");
      if (role === "etudiant") {
        router.push("/portal");
      } else if (isFormateur && !data?.user?.is_superuser) {
        router.push("/formateur-portal");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          "Connexion impossible. Vérifiez vos identifiants.",
        ),
      );
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Left side - Image */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "block" },
          bgcolor: "#193A7F",
          backgroundImage: 'url("/logonstudent.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(25, 58, 127, 0.7)", // Blue overlay
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "20%",
            left: "10%",
            color: "white",
            maxWidth: "80%",
          }}
        >
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            SMART CAMPUS
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Plateforme de gestion centralisée pour les centres de formation
          </Typography>
        </Box>
      </Box>

      {/* Right side - Form */}
      <Box
        sx={{
          flex: { xs: 1, md: 0.8 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 500 }}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              color="primary"
              sx={{ mb: 1 }}
            >
              <img src="/LOGO SMART CAMPUS.svg" alt="Logo Smart Campus" />
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Bienvenue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Connectez-vous à votre espace administrateur
            </Typography>
          </Box>

          {submitError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Nom d'utilisateur"
              variant="outlined"
              margin="normal"
              error={Boolean(errors.username)}
              helperText={errors.username?.message}
              placeholder="admin"
              {...register("username")}
            />
            <TextField
              fullWidth
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              margin="normal"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register("password")}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{ display: "flex", justifyContent: "flex-end", mt: 1, mb: 3 }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Mot de passe oublié ?
              </Typography>
            </Box>

            <Box sx={{ mt: 2, mb: 2 }}>
              <RecaptchaV2
                siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={(token) => {
                  setRecaptchaToken(token);
                  if (token) setRecaptchaError("");
                }}
                sx={{ minHeight: "80px" }}
              />
              {recaptchaError ? (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ display: "block", mt: 1 }}
                >
                  {recaptchaError}
                </Typography>
              ) : null}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              color="primary"
              disabled={isSubmitting}
              sx={{ py: 1.5, fontSize: "1rem", fontWeight: "bold" }}
            >
              {isSubmitting ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
}
