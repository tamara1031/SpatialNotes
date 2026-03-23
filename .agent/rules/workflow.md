# Workflow Directives

## Mandatory Testing & QA Loop
The development process adheres strictly to a QA loop sequence. For every modification:
1. Confirm Use Case.
2. Update Robustness Diagram.
3. Reflect in Detailed Design.
4. Update Test Specs.
5. Update Test Code.
6. Implement and Refactor.
7. Execute all local tests (`make test`, `make test-e2e`) to pass.
8. Record changes in ADRs.

## Prohibition of Arbitrary Feature Bloat
Follow YAGNI (You Aren't Gonna Need It). Maintain OSS-based standard community delegation. Prevent "reinvented wheel" logic. The goal is maintainability and low debt. No arbitrary features.
