# RANU Snookers — Full Club & Snooker Management Software

## 1. Project Objective

Build a complete, production-ready web application for **RANU Snookers / Club**.

The system must manage the complete lifecycle of a customer's visit:

**Customer discovers club → checks table availability → books online → pays deposit → arrives → checks in → table/game starts → system automatically detects activity → billing starts → additional services/products are added → game ends → final bill generated → payment completed → receipt generated → visit stored for analytics.**

The application should also support walk-in customers, memberships, tournaments, food/beverage sales, POS operations, staff management, reports, and hardware/device integrations.

This should be designed as a **real commercial product**, not a demo or basic CRUD application.

---

# 2. Required Technology Stack

## Frontend

Use:

* React
* TypeScript
* Vite
* React Router
* TanStack Query
* Tailwind CSS
* shadcn/ui or another professional component system
* Zod for validation
* React Hook Form
* WebSocket support for real-time table status

The UI must be:

* Mobile-first
* Responsive
* Desktop/tablet/mobile compatible
* Fast
* Accessible
* Professional
* Easy for staff to operate from a touchscreen/tablet

---

# 3. Backend

Use:

* Python
* FastAPI
* SQLAlchemy 2.x
* Alembic
* Pydantic v2
* PostgreSQL as the primary production database
* MySQL compatibility wherever reasonably possible
* Redis for caching, locks and real-time/session-related workloads
* WebSockets for live table availability
* Background workers for asynchronous tasks

Recommended architecture:

```text
React + TypeScript
        |
        | HTTPS / WebSocket
        v
     FastAPI
        |
   Service Layer
        |
   Repository Layer
        |
  SQLAlchemy ORM
        |
 PostgreSQL
        |
  +-----+-----+
  |           |
 Redis      Object Storage
```

Keep the application database-agnostic enough that PostgreSQL can be replaced by MySQL without rewriting the business layer.

---

# 4. Deployment Architecture

The application must be easy to deploy using Docker.

Provide:

```text
docker-compose.yml
Dockerfile.backend
Dockerfile.frontend
nginx.conf
.env.example
```

Production architecture should support:

```text
Internet
   |
Cloudflare
   |
Nginx / Load Balancer
   |
FastAPI instances
   |
PostgreSQL
   |
Redis
   |
Object Storage
```

The application should be deployable on:

* OCI
* AWS
* Azure
* VPS
* Docker
* Kubernetes later if required

Do not tightly couple the system to one cloud provider.

---

# 5. User Roles

Implement proper RBAC.

Roles:

### Super Admin

Can manage:

* Clubs
* Branches
* Users
* Roles
* Settings
* Pricing
* Devices
* Reports
* Payments
* Memberships
* System configuration

### Club Admin

Can manage:

* Tables
* Bookings
* Customers
* Staff
* Pricing
* Billing
* Inventory
* Memberships
* Reports

### Manager

Can manage:

* Bookings
* Tables
* Customers
* Billing
* Staff operations
* Reports

### Receptionist

Can:

* Create walk-in bookings
* Check-in customers
* Start/stop games
* Generate bills
* Accept payments
* Manage reservations

### Staff

Can:

* View assigned tables
* Start/stop games
* Add products
* View active sessions

### Customer

Can:

* Register/login
* View tables
* View availability
* Book tables
* Pay deposit
* View bookings
* Cancel/reschedule according to policy
* View invoices
* Manage membership

---

# 6. Multi-Branch Architecture

Design the database for multiple clubs/branches.

Example:

```text
Organization
   |
   +--- Club
          |
          +--- Branch
                 |
                 +--- Tables
                 +--- Staff
                 +--- Pricing
                 +--- Devices
```

Every transactional record must be associated with the correct branch.

Do not assume there will only be one RANU Snookers location.

---

# 7. Table Management

Support different game types:

* Snooker
* Pool
* Billiards
* Other configurable games

Each table should have:

