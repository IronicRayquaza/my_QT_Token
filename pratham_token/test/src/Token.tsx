import React, { useState } from 'react';

interface TokenProps {
  processId: string;
}

interface Message {
  Data?: string;
  Tags?: { name: string; value: string }[];
}

interface AOResponse {
  Messages?: Message[];
}

const Token: React.FC<TokenProps> = ({ processId }) => {
  const [action, setAction] = useState("Info");
  const [inputValue, setInputValue] = useState("");
  const [response, setResponse] = useState("No response yet.");

  const handleAction = async () => {
    setResponse("Sending...");

    try {
      const tags: { name: string; value: string }[] = [{ name: "Action", value: action }];

      if (action === "Transfer") {
        const [recipient, quantity] = inputValue.split(",");
        if (!recipient || !quantity) {
          setResponse("Error: Use format Recipient,Quantity");
          return;
        }
        tags.push({ name: "Recipient", value: recipient.trim() });
        tags.push({ name: "Quantity", value: quantity.trim() });
      } else if (action === "Mint" || action === "Burn") {
        tags.push({ name: "Quantity", value: inputValue });
      } else if (action === "Balance") {
        tags.push({ name: "Target", value: inputValue });
      }

      const res: AOResponse = await (window as any)?.ao?.send({
        process: processId,
        tags,
      });

      const message = res?.Messages?.find(msg =>
        msg?.Tags?.some(tag =>
          tag.name === "Action" &&
          (
            tag.value === action ||
            tag.value.includes("Success") ||
            tag.value.includes("Error") ||
            tag.value === "Balance" ||
            tag.value === "Balances"
          )
        )
      );

      let data = "No response from process.";
      if (message?.Data) {
        try {
          data = JSON.stringify(JSON.parse(message.Data), null, 2);
        } catch {
          data = message.Data;
        }
      } else {
        const errorTag = message?.Tags?.find(tag => tag.name === "Error");
        if (errorTag) {
          data = `Error: ${errorTag.value}`;
        }
      }

      setResponse(data);
    } catch (err) {
      console.error("Error sending to AO:", err);
      setResponse("Error sending message.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded bg-white shadow">
      <h2 className="text-xl font-semibold mb-4">AO Token Interface</h2>

      <label className="block mb-1 font-medium">Select Action</label>
      <select
        className="w-full mb-4 p-2 border rounded"
        value={action}
        onChange={(e) => {
          setAction(e.target.value);
          setInputValue("");
        }}
      >
        <option value="Info">Info</option>
        <option value="Balance">Balance</option>
        <option value="Balances">Balances</option>
        <option value="Mint">Mint</option>
        <option value="Transfer">Transfer</option>
        <option value="Burn">Burn</option>
      </select>

      {(action === "Mint" || action === "Burn") && (
        <input
          type="text"
          className="w-full mb-4 p-2 border rounded"
          placeholder="Enter quantity"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      )}

      {action === "Transfer" && (
        <input
          type="text"
          className="w-full mb-4 p-2 border rounded"
          placeholder="Recipient,Quantity"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      )}

      {action === "Balance" && (
        <input
          type="text"
          className="w-full mb-4 p-2 border rounded"
          placeholder="Enter wallet address"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      )}

      <button
        onClick={handleAction}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Send
      </button>

      <div className="mt-4 bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap max-h-64 overflow-auto">
        {response}
      </div>
    </div>
  );
};

export default Token;
