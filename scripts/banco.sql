
CREATE DATABASE IF NOT EXISTS estoque;

USE estoque;

CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(30) NOT NULL,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS entradas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    data_entrada DATE NOT NULL,
    quantidade INT NOT NULL,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE IF NOT EXISTS saidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    data_saida DATE NOT NULL,
    quantidade INT NOT NULL,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

INSERT INTO produtos (nome, categoria, unidade_medida, quantidade, valor_unitario)
VALUES
('Detergente neutro', 'Limpeza geral', 'Unidade', 22, 5.50),
('Desinfetante', 'Limpeza geral', 'Litro', 36, 8.00),
('Detergente alcalino', 'Limpeza pesada', 'Litro', 50, 12.00);

INSERT INTO entradas (produto_id, data_entrada, quantidade)
VALUES
(1, '2026-10-23', 5),
(2, '2026-10-23', 10),
(3, '2026-10-23', 15);

INSERT INTO saidas (produto_id, data_saida, quantidade)
VALUES
(1, '2026-10-23', 3),
(2, '2026-10-23', 4),
(3, '2026-10-23', 5);

CREATE OR REPLACE VIEW vw_estoque AS
SELECT
    id AS produto_id,
    nome AS produto,
    categoria,
    unidade_medida,
    quantidade,
    valor_unitario,
    quantidade * valor_unitario AS valor_total
FROM produtos;

