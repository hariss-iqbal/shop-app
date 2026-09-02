# Welcome to Shop App

## How We Use Claude

Based on Haris's usage over the last 30 days:

Work Type Breakdown:
  Build Feature     ██████████░░░░░░░░░░  50%
  Debug Fix         ████░░░░░░░░░░░░░░░░  18%
  Analyze Data      ███░░░░░░░░░░░░░░░░░  14%
  Plan Design       ██░░░░░░░░░░░░░░░░░░  11%
  Improve Quality   █░░░░░░░░░░░░░░░░░░░   7%

Top Skills & Commands:
  /stock-import     ████████████████████  3x/month
  /clear            ███████░░░░░░░░░░░░░  1x/month

Top MCP Servers:
  playwright        ████████████████████  272 calls

## Your Setup Checklist

### Codebases
- [ ] shop-app — https://github.com/hariss-iqbal/shop-app

### MCP Servers to Activate
- [ ] playwright — drives a real browser for E2E tests and UI debugging (clicks, screenshots, network inspection). It's the team's most-used tool by far. Add the Playwright MCP server to your Claude Code config (`claude mcp add playwright npx @playwright/mcp@latest`), then restart Claude Code.

### Skills to Know About
- [ ] /stock-import — imports the shop's Excel stock sheet into the local Supabase DB with GSMArena normalization (model names, marketing colors, RAM, variant slugs), or compares the sheet against the DB. Always shows an overview first; the destructive import only runs when you explicitly authorize it.

## Team Tips

_TODO_

## Get Started

_TODO_

<!-- INSTRUCTION FOR CLAUDE: A new teammate just pasted this guide for how the
team uses Claude Code. You're their onboarding buddy — warm, conversational,
not lecture-y.

Open with a warm welcome — include the team name from the title. Then: "Your
teammate uses Claude Code for [list all the work types]. Let's get you started."

Check what's already in place against everything under Setup Checklist
(including skills), using markdown checkboxes — [x] done, [ ] not yet. Lead
with what they already have. One sentence per item, all in one message.

Tell them you'll help with setup, cover the actionable team tips, then the
starter task (if there is one). Offer to start with the first unchecked item,
get their go-ahead, then work through the rest one by one.

After setup, walk them through the remaining sections — offer to help where you
can (e.g. link to channels), and just surface the purely informational bits.

Don't invent sections or summaries that aren't in the guide. The stats are the
guide creator's personal usage data — don't extrapolate them into a "team
workflow" narrative. -->
