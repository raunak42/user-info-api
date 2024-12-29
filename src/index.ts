import express from "express";
import cors from "cors";
import { google, sheets_v4 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

interface SendUserDataProps {
    name: string;
    email: string;
    confirmEmail: string;
    phone: string;
}

const COLUMN_HEADERS = ['Name', 'Email', 'Confirm Email', 'Phone Number'];

// Initialize Google Sheets API
async function getGoogleSheetsAuth(): Promise<sheets_v4.Sheets> {
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
async function initializeSheetHeaders(sheets: sheets_v4.Sheets, spreadsheetId: string) {
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

app.post("/send-user-data", async (req, res) => {
    try {
        console.log("API Hit");
        const body: SendUserDataProps = req.body;
        console.log("Received body:", body);
        console.log(body.phone)

        if (!process.env.GOOGLE_SHEET_ID) {
            throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
        }

        // Get Google Sheets instance
        const sheets = await getGoogleSheetsAuth();

        // Initialize headers if needed
        await initializeSheetHeaders(sheets, process.env.GOOGLE_SHEET_ID);

        // Find the next empty row
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Sheet1!A:D',
        });

        // Append data to the sheet (after headers)
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Sheet1!A:D',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [[
                    body.name,
                    body.email,
                    body.confirmEmail,
                    body.phone
                ]]
            },
        });

        res.json({ 
            message: "Data successfully saved to Google Sheet",
            data: body 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            message: "Error saving data to Google Sheet",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;