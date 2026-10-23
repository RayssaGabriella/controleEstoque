
const express = require("express");
const router = express.Router();

const produtosController = require("../controllers/produtosController");

router.get("/", produtosController.listar);
router.post("/", produtosController.criar);

module.exports = router;
