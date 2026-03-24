import { LightningElement, wire, track } from 'lwc';
import {
    MessageContext,
    subscribe,
    unsubscribe,
    APPLICATION_SCOPE
} from 'lightning/messageService';
import SHIPMENT_CHANNEL  from '@salesforce/messageChannel/ShipmentUpdated__c';
import INVENTORY_CHANNEL from '@salesforce/messageChannel/InventoryAlert__c';
import REFRESH_CHANNEL   from '@salesforce/messageChannel/RefreshDashboard__c';
import startRequest from '@salesforce/apex/BillingContinuationCtrl.startRequest';

export default class BillingInfo extends LightningElement {
    @track billingStatus    = 'Loading...';
    @track totalDueUSD      = '—';
    @track totalDueINR      = '—';
    @track exchangeRate     = '—';
    @track rateSource       = '';
    @track invoiceNumber    = 'INV-2024-0891';
    @track accountName      = '—';
    @track paymentTerms     = 'Net 30';
    @track lastTracking     = 'Awaiting shipment data...';
    @track inventoryWarning = '';
    @track lastRefreshedAt  = '';
    @track isLoading        = true;
    @track hasError         = false;
    @track errorMessage     = '';
    @track materialDesc = '';
    @track quantity     = '';
    @track companyCode  = '';

    @wire(MessageContext) messageContext;

    shipSubscription      = null;
    inventorySubscription = null;
    refreshSubscription   = null;

    connectedCallback() {
        this.loadBillingData();

        this.shipSubscription = subscribe(
            this.messageContext, SHIPMENT_CHANNEL,
            (msg) => this.handleShipmentUpdate(msg),
            { scope: APPLICATION_SCOPE }
        );
        this.inventorySubscription = subscribe(
            this.messageContext, INVENTORY_CHANNEL,
            (msg) => this.handleInventoryUpdate(msg),
            { scope: APPLICATION_SCOPE }
        );
        this.refreshSubscription = subscribe(
            this.messageContext, REFRESH_CHANNEL,
            (msg) => this.handleRefresh(msg),
            { scope: APPLICATION_SCOPE }
        );
    }

    async loadBillingData() {
        try {
            this.isLoading = true;
            this.hasError  = false;
            const result   = await startRequest();

            if (result.success) {
                this.totalDueUSD   = result.totalDueUSD;
                this.totalDueINR   = result.totalDueINR;
                this.exchangeRate  = result.exchangeRate;
                this.rateSource    = result.rateSource;
                this.accountName   = result.accountName;
                this.billingStatus = result.billingStatus;
                this.invoiceNumber = result.invoiceNumber;
                // New SAP fields
                this.materialDesc  = result.description;
                this.quantity      = result.quantity + ' ' + result.uom;
                this.companyCode   = result.companyCode;
            } else {
                this.hasError     = true;
                this.errorMessage = result.error;
            }
        } catch(e) {
            this.hasError     = true;
            this.errorMessage = e.body?.message || 'Failed to load';
        } finally {
            this.isLoading = false;
        }
    }

    handleShipmentUpdate(message) {
        this.lastTracking  = message.trackingNumber;
        this.billingStatus = message.status === 'Delivered'
            ? 'Invoice Ready' : 'Awaiting Delivery';
    }

    handleInventoryUpdate(message) {
        this.inventoryWarning = message.isLowStock
            ? 'Low stock on ' + message.productId +
              ': ' + message.stockLevel + ' units remaining'
            : '';
    }

    handleRefresh(message) {
        this.lastTracking     = 'Refreshing...';
        this.inventoryWarning = '';
        this.lastRefreshedAt  = new Date(message.timestamp)
            .toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        this.loadBillingData();
    }

    disconnectedCallback() {
        if (this.shipSubscription)      unsubscribe(this.shipSubscription);
        if (this.inventorySubscription) unsubscribe(this.inventorySubscription);
        if (this.refreshSubscription)   unsubscribe(this.refreshSubscription);
    }

    get hasInventoryWarning() { return this.inventoryWarning.length > 0; }

    get billingBadgeClass() {
        if (this.billingStatus === 'Invoice Ready')
            return 'slds-badge slds-theme_success';
        if (this.billingStatus === 'Awaiting Delivery')
            return 'slds-badge slds-theme_warning';
        return 'slds-badge';
    }

    get dueDate() {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }
}