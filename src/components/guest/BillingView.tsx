import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/services/firebase-services';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { DigitalReceipt } from '@/components/DigitalReceipt';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ReceiptText, ChevronLeft, CreditCard } from 'lucide-react';
import type { User as AppUser } from '@/types';

// Define the Receipt structure to satisfy TypeScript
interface Receipt {
  id: string;
  guestId: string;
  totalAmount: number;
  items: Array<{ name: string; price: number; quantity?: number }>;
  createdAt?: { seconds: number; nanoseconds: number };
  status: string;
  type: string;
}

interface BillingViewProps {
  onBack: () => void;
}

// Auth Bridge to handle Firebase uid vs AppUser id
type AuthUserBridge = AppUser & { uid?: string };

export function BillingView({ onBack }: BillingViewProps) {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = user as AuthUserBridge;
  const currentUserId = currentUser?.id || currentUser?.uid;

  useEffect(() => {
    const fetchReceipts = async () => {
      if (!currentUserId) return;
      
      try {
        const q = query(
          collection(db, "receipts"), 
          where("guestId", "==", currentUserId)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Receipt[];

        // Sort manually by timestamp (descending)
        setReceipts(data.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        }));
      } catch (error) {
        console.error("Error fetching receipts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, [currentUserId]);

  const totalBill = receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f] mb-4" />
        <p className="text-gray-500 italic">Retrieving your room account...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* BACK BUTTON (Fixed the 'onBack' unused error) */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBack}
        className="text-gray-500 hover:text-[#1e3a5f]"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Return to Overview
      </Button>

      {/* TOTAL BALANCE HEADER */}
      <Card className="bg-gradient-to-br from-[#1e3a5f] to-[#2c5282] text-white border-none shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-1">Current Room Balance</p>
              <h2 className="text-5xl font-bold font-mono">R {totalBill.toLocaleString()}</h2>
              <div className="flex items-center gap-2 mt-4">
                <Badge className="bg-[#c9a227] hover:bg-[#c9a227] text-white border-none">
                  Add-to-Bill Enabled
                </Badge>
                <span className="text-white/60 text-sm italic">Verification active</span>
              </div>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <CreditCard className="h-10 w-10 text-[#c9a227]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TRANSACTION LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-[#1e3a5f] flex items-center gap-2">
            <ReceiptText className="h-5 w-5" /> Transaction History
          </h3>
          <span className="text-xs text-gray-400 font-medium">{receipts.length} slips recorded</span>
        </div>

        {receipts.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
            <CardContent className="p-12 text-center">
              <ReceiptText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 italic">No charges have been posted to your room yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8">
            {receipts.map((receipt) => (
              <DigitalReceipt key={receipt.id} data={receipt} />
            ))}
          </div>
        )}
      </div>

      <div className="pt-12 pb-20 text-center">
        <p className="text-[10px] text-gray-400 italic max-w-sm mx-auto leading-relaxed">
          Final settlement is required upon check-out. Digital slips are for informational purposes. 
          Standard resort service fees applied where applicable.
        </p>
      </div>
    </div>
  );
}