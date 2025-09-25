import React from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";

// Define type for the Invoice
type Invoice = {
  invoice_id: string;
  sme_address: string;
  investor_address: { vec: string[] };
  client_name: string;
  industry: string;
  invoice_amount: string;
  list_price: string;
  due_date_secs: string;
  status: number;
};

// Status map for invoice statuses
const STATUS_MAP: { [key: number]: string } = {
  0: "Created",
  1: "Listed",
  2: "Sold",
  3: "Settled",
  4: "Defaulted",
};

// Badge variant mapping based on status
const STATUS_VARIANT_MAP: { [key: number]: "default" | "info" | "success" | "warning" | "error" } = {
  0: "default",
  1: "info",
  2: "warning",
  3: "success",
  4: "error",
};

interface InvoiceCardProps {
  invoice: Invoice;
  account?: { address: { toString: () => string } } | null;
  onListInvoice?: (invoiceId: string) => void;
  onBuyInvoice?: (invoice: Invoice) => void;
  onSettleInvoice?: (invoice: Invoice) => void;
  onHandleDefault?: (invoiceId: string) => void;
}

export const InvoiceCard = ({ 
  invoice, 
  account,
  onListInvoice,
  onBuyInvoice,
  onSettleInvoice,
  onHandleDefault
}: InvoiceCardProps) => {
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  return (
    <Card 
      variant="raised" 
      className="mb-4 hover:border-yellow-300 transition-all duration-300 shadow-lg hover:shadow-xl"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-8 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-full"></div>
          <h3 className="text-lg font-bold text-gray-800">Invoice #{invoice.invoice_id}</h3>
        </div>
        <Badge variant={STATUS_VARIANT_MAP[invoice.status]} className="shadow-sm">
          {STATUS_MAP[invoice.status]}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 shadow-inner">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</p>
          <p className="font-bold text-lg text-gray-800 mt-1">
            {(Number(invoice.invoice_amount) / 100000000).toFixed(2)} APT
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 shadow-inner">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</p>
          <p className="font-semibold text-gray-800 mt-1">
            {new Date(Number(invoice.due_date_secs) * 1000).toLocaleDateString()}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 shadow-inner">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">SME</p>
          <p className="font-semibold text-gray-800 mt-1">{formatAddress(invoice.sme_address)}</p>
        </div>
        
        {invoice.status >= 1 && (
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 shadow-inner border border-yellow-200">
            <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">List Price</p>
            <p className="font-bold text-lg text-yellow-800 mt-1">
              {(Number(invoice.list_price) / 100000000).toFixed(2)} APT
            </p>
          </div>
        )}
      </div>
      
      {/* Client & Industry Info */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Client</p>
          <p className="font-semibold text-blue-800 mt-1">{invoice.client_name}</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Industry</p>
          <p className="font-semibold text-purple-800 mt-1">{invoice.industry}</p>
        </div>
      </div>
      
      {invoice.investor_address.vec.length > 0 && (
        <div className="mb-5 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-inner">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Investor</p>
          </div>
          <p className="font-bold text-green-800">{formatAddress(invoice.investor_address.vec[0])}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-6">
        {/* SME can list a 'Created' invoice */}
        {invoice.status === 0 && invoice.sme_address === account?.address.toString() && (
          <Button onClick={() => onListInvoice && onListInvoice(invoice.invoice_id)}>
            List Invoice
          </Button>
        )}
        
        {/* Any user (except the SME) can buy a 'Listed' invoice */}
        {invoice.status === 1 && invoice.sme_address !== account?.address.toString() && (
          <Button onClick={() => onBuyInvoice && onBuyInvoice(invoice)}>
            Buy Invoice
          </Button>
        )}
        
        {/* Anyone can settle a 'Sold' invoice (e.g., the client) */}
        {invoice.status === 2 && (
          <Button onClick={() => onSettleInvoice && onSettleInvoice(invoice)}>
            Settle Invoice
          </Button>
        )}
        
        {/* The investor can handle default on a 'Sold' invoice after the due date */}
        {invoice.status === 2 && 
          invoice.investor_address.vec[0] === account?.address.toString() && 
          new Date().getTime() > Number(invoice.due_date_secs) * 1000 && (
            <Button 
              variant="danger" 
              onClick={() => onHandleDefault && onHandleDefault(invoice.invoice_id)}
            >
              Handle Default
            </Button>
        )}
      </div>
    </Card>
  );
};

export default InvoiceCard;