# Sprawdzenie Konfiguracji Redirect URLs w Supabase

## Problem

Link weryfikacyjny email nie działa - prawdopodobnie Supabase nie ma skonfigurowanych poprawnych redirect URLs.

## Rozwiązanie

### Krok 1: Sprawdź Redirect URLs w Supabase Dashboard

1. Otwórz Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo
   ```

2. Przejdź do: **Authentication** → **URL Configuration**

3. Sprawdź następujące pola:

   **Site URL:**
   ```
   http://localhost:3000
   ```
   (lub Twój production URL: `https://hub-hub-chi.vercel.app`)

   **Redirect URLs:**
   Dodaj następujące URL:
   ```
   http://localhost:3000/auth/verify-email
   http://localhost:3000/auth/verify-email/**
   https://hub-hub-chi.vercel.app/auth/verify-email
   https://hub-hub-chi.vercel.app/auth/verify-email/**
   ```

### Krok 2: Sprawdź Email Templates

1. W Supabase Dashboard przejdź do: **Authentication** → **Email Templates**

2. Sprawdź template **Confirm signup**

3. Upewnij się, że link zawiera:
   ```
   {{ .ConfirmationURL }}
   ```

4. Link powinien wyglądać tak:
   ```
   {{ .SiteURL }}/auth/verify-email?token={{ .TokenHash }}&type=signup
   ```

### Krok 3: Dla Produkcji (Vercel)

Jeśli używasz Vercel, dodaj również:
```
https://hub-hub-chi.vercel.app/**
https://hub-r54mixja9-radektars-projects.vercel.app/**
```

### Krok 4: Testowanie

Po skonfigurowaniu:

1. Zarejestruj nowego użytkownika
2. Sprawdź email
3. Kliknij link weryfikacyjny
4. Powinieneś zostać przekierowany do `/auth/verify-email` z parametrami

## Ważne Uwagi

- **Site URL** musi być dokładnie taki sam jak URL aplikacji
- **Redirect URLs** muszą zawierać wszystkie możliwe ścieżki
- Dla development: użyj `http://localhost:3000`
- Dla production: użyj pełnego URL z `https://`

## Debugowanie

Jeśli link nadal nie działa:

1. Sprawdź w konsoli przeglądarki, jakie parametry są w URL
2. Sprawdź w Supabase Dashboard → Logs, czy są błędy
3. Upewnij się, że email template używa poprawnego formatu linku

---

**Po skonfigurowaniu redirect URLs, przetestuj rejestrację ponownie!**
