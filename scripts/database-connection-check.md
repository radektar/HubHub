# Sprawdzenie Połączenia z Bazą Danych

## Status: ⚠️ Wymagana Konfiguracja

### Obecny Stan
- ❌ **Zmienne środowiskowe nie są skonfigurowane**
- ✅ **Skrypt testowy został utworzony**: `scripts/test-db-connection.mjs`
- ✅ **API endpointy testowe są dostępne**: `/api/test-connection` i `/api/test-database`

## Wymagane Zmienne Środowiskowe

Aby przetestować połączenie z bazą danych Supabase, musisz skonfigurować następujące zmienne:

```bash
NEXT_PUBLIC_SUPABASE_URL=twoj_url_projektu_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_anon_key_supabase
```

### Jak uzyskać dane z Supabase:

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Konfiguracja

### Opcja 1: Utwórz plik `.env.local` (Rekomendowane)

```bash
# W głównym katalogu projektu
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=twoj_url_projektu_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_anon_key_supabase
EOF
```

### Opcja 2: Eksportuj zmienne w terminalu

```bash
export NEXT_PUBLIC_SUPABASE_URL="twoj_url_projektu_supabase"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="twoj_anon_key_supabase"
```

## Testowanie Połączenia

### Metoda 1: Użyj skryptu testowego

```bash
# Upewnij się, że zmienne środowiskowe są ustawione
node scripts/test-db-connection.mjs
```

Skrypt sprawdzi:
- ✅ Podstawowe połączenie z bazą danych
- ✅ Istnienie głównych tabel (designer_profiles, skills, work_experiences, etc.)
- ✅ Polityki RLS (Row Level Security)
- ✅ Strukturę schematu bazy danych

### Metoda 2: Użyj API endpointów

1. Uruchom serwer deweloperski:
```bash
npm run dev
```

2. Przetestuj połączenie:
```bash
# Podstawowy test połączenia
curl http://localhost:3000/api/test-connection

# Kompleksowy test bazy danych
curl -X POST http://localhost:3000/api/test-database
```

### Metoda 3: Test przez przeglądarkę

1. Uruchom serwer: `npm run dev`
2. Otwórz w przeglądarce:
   - `http://localhost:3000/api/test-connection`
   - `http://localhost:3000/api/test-database` (wymaga POST)

## Oczekiwane Wyniki

### ✅ Sukces
```
🔍 Testing Supabase Database Connection...

📋 Environment Variables:
   SUPABASE_URL: ✅ Set
   SUPABASE_ANON_KEY: ✅ Set

🧪 Test 1: Basic Connection Test
   ✅ Connection successful!
   📊 Designer profiles count: 0

🧪 Test 2: Table Existence Check
   ✅ Table 'designer_profiles': Exists
   ✅ Table 'skills': Exists
   ✅ Table 'work_experiences': Exists
   ...

📊 Test Summary:
   Connection: ✅ Success
   Tables: 6/6 accessible
   Errors: 0

✅ Database connection test PASSED!
```

### ❌ Błędy Typowe

1. **Missing environment variables**
   - Rozwiązanie: Utwórz plik `.env.local` z wymaganymi zmiennymi

2. **Connection refused / Network error**
   - Rozwiązanie: Sprawdź czy URL Supabase jest poprawny
   - Sprawdź połączenie internetowe

3. **RLS policy violation**
   - To jest normalne - oznacza, że polityki bezpieczeństwa działają
   - Do pełnego testu może być potrzebny zalogowany użytkownik

4. **Table does not exist**
   - Rozwiązanie: Uruchom migracje bazy danych z katalogu `supabase/migrations/`

## Następne Kroki

Po pomyślnym teście połączenia:

1. ✅ Sprawdź czy wszystkie tabele istnieją
2. ✅ Zweryfikuj migracje w `supabase/migrations/`
3. ✅ Przetestuj autentykację użytkowników
4. ✅ Sprawdź RLS policies dla różnych ról

## Pliki Powiązane

- `scripts/test-db-connection.mjs` - Skrypt testowy
- `src/app/api/test-connection/route.ts` - API endpoint testowy
- `src/app/api/test-database/route.ts` - Kompleksowy test API
- `src/lib/supabase/client.ts` - Klient przeglądarki
- `src/lib/supabase/server.ts` - Klient serwera
