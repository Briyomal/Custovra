# Custovra API Reference - Billing & Subscriptions

## Updated Endpoints (Post-Migration)

### Subscription Management

#### Get Subscription Details

```
GET /api/polar/subscriptions
```

**Authentication:** Required  
**Returns:** Current user's active subscription details including plan limits, form count, and submission count

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "plan": {
      "name": "basic",
      "displayName": "Basic Plan",
      "formLimit": 5,
      "submissionLimit": 100,
      "description": "...",
      "features": [...]
    },
    "subscription": {
      "status": "active",
      "subscription_start": "2026-01-01T00:00:00.000Z",
      "subscription_end": "2026-02-01T00:00:00.000Z",
      "interval": "monthly",
      "plan_name": "Basic",
      "amount": 999,
      "billing_period": "monthly",
      "auto_renew": false
    },
    "formCount": 3,
    "submissionCount": 45
  }
}
```

---

### Payment Management

#### Get Payment History

```
GET /api/polar/payment-history
```

**Authentication:** Required  
**Returns:** List of all payments made by the user via Polar

**Response Structure:**

```json
{
  "success": true,
  "data": [
    {
      "id": "payment_id",
      "source": "polar",
      "amount": 999,
      "currency": "usd",
      "status": "succeeded",
      "date": "2026-01-01T00:00:00.000Z",
      "plan": "Basic",
      "description": "Basic (monthly)",
      "payment_method": "Card"
    }
  ]
}
```

---

### Manual Billing

#### Get Available Plans

```
GET /api/manual-billing/available-plans
```

**Authentication:** Required  
**Returns:** List of all active manual subscription plans

**Response Structure:**

```json
{
  "success": true,
  "data": [
    {
      "id": "plan_id",
      "name": "Basic",
      "description": "Perfect for small businesses",
      "price_monthly": 999,
      "price_half_yearly": 5394,
      "price_yearly": 9588,
      "discounts": {
        "half_yearly": 10,
        "yearly": 20
      },
      "final_prices": {
        "monthly": 999,
        "half_yearly": 5394,
        "yearly": 9588
      },
      "form_limit": 5,
      "submission_limit": 100,
      "features": [...],
      "is_active": true
    }
  ]
}
```

#### Submit Payment Request

```
POST /api/manual-billing/payment-request
```

**Authentication:** Required  
**Content-Type:** multipart/form-data

**Request Body:**

```json
{
  "planId": "plan_id",
  "billingPeriod": "monthly", // "monthly" | "half_yearly" | "yearly"
  "formSelection": "{\"selectedFormIds\":[...],\"isUpgrade\":false,\"targetPlanId\":\"...\"}" // Optional
}
```

**Response Structure:**

```json
{
  "success": true,
  "message": "Payment request processed successfully",
  "data": {
    "paymentUrl": "https://checkout.polar.sh/...", // If Polar checkout
    "amount": 999,
    "planName": "Basic",
    "billingPeriod": "monthly"
  }
}
```

---

### Plan Downgrade/Upgrade

#### Check Downgrade Impact

```
GET /api/plan-downgrade/check-downgrade-impact?targetPlanId=<plan_id>
```

**Authentication:** Required  
**Returns:** Information about forms that need to be selected if downgrading

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "requiresAction": true,
    "currentPlanLimit": 10,
    "newPlanLimit": 5,
    "activeFormCount": 8,
    "activeForms": [
      {
        "_id": "form_id",
        "title": "Form Title",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "is_locked": false
      }
    ],
    "message": "You need to select 5 forms to keep active"
  }
}
```

#### Get All Forms for Upgrade

```
GET /api/plan-downgrade/all-forms-for-upgrade
```

**Authentication:** Required  
**Returns:** All user forms (locked and unlocked) for upgrade selection

---

## Database Models

### Subscription Model

**Collection:** `subscriptions`

**Key Fields:**

- `user_id`: Reference to User
- `external_provider`: "polar" | "genie"
- `plan_name`: String (e.g., "Basic", "Pro")
- `billing_period`: "monthly" | "half_yearly" | "yearly"
- `amount`: Number (in cents)
- `status`: "active" | "inactive" | "cancelled" | "pending" | "expired" | "past_due"
- `subscription_start`: Date
- `subscription_end`: Date
- `auto_renew`: Boolean
- `form_limit`: Number
- `submission_limit`: Number

### PolarPayment Model

**Collection:** `polarpayments`

**Key Fields:**

- `user_id`: Reference to User
- `provider`: "polar"
- `event_type`: String
- `checkout_id`: String
- `order_id`: String (unique)
- `plan_name`: String
- `amount`: Number
- `currency`: String
- `status`: String
- `created_at`: Date (auto-generated)

---

## Migration Notes

### Deprecated Models (Removed)

- ❌ `Payment` - Replaced by `PolarPayment` and `Subscription`
- ❌ `GeniePayment` - Replaced by `PolarPayment`
- ❌ `GenieSubscription` - Replaced by `Subscription`

### Deprecated Endpoints

- ❌ `/api/genie/payment-request` → Use `/api/manual-billing/payment-request`
- ❌ `/api/genie/subscriptions` → Use `/api/polar/subscriptions`
- ❌ `/api/genie/payment-history` → Use `/api/polar/payment-history`

---

## Frontend Integration

### Fetching Billing Data

```javascript
const [subscriptionRes, historyRes, plansRes] = await Promise.allSettled([
  axios.get(`${SERVER_URL}/api/polar/subscriptions`, { withCredentials: true }),
  axios.get(`${SERVER_URL}/api/polar/payment-history`, {
    withCredentials: true,
  }),
  axios.get(`${SERVER_URL}/api/manual-billing/available-plans`, {
    withCredentials: true,
  }),
]);
```

### Submitting Payment Request

```javascript
const requestData = new FormData();
requestData.append('planId', planId);
requestData.append('billingPeriod', 'monthly');
requestData.append('formSelection', JSON.stringify({
  selectedFormIds: [...],
  isUpgrade: false,
  targetPlanId: planId
}));

const response = await axios.post(
  `${SERVER_URL}/api/manual-billing/payment-request`,
  requestData,
  {
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' }
  }
);

// Redirect to payment URL if provided
if (response.data.data.paymentUrl) {
  window.location.href = response.data.data.paymentUrl;
}
```

---

## Testing Checklist

- [ ] Fetch subscription details for active user
- [ ] Fetch subscription details for free user
- [ ] Fetch payment history
- [ ] Fetch available plans
- [ ] Submit payment request (manual)
- [ ] Submit payment request with form selection
- [ ] Check downgrade impact
- [ ] Check upgrade impact
- [ ] Verify form locking/unlocking after plan change
- [ ] Verify submission limits enforcement
- [ ] Test admin revenue calculations
- [ ] Test user deletion with new models
