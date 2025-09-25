// import React, { useState, useEffect } from 'react';
// import { useWallet } from "@aptos-labs/wallet-adapter-react";
// // --- MOCK/SIMULATION SETUP ---
// // In a real app, you would install and import these packages:
// // import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
// // import { useWallet, WalletProvider } from "@aptos-labs/wallet-adapter-react";
// // To make this a single runnable file, we'll simulate the necessary objects.

// // Replace with the actual address where your module is deployed
// const MODULE_ADDRESS = "0x7920edec8c18ce2c86ab09adf605883e49025410349a5ae108b2f5e09a00c61e";

// // --- SIMULATED WALLET AND APTOS CLIENT ---

// // Simulated Wallet Hook
// const useSimulatedWallet = () => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [account, setAccount] = useState(null);
// //   const { account, signAndSubmitTransaction, connected } = useWallet();

//   const connect = () => {
//     setIsConnected(true);
//     setAccount({ address: "0xS1mulat3dAddr3ssFor7h3Us3r" });
//     console.log("Wallet connected!");
//   };

//   const disconnect = () => {
//     setIsConnected(false);
//     setAccount(null);
//     console.log("Wallet disconnected.");
//   };

//   const signAndSubmitTransaction = async (payload) => {
//     if (!isConnected) {
//       console.error("Wallet not connected.");
//       alert("Error: Wallet not connected.");
//       return { hash: null, success: false, error: "Wallet not connected." };
//     }
//     console.log("--- Simulating Transaction ---");
//     console.log("Account:", account.address);
//     console.log("Payload:", JSON.stringify(payload, null, 2));
    
//     // Simulate a network delay
//     await new Promise(resolve => setTimeout(resolve, 1500));

//     // Simulate a successful transaction hash
//     const fakeHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
//     console.log("Transaction successful with hash:", fakeHash);
//     console.log("----------------------------");
    
//     return { hash: fakeHash, success: true };
//   };

//   return { connect, disconnect, isConnected, account, signAndSubmitTransaction };
// };


// // Simulated Aptos SDK Client for view functions
// const simulatedAptosClient = {
//   view: async (payload) => {
//     console.log("--- Simulating View Function Call ---");
//     console.log("Payload:", JSON.stringify(payload, null, 2));
//     await new Promise(resolve => setTimeout(resolve, 500));
    
//     // Return mock data based on the function
//     const func = payload.function.split("::")[2];
//     switch (func) {
//       case "get_invoice":
//         return [{
//             invoice_id: payload.arguments[0],
//             sme_address: "0xSME_ADDRESS",
//             investor_address: { vec: ["0xINVESTOR_ADDRESS"] },
//             client_name: "Mock Client Inc.",
//             industry: "Tech",
//             invoice_amount: "100000000",
//             list_price: "85000000",
//             due_date_secs: String(Math.floor(Date.now() / 1000) + 86400),
//             status: 2,
//         }];
//       case "get_pool_balance":
//         return ["123456789"];
//       case "get_collected_fees":
//         return ["9876543"];
//       default:
//         return [];
//     }
//   }
// };


// // --- UI COMPONENTS ---

// type CardProps = {
//   title: string;
//   children: React.ReactNode;
// };

// const Card: React.FC<CardProps> = ({ title, children }) => (
//   <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg mb-6">
//     <h2 className="text-xl font-bold text-cyan-400 mb-4">{title}</h2>
//     {children}
//   </div>
// );

// type InputProps = {
//   label: string;
//   placeholder?: string;
//   value: string;
//   onChange: React.ChangeEventHandler<HTMLInputElement>;
//   type?: string;
// };

// const Input: React.FC<InputProps> = ({ label, placeholder, value, onChange, type = "text" }) => (
//   <div className="mb-4">
//     <label className="block text-slate-400 text-sm font-bold mb-2">{label}</label>
//     <input
//       type={type}
//       placeholder={placeholder}
//       value={value}
//       onChange={onChange}
//       className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
//     />
//   </div>
// );