```text
Table
---------
id
branch_id
table_number
name
game_type
status
hourly_rate
peak_rate
off_peak_rate
minimum_booking_duration
maximum_booking_duration
is_active
device_id
```

Table statuses:

```text
AVAILABLE
RESERVED
OCCUPIED
GAME_STARTED
PAUSED
MAINTENANCE
BLOCKED
```

The dashboard must display table status in real time.

---

# 8. Online Booking System

Customers visiting the website should be able to:

1. Select branch
2. Select game type
3. Select date
4. Select start time
5. Select duration
6. See available tables
7. Select table
8. See pricing
9. Enter customer details
10. Pay minimum deposit
11. Receive booking confirmation

Example:

```text
RANU Snookers

Date:
23 September 2026

Time:
6:00 PM - 7:00 PM

Available Tables:

Table 1   Available
Table 2   Booked
Table 3   Available
Table 4   Maintenance
```

Availability must be calculated from actual bookings and active sessions.

---

# 9. Booking Conflict Prevention

This is extremely important.

The backend must prevent:

```text
Customer A → Table 1 → 6:00 PM
Customer B → Table 1 → 6:00 PM
```

from being booked simultaneously.

Use database-level protection/transactions and appropriate locking.

Handle:

* Concurrent booking requests
* Payment delay
* Abandoned checkout
* Booking expiry
* Cancellation
* Rescheduling
* No-show
* Early arrival
* Late arrival
* Extension

Temporary booking holds should automatically expire.

Example:

```text
Customer selects Table 3
        |
Table held for 10 minutes
        |
Payment successful
        |
Booking confirmed
```

If payment is not completed:

```text
Hold expires
     |
Table becomes available
```

---

# 10. Deposit Payment

Allow configurable deposit rules.

Example:

```text
1 hour booking = ₹500
Minimum deposit = ₹100
```

Store:

```text
booking_amount
deposit_amount
discount
tax
remaining_amount
payment_status
```

Payment states:

```text
PENDING
AUTHORIZED
PAID
PARTIALLY_PAID
FAILED
REFUNDED
CANCELLED
```

Design a payment abstraction so Razorpay/Stripe/other providers can be added without changing booking logic.

---

# 11. Automatic Game Detection — IMPORTANT

The system should support multiple methods of detecting when a table/game actually starts.

Do NOT tightly couple the business logic to one sensor.

Create a generic:

```text
Table Activity Detection Service
```

with pluggable detection providers.

Possible methods:

## Option A — RFID/NFC/Card

Customer receives:

```text
RANU Member Card
```

Customer taps card at the table.

System:

```text
Card detected
     ↓
Identify customer
     ↓
Identify table
     ↓
Create game session
     ↓
Start billing
```

Advantages:

* Cheap
* Reliable
* Easy to implement
* Easy to associate customer with session

Possible future hardware:

* RFID
* NFC
* QR
* RFID wristband
* Membership card

---

# 12. Option B — QR Code at Table

Each table has a QR code.

Customer scans:

```text
Table 4
```

System opens:

```text
Start Game
```

Customer confirms.

Then:

```text
Game Session Started
```

This is the easiest MVP.

---

# 13. Option C — Physical Sensor

Install a sensor on/near the table.

Possible sensors:

* IR sensor
* Pressure sensor
* Vibration sensor
* Motion sensor
* Magnetic sensor
* Break-beam sensor

The device sends:

```json
{
  "device_id": "TABLE4_SENSOR",
  "table_id": 4,
  "event": "ACTIVITY_DETECTED",
  "timestamp": "2026-09-23T18:02:15Z"
}
```

Backend processes the event.

Important:

Do NOT immediately start billing from one sensor event.

Use a state machine.

Example:

```text
IDLE
 ↓
ACTIVITY_DETECTED
 ↓
CONFIRM_ACTIVITY
 ↓
GAME_STARTED
 ↓
BILLING_ACTIVE
```

