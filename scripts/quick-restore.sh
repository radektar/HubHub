#!/bin/bash

# Quick Restore Script for Supabase
# This script helps you restore the prepared backup

echo "🔄 Supabase Quick Restore"
echo "========================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "Please create it from .env.example first"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Check if SUPABASE_URL is set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
    exit 1
fi

# Extract project reference
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -n 's|https://\([^.]*\)\.supabase\.co|\1|p')

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Could not extract project reference from URL"
    exit 1
fi

PREPARED_SQL="/Users/tarhaskha/Downloads/db_cluster-24-09-2025@00-18-08_prepared.sql"

if [ ! -f "$PREPARED_SQL" ]; then
    echo "❌ Prepared SQL file not found: $PREPARED_SQL"
    echo "Run: node scripts/prepare-backup-for-restore.mjs <backup-file>"
    exit 1
fi

echo "✅ Configuration:"
echo "   Project: $PROJECT_REF"
echo "   SQL File: $PREPARED_SQL"
echo ""

echo "📋 Restore Options:"
echo ""
echo "1. Open Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql"
echo ""
echo "2. Copy SQL file to clipboard (macOS):"
echo "   cat $PREPARED_SQL | pbcopy"
echo ""
echo "3. Paste in SQL Editor and click Run"
echo ""

# Try to copy to clipboard on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "💡 Copying SQL to clipboard..."
    cat "$PREPARED_SQL" | pbcopy
    echo "✅ SQL copied to clipboard!"
    echo ""
    echo "Now:"
    echo "1. Open SQL Editor (link above)"
    echo "2. Paste (Cmd+V)"
    echo "3. Click Run"
    echo ""
fi

