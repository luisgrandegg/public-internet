# Public Internet — Constitution

> This document governs every product, design, and technical decision in this monorepo.
> Agents: read this before acting. If a request conflicts with these principles, flag it before proceeding.

---

## Mission

The internet made it possible to connect people who need something with people who can provide it — at almost zero cost, at any scale. A generation of platforms was built on that promise. Most of them have since become extraction machines: taking ever-larger cuts from the transactions they facilitate, manipulating behaviour through dark patterns and algorithmic pressure, and externalising costs onto workers, cities, and communities.

**Public Internet builds functional replacements for those platforms.** We take the original spirit — the genuine social good — and strip out the extraction. The software is free, governed by public entities, and designed to run at the smallest meaningful scale while federating with the larger world when it helps.

---

## The Problem

Platform capitalism follows a predictable arc:

1. A platform solves a real problem and creates real value for users
2. It scales through network effects — value compounds as more people join
3. Once dominant, it monetises the network: commissions rise, algorithms optimise for engagement over wellbeing, workers are reclassified to avoid labour protections, cities absorb the externalities
4. Leaving becomes hard — data is locked in, alternatives don't exist, or the network effect makes switching costly

The harm is not incidental. It is the business model.

Public entities — municipalities, cooperatives, civic associations — have historically provided infrastructure that markets cannot or will not. Public transit, public libraries, public utilities. These platforms should be the same: public infrastructure for the digital commons.

---

## Core Principles

Every platform built in this repository must follow all of these principles. No exceptions without a new ADR.

### 1. No extraction
Revenue may only cover verified operating costs (infrastructure, moderation, maintenance). No commission model. No advertising. No selling of user data. If a financial contribution is requested from users, it is optional and clearly labelled.

### 2. Free software
All code is open source. Any entity — a village, a city, a cooperative — can adopt, fork, deploy, and modify the software without paying a licence fee or asking permission. Governance of the upstream codebase is open.

### 3. Public entity governance
The software must be operable by a municipality, a cooperative, or a public institution without requiring a private company to run it. It must not depend on proprietary services that a public entity cannot control or replace.

### 4. Federation-first architecture
Every platform must support running as an independent local node — a village, a neighbourhood, a cooperative — with no external dependencies. Nodes may choose to federate with larger entities (city, region, national network), sharing capacity and discoverability while retaining local governance and data sovereignty. Federation is always opt-in. A node can leave a federation and retain all its data.

```
village node  ──►  city node  ──►  regional network
     │                │
  stays local    federates up
  if it wants    only if it wants
```

### 5. No dark patterns
No deceptive defaults. No manufactured urgency ("only 2 left!"). No hidden fees revealed at checkout. No friction designed to prevent users from leaving. Interfaces must be honest about what they do.

### 6. Accessibility-first
WCAG AA is the minimum bar — not a stretch goal. Every UI component and every page must be usable by people with visual, motor, cognitive, and auditory differences.

### 7. Worker rights
Any platform involving labour (couriers, hosts, care workers) must treat workers as rights-holders. This means: transparent and predictable pay, no arbitrary deactivation without appeal, access to data about their own work, and — where feasible — cooperative or employment models over contractor misclassification.

---

## Platform Registry

Research is ongoing. Platforms are added here before work begins.

---

### Stay — Accommodation

| | |
|---|---|
| **Status** | Planned |
| **App** | `apps/stay` (not yet created) |

**Original spirit:** Connect travellers with locals who have space to share. Authentic, community-driven, trust-based.

**Current harm:** AirBnB takes ~15% from guests and ~3% from hosts. The concentration of short-term rentals removes housing supply from long-term rental markets, contributing to housing cost pressure in cities. Full-time commercial operators — not genuine hosts — now dominate many markets.

**Our version:**
- Zero commission — the platform charges nothing beyond infrastructure costs
- Revenue model: optional donation from users; partnerships with municipalities who fund the service as public infrastructure
- Design actively discourages full-time commercial listings (e.g., annual night caps visible to all, municipal integration for permit verification)
- Local nodes: a city can run its own Stay instance with local rules and local governance

---

### Eats — Food Delivery

| | |
|---|---|
| **Status** | Planned |
| **App** | `apps/eats` (not yet created) |

**Original spirit:** Help restaurants reach more customers. Give people with vehicles a way to earn flexibly.

**Current harm:** DoorDash and UberEats charge restaurants 15–30% per order, often eliminating or inverting margins for small restaurants. Couriers are misclassified as contractors: no benefits, no insurance, no minimum wage guarantee, no appeal when deactivated. Surge pricing treats food as a luxury market.

**Our version:**
- Flat per-order infrastructure fee only — transparent and published, covering actual costs
- Couriers are workers with rights: cooperative model preferred, or proper employment classification where law permits; transparent pay calculation; an appeal process for deactivation
- No surge pricing
- Restaurant onboarding is free; the platform does not negotiate exclusivity
- Local nodes: a city's hospitality association or a neighbourhood cooperative can run their own Eats instance

---

### Agenda — Civic Platform

| | |
|---|---|
| **Status** | Planned |
| **App** | `apps/agenda` (not yet created) |

**Original spirit:** Make local government transparent and participatory. Every citizen should be able to know what their city is deciding and have a meaningful way to engage.

**Current harm:** City council agendas are typically published as dense PDFs on difficult-to-find municipal websites. Meetings are held in person at times that exclude working people. Organised lobbying interests fill the participation vacuum. Digital civic participation tools are either non-existent or proprietary SaaS sold to municipalities, locking civic data in vendor systems.

**Our version:**
- Surfaces council agendas in plain language, structured and searchable
- Citizens can subscribe to topics they care about (housing, transport, education) and receive notifications when those topics appear on the agenda
- Structured participation channels — comments on agenda items linked directly to the official record
- Data is owned by the municipality and exportable at any time
- Federation: a village node can surface its own agenda and optionally federate with a regional node that aggregates across municipalities, enabling citizens who live near a border to follow neighbouring councils
- Designed to be run and governed by the municipality itself, not a vendor

---

## Federation Model

This section is a binding architectural constraint, not a suggestion. All platforms must implement it.

### Principles

1. **Local-first:** A single node running on a municipality's server is a complete, fully functional deployment. It requires no connection to any central server to operate.

2. **Voluntary federation:** A node operator (a mayor, a cooperative board, a neighbourhood association) can choose to federate with a larger node. This grants discoverability across the federation and may enable capacity sharing (e.g., a guest from one city's Stay node can find a listing in another city's Stay node).

3. **Data sovereignty:** Federating never transfers data ownership. The local node retains full control of its data. Withdrawing from a federation does not result in data loss.

4. **No central authority:** There is no master node. Any node can federate with any other node that accepts the connection. The federation topology is a graph, not a hierarchy.

5. **Interoperability standard:** Where an open standard exists (ActivityPub, ATProto, or platform-specific protocols), prefer it over a proprietary federation protocol.

### Example: Stay federation

```
Madrid federation node
  ├── Getafe (member since 2026)
  ├── Alcobendas (member since 2027)
  └── Rivas-Vaciamadrid (standalone — not federated)
```

A guest searching on the Madrid node sees listings from Getafe and Alcobendas. Rivas-Vaciamadrid runs its own instance and is not visible unless it chooses to federate.

---

## Rules for Agents

When working in this repository, apply the following checks before implementing any feature, component, or data model.

**On every feature:**
- Ask: "Does this extract value from users, or deliver it to them?"
- Ask: "Does this make it harder for users to leave, or easier?"
- Ask: "Could a public entity govern and operate this without a private intermediary?"

**On data models:**
- Ask: "Can a local node own, export, and migrate this data without vendor lock-in?"
- Ask: "Does this schema support federation — can it be shared across nodes without exposing private data?"

**On worker-facing features:**
- Workers must have visibility into how their pay is calculated
- Workers must have an appeal path for adverse decisions
- No feature may make worker deactivation easier without also making the appeal process clearer

**On UI and copy:**
- No urgency language ("Only 2 left!", "Hurry, offer ends soon!")
- No pre-ticked consent boxes
- No fees revealed after the user has invested time in a flow
- Pricing must be complete and visible before the user commits

**On federation:**
- Any feature that stores data in a way that would make federation harder must be flagged before implementation
- Any feature that requires a central authority to function must be flagged and an alternative proposed

**On scope:**
- The Platform Registry above is the source of truth for what this project builds
- Do not add platforms, features, or apps outside the registry without updating it first and creating a new ADR if the change is architectural

---

## Modifying AI Rules

**This block is active only when the current task modifies this file, any `CLAUDE.md`, or any file in `decisions/`. Skip it otherwise.**

Run `/rules-audit` before and after any change to AI-governing files. Changes to these files must not reduce any criterion score without an explicit explanation in the PR description.
