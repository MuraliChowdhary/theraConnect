import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Role } from '@prisma/client';
import {
  getMyProfileHandler,
  createTimeSlotsHandler,
  requestLeaveHandler,
} from './therapist.controller';
import { createTimeSlotsSchema, requestLeaveSchema } from './therapist.validation';
import { prisma } from '../../utils/prisma';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ message: 'therapist API is working', timestamp: new Date().toISOString() })
})

// Public route for listing active therapists - MUST be before auth middleware
router.get('/public', async (req, res) => {
  try {
    console.log('Public therapists endpoint hit!'); // Debug log
    const therapists = await prisma.therapistProfile.findMany({
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
  } catch (error: any) {
    console.error('Error in public therapists endpoint:', error); // Debug log
    res.status(500).json({ message: error.message });
  }
});



router.use(authenticate, authorize([Role.THERAPIST]));

router.get('/me/profile', getMyProfileHandler);
router.post('/me/slots',validate({ body: createTimeSlotsSchema.shape.body }),createTimeSlotsHandler);
router.post('/me/leaves', validate({body : requestLeaveSchema.shape.body}), requestLeaveHandler);

export default router;