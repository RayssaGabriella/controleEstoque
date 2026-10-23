
const conexao = require("../database/conexao");


exports.listar = (req, res) => {
    const sql = `
        SELECT id, nome, categoria, unidade_medida,
               quantidade, valor_unitario
        FROM produtos
        ORDER BY id
    `;

    conexao.query(sql, (erro, resultados) => {
        if (erro) {
            console.error(erro);
            return res.status(500).json({
                erro: "Erro ao listar produtos."
            });
        }

        res.json(resultados);
    });
};


exports.criar = (req, res) => {
    const {
        nome,
        categoria,
        unidade_medida,
        quantidade,
        valor_unitario
    } = req.body;

    if (
        typeof nome !== "string" || !nome.trim() ||
        typeof categoria !== "string" || !categoria.trim() ||
        typeof unidade_medida !== "string" || !unidade_medida.trim()
    ) {
        return res.status(400).json({
            erro: "Informe nome, categoria e unidade de medida."
        });
    }

    if (
        quantidade === undefined ||
        !Number.isInteger(Number(quantidade)) ||
        Number(quantidade) < 0 ||
        Number(quantidade) > 100
    ) {
        return res.status(400).json({
            erro: "A quantidade deve ser um número inteiro entre 0 e 100."
        });
    }

    if (
        valor_unitario === undefined ||
        !Number.isFinite(Number(valor_unitario)) ||
        Number(valor_unitario) <= 0
    ) {
        return res.status(400).json({
            erro: "O valor unitário deve ser maior que zero."
        });
    }

    const sql = `
        INSERT INTO produtos
        (nome, categoria, unidade_medida, quantidade, valor_unitario)
        VALUES (?, ?, ?, ?, ?)
    `;

    const valores = [
        nome.trim(),
        categoria.trim(),
        unidade_medida.trim(),
        Number(quantidade),
        Number(valor_unitario)
    ];

    conexao.query(sql, valores, (erro, resultado) => {
        if (erro) {
            console.error(erro);
            return res.status(500).json({
                erro: "Erro ao cadastrar produto."
            });
        }

        res.status(201).json({
            mensagem: "Produto cadastrado com sucesso!",
            id: resultado.insertId
        });
    });
};