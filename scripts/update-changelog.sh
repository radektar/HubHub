#!/bin/bash

# HubHub Changelog Update Helper Script
# Makes it easy to add entries to CHANGELOG.md

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}HubHub Changelog Update Helper${NC}"
echo "=================================="
echo ""

# Get current date
CURRENT_DATE=$(date '+%Y-%m-%d')
echo -e "Current date: ${GREEN}$CURRENT_DATE${NC}"
echo ""

# Show current [Unreleased] section
echo -e "${YELLOW}Current [Unreleased] section:${NC}"
echo "-----------------------------"
sed -n '/## \[Unreleased\]/,/## \[/p' CHANGELOG.md | head -n -1
echo ""

# Ask for entry type
echo "What type of change are you adding?"
echo "1) Added (new features)"
echo "2) Changed (changes to existing functionality)"
echo "3) Fixed (bug fixes)"
echo "4) Removed (removed features)"
echo "5) Security (security-related changes)"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1) CATEGORY="Added" ;;
    2) CATEGORY="Changed" ;;
    3) CATEGORY="Fixed" ;;
    4) CATEGORY="Removed" ;;
    5) CATEGORY="Security" ;;
    *) echo "Invalid choice. Exiting."; exit 1 ;;
esac

echo ""
read -p "Enter your changelog entry: " ENTRY

if [ -z "$ENTRY" ]; then
    echo "Entry cannot be empty. Exiting."
    exit 1
fi

# Create backup
cp CHANGELOG.md CHANGELOG.md.backup

# Add entry to changelog
# This is a simplified approach - in practice, you might want more sophisticated parsing
echo -e "${YELLOW}Adding entry to CHANGELOG.md...${NC}"
echo "Category: $CATEGORY"
echo "Entry: $ENTRY"
echo ""

# For now, just show what would be added
echo -e "${GREEN}Entry to add:${NC}"
echo "### $CATEGORY"
echo "- $ENTRY"
echo ""
echo -e "${YELLOW}Please manually add this to your CHANGELOG.md [Unreleased] section${NC}"
echo "Then run: git add CHANGELOG.md"

# Open changelog in default editor if available
if command -v code &> /dev/null; then
    echo ""
    read -p "Open CHANGELOG.md in VS Code? (y/n): " open_editor
    if [ "$open_editor" = "y" ] || [ "$open_editor" = "Y" ]; then
        code CHANGELOG.md
    fi
fi
