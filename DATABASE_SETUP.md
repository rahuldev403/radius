# Database Setup Guide

## Required Database Function

The `get_services_nearby` function needs to return provider location data. Here's the SQL to create/update it:

```sql
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_services_nearby(float, float, float);

-- Create the function that returns services with provider location
CREATE OR REPLACE FUNCTION get_services_nearby(
  user_lat FLOAT,
  user_lng FLOAT,
  distance_meters FLOAT
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  description TEXT,
  category TEXT,
  provider_id UUID,
  provider_name TEXT,
  provider_location GEOGRAPHY
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    s.category,
    p.id AS provider_id,
    p.full_name AS provider_name,
    p.location AS provider_location
  FROM services s
  JOIN profiles p ON s.provider_id = p.id
  WHERE
    p.location IS NOT NULL
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      distance_meters
    )
  ORDER BY
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql;
```

## Alternative: Direct Query Approach

If the RPC function is giving issues, you can replace it with a direct query in the frontend:

```typescript
// In app/home/page.tsx, replace the fetchServices function with:

const { data, error } = await supabase.from("services").select(`
    id,
    title,
    description,
    category,
    provider:profiles!services_provider_id_fkey (
      id,
      full_name,
      location
    )
  `);

// Then filter by distance in the frontend
const servicesWithDistance = data
  ?.map((service) => {
    if (!service.provider?.location?.coordinates) return null;

    const [lng, lat] = service.provider.location.coordinates;
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      lat,
      lng
    );

    return {
      ...service,
      distance,
    };
  })
  .filter((s) => s && s.distance <= radius * 1000); // radius in km to meters
```

## Helper Function for Distance Calculation

```typescript
// Add this function to calculate distance (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
```

## Quick Fix Option

If you just want to see the map working quickly, you can use a simpler approach that fetches all services and filters client-side. Let me know if you'd like me to implement that!

## Debugging Steps

1. Check if the RPC function exists:

   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_name = 'get_services_nearby';
   ```

2. Test the function directly:

   ```sql
   SELECT * FROM get_services_nearby(40.7128, -74.0060, 5000);
   ```

3. Check the return type:
   ```sql
   \df+ get_services_nearby
   ```

## Current Code Changes

I've updated the code to:

1. ✅ Handle missing location data gracefully in the Map component
2. ✅ Add console logging to debug the data structure
3. ✅ Format the provider data properly from the RPC response
4. ✅ Show warnings for services without valid location data

The map should now work even if some services don't have location data - they'll just be skipped with a console warning.
