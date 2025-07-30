import React from "react";
import Arweave from "arweave";
import { WarpFactory } from "warp-contracts";
import { DeployPlugin } from "warp-contracts-plugin-deploy";

// Arweave instance
const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https"
});

// Warp instance
const warp = WarpFactory.forMainnet().use(new DeployPlugin());

const DeployToken: React.FC = () => {
  const deployAtomicToken = async () => {
    try {
      // Connect wallet
      await window.arweaveWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"]);

      const tx = await arweave.createTransaction({
        data: Math.random().toString().slice(-4) // Just dummy data
      });

      // Add required tags for Atomic Token contract
      tx.addTag("App-Name", "SmartWeaveContract");
      tx.addTag("App-Version", "0.3.0");
      tx.addTag("Contract-Src", "Of9pi--Gj7hCTawhgxOwbuWnFI1h24TTgO5pw8ENJNQ");
      tx.addTag("Init-State", JSON.stringify({})); // Will default via constructor
      tx.addTag(
        "Contract-Manifest",
        JSON.stringify({
          evaluationOptions: {
            sourceType: "redstone-sequencer",
            allowBigInt: true,
            internalWrites: true,
            unsafeClient: "skip",
            useConstructor: true
          }
        })
      );

      // Dispatch using arweaveWallet
      const result = await window.arweaveWallet.dispatch(tx);

      // Register contract on Warp gateway node
      await warp.register(tx.id, "node2");

      alert(`✅ Contract deployed! TX ID: ${tx.id}`);
      console.log("✅ Deployment complete:", tx.id);
    } catch (err) {
      console.error("❌ Deployment failed:", err);
      alert("❌ Failed to deploy. Check console.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Deploy Atomic Token</h2>
      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        onClick={deployAtomicToken}
      >
        Deploy Token
      </button>
    </div>
  );
};

export default DeployToken;

