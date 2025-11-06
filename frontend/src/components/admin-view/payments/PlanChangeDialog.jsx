import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

const PlanChangeDialog = ({ isOpen, onClose, subscription, onPlanChanged }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPlanId: "",
    billingPeriod: "monthly",
    startDate: new Date().toISOString().split('T')[0],
    duration: "1",
    selectedForms: [],
    notes: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      if (subscription) {
        setFormData({
          newPlanId: "",
          billingPeriod: subscription.billing_period || "monthly",
          startDate: new Date().toISOString().split('T')[0],
          duration: "1",
          selectedForms: subscription.forms_selected || [],
          notes: ""
        });
      }
    }
  }, [isOpen, subscription]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-plans`,
        { withCredentials: true }
      );
      setPlans(response.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to fetch plans");
    }
  };

  const handleSubmit = async () => {
    if (!formData.newPlanId) {
      toast.error("Please select a plan");
      return;
    }

    try {
      setLoading(true);
      
      // Determine if this is an upgrade or downgrade based on plan limits
      const currentPlan = subscription?.plan_id;
      const newPlan = plans.find(p => p._id === formData.newPlanId);
      
      let endpoint = "";
      let requestData = {
        newPlanId: formData.newPlanId,
        billingPeriod: formData.billingPeriod,
        startDate: formData.startDate,
        duration: parseInt(formData.duration),
        selectedForms: formData.selectedForms
      };

      // If downgrading and new plan has lower form limit, we need to handle form selection
      if (currentPlan && newPlan && newPlan.form_limit < currentPlan.form_limit) {
        endpoint = `${import.meta.env.VITE_SERVER_URL}/api/manual-subscriptions/${subscription._id}/downgrade`;
      } else {
        // For upgrades or same limit, we can use upgrade endpoint
        endpoint = `${import.meta.env.VITE_SERVER_URL}/api/manual-subscriptions/${subscription._id}/upgrade`;
        // Remove selectedForms for upgrades as it's not needed
        delete requestData.selectedForms;
      }

      const response = await axios.put(
        endpoint,
        requestData,
        { withCredentials: true }
      );

      if (response.data) {
        toast.success(response.data.message || "Plan changed successfully");
        onPlanChanged();
        onClose();
      }
    } catch (error) {
      console.error("Error changing plan:", error);
      const errorMessage = error.response?.data?.message || "Failed to change plan";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {subscription ? "Change User Plan" : "Assign Plan"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newPlanId" className="text-right">
              New Plan
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.newPlanId}
                onValueChange={(value) => setFormData({ ...formData, newPlanId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name} ({plan.form_limit} forms)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="billingPeriod" className="text-right">
              Billing
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.billingPeriod}
                onValueChange={(value) => setFormData({ ...formData, billingPeriod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <div className="col-span-3">
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Duration
            </Label>
            <div className="col-span-3">
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.billingPeriod === 'yearly' ? 'years' : 'months'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <div className="col-span-3">
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Admin notes about this plan change"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Processing..." : "Change Plan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanChangeDialog;