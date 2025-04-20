export interface AmapResponse<T> {
    status: string;
    info: string;
    infocode: string;
    count: string;
    [data: string]: T | string;
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
