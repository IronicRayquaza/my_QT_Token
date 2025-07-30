import React, { useRef } from "react";
import TokenBlueprintChat from "./TokenBlueprintChat";
// import TerminalComponent from "./Terminal";

function App() {
  

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* <TerminalComponent onCommand={handleTerminalCommand} /> */}
      <TokenBlueprintChat processId="wPFoUrFZc0sVLw8EM1UyRnODPkaMeYpqoQltDq7zaZQ" />
    </div>
  );
}

export default App;
