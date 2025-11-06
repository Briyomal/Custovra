import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ManualPlansTable = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_monthly: "",
    price_yearly: "",
    form_limit: "",
    submission_limit: "",
    features: [""],
    is_active: true
  });

  useEffect(() => {
    fetchManualPlans();
  }, []);

  const fetchManualPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-plans`,
        { withCredentials: true }
      );
      setPlans(response.data);
    } catch (error) {
      console.error("Error fetching manual plans:", error);
      toast.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const planData = {
        ...formData,
        price_monthly: parseFloat(formData.price_monthly),
        price_yearly: parseFloat(formData.price_yearly),
        form_limit: parseInt(formData.form_limit),
        submission_limit: parseInt(formData.submission_limit),
        features: formData.features.filter(f => f.trim() !== "")
      };

      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-plans`,
        planData,
        { withCredentials: true }
      );
      
      toast.success("Plan created successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchManualPlans();
    } catch (error) {
      console.error("Error creating plan:", error);
      toast.error("Failed to create plan");
    }
  };

  const handleUpdatePlan = async () => {
    try {
      const planData = {
        ...formData,
        price_monthly: parseFloat(formData.price_monthly),
        price_yearly: parseFloat(formData.price_yearly),
        form_limit: parseInt(formData.form_limit),
        submission_limit: parseInt(formData.submission_limit),
        features: formData.features.filter(f => f.trim() !== "")
      };

      await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-plans/${editingPlan._id}`,
        planData,
        { withCredentials: true }
      );
      
      toast.success("Plan updated successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchManualPlans();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update plan");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-plans/${planId}`,
        { withCredentials: true }
      );
      
      toast.success("Plan deleted successfully");
      fetchManualPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  const handleTogglePlanStatus = async (planId, currentStatus) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-plans/${planId}`,
        { is_active: !currentStatus },
        { withCredentials: true }
      );
      
      toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchManualPlans();
    } catch (error) {
      console.error("Error toggling plan status:", error);
      toast.error("Failed to update plan status");
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      price_monthly: "",
      price_yearly: "",
      form_limit: "",
      features: [""],
      is_active: true
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || "",
      description: plan.description || "",
      price_monthly: plan.price_monthly || "",
      price_yearly: plan.price_yearly || "",
      form_limit: plan.form_limit || "",
      submission_limit: plan.submission_limit || "",
      features: plan.features || [""],
      is_active: plan.is_active
    });
    setIsDialogOpen(true);
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeature = (index) => {
    const newFeatures = [...formData.features];
    newFeatures.splice(index, 1);
    setFormData({ ...formData, features: newFeatures });
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
    ) : (
      <Badge className="bg-red-500 hover:bg-red-600">Inactive</Badge>
    );
  };

  const formatCurrency = (amount) => {
    return `Rs ${new Intl.NumberFormat('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Subscription Plans</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Edit Plan" : "Create New Plan"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Plan Name
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Basic, Standard, Premium"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <div className="col-span-3">
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Plan description"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price_monthly" className="text-right">
                    Monthly Price
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="price_monthly"
                      type="number"
                      value={formData.price_monthly}
                      onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price_yearly" className="text-right">
                    Yearly Price
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="price_yearly"
                      type="number"
                      value={formData.price_yearly}
                      onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="form_limit" className="text-right">
                    Form Limit
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="form_limit"
                      type="number"
                      value={formData.form_limit}
                      onChange={(e) => setFormData({ ...formData, form_limit: e.target.value })}
                      placeholder="Number of forms allowed"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="submission_limit" className="text-right">
                    Monthly Submission Limit
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="submission_limit"
                      type="number"
                      value={formData.submission_limit}
                      onChange={(e) => setFormData({ ...formData, submission_limit: e.target.value })}
                      placeholder="Number of submissions allowed per month"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Features
                  </Label>
                  <div className="col-span-3 space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          placeholder={`Feature ${index + 1}`}
                        />
                        {formData.features.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFeature(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addFeature}>
                      Add Feature
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}>
                    {editingPlan ? "Update Plan" : "Create Plan"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Monthly Price</TableHead>
              <TableHead>Yearly Price</TableHead>
              <TableHead>Form Limit</TableHead>
              <TableHead>Submission Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan._id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.description}</TableCell>
                <TableCell>{formatCurrency(plan.price_monthly)}</TableCell>
                <TableCell>{formatCurrency(plan.price_yearly)}</TableCell>
                <TableCell>{plan.form_limit} forms</TableCell>
                <TableCell>{plan.submission_limit} submissions/month</TableCell>
                <TableCell>{getStatusBadge(plan.is_active)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePlanStatus(plan._id, plan.is_active)}
                    >
                      {plan.is_active ? (
                        <ToggleLeft className="h-4 w-4" />
                      ) : (
                        <ToggleRight className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePlan(plan._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ManualPlansTable;