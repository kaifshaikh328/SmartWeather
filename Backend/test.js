const { Ollama } = require('ollama');

const ollama = new Ollama({
    host: 'http://127.0.0.1:11434'
});

async function test() {

    try {

        const response = await ollama.chat({
            model: 'phi3',
            messages: [
                {
                    role: 'user',
                    content: 'Analyze air pollution in Pune'
                }
            ]
        });

        console.log(response.message.content);

    } catch (error) {

        console.log("Error:", error.message);

    }
}

test();