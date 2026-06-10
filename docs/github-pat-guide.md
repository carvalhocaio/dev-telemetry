# GitHub Personal Access Token — Guia de Permissões

O dev-telemetry usa um **PAT separado** (não o token OAuth do login) para coletar
seus commits e pull requests via API do GitHub. Isso mantém o acesso de dados
completamente separado da identidade de autenticação.

---

## Token clássico (Personal access token — Classic)

Acesse: **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
→ **Generate new token (classic)**

### Escopos necessários

| Escopo | Por quê |
|---|---|
| `read:user` | Confirmar o login do GitHub (identidade do perfil) |
| `public_repo` | Commits e PRs em repositórios **públicos** |
| `repo` | Commits e PRs em repositórios **privados** (adicione se tiver repos privados) |
| `read:org` | Repositórios e contribuições em **organizações** das quais você faz parte |

> Se você só trabalha em repos públicos pessoais, `read:user` + `public_repo` é suficiente.

### Validade

Recomendamos **90 dias** ou **1 ano** para comodidade. Você receberá um aviso do
GitHub antes do vencimento e pode renovar em Settings.

---

## Fine-grained token (recomendado para maior segurança)

Acesse: **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
→ **Generate new token**

### Resource owner

Selecione seu usuário (ou a organização, se quiser incluir repos da org).

### Repository access

- **All repositories** — coleta tudo (público + privado)
- **Only select repositories** — escolha repositórios específicos

### Permissões necessárias (Repository permissions)

| Permissão | Nível |
|---|---|
| **Contents** | Read-only |
| **Metadata** | Read-only (obrigatório automaticamente) |
| **Pull requests** | Read-only |

### Permissões de conta (Account permissions)

| Permissão | Nível |
|---|---|
| **Profile** | Read-only |

---

## O que o dev-telemetry FAZ com o token

- Descobre repositórios acessíveis pelo token
- Coleta commits **autorados por você** (`author:<seu_login>`)
- Coleta pull requests **abertos por você**
- Armazena estatísticas (additions/deletions/changedFiles) e mensagens/títulos
- **Nunca** armazena patches/diffs de código

## O que o dev-telemetry NÃO FAZ

- Não escreve nada no seu GitHub
- Não acessa conteúdo de arquivos (código-fonte)
- Não acessa issues, wikis ou Actions
- Não compartilha o token com nenhum terceiro

---

## Segurança

O token é **criptografado com AES-256-GCM** antes de ser gravado no banco de dados.
A chave de criptografia fica no servidor e nunca é exposta ao navegador.
O token em texto puro existe apenas em memória durante a coleta de dados e é
descartado imediatamente após o uso.
