#!/bin/bash
# ============================================================================
# Atrium — Claude Code Skills Uninstaller
# Removes all atrium skills, agents, scripts, and templates from the local
# Claude configuration directory. Does not touch this repo's crew/ source.
# ============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}Uninstalling Atrium for Claude Code...${NC}"
echo ""

SKILLS_DIR="$HOME/.claude/skills"
AGENTS_DIR="$HOME/.claude/agents"

SKILLS=(
    atrium
    atrium-prospect
    atrium-research
    atrium-qualify
    atrium-contacts
    atrium-outreach
    atrium-followup
    atrium-prep
    atrium-proposal
    atrium-objections
    atrium-icp
    atrium-competitors
    atrium-report
    atrium-report-pdf
    atrium-intake
)

echo -e "${BLUE}Removing skills...${NC}"
for skill in "${SKILLS[@]}"; do
    if [ -d "$SKILLS_DIR/$skill" ]; then
        rm -rf "$SKILLS_DIR/$skill"
        echo -e "  ${GREEN}✓${NC} Removed $skill"
    fi
done

AGENTS=(
    atrium-company
    atrium-contacts
    atrium-opportunity
    atrium-competitive
    atrium-strategy
)

echo -e "${BLUE}Removing agents...${NC}"
for agent in "${AGENTS[@]}"; do
    if [ -f "$AGENTS_DIR/$agent.md" ]; then
        rm -f "$AGENTS_DIR/$agent.md"
        echo -e "  ${GREEN}✓${NC} Removed $agent"
    fi
done

echo ""
echo -e "${GREEN}Atrium has been uninstalled.${NC}"
echo -e "Python packages (reportlab, beautifulsoup4, requests) were not removed."
echo -e "To remove them: ${YELLOW}pip3 uninstall reportlab beautifulsoup4 requests${NC}"
echo ""
