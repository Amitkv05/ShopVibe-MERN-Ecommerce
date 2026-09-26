# Admin Usage Guide

Admin pages:
- `/admin` dashboard and system health
- `/admin/products` products, variants, stock-facing fields and Cloudinary images
- `/admin/categories` category lifecycle
- `/admin/inventory` stock adjustments, low stock and inventory history
- `/admin/orders` order review and allowed status transitions
- `/admin/customers` user details and safe role/name/email administration
- `/admin/coupons` coupon rules and lifecycle
- `/admin/reviews` review moderation
- `/admin/analytics` revenue/order/customer/product analytics
- `/admin/media` Cloudinary upload/delete for current-session assets
- `/admin/system` read-only diagnostics

Order transitions supported by the backend:
- Processing → Shipped
- Processing → Cancelled
- Shipped → Delivered

Do not expose or edit database, SMTP, Cloudinary or Razorpay secrets through the admin UI; those remain hosting environment variables.
