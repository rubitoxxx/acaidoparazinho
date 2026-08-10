const express = require("express");
const router = express.Router();
const UsersController = require("../controllers/users.controller");
const { authenticate, requireAdmin } = require("../middlewares/auth");

router.get("/", authenticate, requireAdmin, UsersController.list);
router.post("/", authenticate, requireAdmin, UsersController.create);
router.get("/:id", authenticate, UsersController.get);
router.put("/:id", authenticate, UsersController.update);
router.delete("/:id", authenticate, requireAdmin, UsersController.remove);

module.exports = router;