This prevents false billing.

---

# 14. Option D — Camera / Computer Vision

Allow future integration with a camera mounted near the table.

Camera detects:

* People around table
* Movement
* Cue activity
* Table occupancy

But camera detection should NOT directly create a bill.

Instead:

```text
Camera
   ↓
Computer Vision Service
   ↓
Activity Confidence
   ↓
Event
   ↓
Table Activity Service
   ↓
Game Session
```

Example:

```json
{
  "table_id": 4,
  "activity": "GAME_ACTIVITY",
  "confidence": 0.94
}
```

Use configurable confidence thresholds.

Also consider privacy requirements and avoid unnecessary storage of video.

Prefer processing locally and storing only events/metadata where possible.

---

# 15. Option E — Hybrid Detection

Support:

```text
RFID/NFC
+
Physical Sensor
+
Camera
+
QR
+
Manual Staff Start
```

The system should combine signals.

Example:

```text
RFID detected
      +
Movement detected
      +
Table occupied
      ↓
High confidence
      ↓
Start game
```

This should be the long-term architecture.

---

# 16. Hardware Integration Architecture

Create:

```text
Device
DeviceType
DeviceEvent
DeviceHeartbeat
DeviceConfiguration
```

Device types:

```text
RFID_READER
NFC_READER
MOTION_SENSOR
PRESSURE_SENSOR
IR_SENSOR
CAMERA
TABLE_CONTROLLER
CUSTOM
```

Every device must have:

```text
device_id
branch_id
table_id
device_type
status
last_seen_at
firmware_version
configuration
```

Device states:

```text
ONLINE
OFFLINE
ERROR
MAINTENANCE
```

Create heartbeat monitoring.

Dashboard:

```text
Table 1 Sensor    ONLINE
Table 2 Sensor    ONLINE
Table 3 Sensor    OFFLINE
Table 4 RFID      ONLINE
```

---

# 17. Game Session

Create a proper game/session entity.

Example:

```text
GameSession
----------------
id
booking_id
table_id
customer_id
started_at
ended_at
paused_at
duration_seconds
billing_status
started_by
ended_by
detection_method
confidence_score
status
```

Status:

```text
CREATED
ACTIVE
PAUSED
COMPLETED
CANCELLED
AUTO_CLOSED
```

The billing engine must calculate charges from the session.

---

# 18. Billing Engine

Create a dedicated billing service.

Pricing should support:

```text
Normal hours
Peak hours
Weekend pricing
Holiday pricing
Member pricing
Non-member pricing
Game type pricing
Table-specific pricing
Promotional pricing
```

Example:

```text
Normal:
₹500/hour

Peak:
₹700/hour

Member:
₹400/hour
```

Do not hardcode prices.

Create configurable pricing rules.

---

# 19. Automatic Billing

Example:

```text
Game starts
     ↓
18:00
     ↓
Billing starts
     ↓
18:30
     ↓
₹250
     ↓
19:00
     ↓
₹500
     ↓
Game ends
     ↓
Final bill
```

Support configurable billing intervals:

```text
Per minute
Per 15 minutes
Per 30 minutes
Per hour
```

Handle partial intervals according to pricing configuration.

---

# 20. Game Extension

Customer should be able to extend a session.

Example:

```text
Booking:
6 PM - 7 PM

Customer wants:
+30 minutes
```

System checks:

```text
Is table available after 7 PM?
```

If yes:

```text
Extend session
```

If another booking exists:

```text
Extension unavailable
```

---

# 21. Walk-In Customers

Receptionist should be able to create:

```text
Walk-in Session
```

without an online booking.

Flow:

```text
Customer arrives
      ↓
Receptionist selects table
      ↓
Select customer/member
      ↓
Start session
      ↓
Billing begins
```

---

# 22. Membership System

Support:

