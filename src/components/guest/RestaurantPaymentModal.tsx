import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertModal } from '@/components/ui/AlertModal';
import { CreditCard, Lock, Loader2 } from 'lucide-react';

interface RestaurantPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  orderType: string;
}

export function RestaurantPaymentModal({ open, onClose, onSuccess, amount, orderType }: RestaurantPaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, '').replace(/\D/g, '').slice(0, 16);
    return v.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) {
      return `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    return v;
  };

  const handlePayment = async () => {
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
    if (!cleanCardNumber || cleanCardNumber.length !== 16) {
      setAlertModal({ open: true, title: "Invalid Card", message: "Please enter a valid 16-digit card number.", type: "error" });
      return;
    }
    
    if (!cardExpiry || cardExpiry.length !== 5) {
      setAlertModal({ open: true, title: "Invalid Expiry", message: "Please enter valid expiry date (MM/YY).", type: "error" });
      return;
    }
    
    if (!cardCvv || cardCvv.length < 3) {
      setAlertModal({ open: true, title: "Invalid CVV", message: "Please enter a valid CVV.", type: "error" });
      return;
    }
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    
    setAlertModal({
      open: true,
      title: "Payment Successful!",
      message: `Your ${orderType} order has been paid. Total: R ${amount.toFixed(2)}`,
      type: "success"
    });
    
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  return (
    <>
      <AlertModal
        open={alertModal.open}
        onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              Secure Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Amount to Pay</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">R {amount.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">{orderType === 'dine_in' ? 'Dine In' : 'Takeaway'} Order</p>
            </div>
            
            <div className="space-y-2">
              <Label>Card Number</Label>
              <Input
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input
                  type="password"
                  placeholder="123"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  maxLength={3}
                />
              </div>
            </div>
            
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Pay R {amount.toFixed(2)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}