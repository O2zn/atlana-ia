# Atlana — Segurança em IaC com IA e Aprovação Humana

O Atlana é um **Agente de Segurança** para infraestrutura. Ele analisa ficheiros de configuração (como Dockerfiles e Terraform) para encontrar falhas de segurança e sugere correções prontas a aplicar.

> [!NOTE]
> **A Filosofia do Atlana:** Nenhum "robô" deve mudar a tua infraestrutura sem que um humano veja primeiro. É por isso que o Atlana segue o modelo **Human-in-the-Loop (HITL)**.

---

## 🔬 Como o Atlana funciona? (Metáfora)

Imagina que o Atlana é uma espécie de **Máquina de Raio-X inteligente** para o código do teu servidor.

### 1. O Scan (Raio-X) 📡
Tu dás ao Atlana o código que descreve o teu servidor (ex: "Quero um computador com Linux e Node.js"). O Atlana "tira uma foto" (Scan) desse código.

### 2. O Diagnóstico (IA Gemini 1.5) 🧠
O código é analisado por um motor de IA (**Google Gemini 1.5 Flash**) que procura "sinais vitais" anormais como portas abertas ou privilégios root excessivos.

### 3. O Sistema de Resiliência (Atlana Lite) 🛡️
O Atlana foi desenhado para **nunca falhar**. Se a internet falhar ou a chave de IA não estiver a funcionar, o sistema entra em **Modo Fallback (Simulação)**, gerando diagnósticos realistas para o tipo de ficheiro fornecido.

---

## 🚀 Do MVP para Produção: Próximos Passos

Este projeto foi desenhado como um MVP resiliente. Num ambiente corporativo real, o sistema evoluiria para:
1.  **Multi-LLM Failover**: Alternar entre Gemini, GPT-4 ou modelos locais se um falhar.
2.  **Integração SAST Fallback**: Usar ferramentas como Checkov ou Hadolint se a IA estiver offline.
3.  **Processamento Assíncrono**: Uso de filas para scans em massa.

---

## 🤖 Integração com GitHub (DevOps & CI/CD)

O Atlana pode ser o "guarda-costas" de qualquer repositório.

### Como usar no GitHub Actions:
1.  Copia o ficheiro `.github/workflows/atlana-security.yml` para o teu repositório.
2.  Configura a `GOOGLE_GENERATIVE_AI_API_KEY` nos **Secrets** do teu GitHub.
3.  Sempre que houver um **Pull Request**, o Atlana irá:
    -   Analisar ficheiros alterados (`.tf`, `Dockerfile`).
    -   Publicar um comentário no PR com o relatório e o código de correção.
    -   Enviar resultados SARIF para a aba **Security > Code Scanning**.

---

## 🧪 Protocolo de Teste (Como verificar)

Para testar se a integração com o GitHub está a funcionar corretamente:

1.  **Cria uma nova branch**: `git checkout -b teste-seguranca`
2.  **Cria um ficheiro vulnerável**: Cria um `test.Dockerfile` com `FROM ubuntu:latest` e `USER root`.
3.  **Faz Push e abre um PR**: Envia para o GitHub e abre um Pull Request para a `main`.
4.  **Verifica o PR**: O Atlana deve comentar no PR com o relatório em menos de 2 minutos.
5.  **Verifica o Security Tab**: Os resultados devem aparecer em *Security > Code Scanning*.

---

## 🧰 Stack Tecnológica

| Componente | Tecnologia | Função |
|------------|------------|--------|
| **Frontend** | Next.js 16 | A interface visual do dashboard. |
| **Cérebro** | Gemini 1.5 Flash | O motor de IA que faz a análise. |
| **CI/CD** | GitHub Actions | Automatização de scans em Pull Requests. |
| **Relatórios** | SARIF | Formato padrão de segurança do GitHub. |

---

## 🛠️ Como começar?

1.  Clica em **"New Scan"**.
2.  Usa o exemplo por defeito e clica em **"Analyze"**.
3.  Vai ao **Dashboard** e revê a vulnerabilidade.
4.  Clica em **"Approve"** para simular a aceitação da correção.
