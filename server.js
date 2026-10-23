
require("dotenv").config();

const express = require("express");
const conexao = require("./database/conexao");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do Controle de Estoque funcionando!"
    });
});

app.use("/produtos", require("./routes/produtosRoutes"));
app.use("/movimentacoes", require("./routes/movimentacoesRoutes"));
app.use("/relatorios", require("./routes/relatoriosRoutes"));

app.use((req, res) => {
    res.status(404).json({
        erro: "Rota não encontrada."
    });
});

conexao.query("SELECT 1", (erro) => {
    if (erro) {
        console.error("Erro ao conectar ao banco:", erro.message);
        process.exit(1);
    }

    console.log("Banco conectado com sucesso!");

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
});

