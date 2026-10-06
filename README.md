# Tractus (app nativo)

App Android (e futuramente iOS) do Tractus em React Native com Expo. Substitui o app webview publicado na Play Store como `com.trainlog.app` e usa o mesmo backend do app web (Firebase + endpoints PHP na Hostinger).

## Stack

| Parte | Escolha |
|---|---|
| Base | Expo SDK 57, React Native 0.86, TypeScript, React Compiler |
| Navegação | Expo Router (rotas em `src/app`) com abas nativas |
| Estilo | Uniwind (Tailwind 4 no React Native). Tokens de cor em `src/global.css` |
| Firebase | React Native Firebase: Auth, Firestore (offline persistente), Analytics, Crashlytics |
| Push | OneSignal (mesmo app do web) |
| Gráficos | react-native-gifted-charts |
| Ícones | lucide-react-native (e Material Symbols / SF Symbols na tab bar) |

## Estrutura

```
src/
  app/            rotas (Expo Router)
    (auth)/       boas-vindas, login, cadastro, recuperar senha
    (app)/        telas logadas: (tabs) e telas empilhadas/modais
  components/     UI reutilizável (components/ui = blocos básicos)
  features/       partes maiores de uma tela (treino, formulários)
  data/           acesso ao Firestore e regras de negócio (portado do web)
  lib/            Firebase, armazenamento local, push, upload, datas...
  providers/      sessão, tema e toasts
  theme/          cores para uso em JS (ícones, gráficos, header)
```

## Configuração (uma vez)

### 1. Dependências e variáveis

```bash
pnpm install
cp .env.example .env   # preencha os valores (os mesmos do .env do web)
```

### 2. Firebase

1. No [Firebase Console](https://console.firebase.google.com), abra o projeto do Tractus → Configurações do projeto → **Seus apps**.
2. Adicione dois apps Android (se ainda não existirem):
   - `com.trainlog.app` (produção)
   - `com.trainlog.app.dev` (desenvolvimento)

   Não precisa informar SHA-1: login por email e senha não exige.
3. Baixe o `google-services.json` (ele já sai com os dois apps dentro) e coloque na raiz deste projeto.
4. Em **Crashlytics**, clique em "Ativar" se ainda não estiver ativo.

Para iOS no futuro: adicione um app iOS com o mesmo bundle id e coloque o `GoogleService-Info.plist` na raiz.

### 3. OneSignal (push no Android)

O app web usa push via navegador. Para o Android nativo, o OneSignal precisa das credenciais do FCM:

1. Firebase Console → Configurações do projeto → **Contas de serviço** → "Gerar nova chave privada" (baixa um JSON).
2. Painel do OneSignal → app do Tractus → Settings → Push & In-App → **Google Android (FCM)** → envie esse JSON.

O app usa o mesmo App ID do web. Ao entrar, o aparelho é vinculado ao usuário (`external_id` = uid do Firebase) e o `oneSignalSubscriptionId` é salvo no documento do usuário, que é o que os crons em PHP usam.

## Rodando no celular

O app usa módulos nativos (Firebase, OneSignal, MMKV...), então **não roda no Expo Go**: é preciso uma build de desenvolvimento.

**Opção A, build local** (usa o Android SDK instalado; celular com depuração USB ou emulador):

```powershell
$env:APP_VARIANT="development"; npx expo run:android
```

Depois disso, no dia a dia basta `pnpm start` e abrir o app "Tractus Dev" instalado.

**Opção B, build na nuvem (EAS)**: `pnpm build:dev` gera um APK para instalar.

O app de desenvolvimento usa o pacote `com.trainlog.app.dev` e o nome "Tractus Dev", então fica instalado ao lado do app da Play Store sem conflito.

## Publicando na Play Store (substituindo o app webview)

Para o Android tratar o app novo como atualização do antigo, três coisas precisam bater:

1. **Mesmo pacote:** `com.trainlog.app` (já configurado em `app.config.ts`).
2. **Mesma chave de assinatura:** a chave de upload que você usa hoje (`trainlog-assets/trainlog-apk-key`).
   - Na Play Console → Testar e lançar → **Integridade do app**, veja se a "Assinatura de apps do Google Play" está ativa. Se estiver, a chave que você tem é a *chave de upload* e é ela que o EAS usa.
   - `npx eas-cli credentials` → Android → production → Keystore → use o keystore existente (informe o alias e as senhas).
3. **versionCode maior** que o da versão atual (veja na Play Console, em Pacotes de apps):
   - `npx eas-cli build:version:set` e informe um número maior. Depois disso o EAS incrementa sozinho a cada build de produção.

Primeira vez com EAS: `npx eas-cli login` e `npx eas-cli init`. O `init` mostra um `projectId`; adicione em `app.config.ts`:

```ts
extra: { eas: { projectId: 'o-id-que-apareceu' } },
```

Build e envio:

```bash
pnpm build:prod     # gera o .aab na nuvem
pnpm submit         # envia para a faixa de teste interno da Play Store
```

Recomendado: publique primeiro no teste interno, instale pelo link da Play Store por cima do app webview e confirme que a atualização funciona (login mantido, push chegando) antes de promover para produção.

### Forçar atualização

Se uma versão antiga precisar ser bloqueada, crie o campo `minAppVersion` (ex.: `"3.1.0"`) no documento `sistema/info` do Firestore. Versões menores mostram um aviso obrigatório com o botão para a Play Store. O campo `lastVersion` continua sendo usado só pelo app web.

## Scripts

| Script | O que faz |
|---|---|
| `pnpm start` | servidor de desenvolvimento (para o app "Tractus Dev") |
| `pnpm android` | compila e instala a build local |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | ESLint (inclui as regras do React Compiler) |
| `pnpm build:dev` / `pnpm build:prod` | builds no EAS |
| `pnpm submit` | envia a última build de produção para a Play Store |

## Comportamentos importantes

- **Offline:** o Firestore nativo guarda os dados em disco. Marcar séries, concluir exercícios e editar treinos funciona sem internet e sincroniza depois.
- **Timer de descanso:** o fim do descanso fica salvo no exercício (`restEndsAt`). Se o app for fechado no meio do descanso, ao voltar a série é concluída automaticamente.
- **Rotinas diárias:** ao abrir o app (e ao voltar para ele num dia novo) roda a mesma manutenção do web: zera o progresso de treinos de outros dias e atualiza streak e freezes.
- **Notificações com link:** as URLs do web que vêm nos pushes (ex.: `/profile/streak-calendar`) são convertidas em telas do app (`src/lib/push.ts`).
