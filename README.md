# DDD with code agent

- opencode v1.0.153
- spec-kit v0.0.22
- python 3.12

## Installation

```bash
brew install opencode #https://opencode.ai
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

## Initialize Project

### 1. spec-kit

```bash
specify init .
```

- link with opencode

![Agent Folder Security](./media/agent-folder-security.png)

spec-kit has created 2 folders:

- .specify
- .opencode

You will find new opencode commands inside .opencode folder: ls -la .opencode/command

### 2. opencode

run opencode

```bash
opencode
```

### Constitution.md

```command
/speckit.constitution We build a web shop selling furniture with python and react. We consistently follow domain driven design patterns.
```

Manuel corrections:

#### DDD Constitution

#### 1. Domain First

The **domain model** is the primary source of truth.

- Business concepts, rules, and invariants take precedence over technical concerns.
- The system MUST reflect how domain experts think and speak.
- Technical abstractions MUST NOT distort or replace domain concepts.

#### 2. Ubiquitous Language

A single, shared language MUST be used consistently across:

- Specifications
- Code
- Tests
- Documentation
- Conversations

Rules:

- Domain terms MUST be explicitly defined.
- Synonyms MUST NOT be introduced casually.
- If a term is ambiguous, it MUST be clarified or renamed.

The ubiquitous language evolves intentionally and versionedly.

#### 3. Explicit Boundaries

The system is composed of **Bounded Contexts**.

- Each bounded context has:
  - Its own model
  - Its own language
  - Clear responsibilities
- Models MUST NOT leak across boundaries.
- Integration between contexts MUST be explicit and documented.

Coupling across bounded contexts is a design decision, not an accident.

#### 4. Model Integrity

Each domain model MUST protect its own invariants.

- Invariants MUST be enforced at the model level.
- Invalid states MUST be unrepresentable where possible.
- Business rules MUST NOT be scattered across layers.

Entities, Value Objects, Aggregates, and Domain Services MUST be used intentionally.

#### 5. Aggregates as Consistency Boundaries

Aggregates define transactional and consistency boundaries.

Rules:

- An Aggregate Root is the only entry point to its aggregate.
- Cross-aggregate consistency MUST be eventual unless explicitly justified.
- Aggregates SHOULD be small and behavior-rich.

#### 6. Behavior Over Data

Domain objects represent **behavior**, not just structure.

- Entities and Value Objects SHOULD encapsulate logic.
- Anemic domain models are considered a design failure.
- Business decisions belong in the domain, not orchestration layers.

#### 8. Intentional Complexity

Complexity is addressed, not hidden.

- Accidental complexity MUST be minimized.
- Essential complexity MUST be modeled explicitly.
- Trade-offs MUST be documented when made.

If a concept is complex in the business, it SHOULD be complex in the model.

### Python

```bash
conda create --name hsrtw25 python=3.12
conda activate hsrtw25
```
