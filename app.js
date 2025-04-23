const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require("dotenv").config()

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')

const path = require("path")
const fs = require("fs")
const chat = require("./chatGPT")

const pathConsultas = path.join(__dirname, "mensajes", "promptConsultas.txt")
const promptConsultas = fs.readFileSync(pathConsultas, "utf8")

const flowPrincipal = addKeyword(EVENTS.MESSAGE)
    .addAnswer(
        "👋 ¡Buen día! Este es un chatbot sobre:\n\n📘 *Normativas*, 🛠️ *mejores prácticas* y 🧠 *principios fundamentales del desarrollo de software*.\n\n¿Tienes alguna pregunta sobre estos temas?",
        { delay: 200 }
    )
    .addAction(async (ctx, ctxFn) => {
        const consulta = ctx.body
        try {
            const respuesta = await chat(promptConsultas, consulta)

            // Si la respuesta está vacía o no es relevante
            if (
                !respuesta?.content ||
                respuesta.content.toLowerCase().includes("no puedo ayudarte") ||
                respuesta.content.toLowerCase().includes("no entiendo") ||
                respuesta.content.trim() === ""
            ) {
                await ctxFn.flowDynamic("⚠️ Solo puedo responder preguntas sobre *normativas, buenas prácticas* y *principios del desarrollo de software*. Intenta reformular tu consulta dentro de esos temas.")
            } else {
                await ctxFn.flowDynamic(respuesta.content)
            }
        } catch (error) {
            console.error("Error procesando la respuesta:", error)
            await ctxFn.flowDynamic("Ocurrió un error al procesar tu consulta. Intenta más tarde.")
        }
    })

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()

