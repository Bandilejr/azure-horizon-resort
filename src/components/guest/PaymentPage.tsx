import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, CreditCard, CheckCircle, Download, Printer } from 'lucide-react';

interface PaymentPageProps {
  bookingDetails: {
    roomName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    roomRate: number;
    nights: number;
    subtotal: number;
    tax: number;
    total: number;
    depositAmount: number;
    balanceDue: number;
  };
  onPaymentComplete: (confirmationNumber: string, depositPaid: number) => void;
  onCancel: () => void;
}

export function PaymentPage({ bookingDetails, onPaymentComplete, onCancel }: PaymentPageProps) {
  const [step, setStep] = useState<'disclaimer' | 'payment' | 'processing' | 'confirmation'>('disclaimer');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardType, setCardType] = useState<string | null>(null);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const detectCardType = (cardNumber: string): string | null => {
    const patterns: { [key: string]: RegExp } = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
    };
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return type;
      }
    }
    return null;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, '').replace(/\D/g, '').slice(0, 16);
    const formatted = v.replace(/(\d{4})/g, '$1 ').trim();
    setCardType(detectCardType(v));
    return formatted;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) {
      const month = v.slice(0, 2);
      const year = v.slice(2);
      const monthNum = parseInt(month);
      if (monthNum > 12) return `12/${year}`;
      if (monthNum === 0) return `01/${year}`;
      return `${month}/${year}`;
    }
    return v;
  };

  const validateCard = () => {
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
    if (!cleanCardNumber || cleanCardNumber.length !== 16) {
      setErrorMessage("Please enter a valid 16-digit card number.");
      return false;
    }
    
    // Luhn algorithm
    let sum = 0;
    let alternate = false;
    for (let i = cleanCardNumber.length - 1; i >= 0; i--) {
      let n = parseInt(cleanCardNumber.charAt(i), 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n = (n % 10) + 1;
      }
      sum += n;
      alternate = !alternate;
    }
    if (sum % 10 !== 0) {
      setErrorMessage("Invalid card number.");
      return false;
    }
    
    const detectedType = detectCardType(cleanCardNumber);
    if (!detectedType) {
      setErrorMessage("We accept Visa, Mastercard, and American Express.");
      return false;
    }
    
    if (!cardExpiry || cardExpiry.length !== 5) {
      setErrorMessage("Please enter a valid expiry date (MM/YY).");
      return false;
    }
    
    const [expMonth, expYear] = cardExpiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    const expYearNum = parseInt(expYear);
    const expMonthNum = parseInt(expMonth);
    
    if (expMonthNum < 1 || expMonthNum > 12) {
      setErrorMessage("Please enter a valid month (01-12).");
      return false;
    }
    
    if (expYearNum < currentYear || (expYearNum === currentYear && expMonthNum < currentMonth)) {
      setErrorMessage("Your card has expired.");
      return false;
    }
    
    const isAmex = detectedType === 'amex';
    if (isAmex && cardCvv.length !== 4) {
      setErrorMessage("American Express requires a 4-digit CVV.");
      return false;
    }
    if (!isAmex && cardCvv.length !== 3) {
      setErrorMessage("Please enter a valid 3-digit CVV.");
      return false;
    }
    
    setErrorMessage(null);
    return true;
  };

  const handleProcessPayment = async () => {
    if (!validateCard()) return;
    
    setStep('processing');
    setErrorMessage(null);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isSuccess = Math.random() < 0.95;
    
    if (!isSuccess) {
      setErrorMessage("Payment declined. Please try a different card.");
      setStep('payment');
      return;
    }
    
    const newConfirmation = `BK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    setConfirmationNumber(newConfirmation);
    setStep('confirmation');
  };

  const downloadReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt - ${confirmationNumber}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 40px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
              .hotel-name { font-size: 24px; font-weight: bold; color: #1e3a5f; }
              .receipt-title { font-size: 18px; margin-top: 10px; }
              .details { margin-bottom: 30px; }
              .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              .items-table th { background-color: #f2f2f2; }
              .totals { text-align: right; margin-top: 20px; }
              .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="hotel-name">Azure Horizon Resort</div>
              <div class="receipt-title">DEPOSIT PAYMENT RECEIPT</div>
            </div>
            <div class="details">
              <p><strong>Confirmation:</strong> ${confirmationNumber}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Room:</strong> ${bookingDetails.roomName}</p>
              <p><strong>Stay:</strong> ${bookingDetails.checkIn} to ${bookingDetails.checkOut}</p>
              <p><strong>Guests:</strong> ${bookingDetails.guests}</p>
            </div>
            <table class="items-table">
              <thead><tr><th>Description</th><th>Amount</th></tr></thead>
              <tbody>
                <tr><td>Room Charges (${bookingDetails.nights} nights)</td><td>R ${bookingDetails.subtotal}</td></tr>
                <tr><td>Taxes & Fees (15%)</td><td>R ${bookingDetails.tax}</td></tr>
                <tr style="border-top:2px solid #000;"><td><strong>Total</strong></td><td><strong>R ${bookingDetails.total}</strong></td></tr>
                <tr><td><strong>Deposit Paid (15%)</strong></td><td><strong style="color:green;">R ${bookingDetails.depositAmount}</strong></td></tr>
                <tr><td>Balance Due at Check-in</td><td>R ${bookingDetails.balanceDue}</td></tr>
              </tbody>
            </table>
            <div class="footer">
              <p>Thank you for choosing Azure Horizon Resort!</p>
              <p>Balance of R ${bookingDetails.balanceDue} is due upon arrival.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.print();
      printWindow.close();
    }
  };

  const handleComplete = () => {
    onPaymentComplete(confirmationNumber, bookingDetails.depositAmount);
  };

  if (step === 'disclaimer') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <AlertCircle className="h-6 w-6" />
              Deposit & Cancellation Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm font-semibold text-amber-800 mb-2">Important Information</p>
              <ul className="text-sm text-amber-700 space-y-2 list-disc list-inside">
                <li>A non-refundable deposit of <strong>15%</strong> is required to confirm your booking.</li>
                <li>The remaining <strong>85%</strong> is due upon check-in.</li>
                <li>Cancellations made more than 48 hours before check-in receive a 50% deposit refund.</li>
                <li>Cancellations within 48 hours of check-in forfeit the full deposit.</li>
                <li>No-shows will be charged the full reservation amount.</li>
                <li>Early check-out may incur additional fees.</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Room Total:</span>
                <span className="font-semibold">R {bookingDetails.total}</span>
              </div>
              <div className="flex justify-between mb-2 text-amber-600">
                <span>Deposit Due Now:</span>
                <span className="font-bold">R {bookingDetails.depositAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance at Check-in:</span>
                <span>R {bookingDetails.balanceDue}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Cancel Booking
              </Button>
              <Button className="flex-1 bg-[#c9a227] hover:bg-[#b8941f]" onClick={() => setStep('payment')}>
                I Agree & Continue to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Lock className="h-5 w-5 text-green-600" />
              Secure Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {errorMessage}
              </div>
            )}
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Deposit Amount:</span>
                <span className="font-bold text-amber-600">R {bookingDetails.depositAmount}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Card Number</Label>
              <div className="relative">
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
                {cardType && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 uppercase">
                    {cardType}
                  </div>
                )}
              </div>
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
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep('disclaimer')}>
                Back
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleProcessPayment}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay R {bookingDetails.depositAmount}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#c9a227] mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-[#1e3a5f]">Processing Payment...</h2>
        <p className="text-gray-500 mt-2">Please do not close this window</p>
      </div>
    );
  }

  if (step === 'confirmation') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-serif text-[#1e3a5f]">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-800">Your deposit of <strong>R {bookingDetails.depositAmount}</strong> has been received.</p>
              <p className="text-xs text-green-600 mt-1">Confirmation: {confirmationNumber}</p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <p className="text-xs font-bold uppercase">Booking Summary</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Room:</span>
                  <span className="font-semibold">{bookingDetails.roomName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Stay:</span>
                  <span>{bookingDetails.checkIn} → {bookingDetails.checkOut}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Guests:</span>
                  <span>{bookingDetails.guests}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Room Cost:</span>
                    <span>R {bookingDetails.total}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Deposit Paid:</span>
                    <span>- R {bookingDetails.depositAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2">
                    <span>Balance Due at Check-in:</span>
                    <span>R {bookingDetails.balanceDue}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={downloadReceipt}>
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button className="flex-1 bg-[#1e3a5f]" onClick={handleComplete}>
                Complete Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}