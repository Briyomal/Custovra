import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { CheckCircle, Edit, Plus, Trash2, X } from "lucide-react";

const SubscriptionPlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_monthly: 0,
    discounts: {
      monthly: 0,
      half_yearly: 0,
      yearly: 0
    },
    form_limit: 0,
    submission_limit: 1000,
    features: {
      image_upload: false,
      employee_management: false,
      custom_features: []
    },
    is_active: true
  });

  // For adding new custom features
  const [newFeature, setNewFeature] = useState("");

  // Fetch all plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/manual-plans`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      } else {
        toast.error("Failed to fetch subscription plans");
      }
    } catch (err) { // eslint-disable-line no-unused-vars
      toast.error("Failed to fetch subscription plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "price_monthly" || name === "form_limit" || name === "submission_limit" 
        ? Number(value) 
        : value
    }));
  };

  // Handle discount changes
  const handleDiscountChange = (period, value) => {
    setFormData(prev => ({
      ...prev,
      discounts: {
        ...prev.discounts,
        [period]: Number(value)
      }
    }));
  };

  // Handle feature toggle changes
  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
  };

  // Add a new custom feature
  const addCustomFeature = () => {
    if (newFeature.trim() !== "") {
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          custom_features: [...prev.features.custom_features, newFeature.trim()]
        }
      }));
      setNewFeature("");
    }
  };

  // Remove a custom feature
  const removeCustomFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        custom_features: prev.features.custom_features.filter((_, i) => i !== index)
      }
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_monthly: 0,
      discounts: {
        monthly: 0,
        half_yearly: 0,
        yearly: 0
      },
      form_limit: 0,
      submission_limit: 1000,
      features: {
        image_upload: false,
        employee_management: false,
        custom_features: []
      },
      is_active: true
    });
    setNewFeature("");
    setCurrentPlan(null);
  };

  // Open dialog for creating a new plan
  const handleCreatePlan = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing a plan
  const handleEditPlan = (plan) => {
    // Create formData without final_prices to avoid sending stale data
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price_monthly: plan.price_monthly,
      discounts: plan.discounts || {
        monthly: 0,
        half_yearly: 0,
        yearly: 0
      },
      form_limit: plan.form_limit,
      submission_limit: plan.submission_limit,
      features: {
        image_upload: plan.features?.image_upload || false,
        employee_management: plan.features?.employee_management || false,
        custom_features: plan.features?.custom_features || []
      },
      is_active: plan.is_active
    });
    setNewFeature("");
    setCurrentPlan(plan);
    setIsDialogOpen(true);
  };

  // Save plan (create or update)
  const handleSavePlan = async (e) => {
    e.preventDefault();
    
    try {
      const url = currentPlan 
        ? `${import.meta.env.VITE_SERVER_URL}/api/manual-plans/${currentPlan._id}` 
        : `${import.meta.env.VITE_SERVER_URL}/api/manual-plans`;
      
      const method = currentPlan ? "PUT" : "POST";
      
      // Create a copy of formData without final_prices
      const formDataToSend = { ...formData };
      delete formDataToSend.final_prices;
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formDataToSend)
      });
      
      if (response.ok) {
        const savedPlan = await response.json();
        toast.success(currentPlan 
            ? "Subscription plan updated successfully" 
            : "Subscription plan created successfully");
        
        setIsDialogOpen(false);
        resetForm();
        
        // Update the plans list with the new/updated plan
        if (currentPlan) {
          // Update existing plan in the list
          setPlans(prevPlans => 
            prevPlans.map(plan => 
              plan._id === currentPlan._id ? savedPlan : plan
            )
          );
        } else {
          // Add new plan to the list
          setPlans(prevPlans => [...prevPlans, savedPlan]);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to save subscription plan");
      }
    } catch (err) { // eslint-disable-line no-unused-vars
      toast.error("Failed to save subscription plan");
    }
  };

  // Delete plan
  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this subscription plan?")) {
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/manual-plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        toast.success("Subscription plan deleted successfully");
        fetchPlans(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete subscription plan");
      }
    } catch (err) { // eslint-disable-line no-unused-vars
      toast.error("Failed to delete subscription plan");
    }
  };

  // Calculate prices
  const calculatePrices = () => {
    const monthly = formData.price_monthly;
    const halfYearly = monthly * 6;
    const yearly = monthly * 12;
    
    return {
      monthly,
      halfYearly,
      yearly,
      finalMonthly: monthly * (1 - (formData.discounts.monthly / 100)),
      finalHalfYearly: halfYearly * (1 - (formData.discounts.half_yearly / 100)),
      finalYearly: yearly * (1 - (formData.discounts.yearly / 100))
    };
  };

  const prices = calculatePrices();

  if (loading) {
    return <div>Loading subscription plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <p className="text-gray-500">
            Manage subscription plans for your customers
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleCreatePlan}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentPlan ? "Edit Subscription Plan" : "Create New Subscription Plan"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSavePlan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price_monthly">Monthly Price (Rs) *</Label>
                  <Input
                    id="price_monthly"
                    name="price_monthly"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_monthly}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="form_limit">Form Limit *</Label>
                  <Input
                    id="form_limit"
                    name="form_limit"
                    type="number"
                    min="0"
                    value={formData.form_limit}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="submission_limit">Submission Limit</Label>
                  <Input
                    id="submission_limit"
                    name="submission_limit"
                    type="number"
                    min="0"
                    value={formData.submission_limit}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Discounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_monthly">Monthly Discount (%)</Label>
                    <Input
                      id="discount_monthly"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discounts.monthly}
                      onChange={(e) => handleDiscountChange("monthly", e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Final Price: Rs {prices.finalMonthly.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount_half_yearly">Half-Yearly Discount (%)</Label>
                    <Input
                      id="discount_half_yearly"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discounts.half_yearly}
                      onChange={(e) => handleDiscountChange("half_yearly", e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Final Price: Rs {prices.finalHalfYearly.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount_yearly">Yearly Discount (%)</Label>
                    <Input
                      id="discount_yearly"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discounts.yearly}
                      onChange={(e) => handleDiscountChange("yearly", e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Final Price: Rs {prices.finalYearly.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="image_upload">Image Upload</Label>
                    <Switch
                      id="image_upload"
                      checked={formData.features.image_upload}
                      onCheckedChange={() => handleFeatureToggle("image_upload")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="employee_management">Employee Management</Label>
                    <Switch
                      id="employee_management"
                      checked={formData.features.employee_management}
                      onCheckedChange={() => handleFeatureToggle("employee_management")}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Custom Features</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Enter a feature name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomFeature();
                        }
                      }}
                    />
                    <Button type="button" onClick={addCustomFeature}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.features.custom_features && formData.features.custom_features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.features.custom_features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {feature}
                          <button 
                            type="button" 
                            onClick={() => removeCustomFeature(index)}
                            className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      is_active: checked
                    }))}
                  />
                  <Label htmlFor="is_active">Active Plan</Label>
                </div>
                
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {currentPlan ? "Update Plan" : "Create Plan"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No subscription plans found.</p>
            <Button onClick={handleCreatePlan} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan._id} className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Monthly:</span>
                    <span className="font-medium">
                      Rs {(plan.final_prices?.monthly || plan.price_monthly).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Half-Yearly:</span>
                    <span className="font-medium">
                      Rs {(plan.final_prices?.half_yearly || (plan.price_monthly * 6)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Yearly:</span>
                    <span className="font-medium">
                      Rs {(plan.final_prices?.yearly || plan.price_yearly).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Forms:</span>
                    <span className="font-medium">{plan.form_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Feedback:</span>
                    <span className="font-medium">{plan.submission_limit}/month</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className={plan.features?.image_upload ? "" : "opacity-50 line-through"}>
                      {plan.features?.image_upload ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <X className="mr-1 h-3 w-3" />
                      )}
                      Image Upload
                    </Badge>
                    <Badge variant="secondary" className={plan.features?.employee_management ? "" : "opacity-50 line-through"}>
                      {plan.features?.employee_management ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <X className="mr-1 h-3 w-3" />
                      )}
                      Employee Mgmt
                    </Badge>
                    {plan.features?.custom_features && plan.features.custom_features.map((feature, index) => (
                      <Badge key={index} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePlan(plan._id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlansManagement;