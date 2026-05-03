---
name: define-application
description: 'Define the whole application before defining features or implementation tasks.'
user-invocable: true
---

# define-application

## Description
Define the whole application before defining features or implementation tasks.

## Purpose
Create enough shared context for grilling, modeling, PRD creation, and issue planning.

## Do not
- Create a full PRD
- Break work into issues
- Write code
- Choose detailed architecture too early

## Required sections
- Application name
- One-sentence description
- Target users
- Problem statement
- Core workflows
- Major feature areas
- Core data concepts
- External integrations
- Technical constraints already known
- MVP boundary
- NOT in scope
- What already exists
- Open questions
- Recommended next use of `choose-technical-approach` when stack/architecture/runtime/persistence/deployment/testing decisions are needed
- Recommended next use of `grill-me`

## Approval behavior
For meaningful applications, present the definition in sections and ask for approval or revision before proceeding to `choose-technical-approach` or modeling.
