# Ecom Frontend

React + Vite frontend for the e-commerce API gateway.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Configure API base

Set `VITE_API_BASE_URL` in your `.env` file (copy from `.env.example`).

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Endpoints and payloads to edit

All cart and order URLs and payload mappings live in:

- `frontend/src/api/endpoints.js`

If the backend expects different cart or order payloads, update:

- `endpoints.cart.mapItemsToServer`
- `endpoints.cart.mapServerCartToItems`
- `endpoints.orders.mapCreatePayload`

Service wrappers are in:

- `frontend/src/api/authService.js`
- `frontend/src/api/userService.js`
- `frontend/src/api/productService.js`
- `frontend/src/api/cartService.js`
- `frontend/src/api/orderService.js`

## Auth and cart storage

The app stores token, user, cart id, and cart items in localStorage.
Keys are defined in:

- `frontend/src/api/endpoints.js`

## Notes

- Errors are logged to the console and surfaced as toasts.
- If the server cart schema differs, adjust the mapping functions in `endpoints.js` only.
