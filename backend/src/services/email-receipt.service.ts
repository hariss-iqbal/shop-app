import { ReceiptRepository } from '../repositories/receipt.repository';
import { ReceiptSendLogRepository } from '../repositories/receipt-send-log.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { ReceiptSendLogInsert } from '../entities/receipt-send-log.entity';
import {
  SendEmailReceiptDto,
  SendEmailReceiptDirectDto,
  SendEmailReceiptResponseDto,
  RetryEmailReceiptDto,
  RetryEmailReceiptResponseDto,
  EmailReceiptTemplateDataDto,
  StoreConfigDto,
  CustomerReceiptsEmailRequestDto,
  CustomerReceiptsEmailResponseDto
} from '../dto/email-receipt.dto';

/**
 * Email Receipt Service
 * Handles sending receipts via email with professionally formatted HTML
 * Feature: F-021 Email Receipt Option
 */
export class EmailReceiptService {
  private readonly storeConfig: StoreConfigDto;

  constructor(
    private readonly receiptRepository: ReceiptRepository,
    private readonly sendLogRepository: ReceiptSendLogRepository,
    private readonly customerRepository?: CustomerRepository,
    storeConfig?: StoreConfigDto
  ) {
    this.storeConfig = storeConfig || {
      name: 'Phone Shop',
      address: '123 Mobile Street, Tech City',
      phone: '+1 234 567 890',
      email: 'info@phoneshop.com',
      siteUrl: 'http://localhost:4200'
    };
  }

  /**
   * Send a receipt via email using stored receipt data
   * Feature: F-021 Email Receipt Option
   */
  async sendReceiptEmail(dto: SendEmailReceiptDto): Promise<SendEmailReceiptResponseDto> {
    const receipt = await this.receiptRepository.findById(dto.receiptId);
    if (!receipt) {
      return {
        success: false,
        message: 'Receipt not found',
        error: `Receipt with id "${dto.receiptId}" not found`,
        retryable: false
      };
    }

    const templateData = this.buildTemplateData({
      receiptNumber: receipt.receipt_number,
      transactionDate: receipt.transaction_date,
      transactionTime: receipt.transaction_time,
      items: (receipt.items || []).map(item => ({
        name: item.item_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total,
        taxRate: item.tax_rate,
        taxAmount: item.tax_amount
      })),
      subtotal: receipt.subtotal,
      taxRate: receipt.tax_rate,
      taxAmount: receipt.tax_amount,
      grandTotal: receipt.grand_total,
      customerName: dto.recipientName || receipt.customer_name,
      customerPhone: receipt.customer_phone,
      notes: receipt.notes
    });

    try {
      const htmlContent = this.generateEmailHtml(templateData);
      const result = await this.sendEmail(
        dto.recipientEmail,
        `Receipt ${receipt.receipt_number} from ${this.storeConfig.name}`,
        htmlContent
      );

      await this.logSendAttempt(dto.receiptId, 'email', dto.recipientEmail, result.success, result.error);

      return {
        success: result.success,
        message: result.success ? 'Email sent successfully' : 'Failed to send email',
        messageId: result.messageId,
        sentAt: result.success ? new Date().toISOString() : undefined,
        error: result.error,
        retryable: !result.success && result.retryable
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.logSendAttempt(dto.receiptId, 'email', dto.recipientEmail, false, errorMessage);

      return {
        success: false,
        message: 'Failed to send email',
        error: errorMessage,
        retryable: true
      };
    }
  }

  /**
   * Send a receipt via email directly (without stored receipt)
   * Useful for sending immediately after a sale without storing the receipt first
   * Feature: F-021 Email Receipt Option
   */
  async sendReceiptEmailDirect(dto: SendEmailReceiptDirectDto): Promise<SendEmailReceiptResponseDto> {
    const templateData = this.buildTemplateData({
      receiptNumber: dto.receiptNumber,
      transactionDate: dto.transactionDate,
      transactionTime: dto.transactionTime,
      items: dto.items,
      subtotal: dto.subtotal,
      taxRate: dto.taxRate,
      taxAmount: dto.taxAmount,
      grandTotal: dto.grandTotal,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      notes: dto.notes,
      payments: dto.payments
    });

    try {
      const htmlContent = this.generateEmailHtml(templateData);
      const result = await this.sendEmail(
        dto.recipientEmail,
        `Receipt ${dto.receiptNumber} from ${this.storeConfig.name}`,
        htmlContent
      );

      return {
        success: result.success,
        message: result.success ? 'Email sent successfully' : 'Failed to send email',
        messageId: result.messageId,
        sentAt: result.success ? new Date().toISOString() : undefined,
        error: result.error,
        retryable: !result.success && result.retryable
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: 'Failed to send email',
        error: errorMessage,
        retryable: true
      };
    }
  }

  /**
   * Retry a failed email send
   * Feature: F-021 Email Receipt Option
   */
  async retryFailedSend(dto: RetryEmailReceiptDto): Promise<RetryEmailReceiptResponseDto> {
    const sendLog = await this.sendLogRepository.findById(dto.sendLogId);
    if (!sendLog) {
      return {
        success: false,
        message: 'Send log not found',
        error: `Send log with id "${dto.sendLogId}" not found`
      };
    }

    if (sendLog.status === 'sent') {
      return {
        success: false,
        message: 'Cannot retry a successful send',
        error: 'This email was already sent successfully'
      };
    }

    if (sendLog.channel !== 'email') {
      return {
        success: false,
        message: 'This send log is not for email channel',
        error: `Cannot retry send for channel "${sendLog.channel}"`
      };
    }

    if (!sendLog.recipient_email) {
      return {
        success: false,
        message: 'No recipient email found in send log',
        error: 'Recipient email is required for retry'
      };
    }

    const receipt = await this.receiptRepository.findById(sendLog.receipt_id);
    if (!receipt) {
      return {
        success: false,
        message: 'Receipt no longer exists',
        error: `Receipt with id "${sendLog.receipt_id}" not found`
      };
    }

    await this.sendLogRepository.update(sendLog.id, { status: 'pending' });

    const result = await this.sendReceiptEmail({
      receiptId: sendLog.receipt_id,
      recipientEmail: sendLog.recipient_email
    });

    if (result.success) {
      await this.sendLogRepository.update(sendLog.id, {
        status: 'sent',
        error_message: null
      });
    } else {
      await this.sendLogRepository.update(sendLog.id, {
        status: 'failed',
        error_message: result.error || 'Unknown error'
      });
    }

    return {
      success: result.success,
      message: result.message,
      sendLog: result.success ? {
        id: sendLog.id,
        receiptId: sendLog.receipt_id,
        status: 'sent',
        sentAt: new Date().toISOString()
      } : undefined,
      error: result.error
    };
  }

  /**
   * Send recent receipts to a customer by email
   * Feature: F-021 Email Receipt Option
   */
  async sendCustomerReceipts(dto: CustomerReceiptsEmailRequestDto): Promise<CustomerReceiptsEmailResponseDto> {
    if (!this.customerRepository) {
      return {
        success: false,
        message: 'Customer repository not available',
        sentCount: 0,
        failedCount: 0,
        results: []
      };
    }

    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
        sentCount: 0,
        failedCount: 0,
        results: []
      };
    }

