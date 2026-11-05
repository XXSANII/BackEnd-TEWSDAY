// ============================================================================
// Invoices
// ============================================================================

/**
 * @constant  invoiceTypeType
 * @desc      Kinds of invoice: tuition owed by a student, or monthly commission owed by a tutor.
 */
export const invoiceTypeType = {
  STUDENT_TUITION: 'studentTuition',
  TUTOR_COMMISSION: 'tutorCommission',
} as const;
export const invoiceTypeList = Object.values(invoiceTypeType);
export type InvoiceTypeType = (typeof invoiceTypeList)[number];

/**
 * @constant  invoiceStatusType
 * @desc      Stored invoice statuses. Overdue is derived from `unpaid` + `dueDate`, never stored.
 */
export const invoiceStatusType = {
  UNPAID: 'unpaid',
  PENDING_VERIFICATION: 'pendingVerification',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;
export const invoiceStatusList = Object.values(invoiceStatusType);
export type InvoiceStatusType = (typeof invoiceStatusList)[number];

/**
 * @constant  paymentMethodType
 * @desc      Off-platform payment methods. The platform never holds funds.
 */
export const paymentMethodType = {
  BANK_TRANSFER: 'bankTransfer',
  PROMPT_PAY: 'promptPay',
  CASH: 'cash',
  OTHER: 'other',
} as const;
export const paymentMethodList = Object.values(paymentMethodType);
export type PaymentMethodType = (typeof paymentMethodList)[number];
