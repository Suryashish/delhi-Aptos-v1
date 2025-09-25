import React from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Navbar } from "./Navbar";

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

interface InvestmentCardProps {
  invoice: Invoice;
  account?: { address: { toString: () => string } } | null;
  onListInvoice?: (invoiceId: string) => void;
  onBuyInvoice?: (invoice: Invoice) => void;
  onSettleInvoice?: (invoice: Invoice) => void;
  onHandleDefault?: (invoiceId: string) => void;
  loading?: boolean;
}

export const InvestmentCard = ({ 
  invoice, 
  account,
  onListInvoice,
  onBuyInvoice,
  onSettleInvoice,
  onHandleDefault,
  loading = false
}: InvestmentCardProps) => {
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calculate profit/loss indicator
  const getProfitColor = () => {
    if (invoice.status === 3) return "text-green-600"; // Settled - profit
    if (invoice.status === 4) return "text-red-600"; // Defaulted - loss
    return "text-yellow-600"; // Pending
  };
  
  return (
    <div className="rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-white border-2 border-gray-100 hover:border-yellow-300">
      {/* Custom Yellow Navbar for Investment Cards */}
      <Navbar 
        title={`Invoice #${invoice.invoice_id}`} 
        variant="investment"
        className="rounded-t-lg"
      >
        <Badge variant={STATUS_VARIANT_MAP[invoice.status]} className="shadow-md">
          {STATUS_MAP[invoice.status]}
        </Badge>
      </Navbar>
      
      <div className="p-6">
        {/* Investment Overview */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 mb-4 border border-yellow-200">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            Your Investment
          </h4>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Amount Invested</p>
              <p className={`font-bold text-lg ${getProfitColor()}`}>
                {(Number(invoice.list_price) / 100000000).toFixed(2)} APT
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Expected Return</p>
              <p className="font-bold text-lg text-green-600">
                {(Number(invoice.invoice_amount) / 100000000).toFixed(2)} APT
              </p>
            </div>
          </div>
        </div>
      
        {/* Invoice Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Client</p>
            <p className="font-semibold text-gray-800 mt-1">{invoice.client_name}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Industry</p>
            <p className="font-semibold text-gray-800 mt-1">{invoice.industry}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</p>
            <p className="font-semibold text-gray-800 mt-1">
              {new Date(Number(invoice.due_date_secs) * 1000).toLocaleDateString()}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">SME</p>
            <p className="font-semibold text-gray-800 mt-1">{formatAddress(invoice.sme_address)}</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Investment Progress</span>
            <span>{Math.min((invoice.status / 4) * 100, 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((invoice.status / 4) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* SME can list a 'Created' invoice */}
          {invoice.status === 0 && invoice.sme_address === account?.address.toString() && (
            <Button 
              onClick={() => onListInvoice && onListInvoice(invoice.invoice_id)}
              loading={loading}
              size="sm"
            >
              List Invoice
            </Button>
          )}
          
          {/* Any user (except the SME) can buy a 'Listed' invoice */}
          {invoice.status === 1 && invoice.sme_address !== account?.address.toString() && (
            <Button 
              onClick={() => onBuyInvoice && onBuyInvoice(invoice)}
              loading={loading}
              size="sm"
            >
              Buy Invoice
            </Button>
          )}
          
          {/* Anyone can settle a 'Sold' invoice */}
          {invoice.status === 2 && (
            <Button 
              onClick={() => onSettleInvoice && onSettleInvoice(invoice)}
              loading={loading}
              size="sm"
            >
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
                loading={loading}
                size="sm"
              >
                Handle Default
              </Button>
          )}

          {/* View Details Button */}
          {/* <Button 
            variant="secondary" 
            size="sm"
            className="ml-auto"
          >
            View Details
          </Button> */}
        </div>

        {/* Profit/Loss Indicator */}
        {invoice.status >= 3 && (
          <div className={`mt-4 p-3 rounded-lg text-center ${
            invoice.status === 3 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`font-semibold ${
              invoice.status === 3 ? 'text-green-800' : 'text-red-800'
            }`}>
              {invoice.status === 3 
                ? `✅ Profit: +${((Number(invoice.invoice_amount) - Number(invoice.list_price)) / 100000000).toFixed(2)} APT`
                : `❌ Loss: -${(Number(invoice.list_price) / 100000000).toFixed(2)} APT`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentCard;