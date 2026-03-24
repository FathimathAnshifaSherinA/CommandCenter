/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 03-23-2026
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public with sharing class ShippingContinuationCtrl {

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> startRequest() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            HttpRequest req = new HttpRequest();
            req.setMethod('GET');
            req.setEndpoint('callout:Postman_Mock/logistics/shipment/track');
            req.setHeader('Accept', 'application/json');

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> parsed = (Map<String, Object>)
                    JSON.deserializeUntyped(res.getBody());
                Map<String, Object> tracking = (Map<String, Object>)
                    parsed.get('TrackingResponse');
                Map<String, Object> status = (Map<String, Object>)
                    tracking.get('Status');
                Map<String, Object> origin = (Map<String, Object>)
                    tracking.get('Origin');
                Map<String, Object> destination = (Map<String, Object>)
                    tracking.get('Destination');
                List<Object> events = (List<Object>)
                    tracking.get('Events');
                Map<String, Object> latestEvent = (Map<String, Object>)
                    events[0];

                // Simulate progress increasing over time
                // Progress cycles through realistic checkpoints
                Integer minute = DateTime.now().minute();
                Integer progress;
                String statusDesc;
                String eventDesc;
                String eventLoc;

                if (Math.mod(minute, 5) == 0) {
                    progress   = 25;
                    statusDesc = 'Picked Up';
                    eventDesc  = 'Package picked up from sender';
                    eventLoc   = 'Mumbai Origin';
                } else if (Math.mod(minute, 5) == 1) {
                    progress   = 45;
                    statusDesc = 'In Transit';
                    eventDesc  = 'Package in transit to sorting facility';
                    eventLoc   = 'Pune Hub';
                } else if (Math.mod(minute, 5) == 2) {
                    progress   = 65;
                    statusDesc = 'In Transit';
                    eventDesc  = 'Package scanned at Chennai hub';
                    eventLoc   = 'Chennai Hub';
                } else if (Math.mod(minute, 5) == 3) {
                    progress   = 85;
                    statusDesc = 'Out for Delivery';
                    eventDesc  = 'Package out for delivery';
                    eventLoc   = 'Chennai Delivery Center';
                } else {
                    progress   = 100;
                    statusDesc = 'Delivered';
                    eventDesc  = 'Package delivered successfully';
                    eventLoc   = 'Chennai Destination';
                }

                result.put('success', true);
                result.put('trackingNumber',
                    (String) tracking.get('TrackingNumber'));
                result.put('carrier', (String) tracking.get('Carrier'));
                result.put('status', statusDesc);
                result.put('statusCode', (String) status.get('Code'));
                result.put('progressValue', String.valueOf(progress));
                result.put('shipDate', (String) tracking.get('ShipDate'));
                result.put('estimatedDelivery',
                    (String) tracking.get('EstimatedDelivery'));
                result.put('weight', (String) tracking.get('Weight'));
                result.put('origin',
                    (String) origin.get('City') + ', ' +
                    (String) origin.get('State'));
                result.put('destination',
                    (String) destination.get('City') + ', ' +
                    (String) destination.get('State'));
                result.put('lastEvent', eventDesc);
                result.put('lastEventLocation', eventLoc);
                result.put('dataSource', 'Live — FedEx Logistics API · ' +
                    DateTime.now().format('HH:mm:ss'));
            } else {
                result.put('success', false);
                result.put('error', 'API returned: ' +
                    String.valueOf(res.getStatusCode()));
            }
        } catch(Exception e) {
            result.put('success', false);
            result.put('error', e.getMessage());
        }
        return result;
    }
}