import type { Request, Response } from 'express';
import * as bookingService from './booking.service';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAvailableSlotsHandler = async (req: Request, res: Response) => {
    try {
        const { therapistId, date } = req.query as { therapistId: string; date: string };
        console.log(req.query)
        const slots = await bookingService.getAvailableSlots(therapistId, date);
        res.status(200).json(slots);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to get slots' });
    }
};

//email phone name child-> illness  

export const createBookingHandler = async (req: Request, res: Response) => {
    try {
        const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: req.user!.userId }});
        if (!parentProfile) return res.status(404).json({ message: 'Parent profile not found' });

        const booking = await bookingService.createBooking(parentProfile.id, req.body);
        res.status(201).json(booking);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getMyBookingsHandler = async (req: Request, res: Response) => {
    try {
        const bookings = await bookingService.getMyBookings(req.user!.userId, req.user!.role);
        res.status(200).json(bookings);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to retrieve bookings' });
    }
}