// type ButtonProps = {
//   onClick: React.MouseEventHandler<HTMLButtonElement>;
//   children: React.ReactNode;
//   isLoading?: boolean;
//   disabled?: boolean;
// };

// const Button: React.FC<ButtonProps> = ({ onClick, children, isLoading, disabled }) => (
//   <button
//     onClick={onClick}
//     disabled={isLoading || disabled}
//     className={`w-full font-bold py-2 px-4 rounded-md transition-all duration-200 ${
//       (isLoading || disabled)
//         ? 'bg-slate-600 cursor-not-allowed'
//         : 'bg-cyan-600 hover:bg-cyan-500 text-white'
//     }`}
//   >
//     {isLoading ? 'Processing...' : children}
//   </button>
// );

// type HeaderProps = {
//     connect: () => void;
//     disconnect: () => void;
//     isConnected: boolean;
//     account: { address: string } | null;
// };

// const Header: React.FC<HeaderProps> = ({ connect, disconnect, isConnected, account }) => (
//     <div className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold text-white">Invoice Factoring dApp</h1>
//         <div>
//             {isConnected && account ? (
//                 <div className="flex items-center">
//                     <p className="text-slate-400 mr-4 text-sm font-mono">{`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}</p>
//                     <button onClick={disconnect} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md">
//                         Disconnect
//                     </button>
//                 </div>
//             ) : (
//                 <button onClick={connect} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md">
//                     Connect Wallet
//                 </button>
//             )}
//         </div>
//     </div>
// );


// // --- MAIN APP COMPONENT ---

// const Test: React.FC = () =>{
//     const { connect, disconnect, isConnected, account, signAndSubmitTransaction } = useSimulatedWallet();
//     const [loading, setLoading] = useState(false);
//     const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    
//     // State for forms
//     const [createForm, setCreateForm] = useState({ amount: '', dueDate: '', client: '', industry: '' });
//     const [listForm, setListForm] = useState({ id: '', price: '' });
//     const [buyForm, setBuyForm] = useState({ id: '', amount: '' });
//     const [settleForm, setSettleForm] = useState({ id: '', amount: '' });
//     const [defaultForm, setDefaultForm] = useState({ id: '' });
//     const [viewInvoiceId, setViewInvoiceId] = useState('');
    
//     // State for view data
//     const [invoiceData, setInvoiceData] = useState(null);
//     const [poolBalance, setPoolBalance] = useState('0');
//     const [collectedFees, setCollectedFees] = useState('0');

//     const handleTransaction = async (payload) => {
//         if (!isConnected) {
//             setStatusMessage({ type: 'error', text: 'Please connect your wallet first.' });
//             return;
//         }
//         setLoading(true);
//         setStatusMessage({ type: '', text: '' });
//         try {
//             const result = await signAndSubmitTransaction(payload);
//             if (result.success) {
//                 setStatusMessage({ type: 'success', text: `Transaction successful! Hash: ${result.hash.slice(0, 10)}...` });
//                 // Refresh view data after a successful transaction
//                 fetchViewData();
//             } else {
//                 setStatusMessage({ type: 'error', text: result.error || 'Transaction failed.' });
//             }
//         } catch (error) {
//             console.error(error);
//             setStatusMessage({ type: 'error', text: 'An error occurred during the transaction.' });
//         } finally {
//             setLoading(false);
//         }
//     };
    
//     const fetchViewData = async () => {
//         try {
//             const balance = await simulatedAptosClient.view({ function: `${MODULE_ADDRESS}::decentralized_invoicing::get_pool_balance`, arguments: [] });
//             setPoolBalance(balance[0] || '0');
//             const fees = await simulatedAptosClient.view({ function: `${MODULE_ADDRESS}::decentralized_invoicing::get_collected_fees`, arguments: [] });
//             setCollectedFees(fees[0] || '0');
//         } catch (e) {
//             console.error("Failed to fetch view data:", e);
//         }
//     };

