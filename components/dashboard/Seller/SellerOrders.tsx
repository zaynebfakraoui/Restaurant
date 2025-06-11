"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Search,
  Filter,
  Clock,
  Check,
  X,
  ArrowRight,
  Calendar,
  CircleDollarSign,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Order } from "./OrdersTable";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Define the API order interface to match the backend model
interface ApiOrder {
  _id: string;
  client: {
    _id: string;
    name: string;
    email: string;
  };
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  items: {
    menuItem: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
    unitPrice: number;
    specialInstructions?: string;
  }[];
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "in-delivery"
    | "delivered"
    | "cancelled";
  totalAmount: number;
  deliveryFee?: number;
  tip?: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    specialInstructions?: string;
  };
  deliveryType?: "delivery" | "pickup" | "dine-in";
  scheduledFor?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  driver?: {
    _id: string;
    name: string;
    email: string;
  };
  refundInfo?: {
    amount: number;
    reason: string;
    date: string;
  };
  promoCodeApplied?: string;
  discountAmount?: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  quantity: number;
}

// Define the order statuses from the backend model
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "in-delivery"
  | "delivered"
  | "cancelled";

// Update the Order interface to use the correct status type
interface UpdatedOrder extends Omit<Order, "status"> {
  status: OrderStatus;
}

const statusColors = {
  pending: "bg-yellow-100 text-[#FFE66D] border-[#FFE66D]",
  confirmed: "bg-blue-100 text-[#00CFE8] border-[#00CFE8]",
  preparing: "bg-blue-100 text-[#00CFE8] border-[#00CFE8]",
  ready: "bg-blue-100 text-[#00CFE8] border-[#00CFE8]",
  "in-delivery": "bg-blue-100 text-[#00CFE8] border-[#00CFE8]",
  delivered: "bg-green-100 text-[#28C76F] border-[#28C76F]",
  cancelled: "bg-red-100 text-[#EA5455] border-[#EA5455]",
};

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  confirmed: <Check className="h-4 w-4" />,
  preparing: <ArrowRight className="h-4 w-4" />,
  ready: <Check className="h-4 w-4" />,
  "in-delivery": <ArrowRight className="h-4 w-4" />,
  delivered: <Check className="h-4 w-4" />,
  cancelled: <X className="h-4 w-4" />,
};

