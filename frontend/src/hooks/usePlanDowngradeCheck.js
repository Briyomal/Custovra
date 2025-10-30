import { useState } from 'react';
import axios from 'axios';

export const usePlanDowngradeCheck = () => {
    const [needsDowngradeHandling, setNeedsDowngradeHandling] = useState(false);
    const [checking, setChecking] = useState(false);
    const [downgradeInfo, setDowngradeInfo] = useState(null);

    const checkDowngradeImpact = async () => {
        try {
            setChecking(true);
            
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/plan-downgrade/check-downgrade-impact`,
                { withCredentials: true }
            );

            const data = response.data.data;
            setDowngradeInfo(data);
            setNeedsDowngradeHandling(data.requiresAction);

            return data;

        } catch (error) {
            console.error('Error checking downgrade impact:', error);
            setNeedsDowngradeHandling(false);
            return null;
        } finally {
            setChecking(false);
        }
    };

    const resetDowngradeCheck = () => {
        setNeedsDowngradeHandling(false);
        setDowngradeInfo(null);
    };

    return {
        needsDowngradeHandling,
        checking,
        downgradeInfo,
        checkDowngradeImpact,
        resetDowngradeCheck
    };
};