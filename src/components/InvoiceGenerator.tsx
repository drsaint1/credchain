import { useState } from 'react';
import { FileText, Download, Send, Building } from 'lucide-react';

interface InvoiceData {
  contractId: string;
  contractTitle: string;
  clientAddress: string;
  freelancerAddress: string;
  amount: number;
  currency: string;
  milestones: Array<{ 
    title: string;
    amount: number;
    completedDate: string;
  }>;
}

interface InvoiceGeneratorProps {
  invoiceData: InvoiceData;
}

export const InvoiceGenerator = ({ invoiceData }: InvoiceGeneratorProps) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    address: '',
    taxId: '',
    email: '',
  });

  const invoiceNumber = `INV-${Date.now()}`;
  const invoiceDate = new Date().toLocaleDateString();
  const totalAmount = invoiceData.milestones.reduce((sum, m) => sum + m.amount, 0);

  const generatePDF = () => {
    
    alert('Invoice PDF generation will be implemented with jsPDF library');
  };

  const downloadCSV = () => {
    const csvContent = [
      ['Invoice Number', invoiceNumber],
      ['Date', invoiceDate],
      ['Contract', invoiceData.contractTitle],
      ['Client', invoiceData.clientAddress],
      ['Freelancer', invoiceData.freelancerAddress],
      [''],
      ['Milestone', 'Amount', 'Completed Date'],
      ...invoiceData.milestones.map(m => [m.title, m.amount, m.completedDate]),
      [''],
      ['Total', totalAmount, invoiceData.currency],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.csv`;
    a.click();
  };

  return (
    <>
      <button
        onClick={() => setShowGenerator(true)}
        className="btn-primary flex items-center space-x-2"
      >
        <FileText className="w-5 h-5" />
        <span>Generate Invoice</span>
      </button>

      {showGenerator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-slide-up">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">Invoice Generator</h3>
                <p className="text-gray-400">For tax and accounting purposes</p>
              </div>
              <button
                onClick={() => setShowGenerator(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            
            <div className="glass-card p-6 space-y-4">
              <h4 className="font-bold flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Your Business Information</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Business/Full Name</label>
                  <input
                    type="text"
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                    placeholder="John Doe LLC"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Business Address</label>
                  <input
                    type="text"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                    placeholder="123 Main St, City, Country"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Tax ID / VAT Number</label>
                  <input
                    type="text"
                    value={businessInfo.taxId}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, taxId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                    placeholder="123-45-6789"
                  />
                </div>
              </div>
            </div>

            
            <div className="bg-white text-gray-900 rounded-lg p-8 space-y-6">
              
              <div className="flex justify-between items-start border-b border-gray-300 pb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
                  <p className="text-gray-600 mt-2">#{invoiceNumber}</p>
                  <p className="text-gray-600">Date: {invoiceDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{businessInfo.name || 'Your Business Name'}</p>
                  <p className="text-sm text-gray-600">{businessInfo.address || 'Your Address'}</p>
                  <p className="text-sm text-gray-600">{businessInfo.email || 'your@email.com'}</p>
                  <p className="text-sm text-gray-600">Tax ID: {businessInfo.taxId || 'N/A'}</p>
                </div>
              </div>

              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Bill To:</p>
                  <p className="text-gray-900">Client</p>
                  <p className="text-sm text-gray-600 font-mono">
                    {invoiceData.clientAddress.slice(0, 8)}...{invoiceData.clientAddress.slice(-8)}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Contract:</p>
                  <p className="text-gray-900">{invoiceData.contractTitle}</p>
                  <p className="text-sm text-gray-600">ID: {invoiceData.contractId.slice(0, 16)}...</p>
                </div>
              </div>

              
              <div>
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="text-left p-3 text-gray-700">Description</th>
                      <th className="text-right p-3 text-gray-700">Date Completed</th>
                      <th className="text-right p-3 text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.milestones.map((milestone, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-3 text-gray-900">{milestone.title}</td>
                        <td className="text-right p-3 text-gray-600">{milestone.completedDate}</td>
                        <td className="text-right p-3 text-gray-900">
                          {milestone.amount} {invoiceData.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="p-3 text-right font-bold text-gray-900">
                        Total Amount:
                      </td>
                      <td className="text-right p-3 font-bold text-lg text-gray-900">
                        {totalAmount} {invoiceData.currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  🔗 Blockchain Verified
                </p>
                <p className="text-xs text-blue-800">
                  This invoice is backed by on-chain payment records on Solana blockchain.
                  All transactions are verifiable and tamper-proof.
                </p>
                <p className="text-xs text-blue-700 mt-2 font-mono">
                  Freelancer Wallet: {invoiceData.freelancerAddress}
                </p>
              </div>

              
              <div className="text-center text-sm text-gray-600 pt-6 border-t border-gray-300">
                <p>Thank you for your business!</p>
                <p className="mt-2">Generated via CredChain - Decentralized Freelance Platform</p>
              </div>
            </div>

            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={generatePDF}
                className="btn-primary flex items-center space-x-2 flex-1"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={downloadCSV}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => {
                  if (businessInfo.email) {
                    alert(`Invoice would be sent to: ${businessInfo.email}`);
                  } else {
                    alert('Please enter client email address');
                  }
                }}
                className="btn-secondary flex items-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Email Invoice</span>
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-200">
                <strong>Tax Notice:</strong> Consult with a tax professional regarding cryptocurrency
                income reporting in your jurisdiction. CredChain provides tools but not tax advice.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};