# 🔧 Naprawa Konfiguracji Zmiennych Środowiskowych

## ❌ Problem

Zmienne środowiskowe mają wartości placeholder z szablonu:
- `NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`

## ✅ Rozwiązanie

### Krok 1: Pobierz dane z Supabase Dashboard

1. Otwórz Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo
   ```

2. Przejdź do **Settings** → **API**

3. Skopiuj następujące wartości:
   - **Project URL** (np. `https://dgoldafbrkemdprtezxo.supabase.co`)
   - **anon/public key** (długi klucz zaczynający się od `eyJ...`)

### Krok 2: Zaktualizuj .env.local

Otwórz plik `.env.local` i uzupełnij wartości:

```bash
# Przed:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Po (przykład):
NEXT_PUBLIC_SUPABASE_URL=https://dgoldafbrkemdprtezxo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnb2xkYWZicmtlbWRwcnRlenhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4NjE2MDAsImV4cCI6MjA1MDQzNzYwMH0.xxxxx
```

### Krok 3: Zweryfikuj

Po zapisaniu `.env.local`, przetestuj połączenie:

```bash
node scripts/test-connection-simple.mjs
```

Powinieneś zobaczyć:
```
✅ Connection successful!
```

## 📋 Szybka Weryfikacja w Supabase

Po skonfigurowaniu zmiennych, możesz też zweryfikować strukturę bazy:

1. Otwórz SQL Editor:
   ```
   https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/sql
   ```

2. Skopiuj i uruchom skrypt weryfikacyjny:
   ```bash
   cat scripts/verify-database-setup.sql | pbcopy
   ```

3. Wklej w SQL Editor i uruchom

Powinieneś zobaczyć:
- ✅ 16 tabel utworzonych
- ✅ RLS włączone na wszystkich tabelach
- ✅ Funkcje i triggery skonfigurowane

## 🔗 Przydatne Linki

- [API Settings](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/settings/api)
- [Table Editor](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/editor)
- [SQL Editor](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/sql)

---

**Po uzupełnieniu .env.local, uruchom ponownie test połączenia!**
