// src/App.tsx
import './App.css';
import 'antd/dist/reset.css';

import { useWallet, type InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Aptos, AptosConfig, Network, type MoveValue } from "@aptos-labs/ts-sdk";
import { useState, useEffect } from 'react';

// Import RetroUI components
import { Navbar, Card, Button, Input, Badge, InvoiceCard, InvestmentCard } from './components/retroui';

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
  // --- NEW: State for investor's specific invoices ---
  const [myInvestments, setMyInvestments] = useState<Invoice[]>([]);
  const [poolBalance, setPoolBalance] = useState<string>("0");
  const [collectedFees, setCollectedFees] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [stakeRatio, setStakeRatio] = useState<number>(40); // Default 40%
  const [poolContribution, setPoolContribution] = useState<number>(4); // Default 4%
  const [investorProfit, setInvestorProfit] = useState<number>(15); // Default 15%
  
  // Loading states for individual actions
  const [loadingStates, setLoadingStates] = useState<{
    createInvoice: boolean;
    refreshData: boolean;
    compensate: boolean;
    collectFees: boolean;
    updateRatio: boolean;
    updateContribution: boolean;
    [key: `list_${string}`]: boolean;
    [key: `buy_${string}`]: boolean;
    [key: `settle_${string}`]: boolean;
    [key: `default_${string}`]: boolean;
  }>({
    createInvoice: false,
    refreshData: false,
    compensate: false,
    collectFees: false,
    updateRatio: false,
    updateContribution: false,
  });

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

      // --- NEW: Filter for invoices the current user has invested in ---
      const userInvestments = fetchedInvoices.filter(
        inv => inv.investor_address.vec.length > 0 && inv.investor_address.vec[0] === account.address.toString()
      );
      setMyInvestments(userInvestments);


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
    const result = await aptos.view<MoveValue[]>({ payload });
    return result[0] as Invoice;
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
          dueDateSecs.toString(),
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
        functionArguments: [invoiceId, priceInOctas.toString()],
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
          amountInOctas.toString(),
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
        functionArguments: [ratioBps.toString()],
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
        functionArguments: [contributionBps.toString()],
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

  // --- Using RetroUI InvoiceCard Component ---
  const renderInvoiceCard = (invoice: Invoice) => (
    <InvoiceCard 
      key={invoice.invoice_id}
      invoice={invoice}
      account={account}
      onListInvoice={handleListInvoice}
      onBuyInvoice={handleBuyInvoice}
      onSettleInvoice={handleSettleInvoice}
      onHandleDefault={handleDefaultInvoice}
    />
  );


  // --- Render UI with RetroUI Components ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar title="🚀 Aptos Decentralized Invoicing" className="mb-8 shadow-xl">
        <WalletSelector />
      </Navbar>

      {!account ? (
        <div className="flex items-center justify-center min-h-[70vh]">
          <Card variant="raised" className="p-10 max-w-lg text-center shadow-2xl bg-gradient-to-br from-white to-gray-50">
            <div className="text-8xl mb-6 animate-bounce">👋</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome to Decentralized Invoicing</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Connect your wallet to start trading invoices, make investments, and earn returns in the decentralized economy.
            </p>
            <div className="flex items-center justify-center gap-2 text-yellow-600">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium">Secure • Transparent • Profitable</p>
            </div>
          </Card>
        </div>
      ) : (
        <main className="container mx-auto px-6 pb-16 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <Card 
              title="📝 Create New Invoice (For SMEs)" 
              variant="raised" 
              className="h-full shadow-xl bg-gradient-to-br from-white to-blue-50"
            >
              <form onSubmit={handleCreateInvoice} className="space-y-5">
                <Input 
                  name="amount" 
                  type="number" 
                  placeholder="Invoice Amount (APT)" 
                  step="0.01" 
                  fullWidth 
                  required
                  label="Invoice Amount"
                />
                <Input 
                  name="dueDate" 
                  type="date" 
                  fullWidth 
                  required
                  label="Due Date"
                />
                <Input 
                  name="client" 
                  type="text" 
                  placeholder="e.g., ABC Corporation" 
                  fullWidth 
                  required
                  label="Client Name"
                />
                <Input 
                  name="industry" 
                  type="text" 
                  placeholder="e.g., Technology, Healthcare" 
                  fullWidth 
                  required
                  label="Industry"
                />
                <Button 
                  type="submit" 
                  fullWidth 
                  loading={isLoading}
                  className="mt-6"
                >
                  Create Invoice ✨
                </Button>
              </form>
            </Card>

            <Card 
              title="📊 Platform Statistics" 
              variant="raised" 
              className="h-full shadow-xl bg-gradient-to-br from-white to-yellow-50"
              loading={isLoading}
            >
              {!isLoading && (
                <>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Community Pool Balance
                      </span>
                      <span className="font-bold text-lg text-yellow-700">
                        {(Number(poolBalance) / 100000000).toFixed(4)} APT
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Collected Fees
                      </span>
                      <span className="font-bold text-lg text-green-700">
                        {(Number(collectedFees) / 100000000).toFixed(4)} APT
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mt-6">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">{stakeRatio}%</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">SME Stake</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">{poolContribution}%</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Pool Fee</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">{investorProfit}%</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Profit</div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={fetchData} 
                    disabled={isLoading}
                    loading={isLoading}
                    fullWidth
                    variant="secondary"
                    className="shadow-lg"
                  >
                    {isLoading ? "Refreshing..." : "🔄 Refresh Data"}
                  </Button>
                </>
              )}
            </Card>
          </div>

          {isAdmin && (
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                🛠️ Admin Dashboard
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card 
                  title="💰 Compensate Investor" 
                  variant="raised"
                  className="shadow-xl bg-gradient-to-br from-white to-red-50"
                >
                  <form onSubmit={handleCompensateFromPool} className="space-y-5">
                    <Input 
                      name="address" 
                      type="text" 
                      placeholder="0x..." 
                      fullWidth 
                      required
                      label="Investor Address"
                    />
                    <Input 
                      name="amount" 
                      type="number" 
                      placeholder="0.00" 
                      step="0.01" 
                      fullWidth 
                      required
                      label="Compensation Amount (APT)"
                    />
                    <Button 
                      type="submit" 
                      fullWidth 
                      variant="danger"
                      className="shadow-lg"
                    >
                      💸 Compensate
                    </Button>
                  </form>
                </Card>

                <Card 
                  title="⚙️ Platform Settings" 
                  variant="raised"
                  className="shadow-xl bg-gradient-to-br from-white to-purple-50"
                >
                  <form onSubmit={handleUpdateStakeRatio} className="space-y-4 mb-6">
                    <Input 
                      name="ratio" 
                      type="number" 
                      placeholder="40" 
                      step="0.01" 
                      fullWidth 
                      required
                      label="SME Stake Ratio (%)"
                    />
                    <Button type="submit" fullWidth size="sm">Update Ratio</Button>
                  </form>

                  <form onSubmit={handleUpdatePoolContribution} className="space-y-4 mb-6">
                    <Input 
                      name="contribution" 
                      type="number" 
                      placeholder="4" 
                      step="0.01" 
                      fullWidth 
                      required
                      label="Pool Contribution (%)"
                    />
                    <Button type="submit" fullWidth size="sm">Update Contribution</Button>
                  </form>

                  <div className="pt-4 border-t border-gray-200">
                    <Button 
                      onClick={handleCollectFees} 
                      fullWidth 
                      variant="primary"
                      className="shadow-lg"
                    >
                      💳 Collect Platform Fees
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* My Investments Section with Special Cards */}
          {myInvestments.length > 0 && (
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                💼 My Investments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myInvestments.map((invoice) => (
                  <InvestmentCard 
                    key={invoice.invoice_id}
                    invoice={invoice}
                    account={account}
                    onListInvoice={handleListInvoice}
                    onBuyInvoice={handleBuyInvoice}
                    onSettleInvoice={handleSettleInvoice}
                    onHandleDefault={handleDefaultInvoice}
                    loading={isLoading}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              🏪 Invoice Marketplace
            </h2>
            
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} variant="raised" loading={true} />
                ))}
              </div>
            )}
            
            {!isLoading && invoices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-gray-500 text-lg">No invoices found in the marketplace.</p>
                <p className="text-gray-400 text-sm mt-2">Be the first to create an invoice!</p>
              </div>
            )}
            
            {!isLoading && invoices.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {invoices.map((invoice) => (
                  <InvoiceCard 
                    key={invoice.invoice_id}
                    invoice={invoice}
                    account={account}
                    onListInvoice={handleListInvoice}
                    onBuyInvoice={handleBuyInvoice}
                    onSettleInvoice={handleSettleInvoice}
                    onHandleDefault={handleDefaultInvoice}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;