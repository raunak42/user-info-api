// src/controllers/userDataController.ts
import { Request, Response } from "express";
import { appendDataToSheet, appendWlpDataToSheet } from "../services/googleSheetsService";
import { SendUserDataProps, SendUserDataWlpProps } from "../type";

export const sendUserDataToSheet = async (req: Request, res: Response) => {
    try {
        console.log("API Hit: send-user-data");
        const body: SendUserDataProps = req.body;
        console.log("Received body:", body);
        console.log(body.phone);

        if (!process.env.GOOGLE_SHEET_ID) {
            throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
        }

        // Append data to Google Sheet
        await appendDataToSheet(process.env.GOOGLE_SHEET_ID, body);

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
};

export const sendUserDataWlpToSheet = async (req: Request, res: Response) => {
    try {
        console.log("API Hit: send-user-data-wlp");
        const body: SendUserDataWlpProps = req.body;
        console.log("Received WLP body:", body);
        console.log(body.phone);

        if (!process.env.GOOGLE_SHEET_ID) {
            throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
        }

        // Append WLP data to Google Sheet
        await appendWlpDataToSheet(process.env.GOOGLE_SHEET_ID, body);

        res.json({ 
            message: "WLP data successfully saved to Google Sheet",
            data: body 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            message: "Error saving WLP data to Google Sheet",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};