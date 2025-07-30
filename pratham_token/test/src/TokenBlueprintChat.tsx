import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import type { FormEvent } from "react";
import { message, result, createDataItemSigner } from "@permaweb/aoconnect";
import "./TokenBlueprintChat.css";
import stripAnsi from "strip-ansi";

interface ChatBotProps {
  processId: string;
  theme?: "light" | "dark";
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

const TOKEN_ACTIONS = [
  { label: "Info", action: "Info", tags: [{ name: "Action", value: "Info" }] },
  {
    label: "Balances",
    action: "Balances",
    tags: [{ name: "Action", value: "Balances" }],
  },
  {
    label: "Total Supply",
    action: "Total-Supply",
    tags: [{ name: "Action", value: "Total-Supply" }],
  },
];

// Add this to fix TS errors for window.arweaveWallet
declare global {
  interface Window {
    arweaveWallet?: any;
  }
}

const TokenBlueprintChat = forwardRef(function TokenBlueprintChat(
  { processId, theme = "light" }: ChatBotProps,
  ref
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balanceTarget, setBalanceTarget] = useState("");
  const [transfer, setTransfer] = useState({ recipient: "", quantity: "" });
  const [mintQty, setMintQty] = useState("");
  const [burnQty, setBurnQty] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    addUserMessage: (content: string) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content, timestamp: new Date().toISOString() },
      ]);
    },
  }));

  useEffect(() => {
    if (!window.arweaveWallet) {
      setError("ArConnect wallet not detected. Please install ArConnect.");
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendTokenMessage = async (
    tags: { name: string; value: string }[],
    data?: any,
    requireSigner: boolean = true
  ) => {
    setLoading(true);
    setError(null);
    try {
      const messageOptions: any = {
        process: processId,
        tags,
        data: data ? JSON.stringify(data) : undefined,
      };

      if (requireSigner) {
        const signer = createDataItemSigner(window.arweaveWallet);
        messageOptions.signer = signer;
      }

      const sentMessage = await message(messageOptions);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const res = await result({ process: processId, message: sentMessage });
      console.log("Received response:", res);
      const responseText =
        res?.Messages?.[0]?.Data ||
        JSON.stringify(res?.Messages?.[0] || "No response from process.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseText,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setError("Blueprint interaction failed. Check wallet and input format.");
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Error occurred while processing your command.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for each action
  const handleInfo = () => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Info", timestamp: new Date().toISOString() },
    ]);
    sendTokenMessage([{ name: "Action", value: "Info" }]);
  };

  const handleBalances = () => {
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: "Balances",
        timestamp: new Date().toISOString(),
      },
    ]);
    sendTokenMessage([{ name: "Action", value: "Balances" }]);
  };

  const handleTotalSupply = () => {
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: "Total-Supply",
        timestamp: new Date().toISOString(),
      },
    ]);
    sendTokenMessage([{ name: "Action", value: "Total-Supply" }]);
  };

  const handleBalance = (e: FormEvent) => {
    e.preventDefault();
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `Balance of ${balanceTarget || "me"}`,
        timestamp: new Date().toISOString(),
      },
    ]);
    const tags = [{ name: "Action", value: "Balance" }];
    if (balanceTarget) tags.push({ name: "Target", value: balanceTarget });
    sendTokenMessage(tags);
    setBalanceTarget("");
  };
  const sendAosLuaCommandToWebSocket = (
    luaCommand: string,
    onLine: (line: string) => void,
    onClose?: () => void
  ) => {
    console.log("Sending Lua command to WebSocket:", luaCommand);
    // Use the same protocol and host as the current page, but with ws://
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket opened, sending Lua message");
      ws.send(JSON.stringify({ aosMessage: luaCommand }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "aos-output") {
          const lines = message.data.split("\n");

          lines.forEach((line) => {
            const cleaned = stripAnsi(line.trim());
            if (!cleaned) return;

            // Match success or failure patterns
            const successMatch = cleaned.match(
              /Successfully (minted|burned) \d+/i
            );
            const errorMatch = cleaned.match(/(error|failed)/i);

            if (successMatch) {
              onLine?.(successMatch[0]); // Example: "Successfully burned 5"
            } else if (errorMatch) {
              onLine?.("Error: " + cleaned);
            }
          });
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      onClose?.();
    };

    return ws; // So you can close it manually if needed
  };

  const handleMint = async (e: FormEvent) => {
    e.preventDefault();

    if (!/^[1-9][0-9]*$/.test(mintQty)) {
      setError("Please enter a valid positive integer for mint quantity.");
      return;
    }

    const luaMint = `Send({ Target = ao.id, Action = "Mint", Quantity = "${mintQty}" }).receive().Data`;
    const mintCommand = `aos mint --process ${processId} --qty ${mintQty}`;

    await navigator.clipboard.writeText(mintCommand);

    // Log the user's action
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `Mint ${mintQty}`,
        timestamp: new Date().toISOString(),
      },
      {
        role: "user",
        content: `Sent to aos: ${luaMint}`,
        timestamp: new Date().toISOString(),
      },
    ]);

    // Stream output from WebSocket
    sendAosLuaCommandToWebSocket(
      luaMint,
      (line) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: line,
            timestamp: new Date().toISOString(),
          },
        ]);
      },
      () => {
        console.log("WebSocket closed after streaming mint output");
      }
    );
  };

  // const handleMint = async (e: FormEvent) => {
  //   e.preventDefault();
  //   if (!/^[1-9][0-9]*$/.test(mintQty)) {
  //     setError("Please enter a valid positive integer for mint quantity.");
  //     return;
  //   }
  //   const luaMint = `Send({ Target = ao.id, Action = "Mint", Quantity = "${mintQty}" }).receive().Data`;
  //   setMessages((prev) => [
  //     ...prev,
  //     {
  //       role: "user",
  //       content: `Mint ${mintQty}`,
  //       timestamp: new Date().toISOString(),
  //     },
  //     {
  //       role: "user",
  //       content: `Sent to aos: ${luaMint}`,
  //       timestamp: new Date().toISOString(),
  //     },
  //   ]);
  //   const mintCommand = `aos mint --process ${processId} --qty ${mintQty}`;
  //   await navigator.clipboard.writeText(mintCommand);
  //   sendAosLuaCommandToWebSocket(luaMint);
  //   sendTokenMessage(
  //     [
  //       { name: "Action", value: "Mint" },
  //       { name: "Quantity", value: mintQty },
  //     ],
  //     undefined,
  //     false
  //   );
  //   setMintQty("");
  // };

  const handleBurn = async (e: FormEvent) => {
    e.preventDefault();

    // Validate burn quantity input
    if (!/^[1-9][0-9]*$/.test(burnQty)) {
      setError("Please enter a valid positive integer for burn quantity.");
      return;
    }

    const luaBurn = `Send({ Target = ao.id, Action = "Burn", Quantity = "${burnQty}" }).receive().Data`;

    // Append messages to chat UI
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `Burn ${burnQty}`,
        timestamp: new Date().toISOString(),
      },
      {
        role: "user",
        content: `Sent to aos: ${luaBurn}`,
        timestamp: new Date().toISOString(),
      },
    ]);

    // Generate and copy aos CLI command to clipboard
    const burnCommand = `aos burn --process ${processId} --qty ${burnQty}`;
    await navigator.clipboard.writeText(burnCommand);

    // Send to WebSocket and log to explorer
    sendAosLuaCommandToWebSocket(
      luaBurn,
      (line) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: line,
            timestamp: new Date().toISOString(),
          },
        ]);
      },
      () => {
        console.log("WebSocket closed after streaming burn output");
      }
    );
    // Reset input
    setBurnQty("");
  };

  const handleTransfer = async (e: FormEvent) => {
    e.preventDefault();
    const luaTransfer = `Send({ Target = ao.id, Action = \"Transfer\", Recipient = \"${transfer.recipient}\", Quantity = \"${transfer.quantity}\" }).receive().Data`;
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `Transfer ${transfer.quantity} to ${transfer.recipient}`,
        timestamp: new Date().toISOString(),
      },
      {
        role: "user",
        content: `Sent to aos: ${luaTransfer}`,
        timestamp: new Date().toISOString(),
      },
    ]);
    const transferCommand = `aos transfer --process ${processId} --to ${transfer.recipient} --qty ${transfer.quantity}`;
    await navigator.clipboard.writeText(transferCommand);
    // sendAosLuaCommandToWebSocket(luaTransfer);
    sendAosLuaCommandToWebSocket(luaTransfer);
    sendTokenMessage([
      { name: "Action", value: "Transfer" },
      { name: "Recipient", value: transfer.recipient },
      { name: "Quantity", value: transfer.quantity },
    ]);
    setTransfer({ recipient: "", quantity: "" });
  };

  return (
    <div className={`tbc-container ${theme}`}>
      <div className="tbc-header">
        <h2 className="tbc-title">Token Blueprint</h2>
        <div className="tbc-action-buttons">
          <button
            className="tbc-btn"
            onClick={handleInfo}
            disabled={loading || !window.arweaveWallet}
          >
            Info
          </button>
          <button
            className="tbc-btn"
            onClick={handleBalances}
            disabled={loading || !window.arweaveWallet}
          >
            Balances
          </button>
          <button
            className="tbc-btn"
            onClick={handleTotalSupply}
            disabled={loading || !window.arweaveWallet}
          >
            Total Supply
          </button>
        </div>
      </div>

      {error && <div className="tbc-error-message">{error}</div>}

      <div className="tbc-messages-container">
        {messages.map((msg, i) => {
          let parsed: any = null;
          let isJson = false;
          try {
            parsed = JSON.parse(msg.content) as any;
            isJson = typeof parsed === "object" && parsed !== null;
          } catch {}

          // Helper: render Balances as a list
          function renderBalances(balancesObj: any): React.ReactNode {
            return (
              <ul className="tbc-balance-list">
                {Object.entries(balancesObj || {}).map(([addr, bal]) => (
                  <li key={addr} className="tbc-balance-item">
                    <span className="tbc-balance-addr">{addr}</span>:{" "}
                    <span className="tbc-balance-val">{bal}</span>
                  </li>
                ))}
              </ul>
            );
          }
          function renderInfo(info: any): React.ReactNode {
            return (
              <div className="tbc-info-block">
                <div>
                  <b>Name:</b> {info?.Name}
                </div>
                <div>
                  <b>Ticker:</b> {info?.Ticker}
                </div>
                <div>
                  <b>Denomination:</b> {info?.Denomination}
                </div>
                {info?.Logo && (
                  <div>
                    <b>Logo:</b>{" "}
                    <span className="tbc-logo-val">{info.Logo}</span>
                  </div>
                )}
              </div>
            );
          }
          function renderTotalSupply(obj: any): React.ReactNode {
            return (
              <div className="tbc-supply-block">
                <b>Total Supply:</b>{" "}
                {obj?.Data ||
                  obj?.TotalSupply ||
                  obj?.["totalSupply"] ||
                  obj?.["Total-Supply"]}{" "}
                {obj?.Ticker || ""}
              </div>
            );
          }
          function renderBalance(obj: any): React.ReactNode {
            return (
              <div className="tbc-balance-block">
                <b>Account:</b> {obj?.Account || obj?.Target || ""}
                <br />
                <b>Balance:</b> {obj?.Balance || obj?.Data || ""}{" "}
                {obj?.Ticker || ""}
              </div>
            );
          }
          function renderError(obj: any): React.ReactNode {
            return (
              <div className="tbc-error-block">
                <b>{obj?.["Action"] || "Error"}:</b>{" "}
                {obj?.Error ||
                  obj?.["error"] ||
                  obj?.["Message"] ||
                  "Unknown error"}
              </div>
            );
          }

          function renderMessageContent(): React.ReactNode {
            let customRender: React.ReactNode = null;
            if (isJson && (msg.role === "assistant" || msg.role === "system")) {
              if (parsed && parsed.Data && typeof parsed.Data === "string") {
                try {
                  const dataObj = JSON.parse(parsed.Data);
                  if (typeof dataObj === "object") {
                    customRender = renderBalances(dataObj);
                  }
                } catch {}
              } else if (parsed.Balance || parsed.Account) {
                customRender = renderBalance(parsed);
              } else if (parsed.Name && parsed.Ticker) {
                customRender = renderInfo(parsed);
              } else if (
                parsed["Total-Supply"] ||
                parsed.TotalSupply ||
                parsed.Data
              ) {
                customRender = renderTotalSupply(parsed);
              } else if (
                parsed.Error ||
                (typeof parsed["Action"] === "string" &&
                  parsed["Action"].toLowerCase().includes("error"))
              ) {
                customRender = renderError(parsed);
              }
            }
            if (customRender) return customRender;
            if (isJson && typeof parsed === "object") {
              return (
                <pre className="tbc-json-block">
                  <code>{JSON.stringify(parsed, null, 2)}</code>
                </pre>
              );
            }
            return String(msg.content);
          }

          return (
            <div key={i} className={`tbc-message tbc-${msg.role}-message`}>
              <div className="tbc-message-content">
                {renderMessageContent()}
              </div>
              <div className="tbc-message-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleBalance} className="tbc-form tbc-balance-form">
        <input
          type="text"
          value={balanceTarget}
          onChange={(e) => setBalanceTarget(e.target.value)}
          placeholder="Check balance of (address, blank for self)"
          className="tbc-input"
          disabled={loading || !window.arweaveWallet}
        />
        <button
          type="submit"
          className="tbc-btn"
          disabled={loading || !window.arweaveWallet}
        >
          Balance
        </button>
      </form>

      <form onSubmit={handleTransfer} className="tbc-form tbc-transfer-form">
        <input
          type="text"
          value={transfer.recipient}
          onChange={(e) =>
            setTransfer((t) => ({ ...t, recipient: e.target.value }))
          }
          placeholder="Recipient address"
          className="tbc-input"
          disabled={loading || !window.arweaveWallet}
        />
        <input
          type="text"
          value={transfer.quantity}
          onChange={(e) =>
            setTransfer((t) => ({ ...t, quantity: e.target.value }))
          }
          placeholder="Quantity"
          className="tbc-input"
          disabled={loading || !window.arweaveWallet}
        />
        <button
          type="submit"
          className="tbc-btn"
          disabled={loading || !window.arweaveWallet}
        >
          Transfer
        </button>
      </form>

      <form onSubmit={handleMint} className="tbc-form tbc-mint-form">
        <input
          type="text"
          value={mintQty}
          onChange={(e) => setMintQty(e.target.value)}
          placeholder="Mint quantity (owner only)"
          className="tbc-input"
          disabled={loading || !window.arweaveWallet}
        />
        <button
          type="submit"
          className="tbc-btn"
          disabled={loading || !window.arweaveWallet}
        >
          Mint
        </button>
      </form>

      <form onSubmit={handleBurn} className="tbc-form tbc-burn-form">
        <input
          type="text"
          value={burnQty}
          onChange={(e) => setBurnQty(e.target.value)}
          placeholder="Burn quantity"
          className="tbc-input"
          disabled={loading || !window.arweaveWallet}
        />
        <button
          type="submit"
          className="tbc-btn"
          disabled={loading || !window.arweaveWallet}
        >
          Burn
        </button>
      </form>
    </div>
  );
});

export default TokenBlueprintChat;
