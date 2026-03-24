/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 03-23-2026
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public with sharing class BillingContinuationCtrl {

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> startRequest() {
        Map<String, Object> result = new Map<String, Object>();
        try {
            HttpRequest req = new HttpRequest();
            req.setMethod('GET');
            req.setEndpoint('callout:Postman_Mock/sap/billing/invoice');
            req.setHeader('Accept', 'application/json');

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> parsed = (Map<String, Object>)
                    JSON.deserializeUntyped(res.getBody());

                Map<String, Object> header = (Map<String, Object>)
                    parsed.get('INVOICE_HEADER');
                List<Object> items = (List<Object>)
                    parsed.get('INVOICE_ITEMS');
                Map<String, Object> firstItem = (Map<String, Object>)
                    items[0];
                Map<String, Object> bapi = (Map<String, Object>)
                    parsed.get('BAPI_RETURN');

                // Simulate slight exchange rate fluctuation
                // Rate varies between 93.50 and 94.50
                Integer second = DateTime.now().second();
                Decimal inrRate = 93.50 +
                    (Decimal.valueOf(Math.mod(second * 17, 100)) / 100);
                Decimal totalUSD = Decimal.valueOf(
                    (String) firstItem.get('TOTAL_VALUE'));
                Decimal totalINR = totalUSD * inrRate;

                result.put('success', true);
                result.put('invoiceNumber',
                    (String) header.get('INVOICE_NO'));
                result.put('totalDueUSD', '$' + totalUSD.setScale(2));
                result.put('totalDueINR', '₹' +
                    totalINR.setScale(0).format());
                result.put('exchangeRate', '1 USD = ₹' +
                    inrRate.setScale(2));
                result.put('rateSource', 'SAP BAPI · Live rate · ' +
                    DateTime.now().format('HH:mm:ss'));
                result.put('billingStatus',
                    bapi.get('TYPE') == 'S' ? 'Current' : 'Error');
                result.put('accountName',
                    (String) header.get('CUSTOMER_NAME'));
                result.put('paymentTerms',
                    (String) header.get('PAYMENT_TERMS'));
                result.put('currency',
                    (String) header.get('CURRENCY'));
                result.put('companyCode',
                    (String) header.get('COMPANY_CODE'));
                result.put('documentType',
                    (String) header.get('DOCUMENT_TYPE'));
                result.put('material',
                    (String) firstItem.get('MATERIAL'));
                result.put('description',
                    (String) firstItem.get('DESCRIPTION'));
                result.put('quantity',
                    (String) firstItem.get('QUANTITY'));
                result.put('uom', (String) firstItem.get('UOM'));
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