```text
Membership plans
Membership cards
Membership expiry
Membership discounts
Membership usage limits
Membership benefits
```

Example:

```text
Silver
Gold
Premium
```

Membership pricing must be configurable.

---

# 23. POS

Create a POS module for:

* Soft drinks
* Water
* Snacks
* Food
* Accessories
* Cue equipment
* Other products

Support:

```text
Product
Category
SKU
Stock
Purchase
Sale
Stock adjustment
Supplier
```

During an active game:

```text
Table 4
   |
   +-- Snooker Session ₹500
   +-- Coke ₹60
   +-- Water ₹30
   +-- Snacks ₹100
```

All items should appear on the final invoice.

---

# 24. Inventory

Support:

```text
Opening stock
Purchases
Sales
Returns
Damaged stock
Stock adjustments
Low stock alerts
Supplier management
```

Maintain inventory ledger instead of simply updating a stock number.

---

# 25. Customer Management / CRM

Customer profile:

```text
Customer
---------
name
phone
email
date_of_birth
membership
total_visits
total_spend
last_visit
preferred_game
notes
```

Dashboard:

```text
Total Visits
Total Spend
Average Session
Favorite Game
Membership
Last Visit
```

---

# 26. Loyalty System

Support configurable:

```text
Points
Rewards
Coupons
Discounts
Referral codes
Promotions
```

Example:

```text
₹100 spent = 1 point
```

Do not hardcode loyalty rules.

---

# 27. Tournament Management

Future-ready tournament module.

Support:

* Tournament creation
* Participants
* Entry fee
* Groups
* Knockout
* Brackets
* Match scheduling
* Table assignment
* Results
* Leaderboard
* Winner

---

# 28. Staff Dashboard

Receptionist dashboard should show:

```text
Today's Revenue
Today's Bookings
Active Tables
Available Tables
Upcoming Bookings
Pending Payments
Active Sessions
Device Errors
```

Table grid:

```text
TABLE 1   🟢 AVAILABLE
TABLE 2   🔴 OCCUPIED
TABLE 3   🟡 RESERVED
TABLE 4   🔵 GAME ACTIVE
TABLE 5   ⚠️ MAINTENANCE
```

---

# 29. Real-Time Updates

Use WebSockets.

If Table 4 changes:

```text
AVAILABLE
     ↓
GAME_STARTED
```

all connected dashboards should update immediately.

Customer booking page should also update availability.

Avoid requiring manual page refresh.

---

# 30. Notifications

Support:

* Booking confirmation
* Booking reminder
* Cancellation
* Payment confirmation
* Session started
* Session ending reminder
* Invoice
* Membership expiry
* Promotional notifications

Design notification providers:

```text
Email
SMS
WhatsApp
Push Notification
```

Do not hardcode one provider.

---

# 31. Reports

Create reports for:

### Revenue

```text
Daily
Weekly
Monthly
Yearly
```

### Table Utilization

```text
Table 1 → 72%
Table 2 → 64%
Table 3 → 81%
```

### Peak Hours

Show:

```text
6 PM
7 PM
8 PM
9 PM
```

### Customer Reports

```text
New customers
Returning customers
Members
Non-members
Top customers
```

### Game Reports

```text
Snooker
Pool
Billiards
```

### Payment Reports

```text
Cash
UPI
Card
Online
Wallet
```

---

# 32. Audit Logs

Every important operation must be auditable.

Example:

```text
User: receptionist01

Action:
Changed booking status

Before:
CONFIRMED

After:
CANCELLED

Timestamp:
2026-09-23 18:31:10

IP:
...

Reason:
Customer requested cancellation
```

Track:

* Login
* Booking creation
* Booking cancellation
* Price changes
* Bill changes
* Refund
* Manual session start
* Manual session stop
* Inventory adjustment
* Membership changes
* Permission changes

---

# 33. Database Design

Use normalized relational database design.

Create migrations with Alembic.

Core tables should include approximately:

