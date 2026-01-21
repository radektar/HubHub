# 🔄 Przewodnik Przywracania Backupu Supabase

## 📋 Informacje o Backupie

- **Plik**: `db_cluster-24-09-2025@00-18-08.backup`
- **Rozmiar**: ~226 KB
- **Typ**: PostgreSQL Cluster Dump
- **Wersja PostgreSQL**: 17.6

## ⚠️ Ważne Uwagi

Ten backup to **pełny dump klastra PostgreSQL**, który zawiera:
- Role użytkowników (anon, authenticated, service_role, etc.)
- Schematy systemowe (auth, storage, realtime, etc.)
- Tabele i dane z bazy danych

**Supabase ma już te role i schematy**, więc niektóre komendy z backupu mogą powodować konflikty.

## 🎯 Metoda 1: Przywracanie przez Supabase Dashboard (Rekomendowane)

### Krok 1: Przygotowanie

1. Otwórz [Supabase Dashboard](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo)
2. Przejdź do **SQL Editor**

### Krok 2: Przygotowanie Backupu

Backup zawiera komendy, które mogą kolidować z istniejącymi rolami. Najlepiej jest:

1. **Otwórz backup w edytorze tekstu**
2. **Usuń lub zakomentuj sekcje**:
   ```sql
   -- Usuń te sekcje:
   -- CREATE ROLE ... (role już istnieją)
   -- CREATE DATABASE ... (baza już istnieje)
   -- CREATE SCHEMA auth, storage, realtime ... (schematy systemowe już istnieją)
   ```

3. **Zostaw tylko**:
   - `CREATE TABLE` (jeśli tabele nie istnieją)
   - `ALTER TABLE` (modyfikacje tabel)
   - `INSERT INTO` (dane)
   - `CREATE INDEX` (indeksy)
   - `CREATE FUNCTION` (funkcje)
   - `CREATE TRIGGER` (triggery)
   - RLS policies

### Krok 3: Przywracanie

1. Skopiuj przygotowany SQL do **SQL Editor** w Supabase Dashboard
2. Kliknij **Run** lub `Ctrl+Enter`
3. Sprawdź czy nie ma błędów

### Krok 4: Weryfikacja

Po przywróceniu sprawdź połączenie:
```bash
node scripts/test-db-connection.mjs
```

---

## 🔧 Metoda 2: Przywracanie przez psql (Zaawansowane)

### Krok 1: Pobierz Dane Połączenia

1. W Supabase Dashboard przejdź do **Settings** → **Database**
2. Znajdź **Connection string** (URI format)
3. Skopiuj hasło z sekcji **Database password**

### Krok 2: Przygotuj Connection String

Format connection string:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Dla Twojego projektu:
```
postgresql://postgres:[YOUR-PASSWORD]@db.dgoldafbrkemdprtezxo.supabase.co:5432/postgres
```

### Krok 3: Przywróć Backup

```bash
# Opcja A: Bezpośrednie przywrócenie (UWAGA: może powodować konflikty)
psql "postgresql://postgres:[PASSWORD]@db.dgoldafbrkemdprtezxo.supabase.co:5432/postgres" \
  < /Users/tarhaskha/Downloads/db_cluster-24-09-2025@00-18-08.backup

# Opcja B: Przywrócenie z pominięciem błędów (lepsze)
psql "postgresql://postgres:[PASSWORD]@db.dgoldafbrkemdprtezxo.supabase.co:5432/postgres" \
  -f /Users/tarhaskha/Downloads/db_cluster-24-09-2025@00-18-08.backup \
  --set ON_ERROR_STOP=off
```

### Krok 4: Obsługa Błędów

Jeśli pojawią się błędy typu "role already exists" lub "schema already exists", możesz:

