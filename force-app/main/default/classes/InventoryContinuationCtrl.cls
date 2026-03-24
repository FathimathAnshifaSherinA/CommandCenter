/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 03-23-2026
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public with sharing class InventoryContinuationCtrl {

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> startRequest() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            HttpRequest req = new HttpRequest();
            req.setMethod('GET');
            req.setEndpoint('callout:Postman_Mock/aws/inventory/stock');
            req.setHeader('Accept', 'application/json');

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> parsed = (Map<String, Object>)
                    JSON.deserializeUntyped(res.getBody());
                List<Object> items = (List<Object>)
                    parsed.get('InventoryItems');
                Map<String, Object> item = (Map<String, Object>) items[0];
                Map<String, Object> metadata = (Map<String, Object>)
                    parsed.get('ResponseMetadata');

                // Simulate real-time stock fluctuation
                // Stock varies between 20-150 based on current second
                Integer baseStock = Integer.valueOf(
                    String.valueOf(item.get('QuantityOnHand')));
                Integer variation = Math.mod(
                    DateTime.now().second() * 7 +
                    DateTime.now().minute() * 3, 130);
                Integer liveStock = Math.max(20, baseStock - variation + 40);
                Integer reserved  = Math.mod(DateTime.now().second(), 20) + 5;
                Integer available = liveStock - reserved;
                Integer reorderPoint = Integer.valueOf(
                    String.valueOf(item.get('ReorderPoint')));

                result.put('success', true);
                result.put('productName', (String) item.get('ProductName'));
                result.put('brand', (String) item.get('Brand'));
                result.put('skuId', (String) item.get('SkuId'));
                result.put('warehouseId', (String) item.get('WarehouseId'));
                result.put('stockLevel', liveStock);
                result.put('quantityReserved', String.valueOf(reserved));
                result.put('quantityAvailable', String.valueOf(available));
                result.put('storageLocation',
                    (String) item.get('StorageLocation'));
                result.put('reorderPoint', reorderPoint);
                result.put('isLowStock', liveStock < reorderPoint);
                result.put('lastUpdated',
                    DateTime.now().format('yyyy-MM-dd HH:mm:ss') + ' IST');
                result.put('region', (String) metadata.get('Region'));
                result.put('dataSource', 'Live — AWS Inventory API · ' +
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