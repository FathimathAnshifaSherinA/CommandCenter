# ⚡ Enterprise Command Center — Event-Driven Micro-Frontend Dashboard
 
A fully decoupled, real-time enterprise dashboard built on Salesforce LWC using Event-Driven Architecture, Lightning Message Service (LMS), and live external API integrations.
 
---
 
## 🎯 What This Project Demonstrates
 
| Concept | Implementation |
|---|---|
| Event-Driven Architecture | Lightning Message Service (pub/sub) |
| Micro-Frontend Pattern | 3 independent LWC components |
| Async External Callouts | Apex `@AuraEnabled` HTTP callouts |
| Fault Isolation | Each panel fails independently |
| Bidirectional LMS | Parent→Children + Children→Anyone |
| Enterprise Auth | External Credentials + Named Principals |
| Live Data | ExchangeRate-API + Postman Mock (SAP/AWS/FedEx shapes) |
 
---
 
## 🏗️ Architecture
 
```
External APIs (ExchangeRate-API / Postman Mock SAP+AWS+FedEx)
        │
        ▼
Apex @AuraEnabled Controllers (one per panel, independent)
        │
        ▼
Lightning Message Service ──── RefreshDashboard__c (parent → all children)
        │                 ──── ShipmentUpdated__c   (shipping → billing)
        │                 ──── InventoryAlert__c     (inventory → billing)
        ▼
LWC Components (billingInfo + inventoryPanel + shippingStatus)
        │
        ▼
commandCenter (parent shell — zero data logic)
```
 
---
 
## 📁 Project Structure
 
```
CommandCenter/
├── force-app/main/default/
│   ├── classes/
│   │   ├── BillingContinuationCtrl.cls
│   │   ├── BillingContinuationCtrl.cls-meta.xml
│   │   ├── InventoryContinuationCtrl.cls
│   │   ├── InventoryContinuationCtrl.cls-meta.xml
│   │   ├── ShippingContinuationCtrl.cls
│   │   └── ShippingContinuationCtrl.cls-meta.xml
│   ├── messageChannels/
│   │   ├── RefreshDashboard.messageChannel-meta.xml
│   │   ├── ShipmentUpdated.messageChannel-meta.xml
│   │   └── InventoryAlert.messageChannel-meta.xml
│   └── lwc/
│       ├── commandCenter/
│       │   ├── commandCenter.html
│       │   ├── commandCenter.js
│       │   └── commandCenter.js-meta.xml
│       ├── billingInfo/
│       │   ├── billingInfo.html
│       │   ├── billingInfo.js
│       │   └── billingInfo.js-meta.xml
│       ├── inventoryPanel/
│       │   ├── inventoryPanel.html
│       │   ├── inventoryPanel.js
│       │   └── inventoryPanel.js-meta.xml
│       └── shippingStatus/
│           ├── shippingStatus.html
│           ├── shippingStatus.js
│           └── shippingStatus.js-meta.xml
├── config/
│   └── project-scratch-def.json
└── sfdx-project.json
```
 
---
 
## 🔌 Live Data Sources
 
| Panel | Data Source | What It Shows |
|---|---|---|
| Billing — SAP | Postman Mock (SAP BAPI shape) | Invoice, line items, live USD→INR rate |
| Inventory — AWS | Postman Mock (AWS shape) | Real product, stock level, warehouse |
| Shipping — Logistics | Postman Mock (FedEx shape) | Tracking, progress, checkpoint events |
 
The Billing panel previously used ExchangeRate-API for live currency conversion.
The Postman mock returns realistic enterprise API response shapes (SAP BAPI, AWS ResponseMetadata, FedEx TrackingResponse).
 
---
 
## ⚡ Lightning Message Service — Bidirectional Flow
 
### Upward (child → anyone)
```
shippingStatus  ──publishes──▶  ShipmentUpdated__c  ──▶  billingInfo reacts
inventoryPanel  ──publishes──▶  InventoryAlert__c   ──▶  billingInfo shows warning
```
 
### Downward (parent → all children)
```
commandCenter ──publishes──▶ RefreshDashboard__c
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
               billingInfo   inventoryPanel   shippingStatus
               (reloads)      (reloads)        (reloads)
```
 
---
 
## 🚀 Setup & Deployment
 
### Prerequisites
- Salesforce CLI (`sf`) installed
- VS Code with Salesforce Extension Pack
- Free Salesforce Developer Edition org
 
### Step 1 — Clone and authenticate
```bash
git clone https://github.com/YOUR_USERNAME/CommandCenter.git
cd CommandCenter
sf org login web --alias myDevOrg --instance-url https://login.salesforce.com
```
 
### Step 2 — Deploy in order
```bash
# 1. Apex classes first
sf project deploy start --source-dir force-app/main/default/classes --target-org myDevOrg
 
# 2. Message channels second
sf project deploy start --source-dir force-app/main/default/messageChannels --target-org myDevOrg
 
# 3. LWC components last
sf project deploy start --source-dir force-app/main/default/lwc --target-org myDevOrg
```
 
