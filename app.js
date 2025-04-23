const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
require("dotenv").config();

const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

const path = require("path");
const fs = require("fs");
const chat = require("./chatGPT");

const pathConsultas = path.join(__dirname, "promptConsultas.txt");
const promptConsultas = fs.readFileSync(pathConsultas, "utf8");

const validarConsultaRelevante = (respuesta) => {
    const palabrasClave = ["normativas", "prácticas", "principios", "desarrollo", "software"];
    return palabrasClave.some(palabra => respuesta.toLowerCase().includes(palabra)) || respuesta.length > 50;
};

const flowDespedida = addKeyword("salir")
    .addAnswer("👋 Gracias por usar el chatbot de AI for Developers. ¡Hasta luego y buen código!");

const flowPreguntas = addKeyword(EVENTS.ACTION)
    .addAnswer("Procesando tu consulta...", null, async (ctx, ctxFn) => {
        const consulta = ctx.body;
        const respuesta = await chat(promptConsultas, consulta);

        if (
            !respuesta ||
            !respuesta.content ||
            !validarConsultaRelevante(respuesta.content) 
        ) {
            return await ctxFn.flowDynamic("Lo siento, tu pregunta no parece estar relacionada con el tema del desarrollo de software.");
        }

        await ctxFn.flowDynamic(respuesta.content);
        await ctxFn.flowDynamic("¿Tienes alguna otra pregunta sobre normativas, buenas prácticas o principios del desarrollo de software?\nEscribe *salir* si ya no tienes más preguntas.");
    });

const flowBienvenida = addKeyword(EVENTS.WELCOME)
    .addAnswer("¡Buen día! 🤖 Este es un chatbot sobre *normativas, buenas prácticas y principios fundamentales del desarrollo de software.*")
    .addAnswer("¿Tienes alguna pregunta al respecto?", { capture: true }, async (ctx, ctxFn) => {
        const consulta = ctx.body;
        const respuesta = await chat(promptConsultas, consulta);

        if (
            !respuesta ||
            !respuesta.content ||
            !validarConsultaRelevante(respuesta.content) 
        ) {
            return await ctxFn.flowDynamic("Lo siento, tu pregunta no parece estar relacionada con el tema del desarrollo de software.");
        }

        await ctxFn.flowDynamic(respuesta.content);
        await ctxFn.flowDynamic("¿Tienes alguna otra pregunta sobre normativas, buenas prácticas o principios del desarrollo de software?\nEscribe *salir* si ya no tienes más preguntas.");
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
