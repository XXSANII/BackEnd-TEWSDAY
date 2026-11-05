import { db } from '../db';
import { Request } from 'express';

interface LogErrorParams {
  apiName: string;
  req?: Request;
  error: Error;
}

/**
 * ============================================================================
 * @name    logError
 * @desc    Logs error details to the database and console for monitoring and debugging.
 *
 * ============================================================================
 */
export async function logError({ apiName, req, error }: LogErrorParams): Promise<void> {
  try {
    const now = new Date();

    // Log to console
    console.error('=============================================================');
    console.error('\x1b[31m%s\x1b[0m', `[Error Logged] at ${now.toLocaleString()} : ${apiName}`);
    console.error(' > Message :', error.message || 'No error message provided');
    console.error(' > Stack :', error.stack || 'No stack trace available');

    // Log the error to the database
    const errorLog = await db('ErrorLog').insert({
      apiName: apiName || 'Unknown API',
      message: error.message || 'No error message provided',
      stack: error.stack || 'No stack trace available',
    });

    // Verify insertion
    if (!errorLog) {
      console.error(
        ` > [Log Error] Failed to log error to the database from ${apiName} at ${new Date().toLocaleString()}`
      );
    }
  } catch (error) {
    // Log any errors that occur during the logging process
    console.error(` > [Log Error : ${apiName}] Error logging error:`, error);
  }
}