### Step 3 — Configure Named Credentials in Salesforce Setup
 
#### External Credential (one, shared by all)
```
Setup → Named Credentials → External Credentials → New
Label: MockAPI_Ext
Name: MockAPI_Ext
Authentication Protocol: No Authentication
 
→ Click into MockAPI_Ext → Principals → New
Parameter Name: MockAPI_Principal
Sequence Number: 1
Scope: NamedPrincipal
```
 
#### Named Credentials
```
Setup → Named Credentials → Named Credentials tab → New
 
1. Name: Postman_Mock
   URL: https://YOUR-MOCK-ID.mock.pstmn.io
   External Credential: MockAPI_Ext
 
2. Name: ExchangeRateAPI
   URL: https://v6.exchangerate-api.com
   External Credential: MockAPI_Ext
```
 
#### Remote Site Settings
```
Setup → Remote Site Settings → New
 
1. Name: PostmanMock
   URL: https://YOUR-MOCK-ID.mock.pstmn.io
 
2. Name: ExchangeRateAPI
   URL: https://v6.exchangerate-api.com
```
 
#### Permission Set
```
Setup → Permission Sets → New
Label: MockAPI_Access
→ External Credential Principal Access → Edit
→ Enable: MockAPI_Ext - MockAPI_Principal
→ Manage Assignments → assign to your user
```
 
### Step 4 — Create Postman Mock Server
 
1. Go to https://postman.com → sign up free
2. Create a Collection named `Enterprise Mock APIs`
3. Add 3 GET requests with Example responses:
 
| Request Name | Path | Response |
|---|---|---|
| SAP Billing Invoice | `/sap/billing/invoice` | SAP BAPI JSON (see `/docs/mock-responses/sap-billing.json`) |
| AWS Inventory Stock | `/aws/inventory/stock` | AWS ResponseMetadata JSON |
| Logistics Shipment Track | `/logistics/shipment/track` | FedEx TrackingResponse JSON |
 
4. Collection → ··· → Mock Collection → Create Mock Server
5. Copy mock URL → update `Postman_Mock` Named Credential
 
### Step 5 — Add to Lightning App Builder
```
Setup → App Builder → New → App Page
Name: Command Center Dashboard
Layout: One Region
→ drag commandCenter component onto canvas
→ Save → Activate → assign to Lightning App
```
 
---
 
## 🔑 API Keys Required
 
| API | Where to get | Free tier |
|---|---|---|
| ExchangeRate-API | https://app.exchangerate-api.com/sign-up | 1,500 calls/month |
| Postman Mock | https://postman.com | Unlimited on free plan |
 
Replace `YOUR_ACTUAL_API_KEY` in `BillingContinuationCtrl.cls` with your ExchangeRate-API key.
 
---
 
## 🐛 Common Issues & Fixes
 
| Error | Cause | Fix |
|---|---|---|
| `Unable to retrieve metadata for descriptor: RefreshDashboard__c` | Message channels not deployed | Deploy messageChannels before lwc |
| `Unable to find Apex action class` | Apex not deployed | Deploy classes first |
| `callout url is not valid` | Named Credential wrong name | Check spelling matches exactly in Apex |
| `couldn't access the endpoint` | Missing Principal permission | Add user to MockAPI_Access permission set |
| `Attempt to de-reference a null object` | Static variable reset between callbacks | Use hardcoded string key in `addHttpRequest` |
 
---
 
## 💬 Interview Talking Points
 
**"Why LMS over @api properties?"**
> @api creates tight parent-child coupling. LMS publishes across the entire Lightning page regardless of DOM position — true micro-frontend independence.
 
**"Why not one Apex controller?"**
> A single controller is a single point of failure. Separate controllers mean each panel fails gracefully in isolation — fault isolation is the core enterprise value.
 
**"How do you scale this to 10 components?"**
> Zero changes to existing components. New component subscribes to `RefreshDashboard__c` in `connectedCallback`. That's the Open/Closed Principle — open for extension, closed for modification.
 
**"What happens when a component is removed?"**
> It unsubscribes in `disconnectedCallback`. Other components are completely unaffected — no null references, no broken wiring.
 
---
 
## 📊 Tech Stack
 
- **Salesforce LWC** — UI components
- **Apex** — server-side controllers
- **Lightning Message Service** — inter-component communication
- **Named Credentials** — secure external API auth
- **ExchangeRate-API** — live currency data
- **Postman Mock Server** — enterprise API simulation (SAP BAPI, AWS, FedEx)
- **Open Food Facts** — real product catalog data
 
---
 
## 👩‍💻 Author
 
**Fathimath Anshifa Sherin A**
Salesforce Developer | Open to Opportunities
 
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://linkedin.com/in/YOUR_PROFILE)
 
---
 
## 📄 License
 
MIT License — free to use, modify, and distribute.
 
# pipeline test
# pipeline test
# pipeline test
# pipeline test
# pipeline test
trigger
