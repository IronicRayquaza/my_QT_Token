# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})




uses the og token blueprint on process id wTIAdGied4B7wXk1zikACl0Qn-wNdIlDOCkY81YiPBc..

# WebSocket CLI Integration

## How it works
- When you mint a token in the TokenBlueprintChat UI, the mint command is:
  1. Copied to your clipboard
  2. Sent to a local websocket server, which executes it in your terminal

## Setup

1. **Install dependencies for the websocket server:**
   ```bash
   npm install ws
   ```
   (You can do this in the project root or wherever you place `ws-server.js`)

2. **Run the websocket server:**
   ```bash
   node ws-server.js
   ```
   This will listen on ws://localhost:8080

3. **Start your React app as usual.**

4. **Mint a token in the UI.**
   - The command will be copied to your clipboard and sent to the websocket server for execution.

## Security Note
- The websocket server will execute any command it receives. Only run it locally and never expose it to the internet.
```
