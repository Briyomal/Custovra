/**
 * Extracts feature flags from Polar product benefits array
 *
 * Benefits structure from Polar:
 * {
 *   "id": "be9b0da0-2fd8-43c0-8301-e17a42e00620",
 *   "type": "custom",
 *   "description": "Image Upload"
 * }
 *
 * @param {Array} benefits - Array of benefit objects from Polar
 * @returns {Object} - Feature flags { image_upload: boolean, employee_management: boolean }
 */
export const extractFeaturesFromBenefits = (benefits = []) => {
    const features = {
        image_upload: false,
        employee_management: false
    };

    if (!Array.isArray(benefits) || benefits.length === 0) {
        return features;
    }

    for (const benefit of benefits) {
        if (!benefit.description) continue;

        const desc = benefit.description.toLowerCase();

        if (desc.includes('image upload')) {
            features.image_upload = true;
        }
        if (desc.includes('employee management')) {
            features.employee_management = true;
        }
    }

    return features;
};
