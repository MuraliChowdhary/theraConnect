import type { Request, Response } from 'express';
import * as authService from './auth.service';
import { signJwt } from '../../utils/jwt';
import { sendNotification, sendNotificationAfterAnEvent } from '../../services/notification.service';
import { NotificationType, prisma } from '../../utils/prisma';

const handleServiceError = (res: Response, error: any) => {
    const isConflict = error.message?.includes('exists');
    return res.status(isConflict ? 409 : 500).json({ message: error.message });
};

export const registerParentHandler = async (req: Request, res: Response) => {
  try {
    const user = await authService.registerParent(req.body);
    const { password, ...userWithoutPassword } = user;
    const token = signJwt({ userId: user.id, role: user.role });

    const finduser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { parentProfile: true }
    });

    // Structured Welcome Message
    const welcomeMessage = `
            Hi ${ finduser?.parentProfile?.name|| "there"},

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
    // await sendNotificationAfterAnEvent({
    //   userId: user.id,
    //   message: welcomeMessage,
    //   sendAt: new Date()
    // });

    res.status(201).json({
      message: 'Parent registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    handleServiceError(res, error);
  }
};


export const registerTherapistHandler = async (req: Request, res: Response) => {
  try {
    const user = await authService.registerTherapist(req.body);
    const  token = signJwt({ userId: user.id, role: user.role });
    const { password, ...userWithoutPassword } = user;

    const finduser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { therapistProfile: true }
    });
      const therapistWelcomeMessage = `
                Hi Dr. ${finduser?.therapistProfile?.name || "there"},

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
        await sendNotificationAfterAnEvent({
          userId: user.id,
          message: therapistWelcomeMessage,
          sendAt: new Date()
        });


    res.status(201).json({ message: 'Therapist registered successfully', user: userWithoutPassword, token });
  } catch (error) {
    handleServiceError(res, error);
  }
};

export const registerAdminHandler = async (req: Request, res: Response) => {
  try {
    const user = await authService.registerAdmin(req.body);
    const { password, ...userWithoutPassword } = user;
    const token = signJwt({ userId: user.id, role: user.role });

        const adminWelcomeMessage = `
              Hi ${user?.email?.split('@')[0].trim() || "there"},

              Admin access has been granted successfully.

              You now have full control to manage users, therapists, sessions, and overall platform operations.

              Please ensure responsible use of the admin privileges.

              Warm regards,  
              The TheraConnect Team
              `.trim();
              // Send Notification
      await sendNotificationAfterAnEvent({
        userId: user.id,
        message: adminWelcomeMessage,
        sendAt: new Date()
        });

    res.status(201).json({ message: 'Admin registered successfully', user: userWithoutPassword,token });
  } catch (error) {
    handleServiceError(res, error);
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};


export const changePasswordHandler = async (req: Request, res: Response) => {
  try {
    const result = await authService.changePassword(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    // Handle known input errors
    if (
      error.message.includes('No account found') ||
      error.message.includes('Current password is incorrect')
    ) {
      return res.status(400).json({ message: error.message });
    }

    // Unknown / server errors
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
