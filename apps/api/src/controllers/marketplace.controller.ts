import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Property } from '../models/Property.model';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';
import { Review } from '../models/Review.model';
import { User } from '../models/User.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DEMO_REVIEWS = [
  { rating: 5, comment: 'Excellent facilities! The wifi is super fast and the food quality is outstanding. Very safe locality.', name: 'Rahul S.', daysAgo: 5 },
  { rating: 4, comment: 'Good hostel overall. Clean rooms and helpful staff. The Wifi could be slightly faster but manageable for online classes.', name: 'Priya M.', daysAgo: 18 },
  { rating: 5, comment: 'Best PG I\'ve stayed at in Pune! The mess food is homely and the other tenants are very friendly.', name: 'Aryan K.', daysAgo: 42 },
  { rating: 3, comment: 'Decent place. Maintenance response could be faster. Location is convenient for college commute.', name: 'Sneha P.', daysAgo: 60 },
];

async function enrichProperties(props: any[]) {
  return Promise.all(
    props.map(async (p) => {
      const rooms = await Room.find({ propertyId: p._id }).select('_id');
      const roomIds = rooms.map(r => r._id);
      const [availBeds, totalBeds] = await Promise.all([
        Bed.countDocuments({ roomId: { $in: roomIds }, status: 'AVAILABLE' }),
        Bed.countDocuments({ roomId: { $in: roomIds } }),
      ]);
      return { ...p, availableBeds: availBeds, totalBeds };
    })
  );
}

// ─── Home Screen Sections ─────────────────────────────────────────────────────
export const getHomeData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const approvedFilter = { verificationStatus: 'APPROVED' };

    // Seed ratings/gender on approved properties that have none
    await Property.updateMany({ verificationStatus: 'APPROVED', rating: 0 }, [
      { $set: { rating: { $add: [3.5, { $multiply: [{ $rand: {} }, 1.5] }] } } },
    ]);
    await Property.updateMany({ verificationStatus: 'APPROVED', gender: { $exists: false } }, { gender: 'CO_ED' });

    const all = await Property.find(approvedFilter).sort({ createdAt: -1 }).limit(20).lean();
    const enriched = await enrichProperties(all);

    // Shuffle helper
    const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

    res.json({
      success: true,
      data: {
        featured:    shuffle(enriched).slice(0, 6),
        nearby:      shuffle(enriched).slice(0, 5),
        popular:     [...enriched].sort((a, b) => b.rating - a.rating).slice(0, 6),
        recommended: shuffle(enriched).slice(0, 5),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Search Properties ────────────────────────────────────────────────────────
export const searchProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      q, city, minPrice, maxPrice, gender,
      amenities, sort = 'rating', page = 1, limit = 20,
    } = req.query;

    const filter: any = { verificationStatus: 'APPROVED' };

    if (q) filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { city: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } },
    ];
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (gender && gender !== 'ALL') filter.gender = gender;

    // Amenity filters (comma-separated string, e.g. "WIFI,FOOD,PARKING")
    if (amenities) {
      const amenityList = (amenities as string).split(',').filter(Boolean);
      if (amenityList.length) filter.amenities = { $all: amenityList };
    }

    // Budget filter via rentStartingFrom
    if (minPrice || maxPrice) {
      filter.rentStartingFrom = {};
      if (minPrice) filter.rentStartingFrom.$gte = Number(minPrice);
      if (maxPrice) filter.rentStartingFrom.$lte = Number(maxPrice);
    }

    const sortMap: Record<string, any> = {
      'rating':     { rating: -1 },
      'price_asc':  { rentStartingFrom: 1 },
      'price_desc': { rentStartingFrom: -1 },
      'newest':     { createdAt: -1 },
    };

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort(sortMap[sort as string] || { rating: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Property.countDocuments(filter),
    ]);

    const enriched = await enrichProperties(properties);

    res.json({ success: true, data: enriched, total, page: Number(page) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Property Public Detail ───────────────────────────────────────────────────
export const getPropertyPublicDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id).lean();
    if (!property) { res.status(404).json({ success: false, message: 'Property not found' }); return; }

    // Rooms with bed availability
    const rooms = await Room.find({ propertyId: id }).lean();
    const roomsWithBeds = await Promise.all(
      rooms.map(async (room) => {
        const [availBeds, totalBeds] = await Promise.all([
          Bed.countDocuments({ roomId: room._id, status: 'AVAILABLE' }),
          Bed.countDocuments({ roomId: room._id }),
        ]);
        return { ...room, availableBeds: availBeds, totalBeds, occupiedBeds: totalBeds - availBeds };
      })
    );

    // Group by room type for tabs
    const roomTypeGroups = rooms.reduce((acc: any, room) => {
      if (!acc[room.roomType]) acc[room.roomType] = { rooms: [], minRent: Infinity };
      acc[room.roomType].rooms.push(room);
      if ((room as any).rentPerBed < acc[room.roomType].minRent) {
        acc[room.roomType].minRent = (room as any).rentPerBed || 6000;
      }
      return acc;
    }, {});

    // Total bed summary
    const roomIds = rooms.map(r => r._id);
    const [totalAvailable, totalBeds] = await Promise.all([
      Bed.countDocuments({ roomId: { $in: roomIds }, status: 'AVAILABLE' }),
      Bed.countDocuments({ roomId: { $in: roomIds } }),
    ]);

    // Reviews (DB first, then demo fallback)
    let reviews = await Review.find({ propertyId: id })
      .populate('guestId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Use demo reviews if none exist
    const finalReviews = reviews.length > 0 ? reviews : DEMO_REVIEWS.map((r, i) => ({
      _id: `demo-${i}`,
      propertyId: id,
      rating: r.rating,
      comment: r.comment,
      guestId: { name: r.name },
      createdAt: new Date(Date.now() - r.daysAgo * 86400000),
    }));

    // Average rating
    const avgRating = finalReviews.length
      ? finalReviews.reduce((sum, r) => sum + r.rating, 0) / finalReviews.length
      : 0;

    res.json({
      success: true,
      data: {
        property: { ...property, rating: Math.round(avgRating * 10) / 10 },
        rooms: roomsWithBeds,
        roomTypeGroups,
        availability: { totalBeds, totalAvailable, totalOccupied: totalBeds - totalAvailable },
        reviews: finalReviews,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
