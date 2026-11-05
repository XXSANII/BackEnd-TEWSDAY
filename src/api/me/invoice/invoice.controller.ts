import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as invoiceService from './invoice.service';
import {
  getInvoiceSchema,
  searchInvoiceSchema,
  uploadInvoiceSlipSchema,
} from './invoice.validation';

/**
 * ============================================================================
 * @name    searchInvoice
 * @code    me_009_s
 * @route   POST /api/v1/me/invoices/search
 * @desc    Search invoices where the authenticated user is payer or payee.
 *
 * ============================================================================
 */
export const searchInvoiceHandler = asyncHandler('me_009_s', async (req) => {
  // Validate request body
  const { body } = searchInvoiceSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const searchResult = await invoiceService.searchInvoice(body, user);

  // Send response
  return { message: 'Invoices searched successfully.', data: searchResult };
});

/**
 * ============================================================================
 * @name    getInvoice
 * @code    me_009_g
 * @route   GET /api/v1/me/invoices/:invoiceId/get
 * @desc    Retrieve detailed information and line items of an invoice.
 *
 * ============================================================================
 */
export const getInvoiceHandler = asyncHandler('me_009_g', async (req) => {
  // Recheck request info
  const { params } = getInvoiceSchema.parse(req);
  if (!params.invoiceId) {
    throw new Error('Invoice info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const invoice = await invoiceService.getInvoice(params, user);

  // Send response
  return { message: 'Invoice retrieved successfully.', data: invoice };
});

/**
 * ============================================================================
 * @name    uploadInvoiceSlip
 * @code    me_009_slip_c
 * @route   POST /api/v1/me/invoices/:invoiceId/slip/upload
 * @desc    Attach a payment slip to an invoice and set status to pending verification.
 *
 * ============================================================================
 */
export const uploadInvoiceSlipHandler = asyncHandler('me_009_slip_c', async (req) => {
  // Validate request body
  const { params, body } = uploadInvoiceSlipSchema.parse(req);
  if (!params.invoiceId) {
    throw new Error('Invoice info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const uploadedSlip = await invoiceService.uploadInvoiceSlip(params, body, user);

  // Send response
  return { message: 'Invoice payment slip uploaded successfully.', data: uploadedSlip };
});
