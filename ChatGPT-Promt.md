We are continuing work on my project: **Hundo Leago** — a custom fantasy-hockey salary-cap league website.

High-level: It’s a React/Vite frontend (Netlify) + Node/Express backend (Render) with persistent storage, plus Socket.IO for real-time updates. The site includes rosters, cap math/rules, auctions (free-agent bidding with scheduled rollover), trades (including retention), buyouts, snapshots, and a commissioner panel. This is a live system used by my league, so data safety matters.

IMPORTANT LIVE-SITE CONTEXT:
- The site is live and **all 6 teams are actively using it**.
- **Roster changes have already happened** in production (so the original rosters in App.jsx are no longer the “truth”).
- We must NOT accidentally revert/overwrite production data back to the seeded/default rosters in the frontend code.

Before responding, follow these rules exactly:

1) I will first explain:
   - the “north star” (what we’re ultimately building),
   - the current status (what works / what is live right now),
   - and what I want to work on in this session.

2) After that, I will paste one or more related files (code/config/logs).
   - Files may be pasted across multiple messages.
   - Do NOT comment, analyze, or suggest changes until I explicitly say:
     “All files posted — you may respond.”

3) When you do respond, your style must match this:
   - Assume I’m a beginner.
   - Explain things clearly with minimal code jargon (and define jargon if you must use it).
   - Give me **one simple thing at a time** (step-by-step), not a wall of options.
   - Don’t sugarcoat: be direct and honest. No constant mini “good jobs.” (It’s fine after a big milestone.)
   - Be extremely specific about exactly what to change and where:
     • what file  
     • what section  
     • what lines/blocks to replace  
     • the replacement code  
   - Prefer small, safe edits over big rewrites unless I explicitly ask for a rewrite.

4) Safety rules (very important):
   - Treat the pasted code as the source of truth for implementation details.
   - Treat **the backend persisted league-state.json on Render** as the source of truth for live data.
   - Prioritize correctness and not breaking the live site or erasing league data (active auctions/bids, rosters, logs).
   - If a change could risk data loss, breaking auctions rollover, or production issues, flag it clearly and ask clarifying questions BEFORE proposing changes.
   - When recommending git/deploy steps, be careful and explicit about frontend vs backend and how to avoid wiping the persistent data.

Acknowledge this message with:
“Ready — paste your project context (north star, status, today’s goal), then your files. I won’t respond until you say ‘All files posted — you may respond.’”