//     const handleGetInvoice = async () => {
//         if (!viewInvoiceId) return;
//         setLoading(true);
//         try {
//             const data = await simulatedAptosClient.view({
//                 function: `${MODULE_ADDRESS}::decentralized_invoicing::get_invoice`,
//                 arguments: [viewInvoiceId]
//             });
//             setInvoiceData(data[0]);
//         } catch (e) {
//             console.error(e);
//             setInvoiceData(null);
//             setStatusMessage({ type: 'error', text: 'Failed to fetch invoice.' });
//         } finally {
//             setLoading(false);
//         }
//     }

//     useEffect(() => {
//         fetchViewData();
//     }, []);

//     const createSMEInvoice = () => {
//         const payload = {
//             function: `${MODULE_ADDRESS}::decentralized_invoicing::create_invoice`,
//             type_arguments: [],
//             arguments: [
//                 createForm.amount,
//                 String(Math.floor(new Date(createForm.dueDate).getTime() / 1000)),
//                 createForm.client,
//                 createForm.industry,
//             ],
//         };
//         handleTransaction(payload);
//     };

//     const listSMEInvoice = () => handleTransaction({
//         function: `${MODULE_ADDRESS}::decentralized_invoicing::list_invoice`,
//         type_arguments: [],
//         arguments: [listForm.id, listForm.price],
//     });

//     const buyInvestorInvoice = () => handleTransaction({
//         function: `${MODULE_ADDRESS}::decentralized_invoicing::buy_invoice`,
//         type_arguments: [],
//         arguments: [buyForm.id, buyForm.amount],
//     });

//     const settleClientInvoice = () => handleTransaction({
//         function: `${MODULE_ADDRESS}::decentralized_invoicing::settle_invoice`,
//         type_arguments: [],
//         arguments: [settleForm.id, settleForm.amount],
//     });

//     const defaultInvestorInvoice = () => handleTransaction({
//         function: `${MODULE_ADDRESS}::decentralized_invoicing::handle_default`,
//         type_arguments: [],
//         arguments: [defaultForm.id],
//     });
    
//     return (
//         <div className="bg-slate-900 text-white min-h-screen font-sans">
//             <Header connect={connect} disconnect={disconnect} isConnected={isConnected} account={account} />

//             <main className="container mx-auto p-4">
//                  {statusMessage.text && (
//                     <div className={`p-4 mb-6 rounded-md text-center font-bold ${
//                         statusMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
//                     }`}>
//                         {statusMessage.text}
//                     </div>
//                 )}
                
//                 <div className="grid md:grid-cols-2 gap-8">
//                     {/* Column 1: Actions */}
//                     <div>
//                         <Card title="SME Actions">
//                             <div className="border-b border-slate-700 pb-4 mb-4">
//                                 <h3 className="text-lg font-semibold mb-2 text-slate-300">Create Invoice</h3>
//                                 <Input label="Invoice Amount (in Octas)" placeholder="e.g., 100000000" value={createForm.amount} onChange={e => setCreateForm({...createForm, amount: e.target.value})} type="number" />
//                                 <Input label="Due Date" value={createForm.dueDate} onChange={e => setCreateForm({...createForm, dueDate: e.target.value})} type="date" />
//                                 <Input label="Client Name" placeholder="Client Corp" value={createForm.client} onChange={e => setCreateForm({...createForm, client: e.target.value})} />
//                                 <Input label="Industry" placeholder="Technology" value={createForm.industry} onChange={e => setCreateForm({...createForm, industry: e.target.value})} />
//                                 <Button onClick={createSMEInvoice} isLoading={loading}>Create Invoice</Button>
//                             </div>
//                             <div>
//                                 <h3 className="text-lg font-semibold mb-2 text-slate-300">List Invoice</h3>
//                                 <Input label="Invoice ID" placeholder="0" value={listForm.id} onChange={e => setListForm({...listForm, id: e.target.value})} type="number" />
//                                 <Input label="List Price (in Octas)" placeholder="e.g., 85000000" value={listForm.price} onChange={e => setListForm({...listForm, price: e.target.value})} type="number" />
//                                 <Button onClick={listSMEInvoice} isLoading={loading}>List for Sale</Button>
//                             </div>
//                         </Card>

