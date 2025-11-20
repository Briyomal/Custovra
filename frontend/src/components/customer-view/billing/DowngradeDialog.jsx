import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, FileText, Calendar, Lock, Unlock, XCircle } from "lucide-react";
import { formatDate } from "@/utils/billing";

const DowngradeDialog = ({ 
  isDowngradeDialogOpen, 
  setIsDowngradeDialogOpen, 
  downgradeInfo, 
  selectedFormIds, 
  handleFormToggle, 
  handleAutoSelect, 
  handleDowngradeSubmit, 
  handleUpgradeSubmit, 
  isSubmittingDowngrade, 
  downgradeError
}) => {
  return (
    <Dialog open={isDowngradeDialogOpen} onOpenChange={(open) => {
      setIsDowngradeDialogOpen(open);
      if (!open) {
        // Reset downgrade state would be handled in parent component
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            {downgradeInfo?.isUpgrade ? 'Plan Upgrade - Unlock Forms' : 'Plan Downgrade Confirmation'}
          </DialogTitle>
        </DialogHeader>
        
        {downgradeInfo && (
          <div className="space-y-6">
            <div className="bg-yellow-600/50 border border-amber-200 rounded-md p-4">
              <p className="text-yellow-200">
                {downgradeInfo?.isUpgrade 
                  ? `You have ${downgradeInfo.totalFormCount} form(s). Please select up to ${downgradeInfo.targetPlanLimit} form(s) to use with your new ${downgradeInfo.targetPlanName} plan.`
                  : `Your ${downgradeInfo.currentPlan} plan allows ${downgradeInfo.currentFormCount} active form(s), 
                  but the new ${downgradeInfo.targetPlan} plan only allows ${downgradeInfo.newPlanLimit} active form(s). 
                  Please select which ${downgradeInfo.newPlanLimit} form(s) will remain active and which ${downgradeInfo.excessFormCount} will be locked.`}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {downgradeInfo?.isUpgrade 
                  ? `Select forms to use (up to ${Math.min(downgradeInfo.targetPlanLimit, downgradeInfo.totalFormCount)} forms)`
                  : `Select ${downgradeInfo.newPlanLimit} form(s) to keep active`}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedFormIds.length} of {downgradeInfo?.isUpgrade ? Math.min(downgradeInfo.targetPlanLimit, downgradeInfo.totalFormCount) : downgradeInfo.newPlanLimit} selected
                </span>
                <Button 
                  className="rounded-md font-semibold border 
                  border-[#16bf4c] text-[#16bf4c] dark:text-white bg-transparent 
                  hover:!text-[#000000] hover:border-lime-500 hover:bg-lime-500
                  transition-all duration-200 ease-in-out 
                  hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
                  focus:outline-none focus:ring-1 focus:ring-lime-500"
                  variant="outline" 
                  size="sm"
                  onClick={handleAutoSelect}
                >
                  Auto-select
                </Button>
              </div>
            </div>
            
            <div className="grid gap-3 max-h-96 overflow-y-auto p-2">
              {(downgradeInfo?.isUpgrade ? downgradeInfo?.allForms : downgradeInfo?.activeForms)?.map((form) => {
                const isSelected = selectedFormIds.includes(form._id);
                return (
                  <Card 
                    key={form._id} 
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'ring-1 ring-lime-500 bg-blue-50 dark:bg-[#161616]' 
                        : 'hover:bg-slate-100 dark:hover:bg-[#161616]'
                    }`}
                    onClick={() => handleFormToggle(form._id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${
                              isSelected 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFormToggle(form._id);
                            }}
                          >
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-white" />
                            )}
                          </div>
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
                                  {formatDate(form.created_at || form.lockedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {downgradeInfo?.isUpgrade ? (
                            isSelected ? (
                              <div className="flex items-center gap-1 text-green-600 text-sm">
                                <Unlock className="h-4 w-4" />
                                <span>Will be unlocked</span>
                              </div>
                            ) : form.is_locked ? (
                              <div className="flex items-center gap-1 text-gray-600 text-sm">
                                <Lock className="h-4 w-4" />
                                <span>Currently locked</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-lime-600 text-sm">
                                <CheckCircle className="h-4 w-4" />
                                <span>Already unlocked</span>
                              </div>
                            )
                          ) : (
                            isSelected ? (
                              <div className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4" />
                                <span>Will remain active</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-600 text-sm">
                                <XCircle className="h-4 w-4" />
                                <span>Will be locked</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {downgradeError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm">{downgradeError}</p>
              </div>
            )}
            
            {/* Show message when user hasn't selected enough forms */}
            {(!downgradeInfo?.isUpgrade && selectedFormIds.length < (downgradeInfo?.newPlanLimit || 0)) && (
              <div className="bg-blue-50 dark:bg-[#161616] border border-orange-500 rounded-md p-3">
                <p className="text-orange-500 text-sm">
                  Please select {downgradeInfo?.newPlanLimit || 0} form(s) to continue. 
                  Currently selected: {selectedFormIds.length}
                </p>
              </div>
            )}
            
            {((downgradeInfo?.isUpgrade && selectedFormIds.length < Math.min(downgradeInfo.totalFormCount, downgradeInfo.targetPlanLimit || 0))) && (
              <div className="bg-blue-50 dark:bg-[#161616] border border-orange-500 rounded-md p-3">
                <p className="text-orange-500 text-sm">
                  Please select up to {Math.min(downgradeInfo.totalFormCount, downgradeInfo.targetPlanLimit || 0)} form(s) to unlock. 
                  Currently selected: {selectedFormIds.length}
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDowngradeDialogOpen(false)}
                disabled={isSubmittingDowngrade}
              >
                Cancel
              </Button>
              <Button 
              className="rounded-md font-semibold text-white border
                                                          border-lime-700
                                                            bg-gradient-to-r from-lime-700 to-green-800
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-green-600 hover:to-lime-600 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-500"
                onClick={downgradeInfo?.isUpgrade ? handleUpgradeSubmit : handleDowngradeSubmit}
                disabled={isSubmittingDowngrade || 
                  (downgradeInfo?.isUpgrade && selectedFormIds.length < Math.min(downgradeInfo.totalFormCount, downgradeInfo.targetPlanLimit)) ||
                  (!downgradeInfo?.isUpgrade && selectedFormIds.length < downgradeInfo.newPlanLimit)}
              >
                {isSubmittingDowngrade ? 'Saving...' : `Confirm and Continue to Payment`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DowngradeDialog;