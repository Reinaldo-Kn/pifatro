# Pifatro

**Resumo:**
O Pifatro é um jogo de cartas inspirado no jogo Balatro, porém utilizando a dinâmica clássica da mão de Pife. O jogador deve formar trincas de cartas, que podem ser tanto três cartas do mesmo valor (independentemente do naipe) quanto três cartas em sequência (também sem depender do naipe). Toda a experiência do jogo foi construída utilizando Phaser em conjunto com Vite, resultando em uma SPA (Single Page Application) leve. O backend do projeto é baseado em PocketBase, responsável pela autenticação dos jogadores e pelo armazenamento do estado das partidas.

Para rodar o jogo, basta ter o Docker e o Docker Compose instalados, e executar o comando:

```powershell
docker compose up -d
```


e acessar `http://localhost:8080` no navegador. Consulte a parte do Pocketbase para configurar o admin e as collections.

Para testes, você pode usar o usuário de padrão para jogar:
- Email: `teste@teste.com`
- Senha: `teste666`

Mais informações sobre o funcionamento do jogo, estrutura do código, dependências e detalhes sobre o Dockerfile e o docker-compose.yml, consulte as seções abaixo.

--- 
## Sobre o projeto

**Dependências (do `package.json`)**
- **`vite` (devDependency):** ferramenta de bundling / dev server usada durante desenvolvimento. Comandos úteis: `npm run dev`, `npm run build`.
- **`phaser` (dependency):** engine do jogo (render, cenas, input, física simples). Versão usada no projeto: `^3.90.0`.
- **`pocketbase` (dependency):** cliente JavaScript para falar com o PocketBase. Usado para signup/login e para salvar/carregar o estado do jogador (vidas, moedas, mão). Versão usada no projeto : `^0.26.3`.

Por referência, o `package.json` contém essas entradas em `dependencies` e `devDependencies` — use `npm install`/`npm ci` para instalar, caso queira desenvolver encima do projeto.

**Como o jogo Pifatro funciona**
- **Frontend:** criado com Phaser + Vite. A pasta `src/` contém as cenas e utilitários:
  - `src/scenes/MainScene.js` — cena principal do jogo (lógica de jogo, render e ciclo).
  - `src/scenes/LoginScene.js` — overlay HTML para cadastro/login (integração com PocketBase).
  - `src/utils/pocketbaseClient.js` — helper para inicializar PocketBase, `signUp`, `loginWithEmail`, `saveGameState` e `loadGameState`.
  - `src/utils/uiManager.js` — helpers para UI, botão de salvar e painéis de debug.
  - `src/utils/*` — `gameLogic.js`, `handManager.js`, `cardActions.js` etc. — regras do jogo, manipulação de cartas e UX.
- **O que é salvo no backend:** o collection `game_states` do PocketBase guarda, por jogador, os campos principais:
  - `user` (relação com o usuário autenticado)
  - `lives` (número)
  - `coins` (número)
  - `hand` (texto contendo JSON com a mão atual)
  - timestamps (`created`, `updated`)
- **Fluxo básico:** o jogador abre o jogo → faz login/inscrição via `LoginScene` → `MainScene` solicita `loadGameState` → jogador joga → quando quiser, clica no botão de salvar (save) → `saveGameState` atualiza/cria o registro mais recente do jogador.

Observação importante de permissões PocketBase:
- Habilite as regras da collection no Admin UI do PocketBase como:
  - Create / List / View / Update 

Sem essas regras o frontend pode receber 403 ao tentar listar/registar estados.

**Explicação do `Dockerfile`**
- O `Dockerfile` do repositório é baseado em `nginx:1.29.3-alpine` e faz o seguinte:
  - Remove a configuração padrão do Nginx e copia um `nginx.conf` customizado (para servir Single Page Application e fazer proxy `/api` para PocketBase).
  - Copia a pasta `dist` (build do Vite) para `/usr/share/nginx/html`.
  - Isto significa que o processo de build deve produzir a pasta `dist` *antes* de construir a imagem. No fluxo automatizado (GitHub Actions) a etapa é:
    1. `npm ci` (ou `npm install`)
    2. `npm run build` (gera `dist`)
    3. `docker login` no Docker Hub
    4. `docker build -t reinaldokn/pifatro-web:latest .` (constrói a imagem web usando o `Dockerfile`)
    5. `docker push reinaldokn/pifatro-web:latest`

**GitHub Actions**
- O repositório inclui/espera um workflow ( em `.github/workflows/publish-docker.yml`) que automatiza os passos acima e faz o push para o Docker Hub. Para que o workflow consiga publicar, configure os Secrets no repositório GitHub:
  - `DOCKERHUB_USERNAME` — seu usuário Docker Hub
  - `DOCKERHUB_TOKEN` ou `DOCKERHUB_PASSWORD` — token ou senha 

Se preferir publicar manualmente localmente, exemplos de comandos:

```powershell
npm ci
npm run build
docker build -t myuser/pifatro-web:latest .
docker push myuser/pifatro-web:latest
```

Substitua `myuser` pelo seu usuário Docker Hub.

**Sobre o PocketBase**
- No `docker-compose.yml` incluímos a imagem `elestio/pocketbase:v0.34.0` para servir de banco de dados leve. Ela expõe a porta `8090` para o admin UI e API.
- Na primeira execução, crie um usuário admin via Admin UI (`http://localhost:8090/_/`) e configure a collection `game_states` com os campos mencionados acima.
- Ou pode restaurar um backup pré-configurado ( `/public/pocketbase/pb_backup.zip`).

Em casos de problema na criação do admin, entre no container do Pockerbase -> Terminal -> e rode:

```powershell
pocketbase superuser create admin@admin.com admin666!
```

**Sobre o `docker-compose.yml`**
- O `docker-compose.yml` presente no repositório contém:
  - `pocketbase`:
    - `image: elestio/pocketbase:v0.34.0`
    - portas: `8090:8090` (admin + API do PocketBase)
    - volume `pifatro_data` montado para persistir dados do PB (`/pb_data`).
  - `web`:
    - imagem `reinaldokn/pifatro-frontend:latest` 
    - portas: `8080:80` (site servido pelo Nginx dentro do container)
    - depende de `pocketbase`.
  - `portainer` (opcional, para gerenciar containers via UI):
    - portas `8000` e `9443`, e o volume para `portainer_data`.

- Para rodar o `docker-compose.yml`

```powershell
docker compose up -d
```

- Acessos úteis após iniciar os containers:
  - Pifatro Game: `http://localhost:8080`
  - PocketBase (admin): `http://localhost:8090/_/`
  - Portainer UI: `https://localhost:9443` 

- Para parar e remover containers:

```powershell
docker compose down
```


**Execução local sem Docker (para dev)**
- Para desenvolver localmente sem containers:
  - Instale dependências: `npm install`
  - Execute o dev server do Vite: `npm run dev` (acessa o jogo em `http://localhost:5173` por padrão)
  - PocketBase: rode localmente o binário do PocketBase:

```powershell
pocketbase serve 
```

**Dicas de troubleshooting**
- Se o frontend mostrar erros ao listar/ler `game_states` (HTTP 403), verifique as regras da collection no Admin UI do PocketBase (ver seção Permissões acima).
- Apenas a branch `master` está configurada para publicar automaticamente a imagem no Docker Hub via GitHub Actions. Desenvolva em branches separadas e faça merge na `master` quando quiser publicar.


