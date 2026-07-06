#!/bin/bash
# ============================================================================
# Atrium — Claude Code Skills Installer
# 1 orchestrator + 14 sub-skills + 5 agents + 4 scripts + 6 templates
#
# Adapted from ai-sales-team-claude's install.sh. Unlike the reference, this
# never clones from GitHub — the source is always this repo's crew/
# directory, since it's already checked out locally.
# ============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}║${NC}   ${CYAN}Atrium — Claude Code Skills${NC}                               ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   ${GREEN}1 Orchestrator · 14 Skills · 5 Agents · 4 Scripts · 6 Templates${NC} ${BLUE}║${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR"

if [ ! -d "$SOURCE_DIR/skills" ] || [ ! -f "$SOURCE_DIR/atrium/SKILL.md" ]; then
    echo -e "${RED}Error: run this from the crew/ directory of the atrium repo.${NC}"
    echo "Expected crew/atrium/SKILL.md and crew/skills/ alongside this script."
    exit 1
fi

echo -e "${GREEN}Installing from:${NC} $SOURCE_DIR"

# ---------------------------------------------------------------------------
# Check for Claude Code
# ---------------------------------------------------------------------------
echo -e "${BLUE}Checking prerequisites...${NC}"
if command -v claude &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Claude Code found"
else
    echo -e "  ${YELLOW}⚠${NC} Claude Code CLI not found (skills will still be installed)"
fi

# ---------------------------------------------------------------------------
# Target directories
# ---------------------------------------------------------------------------
SKILLS_DIR="$HOME/.claude/skills"
AGENTS_DIR="$HOME/.claude/agents"

echo -e "${BLUE}Creating directories...${NC}"
mkdir -p "$SKILLS_DIR/atrium/scripts"
mkdir -p "$SKILLS_DIR/atrium/templates"
echo -e "  ${GREEN}✓${NC} Skills directory ready"

mkdir -p "$AGENTS_DIR"
echo -e "  ${GREEN}✓${NC} Agents directory ready"

# ---------------------------------------------------------------------------
# Install main skill orchestrator
# ---------------------------------------------------------------------------
echo -e "${BLUE}Installing skills...${NC}"

INSTALL_COUNT=0

if [ -f "$SOURCE_DIR/atrium/SKILL.md" ]; then
    cp "$SOURCE_DIR/atrium/SKILL.md" "$SKILLS_DIR/atrium/SKILL.md"
    echo -e "  ${GREEN}✓${NC} atrium (orchestrator)"
    INSTALL_COUNT=$((INSTALL_COUNT + 1))
fi

