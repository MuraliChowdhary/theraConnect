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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getMyBookingsHandler = exports.createBookingHandler = exports.getAvailableSlotsHandler = void 0;
const bookingService = __importStar(require("./booking.service"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAvailableSlotsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { therapistId, date } = req.query;
        const slots = yield bookingService.getAvailableSlots(therapistId, date);
        res.status(200).json(slots);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to get slots' });
    }
});
exports.getAvailableSlotsHandler = getAvailableSlotsHandler;
const createBookingHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parentProfile = yield prisma.parentProfile.findUnique({ where: { userId: req.user.userId } });
        if (!parentProfile)
            return res.status(404).json({ message: 'Parent profile not found' });
        const booking = yield bookingService.createBooking(parentProfile.id, req.body);
        res.status(201).json(booking);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createBookingHandler = createBookingHandler;
const getMyBookingsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookings = yield bookingService.getMyBookings(req.user.userId, req.user.role);
        res.status(200).json(bookings);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to retrieve bookings' });
    }
});
exports.getMyBookingsHandler = getMyBookingsHandler;
