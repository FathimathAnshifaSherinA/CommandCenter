import { LightningElement, wire, track } from 'lwc';
import {
    MessageContext,
    publish,
    subscribe,
    unsubscribe,
    APPLICATION_SCOPE
} from 'lightning/messageService';
import INVENTORY_CHANNEL from '@salesforce/messageChannel/InventoryAlert__c';
import REFRESH_CHANNEL   from '@salesforce/messageChannel/RefreshDashboard__c';
import startRequest from '@salesforce/apex/InventoryContinuationCtrl.startRequest';

export default class InventoryPanel extends LightningElement {
    @track inventoryData = null;
    @track isLoading     = true;
    @track hasError      = false;
    @track errorMessage  = '';

    @wire(MessageContext) messageContext;

    refreshSubscription = null;

    connectedCallback() {
        this.loadInventoryData();
        this.refreshSubscription = subscribe(
            this.messageContext, REFRESH_CHANNEL,
            (msg) => this.handleRefresh(msg),
            { scope: APPLICATION_SCOPE }
        );
    }

    handleRefresh(message) {
        console.log('Inventory refresh at:', message.timestamp);
        this.loadInventoryData();
    }

    async loadInventoryData() {
        try {
            this.isLoading     = true;
            this.hasError      = false;
            this.inventoryData = null;

            const result = await startRequest();

            if (result.success) {
                this.inventoryData = result;
                publish(this.messageContext, INVENTORY_CHANNEL, {
                    productId:  result.warehouseId,
                    stockLevel: result.stockLevel,
                    isLowStock: result.isLowStock
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

    get stockLevelClass() {
        if (!this.inventoryData) return '';
        return this.inventoryData.isLowStock
            ? 'slds-text-color_error'
            : 'slds-text-color_success';
    }

    get stockStatusLabel() {
        if (!this.inventoryData) return '';
        return this.inventoryData.isLowStock ? 'Low Stock' : 'In Stock';
    }

    get stockBadgeClass() {
        if (!this.inventoryData) return 'slds-badge';
        return this.inventoryData.isLowStock
            ? 'slds-badge slds-theme_error'
            : 'slds-badge slds-theme_success';
    }
}