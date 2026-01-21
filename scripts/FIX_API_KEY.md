# 🔑 Jak Znaleźć Prawidłowy Anon Key

## ❌ Problem

Twój klucz ma tylko 20 znaków i wygląda jak project reference:
```
cujxpoayiysehagkuvlx
```

## ✅ Rozwiązanie

### Krok 1: Otwórz Supabase Dashboard

Przejdź do:
```
https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/settings/api
```

### Krok 2: Znajdź Sekcję "Project API keys"

Na stronie Settings → API zobaczysz kilka sekcji:

1. **Project URL** - to już masz poprawnie:
   ```
   https://cujxpoayiysehagkuvlx.supabase.co
   ```

2. **Project API keys** - tutaj znajdziesz klucze:
   - **anon/public** - to jest ten, którego potrzebujesz!
   - **service_role** - tego nie używaj w aplikacji (tylko dla skryptów)

### Krok 3: Skopiuj Klucz "anon/public"

Klucz powinien wyglądać tak:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1anhwb2F5aXlzZWhhZ2t1dmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4NjE2MDAsImV4cCI6MjA1MDQzNzYwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Charakterystyka prawidłowego klucza:**
- ✅ Zaczyna się od `eyJ`
- ✅ Ma około 200+ znaków
- ✅ Zawiera kropki (.) - to jest JWT token
- ✅ Jest w sekcji "anon/public" (NIE "service_role")

### Krok 4: Zaktualizuj .env.local

Otwórz `.env.local` i upewnij się, że masz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://cujxpoayiysehagkuvlx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1anhwb2F5aXlzZWhhZ2t1dmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4NjE2MDAsImV4cCI6MjA1MDQzNzYwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**WAŻNE:** 
- Nie używaj cudzysłowów wokół wartości
- Skopiuj cały klucz (może być długi)
- Upewnij się, że nie ma spacji na początku/końcu

### Krok 5: Zweryfikuj

Po zapisaniu `.env.local`:

```bash
node scripts/verify-env-config.mjs
```

Powinieneś zobaczyć:
```
✅ Key format looks correct (JWT)
✅ Length: ~200+ characters
```

Następnie przetestuj połączenie:
```bash
node scripts/test-connection-simple.mjs
```

## 🔍 Wizualna Pomoc

W Supabase Dashboard → Settings → API zobaczysz:

```
┌─────────────────────────────────────────┐
│ Project URL                             │
│ https://cujxpoayiysehagkuvlx.supabase.co│  ← To masz OK
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Project API keys                        │
│                                         │
│ anon/public                            │
│ ┌─────────────────────────────────────┐ │
│ │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9│ │  ← TO SKOPIUJ!
│ │ .eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...│ │
│ └─────────────────────────────────────┘ │
│ [👁️ Reveal] [📋 Copy]                   │
│                                         │
│ service_role                            │
│ ┌─────────────────────────────────────┐ │
│ │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9│ │  ← NIE tego!
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Kliknij **"Reveal"** lub **"Copy"** przy kluczu **anon/public**.

---

**Po skopiowaniu prawidłowego klucza, uruchom ponownie test!**
