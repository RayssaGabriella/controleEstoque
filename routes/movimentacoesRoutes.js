
const express = require("express");
const router = express.Router();

const movimentacoesController = require("../controllers/movimentacoesController");

router.get("/saidas", movimentacoesController.listarSaidas);
router.post("/entradas", movimentacoesController.registrarEntrada);
router.post("/saidas", movimentacoesController.registrarSaida);
router.get("/periodo", movimentacoesController.movimentacoesPeriodo);
router.get("/maiores-saidas", movimentacoesController.maioresSaidasPeriodo);

module.exports = router;
