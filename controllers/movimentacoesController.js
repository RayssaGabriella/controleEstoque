
const conexao = require("../database/conexao");

function executar(sql, valores = []) {
    return new Promise((resolve, reject) => {
        conexao.query(sql, valores, (erro, resultados) => {
            if (erro) return reject(erro);
            resolve(resultados);
        });
    });
}

function dataValida(data) {
    if (
        typeof data !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data)
    ) {
        return false;
    }

    const dataObj = new Date(`${data}T00:00:00Z`);

    return !Number.isNaN(dataObj.getTime()) &&
        dataObj.toISOString().slice(0, 10) === data;
}

function validarPeriodo(req, res) {
    const { dataInicial, dataFinal } = req.query;

    if (!dataValida(dataInicial) || !dataValida(dataFinal)) {
        res.status(400).json({
            erro: "Informe dataInicial e dataFinal no formato AAAA-MM-DD."
        });
        return null;
    }

    if (dataInicial > dataFinal) {
        res.status(400).json({
            erro: "A data inicial não pode ser posterior à data final."
        });
        return null;
    }

    return { dataInicial, dataFinal };
}

exports.listarSaidas = async (req, res) => {
    try {
        const resultados = await executar(`
            SELECT
                s.id,
                p.nome AS produto,
                p.unidade_medida,
                s.quantidade,
                p.valor_unitario,
                s.quantidade * p.valor_unitario AS valor_total,
                s.data_saida
            FROM saidas s
            INNER JOIN produtos p ON p.id = s.produto_id
            ORDER BY s.data_saida DESC, s.id DESC
        `);

        res.json(resultados);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: "Erro ao listar saídas."
        });
    }
};

