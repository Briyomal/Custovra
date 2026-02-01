import { useState, useEffect } from "react";
import AdminLayoutPage from "./LayoutPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { Loader } from "lucide-react";

const PaymentsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/polar/products`);
        setProducts(response.data.data || []);
      } catch (error) {
        console.error("Error fetching Polar products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <AdminLayoutPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Polar Product Management</h1>
          <p className="text-gray-500">
            View available products from Polar dashboard. Manage products and pricing directly on Polar.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin h-10 w-10 text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <Badge variant={product.is_archived ? "secondary" : "default"}>
                      {product.is_archived ? "Archived" : "Active"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {product.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Prices:</p>
                    {product.prices?.map((price) => (
                      <div key={price.id} className="flex justify-between items-center text-sm border-b pb-1 last:border-0">
                        <span>
                          {price.amount_type === "fixed" 
                            ? `${(price.price_amount / 100).toFixed(2)} ${price.price_currency.toUpperCase()}`
                            : "Dynamic"}
                          {price.type === "recurring" && ` / ${price.recurring_interval}`}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {price.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-400">
                No Polar products found. Check your Polar organization settings.
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayoutPage>
  );
};

export default PaymentsPage;