```text
organizations
branches
users
roles
permissions
user_roles

customers
memberships
membership_plans
membership_transactions

game_types
tables
table_pricing
pricing_rules

bookings
booking_holds
booking_payments

game_sessions
session_events
session_pauses

devices
device_types
device_events
device_heartbeats

products
product_categories
suppliers
inventory_transactions

orders
order_items
payments
invoices

tournaments
tournament_players
tournament_matches

notifications
notification_templates

audit_logs
system_settings
```

Use:

* UUID primary keys where appropriate
* Foreign keys
* Unique constraints
* Check constraints
* Indexes
* Created/updated timestamps
* Soft deletion only where appropriate

Do not use soft delete for financial transaction records.

---

# 34. Financial Data Integrity

Never permanently overwrite financial transactions.

For example, if a bill was ₹1,000 and later corrected:

Do not simply change:

```text
1000 → 800
```

Instead create an adjustment/audit record.

Financial records must be traceable.

---

# 35. API Architecture

Use REST APIs with clean versioning.

Example:

```text
/api/v1/auth
/api/v1/customers
/api/v1/tables
/api/v1/bookings
/api/v1/sessions
/api/v1/billing
/api/v1/payments
/api/v1/products
/api/v1/inventory
/api/v1/memberships
/api/v1/devices
/api/v1/reports
```

Use OpenAPI documentation.

Implement:

* JWT authentication
* Refresh tokens
* RBAC
* Request validation
* Rate limiting
* Pagination
* Filtering
* Sorting
* Consistent error responses

---

# 36. Security

Implement:

* Password hashing using Argon2/bcrypt
* JWT access/refresh tokens
* Secure cookies where appropriate
* CORS configuration
* CSRF protection where applicable
* Rate limiting
* Input validation
* SQL injection protection
* Authorization checks at service level
* Audit logging
* Secret management through environment variables
* No secrets committed to Git

---

# 37. Reliability

The system must handle failures.

Examples:

### Sensor sends duplicate event

Do not create two sessions.

Use idempotency/event IDs.

### Payment succeeds but frontend crashes

Booking must still become confirmed.

Payment webhook must be authoritative.

### Sensor goes offline

Dashboard should show:

```text
DEVICE OFFLINE
```

but staff must still be able to manually start/stop sessions.

### Server restarts

Active sessions must remain recoverable.

### Network temporarily unavailable

Hardware gateway should queue events and retry.

---

# 38. Device Event Processing

Create an event-driven architecture.

Example:

```text
Sensor
   ↓
MQTT / HTTP
   ↓
Device Gateway
   ↓
Event Queue
   ↓
Activity Detection Service
   ↓
Game Session Service
   ↓
Billing Service
```

For MVP, support HTTP device APIs.

Design the system so MQTT can be added later.

---

# 39. Automatic Session State Machine

Implement:

```text
AVAILABLE
   |
   | booking
   ↓
RESERVED
   |
   | customer arrives
   ↓
READY
   |
   | detection/manual start
   ↓
ACTIVE
   |
   | pause
   ↓
PAUSED
   |
   | resume
   ↓
ACTIVE
   |
   | end
   ↓
COMPLETED
   |
   ↓
BILL GENERATED
```

Prevent invalid state transitions.

---

# 40. Anti-Fraud / Billing Protection

Consider:

* Duplicate sensor events
* Manual session manipulation
* Unauthorized price changes
* Session started without customer
* Session running for excessive duration
* Device spoofing
* Offline device events
* Clock manipulation
* Duplicate payments

Create alerts for suspicious events.

---

# 41. Customer Website

Create a public website:

```text
Home
About
Games
Tables
Pricing
Membership
Book Now
Contact
Login
```

The primary CTA should be:

```text
BOOK A TABLE
```

Booking page:

