<!--
SYNC IMPACT REPORT
Version change: 3.0.0 → 3.1.0 (MINOR version bump)
- Modified principles: Updated frontend framework from Angular to React
- Added sections: None
- Removed sections: None
- Templates requiring updates: ✅ .specify/templates/plan-template.md, ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->

# Furniture Web Shop Constitution

## Core Principles

### Domain-Driven Design First

Domain First: The **domain model** is the primary source of truth.

- Business concepts, rules, and invariants MUST take precedence over technical concerns.
- Each domain model MUST protect its own invariants.
  - Invariants MUST be enforced at the model level.
  - Invalid states MUST be unrepresentable where possible.
  - Business rules MUST NOT be scattered across layers.
  Entities, Value Objects, Aggregates, and Domain Services MUST be used intentionally.
- MUST maintain clear separation between Domain, Application, Infrastructure layers
- MUST use Ubiquitous Language consistently across codebase and documentation

### Code Quality Standards

- MUST follow TDD: Tests written before implementation, Red-Green-Refactor cycle
- MUST maintain ≥80% test coverage for all business logic
- MUST use CI/CD integration with automated testing gates
- MUST include type hints and comprehensive docstrings

### User Experience Consistency

- MUST maintain design system consistency across all UI components
- MUST implement responsive design for desktop, tablet, and mobile
- MUST ensure accessibility compliance (WCAG 2.1 AA minimum)
- MUST provide consistent error handling and user feedback

### Testing Standards

- MUST implement unit tests for all domain logic and services
- MUST implement integration tests for API endpoints and critical workflows
- MUST implement end-to-end tests for user journeys
- MUST include performance testing for high-traffic scenarios

## Architecture & Technology Stack

### Technology Requirements

- Python 3.12+ backend with FastAPI
- React 18+ frontend with TypeScript
- PostgreSQL database with proper indexing
- Redis for caching and session management
- Docker containers for development and deployment

### Architecture Principles

- MUST follow Clean Architecture principles
- MUST implement proper separation of concerns
- MUST use dependency injection for testability
- MUST implement API versioning strategy
- MUST use environment-based configuration management

## Development Workflow

### Process Requirements

- MUST use feature branches with clear naming convention (###-feature-name)
- MUST implement code reviews with at least 2 approvers
- MUST maintain comprehensive documentation
- MUST implement automated deployment pipelines
- MUST conduct regular architecture reviews

### Quality Gates

- All PRs must pass CI/CD checks before merge
- All features must have corresponding specification documents
- All changes must be reviewed against constitution principles
- All breaking changes must include migration plans

## Governance

Constitution supersedes all other development practices and guidelines
Amendments require documentation, team approval, and migration plan
All PRs and code reviews must verify compliance with constitution principles
Complexity must be justified and documented
Use constitution as primary guidance for all technical decisions

**Version**: 3.1.0 | **Ratified**: TODO(RATIFICATION_DATE): Original adoption date unknown | **Last Amended**: 2025-12-16
