# Arquitetura do Atlana (Headless Agent)

O Atlana é composto por três camadas principais que garantem uma análise de segurança rápida, precisa e resiliente no fluxo de CI/CD.

## 1. Core Engine (The Brain)
Localizado em `src/lib/agent/analyzer.ts`.
- **Analisador Gemini**: Utiliza o modelo `gemini-1.5-flash` para interpretar o conteúdo do IaC.
- **Estruturação de Dados**: Converte a linguagem natural da IA num objeto JSON estruturado (conforme definido em `schema.ts`).
- **Resiliência (Atlana Lite)**: Implementa um sistema de *fallback* para dados simulados caso a API da Google esteja inacessível, garantindo que o pipeline de CI nunca bloqueie o desenvolvimento.

## 2. Guardrails (The Shield)
Localizado em `src/lib/guardrails/`.
- **Sanitização (`sanitize.ts`)**: Limpa o input antes de ser enviado para a IA, protegendo contra abusos de prompt.
- **Validação (`validate.ts`)**: Utiliza **Zod** para garantir que o output da IA segue rigorosamente o esquema esperado pelo repositório GitHub.

## 3. Interface CLI/GitHub (The Body)
Localizado em `src/scripts/scan-cli.ts` e `.github/workflows/`.
- **CLI Wrapper**: Lê os ficheiros alterados no repositório e coordena a análise.
- **SARIF Exporter**: Gera o relatório no formato `Static Analysis Results Interchange Format` para integração imediata no GitHub Security.
- **PR Automator**: Converte a análise num comentário Markdown de alta legibilidade para Pull Requests.

---

## Fluxo de Execução
1.  **Gatilho**: O GitHub Action deteta alterações em `.tf` ou `Dockerfile`.
2.  **Análise**: O CLI executa o `analyzer.ts` para cada ficheiro.
3.  **Filtragem**: Apenas ficheiros com vulnerabilidades reais (ou simuladas no fallback) geram alertas.
4.  **Feedback**: O PR é comentado com o diagnóstico e o "Fix" sugerido.
