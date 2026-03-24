import { LightningElement, wire, track } from 'lwc';
import { MessageContext, publish } from 'lightning/messageService';
import REFRESH_CHANNEL from '@salesforce/messageChannel/RefreshDashboard__c';

export default class CommandCenter extends LightningElement {
    @wire(MessageContext) messageContext;

    @track isRefreshing      = false;
    @track lastRefreshedLabel = 'Never refreshed';

    handleRefreshAll() {
        this.isRefreshing = true;

        publish(this.messageContext, REFRESH_CHANNEL, {
            requestedBy: 'commandCenter',
            timestamp:   new Date().toISOString()
        });

        setTimeout(() => {
            this.isRefreshing      = false;
            const now              = new Date();
            this.lastRefreshedLabel = 'Updated ' +
                now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        }, 2500);
    }
}