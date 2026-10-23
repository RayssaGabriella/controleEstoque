
const conexao = require("../database/conexao");

exports.valorPorCategoria = (req, res) => {
    const sql = `
        SELECT
            categoria,
            SUM(quantidade * valor_unitario) AS valor_total_categoria
        FROM produtos
        GROUP BY categoria
        ORDER BY categoria
    `;

    conexao.query(sql, (erro, resultados) => {
        if (erro) {
            console.error(erro);
            return res.status(500).json({
                erro: "Erro ao calcular o valor por categoria."
            });
        }

        res.json(resultados);
    });
};

exports.vwEstoque = (req, res) => {
    conexao.query(
        "SELECT * FROM vw_estoque ORDER BY produto_id",
        (erro, resultados) => {
            if (erro) {
                console.error(erro);
                return res.status(500).json({
                    erro: "Erro ao consultar a view vw_estoque."
                });
            }

            res.json(resultados);
        }
    );
};

exports.limitesEstoque = (req, res) => {
    const sql = `
        SELECT
            nome AS nome_produto,
            categoria,
            quantidade,
            100 AS estoque_maximo,
            quantidade AS percentual_nivel_atingido,
            CASE
                WHEN quantidade = 0 THEN 'MINIMO'
                WHEN quantidade = 100 THEN 'MAXIMO'
            END AS limite_atingido
        FROM produtos
        WHERE quantidade = 0 OR quantidade = 100
        ORDER BY nome
    `;

    conexao.query(sql, (erro, resultados) => {
        if (erro) {
            console.error(erro);
            return res.status(500).json({
                erro: "Erro ao consultar os limites do estoque."
            });
        }

        res.json(resultados);
    });
};
