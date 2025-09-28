import { AmapPlace, AmapTip } from "@/lib/api/gaode/types";
import { fetchAmapTips, fetchAmapPlaceById } from "@/lib/api/gaode/search";
import { Suggestion, Place, LocationProvider } from "@/lib/api/types";
import { generateFixedLengthId } from "@/lib/utils/index";

/**
 * Maps an AmapTip object to our generic Suggestion format.
 */
function mapAmapTipToSuggestion(tip: AmapTip): Suggestion {
    return {
        provider: LocationProvider.AMAP,
        id: tip.id,
        name: tip.name,
        address: tip.address,
        district: tip.district,
        location: tip.location,
    };
}

/**
 * Maps an AmapPlace object to our generic Place format.
 */
function mapAmapPlaceToGenericPlace(
    place: AmapPlace,
    internalId: string,
): Place {
    return {
        provider: LocationProvider.AMAP,
        id: internalId,
        originalId: place.id,
        name: place.name,
        location: place.location,
        address: place.address,
        adcode: place.adcode,
        pname: place.pname,
        cityname: place.cityname,
        adname: place.adname,
        business: place.business,
        photos: place.photos,
    };
}

/**
 * Fetches suggestions from the configured location provider.
 * Currently hardcoded to Amap, but can be expanded.
 */
export async function fetchSuggestions(query: string): Promise<Suggestion[]> {
    // In the future, could have logic here to decide which provider to use.
    const amapTips = await fetchAmapTips(query);
    return amapTips.map(mapAmapTipToSuggestion);
}

/**
 * Fetches detailed information for a place based on its suggestion details.
 */
export async function fetchPlaceDetails(
    suggestion: Suggestion,
): Promise<Place | null> {
    const internalId = generateFixedLengthId(8, "mention-");

    switch (suggestion.provider) {
        case LocationProvider.AMAP:
            const places = await fetchAmapPlaceById(suggestion.id);
            if (places && places.length > 0) {
                return mapAmapPlaceToGenericPlace(places[0], internalId);
            }
            return null;
        // Add a case for QWeather here in the future
        // case LocationProvider.QWEATHER:
        //   // const qweatherPlace = await fetchQWeatherPlace(suggestion.id);
        //   // return mapQWeatherToGenericPlace(qweatherPlace);
        default:
            return null;
    }
}
