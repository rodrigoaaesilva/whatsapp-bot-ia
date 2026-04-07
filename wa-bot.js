const { create } = require('@open-wa/wa-automate');
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

create({
    sessionId: "BOT-DEMO",
    headless: true,
    useChrome: true
})
.then(client => start(client))
.catch(err => console.error("Erro ao iniciar o bot:", err));

async function start(client) {

    console.log('🤖 Bot de atendimento com IA iniciado');

    async function sendMenu(to, name) {
        const text = `Olá, *${name}*!

Bem-vindo ao atendimento automatizado.

Escolha uma opção:

1 • Comercial  
2 • Compras  
3 • Recursos Humanos  
4 • Suporte  
5 • Sobre a empresa  

Digite o número desejado.`;

        await client.sendText(to, text);
    }

    async function responderIA(pergunta) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `
Você é um atendente virtual de uma empresa.

Regras:
- Seja profissional
- Seja objetivo
- Não invente informações
- Direcione dúvidas técnicas para o site institucional
- Direcione solicitações comerciais para o setor comercial
`
                    },
                    {
                        role: "user",
                        content: pergunta
                    }
                ]
            });

            return response.choices[0].message.content;

        } catch (error) {
            console.error("Erro IA:", error?.code || error);

            if (error?.code === 'insufficient_quota') {
                return "SEM_CREDITO";
            }

            return null;
        }
    }

    client.onMessage(async message => {

        if (message.fromMe) return;

        const from = message.from;
        const name = message.sender?.pushname || "Cliente";

        let msg = message.body || "";
        msg = msg.toLowerCase().trim();

        console.log(`Mensagem de ${name}: ${msg}`);

        if (msg === "menu") {
            await sendMenu(from, name);
            return;
        }

        const saudacoes = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite'];

        if (saudacoes.includes(msg)) {
            await sendMenu(from, name);
            return;
        }

        if (['1','2','3','4','5'].includes(msg)) {

            await client.sendText(from, `Você selecionou a opção ${msg}. Em um ambiente real, isso direcionaria para o setor correspondente.`);
            return;
        }

        const resposta = await responderIA(msg);

        if (resposta === "SEM_CREDITO") {
            await client.sendText(from, "Sistema temporariamente indisponível. Digite 'menu' para continuar.");
            return;
        }

        if (resposta) {
            await client.sendText(from, resposta);
        } else {
            await sendMenu(from, name);
        }

    });
}
