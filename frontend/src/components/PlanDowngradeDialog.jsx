import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lock, CheckCircle, Calendar, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PlanDowngradeDialog = ({ isOpen, onClose, onComplete, initialDowngradeData = null }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [downgradeInfo, setDowngradeInfo] = useState(null);
    const [selectedFormIds, setSelectedFormIds] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialDowngradeData) {
                // Use provided initial data
                console.log('Using initial downgrade data:', initialDowngradeData);
                setDowngradeInfo(initialDowngradeData);
                setLoading(false);
                
                if (!initialDowngradeData.requiresAction) {
                    toast.success(initialDowngradeData.message);
                    onComplete?.();
                    onClose();
                    return;
                }
                
                // Pre-select the appropriate forms based on whether action is required
                if (initialDowngradeData.requiresAction) {
                    // For downgrades requiring action, pre-select up to the limit
                    const preSelectedIds = initialDowngradeData.activeForms
                        .slice(0, initialDowngradeData.newPlanLimit)
                        .map(form => form._id);
                    setSelectedFormIds(preSelectedIds);
                } else {
                    // For confirmation-only downgrades, pre-select all forms (they all fit)
                    const allFormIds = initialDowngradeData.activeForms.map(form => form._id);
                    setSelectedFormIds(allFormIds);
                }
            } else {
                // Fetch from API
                fetchDowngradeInfo();
            }
        }
    }, [isOpen, initialDowngradeData]);

    const fetchDowngradeInfo = async () => {
        console.warn('fetchDowngradeInfo called - this should not happen in modal-first approach');
        setError('Invalid dialog state - please try again from the billing page');
        setLoading(false);
    };

    const handleFormToggle = (formId) => {
        setSelectedFormIds(prev => {
            const isSelected = prev.includes(formId);
            
            if (isSelected) {
                // Remove form
                return prev.filter(id => id !== formId);
            } else {
                // Add form (check limit)
                if (prev.length >= downgradeInfo.newPlanLimit) {
                    toast.error(`You can only select ${downgradeInfo.newPlanLimit} form(s) for your ${downgradeInfo.currentPlan} plan`);
                    return prev;
                }
                return [...prev, formId];
            }
        });
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            setError('');

            // Only validate form selection if action is required
            if (downgradeInfo.requiresAction) {
                if (selectedFormIds.length === 0) {
                    setError('Please select at least one form to keep active');
                    return;
                }

                if (selectedFormIds.length > downgradeInfo.newPlanLimit) {
                    setError(`You can only select ${downgradeInfo.newPlanLimit} form(s)`);
                    return;
                }
            }

            // For the modal-first flow, directly call subscription update
            if (downgradeInfo.subscriptionInfo) {
                console.log('🔄 Completing subscription update', downgradeInfo.requiresAction ? 'with selected forms' : 'with confirmation');
                
                const updateData = {
                    priceId: downgradeInfo.subscriptionInfo.priceId,
                    planName: downgradeInfo.subscriptionInfo.planName,
                    formsPreSelected: true // Flag to prevent webhook auto-handling
                };
                
                // Only include selectedFormIds if action is required
                if (downgradeInfo.requiresAction) {
                    updateData.selectedFormIds = selectedFormIds;
                }
                
                // Complete the subscription update
                await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/subscriptions/update-plan`,
                    updateData,
                    { withCredentials: true }
                );
                
                toast.success(`Successfully switched to ${downgradeInfo.targetPlan} plan!`);
            } else {
                // Fallback for legacy flow (should not be used in new implementation)
                console.warn('Legacy dialog flow - this should not be used in modal-first approach');
                toast.error('Invalid dialog data - please try again from the billing page');
                return;
            }

            onComplete?.();
            onClose();

        } catch (err) {
            console.error('Error handling form selection:', err);
            setError(err.response?.data?.error || 'Failed to update subscription and forms');
        } finally {
            setSaving(false);
        }
    };

    const handleAutoSelect = () => {
        // Auto-select the most recent forms up to the limit
        const preSelectedIds = downgradeInfo.activeForms
            .slice(0, downgradeInfo.newPlanLimit)
            .map(form => form._id);
        setSelectedFormIds(preSelectedIds);
        toast.info(`Auto-selected ${preSelectedIds.length} most recent forms`);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid Date';
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Plan Change Confirmation
                    </DialogTitle>
                    <DialogDescription>
                        {downgradeInfo?.targetPlan && downgradeInfo?.currentPlan ? (
                            <span>
                                {downgradeInfo.requiresAction ? (
                                    <>Switching from <strong>{downgradeInfo.currentPlan}</strong> to <strong>{downgradeInfo.targetPlan}</strong> requires form selection.
                                    Please choose which forms to keep active.</>
                                ) : (
                                    <>Confirm downgrade from <strong>{downgradeInfo.currentPlan}</strong> to <strong>{downgradeInfo.targetPlan}</strong>.
                                    All your forms will remain active as they fit within the new plan limits.</>
                                )}
                            </span>
                        ) : (
                            "Please confirm your subscription plan change."
                        )}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Checking plan downgrade impact...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {downgradeInfo && (
                            <>
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        {downgradeInfo.message}
                                    </AlertDescription>
                                </Alert>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Current Plan</p>
                                                <p className="text-lg font-semibold capitalize">{downgradeInfo.currentPlan || downgradeInfo.previousPlanName}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="text-center">
                                                <p className="text-sm text-blue-600">New Plan</p>
                                                <p className="text-lg font-semibold capitalize text-blue-600">{downgradeInfo.targetPlan || downgradeInfo.planName}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">New Form Limit</p>
                                                <p className="text-lg font-semibold">{downgradeInfo.newPlanLimit}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Forms to Lock</p>
                                                <p className="text-lg font-semibold text-red-600">{downgradeInfo.excessFormCount}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="space-y-4">
                                    {downgradeInfo.activeForms && downgradeInfo.activeForms.length > 0 ? (
                                        downgradeInfo.requiresAction ? (
                                            // Show form selection when action is required
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold">
                                                        Select {downgradeInfo.newPlanLimit} form(s) to keep active
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600">
                                                            {selectedFormIds.length} of {downgradeInfo.newPlanLimit} selected
                                                        </span>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={handleAutoSelect}
                                                        >
                                                            Auto-select Recent
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid gap-3">
                                                    {downgradeInfo.activeForms.map((form) => {
                                                        const isSelected = selectedFormIds.includes(form._id);
                                                        return (
                                                            <Card 
                                                                key={form._id} 
                                                                className={`cursor-pointer transition-colors ${
                                                                    isSelected 
                                                                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                                                                        : 'hover:bg-gray-50'
                                                                }`}
                                                                onClick={() => handleFormToggle(form._id)}
                                                            >
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <Checkbox 
                                                                                checked={isSelected}
                                                                                onChange={() => handleFormToggle(form._id)}
                                                                            />
                                                                            <div className="flex items-center gap-2">
                                                                                <FileText className="h-4 w-4 text-gray-500" />
                                                                                <div>
                                                                                    <p className="font-medium">{form.form_name}</p>
                                                                                    {form.form_note && (
                                                                                        <p className="text-sm text-gray-600 mt-1">{form.form_note}</p>
                                                                                    )}
                                                                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                                                        <Badge variant="outline" className="text-xs">
                                                                                            {form.form_type}
                                                                                        </Badge>
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Calendar className="h-3 w-3" />
                                                                                            {formatDate(form.created_at)}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-sm text-gray-600">
                                                                                {form.submissionCount || 0} submissions
                                                                            </p>
                                                                            {isSelected && (
                                                                                <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                                                                                    <CheckCircle className="h-3 w-3" />
                                                                                    <span>Will remain active</span>
                                                                                </div>
                                                                            )}
                                                                            {!isSelected && (
                                                                                <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                                                                                    <Lock className="h-3 w-3" />
                                                                                    <span>Will be locked</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            // Show read-only form list when no action is required
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold">
                                                        Your forms (all will remain active)
                                                    </h3>
                                                    <span className="text-sm text-green-600">
                                                        ✓ All {downgradeInfo.activeForms.length} form(s) fit within the {downgradeInfo.targetPlan} plan limit
                                                    </span>
                                                </div>

                                                <div className="grid gap-3">
                                                    {downgradeInfo.activeForms.map((form) => (
                                                        <Card key={form._id} className="bg-green-50 border-green-200">
                                                            <CardContent className="p-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                                        <div className="flex items-center gap-2">
                                                                            <FileText className="h-4 w-4 text-gray-500" />
                                                                            <div>
                                                                                <p className="font-medium">{form.form_name}</p>
                                                                                {form.form_note && (
                                                                                    <p className="text-sm text-gray-600 mt-1">{form.form_note}</p>
                                                                                )}
                                                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        {form.form_type}
                                                                                    </Badge>
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Calendar className="h-3 w-3" />
                                                                                        {formatDate(form.created_at)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm text-gray-600">
                                                                            {form.submissionCount || 0} submissions
                                                                        </p>
                                                                        <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                                                                            <CheckCircle className="h-3 w-3" />
                                                                            <span>Will remain active</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </>
                                        )
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">No forms found. You can create forms after confirming the plan change.</p>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                            </>
                        )}
                    </div>
                )}

                {!loading && downgradeInfo && (
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={saving || (downgradeInfo.requiresAction && selectedFormIds.length === 0)}
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Updating Plan...</span>
                                </div>
                            ) : (
                                downgradeInfo.requiresAction ? (
                                    downgradeInfo?.targetPlan ? 
                                        `Switch to ${downgradeInfo.targetPlan} (${selectedFormIds.length} forms)` :
                                        `Confirm Selection (${selectedFormIds.length})`
                                ) : (
                                    `Confirm Downgrade to ${downgradeInfo.targetPlan}`
                                )
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PlanDowngradeDialog;