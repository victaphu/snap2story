'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Package, Download, Eye, Truck, Clock, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

// Mock data for now - replace with real data from Supabase
const mockOrders = [
  {
    id: 'ORD-001',
    story_title: 'Emma\'s Magical Adventure',
    product_type: 'hardcover',
    status: 'shipped',
    total_amount: 5000, // in cents
    created_at: '2024-01-15T10:00:00Z',
    shipping_address: '123 Main St, Anytown, USA 12345',
    tracking_number: 'TRK123456789',
    estimated_delivery: '2024-01-20',
  },
  {
    id: 'ORD-002',
    story_title: 'Family Beach Day',
    product_type: 'pdf',
    status: 'paid',
    total_amount: 500,
    created_at: '2024-01-14T15:30:00Z',
    download_url: '/downloads/story-2.pdf',
  },
  {
    id: 'ORD-003',
    story_title: 'Birthday Surprise',
    product_type: 'softcover',
    status: 'in_production',
    total_amount: 2500,
    created_at: '2024-01-13T09:15:00Z',
    shipping_address: '456 Oak Ave, Somewhere, USA 67890',
    estimated_ship_date: '2024-01-18',
  },
];

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
  },
  paid: {
    label: 'Paid',
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  in_production: {
    label: 'In Production',
    icon: Package,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
};

const productTypeLabels = {
  pdf: 'PDF Download',
  softcover: 'Softcover Book',
  hardcover: 'Hardcover Book',
};

export function OrdersContent() {
  const { user } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with real Supabase query
        // const { data } = await DatabaseService.getUserOrders(userId);
        setTimeout(() => {
          setOrders(mockOrders);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to load orders:', error);
        setOrders([]);
        setIsLoading(false);
      }
    };

    if (user) {
      loadOrders();
    }
  }, [user]);

  const handleDownload = (order: any) => {
    if (order.download_url) {
      // TODO: Generate secure download link
      window.open(order.download_url, '_blank');
      toast.success('Download started');
    } else {
      toast.error('Download not available');
    }
  };

  const handleTrackOrder = (order: any) => {
    if (order.tracking_number) {
      // TODO: Integrate with shipping provider
      window.open(`https://tracking.example.com/${order.tracking_number}`, '_blank');
    } else {
      toast.info('Tracking information not yet available');
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground">
          Track your purchases and download your completed books
        </p>
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8 text-muted-foreground" />}
          title="No orders yet"
          description="Your purchase history will appear here once you buy your first book"
          action={{
            label: 'Browse Stories',
            onClick: () => window.location.href = '/library'
          }}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{order.story_title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.id} • {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusInfo.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Product:</span>
                          <span className="ml-2 font-medium">
                            {productTypeLabels[order.product_type as keyof typeof productTypeLabels]}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <span className="ml-2 font-medium">
                            {formatPrice(order.total_amount)}
                          </span>
                        </div>
                        
                        {order.shipping_address && (
                          <div className="md:col-span-2">
                            <span className="text-muted-foreground">Shipping to:</span>
                            <span className="ml-2">{order.shipping_address}</span>
                          </div>
                        )}
                        
                        {order.tracking_number && (
                          <div>
                            <span className="text-muted-foreground">Tracking:</span>
                            <button 
                              onClick={() => handleTrackOrder(order)}
                              className="ml-2 text-primary hover:underline"
                            >
                              {order.tracking_number}
                            </button>
                          </div>
                        )}
                        
                        {order.estimated_delivery && (
                          <div>
                            <span className="text-muted-foreground">Est. Delivery:</span>
                            <span className="ml-2">{formatDate(order.estimated_delivery)}</span>
                          </div>
                        )}
                        
                        {order.estimated_ship_date && (
                          <div>
                            <span className="text-muted-foreground">Est. Ship Date:</span>
                            <span className="ml-2">{formatDate(order.estimated_ship_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {order.product_type === 'pdf' && order.status === 'paid' && (
                        <Button onClick={() => handleDownload(order)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      
                      {order.tracking_number && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleTrackOrder(order)}
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Track
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/book/${order.story_id || '1'}/viewer`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Story
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            // TODO: Generate invoice
                            toast.info('Invoice generation not implemented yet');
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            View Invoice
                          </DropdownMenuItem>
                          {order.product_type !== 'pdf' && (
                            <DropdownMenuItem onClick={() => {
                              // TODO: Navigate to reorder flow
                              toast.info('Reorder functionality coming soon');
                            }}>
                              <Package className="h-4 w-4 mr-2" />
                              Reorder
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Help section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help with Your Order?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <h3 className="font-medium">Order Issues</h3>
              <p className="text-sm text-muted-foreground">
                Problems with your order or need to make changes?
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help">Contact Support</Link>
              </Button>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Shipping Info</h3>
              <p className="text-sm text-muted-foreground">
                Learn about shipping times and tracking
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help#shipping">Shipping Guide</Link>
              </Button>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Returns</h3>
              <p className="text-sm text-muted-foreground">
                Need to return or exchange a book?
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help#returns">Return Policy</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}