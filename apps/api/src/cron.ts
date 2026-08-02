import cron from 'node-cron';
import { MessMenu } from './models/MessMenu.model';
import mongoose from 'mongoose';

/**
 * Mess Menu Photo Cleanup Cron Job
 * Runs every hour on the hour ('0 * * * *')
 * Checks for photos uploaded more than 24 hours ago and removes them.
 */
export const startCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🧹 [CRON] Running 24h photo cleanup for Mess Menu...');
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Find menus that have photos uploaded more than 24 hours ago
      const menusToUpdate = await MessMenu.find({
        $or: [
          { 'breakfast.photosUploadedAt': { $lt: twentyFourHoursAgo } },
          { 'lunch.photosUploadedAt': { $lt: twentyFourHoursAgo } },
          { 'dinner.photosUploadedAt': { $lt: twentyFourHoursAgo } }
        ]
      });

      if (menusToUpdate.length === 0) {
        console.log('🧹 [CRON] No photos to clean up.');
        return;
      }

      let cleanedCount = 0;

      for (const menu of menusToUpdate) {
        let changed = false;

        ['breakfast', 'lunch', 'dinner'].forEach((mealName) => {
          const meal = menu[mealName as keyof typeof menu] as any;
          if (meal && meal.photosUploadedAt && meal.photosUploadedAt < twentyFourHoursAgo) {
            meal.photoType = 'NONE';
            meal.thaliPhotoUrl = null;
            meal.photosUploadedAt = null;
            if (Array.isArray(meal.items)) {
              meal.items.forEach((item: any) => {
                item.photoUrl = null;
              });
            }
            changed = true;
          }
        });

        if (changed) {
          // Tell mongoose these paths were modified so they get saved
          menu.markModified('breakfast');
          menu.markModified('lunch');
          menu.markModified('dinner');
          await menu.save();
          cleanedCount++;
        }
      }

      console.log(`🧹 [CRON] Cleaned photos from ${cleanedCount} mess menus.`);
    } catch (error) {
      console.error('❌ [CRON] Error during photo cleanup:', error);
    }
  });
};
