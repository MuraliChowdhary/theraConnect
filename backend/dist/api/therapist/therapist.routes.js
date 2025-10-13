"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const client_1 = require("@prisma/client");
const therapist_controller_1 = require("./therapist.controller");
const therapist_validation_1 = require("./therapist.validation");
const prisma_1 = require("../../utils/prisma");
const router = (0, express_1.Router)();
router.get('/test', (req, res) => {
    res.json({ message: 'therapist API is working', timestamp: new Date().toISOString() });
});
// Public route for listing active therapists - MUST be before auth middleware
router.get('/public', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Public therapists endpoint hit!'); // Debug log
        const therapists = yield prisma_1.prisma.therapistProfile.findMany({
            where: { status: 'ACTIVE' },
            select: {
                id: true,
                name: true,
                specialization: true,
                experience: true,
                baseCostPerSession: true,
                averageRating: true,
            },
        });
        console.log('Found therapists:', therapists.length); // Debug log
        res.json(therapists);
    }
    catch (error) {
        console.error('Error in public therapists endpoint:', error); // Debug log
        res.status(500).json({ message: error.message });
    }
}));
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)([client_1.Role.THERAPIST]));
router.get('/me/profile', therapist_controller_1.getMyProfileHandler);
router.post('/me/slots', (0, validate_middleware_1.validate)({ body: therapist_validation_1.createTimeSlotsSchema.shape.body }), therapist_controller_1.createTimeSlotsHandler);
router.post('/me/leaves', (0, validate_middleware_1.validate)({ body: therapist_validation_1.requestLeaveSchema.shape.body }), therapist_controller_1.requestLeaveHandler);
exports.default = router;
