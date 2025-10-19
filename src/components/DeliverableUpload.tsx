import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Upload, File, Check, X, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { usePrograms } from '../hooks/usePrograms';
import { getContractPDA } from '../utils/pdaHelpers';

interface Deliverable {
  id: string;
  name: string;
  size: number;
  ipfsHash: string;
  uploadedAt: string;
}

interface DeliverableUploadProps {
  contractId: string;
  milestoneIndex: number;
  onUploadComplete?: () => void;
}

export const DeliverableUpload = ({ contractId, milestoneIndex, onUploadComplete }: DeliverableUploadProps) => {
  const { publicKey } = useWallet();
  const { credchainProgram } = usePrograms();

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Deliverable[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';
  const PINATA_GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';
  const PINATA_API_URL = import.meta.env.VITE_PINATA_API_URL || 'https://api.pinata.cloud';

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    if (!PINATA_JWT) {
      console.warn('PINATA_JWT not configured - simulating upload');
      return `QmSimulated${Date.now()}-${file.name}`;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const pinataMetadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          contractId: contractId,
          milestoneIndex: milestoneIndex.toString(),
          uploadedBy: publicKey?.toBase58() || 'unknown',
        },
      });
      formData.append('pinataMetadata', pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 1,
      });
      formData.append('pinataOptions', pinataOptions);

      const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.IpfsHash;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const maxSize = 100 * 1024 * 1024; 
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed 100MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setUploading(true);

    try {
      const newDeliverables: Deliverable[] = [];

      for (const file of files) {
        console.log(`Uploading ${file.name} to IPFS...`);
        const ipfsHash = await uploadToIPFS(file);

        newDeliverables.push({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          ipfsHash,
          uploadedAt: new Date().toLocaleString(),
        });

        console.log(`✓ ${file.name} uploaded: ${ipfsHash}`);
      }

      setUploadedFiles([...newDeliverables, ...uploadedFiles]);
      alert(`${files.length} file(s) uploaded to IPFS successfully!`);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const submitDeliverable = async () => {
    if (!publicKey || !credchainProgram) {
      alert('Please connect your wallet');
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    const description = prompt('Add a description for this deliverable:');
    if (!description) {
      alert('Description is required');
      return;
    }

    setSubmitting(true);

    try {
      const [contractPDA] = getContractPDA(contractId);

      const ipfsHashList = uploadedFiles
        .map(f => f.ipfsHash)
        .join(',')
        .slice(0, 500);

      console.log('Submitting deliverable to blockchain...');
      const tx = await credchainProgram.methods
        .submitDeliverable(contractId, milestoneIndex, ipfsHashList, description)
        .accounts({
          contract: contractPDA,
          freelancer: publicKey,
        })
        .rpc();

      console.log('Deliverable submitted!', tx);
      alert(`✅ Deliverable submitted successfully!\n\nTransaction: ${tx}\n\nFiles: ${uploadedFiles.length}\nIPFS Hashes recorded on-chain`);

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(`Failed to submit deliverable: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-xl font-bold flex items-center space-x-2">
        <Upload className="w-6 h-6 text-primary-400" />
        <span>Deliverables</span>
      </h3>

      {!PINATA_JWT && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-400 mb-1">IPFS Configuration Required</p>
            <p className="text-gray-300">
              Add your Pinata JWT to <code className="bg-black/30 px-1 rounded">.env</code> file as{' '}
              <code className="bg-black/30 px-1 rounded">VITE_PINATA_JWT</code> for real IPFS uploads.
              Currently running in demo mode with simulated hashes.
            </p>
          </div>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-white/20 bg-white/5'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-400 animate-spin" />
            <p className="text-lg font-semibold mb-2">Uploading to IPFS...</p>
            <p className="text-sm text-gray-400">This may take a moment</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-semibold mb-2">Drop files here or click to upload</p>
            <p className="text-sm text-gray-400 mb-4">
              Files will be stored on IPFS for permanent, decentralized access
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              disabled={uploading || !publicKey}
            />
            <label
              htmlFor="file-upload"
              className={`btn-primary inline-block ${!publicKey ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {publicKey ? 'Select Files' : 'Connect Wallet'}
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Supported: Images, PDFs, Documents, Code files, Archives (Max 100MB each)
            </p>
          </>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Uploaded Files ({uploadedFiles.length})</h4>
            <button
              onClick={submitDeliverable}
              className="btn-primary flex items-center space-x-2"
              disabled={submitting || uploadedFiles.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Deliverable</span>
                </>
              )}
            </button>
          </div>

          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-primary-500/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <File className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs text-gray-400 flex items-center space-x-2">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.uploadedAt}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    IPFS: {file.ipfsHash.slice(0, 30)}...
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={PINATA_JWT ? `${PINATA_GATEWAY_URL}/ipfs/${file.ipfsHash}` : `https://ipfs.io/ipfs/${file.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary-500/20 hover:bg-primary-500/30 rounded-lg transition-colors"
                  title="View on IPFS"
                >
                  <ExternalLink className="w-5 h-5 text-primary-400" />
                </a>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <X className="w-5 h-5 text-red-400" />
                </button>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
        <h5 className="font-semibold mb-2 flex items-center space-x-2">
          <span>🔒</span>
          <span>Decentralized Storage</span>
        </h5>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Files stored permanently on IPFS via Pinata</li>
          <li>• Content-addressed (hash-based verification)</li>
          <li>• Accessible globally, censorship-resistant</li>
          <li>• IPFS hashes recorded on Solana blockchain</li>
          <li>• Verifiable proof of deliverable submission</li>
        </ul>
      </div>
    </div>
  );
};
