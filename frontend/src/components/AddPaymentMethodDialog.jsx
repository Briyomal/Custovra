import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, CreditCard, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddPaymentMethodDialog = ({ onPaymentMethodAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddPaymentMethod = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Create setup intent for adding payment method
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/billing/setup-intent`,
        {},
        { withCredentials: true }
      );

      // In a real implementation, you would use Stripe Elements here
      // For now, we'll redirect to Stripe portal for adding payment methods
      const portalResponse = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/billing/create-customer-portal-session`,
        {},
        { withCredentials: true }
      );
      
      // Open Stripe portal in new tab
      window.open(portalResponse.data.url, '_blank');
      
      toast.success('Redirecting to Stripe to add payment method');
      setIsOpen(false);
      
      // Refresh the parent component after a delay
      setTimeout(() => {
        if (onPaymentMethodAdded) {
          onPaymentMethodAdded();
        }
      }, 2000);
      
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError('Failed to add payment method. Please try again.');
      toast.error('Failed to add payment method');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          Add Payment Method
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment Method
          </DialogTitle>
          <DialogDescription>
            Add a new payment method to your account for seamless billing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <CreditCard className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="font-medium">Secure Payment Method Setup</p>
                  <p className="text-sm text-gray-500">
                    You&apos;ll be redirected to Stripe&apos;s secure portal to add your payment method.
                  </p>
                </div>
                <Button 
                  onClick={handleAddPaymentMethod}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Setting up...' : 'Continue to Stripe'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-xs text-gray-500 text-center">
            Your payment information is secured by Stripe&apos;s industry-leading encryption.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentMethodDialog;