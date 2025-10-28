# Contribuindo para o Binário em Palavras

Obrigado por considerar contribuir! Este guia resume o fluxo recomendado para manter a qualidade sem alterar o comportamento existente.

## Princípios
- Não alterar contratos públicos (APIs, tipos, payloads, mensagens, códigos de status)
- Preferir pequenas PRs com escopo claro e atômico
- Usar docstrings (JSDoc) em vez de comentários soltos
- Evitar dependências pesadas; quando indispensável, discutir no PR

## Padrões de Commit

Use o padrão Conventional Commits no TÍTULO e seus bullets descritivos no CORPO:

- Formato do título: `tipo(escopo opcional): assunto curto` (sem ponto final)
- Corpo: liste mudanças em bullets objetivos. Opcionalmente inclua “Contexto”, “Risco” e “Validação”.

Tipos mais usados aqui: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `build`, `ci`, `perf`.

Exemplos rápidos:

```
docs(js): documentar ThemeManager

- Adiciona JSDoc em APIs públicas e helpers
- Detalha uso de data-theme e evento binario:theme-change
- Sem alteração de comportamento

Contexto: padronização de docstrings
Risco: BAIXO
Validação: `npm run dev` e navegação básica
```

```
refactor(audio): simplificar fade out

- Early-return e guards
- Mantém tempos/curvas de ganho
- Não altera o estado persistido

Risco: BAIXO
Validação: efeito liga/desliga como antes
```

Template opcional de commit (ajuda a não esquecer os bullets):

1. Salve o arquivo `.gitmessage` na raiz (já incluído neste repositório).
2. Ative o template no seu repositório local:
   ```bash
   git config commit.template .gitmessage
   ```
3. Para voltar ao padrão, remova a configuração:
   ```bash
   git config --unset commit.template
   ```

## Fluxo de Trabalho
1. Crie um fork e uma branch: `git checkout -b sua-branch`
2. Mantenha mudanças focadas e cobertas por docstrings
3. Rode localmente: `npm run dev`
4. Opcional (se instalado):
   - `npm run lint`
   - `npm run format`
5. Abra o Pull Request para a branch `homologacao` descrevendo objetivo e impacto (comprovando que não altera comportamento)

## Estilo de Código
- Indentação de 2 espaços (EditorConfig)
- JSDoc para módulos, funções e constantes exportadas
- Evite comentários soltos; prefira docstrings

Obrigado por contribuir! 🎉
