import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    // Log de mensajes entrantes
    console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

    // Verificar si la solicitud del webhook contiene un mensaje
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

    // Verificar si el mensaje entrante contiene texto
    if (message?.type === "text") {
      // Extraer el número de teléfono del negocio para enviar la respuesta desde él
      const business_phone_number_id =
        req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

      // Marcar el mensaje entrante como leído
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v18.0/${process.env.WS_ID}/messages`,
        headers: {
          Authorization: `Bearer ${process.env.WEBHOOK_VERIFY_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: message.id,
        },
      });

      // Guardar el mensaje en la API
      await axios({
        method: "POST",
        url: "https://b1marketplace.com:50000/b1s/v2/U_MESSAGES",
        headers: {
          Authorization: "Basic eyJDb21wYW55REIiOiJTQk9EZW1vTVgiLCJVc2VyTmFtZSI6Im1hbmFnZXIifToxMjM0",
          "Content-Type": "application/json",
        },
        data: {
          "U_FROM": message.from,
          "U_TO": null,
          "U_MESSAGE": message.text.body,
        },
      });

      // Enviar una respuesta exitosa
      res.sendStatus(200);
    } else {
      // Si el mensaje no es de texto, responder con un estado 400 Bad Request
      res.sendStatus(400);
    }
  } catch (error) {
    // Manejar errores
    console.error("Error processing webhook request:", error);
    res.sendStatus(500);
  }
});

// El resto de tu código...


// Manejar solicitudes GET en la ruta /webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Verificar si el modo y el token enviados son correctos
  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    // Responder con un estado 200 OK y el token de desafío de la solicitud
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    // Responder con '403 Forbidden' si los tokens de verificación no coinciden
    res.sendStatus(403);
  }
});

// Manejar solicitudes GET en la raíz "/"
app.get("/", (req, res) => {
  // Responder con un mensaje simple
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

// Definir el puerto en el que se ejecutará el servidor
const port = process.env.PORT || 3000;

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor en ejecución en el puerto ${port}`);
});
