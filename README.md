# Binário em Palavras

## 🌟 Sobre o projeto

**Binário em Palavras** é um conversor educacional criado para demonstrar como os computadores processam informações utilizando o sistema binário. O projeto faz parte da iniciativa **Ciência & Fé**, visando integrar conhecimento tecnológico e princípios educativos.

A ferramenta permite converter texto para binário e vice-versa, ajudando no aprendizado sobre sistemas digitais e a forma como máquinas interpretam dados.

🚨 **Este é um protótipo e pode conter bugs!**

---

## 🚀 Funcionalidades

- Conversão texto ↔ binário em tempo real utilizando um dicionário completo de caracteres
- Validação da entrada binária para impedir caracteres inválidos
- Dicionário pesquisável com botões que inserem caracteres diretamente no texto
- Coleção de frases rápidas e trechos bíblicos para ilustrar temas de comunicação e fé
- Seleção de temas (padrão, escuro, vintage e alto contraste) com persistência via `sessionStorage`
- Alertas introdutórios e feedback visual para ações como limpeza e destaque de botões
- Tema secreto “Matrix” (efeito de chuva em canvas e trilha/efeitos sonoros). Ativação pela palavra‑chave "O ARQUITETO" (ou pela sequência binária equivalente)
- Painel de acessibilidade com ajustes de fonte, contraste e foco; respeito ao `prefers-reduced-motion`

---

## 🛠 Tecnologias utilizadas

Este projeto foi desenvolvido com as seguintes tecnologias:

- **HTML5**
- **CSS3**
- **JavaScript**
- **Bootstrap**
- **SweetAlert2**
- **Vite**

---

## Estrutura do projeto

```
Binario-em-Palavras/
│── index.html             # Entrada principal da aplicação
│── public/                # Arquivos públicos e favicon
│   └── favicon.ico        # Ícone da aplicação
│── src/                   # Código-fonte
│   ├── css/
│   │   └── themes.css     # Estilos temáticos e utilidades
│   └── js/
│       ├── data/
│       │   └── phrases.js    # Dicionário, frases e versículos
│       ├── modules/
│       │   ├── converter.js        # Funções puras de conversão (UTF-8)
│       │   ├── themeManager.js     # Gerenciamento de temas e efeito Matrix
│       │   ├── matrixRain.js       # Efeito visual de chuva (canvas)
│       │   └── matrixAudioManager.js # Trilhas/efeitos sonoros do tema Matrix
│       ├── accessibility.js   # Painel de acessibilidade (IIFE)
│       └── index.js           # Inicialização e orquestração da UI
│── api/
│   └── send-feedback.js  # Função serverless (Vercel) para envio de feedback por e-mail
│── package.json           # Scripts e dependências
│── vite.config.js         # Configuração do Vite
│── README.md              # Documentação do projeto
```

---

## 🎭 Como rodar o projeto?

### 🖥️ Pré-requisitos

Antes de começar, você precisará ter instalado:

- [Node.js](https://nodejs.org/) (>= 18)
- [Git](https://git-scm.com/)

### 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone git@github.com:SamuelScar/Binario-em-Palavras.git
   cd Binario-em-Palavras
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Inicie o servidor**
   ```bash
   npm run dev
   ```

4. **Acesse o projeto**
   - O projeto estará disponível em: `http://localhost:5173`

---

### ✉️ Envio de feedback (API)

O formulário de feedback usa a rota `/api/send-feedback` (função serverless para Vercel).

- Em ambiente local com `vite dev`, a chamada pode falhar (não há proxy por padrão). O app mostra uma mensagem e oferece link de e-mail.
- Para testar a função localmente, use o ambiente de desenvolvimento da Vercel:
  - Instale a CLI (opcional): `npm i -g vercel`
  - Rode: `vercel dev` (a função ficará disponível em `/api/send-feedback`)

#### Variáveis de ambiente
Crie um arquivo `.env` baseado em `.env.example` com suas credenciais SMTP:

```
SMTP_HOST=smtp.seuprovedor.com
SMTP_PORT=587
SMTP_USER=seu_usuario
SMTP_PASS=sua_senha
SMTP_SECURE=false

# Opcional
# FEEDBACK_FROM="Binario em Palavras <no-reply@seu-dominio.com>"
# FEEDBACK_TO=seuemail@dominio.com
```

As variáveis são lidas pela função serverless no deploy (Vercel) e no `vercel dev`.

---



## 🧪 Qualidade de Código (opcional)

Foram adicionadas configurações leves para padronização e linting:

- `.editorconfig` para estilo de edição consistente entre IDEs
- `.eslintrc.json` com regras recomendadas (sem dependências instaladas por padrão)
- `.prettierrc.json` com formatação base

Scripts disponíveis (instale primeiro as devDependencies `eslint` e `prettier` se desejar usar):

```bash
npm run lint           # Executa ESLint
npm run format         # Formata o código com Prettier
npm run format:check   # Verifica formatação
```

Exemplo de instalação opcional das ferramentas:

```bash
npm i -D eslint prettier
```

Esses comandos não afetam o build e são opcionais no fluxo local.

---

## 🤝 Contribuição

Quer contribuir com melhorias? Siga os passos:

1. **Faça um fork** deste repositório
2. **Crie uma branch** para sua feature:
   ```bash
   git checkout -b minha-feature
   ```
3. **Adicione suas mudanças**:
   ```bash
   git add .
   git commit -m "Adicionando minha nova feature"
   ```
4. **Envie suas mudanças**:
   ```bash
   git push origin minha-feature
   ```
5. **Crie um Pull Request**

Diretrizes sugeridas:

- Use docstrings (JSDoc) no lugar de comentários soltos
- Não altere contratos públicos, esquemas, rotas ou mensagens
- Prefira pequenas PRs com escopo claro
- Commits no padrão Conventional Commits (ex.: `feat:`, `fix:`, `docs:`, `refactor:`)
- Evite dependências pesadas; discuta antes se necessário

---

## ♿ Acessibilidade

- Painel dedicado com controles de fonte, contraste, fundo claro e sublinhado de links
- Elementos interativos com `aria-label` e estados `aria-pressed/disabled`
- Respeito a `prefers-reduced-motion`: o efeito Matrix exibe grade estática quando ativo
- Foco visível nos componentes Bootstrap; revise tokens de cor para cada tema

---

## 🔊 Tema Matrix (extra)

- Chuva verde em canvas (`src/js/modules/matrixRain.js`)
- Trilha/effects via Web Audio (`src/js/modules/matrixAudioManager.js`)
- Ativação controlada pelos botões do topo; popovers explicam o estado
- Em navegadores sem suporte a Web Audio, a UI desabilita os controles
 - Para ativar rapidamente: digite "O ARQUITETO" no campo de texto (ou cole a sequência binária equivalente) para habilitar o tema Matrix

---

## 📚 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

## 📲 Contato

Caso tenha alguma dúvida ou sugestão, entre em contato:

👤 **SamuelScar**  
🔗 [GitHub](https://github.com/SamuelScar)  
📧 [Email](mailto:souzacarvalhosamuel@gmail.com)
