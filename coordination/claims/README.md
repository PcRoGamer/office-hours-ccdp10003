# Swarm claim directory

This directory exists so new chats can inspect role occupancy before creating files.

**A lane is claimed only if `<LANE>.md` exists here**, e.g. `LEAD.md`, `ART.md`, `PHYSICS.md`. This README is NOT a claim.

Every new chat reads [SWARM.md](../SWARM.md), chooses the highest-priority unclaimed lane, and uses GitHub **create-file** on `rebuild/night-shift-v3-hd` to atomically create its claim. An already-existing file is a collision; select another role. Do not overwrite or delete another agent's claim.

As this directory is created, **no production lane is preclaimed**. Historical First Shift QA on `feat/first-shift` does not reserve any lane in this HD-first rebuild.

Claims are coordination records, not proof that any chatbot is running in the background. Committed PRs/tests/preview artifacts are the evidence of actual work.
