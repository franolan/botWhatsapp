const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
require("dotenv").config();

const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

const path = require("path");
const fs = require("fs");
const chat = require("./chatGPT");

const pathConsultas = path.join(__dirname, "mensajes", "promptConsultas.txt");
const promptConsultas = fs.readFileSync(pathConsultas, "utf8");

const esConsultaRelevante = async (texto) => {
    const promptValidacion = `
Eres un asistente experto en desarrollo de software. Tu tarea es responder únicamente si la siguiente consulta está relacionada con normativas, buenas prácticas o principios del desarrollo de software.

Consulta: "${texto}"

Responde únicamente con "sí" si es relevante, o "no" si no lo es.
    `;
    const respuesta = await chat(promptValidacion, texto);
    return respuesta.content.toLowerCase().includes("sí");
};

const flowDespedida = addKeyword("salir")
    .addAnswer("👋 Gracias por usar el chatbot de AI for Developers. ¡Hasta luego!");

const flowPreguntas = addKeyword(EVENTS.ACTION)
    .addAnswer("Procesando tu consulta...", null, async (ctx, ctxFn) => {
        const consulta = ctx.body;

        const esValida = await esConsultaRelevante(consulta);
        if (!esValida) {
            return await ctxFn.flowDynamic("Lo siento, tu pregunta no parece estar relacionada con normativas, buenas prácticas o principios del desarrollo de software.");
        }

        const respuesta = await chat(promptConsultas, consulta);

        if (!respuesta || !respuesta.content) {
            return await ctxFn.flowDynamic("No pude encontrar una respuesta adecuada. Intenta reformular tu pregunta.");
        }

        await ctxFn.flowDynamic(respuesta.content);
        await ctxFn.flowDynamic("¿Tienes otra pregunta sobre desarrollo de software? Escribe *salir* para terminar.");
    });

const flowBienvenida = addKeyword(EVENTS.WELCOME)
    .addAnswer("¡Buen día! 🤖 Este es un chatbot sobre *normativas, buenas prácticas y principios del desarrollo de software.*")
    .addAnswer("¿Tienes alguna pregunta al respecto?", { capture: true }, async (ctx, ctxFn) => {
        const consulta = ctx.body;

        const esValida = await esConsultaRelevante(consulta);
        if (!esValida) {
            return await ctxFn.flowDynamic("Lo siento, tu pregunta no parece estar relacionada con normativas, buenas prácticas o principios del desarrollo de software.");
        }

        const respuesta = await chat(promptConsultas, consulta);

        if (!respuesta || !respuesta.content) {
            return await ctxFn.flowDynamic("No pude encontrar una respuesta adecuada. Intenta reformular tu pregunta.");
        }

        await ctxFn.flowDynamic(respuesta.content);
        await ctxFn.flowDynamic("¿Tienes otra pregunta sobre desarrollo de software? Escribe *salir* para terminar.");
    });

const main = async () => {
    const adapterFlow = createFlow([flowBienvenida, flowPreguntas, flowDespedida]);
    const adapterProvider = createProvider(BaileysProvider);
    const adapterDB = new MockAdapter();

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();