const SellerOrders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<UpdatedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/order");

      if (response.status === 401) {
        setError("Veuillez vous connecter pour voir vos commandes");
        return;
      }

      if (!response.ok) {
        throw new Error(`Error fetching orders: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform API orders to the format expected by the OrdersTable component
     const transformedOrders: UpdatedOrder[] = data.orders.map(
        (order: ApiOrder) => ({
          id: order._id,
          customer:
            order.client?.name || order.client?.email || "Unknown Customer",
          items: order.items
            .map(
              (item) =>
                '${item.menuItem?.name || "Unknown Item"} x${item.quantity},'
            )
            .join(", "),
          total: order.totalAmount,
          status: order.status,
          date: new Date(order.createdAt).toLocaleDateString(),
        }),
      );

      setOrders(transformedOrders);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération des commandes:", err);
      setError(err instanceof Error ? err.message : "Échec de la récupération des commandes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.includes(searchTerm) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const statusFilteredOrders =
    activeTab === "all"
      ? filteredOrders
      : filteredOrders.filter((order) => order.status === activeTab);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = statusFilteredOrders.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPagesCount = Math.ceil(statusFilteredOrders.length / itemsPerPage);

  useEffect(() => {
    setTotalPages(totalPagesCount);
    if (currentPage > totalPagesCount && totalPagesCount > 0) {
      setCurrentPage(totalPagesCount);
    }
  }, [statusFilteredOrders, currentPage, totalPagesCount]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/dashboard/ordres/${orderId}`);
  };

  const getStatusCount = (status: OrderStatus | "all") => {
    if (status === "all") return orders.length;
    return orders.filter((order) => order.status === status).length;
  };

  return (
    <div>
      <div className="animate-fade-in">
        {error === "Veuillez vous connecter pour voir vos commandes" ? (
          <Card>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div className="mb-4 p-4 rounded-full bg-yellow-100">
                <Lock className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Authentification requise
              </h3>
              <p className="text-gray-600 mb-4">
                Veuillez vous connecter pour voir vos commandes
              </p>
              <Button onClick={() => router.push("/auth/login")}>Log In</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-md
                  hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800 mb-1">
                        En attente
                      </p>
                      <h3 className="text-2xl font-bold text-yellow-900">
                        {getStatusCount("pending")}
                      </h3>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="text-green-600" size={14} />
                        <span className="text-xs font-medium text-green-600 ml-1">
                          {orders.length > 0
                            ? Math.round(
                                (getStatusCount("pending") / orders.length) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          du total
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-300 shadow-inner">
                      <Clock className="text-yellow-700" size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md
                  hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Traitement
                      </p>
                      <h3 className="text-2xl font-bold text-blue-900">
                        {getStatusCount("preparing") +
                          getStatusCount("ready") +
                          getStatusCount("in-delivery")}
                      </h3>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="text-green-600" size={14} />
                        <span className="text-xs font-medium text-green-600 ml-1">
                          {orders.length > 0
                            ? Math.round(
                                ((getStatusCount("preparing") +
                                  getStatusCount("ready") +
                                  getStatusCount("in-delivery")) /
                                  orders.length) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                         du total
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 shadow-inner">
                      <ArrowRight className="text-blue-700" size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md
                  hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 mb-1">
                        Livré
                      </p>
                      <h3 className="text-2xl font-bold text-green-900">
                        {getStatusCount("delivered")}
                      </h3>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="text-green-600" size={14} />
                        <span className="text-xs font-medium text-green-600 ml-1">
                          {orders.length > 0
                            ? Math.round(
                                (getStatusCount("delivered") / orders.length) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          du total
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-full bg-gradient-to-br from-green-200 to-green-300 shadow-inner">
                      <Check className="text-green-700" size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-md
                  hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Annulé
                      </p>
                      <h3 className="text-2xl font-bold text-red-900">
                        {getStatusCount("cancelled")}
                      </h3>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="text-red-600" size={14} />
                        <span className="text-xs font-medium text-red-600 ml-1">
                          {orders.length > 0
                            ? Math.round(
                                (getStatusCount("cancelled") / orders.length) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          du total
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-full bg-gradient-to-br from-red-200 to-red-300 shadow-inner">
                      <X className="text-red-700" size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-6">
              <Tabs
                defaultValue="all"
                className="w-full"
                onValueChange={(value) =>
                  setActiveTab(value as OrderStatus | "all")
                }
              >
                <div className="flex justify-between items-center mb-4">
                  <TabsList className="bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                     Toutes les commandes
                    </TabsTrigger>
                    <TabsTrigger
                      value="pending"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      En attente
                    </TabsTrigger>
                    <TabsTrigger
                      value="confirmed"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Confirmé
                    </TabsTrigger>
                    <TabsTrigger
                      value="preparing"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Préparation
                    </TabsTrigger>
                    <TabsTrigger
                      value="ready"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Prêt
                    </TabsTrigger>
                    <TabsTrigger
                      value="in-delivery"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      En livraison
                    </TabsTrigger>
                    <TabsTrigger
                      value="delivered"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Livré
                    </TabsTrigger>
                    <TabsTrigger
                      value="cancelled"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      Annulé
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <div className="relative mx-1 w-full">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <Input
                        placeholder="Rechercher des commandes..."
                        className="pl-10 w-96"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRefresh}
                      className={refreshing ? "animate-spin" : ""}
                    >
                      <RefreshCw size={18} />
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <Card>
                    <CardContent className="p-8 flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Chargement des commandes...</span>
                    </CardContent>
                  </Card>
                ) : error ? (
                  <Card>
                    <CardContent className="p-8 flex justify-center items-center text-red-500">
                      <X className="h-8 w-8 mr-2" />
                      <span>{error}</span>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <OrdersTabContent
                      value="all"
                      orders={currentOrders}
                      onViewOrder={handleViewOrder}
                    />
                    <OrdersTabContent
                      value="pending"
                      orders={currentOrders}
                      onViewOrder={handleViewOrder}
                    />
                    <OrdersTabContent
                      value="confirmed"
                      orders={currentOrders}
                      onViewOrder={handleViewOrder}
                    />
                    <OrdersTabContent
                      value="preparing"
                      orders={currentOrders}
                      onViewOrder={handleViewOrder}
                    />
                    <OrdersTabContent
                      value="ready"
                      orders={currentOrders}
                      onViewOrder={handleViewOrder}
                    />
                    <OrdersTabContent
                      value="in-delivery"
                      orders={currentOrders}
                      onViewOrder={handleViewOrder}
                    />
                    <OrdersTabContent
                      value="delivered"
                      orders={currentOrders}
                      onViewOrder={handleViewOrder}
                    />
                    <OrdersTabContent
                      value="cancelled"
                      orders={currentOrders}
                      onViewOrder={handleViewOrder}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-6">
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                          ).map((page) => (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="h-8 w-8"
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface OrdersTabContentProps {
  value: string;
  orders: UpdatedOrder[];
  onViewOrder?: (id: string) => void;
}

const OrdersTabContent: React.FC<OrdersTabContentProps> = ({
  value,
  orders,
  onViewOrder,
}) => {
  return (
    <TabsContent value={value} className="mt-0">
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold">Numéro de commande</TableHead>
<TableHead className="font-semibold">Client</TableHead>
<TableHead className="font-semibold">Articles</TableHead>
<TableHead className="font-semibold">Total</TableHead>
<TableHead className="font-semibold">Statut</TableHead>
<TableHead className="font-semibold">Date</TableHead>
<TableHead className="text-right font-semibold">
Actions
</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {order.items}
                    </TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusColors[order.status]} border flex items-center gap-1`}
                      >
                        {statusIcons[order.status]}
                        <span>
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewOrder && onViewOrder(order.id)}
                        className="hover:bg-gray-100"
                      >
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    Aucune commande trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default SellerOrders;
