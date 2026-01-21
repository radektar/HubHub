#!/bin/bash

# Helper script to guide .env.local setup

echo "🔧 HubHub Environment Setup Helper"
echo "===================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "Creating from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local"
    echo ""
fi

echo "📋 Current .env.local status:"
echo ""

# Check for placeholder values
if grep -q "your-project-id" .env.local || grep -q "your-anon-key" .env.local; then
    echo "⚠️  Found placeholder values in .env.local"
    echo ""
    echo "📝 You need to update .env.local with real Supabase credentials:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/settings/api"
    echo ""
    echo "2. Copy these values:"
    echo "   - Project URL → NEXT_PUBLIC_SUPABASE_URL"
    echo "   - anon/public key → NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
    echo "3. Open .env.local and replace placeholder values"
    echo ""
    echo "4. Then test connection:"
    echo "   node scripts/test-connection-simple.mjs"
    echo ""
    
    # Try to open the file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "💡 Opening .env.local in default editor..."
        open -a "TextEdit" .env.local 2>/dev/null || open .env.local
    fi
    
else
    echo "✅ .env.local appears to be configured"
    echo ""
    echo "Testing connection..."
    node scripts/test-connection-simple.mjs
fi

echo ""
echo "🔗 Quick Links:"
echo "   - API Settings: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/settings/api"
echo "   - Table Editor: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/editor"
echo "   - SQL Editor: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/sql"