//                         <Card title="Investor Actions">
//                             <div className="border-b border-slate-700 pb-4 mb-4">
//                                 <h3 className="text-lg font-semibold mb-2 text-slate-300">Buy Invoice</h3>
//                                 <Input label="Invoice ID" placeholder="0" value={buyForm.id} onChange={e => setBuyForm({...buyForm, id: e.target.value})} type="number" />
//                                 <Input label="Payment Amount (List Price)" placeholder="e.g., 85000000" value={buyForm.amount} onChange={e => setBuyForm({...buyForm, amount: e.target.value})} type="number" />
//                                 <Button onClick={buyInvestorInvoice} isLoading={loading}>Buy Invoice</Button>
//                             </div>
//                             <div>
//                                 <h3 className="text-lg font-semibold mb-2 text-slate-300">Handle Default</h3>
//                                 <Input label="Invoice ID" placeholder="0" value={defaultForm.id} onChange={e => setDefaultForm({...defaultForm, id: e.target.value})} type="number" />
//                                 <Button onClick={defaultInvestorInvoice} isLoading={loading}>Claim Default</Button>
//                             </div>
//                         </Card>
                        
//                         <Card title="Client Action">
//                             <h3 className="text-lg font-semibold mb-2 text-slate-300">Settle Invoice</h3>
//                             <Input label="Invoice ID" placeholder="0" value={settleForm.id} onChange={e => setSettleForm({...settleForm, id: e.target.value})} type="number" />
//                             <Input label="Full Invoice Amount" placeholder="e.g., 100000000" value={settleForm.amount} onChange={e => setSettleForm({...settleForm, amount: e.target.value})} type="number" />
//                             <Button onClick={settleClientInvoice} isLoading={loading}>Pay Invoice</Button>
//                         </Card>

//                     </div>
//                     {/* Column 2: Views */}
//                     <div>
//                          <Card title="Platform Status">
//                             <div className="flex justify-between mb-2">
//                                 <span className="text-slate-400">Pool Balance:</span>
//                                 <span className="font-mono text-cyan-400">{poolBalance} Octas</span>
//                             </div>
//                             <div className="flex justify-between">
//                                 <span className="text-slate-400">Collected Fees:</span>
//                                 <span className="font-mono text-cyan-400">{collectedFees} Octas</span>
//                             </div>
//                             <Button onClick={fetchViewData} isLoading={loading}>Refresh Status</Button>
//                         </Card>
                        
//                         <Card title="View Invoice">
//                            <Input label="Invoice ID" placeholder="Enter Invoice ID to view" value={viewInvoiceId} onChange={e => setViewInvoiceId(e.target.value)} type="number" />
//                            <Button onClick={handleGetInvoice} isLoading={loading}>Get Invoice Details</Button>
//                             {invoiceData && (
//                                 <div className="mt-4 bg-slate-900/50 p-4 rounded-md text-sm">
//                                     <h4 className="font-bold text-lg mb-2">Invoice #{invoiceData.invoice_id}</h4>
//                                     <p><strong className="text-slate-400">SME:</strong> <span className="font-mono">{invoiceData.sme_address}</span></p>
//                                     <p><strong className="text-slate-400">Investor:</strong> <span className="font-mono">{invoiceData.investor_address.vec[0] || 'N/A'}</span></p>
//                                     <p><strong className="text-slate-400">Amount:</strong> <span className="font-mono">{invoiceData.invoice_amount} Octas</span></p>
//                                     <p><strong className="text-slate-400">List Price:</strong> <span className="font-mono">{invoiceData.list_price} Octas</span></p>
//                                     <p><strong className="text-slate-400">Status:</strong> <span className="font-mono">{invoiceData.status}</span></p>
//                                 </div>
//                             )}
//                         </Card>
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
// }

// export default Test;