1. **Filtrować backup** przed przywróceniem:
```bash
# Usuń komendy CREATE ROLE
grep -v "CREATE ROLE" db_cluster-24-09-2025@00-18-08.backup > backup_filtered.sql

# Usuń komendy CREATE DATABASE
grep -v "CREATE DATABASE" backup_filtered.sql > backup_filtered2.sql

# Przywróć przefiltrowany backup
psql "postgresql://..." < backup_filtered2.sql
```

---

## 🛠️ Metoda 3: Selektywne Przywracanie (Najbezpieczniejsza)

### Krok 1: Wyodrębnij Tabele

```bash
# Wyodrębnij tylko definicje tabel
grep -A 100 "CREATE TABLE" db_cluster-24-09-2025@00-18-08.backup > tables.sql

# Wyodrębnij tylko dane (INSERT)
grep "INSERT INTO" db_cluster-24-09-2025@00-18-08.backup > data.sql
```

### Krok 2: Przywróć Tabele

1. Otwórz `tables.sql` w Supabase SQL Editor
2. Uruchom komendy CREATE TABLE
3. Sprawdź czy wszystkie tabele zostały utworzone

### Krok 3: Przywróć Dane

1. Otwórz `data.sql` w Supabase SQL Editor
2. Uruchom komendy INSERT
3. Sprawdź czy dane zostały zaimportowane

### Krok 4: Przywróć Indeksy i Funkcje

```bash
# Wyodrębnij indeksy
grep -A 10 "CREATE INDEX" db_cluster-24-09-2025@00-18-08.backup > indexes.sql

# Wyodrębnij funkcje
grep -A 50 "CREATE FUNCTION" db_cluster-24-09-2025@00-18-08.backup > functions.sql
```

---

## ✅ Weryfikacja Po Przywróceniu

### 1. Test Połączenia

```bash
node scripts/test-db-connection.mjs
```

### 2. Sprawdź Tabele

W Supabase Dashboard → **Table Editor** sprawdź czy wszystkie tabele są widoczne:
- `designer_profiles`
- `work_experiences`
- `skills`
- `languages`
- `education`
- etc.

### 3. Sprawdź Dane

```sql
-- W Supabase SQL Editor
SELECT COUNT(*) FROM designer_profiles;
SELECT COUNT(*) FROM work_experiences;
SELECT COUNT(*) FROM skills;
```

### 4. Sprawdź RLS Policies

```sql
-- Sprawdź czy RLS jest włączone
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## 🚨 Rozwiązywanie Problemów

### Problem: "role already exists"

**Rozwiązanie**: Pomiń sekcje CREATE ROLE w backupie. Role są już utworzone przez Supabase.

### Problem: "schema already exists"

**Rozwiązanie**: Pomiń sekcje CREATE SCHEMA dla schematów systemowych (auth, storage, realtime).

### Problem: "permission denied"

**Rozwiązanie**: Użyj connection string z hasłem z Supabase Dashboard → Settings → Database.

### Problem: "table already exists"

**Rozwiązanie**: 
- Opcja A: Usuń istniejące tabele przed przywróceniem
- Opcja B: Użyj `DROP TABLE IF EXISTS` przed `CREATE TABLE`
- Opcja C: Użyj `CREATE TABLE IF NOT EXISTS`

---

## 📝 Rekomendowany Workflow

1. ✅ **Backup aktualnego stanu** (jeśli masz dane)
2. ✅ **Przejrzyj backup** - zrozum jego strukturę
3. ✅ **Przygotuj przefiltrowany backup** - usuń konfliktujące komendy
4. ✅ **Przywróć przez SQL Editor** - małe kawałki na raz
5. ✅ **Zweryfikuj** - sprawdź tabele i dane
6. ✅ **Przetestuj aplikację** - upewnij się że wszystko działa

---

## 🔗 Przydatne Linki

- [Supabase Dashboard](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/sql)
- [Database Settings](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/settings/database)
- [Supabase Restore Documentation](https://supabase.com/docs/guides/platform/backups)

---

**Powodzenia z przywracaniem! 🚀**
