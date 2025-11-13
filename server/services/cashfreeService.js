// import axios from 'axios';

class CashfreeService {
  constructor() {
    this.apiBaseUrl = process.env.CASHFREE_ENV === 'production' 
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
    
    this.clientId = process.env.CASHFREE_APP_ID;
    this.clientSecret = process.env.CASHFREE_SECRET_KEY;
    this.apiVersion = '2022-09-01';
  }

  async getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-client-id': this.clientId,
      'x-client-secret': this.clientSecret,
      'x-api-version': this.apiVersion
    };
  }

  // Create order in Cashfree
  async createOrder(orderData) {
    try {
      const headers = await this.getHeaders();
      
      const payload = {
        order_id: orderData.orderId,
        order_amount: orderData.amount,
        order_currency: orderData.currency || 'INR',
        order_note: orderData.description,
        customer_details: {
          customer_id: orderData.customerId,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone
        },
        order_meta: {
          return_url: `${process.env.CLIENT_URL}/payment/callback?order_id={order_id}`
        }
      };

      const response = await axios.post(
        `${this.apiBaseUrl}/orders`,
        payload,
        { headers }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Cashfree create order error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get order details
  async getOrder(orderId) {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(
        `${this.apiBaseUrl}/orders/${orderId}`,
        { headers }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Cashfree get order error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get payment details
  async getPayment(orderId) {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(
        `${this.apiBaseUrl}/orders/${orderId}/payments`,
        { headers }
      );

      return {
        success: true,
        data: response.data && response.data.length > 0 ? response.data[0] : null
      };
    } catch (error) {
      console.error('Cashfree get payment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Initiate refund
  async initiateRefund(refundData) {
    try {
      const headers = await this.getHeaders();
      
      const payload = {
        refund_amount: refundData.amount,
        refund_note: refundData.reason,
        refund_id: refundData.refundId
      };

      const response = await axios.post(
        `${this.apiBaseUrl}/orders/${refundData.orderId}/refunds`,
        payload,
        { headers }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Cashfree refund error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get refund status
  async getRefundStatus(orderId, refundId) {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(
        `${this.apiBaseUrl}/orders/${orderId}/refunds/${refundId}`,
        { headers }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Cashfree get refund error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET)
      .update(payload)
      .digest('base64');
    
    return generatedSignature === signature;
  }
}

export default new CashfreeService();