exports.registrarEntrada = async (req, res) => {
    const produtoId = Number(req.body.produto_id);
    const quantidade = Number(req.body.quantidade);
    const dataEntrada = req.body.data_entrada;

    if (!Number.isInteger(produtoId) || produtoId <= 0) {
        return res.status(400).json({
            erro: "produto_id deve ser um inteiro positivo."
        });
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        return res.status(400).json({
            erro: "A quantidade deve ser um inteiro positivo."
        });
    }

    if (!dataValida(dataEntrada)) {
        return res.status(400).json({
            erro: "data_entrada deve estar no formato AAAA-MM-DD."
        });
    }

    let conn;
    let transacaoIniciada = false;

    try {
        conn = await conexao.promise().getConnection();
        await conn.beginTransaction();
        transacaoIniciada = true;

        const [produtos] = await conn.query(
            "SELECT id, quantidade FROM produtos WHERE id = ? FOR UPDATE",
            [produtoId]
        );

        if (!produtos.length) {
            await conn.rollback();
            transacaoIniciada = false;
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        const novoSaldo = Number(produtos[0].quantidade) + quantidade;

        if (novoSaldo > 100) {
            await conn.rollback();
            transacaoIniciada = false;
            return res.status(400).json({
                erro: "A entrada ultrapassaria o estoque máximo de 100 unidades."
            });
        }

        const [resultado] = await conn.query(
            `INSERT INTO entradas (produto_id, data_entrada, quantidade)
             VALUES (?, ?, ?)`,
            [produtoId, dataEntrada, quantidade]
        );

        await conn.query(
            "UPDATE produtos SET quantidade = ? WHERE id = ?",
            [novoSaldo, produtoId]
        );

        await conn.commit();
        transacaoIniciada = false;

        res.status(201).json({
            mensagem: "Entrada registrada e estoque atualizado.",
            entrada_id: resultado.insertId,
            produto_id: produtoId,
            quantidade_adicionada: quantidade,
            saldo_atual: novoSaldo
        });
    } catch (erro) {
        if (conn && transacaoIniciada) {
            await conn.rollback();
        }

        console.error(erro);
        res.status(500).json({
            erro: "Erro ao registrar entrada."
        });
    } finally {
        if (conn) conn.release();
    }
};

exports.registrarSaida = async (req, res) => {
    const produtoId = Number(req.body.produto_id);
    const quantidade = Number(req.body.quantidade);
    const dataSaida = req.body.data_saida;

    if (!Number.isInteger(produtoId) || produtoId <= 0) {
        return res.status(400).json({
            erro: "produto_id deve ser um inteiro positivo."
        });
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        return res.status(400).json({
            erro: "A quantidade deve ser um inteiro positivo."
        });
    }

    if (!dataValida(dataSaida)) {
        return res.status(400).json({
            erro: "data_saida deve estar no formato AAAA-MM-DD."
        });
    }

    let conn;
    let transacaoIniciada = false;

    try {
        conn = await conexao.promise().getConnection();
        await conn.beginTransaction();
        transacaoIniciada = true;

        const [produtos] = await conn.query(
            "SELECT id, quantidade FROM produtos WHERE id = ? FOR UPDATE",
            [produtoId]
        );

        if (!produtos.length) {
            await conn.rollback();
            transacaoIniciada = false;
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        const saldoAtual = Number(produtos[0].quantidade);

        if (quantidade > saldoAtual) {
            await conn.rollback();
            transacaoIniciada = false;
            return res.status(400).json({
                erro: "Estoque insuficiente para essa saída."
            });
        }

        const novoSaldo = saldoAtual - quantidade;

        const [resultado] = await conn.query(
            `INSERT INTO saidas (produto_id, data_saida, quantidade)
             VALUES (?, ?, ?)`,
            [produtoId, dataSaida, quantidade]
        );

        await conn.query(
            "UPDATE produtos SET quantidade = ? WHERE id = ?",
            [novoSaldo, produtoId]
        );

        await conn.commit();
        transacaoIniciada = false;

        res.status(201).json({
            mensagem: "Saída registrada e estoque atualizado.",
            saida_id: resultado.insertId,
            produto_id: produtoId,
            quantidade_retirada: quantidade,
            saldo_atual: novoSaldo
        });
    } catch (erro) {
        if (conn && transacaoIniciada) {
            await conn.rollback();
        }

        console.error(erro);
        res.status(500).json({
            erro: "Erro ao registrar saída."
        });
    } finally {
        if (conn) conn.release();
    }
};

exports.movimentacoesPeriodo = async (req, res) => {
    const periodo = validarPeriodo(req, res);
    if (!periodo) return;

    const { dataInicial, dataFinal } = periodo;

    try {
        const resultados = await executar(`
            SELECT
                p.nome AS nome_produto,
                p.unidade_medida AS unidade_medida,
                COALESCE(e.total_entradas, 0) AS total_entradas,
                COALESCE(s.total_saidas, 0) AS total_saidas,
                (
                    COALESCE(e.total_entradas, 0) -
                    COALESCE(s.total_saidas, 0)
                ) AS saldo_no_periodo,
                (
                    COALESCE(e.total_entradas, 0) * p.valor_unitario
                ) AS valor_total_entradas,
                (
                    COALESCE(s.total_saidas, 0) * p.valor_unitario
                ) AS valor_total_saidas
            FROM produtos p
            LEFT JOIN (
                SELECT produto_id, SUM(quantidade) AS total_entradas
                FROM entradas
                WHERE data_entrada BETWEEN ? AND ?
                GROUP BY produto_id
            ) e ON e.produto_id = p.id
            LEFT JOIN (
                SELECT produto_id, SUM(quantidade) AS total_saidas
                FROM saidas
                WHERE data_saida BETWEEN ? AND ?
                GROUP BY produto_id
            ) s ON s.produto_id = p.id
            ORDER BY p.nome
        `, [dataInicial, dataFinal, dataInicial, dataFinal]);

        res.json(resultados);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: "Erro ao consultar movimentações do período."
        });
    }
};

exports.maioresSaidasPeriodo = async (req, res) => {
    const periodo = validarPeriodo(req, res);
    if (!periodo) return;

    const { dataInicial, dataFinal } = periodo;

    try {
        const resultados = await executar(`
            SELECT
                p.nome AS nome_produto,
                SUM(s.quantidade) AS quantidade_total_saida,
                SUM(s.quantidade * p.valor_unitario)
                    AS valor_total_financeiro_saidas
            FROM saidas s
            INNER JOIN produtos p ON p.id = s.produto_id
            WHERE s.data_saida BETWEEN ? AND ?
            GROUP BY p.id, p.nome
            ORDER BY quantidade_total_saida DESC
        `, [dataInicial, dataFinal]);

        res.json(resultados);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: "Erro ao consultar produtos com maior volume de saída."
        });
    }
};
