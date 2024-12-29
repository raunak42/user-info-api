import app from "../src";

export default app;

// const sendUserData = async (formData: any) => {
//   console.log("Sending user data:", formData);
//   try {
//     const res = await fetch(
//       // `https://user-info-api.vercel.app/send-user-data`,
//       `http://localhost:3000/send-user-data`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       }
//     );
//     const data = await res.json();
//     console.log("User data sent successfully:", data);
//   } catch (error) {
//     console.error("Error sending user data:", error);
//   }
// };