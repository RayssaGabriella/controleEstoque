
const express = require("express");
const router = express.Router();

const relatoriosController = require("../controllers/relatoriosController");

router.get("/valor-por-categoria", relatoriosController.valorPorCategoria);
router.get("/vw-estoque", relatoriosController.vwEstoque);
router.get("/limites-estoque", relatoriosController.limitesEstoque);

module.exports = router;