```text
Choose Branch
      ↓
Choose Date
      ↓
Choose Time
      ↓
Choose Game
      ↓
Show Available Tables
      ↓
Select Table
      ↓
Confirm
      ↓
Pay Deposit
      ↓
Booking Confirmation
```

---

# 42. Admin Application

Separate admin interface:

```text
/dashboard

/tables
/bookings
/sessions
/billing
/customers
/memberships
/products
/inventory
/devices
/tournaments
/reports
/settings
/users
/audit-logs
```

---

# 43. Dashboard UX

The dashboard must be designed for actual club staff.

Avoid overly complicated screens.

The receptionist should be able to understand:

```text
What tables are free?
What tables are running?
Who is arriving?
Who needs payment?
Which games are ending?
Is any device offline?
```

within a few seconds.

---

# 44. Database Transactions

Use database transactions for:

```text
Booking creation
Payment confirmation
Session creation
Session completion
Invoice generation
Inventory deduction
Refunds
Membership purchase
```

Avoid partial writes.

---

# 45. Concurrency

Design for multiple receptionists/devices working simultaneously.

Example:

```text
Receptionist A starts Table 5
Receptionist B starts Table 5
Sensor starts Table 5
```

Only one valid active session must exist.

Use:

* Database constraints
* Transactions
* Row-level locking where supported
* Idempotency keys
* Unique active-session constraints

---

# 46. Testing

Create:

### Unit tests

For:

* Pricing
* Booking
* Billing
* Membership
* Inventory
* Session state machine

### Integration tests

For:

* Booking + payment
* Session + billing
* Inventory + POS
* Device + session

### API tests

For every major endpoint.

### Frontend tests

For:

* Booking flow
* Login
* Checkout
* Table dashboard

---

# 47. CI/CD

Create GitHub Actions:

```text
Pull Request
    ↓
Lint
    ↓
Type Check
    ↓
Backend Tests
    ↓
Frontend Tests
    ↓
Build
    ↓
Docker Build
```

Production deployment:

```text
main
 ↓
CI
 ↓
Docker Build
 ↓
Deploy
 ↓
Database Migration
 ↓
Health Check
 ↓
Release
```

Database migration must have a safe rollback strategy.

Never automatically execute destructive migrations.

---

# 48. Observability

Implement:

* Structured logging
* Request IDs
* Error tracking
* Health endpoint
* Database health check
* Redis health check
* Device health
* Metrics

Endpoints:

```text
/health
/ready
```

---

# 49. Configuration

All configurable values must be environment variables.

Example:

```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
PAYMENT_PROVIDER=
PAYMENT_KEY=
PAYMENT_SECRET=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

Provide:

```text
.env.example
```

Never commit real credentials.

---

# 50. API Documentation

Generate Swagger/OpenAPI automatically.

Document:

* Authentication
* Request
* Response
* Errors
* Pagination
* WebSockets
* Device APIs
* Payment webhooks

---

# 51. Hardware MVP Recommendation

Build the software so these detection methods are supported:

### MVP

```text
QR + Manual Start
```

### Phase 2

```text
RFID/NFC
```

### Phase 3

```text
Physical Sensors
```

### Phase 4

```text
Camera / Computer Vision
```

### Long-term

```text
Hybrid Detection Engine
```

Do not make the entire application dependent on camera detection.

The billing engine must work even if hardware fails.

---

# 52. Important Business Rule

Automatic detection must never blindly start billing from a single movement.

For example:

```text
Someone walks near Table 4
```

must NOT automatically create a bill.

Instead:

```text
Movement detected
+
Table occupied
+
Recent customer identification
+
Activity confidence
+
Minimum activity duration
```

can generate:

```text
GAME_ACTIVITY_CONFIRMED
```

Then billing can start.

Staff should always have:

```text
START SESSION
STOP SESSION
ADJUST SESSION
```

with appropriate permissions and audit logs.

---

# 53. Mobile Responsiveness

The receptionist/admin dashboard must work properly on:

* Desktop
* Laptop
* Tablet
* Mobile

The customer booking experience should be optimized primarily for mobile.

---

# 54. Deliverables

Generate the complete project.

Expected structure:

```text
ranu-snookers/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── workers/
│   │   ├── devices/
│   │   └── main.py
│   │
│   ├── migrations/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── Dockerfile
│
├── infrastructure/
│   ├── nginx/
│   └── docker/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# 55. Implementation Strategy

