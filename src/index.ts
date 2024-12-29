import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/send-user-data", (req, res) => {
    console.log("API Hit")
    const body = req.body;
    console.log("Received body:", body);

    res.json({message:"Hello there, this is from vercel."})
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;