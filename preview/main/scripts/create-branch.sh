#!/bin/bash

set -e

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${BLUE}Branch Creation${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 <issue-id> [description]"
    echo ""
    echo "Arguments:"
    echo "  issue-id    : Issue ID (e.g., 0012, 123)"
    echo "  description : Description (optional, auto-converted to kebab-case)"
    echo ""
    echo "Examples:"
    echo "  $0 0012"
    echo "  $0 0012 \"AI agents implementation\""
    echo "  $0 123 \"Add user authentication\""
    exit 0
}

if [ $# -lt 1 ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    show_help
fi

ISSUE_ID="$1"
DESCRIPTION="${2:-}"

# Default branch type
BRANCH_TYPE="create"

# Validate issue ID format (numbers only)
if ! [[ "$ISSUE_ID" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}Error: Issue ID must contain only numbers (e.g., 0012, 123)${NC}"
    exit 1
fi

# Format issue ID with leading zeros (4 digits)
FORMATTED_ID=$(printf "%04d" "$ISSUE_ID")

# Build branch name
if [ -n "$DESCRIPTION" ]; then
    CLEAN_DESC=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-|-$//g')
    BRANCH_NAME="${BRANCH_TYPE}/#${FORMATTED_ID}/${CLEAN_DESC}"
else
    BRANCH_NAME="${BRANCH_TYPE}/#${FORMATTED_ID}"
fi

# Display branch information
echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  Branch Creation${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""
echo -e "${YELLOW}Branch Type:${NC} $BRANCH_TYPE"
echo -e "${YELLOW}Issue ID:${NC} #$FORMATTED_ID"
if [ -n "$DESCRIPTION" ]; then
    echo -e "${YELLOW}Description:${NC} $DESCRIPTION"
fi
echo -e "${YELLOW}Generated Branch Name:${NC} ${GREEN}$BRANCH_NAME${NC}"
echo ""

# Confirmation prompt
read -p "Create this branch? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo -e "${RED}Error: Branch '$BRANCH_NAME' already exists${NC}"
    exit 1
fi

# Create and switch to the new branch
git checkout -b "$BRANCH_NAME"

# Success message
echo ""
echo -e "${GREEN}✓ Branch '$BRANCH_NAME' created successfully${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Make your changes"
echo "  2. Generate commit message: ./scripts/generate-commit.sh"
echo "  3. Push to remote: git push -u origin $BRANCH_NAME"
