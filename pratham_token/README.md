# Pratham Token - AO Token Management

This project provides a WebSocket server for managing AO (Arweave Operating System) tokens and a React frontend for interacting with them.

## Features

- WebSocket server for AO token operations
- React frontend with real-time token management
- Support for minting, burning, and transferring tokens
- Real-time balance checking and token information

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- AOS (Arweave Operating System) CLI installed

### Setup

1. Install dependencies:
```bash
npm install
cd test && npm install
```

2. Build the React frontend:
```bash
npm run build
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Deployment on Render

### Automatic Deployment

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Connect your repository to Render
3. Render will automatically detect the `render.yaml` configuration
4. The service will be deployed automatically

### Manual Deployment

1. Create a new Web Service on Render
2. Connect your Git repository
3. Set the following configuration:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Environment Variables

The following environment variables are automatically set:
- `NODE_ENV`: production
- `PORT`: Automatically assigned by Render

## Project Structure

```
pratham_token/
├── server.js              # Main server file (Express + WebSocket)
├── ws-server.js           # Original WebSocket server
├── token.lua              # AO token contract
├── test/                  # React frontend
│   ├── src/
│   │   ├── TokenBlueprintChat.tsx
│   │   └── ...
│   └── package.json
├── package.json           # Main package.json
├── render.yaml            # Render deployment configuration
└── README.md
```

## WebSocket API

The WebSocket server accepts the following message format:

```javascript
{
  "aosMessage": "Lua command or object"
}
```

### Example Usage

```javascript
const ws = new WebSocket('ws://your-domain.com');
ws.send(JSON.stringify({
  aosMessage: 'Send({ Target = ao.id, Action = "Mint", Quantity = "10" })'
}));
```

## Token Operations

- **Mint**: Create new tokens
- **Burn**: Destroy existing tokens
- **Transfer**: Send tokens to another address
- **Balance**: Check token balance for an address
- **Info**: Get token information

## Troubleshooting

### Common Issues

1. **AOS not found**: Ensure AOS CLI is installed and accessible
2. **WebSocket connection failed**: Check if the server is running and accessible
3. **Build failures**: Ensure all dependencies are properly installed

### Logs

Check the Render logs for any deployment or runtime issues. The server logs all WebSocket connections and AOS interactions.

## License

ISC 