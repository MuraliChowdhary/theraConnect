"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordHandler = exports.loginHandler = exports.registerAdminHandler = exports.registerTherapistHandler = exports.registerParentHandler = void 0;
const authService = __importStar(require("./auth.service"));
const jwt_1 = require("../../utils/jwt");
const notification_service_1 = require("../../services/notification.service");
const prisma_1 = require("../../utils/prisma");
const handleServiceError = (res, error) => {
    var _a;
    const isConflict = (_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('exists');
    return res.status(isConflict ? 409 : 500).json({ message: error.message });
};
const registerParentHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield authService.registerParent(req.body);
        const { password } = user, userWithoutPassword = __rest(user, ["password"]);
        const token = (0, jwt_1.signJwt)({ userId: user.id, role: user.role });
        const finduser = yield prisma_1.prisma.user.findUnique({
            where: { id: user.id },
            include: { parentProfile: true }
        });
        // Structured Welcome Message
        const welcomeMessage = `
            Hi ${((_a = finduser === null || finduser === void 0 ? void 0 : finduser.parentProfile) === null || _a === void 0 ? void 0 : _a.name) || "there"},

            Welcome to TheraConnect — we're delighted to have you on board!

            Your registration has been successfully completed.
            TheraConnect is a trusted platform designed to help you connect with certified therapists and access personalized consultation experiences with ease.

            What you can do next:
            • Explore therapist profiles and choose the right expert for your needs  
            • Schedule consultations at your convenience  
            • Track your progress and stay connected — all in one place

            We're here to support you at every step of your wellness journey.

            Warm regards,  
            The TheraConnect Team
    `.trim();
        // Send Notification
        yield (0, notification_service_1.sendNotificationAfterAnEvent)({
            userId: user.id,
            message: welcomeMessage,
            sendAt: new Date()
        });
        res.status(201).json({
            message: 'Parent registered successfully',
            user: userWithoutPassword,
            token
        });
    }
    catch (error) {
        handleServiceError(res, error);
    }
});
exports.registerParentHandler = registerParentHandler;
const registerTherapistHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield authService.registerTherapist(req.body);
        const token = (0, jwt_1.signJwt)({ userId: user.id, role: user.role });
        const { password } = user, userWithoutPassword = __rest(user, ["password"]);
        const finduser = yield prisma_1.prisma.user.findUnique({
            where: { id: user.id },
            include: { therapistProfile: true }
        });
        const therapistWelcomeMessage = `
                Hi Dr. ${((_a = finduser === null || finduser === void 0 ? void 0 : finduser.therapistProfile) === null || _a === void 0 ? void 0 : _a.name) || "there"},

                Welcome to TheraConnect — we're excited to have you as part of our therapist community!

                Your profile registration has been successfully completed.
                As a certified therapist on TheraConnect, you can now connect with parents and provide valuable consultation support.

                Here's what you can do next:
                • Complete your professional profile to increase visibility  
                • Start accepting consultation requests  
                • Manage sessions and reports — all from one dashboard

                Thank you for contributing to better care and guidance.

                Warm regards,  
                The TheraConnect Team
                `.trim();
        // Send Notification
        yield (0, notification_service_1.sendNotificationAfterAnEvent)({
            userId: user.id,
            message: therapistWelcomeMessage,
            sendAt: new Date()
        });
        res.status(201).json({ message: 'Therapist registered successfully', user: userWithoutPassword, token });
    }
    catch (error) {
        handleServiceError(res, error);
    }
});
exports.registerTherapistHandler = registerTherapistHandler;
const registerAdminHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield authService.registerAdmin(req.body);
        const { password } = user, userWithoutPassword = __rest(user, ["password"]);
        const token = (0, jwt_1.signJwt)({ userId: user.id, role: user.role });
        const adminWelcomeMessage = `
              Hi ${((_a = user === null || user === void 0 ? void 0 : user.email) === null || _a === void 0 ? void 0 : _a.split('@')[0].trim()) || "there"},

              Admin access has been granted successfully.

              You now have full control to manage users, therapists, sessions, and overall platform operations.

              Please ensure responsible use of the admin privileges.

              Warm regards,  
              The TheraConnect Team
              `.trim();
        // Send Notification
        yield (0, notification_service_1.sendNotificationAfterAnEvent)({
            userId: user.id,
            message: adminWelcomeMessage,
            sendAt: new Date()
        });
        res.status(201).json({ message: 'Admin registered successfully', user: userWithoutPassword, token });
    }
    catch (error) {
        handleServiceError(res, error);
    }
});
exports.registerAdminHandler = registerAdminHandler;
const loginHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield authService.login(req.body);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
});
exports.loginHandler = loginHandler;
const changePasswordHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield authService.changePassword(req.body);
        res.status(200).json(result);
    }
    catch (error) {
        // Handle known input errors
        if (error.message.includes('No account found') ||
            error.message.includes('Current password is incorrect')) {
            return res.status(400).json({ message: error.message });
        }
        // Unknown / server errors
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.changePasswordHandler = changePasswordHandler;
