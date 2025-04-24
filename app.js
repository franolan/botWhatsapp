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

// Flow para despedida cuando el usuario escribe "salir"
const flowDespedida = addKeyword("salir")
    .addAnswer("👋 Gracias por usar el chatbot de AI for Developers. ¡Hasta luego y buen código!");

// Flow para manejar preguntas después de la primera
const flowPreguntas = addKeyword(EVENTS.ACTION, { sensitive: true })
    .addAnswer("Procesando tu consulta...", null, async (ctx, ctxFn) => {
        const consulta = ctx.body?.trim();

        if (!consulta) {
            return await ctxFn.flowDynamic("📭 Por favor, escribe tu consulta.");
        }

        const respuesta = await chat(promptConsultas, consulta);

        if (!respuesta || !respuesta.content) {
            return await ctxFn.flowDynamic("❌ Lo siento, ocurrió un error al procesar tu pregunta.");
        }

        await ctxFn.flowDynamic(respuesta.content);
        return await ctxFn.flowDynamic("¿Tienes otra pregunta sobre desarrollo de software? Escribe *salir* si deseas terminar.");
    });


// Primer mensaje de bienvenida
const flowBienvenida = addKeyword(EVENTS.WELCOME)
    .addAnswer("¡Buen día! 🤖 Este es un chatbot sobre *normativas, buenas prácticas y principios fundamentales del desarrollo de software.*", null, async (ctx, ctxFn) => {
        const user = ctx.from;

        if (ctx.hasOwnProperty("saludado") && ctx.saludado) {
            return; // Evita volver a saludar
        }

        ctx.saludado = true; // Marcar como saludado

        await ctxFn.flowDynamic("¿Tienes alguna pregunta al respecto?");
    })
    .addAction(async (ctx, ctxFn) => {
        return ctxFn.gotoFlow(flowPreguntas);
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