Do NOT attempt to build everything as one giant implementation.

Build incrementally.

## Phase 1 — Foundation

Implement:

* Authentication
* RBAC
* Branches
* Tables
* Game types
* Customers
* Database
* Admin dashboard

## Phase 2 — Booking

Implement:

* Availability engine
* Booking
* Booking holds
* Deposits
* Payment abstraction
* Customer portal

## Phase 3 — Sessions & Billing

Implement:

* Game sessions
* Billing engine
* Pricing
* Invoices
* Payments
* Walk-ins
* Session state machine

## Phase 4 — POS

Implement:

* Products
* Inventory
* Orders
* Order items
* Table orders

## Phase 5 — Membership

Implement:

* Membership plans
* Membership cards
* Discounts
* Loyalty

## Phase 6 — Hardware

Implement:

* Device registry
* Device heartbeat
* Device events
* QR
* RFID/NFC
* Sensor integration
* Automatic session detection

## Phase 7 — Advanced

Implement:

* Camera integration
* Computer vision
* Tournament system
* Advanced analytics
* Notifications
* Loyalty
* Multi-branch management

---

# 56. Development Rules

Follow these rules strictly:

1. Do not put business logic inside React components.
2. Do not put business logic directly inside FastAPI route handlers.
3. Use service classes/functions for business logic.
4. Use SQLAlchemy models only for persistence concerns.
5. Use Pydantic schemas for API contracts.
6. Use repositories for complex database access.
7. Use database transactions for financial operations.
8. Use idempotency for payments and device events.
9. Never trust frontend calculations for billing.
10. Backend must be the source of truth for price and availability.
11. Never hardcode table prices.
12. Never hardcode branch IDs.
13. Never hardcode roles.
14. Never expose secrets to frontend.
15. All important changes must be auditable.
16. Use UTC timestamps in the database and convert to local timezone at the UI/business boundary.
17. Use proper database indexes.
18. Avoid N+1 database queries.
19. Paginate large datasets.
20. Design APIs for future mobile applications.
21. Keep hardware integration modular.
22. Hardware failure must never make the club's billing system unusable.
23. Financial records must be immutable/auditable.
24. Use migrations for every schema change.
25. Provide seed data for development.
26. Provide meaningful error messages.
27. Use consistent API response structures.
28. Do not create unnecessary microservices initially.
29. Start as a modular monolith and split services only when scale requires it.
30. Write production-quality code rather than demo code.

---

# 57. Final Product Vision

The final application should feel like a professional commercial product:

**RANU CLUB MANAGEMENT PLATFORM**

It should combine:

```text
Online Booking
      +
Real-Time Table Management
      +
Automatic Game Detection
      +
Time-Based Billing
      +
POS
      +
Inventory
      +
Membership
      +
Customer CRM
      +
Payments
      +
Tournament Management
      +
Device Management
      +
Analytics
      +
Multi-Branch Management
```

The architecture must allow the club to start with:

```text
QR + Manual Session Start
```

and gradually evolve into:

```text
RFID/NFC
     +
Sensors
     +
Camera/Computer Vision
     +
Automatic Table Detection
     +
Automatic Billing
```

without requiring a rewrite of the core application.

The most important principle is:

**The software must remain reliable even when automatic detection, internet connectivity, payment services, or individual hardware devices fail. Staff must always have controlled manual fallback operations.**

Build the application with scalability, security, financial correctness, hardware reliability, and long-term maintainability as first-class requirements.
