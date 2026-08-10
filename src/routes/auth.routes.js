const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/firebase-sync", AuthController.firebaseSync);
router.get("/me", authenticate, AuthController.me);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);

module.exports = router;
