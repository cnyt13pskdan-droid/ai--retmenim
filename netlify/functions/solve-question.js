const { OpenAI } = require("openai");

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    try {
        const body = JSON.parse(event.body);
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const visionResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: "Sen samimi, sabırlı ve tecrübeli bir matematik öğretmenisin. Bu görseldeki soruyu öğrencine anlatır gibi adım adım çöz. Matematiksel formülleri, kesirleri ve denklemleri yazarken mutlaka LaTeX formatında kullan (Örn: satır içi için x² = 4, büyük formüller için \\[x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}\\] şeklinde yaz). Önce konuyu hatırlat, sonra adımları net açıkla." },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${body.image}` } }
                ]
            }],
            max_tokens: 1000
        });

        const solutionText = visionResponse.choices.message.content;
        const ttsResponse = await openai.audio.speech.create({
            model: "tts-1", voice: "alloy", input: solutionText
        });

        const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ solution: solutionText, audio: audioBuffer.toString('base64') })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
