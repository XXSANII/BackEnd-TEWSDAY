import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { auditUpdate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { File, Invoice, InvoiceItem } from '@/types/db';
import { UserPayload } from '@/types/express';
import { invoiceStatusType, paymentMethodType } from '@/constants/billing.constants';
import {
  GetInvoiceParams,
  GetInvoiceResponse,
  SearchInvoiceInput,
  SearchInvoiceResponse,
  searchInvoiceValidSortKeys,
  UploadInvoiceSlipInput,
  UploadInvoiceSlipParams,
  UploadInvoiceSlipResponse,
} from './invoice.validation';

/**
 * ============================================================================
 * @name    me_009_s
 * @desc    Search invoices where the authenticated user is payer or payee.
 *
 * ============================================================================
 */
export async function searchInvoice(
  input: SearchInvoiceInput,
  user: UserPayload
): Promise<SearchInvoiceResponse> {
  // Build query
  let query = db('Invoice')
    .select(
      'invoiceId',
      'invoiceNumber',
      'invoiceType',
      'bookingId',
      'classSessionId',
      'payerUserId',
      'payeeUserId',
      'amount',
      'commissionFee',
      'status',
      'paymentMethod',
      'slipFileId',
      'dueDate',
      'paidAt',
      'createdAt'
    )
    .where({ isActiveFlag: true })
    .andWhere((qb) => {
      qb.where('payerUserId', user.userId).orWhere('payeeUserId', user.userId);
    });

  // Apply filters
  if (input.invoiceType) {
    query = query.where({ invoiceType: input.invoiceType });
  }
  if (input.status) {
    query = query.where({ status: input.status });
  }

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchInvoiceValidSortKeys,
  });

  // Apply pagination
  const totalCountResult = await query.clone().clearSelect().clearOrder().count().first<{ count: string }>();
  const totalCount = parseInt(totalCountResult?.count || '0', 10);
  const pagination = calculatePagination({
    pageNumber: input.pageNumber,
    pageSize: input.pageSize,
    total: totalCount,
    pageAll: input.pageAll,
  });
  query = applyPagination({
    query,
    pageNumber: pagination.currentPage,
    pageSize: pagination.pageSize,
  });

  // Execute the query
  const invoices: Invoice[] = await query;

  // Return result
  const returnResult: SearchInvoiceResponse = {
    total: totalCount,
    pagination,
    data: invoices.map((inv) => ({
      invoiceId: inv.invoiceId,
      invoiceNumber: inv.invoiceNumber,
      invoiceType: inv.invoiceType,
      bookingId: inv.bookingId || null,
      classSessionId: inv.classSessionId || null,
      payerUserId: inv.payerUserId,
      payeeUserId: inv.payeeUserId,
      amount: Number(inv.amount),
      commissionFee: Number(inv.commissionFee),
      status: inv.status,
      paymentMethod: inv.paymentMethod || null,
      slipFileId: inv.slipFileId || null,
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString() : null,
      paidAt: inv.paidAt ? new Date(inv.paidAt).toISOString() : null,
      createdAt: new Date(inv.createdAt).toISOString(),
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    me_009_g
 * @desc    Retrieve detailed information and line items of an invoice.
 *
 * ============================================================================
 */
export async function getInvoice(params: GetInvoiceParams, user: UserPayload): Promise<GetInvoiceResponse> {
  // Check existing data
  const invoice = await db('Invoice')
    .where({ invoiceId: params.invoiceId, isActiveFlag: true })
    .first<Invoice>();
  if (!invoice) {
    throw new ApiError(404, 'me_009_g_s_01', 'Invoice not found or inactive.');
  }

  if (invoice.payerUserId !== user.userId && invoice.payeeUserId !== user.userId && user.role !== 'admin') {
    throw new ApiError(403, 'me_009_g_s_02', 'You do not have permission to view this invoice.');
  }

  // Build query
  const items = await db('InvoiceItem')
    .select('invoiceItemId', 'classSessionId', 'sessionGrossAmount', 'commissionRate', 'commissionAmount')
    .where({
      invoiceId: invoice.invoiceId,
      isActiveFlag: true,
    });

  // Return result
  return {
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    invoiceType: invoice.invoiceType,
    bookingId: invoice.bookingId || null,
    classSessionId: invoice.classSessionId || null,
    payerUserId: invoice.payerUserId,
    payeeUserId: invoice.payeeUserId,
    billingPeriodStart: invoice.billingPeriodStart ? new Date(invoice.billingPeriodStart).toISOString() : null,
    billingPeriodEnd: invoice.billingPeriodEnd ? new Date(invoice.billingPeriodEnd).toISOString() : null,
    commissionRateSnapshot: invoice.commissionRateSnapshot != null ? Number(invoice.commissionRateSnapshot) : null,
    amount: Number(invoice.amount),
    commissionFee: Number(invoice.commissionFee),
    status: invoice.status,
    paymentMethod: invoice.paymentMethod || null,
    slipFileId: invoice.slipFileId || null,
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
    paidAt: invoice.paidAt ? new Date(invoice.paidAt).toISOString() : null,
    verifiedBy: invoice.verifiedBy || null,
    createdAt: new Date(invoice.createdAt).toISOString(),
    items: items.map((item: InvoiceItem) => ({
      invoiceItemId: item.invoiceItemId,
      classSessionId: item.classSessionId,
      sessionGrossAmount: Number(item.sessionGrossAmount),
      commissionRate: Number(item.commissionRate),
      commissionAmount: Number(item.commissionAmount),
    })),
  };
}

/**
 * ============================================================================
 * @name    me_009_slip_c
 * @desc    Attach a payment slip to an invoice and set status to pending verification.
 *
 * ============================================================================
 */
export async function uploadInvoiceSlip(
  params: UploadInvoiceSlipParams,
  input: UploadInvoiceSlipInput,
  user: UserPayload
): Promise<UploadInvoiceSlipResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const invoice = await trx('Invoice')
      .where({ invoiceId: params.invoiceId, isActiveFlag: true })
      .first<Invoice>();
    if (!invoice) {
      throw new ApiError(404, 'me_009_slip_c_s_01', 'Invoice not found or inactive.');
    }

    if (invoice.payerUserId !== user.userId) {
      throw new ApiError(403, 'me_009_slip_c_s_02', 'Only the designated payer can attach a payment slip.');
    }

    const slipFile = await trx('File')
      .where({ fileId: input.slipFileId, isActiveFlag: true })
      .first<File>();
    if (!slipFile) {
      throw new ApiError(404, 'me_009_slip_c_s_03', 'Payment slip file not found or inactive.');
    }

    // Update data
    const now = new Date();
    const [updatedInvoice] = await trx('Invoice')
      .where({ invoiceId: invoice.invoiceId })
      .update({
        slipFileId: input.slipFileId,
        paymentMethod: input.paymentMethod || paymentMethodType.PROMPT_PAY,
        status: invoiceStatusType.PENDING_VERIFICATION,
        paidAt: now,
        ...auditUpdate(user.userLogName),
      })
      .returning<Invoice[]>('*');
    if (!updatedInvoice) {
      throw new ApiError(500, 'me_009_slip_c_s_04', 'Failed to attach payment slip.');
    }

    // Return result
    return {
      invoiceId: updatedInvoice.invoiceId,
      status: updatedInvoice.status,
      slipFileId: updatedInvoice.slipFileId || input.slipFileId,
      paidAt: new Date(updatedInvoice.paidAt || now).toISOString(),
    };
  });
}
