// src/App.tsx
import './App.css';
import 'antd/dist/reset.css';

import { useWallet, type InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Aptos, AptosConfig, Network, type MoveValue } from "@aptos-labs/ts-sdk";
import { useState, useEffect } from 'react';

// --- Core App Configuration ---
const MODULE_ADDRESS = "0x7920edec8c18ce2c86ab09adf605883e49025410349a5ae108b2f5e09a00c61e"; // <-- IMPORTANT: REPLACE WITH YOUR DEPLOYED MODULE ADDRESS
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

// --- TypeScript Type for an Invoice ---
// Matches the `Invoice` struct in your Move module
type Invoice = {
  invoice_id: string;
  sme_address: string;
  investor_address: { vec: string[] }; // Option<address> -> { vec: [] } or { vec: [addr] }
  client_name: string;
  industry: string;
  invoice_amount: string;
  list_price: string;
  due_date_secs: string;
  status: number;
};

// --- Helper to map status numbers to readable names ---
const STATUS_MAP: { [key: number]: string } = {
  0: "Created",
  1: "Listed",
  2: "Sold",
  3: "Settled",
  4: "Defaulted",
};


function App() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [poolBalance, setPoolBalance] = useState<string>("0");
  const [collectedFees, setCollectedFees] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [stakeRatio, setStakeRatio] = useState<number>(40); // Default 40%
  const [poolContribution, setPoolContribution] = useState<number>(4); // Default 4%
  const [investorProfit, setInvestorProfit] = useState<number>(15); // Default 15%

  // --- Function to fetch all relevant data from the blockchain ---
  const fetchData = async () => {
    if (!account) return;
    setIsLoading(true);
    try {
      // Fetch all invoices
      // Note: A real DApp would use an indexer for this.
      // Here, we'll fetch them one by one until we get a "not found" error.
      const fetchedInvoices: Invoice[] = [];
      let i = 0;
      while (true) {
        try {
          const invoice = await getInvoice(i);
          fetchedInvoices.push(invoice);
          i++;
        } catch (error: any) {
          // Break the loop when an invoice is not found
          if (error.message.includes("E_INVOICE_NOT_FOUND") || error.message.includes("Failed to fetch resource")) {
            break;
          }
          console.error(`Error fetching invoice ${i}:`, error);
          break;
        }
      }
      setInvoices(fetchedInvoices.reverse()); // Show newest first

      // Fetch pool balance
      const balancePayload = {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::get_pool_balance`,
        functionArguments: [],
      };
      const poolResult = await aptos.view<MoveValue[]>({ payload: balancePayload });
      setPoolBalance(poolResult[0] as string);
      
      // Fetch collected fees
      const feesPayload = {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::get_collected_fees`,
        functionArguments: [],
      };
      const feesResult = await aptos.view<MoveValue[]>({ payload: feesPayload });
      setCollectedFees(feesResult[0] as string);
      
      // Check if the current user is the admin (module publisher)
      setIsAdmin(account?.address.toString() === MODULE_ADDRESS);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Effect to fetch data when the account changes or on page load ---
  useEffect(() => {
    fetchData();
  }, [account]);


  // --- View Function: Get a single invoice by ID ---
  const getInvoice = async (id: number): Promise<Invoice> => {
    const payload = {
      function: `${MODULE_ADDRESS}::decentralized_invoicing::get_invoice`,
      functionArguments: [id.toString()],
    };
    const result = await aptos.view<Invoice>({ payload });
    return result[0];
  };

  // --- Transaction: Create an Invoice ---
  const handleCreateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!account) return;

    const formData = new FormData(e.currentTarget);
    const amount = formData.get("amount") as string;
    const dueDate = formData.get("dueDate") as string;
    const client = formData.get("client") as string;
    const industry = formData.get("industry") as string;

    // Convert date to Unix timestamp in seconds
    const dueDateSecs = Math.floor(new Date(dueDate).getTime() / 1000);

    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::create_invoice`,
        functionArguments: [
          parseInt(amount) * 100000000, // Convert APT to Octas
          dueDateSecs,
          client,
          industry,
        ],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      alert("Invoice created successfully!");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Create invoice failed:", error);
      alert("Error creating invoice. See console for details.");
    }
  };

  // --- Transaction: List an Invoice ---
  const handleListInvoice = async (invoiceId: string) => {
    if (!account) return;
    const priceStr = prompt("Enter the list price in APT:", "");
    if (!priceStr || isNaN(Number(priceStr))) {
      alert("Invalid price.");
      return;
    }
    const priceInOctas = Number(priceStr) * 100000000;

    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::list_invoice`,
        functionArguments: [invoiceId, priceInOctas],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      alert("Invoice listed successfully!");
      fetchData();
    } catch (error) {
      console.error("List invoice failed:", error);
      alert("Error listing invoice. See console for details.");
    }
  };

  // --- Transaction: Buy an Invoice ---
  const handleBuyInvoice = async (invoice: Invoice) => {
    if (!account) return;

    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::buy_invoice`,
        functionArguments: [
          invoice.invoice_id,
          invoice.list_price // Assuming the modified contract takes amount
        ],
        // Required for functions that use `Coin<AptosCoin>`
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      alert("Invoice purchased successfully!");
      fetchData();
    } catch (error) {
      console.error("Buy invoice failed:", error);
      alert("Error buying invoice. See console for details.");
    }
  };

  // --- Transaction: Settle an Invoice ---
  const handleSettleInvoice = async (invoice: Invoice) => {
    if (!account) return;

    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::settle_invoice`,
        functionArguments: [
          invoice.invoice_id,
          invoice.invoice_amount // Assuming the modified contract takes amount
        ],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      alert("Invoice settled successfully!");
      fetchData();
    } catch (error) {
      console.error("Settle invoice failed:", error);
      alert("Error settling invoice. See console for details.");
    }
  };

  // --- Transaction: Handle a Defaulted Invoice ---
  const handleDefaultInvoice = async (invoiceId: string) => {
    if (!account) return;

    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::handle_default`,
        functionArguments: [invoiceId],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      alert("Invoice default handled successfully.");
      fetchData();
    } catch (error) {
      console.error("Handle default failed:", error);
      alert("Error handling default. See console for details.");
    }
  };
  
  // --- Admin Transaction: Compensate from Pool ---
  const handleCompensateFromPool = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!account || !isAdmin) return;
    
    const formData = new FormData(e.currentTarget);
    const address = formData.get("address") as string;
    const amount = formData.get("amount") as string;
    const amountInOctas = Number(amount) * 100000000;
    
    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::compensate_from_pool`,
        functionArguments: [
          address,
          amountInOctas,
        ],
      },
    };
    
    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      alert("Investor compensated successfully!");
      fetchData();
    } catch (error) {
      console.error("Compensation failed:", error);
      alert("Error compensating investor. See console for details.");
    }
  };
  
  // --- Admin Transaction: Collect Fees ---
  const handleCollectFees = async () => {
    if (!account || !isAdmin) return;
    
    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::collect_fees`,
        functionArguments: [],
      },
    };
    
    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      alert("Fees collected successfully!");
      fetchData();
    } catch (error) {
      console.error("Fee collection failed:", error);
      alert("Error collecting fees. See console for details.");
    }
  };
  
  // --- Admin Transaction: Update Stake Ratio ---
  const handleUpdateStakeRatio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!account || !isAdmin) return;
    
    const formData = new FormData(e.currentTarget);
    const ratio = formData.get("ratio") as string;
    // Convert percentage to basis points (e.g. 40% -> 4000)
    const ratioBps = Number(ratio) * 100;
    
    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::update_stake_ratio`,
        functionArguments: [ratioBps],
      },
    };
    
    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      setStakeRatio(Number(ratio));
      alert("Stake ratio updated successfully!");
    } catch (error) {
      console.error("Update stake ratio failed:", error);
      alert("Error updating stake ratio. See console for details.");
    }
  };
  
  // --- Admin Transaction: Update Pool Contribution ---
  const handleUpdatePoolContribution = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!account || !isAdmin) return;
    
    const formData = new FormData(e.currentTarget);
    const contribution = formData.get("contribution") as string;
    // Convert percentage to basis points (e.g. 4% -> 400)
    const contributionBps = Number(contribution) * 100;
    
    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::decentralized_invoicing::update_pool_contribution`,
        functionArguments: [contributionBps],
      },
    };
    
    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      setPoolContribution(Number(contribution));
      alert("Pool contribution updated successfully!");
    } catch (error) {
      console.error("Update pool contribution failed:", error);
      alert("Error updating pool contribution. See console for details.");
    }
  };

  // --- Render UI ---
  return (
    <>
      <nav>
        <h1>Aptos Decentralized Invoicing</h1>
        <WalletSelector />
      </nav>

      {!account ? (
        <div className="center-prompt">Please connect your wallet to use the DApp.</div>
      ) : (
        <main className="container">
          <div className="card form-card">
            <h2>Create New Invoice</h2>
            <form onSubmit={handleCreateInvoice}>
              <input name="amount" type="number" placeholder="Invoice Amount (APT)" step="0.01" required />
              <input name="dueDate" type="date" required />
              <input name="client" type="text" placeholder="Client Name" required />
              <input name="industry" type="text" placeholder="Industry" required />
              <button type="submit">Create Invoice</button>
            </form>
          </div>

          <div className="card stats-card">
            <h2>Platform Stats</h2>
            <p>Community Pool Balance: <strong>{(Number(poolBalance) / 100000000).toFixed(4)} APT</strong></p>
            <p>Collected Fees: <strong>{(Number(collectedFees) / 100000000).toFixed(4)} APT</strong></p>
            <p>SME Stake Requirement: <strong>{stakeRatio}%</strong></p>
            <p>Pool Contribution: <strong>{poolContribution}%</strong></p>
            <p>Investor Profit: <strong>{investorProfit}%</strong></p>
            <button onClick={fetchData} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          {isAdmin && (
            <div className="admin-section">
              <h2>Admin Dashboard</h2>
              
              <div className="card admin-card">
                <h3>Compensate Investor from Pool</h3>
                <form onSubmit={handleCompensateFromPool}>
                  <input name="address" type="text" placeholder="Investor Address" required />
                  <input name="amount" type="number" placeholder="Amount (APT)" step="0.01" required />
                  <button type="submit">Compensate</button>
                </form>
              </div>
              
              <div className="card admin-card">
                <h3>Platform Settings</h3>
                <form onSubmit={handleUpdateStakeRatio}>
                  <label>Update SME Stake Ratio (%)</label>
                  <input name="ratio" type="number" placeholder="New Ratio (%)" step="0.01" required />
                  <button type="submit">Update Ratio</button>
                </form>
                
                <form onSubmit={handleUpdatePoolContribution}>
                  <label>Update Pool Contribution (%)</label>
                  <input name="contribution" type="number" placeholder="New Contribution (%)" step="0.01" required />
                  <button type="submit">Update Contribution</button>
                </form>
                
                <div className="collect-fees">
                  <button onClick={handleCollectFees}>Collect Platform Fees</button>
                </div>
              </div>
            </div>
          )}

          <div className="invoices-section">
            <h2>Invoices</h2>
            {isLoading && <p>Loading invoices...</p>}
            {!isLoading && invoices.length === 0 && <p>No invoices found.</p>}
            <div className="invoice-list">
              {invoices.map((invoice) => (
                <div key={invoice.invoice_id} className="card invoice-card">
                  <h3>Invoice #{invoice.invoice_id}</h3>
                  <p><strong>Status:</strong> <span className={`status status-${invoice.status}`}>{STATUS_MAP[invoice.status]}</span></p>
                  <p><strong>Amount:</strong> {(Number(invoice.invoice_amount) / 100000000).toFixed(2)} APT</p>
                  <p><strong>SME:</strong> {invoice.sme_address.slice(0, 6)}...{invoice.sme_address.slice(-4)}</p>
                  <p><strong>Due Date:</strong> {new Date(Number(invoice.due_date_secs) * 1000).toLocaleDateString()}</p>
                  {invoice.status === 1 && <p><strong>List Price:</strong> {(Number(invoice.list_price) / 100000000).toFixed(2)} APT</p>}
                  {invoice.investor_address.vec.length > 0 && <p><strong>Investor:</strong> {invoice.investor_address.vec[0].slice(0, 6)}...{invoice.investor_address.vec[0].slice(-4)}</p>}
                  
                  {/* --- Action Buttons --- */}
                  <div className="actions">
                    {invoice.status === 0 && invoice.sme_address === account.address && (
                      <button onClick={() => handleListInvoice(invoice.invoice_id)}>List Invoice</button>
                    )}
                    {invoice.status === 1 && invoice.sme_address !== account.address && (
                       <button onClick={() => handleBuyInvoice(invoice)}>Buy Invoice</button>
                    )}
                     {invoice.status === 2 && (
                       <button onClick={() => handleSettleInvoice(invoice)}>Settle Invoice</button>
                    )}
                    {invoice.status === 2 && invoice.investor_address.vec[0] === account.address && new Date().getTime() > Number(invoice.due_date_secs) * 1000 && (
                       <button className="danger" onClick={() => handleDefaultInvoice(invoice.invoice_id)}>Handle Default</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </>
  );
}

export default App;