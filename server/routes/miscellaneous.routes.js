import { Router } from 'express';
import {
  contactUs,
  userStats,
} from '../controllers/miscellaneous.controller.js';
import { authorizeRoles, isLoggedIn } from '../middlewares/auth.middleware.js';

import Course from '../models/course.model.js';
import asyncHandler from '../middlewares/asyncHandler.middleware.js';


const router = Router();

// TEMPORARY - Remove after testing
router.get('/test/all', asyncHandler(async (req, res) => {
  const courses = await Course.find({});
  res.status(200).json({
    success: true,
    message: 'All courses',
    courses,
  });
}));

// {{URL}}/api/v1/
router.route('/contact').post(contactUs);
router
  .route('/admin/stats/users')
  .get(isLoggedIn, authorizeRoles('ADMIN'), userStats);

export default router;

