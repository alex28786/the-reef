#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting development environment setup...${NC}"

# 1. Check Prerequisites
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: node is not installed.${NC}"
    exit 1
fi

# 2. Environment Configuration Check
echo -e "\n${YELLOW}Checking environment configuration...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file found.${NC}"
else
    echo -e "${YELLOW}⚠️  .env file not found.${NC}"
    echo "Checking for system environment variables..."
    
    # Check for critical variables usually needed
    REQUIRED_VARS=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_TEST_USER_A" "VITE_TEST_USER_B")
    MISSING_VARS=0
    
    for VAR in "${REQUIRED_VARS[@]}"; do
        if [[ -z "${!VAR}" ]]; then
            echo -e "${YELLOW}   - $VAR is not set in current environment.${NC}"
            MISSING_VARS=1
        else
            echo -e "${GREEN}   - $VAR is set.${NC}"
        fi
    done
    
    if [ $MISSING_VARS -eq 1 ]; then
        echo -e "${YELLOW}⚠️  Some environment variables are missing. The application may not function correctly without them.${NC}"
        echo -e "${YELLOW}   If running in CI/CD, ensure these secrets are injected.${NC}"
    else
        echo -e "${GREEN}✅ Critical environment variables detected.${NC}"
    fi
fi

# 3. Install Dependencies
echo -e "\n${YELLOW}Installing project dependencies...${NC}"
npm install

# 4. Install Playwright Browsers & Dependencies
echo -e "\n${YELLOW}Installing Playwright browsers...${NC}"
npx playwright install --with-deps

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "You can now run:"
echo -e "  - ${YELLOW}npm run dev${NC}    (Start development server)"
echo -e "  - ${YELLOW}npm run test${NC}   (Run unit tests)"
echo -e "  - ${YELLOW}npm run test:e2e${NC} (Run E2E tests)"
