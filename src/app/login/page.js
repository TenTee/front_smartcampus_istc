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
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import Link from "next/link";
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
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "#f5f7fb" }}>
      {/* Visuel de présentation */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", lg: "block" },
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
            background:
              "linear-gradient(180deg, rgba(10, 35, 91, 0.28) 10%, rgba(10, 35, 91, 0.9) 100%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "12%",
            left: { lg: "10%", xl: "14%" },
            color: "white",
            maxWidth: 510,
          }}
        >
          {/* <Typography
            variant="overline"
            sx={{ letterSpacing: 2.5, fontWeight: 700, opacity: 0.85 }}
          >
            INSTITUT SUPÉRIEUR DES TECHNOLOGIES
          </Typography> */}
          <Typography variant="h3" fontWeight={800} sx={{ mt: 1, mb: 2 }}>
            SMART CAMPUS
          </Typography>
          <Typography variant="h6" sx={{ lineHeight: 1.5, opacity: 0.92 }}>
            Plateforme de gestion centralisée pour les centres de formation
          </Typography>
        </Box>
      </Box>

      {/* Formulaire */}
      <Box
        sx={{
          flex: { xs: 1, lg: 0.8 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 3, sm: 5 },
          bgcolor: "#fff",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 480,
            p: { xs: 0, sm: 4 },
            borderRadius: 3,
            border: { sm: "1px solid #e8edf5" },
            boxShadow: { sm: "0 14px 40px rgba(20, 48, 95, 0.08)" },
          }}
        >
          <Box sx={{ textAlign: "center", mb: { xs: 3, sm: 4 } }}>
            <Box
              component="img"
              src="/logoistc2.png"
              alt="Logo de l'ISTC"
              sx={{
                display: "block",
                width: "auto",
                maxWidth: 180,
                height: 70,
                objectFit: "contain",
                mx: "auto",
                mb: 2,
              }}
            />
            <Typography variant="h4" fontWeight={800} color="text.primary">
              Bienvenue
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, lineHeight: 1.6 }}
            >
              Connectez-vous à votre espace Smart Campus
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
              autoComplete="username"
              {...register("username")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircleOutlined color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              margin="normal"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              autoComplete="current-password"
              {...register("password")}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
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
              sx={{ display: "flex", justifyContent: "flex-end", mt: 1, mb: 2 }}
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

            <Box sx={{ mt: 2, mb: 3 }}>
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
              sx={{
                py: 1.4,
                fontSize: "1rem",
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Se connecter"
              )}
            </Button>

            <Button
              component={Link}
              href="/preinscription"
              fullWidth
              variant="outlined"
              size="large"
              sx={{
                mt: 2,
                py: 1.4,
                fontSize: "0.98rem",
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              Faire une pré-inscription
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}
