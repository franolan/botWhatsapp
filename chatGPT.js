const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const chat = async (promptBase, userInput) => {
    try {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const openai = new OpenAIApi(configuration);

        const fullPrompt = `${promptBase}

---
Pregunta del usuario: "${userInput}"

IMPORTANTE: Si esta pregunta no está relacionada con el desarrollo de software, bases de datos, lenguajes de programación, normativas o principios de ingeniería de software, responde con el siguiente mensaje:

🚫 Lo siento, esa pregunta no está relacionada con el desarrollo de software.
`;


        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Eres un asistente especializado en desarrollo de software. Tu conocimiento está limitado al contexto proporcionado.",
                },
                {
                    role: "user",
                    content: fullPrompt,
                },
            ],
            temperature: 0.3,
        });

        return completion.data.choices[0].message;
    } catch (err) {
        console.error("Error al conectar con OpenAI:", err);
        return { content: "❌ Error al obtener respuesta del modelo." };
    }
};

module.exports = chat;