    const receipts = await this.receiptRepository.findByCustomerPhone(customer.phone);
    if (receipts.length === 0) {
      return {
        success: false,
        message: 'No receipts found for this customer',
        sentCount: 0,
        failedCount: 0,
        results: []
      };
    }

    const receiptIdsToSend = dto.receiptIds
      ? receipts.filter(r => dto.receiptIds?.includes(r.id))
      : receipts.slice(0, 10);

    const results: Array<{
      receiptId: string;
      receiptNumber: string;
      success: boolean;
      error?: string;
    }> = [];

    let sentCount = 0;
    let failedCount = 0;

    for (const receipt of receiptIdsToSend) {
      const result = await this.sendReceiptEmail({
        receiptId: receipt.id,
        recipientEmail: dto.recipientEmail,
        recipientName: customer.name
      });

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      results.push({
        receiptId: receipt.id,
        receiptNumber: receipt.receipt_number,
        success: result.success,
        error: result.error
      });
    }

    return {
      success: sentCount > 0,
      message: sentCount > 0
        ? `Successfully sent ${sentCount} receipt${sentCount > 1 ? 's' : ''}`
        : 'Failed to send any receipts',
      sentCount,
      failedCount,
      results
    };
  }

  /**
   * Validate email address format
   */
  isValidEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Build template data from receipt information
   */
  private buildTemplateData(data: {
    receiptNumber: string;
    transactionDate: string;
    transactionTime: string;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
      taxRate?: number;
      taxAmount?: number;
    }>;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    grandTotal: number;
    customerName?: string | null;
    customerPhone?: string | null;
    notes?: string | null;
    payments?: Array<{
      method: string;
      amount: number;
      cardLastFour?: string | null;
      transactionReference?: string | null;
    }>;
  }): EmailReceiptTemplateDataDto {
    return {
      storeName: this.storeConfig.name,
      storeAddress: this.storeConfig.address,
      storePhone: this.storeConfig.phone,
      storeEmail: this.storeConfig.email,
      receiptNumber: data.receiptNumber,
      transactionDate: data.transactionDate,
      transactionTime: data.transactionTime,
      items: data.items,
      subtotal: data.subtotal,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount,
      grandTotal: data.grandTotal,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      notes: data.notes,
      payments: data.payments,
      receiptLookupUrl: `${this.storeConfig.siteUrl}/receipt/${encodeURIComponent(data.receiptNumber)}`,
      year: new Date().getFullYear()
    };
  }

  /**
   * Generate professionally formatted HTML email content
   * Feature: F-021 Email Receipt Option
   */
  private generateEmailHtml(data: EmailReceiptTemplateDataDto): string {
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    };

    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-family: Arial, sans-serif; font-size: 14px; color: #333333;">
          ${escapeHtml(item.name)}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-family: Arial, sans-serif; font-size: 14px; color: #333333; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-family: Arial, sans-serif; font-size: 14px; color: #333333; text-align: right;">
          ${formatCurrency(item.unitPrice)}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; font-family: Arial, sans-serif; font-size: 14px; color: #333333; text-align: right; font-weight: 500;">
          ${formatCurrency(item.total)}
        </td>
      </tr>
    `).join('');

    const taxHtml = data.taxAmount > 0 ? `
      <tr>
        <td colspan="3" style="padding: 8px 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666; text-align: right;">
          Tax (${data.taxRate.toFixed(1)}%)
        </td>
        <td style="padding: 8px 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666; text-align: right;">
          ${formatCurrency(data.taxAmount)}
        </td>
      </tr>
    ` : '';

    const paymentsHtml = data.payments && data.payments.length > 0 ? `
      <div style="margin-top: 24px; padding: 16px; background-color: #f9f9f9; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; color: #333333;">
          Payment${data.payments.length > 1 ? 's' : ''}
        </h3>
        ${data.payments.map(payment => `
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-family: Arial, sans-serif; font-size: 13px; color: #666666;">
            <span>
              ${escapeHtml(payment.method)}
              ${payment.cardLastFour ? ` (**** ${payment.cardLastFour})` : ''}
            </span>
            <span style="font-weight: 500; color: #333333;">${formatCurrency(payment.amount)}</span>
          </div>
          ${payment.transactionReference ? `
            <div style="font-size: 11px; color: #999999; padding-left: 8px;">
              Ref: ${escapeHtml(payment.transactionReference)}
            </div>
          ` : ''}
        `).join('')}
      </div>
    ` : '';

    const customerHtml = data.customerName || data.customerPhone ? `
      <div style="margin-top: 24px; padding: 16px; background-color: #f0f7ff; border-radius: 8px;">
        <h3 style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; color: #333333;">
          Customer Information
        </h3>
        ${data.customerName ? `
          <div style="font-family: Arial, sans-serif; font-size: 13px; color: #666666;">
            ${escapeHtml(data.customerName)}
          </div>
        ` : ''}
        ${data.customerPhone ? `
          <div style="font-family: Arial, sans-serif; font-size: 13px; color: #666666;">
            Tel: ${escapeHtml(data.customerPhone)}
          </div>
        ` : ''}
      </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt ${escapeHtml(data.receiptNumber)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; color: #ffffff;">
                ${escapeHtml(data.storeName)}
              </h1>
              <p style="margin: 8px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; color: rgba(255,255,255,0.9);">
                ${escapeHtml(data.storeAddress)}
              </p>
              <p style="margin: 4px 0 0 0; font-family: Arial, sans-serif; font-size: 13px; color: rgba(255,255,255,0.8);">
                ${escapeHtml(data.storePhone)} | ${escapeHtml(data.storeEmail)}
              </p>
            </td>
          </tr>

          <!-- Receipt Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">

              <!-- Receipt Header -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 24px; border-bottom: 2px solid #e0e0e0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          <h2 style="margin: 0; font-family: Arial, sans-serif; font-size: 20px; font-weight: 600; color: #2563eb;">
                            Receipt
                          </h2>
                          <p style="margin: 4px 0 0 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: 500; color: #333333;">
                            #${escapeHtml(data.receiptNumber)}
                          </p>
                        </td>
                        <td style="text-align: right;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666;">
                            ${escapeHtml(data.transactionDate)}
                          </p>
                          <p style="margin: 4px 0 0 0; font-family: Arial, sans-serif; font-size: 13px; color: #999999;">
                            ${escapeHtml(data.transactionTime)}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <thead>
                  <tr>
                    <th style="padding: 12px 0; border-bottom: 2px solid #333333; font-family: Arial, sans-serif; font-size: 12px; font-weight: 600; color: #333333; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">
                      Item
                    </th>
                    <th style="padding: 12px 0; border-bottom: 2px solid #333333; font-family: Arial, sans-serif; font-size: 12px; font-weight: 600; color: #333333; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
                      Qty
                    </th>
                    <th style="padding: 12px 0; border-bottom: 2px solid #333333; font-family: Arial, sans-serif; font-size: 12px; font-weight: 600; color: #333333; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">
                      Price
                    </th>
                    <th style="padding: 12px 0; border-bottom: 2px solid #333333; font-family: Arial, sans-serif; font-size: 12px; font-weight: 600; color: #333333; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 12px 0 8px 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666; text-align: right;">
                      Subtotal
                    </td>
                    <td style="padding: 12px 0 8px 0; font-family: Arial, sans-serif; font-size: 14px; color: #666666; text-align: right;">
                      ${formatCurrency(data.subtotal)}
                    </td>
                  </tr>
                  ${taxHtml}
                  <tr>
                    <td colspan="3" style="padding: 16px 0; border-top: 2px solid #333333; font-family: Arial, sans-serif; font-size: 18px; font-weight: 700; color: #333333; text-align: right;">
                      TOTAL
                    </td>
                    <td style="padding: 16px 0; border-top: 2px solid #333333; font-family: Arial, sans-serif; font-size: 18px; font-weight: 700; color: #2563eb; text-align: right;">
                      ${formatCurrency(data.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              ${paymentsHtml}
              ${customerHtml}

            </td>
          </tr>

          <!-- View Online Button -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 32px 32px 32px; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; text-align: center;">
              <a href="${escapeHtml(data.receiptLookupUrl)}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                View Receipt Online
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none; text-align: center;">
              <p style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; color: #333333;">
                Thank you for your purchase!
              </p>
              <p style="margin: 0 0 16px 0; font-family: Arial, sans-serif; font-size: 13px; color: #666666;">
                Please keep this email for your records.
              </p>
              <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #999999;">
                Questions? Contact us at ${escapeHtml(data.storeEmail)} or ${escapeHtml(data.storePhone)}
              </p>
              <p style="margin: 16px 0 0 0; font-family: Arial, sans-serif; font-size: 11px; color: #cccccc;">
                © ${data.year} ${escapeHtml(data.storeName)}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Send email using Supabase Edge Functions or external provider
   *
   * PRODUCTION INTEGRATION GUIDE:
   * This is a mock implementation for development. To enable real email sending:
   *
   * Option 1: Supabase Edge Functions (Recommended)
   *   - Create an Edge Function that uses Resend, SendGrid, or AWS SES
   *   - Call it via: await supabase.functions.invoke('send-email', { body: { to, subject, htmlContent } })
   *
   * Option 2: Direct API Integration
   *   - Install your provider's SDK (e.g., @sendgrid/mail, resend)
   *   - Configure API keys via environment variables
   *   - Replace the mock implementation below with actual API calls
   *
   * The mock implementation logs emails to console and returns success,
   * allowing full end-to-end testing of the email receipt workflow.
   */
  private async sendEmail(
    to: string,
    subject: string,
    htmlContent: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; retryable?: boolean }> {
    // Mock implementation - simulates successful email delivery for development
    // Replace with actual email provider integration for production

    try {
      // Validate email
      if (!this.isValidEmail(to)) {
        return {
          success: false,
          error: 'Invalid email address',
          retryable: false
        };
      }

      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate a mock message ID
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      console.log(`[EmailReceiptService] Email sent to ${to}`);
      console.log(`[EmailReceiptService] Subject: ${subject}`);
      console.log(`[EmailReceiptService] Message ID: ${messageId}`);

      return {
        success: true,
        messageId
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      return {
        success: false,
        error: errorMessage,
        retryable: true
      };
    }
  }

  /**
   * Log send attempt to the receipt_send_logs table
   */
  private async logSendAttempt(
    receiptId: string,
    channel: 'email',
    recipientEmail: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      const logInsert: ReceiptSendLogInsert = {
        receipt_id: receiptId,
        channel,
        recipient_email: recipientEmail.trim(),
        recipient_phone: null,
        status: success ? 'sent' : 'failed',
        error_message: errorMessage || null
      };

      await this.sendLogRepository.create(logInsert);
    } catch (error) {
      console.error('[EmailReceiptService] Failed to log send attempt:', error);
    }
  }

  /**
   * Get failed email sends for a receipt (for retry functionality)
   */
  async getFailedSendsForReceipt(receiptId: string): Promise<Array<{
    id: string;
    recipientEmail: string;
    errorMessage: string | null;
    createdAt: string;
  }>> {
    const logs = await this.sendLogRepository.findByReceiptId(receiptId);
    return logs
      .filter(log => log.channel === 'email' && log.status === 'failed')
      .map(log => ({
        id: log.id,
        recipientEmail: log.recipient_email || '',
        errorMessage: log.error_message,
        createdAt: log.created_at
      }));
  }
}