# ---------------------------------------------------------------------------
# Install 14 sub-skills (13 adapted from the reference + atrium-intake)
# ---------------------------------------------------------------------------
SKILLS=(
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

for skill in "${SKILLS[@]}"; do
    if [ -f "$SOURCE_DIR/skills/$skill/SKILL.md" ]; then
        mkdir -p "$SKILLS_DIR/$skill"
        cp "$SOURCE_DIR/skills/$skill/SKILL.md" "$SKILLS_DIR/$skill/SKILL.md"
        echo -e "  ${GREEN}✓${NC} $skill"
        INSTALL_COUNT=$((INSTALL_COUNT + 1))
    else
        echo -e "  ${YELLOW}⚠${NC} $skill (not found in source)"
    fi
done

# ---------------------------------------------------------------------------
# Install 5 agents
# ---------------------------------------------------------------------------
echo -e "${BLUE}Installing agents...${NC}"

AGENT_COUNT=0
AGENTS=(
    atrium-company
    atrium-contacts
    atrium-opportunity
    atrium-competitive
    atrium-strategy
)

for agent in "${AGENTS[@]}"; do
    if [ -f "$SOURCE_DIR/agents/$agent.md" ]; then
        cp "$SOURCE_DIR/agents/$agent.md" "$AGENTS_DIR/$agent.md"
        echo -e "  ${GREEN}✓${NC} $agent"
        AGENT_COUNT=$((AGENT_COUNT + 1))
    else
        echo -e "  ${YELLOW}⚠${NC} $agent (not found in source)"
    fi
done

# ---------------------------------------------------------------------------
# Install Python scripts
# ---------------------------------------------------------------------------
echo -e "${BLUE}Installing scripts...${NC}"

SCRIPT_COUNT=0
for script in "$SOURCE_DIR"/scripts/*.py; do
    if [ -f "$script" ]; then
        cp "$script" "$SKILLS_DIR/atrium/scripts/"
        echo -e "  ${GREEN}✓${NC} $(basename "$script")"
        SCRIPT_COUNT=$((SCRIPT_COUNT + 1))
    fi
done

# ---------------------------------------------------------------------------
# Install templates
# ---------------------------------------------------------------------------
echo -e "${BLUE}Installing templates...${NC}"

TEMPLATE_COUNT=0
for template in "$SOURCE_DIR"/templates/*.md; do
    if [ -f "$template" ]; then
        cp "$template" "$SKILLS_DIR/atrium/templates/"
        echo -e "  ${GREEN}✓${NC} $(basename "$template")"
        TEMPLATE_COUNT=$((TEMPLATE_COUNT + 1))
    fi
done

# ---------------------------------------------------------------------------
# Install config
# ---------------------------------------------------------------------------
echo -e "${BLUE}Installing config...${NC}"
mkdir -p "$SKILLS_DIR/atrium/config"
CONFIG_COUNT=0
for config in "$SOURCE_DIR"/config/*.json; do
    if [ -f "$config" ]; then
        cp "$config" "$SKILLS_DIR/atrium/config/"
        echo -e "  ${GREEN}✓${NC} $(basename "$config")"
        CONFIG_COUNT=$((CONFIG_COUNT + 1))
    fi
done

# ---------------------------------------------------------------------------
# Check Python dependencies
# ---------------------------------------------------------------------------
echo -e "${BLUE}Checking Python environment...${NC}"

if command -v python3 &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Python 3 found: $(python3 --version 2>&1)"
else
    echo -e "  ${RED}✗${NC} Python 3 not found — required for scripts"
fi

if python3 -c "import reportlab" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} reportlab installed"
else
    echo -e "  ${YELLOW}⚠${NC} reportlab not installed (needed for PDF reports)"
    echo -e "      Install with: ${CYAN}pip3 install -r $SOURCE_DIR/requirements.txt${NC}"
fi

if python3 -c "import bs4" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} beautifulsoup4 installed"
else
    echo -e "  ${YELLOW}⚠${NC} beautifulsoup4 not installed (optional, enhances parsing)"
    echo -e "      Install with: ${CYAN}pip3 install -r $SOURCE_DIR/requirements.txt${NC}"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Installation Complete!                                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Skills:${NC}    $INSTALL_COUNT installed  →  $SKILLS_DIR"
echo -e "  ${CYAN}Agents:${NC}    $AGENT_COUNT installed  →  $AGENTS_DIR"
echo -e "  ${CYAN}Scripts:${NC}   $SCRIPT_COUNT installed  →  $SKILLS_DIR/atrium/scripts"
echo -e "  ${CYAN}Templates:${NC} $TEMPLATE_COUNT installed  →  $SKILLS_DIR/atrium/templates"
echo -e "  ${CYAN}Config:${NC}    $CONFIG_COUNT installed  →  $SKILLS_DIR/atrium/config"
echo ""

echo -e "${BLUE}Command Reference:${NC}"
echo ""
echo -e "  ${CYAN}/atrium prospect <url>${NC}          Full prospect analysis (5 agents)"
echo -e "  ${CYAN}/atrium quick <url>${NC}             60-second prospect snapshot"
echo -e "  ${CYAN}/atrium research <url>${NC}          Deep company research"
echo -e "  ${CYAN}/atrium qualify <url>${NC}           BANT + MEDDIC lead scoring"
echo -e "  ${CYAN}/atrium contacts <url>${NC}          Find decision makers"
echo -e "  ${CYAN}/atrium outreach <prospect>${NC}     Generate outreach sequences"
echo -e "  ${CYAN}/atrium followup <prospect>${NC}     Create follow-up sequences"
echo -e "  ${CYAN}/atrium prep <url>${NC}              Meeting preparation brief"
echo -e "  ${CYAN}/atrium proposal <client>${NC}       Client proposal generation"
echo -e "  ${CYAN}/atrium objections <topic>${NC}      Objection handling playbook"
echo -e "  ${CYAN}/atrium icp <description>${NC}       Ideal Customer Profile builder"
echo -e "  ${CYAN}/atrium competitors <url>${NC}       Competitive intelligence"
echo -e "  ${CYAN}/atrium report${NC}                  Sales pipeline report (Markdown)"
echo -e "  ${CYAN}/atrium report-pdf${NC}              Sales pipeline report (PDF)"
echo -e "  ${CYAN}/atrium intake${NC}                  Pull inbound leads from Supabase"
echo ""
echo -e "  ${YELLOW}Tip:${NC} Start with ${CYAN}/atrium prospect <url>${NC} for a full analysis!"
echo ""
