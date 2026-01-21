# 🔄 Krok po Kroku: Przywracanie Backupu Supabase

## ✅ Status Przygotowania

- ✅ Backup przygotowany: `db_cluster-24-09-2025@00-18-08_prepared.sql`
- ✅ Rozmiar: ~224 KB
- ✅ Usunięto konfliktujące komendy systemowe
- ✅ Zawiera: 10 tabel, funkcje, indeksy, 3 INSERT statements

## 📋 Tabele w Backupie

1. `certifications`
2. `client_projects`
3. `cv_projects`
4. `designer_profiles`
5. `education`
6. `languages`
7. `offers`
8. `skills`
9. `users`
10. `work_experiences`

## 🚀 KROK 1: Konfiguracja Zmiennych Środowiskowych

### 1.1 Pobierz dane z Supabase Dashboard

1. Otwórz: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo
2. Przejdź do: **Settings** → **API**
3. Skopiuj:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (opcjonalne)

### 1.2 Utwórz plik .env.local

```bash
cd /Users/tarhaskha/CODEing/HubHub
cp .env.example .env.local
```

### 1.3 Uzupełnij .env.local

Otwórz `.env.local` i uzupełnij wartości:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://dgoldafbrkemdprtezxo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_anon_key_tutaj
SUPABASE_SERVICE_ROLE_KEY=twoj_service_role_key_tutaj
```

---

## 🔧 KROK 2: Przywrócenie Backupu

### Metoda A: Przez Supabase Dashboard (REKOMENDOWANA)

#### 2.1 Otwórz SQL Editor

1. Przejdź do: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/sql
2. Kliknij **"New query"**

#### 2.2 Skopiuj zawartość przygotowanego backupu

```bash
# W terminalu (macOS):
cat /Users/tarhaskha/Downloads/db_cluster-24-09-2025@00-18-08_prepared.sql | pbcopy

# Lub otwórz plik i skopiuj ręcznie:
open /Users/tarhaskha/Downloads/db_cluster-24-09-2025@00-18-08_prepared.sql
```

#### 2.3 Wklej i uruchom

1. Wklej SQL do SQL Editor
2. Kliknij **"Run"** lub naciśnij `Ctrl+Enter` / `Cmd+Enter`
3. Sprawdź czy nie ma błędów

#### 2.4 Obsługa błędów

Jeśli pojawią się błędy typu:
- `relation "table_name" already exists` → Tabele już istnieją, to OK
- `role "role_name" already exists` → Role już istnieją, to OK
- `schema "schema_name" already exists` → Schematy już istnieją, to OK

**Możesz je zignorować** - oznacza to, że struktura już istnieje.

---

### Metoda B: Przez psql (Zaawansowane)

#### 2.1 Pobierz hasło bazy danych

1. Przejdź do: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/settings/database
2. Znajdź sekcję **Database password**
3. Skopiuj hasło (lub zresetuj jeśli nie pamiętasz)

#### 2.2 Przywróć backup

```bash
# Zastąp [PASSWORD] rzeczywistym hasłem
psql "postgresql://postgres:[PASSWORD]@db.dgoldafbrkemdprtezxo.supabase.co:5432/postgres" \
  -f /Users/tarhaskha/Downloads/db_cluster-24-09-2025@00-18-08_prepared.sql
```

#### 2.3 Alternatywnie: Przywróć z pominięciem błędów

```bash
psql "postgresql://postgres:[PASSWORD]@db.dgoldafbrkemdprtezxo.supabase.co:5432/postgres" \
  -f /Users/tarhaskha/Downloads/db_cluster-24-09-2025@00-18-08_prepared.sql \
  --set ON_ERROR_STOP=off 2>&1 | grep -v "already exists"
```

---

## ✅ KROK 3: Weryfikacja Przywrócenia

### 3.1 Test połączenia

```bash
cd /Users/tarhaskha/CODEing/HubHub
node scripts/test-db-connection.mjs
```

Oczekiwany wynik:
```
✅ Connection successful!
✅ Table 'designer_profiles': Exists
✅ Table 'skills': Exists
...
```

### 3.2 Sprawdź tabele w Supabase Dashboard

1. Przejdź do: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/editor
2. Sprawdź czy wszystkie 10 tabel są widoczne
3. Kliknij na każdą tabelę i sprawdź czy ma dane

### 3.3 Sprawdź dane przez SQL

W Supabase SQL Editor uruchom:

```sql
-- Sprawdź liczbę rekordów w każdej tabeli
SELECT 'designer_profiles' as table_name, COUNT(*) as count FROM designer_profiles
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'skills', COUNT(*) FROM skills
UNION ALL
SELECT 'work_experiences', COUNT(*) FROM work_experiences
UNION ALL
SELECT 'languages', COUNT(*) FROM languages
UNION ALL
SELECT 'education', COUNT(*) FROM education;
```

### 3.4 Sprawdź RLS Policies

```sql
-- Sprawdź czy RLS jest włączone
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 🚨 Rozwiązywanie Problemów

### Problem: "permission denied"

**Rozwiązanie**: 
- Upewnij się, że używasz poprawnego connection string
- Sprawdź czy hasło jest poprawne
- Użyj service_role key jeśli dostępny

### Problem: "connection refused"

**Rozwiązanie**:
- Sprawdź czy projekt Supabase nie jest wstrzymany
- Upewnij się, że projekt jest aktywny w Dashboard

### Problem: "table already exists"

**Rozwiązanie**:
- To jest normalne jeśli tabele już istnieją
- Możesz zignorować te błędy lub użyć `DROP TABLE IF EXISTS` przed `CREATE TABLE`

### Problem: "role already exists"

**Rozwiązanie**:
- Role systemowe już istnieją w Supabase
- Możesz bezpiecznie zignorować te błędy

---

## 📝 Checklist Przywrócenia

- [ ] Skonfigurowano `.env.local` z danymi Supabase
- [ ] Przygotowano backup (usunięto konflikty)
- [ ] Przywrócono backup przez SQL Editor lub psql
- [ ] Zweryfikowano połączenie (`test-db-connection.mjs`)
- [ ] Sprawdzono tabele w Dashboard
- [ ] Sprawdzono dane w tabelach
- [ ] Sprawdzono RLS policies
- [ ] Przetestowano aplikację

---

## 🎯 Następne Kroki Po Przywróceniu

1. **Przetestuj aplikację**:
   ```bash
   npm run dev
   ```

2. **Sprawdź autentykację**:
   - Przejdź do `/auth/register`
   - Zarejestruj testowego użytkownika
   - Sprawdź czy profil został utworzony

3. **Sprawdź parsowanie CV**:
   - Przejdź do `/designer/cv-upload`
   - Prześlij testowe CV
   - Sprawdź czy dane zostały zapisane

---

## 🔗 Przydatne Linki

- [Supabase Dashboard](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo)
- [SQL Editor](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/sql)
- [Table Editor](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/editor)
- [Database Settings](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/settings/database)
- [API Settings](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/settings/api)

---

**Powodzenia! 🚀**
