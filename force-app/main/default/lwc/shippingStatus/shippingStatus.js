import { LightningElement, wire, track } from 'lwc';
import {
    MessageContext,
    publish,
    subscribe,
    unsubscribe,
    APPLICATION_SCOPE
} from 'lightning/messageService';
import SHIPMENT_CHANNEL from '@salesforce/messageChannel/ShipmentUpdated__c';
import REFRESH_CHANNEL  from '@salesforce/messageChannel/RefreshDashboard__c';
import startRequest from '@salesforce/apex/ShippingContinuationCtrl.startRequest';

export default class ShippingStatus extends LightningElement {
    @track shippingData = null;
    @track isLoading    = true;
    @track hasError     = false;
    @track errorMessage = '';

    @wire(MessageContext) messageContext;

    refreshSubscription = null;

    connectedCallback() {
        this.loadShippingData();
        this.refreshSubscription = subscribe(
            this.messageContext, REFRESH_CHANNEL,
            (msg) => this.handleRefresh(msg),
            { scope: APPLICATION_SCOPE }
        );
    }

    handleRefresh(message) {
        console.log('Shipping refresh at:', message.timestamp);
        this.loadShippingData();
    }

    async loadShippingData() {
        try {
            this.isLoading    = true;
            this.hasError     = false;
            this.shippingData = null;

            const result = await startRequest();

            if (result.success) {
                this.shippingData = result;
                publish(this.messageContext, SHIPMENT_CHANNEL, {
                    trackingNumber: result.trackingNumber,
                    status:         result.status
                });
            } else {
                this.hasError     = true;
                this.errorMessage = result.error;
            }
        } catch (error) {
            this.hasError     = true;
            this.errorMessage = error.body?.message || 'Failed to load';
        } finally {
            this.isLoading = false;
        }
    }

    disconnectedCallback() {
        if (this.refreshSubscription) unsubscribe(this.refreshSubscription);
    }

    get statusBadgeClass() {
        if (!this.shippingData) return 'slds-badge';
        return this.shippingData.status === 'Delivered'
            ? 'slds-badge slds-theme_success'
            : 'slds-badge slds-theme_warning';
    }

    get progressValue() {
        if (!this.shippingData) return 0;
        return this.shippingData.progressValue
            ? parseInt(this.shippingData.progressValue)
            : (this.shippingData.status === 'Delivered' ? 100 : 65);
    }
    get estimatedDelivery() {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }
}