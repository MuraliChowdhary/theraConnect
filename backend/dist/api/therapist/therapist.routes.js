"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const client_1 = require("@prisma/client");
const therapist_controller_1 = require("./therapist.controller");
const therapist_validation_1 = require("./therapist.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([client_1.Role.THERAPIST]));
router.get('/me/profile', therapist_controller_1.getMyProfileHandler);
router.post('/me/slots', (0, validate_middleware_1.validate)({ body: therapist_validation_1.createTimeSlotsSchema.shape.body }), // <-- just the schema
therapist_controller_1.createTimeSlotsHandler);
router.post('/me/leaves', (0, validate_middleware_1.validate)({ body: therapist_validation_1.requestLeaveSchema.shape.body }), therapist_controller_1.requestLeaveHandler);
exports.default = router;
