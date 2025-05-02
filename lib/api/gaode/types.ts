export interface AmapResponse<T> {
  status: string;
  info: string;
  infocode: string;
  count: string;
  [data: string]: T | string;
}

// export interface AmapPlaceDetail {
//   id: string;
//   parent: string | null;
//   distance: string[];
//   pcode: string;
//   importance: string[];
//   biz_ext: {
//     cost: string;
//     opentime2: string;
//     rating: string;
//     open_time: string;
//     meal_ordering: string;
//   };
//   recommend: string;
//   type: string;
//   photos: {
//     title: string[];
//     url: string;
//   }[];
//   discount_num: string;
//   gridcode: string;
//   typecode: string;
//   shopinfo: string;
//   poiweight: string[];
//   updateflag: string;
//   citycode: string;
//   adname: string;
//   children: string[];
//   alias: string[];
//   tel: string;
//   tag: string;
//   event: string[];
//   entr_location: string;
//   indoor_map: string;
//   email: string[];
//   timestamp: string;
//   website: string[];
//   address: string;
//   adcode: string;
//   pname: string;
//   biz_type: string;
//   cityname: string;
//   postcode: string[];
//   match: string;
//   business_area: string;
//   indoor_data: {
//     cmsid: string[];
//     truefloor: string[];
//     cpid: string[];
//     floor: string[];
//   };
//   childtype: string;
//   exit_location: string[];
//   name: string;
//   location: string;
//   shopid: string[];
//   navi_poiid: string;
//   groupbuy_num: string;
// }

export interface AmapPlace {
  id: string;
  name: string;
  location: string;
  type: string;
  typecode: string;
  pname: string;
  cityname: string;
  adname: string;
  address: string;
  pcode: string;
  citycode: string;
  adcode: string;
  business: {
    business_area: string;
    tag?: string;
    rectag?: string;
    keytag: string;
    alias?: string;
    tel?: string;
    rating?: string;
    opentime_today?: string;
    opentime_week?: string;
  };
  photos: {
    title: string;
    url: string;
  }[];
  distance: string;
  parent: string;
}

export interface AmapTip {
  id: string;
  name: string;
  district: string;
  adcode: string;
  location: string;
  address: string;
  typecode: string;
  city: string;
}

export interface AmapGeocode {
  id: string;
  country: string;
  province: string;
  city: string;
  citycode: string;
  district: string;
  street: string;
  number: string;
  adcode: string;
  location: string;
  level: string;
}

export interface AmapRoute {
  origin: string;
  destination: string;
  taxi_cost: number;
  paths: AmapPath[];
}

export interface AmapPath {
  distance: number;
  duration: number;
  strategy: string;
  steps: AmapStep[];
  traffic_lights: number;
  restriction: number;
}

export interface AmapStep {
  instruction: string; // Direction instruction (e.g., "Turn right")
  orientation: string; // Direction (e.g., "Southwest")
  road?: string; // Road name (optional)
  distance: string; // Distance (unit: meters)
  tolls: string; // Whether the road is a toll road ("0" means no toll, "1" means toll)
  toll_distance: string; // Distance of toll road (unit: meters)
  toll_road: string[]; // Array of toll road names
  duration: string; // Estimated time (unit: seconds)
  polyline: string; // Path points (encoded format)
  action: string; // Action (e.g., "Turn left")
  assistant_action: string; // Auxiliary action (e.g., "Enter main road")
  tmcs: AmapTmc[]; // Traffic condition data
  cities: AmapCity[]; // Cities passed through
}

export interface AmapTmc {
  lcode: string[]; // Road segment code
  distance: string; // Road segment distance (unit: meters)
  status: string; // Traffic condition status (e.g., "Smooth")
  polyline: string; // Path points of the road segment (encoded format)
}

export interface AmapCity {
  name: string; // City name
  citycode: string; // City code
  adcode: string; // Administrative district code
  districts: AmapDistrict[]; // City district information
}

export interface AmapDistrict {
  name: string; // District name
  adcode: string; // District code
}

export interface AmapWeather {
  city: string;
  reporttime: string;
  casts: Forecast[];
}

export interface Forecast {
  date: string;
  week: string;
  dayweather: string;
  nightweather: string;
  daytemp: string;
  nighttemp: string;
}

// export const convertAmapPlace = {
//   // Convert AmapPlaceDetail to AmapPlace
//   toAmapPlace(detail: AmapPlaceDetail): AmapPlace {
//     return {
//       id: detail.id,
//       name: detail.name,
//       location: detail.location,
//       type: detail.type,
//       typecode: detail.typecode,
//       pname: detail.pname,
//       cityname: detail.cityname,
//       adname: detail.adname,
//       address: detail.address,
//       pcode: detail.pcode,
//       citycode: detail.citycode,
//       adcode: detail.adcode,
//       business: {
//         business_area: detail.business_area,
//         tag: detail.tag || undefined,
//         rectag: undefined, // No direct equivalent in AmapPlaceDetail
//         keytag: detail.biz_type || detail.type.split(';').pop() || '', // Use biz_type or last part of type
//         alias: detail.alias.length > 0 ? detail.alias[0] : undefined,
//         tel: detail.tel || undefined,
//         rating: detail.biz_ext.rating || undefined,
//         opentime_today: detail.biz_ext.open_time || undefined,
//         opentime_week: detail.biz_ext.opentime2 || undefined,
//       },
//       photos: detail.photos.map((photo) => ({
//         title: photo.title.length > 0 ? photo.title[0] : '',
//         url: photo.url,
//       })),
//       distance: detail.distance.length > 0 ? detail.distance[0] : '',
//       parent: detail.parent || '',
//     };
//   },
//
//   // Convert AmapPlace to AmapPlaceDetail
//   toAmapPlaceDetail(place: AmapPlace): AmapPlaceDetail {
//     return {
//       id: place.id,
//       parent: place.parent || null,
//       distance: place.distance ? [place.distance] : [],
//       pcode: place.pcode,
//       importance: [],
//       biz_ext: {
//         cost: '',
//         opentime2: place.business.opentime_week || '',
//         rating: place.business.rating || '',
//         open_time: place.business.opentime_today || '',
//         meal_ordering: '',
//       },
//       recommend: '',
//       type: place.type,
//       photos: place.photos.map((photo) => ({
//         title: photo.title ? [photo.title] : [],
//         url: photo.url,
//       })),
//       discount_num: '',
//       gridcode: '',
//       typecode: place.typecode,
//       shopinfo: '',
//       poiweight: [],
//       updateflag: '',
//       citycode: place.citycode,
//       adname: place.adname,
//       children: [],
//       alias: place.business.alias ? [place.business.alias] : [],
//       tel: place.business.tel || '',
//       tag: place.business.tag || '',
//       event: [],
//       entr_location: '',
//       indoor_map: '',
//       email: [],
//       timestamp: '',
//       website: [],
//       address: place.address,
//       adcode: place.adcode,
//       pname: place.pname,
//       biz_type: place.business.keytag || '',
//       cityname: place.cityname,
//       postcode: [],
//       match: '',
//       business_area: place.business.business_area,
//       indoor_data: {
//         cmsid: [],
//         truefloor: [],
//         cpid: [],
//         floor: [],
//       },
//       childtype: '',
//       exit_location: [],
//       name: place.name,
//       location: place.location,
//       shopid: [],
//       navi_poiid: '',
//       groupbuy_num: '',
//     };
//   },
// };
