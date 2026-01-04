# Quickstart Guide: Customer Support and Refund Service

## Overview

This guide provides step-by-step instructions for integrating and using the Customer Support and Refund Service API.

## Prerequisites

- API base URL (development: `http://localhost:8000/v1`, production: `https://api.furnitureshop.com/v1`)
- Valid authentication tokens (JWT)
- Customer and order data already in system

## Authentication

All endpoints require JWT authentication:

```javascript
// Example authentication setup
const headers = {
  'Authorization': `Bearer ${yourAuthToken}`,
  'Content-Type': 'application/json'
};
```

## Customer Workflow

### 1. Create a Support Case

**Endpoint:** `POST /support/cases`

**Request:**
```json
{
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "products": [
    {
      "productId": "987e6543-e21b-98d3-c456-426614174001",
      "quantity": 2
    }
  ],
  "issueDescription": "The chair arrived damaged with broken legs.",
  "attachments": [
    "base64-encoded-image-data"
  ]
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "777e8400-e29b-41d4-a716-446655440001",
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Open",
  "createdAt": "2026-01-04T12:00:00Z"
}
```

### 2. Request a Refund from Support Case

**Endpoint:** `POST /support/cases/{caseId}/refunds`

**Request:**
```json
{
  "products": [
    {
      "productId": "987e6543-e21b-98d3-c456-426614174001",
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "id": "661e8400-e29b-41d4-a716-446655440002",
  "supportCaseId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "777e8400-e29b-41d4-a716-446655440001",
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Pending",
  "eligibilityStatus": "Eligible",
  "totalRefundAmount": 199.99,
  "createdAt": "2026-01-04T12:05:00Z"
}
```

### 3. View Support Cases

**Endpoint:** `GET /support/cases`

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customerId": "777e8400-e29b-41d4-a716-446655440001",
    "orderId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "Open",
    "createdAt": "2026-01-04T12:00:00Z"
  }
]
```

### 4. View Refund Cases

**Endpoint:** `GET /refunds/cases`

**Response:**
```json
[
  {
    "id": "661e8400-e29b-41d4-a716-446655440002",
    "supportCaseId": "550e8400-e29b-41d4-a716-446655440000",
    "customerId": "777e8400-e29b-41d4-a716-446655440001",
    "orderId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "Pending",
    "eligibilityStatus": "Eligible",
    "totalRefundAmount": 199.99,
    "createdAt": "2026-01-04T12:05:00Z"
  }
]
```

## Support Agent Workflow

### 1. View All Refund Cases

**Endpoint:** `GET /admin/refunds/cases`

**Query Parameters:**
- `status`: Filter by status (Pending, Approved, Rejected, Completed)
- `customerId`: Filter by customer ID
- `limit`: Pagination limit (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "661e8400-e29b-41d4-a716-446655440002",
    "supportCaseId": "550e8400-e29b-41d4-a716-446655440000",
    "customerId": "777e8400-e29b-41d4-a716-446655440001",
    "orderId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "Pending",
    "eligibilityStatus": "Eligible",
    "totalRefundAmount": 199.99,
    "createdAt": "2026-01-04T12:05:00Z",
    "customerName": "John Doe",
    "customerEmail": "john@example.com"
  }
]
```

### 2. Get Refund Case Details

**Endpoint:** `GET /admin/refunds/cases/{refundId}`

