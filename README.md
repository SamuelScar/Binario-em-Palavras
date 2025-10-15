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
│       │   ├── converter.js  # Funções puras de conversão
│       │   └── themeManager.js # Gerenciamento de temas
│       └── index.js          # Inicialização e lógica da interface
│── package.json           # Scripts e dependências
│── vite.config.js         # Configuração do Vite
│── README.md              # Documentação do projeto
```

---

## 🎭 Como rodar o projeto?

### 🖥️ Pré-requisitos

Antes de começar, você precisará ter instalado:

- [Node.js](https://nodejs.org/)
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

---

## 📚 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

## 📲 Contato

Caso tenha alguma dúvida ou sugestão, entre em contato:

👤 **SamuelScar**  
🔗 [GitHub](https://github.com/SamuelScar)  
📧 [Email](mailto:seuemail@example.com)
