import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, Receipt, ShoppingCart, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { BrowserMultiFormatReader } from '@zxing/library';

export function POS() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal } = useStore();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/v1/products');
      return res.json();
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async (paymentMethod: string) => {
      const orderData = {
        products: cart.map(item => ({ product_id: item._id, name: item.name, quantity: item.quantity, price: item.price })),
        subtotal: cartTotal(),
        tax: cartTotal() * 0.1, // 10% tax
        grand_total: cartTotal() * 1.1,
        payment_method: paymentMethod,
        invoice_number: `INV-${Math.floor(Math.random() * 1000000)}`,
        date: new Date().toISOString()
      };
      
      const res = await fetch('/api/v1/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!res.ok) throw new Error('Checkout failed');
      return { ...orderData, _id: (await res.json())._id };
    },
    onSuccess: (data) => {
      toast.success('Payment successful!');
      setLastOrder(data);
      setShowReceipt(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      toast.error('Payment failed. Please try again.');
    }
  });

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const product = products?.find((p: any) => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      toast.error('Product not found');
    }
  };

  const toggleScanner = async () => {
    if (isScanning) {
      codeReader.current.reset();
      setIsScanning(false);
    } else {
      setIsScanning(true);
      try {
        const videoInputDevices = await codeReader.current.listVideoInputDevices();
        if (videoInputDevices.length > 0) {
          codeReader.current.decodeFromVideoDevice(
            null, 
            videoRef.current!, 
            (result, err) => {
              if (result) {
                const barcode = result.getText();
                const product = products?.find((p: any) => p.barcode === barcode);
                if (product) {
                  addToCart(product);
                  toast.success(`Added ${product.name}`);
                  // Add a small delay before next scan
                  setTimeout(() => {}, 1000);
                }
              }
            }
          );
        } else {
          toast.error('No camera found');
          setIsScanning(false);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to start camera');
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      codeReader.current.reset();
    };
  }, []);

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    if (windowPrint && printContent) {
      windowPrint.document.write(`
        <html>
          <head>
            <title>Print Receipt</title>
            <style>
              body { font-family: monospace; padding: 20px; width: 300px; margin: 0 auto; }
              .text-center { text-align: center; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .border-b { border-bottom: 1px dashed #000; }
              .border-t { border-top: 1px dashed #000; }
              .py-2 { padding-top: 8px; padding-bottom: 8px; }
              .my-4 { margin-top: 16px; margin-bottom: 16px; }
              .font-bold { font-weight: bold; }
              .text-sm { font-size: 14px; }
              .text-xs { font-size: 12px; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      windowPrint.document.close();
      windowPrint.focus();
      windowPrint.print();
      windowPrint.close();
    }
  };

  const tax = cartTotal() * 0.1;
  const grandTotal = cartTotal() + tax;

  return (
    <div className="flex h-full bg-gray-100">
      {/* Left Panel - Products & Scanner */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex gap-4 mb-6">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan or enter barcode..." 
              className="pl-10 h-12 text-lg"
              autoFocus
            />
          </form>
          <Button 
            onClick={toggleScanner}
            variant={isScanning ? "destructive" : "default"}
            className="h-12 px-6"
          >
            {isScanning ? 'Stop Camera' : 'Use Camera'}
          </Button>
        </div>

        {isScanning && (
          <div className="mb-6 rounded-lg overflow-hidden bg-black aspect-video relative max-w-md mx-auto w-full">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-green-500 opacity-50 m-8 rounded"></div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <h3 className="font-semibold mb-4 text-gray-700">Quick Add Products</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products?.map((product: any) => (
              <Card 
                key={product._id} 
                className="cursor-pointer hover:border-indigo-500 transition-colors"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4 flex flex-col h-full justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{product.barcode}</div>
                    <div className="font-medium line-clamp-2">{product.name}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-indigo-600">${product.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">Stock: {product.stock_quantity}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart & Checkout */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-lg">Current Order</h2>
          <Button variant="ghost" size="sm" onClick={clearCart} disabled={cart.length === 0}>
            Clear
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item._id} className="flex gap-3 items-start border-b border-gray-100 pb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                  <div className="text-indigo-600 font-semibold mt-1">${item.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => {
                      if (item.quantity > 1) updateQuantity(item._id, item.quantity - 1);
                      else removeFromCart(item._id);
                    }}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="font-bold w-16 text-right">
                  ${item.total.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${cartTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-indigo-600">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="h-14 text-lg bg-green-600 hover:bg-green-700"
              disabled={cart.length === 0 || checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate('cash')}
            >
              <Banknote className="w-5 h-5 mr-2" />
              Cash
            </Button>
            <Button 
              className="h-14 text-lg bg-blue-600 hover:bg-blue-700"
              disabled={cart.length === 0 || checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate('card')}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Card
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Complete</DialogTitle>
          </DialogHeader>
          
          {lastOrder && (
            <div id="receipt-content" className="bg-white p-6 font-mono text-sm border border-gray-200 rounded-md my-4">
              <div className="text-center mb-4">
                <h2 className="font-bold text-xl">ProScanner Retail</h2>
                <p className="text-xs text-gray-500">123 Commerce St, Tech City</p>
                <p className="text-xs text-gray-500">Tel: (555) 123-4567</p>
              </div>
              
              <div className="border-t border-b border-dashed border-gray-300 py-2 my-2 text-xs">
                <div className="flex justify-between">
                  <span>Date: {new Date(lastOrder.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Invoice: {lastOrder.invoice_number}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Payment: {lastOrder.payment_method.toUpperCase()}</span>
                </div>
              </div>
              
              <div className="my-4">
                <div className="flex justify-between font-bold border-b border-gray-200 pb-1 mb-2">
                  <span className="w-1/2">Item</span>
                  <span className="w-1/4 text-center">Qty</span>
                  <span className="w-1/4 text-right">Price</span>
                </div>
                
                {lastOrder.products.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between mb-1 text-xs">
                    <span className="w-1/2 truncate pr-2">{item.name}</span>
                    <span className="w-1/4 text-center">{item.quantity}</span>
                    <span className="w-1/4 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed border-gray-300 pt-2 mt-4 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Subtotal:</span>
                  <span>${lastOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Tax (10%):</span>
                  <span>${lastOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-gray-200">
                  <span>TOTAL:</span>
                  <span>${lastOrder.grand_total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="text-center mt-8 text-xs text-gray-500">
                <p>Thank you for your purchase!</p>
                <p>Please come again.</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setShowReceipt(false)}>
              Close
            </Button>
            <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
