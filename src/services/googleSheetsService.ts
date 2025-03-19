// src/services/googleSheetsService.ts
import { google, sheets_v4 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { SendUserDataProps, SendUserDataWlpProps } from "../type";

const COLUMN_HEADERS = ['Name', 'Email', 'Confirm Email', 'Phone Number'];
const WLP_COLUMN_HEADERS = ['Name', 'Email', 'Phone Number'];

// Initialize Google Sheets API
export async function getGoogleSheetsAuth(): Promise<sheets_v4.Sheets> {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Missing required Google credentials in environment variables');
    }

    const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient() as OAuth2Client;
    return google.sheets({ version: 'v4', auth: authClient });
}

// Initialize sheet with headers if they don't exist
export async function initializeSheetHeaders(sheets: sheets_v4.Sheets, spreadsheetId: string) {
    try {
        // Check if headers exist
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A1:D1',
        });

        const headers = response.data.values?.[0];

        // If no headers or empty first row, add headers
        if (!headers || headers.length === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Sheet1!A1:D1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [COLUMN_HEADERS]
                }
            });

            // Format headers (make them bold and centered)
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            repeatCell: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: 0,
                                    endRowIndex: 1,
                                    startColumnIndex: 0,
                                    endColumnIndex: 4
                                },
                                cell: {
                                    userEnteredFormat: {
                                        textFormat: { bold: true },
                                        horizontalAlignment: 'CENTER',
                                        backgroundColor: {
                                            red: 0.9,
                                            green: 0.9,
                                            blue: 0.9
                                        }
                                    }
                                },
                                fields: 'userEnteredFormat(textFormat,horizontalAlignment,backgroundColor)'
                            }
                        }
                    ]
                }
            });
        }
    } catch (error) {
        console.error('Error initializing headers:', error);
        throw error;
    }
}

// Initialize WLP sheet with headers if they don't exist
// Modified function in googleSheetsService.ts
export async function initializeWlpSheetHeaders(sheets: sheets_v4.Sheets, spreadsheetId: string) {
    try {
        let sheetId = 1; // Default assumption for Sheet2
        
        // First, get spreadsheet metadata to check if Sheet2 exists
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });
        
        // Check if Sheet2 exists
        const sheet2 = spreadsheet.data.sheets?.find(sheet => 
            sheet.properties?.title === 'Sheet2'
        );
        
        if (!sheet2) {
            // Sheet2 doesn't exist, create it
            const response = await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: 'Sheet2',
                                }
                            }
                        }
                    ]
                }
            });
            
            // Extract the new sheet's ID from the response
            sheetId = response.data.replies?.[0].addSheet?.properties?.sheetId || 1;
            
            // Wait a moment for Google Sheets to fully process the new sheet
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            // Sheet2 exists, use its actual ID
            sheetId = sheet2.properties?.sheetId || 1;
        }

        // Now check if headers exist
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet2!A1:C1',
        });

        const headers = response.data.values?.[0];

        // If no headers or empty first row, add headers
        if (!headers || headers.length === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Sheet2!A1:C1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [WLP_COLUMN_HEADERS]
                }
            });

            // Format headers using the correct sheetId
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            repeatCell: {
                                range: {
                                    sheetId: sheetId,
                                    startRowIndex: 0,
                                    endRowIndex: 1,
                                    startColumnIndex: 0,
                                    endColumnIndex: 3
                                },
                                cell: {
                                    userEnteredFormat: {
                                        textFormat: { bold: true },
                                        horizontalAlignment: 'CENTER',
                                        backgroundColor: { 
                                            red: 0.9,
                                            green: 0.9,
                                            blue: 0.9
                                        }
                                    }
                                },
                                fields: 'userEnteredFormat(textFormat,horizontalAlignment,backgroundColor)'
                            }
                        }
                    ]
                }
            });
        }
    } catch (error) {
        console.error('Error initializing WLP headers:', error);
        throw error;
    }
}

// Append data to sheet
export async function appendDataToSheet(spreadsheetId: string, data: SendUserDataProps) {
    try {
        // Get Google Sheets instance
        const sheets = await getGoogleSheetsAuth();

        // Initialize headers if needed
        await initializeSheetHeaders(sheets, spreadsheetId);

        // Append data to the sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:D',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [[
                    data.name,
                    data.email,
                    data.confirmEmail,
                    data.phone
                ]]
            },
        });

        return true;
    } catch (error) {
        console.error('Error appending data:', error);
        throw error;
    }
}

// Append WLP data to sheet
export async function appendWlpDataToSheet(spreadsheetId: string, data: SendUserDataWlpProps) {
    try {
        // Get Google Sheets instance
        const sheets = await getGoogleSheetsAuth();

        // Initialize headers if needed
        await initializeWlpSheetHeaders(sheets, spreadsheetId);

        // Append data to Sheet2
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet2!A:C',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [[
                    data.name,
                    data.email,
                    data.phone
                ]]
            },
        });

        return true;
    } catch (error) {
        console.error('Error appending WLP data:', error);
        throw error;
    }
}