**Response:**
```json
{
  "id": "661e8400-e29b-41d4-a716-446655440002",
  "supportCaseId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "777e8400-e29b-41d4-a716-446655440001",
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Pending",
  "eligibilityStatus": "Eligible",
  "totalRefundAmount": 199.99,
  "createdAt": "2026-01-04T12:05:00Z",
  "products": [
    {
      "productId": "987e6543-e21b-98d3-c456-426614174001",
      "quantity": 1,
      "name": "Designer Chair",
      "price": 199.99,
      "refundAmount": 199.99,
      "deliveryDate": "2026-01-01",
      "eligibility": "Eligible"
    }
  ],
  "orderDetails": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "createdAt": "2025-12-20T10:30:00Z",
    "totalAmount": 399.98,
    "status": "Delivered"
  },
  "customerDetails": {
    "id": "777e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 3. Approve Refund Case

**Endpoint:** `POST /admin/refunds/cases/{refundId}/approve`

**Response:**
```json
{
  "id": "661e8400-e29b-41d4-a716-446655440002",
  "supportCaseId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "777e8400-e29b-41d4-a716-446655440001",
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Approved",
  "eligibilityStatus": "Eligible",
  "totalRefundAmount": 199.99,
  "createdAt": "2026-01-04T12:05:00Z",
  "processedAt": "2026-01-04T14:15:00Z"
}
```

### 4. Reject Refund Case

**Endpoint:** `POST /admin/refunds/cases/{refundId}/reject`

**Request:**
```json
{
  "reason": "Product damage appears to be due to customer misuse, not shipping."
}
```

**Response:**
```json
{
  "id": "661e8400-e29b-41d4-a716-446655440002",
  "supportCaseId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "777e8400-e29b-41d4-a716-446655440001",
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Rejected",
  "eligibilityStatus": "Eligible",
  "totalRefundAmount": 199.99,
  "createdAt": "2026-01-04T12:05:00Z",
  "processedAt": "2026-01-04T14:15:00Z",
  "rejectionReason": "Product damage appears to be due to customer misuse, not shipping."
}
```

## Error Handling

The API follows standard HTTP status codes:

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Business rule violation (e.g., closing case with pending refunds)

**Error Response Format:**
```json
{
  "error": "invalid_request",
  "error_description": "Cannot close support case with pending refund requests",
  "details": {
    "pending_refunds": [
      "661e8400-e29b-41d4-a716-446655440002"
    ]
  }
}
```

## Webhook Events

The system emits webhook events for key actions:

- `support_case.created`: New support case opened
- `support_case.closed`: Support case closed
- `refund_case.created`: Refund requested
- `refund_case.approved`: Refund approved
- `refund_case.rejected`: Refund rejected
- `refund_case.completed`: Refund processed

## Rate Limiting

- Customer endpoints: 100 requests per minute
- Admin endpoints: 500 requests per minute
- Response headers include rate limit information:
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/v1',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Create support case
async function createSupportCase(data: SupportCaseCreate) {
  try {
    const response = await api.post('/support/cases', data);
    return response.data;
  } catch (error) {
    console.error('Error creating support case:', error.response?.data);
    throw error;
  }
}

// Request refund
async function requestRefund(caseId: string, products: RefundRequestProduct[]) {
  try {
    const response = await api.post(`/support/cases/${caseId}/refunds`, { products });
    return response.data;
  } catch (error) {
    console.error('Error requesting refund:', error.response?.data);
    throw error;
  }
}
```

### Python

```python
import requests

BASE_URL = "http://localhost:8000/v1"
HEADERS = {
    "Authorization": f"Bearer {your_token}",
    "Content-Type": "application/json"
}

def create_support_case(order_id, products, issue_description):
    data = {
        "orderId": order_id,
        "products": products,
        "issueDescription": issue_description
    }
    response = requests.post(f"{BASE_URL}/support/cases", json=data, headers=HEADERS)
    response.raise_for_status()
    return response.json()

def request_refund(case_id, products):
    data = {"products": products}
    response = requests.post(f"{BASE_URL}/support/cases/{case_id}/refunds", 
                          json=data, headers=HEADERS)
    response.raise_for_status()
    return response.json()
```

## Testing the API

Use the provided Postman collection or OpenAPI specification to test endpoints:

```bash
# Start development server
cd backend
docker-compose up --build

# Run tests
npm run test:api
```

## Troubleshooting

**Common Issues:**

1. **Authentication errors**: Verify JWT token is valid and has correct permissions
2. **403 Forbidden**: Check user has access to the requested resource
3. **409 Conflict**: Business rule violation (e.g., eligibility requirements)
4. **500 Server Error**: Check server logs for detailed error information

**Support:**

For API-related issues, contact: support@furnitureshop.com

## API Versioning

The API uses URL-based versioning: `/v1/`. All endpoints are versioned to ensure backward compatibility.

## Changelog

- **v1.0.0**: Initial release with full support and refund functionality