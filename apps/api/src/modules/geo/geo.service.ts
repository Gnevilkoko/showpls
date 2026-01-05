import { Inject, Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Request, User, FileAttachment, Response } from '@share/entities'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

interface PerformerNearby {
  id: string
  username: string | null
  firstName: string
  lastName: string | null
  avatar: string | null
  distance: number
  lng: number
  lat: number
}

@Injectable()
export class GeoService {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Get requests within map bounds with Redis caching
   * Returns full request details (same as GET /request/:id)
   * Handles meridian crossing (180/-180 longitude)
   */
  async getRequestsInBounds(
    north: number,
    south: number,
    east: number,
    west: number,
  ): Promise<any[]> {
    // Validate bounding box size
    const latDiff = Math.abs(north - south)
    const lngDiff = Math.abs(east - west)

    // Max ~1000km (~9 degrees Lat, ~18 degrees Lng)
    const MAX_LAT_DIFF = 9
    const MAX_LNG_DIFF = 18

    if (latDiff > MAX_LAT_DIFF || lngDiff > MAX_LNG_DIFF) {
      throw new BadRequestException("Map area too large. Please zoom in.")
    }

    // Check cache first
    const cacheKey = `geo:requests:${north}:${south}:${east}:${west}`
    const cached = await this.cacheManager.get<any[]>(cacheKey)
    if (cached) {
      return cached
    }

    let requestIds: string[]

    // Check if meridian crossing occurs (west > east)
    if (west > east) {
      // Meridian crossing: use raw SQL with OR logic
      const query = `
        SELECT id FROM request 
        WHERE status IN ('published', 'accepted')
        AND (ST_X(location::geometry) >= $1 OR ST_X(location::geometry) <= $2) 
        AND ST_Y(location::geometry) BETWEEN $3 AND $4
      `
      const results = await this.requestRepository.query(query, [west, east, south, north])
      requestIds = results.map((r: any) => r.id)
    } else {
      // Standard bounds: use ST_MakeEnvelope
      const query = `
        SELECT id FROM request 
        WHERE status IN ('published', 'accepted') 
        AND ST_Within(location::geometry, ST_MakeEnvelope($1, $2, $3, $4, 4326))
      `
      const results = await this.requestRepository.query(query, [west, south, east, north])
      requestIds = results.map((r: any) => r.id)
    }

    // Fetch full request entities with all relations
    let requests: Request[] = []
    if (requestIds.length > 0) {
      requests = await this.requestRepository.find({
        where: { id: In(requestIds) },
        relations: ["customer", "attachments", "responses", "responses.performer"],
      })
    }

    // Format response to match GET /request/:id structure
    const formattedResults = requests.map(request => {
      // Find accepted performer
      const acceptedResponse = request.responses?.find(r => r.status === "accepted")
      const performer = acceptedResponse ? {
        id: acceptedResponse.performer.id,
        firstName: acceptedResponse.performer.firstName,
        lastName: acceptedResponse.performer.lastName,
        avatar: acceptedResponse.performer.avatar,
      } : null

      // Format responses (empty array for unauthenticated map requests)
      const responses: any[] = []

      return {
        id: request.id,
        title: request.title,
        description: request.description,
        price: request.price,
        status: request.status,
        attachments: request.attachments?.map(att => ({
          id: att.id,
          url: att.url,
          hash: att.hash,
        })) || [],
        latitude: request.location.coordinates[1],
        longitude: request.location.coordinates[0],
        customer: {
          id: request.customer.id,
          firstName: request.customer.firstName,
          lastName: request.customer.lastName,
          avatar: request.customer.avatar,
        },
        performer,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
        acceptedAt: request.acceptedAt?.toISOString() || null,
        completedAt: request.completedAt?.toISOString() || null,
        cancelledAt: request.cancelledAt?.toISOString() || null,
        expiresAt: request.expiresAt?.toISOString() || null,
        deadlineAt: request.deadlineAt?.toISOString() || null,
        isUrgent: request.isUrgent,
        metadata: request.metadata,
        responses,
        submission: null,
      }
    })

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, formattedResults, 300000)

