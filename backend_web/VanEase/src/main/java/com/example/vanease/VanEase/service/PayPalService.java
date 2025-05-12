package com.example.vanease.VanEase.service;

import com.paypal.core.PayPalEnvironment;
import com.paypal.core.PayPalHttpClient;
import com.paypal.http.HttpResponse;
import com.paypal.orders.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class PayPalService {

    private final PayPalHttpClient client;

    public PayPalService(
            @Value("${paypal.client.id}") String clientId,
            @Value("${paypal.client.secret}") String clientSecret) {
        PayPalEnvironment environment = new PayPalEnvironment.Sandbox(clientId, clientSecret);
        this.client = new PayPalHttpClient(environment);
    }

    public Order createOrder(double amount, String currency) throws IOException {
        OrderRequest orderRequest = new OrderRequest();
        orderRequest.checkoutPaymentIntent("CAPTURE");

        ApplicationContext applicationContext = new ApplicationContext()
                .brandName("VanEase")
                .landingPage("BILLING")
                .userAction("PAY_NOW");
        orderRequest.applicationContext(applicationContext);

        List<PurchaseUnitRequest> purchaseUnits = new ArrayList<>();
        PurchaseUnitRequest purchaseUnitRequest = new PurchaseUnitRequest()
                .amountWithBreakdown(new AmountWithBreakdown()
                        .currencyCode(currency)
                        .value(String.valueOf(amount)));
        purchaseUnits.add(purchaseUnitRequest);
        orderRequest.purchaseUnits(purchaseUnits);

        OrdersCreateRequest request = new OrdersCreateRequest();
        request.requestBody(orderRequest);

        HttpResponse<Order> response = client.execute(request);
        return response.result();
    }

    public Order captureOrder(String orderId) throws IOException {
        OrdersCaptureRequest request = new OrdersCaptureRequest(orderId);
        HttpResponse<Order> response = client.execute(request);
        return response.result();
    }
} 