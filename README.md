# Atlana — Agente de Segurança IaC Inteligente (Headless)

O Atlana é um **Agente de Segurança Autónomo** desenhado para proteger o teu código de infraestrutura (Terraform e Dockerfiles). Ele atua diretamente no teu fluxo de desenvolvimento (**CI/CD**), analisando vulnerabilidades e propondo correções prontas a aplicar via **GitHub Actions**.

> [!IMPORTANT]
> **Versão Headless**: Esta versão do Atlana foca-se na eficiência máxima. Em vez de um dashboard visual, o Atlana integra-se nativamente no teu repositório de código, agindo como um "guarda-costas" automatizado.

---

## 🔬 Como o Atlana funciona?

Imagina o Atlana como uma **Sentinela 24/7** que vigia o teu repositório.

### 1. O Scan de Gatilho ⚡
Sempre que um programador faz um "Push" ou abre um "Pull Request", o Atlana entra em ação. Ele identifica se houve mudanças em ficheiros sensíveis como `Dockerfile` ou `.tf`.

### 2. O Diagnóstico Inteligente (Gemini 1.5) 🧠
O Atlana envia o código para um motor de IA (**Google Gemini 1.5 Flash**) que analisa cada linha à procura de falhas críticas:
-   **Portas abertas desnecessárias** (ex: SSH exposto ao mundo).
-   **Privilégios root** (execução de processos com permissões excessivas).
-   **Má configuração de rede** (Security Groups demasiado permissivos).

### 3. A Resposta Imediata no GitHub 💬
O Atlana publica um relatório diretamente no Pull Request, com:
-   **Nível de Severidade**: (CRITICAL, HIGH, MEDIUM, LOW).
-   **Explicação Didática**: Por que é que aquilo é um risco.
-   **Fix Sugerido**: O código corrigido pronto para ser copiado.

### 4. Integração nativa SARIF 🛡️
Todos os alertas são exportados para a aba de **Security > Code Scanning** do GitHub, permitindo uma gestão centralizada de vulnerabilidades sem sair do repositório.

---

## 🚀 Como usar no GitHub Actions

1.  Copia o ficheiro `.github/workflows/atlana-security.yml` para o teu repositório.
2.  Configura a `GOOGLE_GENERATIVE_AI_API_KEY` nos **Secrets** do teu GitHub.
3.  O Atlana começará a auditar cada sugestão de mudança automaticamente.

---

## 🧪 Execução Manual (CLI)

Podes correr o Atlana localmente na tua máquina:

```bash
# Instalar dependências
npm install

# Analisar um ficheiro específico
npm run scan -- path/to/your/file.tf
```

---

## 🧰 Stack Tecnológica
- **Motor de IA**: Google Gemini 1.5 Flash.
- **Linguagem**: TypeScript (Headless Node.js).
- **Integração**: GitHub Actions + SARIF.
- **Validação**: Zod + Sanitize Guardrails.
