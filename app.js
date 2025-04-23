const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
require("dotenv").config();

const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

const path = require("path");
const fs = require("fs");
const chat = require("./chatGPT");

// Cargar el prompt
const pathConsultas = path.join(__dirname, "mensajes", "promptConsultas.txt");
const promptConsultas = fs.readFileSync(pathConsultas, "utf8");

// Flujo de bienvenida y manejo de consulta
const flowConsultas = addKeyword(EVENTS.WELCOME)
    .addAnswer(
        "¡Buen día! 🤖 Este es un chatbot sobre *normativas, buenas prácticas y principios fundamentales del desarrollo de software.* ¿Tienes alguna pregunta al respecto?",
        { capture: true },
        async (ctx, ctxFn) => {
            const consulta = ctx.body;
            const respuesta = await chat(promptConsultas, consulta);

            if (
                !respuesta ||
                !respuesta.content ||
                respuesta.content.toLowerCase().includes("no tengo información") ||
                respuesta.content.length < 10
            ) {
                return await ctxFn.flowDynamic("🚫 Lo siento, tu pregunta parece no estar relacionada con el tema del desarrollo de software. Intenta reformularla con foco en *normativas, buenas prácticas o principios fundamentales.*");
            }

            await ctxFn.flowDynamic(respuesta.content);
        }
    );

const main = async () => {
    const adapterFlow = createFlow([flowConsultas]);
    const adapterProvider = createProvider(BaileysProvider);
    const adapterDB = new MockAdapter(); // Requerido aunque no uses una base de datos real

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();