    return formattedResults
  }

  /**
   * Get performers nearby a location with Redis caching
   * Uses ST_Distance for accurate distance calculation
   */
  async getPerformersNearby(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<PerformerNearby[]> {
    // Check cache first
    const cacheKey = `geo:performers-list:${lat}:${lng}:${radiusKm}`
    const cached = await this.cacheManager.get<PerformerNearby[]>(cacheKey)
    if (cached) {
      return cached
    }

    // Convert radius from km to meters for PostGIS
    const radiusMeters = radiusKm * 1000

    // Use ST_DWithin for efficient spatial query with distance filter
    const query = `
      SELECT 
        id,
        username,
        "firstName",
        "lastName",
        avatar,
        ST_X("lastKnownLocation"::geometry) as lng,
        ST_Y("lastKnownLocation"::geometry) as lat,
        ST_Distance(
          "lastKnownLocation"::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM "user"
      WHERE role = 'normal'
      AND banned = false
      AND "lastKnownLocation" IS NOT NULL
      AND ST_DWithin(
        "lastKnownLocation"::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance ASC
    `

    const results = await this.userRepository.query(query, [lng, lat, radiusMeters])

    // Format results
    const formattedResults: PerformerNearby[] = results.map((r: any) => ({
      id: r.id,
      username: r.username,
      firstName: r.firstName,
      lastName: r.lastName,
      avatar: r.avatar,
      distance: Number(r.distance),
      lng: Number(r.lng),
      lat: Number(r.lat),
    }))

    // Cache for 15 seconds to optimize Redis load with frequent location updates
    await this.cacheManager.set(cacheKey, formattedResults, 15000)

    return formattedResults
  }

  /**
   * Get performers nearby a specific request location
   * Uses request coordinates as center point
   */
  async getPerformersNearbyRequest(
    requestId: string,
    radiusKm: number = 5,
    limit: number = 50,
  ): Promise<{ items: PerformerNearby[] }> {
    // Check cache first
    const cacheKey = `geo:request-performers:${requestId}:${radiusKm}:${limit}`
    const cached = await this.cacheManager.get<{ items: PerformerNearby[] }>(cacheKey)
    if (cached) {
      return cached
    }

    // Get request coordinates
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      select: ['location'],
    })

    if (!request || !request.location) {
      throw new Error('Request not found or has no location')
    }

    const requestLng = request.location.coordinates[0]
    const requestLat = request.location.coordinates[1]

    // Convert radius from km to meters for PostGIS
    const radiusMeters = radiusKm * 1000

    // Use ST_DWithin for efficient spatial query with distance filter
    const query = `
      SELECT
        id,
        "firstName",
        "lastName",
        avatar,
        ST_X("lastKnownLocation"::geometry) as lng,
        ST_Y("lastKnownLocation"::geometry) as lat,
        ST_Distance(
          "lastKnownLocation"::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000 as distance
      FROM "user"
      WHERE role = 'normal'
      AND banned = false
      AND "lastKnownLocation" IS NOT NULL
      AND ST_DWithin(
        "lastKnownLocation"::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance ASC
      LIMIT $4
    `

    const results = await this.userRepository.query(query, [requestLng, requestLat, radiusMeters, limit])

    // Format results
    const items = results.map((r: any) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      avatar: r.avatar,
      rating: 0, // TODO: Implement rating calculation
      latitude: Number(r.lat),
      longitude: Number(r.lng),
      distance: Number(r.distance),
    }))

    const response = { items }

    // Cache for 15 seconds to optimize Redis load with frequent location updates
    await this.cacheManager.set(cacheKey, response, 15000)

    return response
  }

  /**
   * Update user's last known location
   * Invalidates relevant cache keys
   */
  async updateUserLocation(userId: string, lat: number, lng: number): Promise<void> {
    const query = `
      UPDATE "user"
      SET
        "lastKnownLocation" = ST_SetSRID(ST_MakePoint($1, $2), 4326),
        "locationUpdatedAt" = NOW()
      WHERE id = $3
    `

    await this.userRepository.query(query, [lng, lat, userId])

    // Note: Cache invalidation for nearby performers is handled by TTL
    // For more aggressive invalidation, we could clear cache keys matching pattern
    // but this would require additional Redis operations
  }
}