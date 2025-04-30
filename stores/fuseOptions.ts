import { IFuseOptions } from "fuse.js";
import { Location } from "./location-store";

export const locationOptions: IFuseOptions<Location> = {
  shouldSort: true,
  // May need to be fine-tuned, see: https://www.fusejs.io/api/options.html#threshold
  threshold: 0.4,
  location: 0,
  distance: 100,
  minMatchCharLength: 1,
  // ignoreLocation: true,
  keys: [
    {
      name: "name", // Match full name (Chinese/English/mixed) with highest weighting
      weight: 0.6,
    },
    {
      name: "namePinyin", // Match the pinyin of the Chinese part, medium weight
      weight: 0.3,
    },
    {
      name: "namePinyinInitials", // Match the pinyin initials of the Chinese portion, with the lowest weighting
      weight: 0.1,
    },
  ],
};

// export const DateOptions: IFuseOptions<Location> = {
//   shouldSort: true,
//   // May need to be fine-tuned, see: https://www.fusejs.io/api/options.html#threshold
//   threshold: 0.4,
//   location: 0,
//   distance: 100,
//   minMatchCharLength: 1,
//   // ignoreLocation: true,
// };
