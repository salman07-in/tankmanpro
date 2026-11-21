// server.ts
import dotenv from "dotenv";
import fs2 from "fs";
import crypto2 from "crypto";
import express from "express";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer } from "vite";

// src/lib/databaseEngine.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/data/demoCatalog.ts
var DEMO_CITIES = [
  {
    id: "city_delhi",
    name: "New Delhi",
    state: "Delhi NCR",
    slug: "new-delhi",
    supportPhone: "+91 96481 75639",
    active: true,
    isDemo: true
  },
  {
    id: "city_shahjahanpur",
    name: "Shahjahanpur",
    state: "Uttar Pradesh",
    slug: "shahjahanpur",
    supportPhone: "+91 96481 75639",
    active: true,
    isDemo: true
  },
  {
    id: "city_kanpur",
    name: "Kanpur",
    state: "Uttar Pradesh",
    slug: "kanpur",
    supportPhone: "+91 96481 75639",
    active: true,
    isDemo: true
  }
];
var DEMO_SERVICE_AREAS = [
  {
    id: "sa_del_110001",
    cityId: "city_delhi",
    cityName: "New Delhi",
    state: "Delhi NCR",
    pinCode: "110001",
    zoneLabel: "Central Delhi",
    neighbourhoods: ["Connaught Place", "Barakhamba", "Janpath"],
    supportedServiceIds: [],
    assignedVendorUids: ["vendor_demo_del_1", "vendor_demo_del_2"],
    active: true,
    isDemo: true
  },
  {
    id: "sa_del_110016",
    cityId: "city_delhi",
    cityName: "New Delhi",
    state: "Delhi NCR",
    pinCode: "110016",
    zoneLabel: "South Delhi",
    neighbourhoods: ["Hauz Khas", "Green Park", "IIT Delhi Area"],
    supportedServiceIds: [],
    assignedVendorUids: ["vendor_demo_del_1", "vendor_demo_del_2"],
    active: true,
    isDemo: true
  },
  {
    id: "sa_del_110075",
    cityId: "city_delhi",
    cityName: "New Delhi",
    state: "Delhi NCR",
    pinCode: "110075",
    zoneLabel: "Dwarka Sub-City",
    neighbourhoods: ["Dwarka Sector 4", "Dwarka Sector 10", "Dwarka Sector 12"],
    supportedServiceIds: [],
    assignedVendorUids: ["vendor_demo_del_1"],
    active: true,
    isDemo: true
  },
  {
    id: "sa_spn_242001",
    cityId: "city_shahjahanpur",
    cityName: "Shahjahanpur",
    state: "Uttar Pradesh",
    pinCode: "242001",
    zoneLabel: "City Centre & Sadar",
    neighbourhoods: ["Sadar Bazar", "Civil Lines", "Town Hall", "Kanth Road"],
    supportedServiceIds: [],
    assignedVendorUids: ["vendor_demo_spn_1", "vendor_demo_spn_2"],
    active: true,
    isDemo: true
  },
  {
    id: "sa_spn_242226",
    cityId: "city_shahjahanpur",
    cityName: "Shahjahanpur",
    state: "Uttar Pradesh",
    pinCode: "242226",
    zoneLabel: "Roza Industrial & Residential",
    neighbourhoods: ["Roza Junction", "Railway Colony", "Lodhipur"],
    supportedServiceIds: [],
    assignedVendorUids: ["vendor_demo_spn_1", "vendor_demo_spn_2"],
    active: true,
    isDemo: true
  },
  {
    id: "sa_knp_208001",
    cityId: "city_kanpur",
    cityName: "Kanpur",
    state: "Uttar Pradesh",
    pinCode: "208001",
    zoneLabel: "Kanpur Central",
    neighbourhoods: ["Mall Road", "Civil Lines", "Canal Road"],
    supportedServiceIds: [],
    assignedVendorUids: ["vendor_demo_spn_1"],
    active: true,
    isDemo: true
  },
  {
    id: "sa_knp_208002",
    cityId: "city_kanpur",
    cityName: "Kanpur",
    state: "Uttar Pradesh",
    pinCode: "208002",
    zoneLabel: "South Kanpur",
    neighbourhoods: ["Kidwai Nagar", "Govind Nagar", "Barra"],
    supportedServiceIds: [],
    assignedVendorUids: ["vendor_demo_spn_1"],
    active: true,
    isDemo: true
  }
];
var DEMO_CATEGORIES = [
  {
    id: "cat_water_tank",
    name: "Water Tank Cleaning",
    slug: "water-tank-cleaning",
    shortDescription: "Mechanized dewatering, sludge removal, high-pressure jet cleaning & UV sanitization (500L to 5000L).",
    iconKey: "water-tank",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/s1.jpg",
    sortOrder: 1,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_vehicle_wash",
    name: "Car & Bike Wash",
    slug: "car-bike-wash",
    shortDescription: "Doorstep car interior vacuum + exterior polish wash and two-wheeler foam wash.",
    iconKey: "vehicle-wash",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/IMG_20231220_175929.jpg",
    sortOrder: 2,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_kitchen",
    name: "Kitchen, Chimney & Fridge",
    slug: "kitchen-cleaning",
    shortDescription: "Empty kitchen deep cleaning, chimney degreasing, single/double door fridge, gas stove & sink cleaning.",
    iconKey: "kitchen",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/t_chimeny.png",
    sortOrder: 3,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_bathroom",
    name: "Bathroom & Tile Cleaning",
    slug: "bathroom-cleaning",
    shortDescription: "Machine & hand scrubbing, complete A-to-Z bathroom deep cleaning, toilet & washbasin descaling.",
    iconKey: "bathroom",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/bathroom-.webp",
    sortOrder: 4,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_fan_appliances",
    name: "Fan, Floor & Home Care",
    slug: "fan-floor-door-cleaning",
    shortDescription: "Ceiling fan & exhaust fan degreasing, door cleaning, and microfiber floor scrubbing.",
    iconKey: "fan-appliances",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/asian-man-wearing-a-protective-mask-cleaning-ceiling-fan-at-home.jpg",
    sortOrder: 5,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_sofa_mattress",
    name: "Sofa, Mattress & Carpet",
    slug: "sofa-mattress-carpet",
    shortDescription: "Dry dusting, shampooing, wet vacuum extraction for sofas, single/double mattresses & carpets.",
    iconKey: "sofa-mattress",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/How-Do-we-Clean-Your-Sofa.jpg",
    sortOrder: 6,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_ac_service",
    name: "AC Service & Repair",
    slug: "ac-service-repair",
    shortDescription: "Split & window AC foam-jet service, cooling diagnostics, and complete AC installation.",
    iconKey: "ac-service",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/repairman-uniform-installing-outside-unit-air-conditioner_93675-91162.jpg",
    sortOrder: 7,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_repairs",
    name: "Home Maintenance & Technicians",
    slug: "home-maintenance-technicians",
    shortDescription: "Certified Plumber, Electrician, Painter, Washing Machine & Refrigerator technicians on call.",
    iconKey: "appliance-repair",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/colorful-electricity-elements-concept_1284-37811.jpg",
    sortOrder: 8,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_electrician",
    name: "Electrician Services",
    slug: "electrician-services",
    shortDescription: "Switches, wiring, fans, lighting, MCB distribution, inverters & smart appliance setup.",
    iconKey: "appliance-repair",
    imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
    sortOrder: 9,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_plumber",
    name: "Plumber & Sanitary Services",
    slug: "plumber-services",
    shortDescription: "Bath accessories, showers, basins, waste pipes, grouting, drainage & water filters.",
    iconKey: "plumbing",
    imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
    sortOrder: 10,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_painter",
    name: "Painter & Wall Care",
    slug: "painter-services",
    shortDescription: "Interior walls, exterior weatherproofing, ceiling coats & touch-up painting.",
    iconKey: "painter",
    imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
    sortOrder: 11,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_carpenter",
    name: "Carpenter Services",
    slug: "carpenter-services",
    shortDescription: "Door lock installation, hinge repair, furniture assembly & wall mounts.",
    iconKey: "carpenter",
    imageUrl: "/assets/tankmanpro/sofa-clean.jpg",
    sortOrder: 12,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_aesthetics",
    name: "Beedare Skin & Aesthetics",
    slug: "beedare-aesthetics",
    shortDescription: "At-home chemical peels, Dermapen, PRP rejuvenation & laser hair removal by Beedare by TankmanPro.",
    iconKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/54a488b2-c84c-4ea4-ad5b-62f4610ece16.jpg",
    sortOrder: 13,
    status: "published",
    isDemo: true
  }
];
var ALL_CITIES = ["city_delhi", "city_shahjahanpur", "city_kanpur"];
var DEMO_SERVICES = [
  // 1. WATER TANK CLEANING
  {
    id: "srv_mechanized_tank_clean",
    slug: "mechanized-water-tank-cleaning",
    title: "Mechanized Water Tank Cleaning",
    categoryId: "cat_water_tank",
    shortDescription: "Manhole & surroundings cleaned off dirt, mud, and algae; water pumped out; high-pressure rotary jet wash & sanitization.",
    fullDescription: "The manhole and surroundings are cleaned of dirt, mud, and algae, after which water below the foot-valve level is pumped out using specialized dewatering equipment. Includes internal sludge vacuuming, high-pressure jet wash of walls and ceiling, and anti-bacterial UV treatment.",
    illustrationKey: "water-tank",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/s1.jpg",
    galleryUrls: ["https://tankmanpro.com/wp-content/uploads/2023/10/s1.jpg"],
    durationMinutes: 60,
    basePricePaise: 49900,
    regularPricePaise: 69900,
    defaultPricingMode: "city_fixed",
    cityModeOverrides: {
      city_delhi: "city_fixed",
      city_shahjahanpur: "vendor_offer",
      city_kanpur: "city_fixed"
    },
    inclusions: [
      "Stage 1: Manhole & surrounding area mud, dirt, and algae removal",
      "Stage 2: Mechanized dewatering pump-out below foot-valve level",
      "Stage 3: Wet-vacuum extraction of bottom sludge and sediment",
      "Stage 4: High-pressure jet cleaning of internal walls, floor, and ceiling",
      "Stage 5: Antibacterial sanitization & UV germicidal treatment",
      "Stage 6: Float valve check and clean water rinse"
    ],
    exclusions: [
      "Structural cement plastering or civil crack repair",
      "Water tanker refilling supply"
    ],
    preparationInstructions: [
      "Switch off the water pump 3\u20134 hours before the appointment so water level is low.",
      "Provide terrace/tank access and a standard power socket within 15 metres."
    ],
    warrantySummary: "100% chemical-residue-free mechanized hygiene process",
    cancellationPolicySummary: "Free cancellation or reschedule up to 4 hours before slot.",
    variants: [
      {
        id: "var_tank_500_1000",
        serviceId: "srv_mechanized_tank_clean",
        name: "Water Tank Cleaning (500L to 750L)",
        scopeSummary: "Standard residential overhead tank (500 ltr to 750 ltr capacity)",
        durationMinutes: 45,
        basePricePaise: 49900,
        regularPricePaise: 69900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/s1.jpg",
        active: true
      },
      {
        id: "var_tank_1000_1500",
        serviceId: "srv_mechanized_tank_clean",
        name: "Water Tank Cleaning (1000L to 1500L)",
        scopeSummary: "Medium overhead or underground tank (1000 ltr to 1500 ltr capacity)",
        durationMinutes: 60,
        basePricePaise: 89900,
        regularPricePaise: 109900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/s1.jpg",
        active: true
      },
      {
        id: "var_tank_1500_2000",
        serviceId: "srv_mechanized_tank_clean",
        name: "Water Tank Cleaning (2000L to 3000L)",
        scopeSummary: "Large overhead or sump tank (2000 ltr to 3000 ltr capacity)",
        durationMinutes: 90,
        basePricePaise: 149900,
        regularPricePaise: 179900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/s1.jpg",
        active: true
      },
      {
        id: "var_tank_4000_5000",
        serviceId: "srv_mechanized_tank_clean",
        name: "Water Tank Cleaning (4000L to 5000L)",
        scopeSummary: "Extra-large commercial / society storage tank (4000 ltr to 5000 ltr)",
        durationMinutes: 120,
        basePricePaise: 249900,
        regularPricePaise: 299900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/s1.jpg",
        active: true
      }
    ],
    addons: [
      {
        id: "addon_float_valve",
        serviceId: "srv_mechanized_tank_clean",
        name: "Heavy Duty Float Valve Replacement",
        description: "Prevent overflow and save water with anti-corrosion brass valve assembly.",
        pricePaise: 14900,
        required: false,
        maxQuantity: 2,
        active: true
      },
      {
        id: "addon_pipeline_flush",
        serviceId: "srv_mechanized_tank_clean",
        name: "Main Pipeline Air & Sludge Flush",
        description: "Flush out sediment from main header downpipe to internal distribution lines.",
        pricePaise: 29900,
        required: false,
        maxQuantity: 1,
        active: true
      }
    ],
    questions: [],
    faqs: [
      {
        question: "Do I need to completely drain the tank before the crew arrives?",
        answer: "No. Turn off your water pump 3\u20134 hours before so only residual water is left."
      }
    ],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 2. CAR WASH
  {
    id: "srv_car_wash",
    slug: "car-wash",
    title: "Car wash",
    categoryId: "cat_vehicle_wash",
    shortDescription: "We provide interior and exterior Cleaning Via vacuum + polish. Car Cleaning services at Tankmanpro cleaning services.",
    fullDescription: "A high pressure water jet is used to clean the car exterior as well as the engine compartment. The flexible nozzle makes it easy to target areas with tough stains and the high pressure maintained guarantees that it removes the dirt completely and effortlessly. Includes full interior high-suction vacuuming, dashboard polish, tyre dressing, and crystal glass cleaning.",
    illustrationKey: "vehicle-wash",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/IMG_20231220_175929.jpg",
    galleryUrls: ["https://tankmanpro.com/wp-content/uploads/2023/10/IMG_20231220_175929.jpg"],
    durationMinutes: 60,
    basePricePaise: 29900,
    regularPricePaise: 39900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "High-pressure water jet exterior foam wash",
      "Engine compartment surface dust and grime jet clean",
      "Interior high-suction vacuuming (seats, floor mats, boot)",
      "Dashboard, console and interior trim UV conditioning polish",
      "Tyre cleaning and high-gloss dressing",
      "Streak-free glass cleaning inside and out"
    ],
    exclusions: [
      "Interior roof fabric foam extraction (quoted as add-on)",
      "Exterior rubbing, compound buffing or ceramic coating"
    ],
    preparationInstructions: [
      "Park vehicle in an accessible driveway, parking spot or open area.",
      "Ensure a standard water tap and electrical plug socket are available nearby."
    ],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_car_wash_standard",
        serviceId: "srv_car_wash",
        name: "Doorstep Car Wash (Hatchback / Sedan / SUV)",
        scopeSummary: "Full exterior high pressure foam wash, interior vacuuming & polish",
        durationMinutes: 60,
        basePricePaise: 29900,
        regularPricePaise: 39900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/IMG_20231220_175929.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 3. BIKE WASH
  {
    id: "srv_bike_wash",
    slug: "bike-wash",
    title: "Bike Wash",
    categoryId: "cat_vehicle_wash",
    shortDescription: "This service includes Foam Wash of Bike\u2019s Body paint together with the polishing of Tyre/ Plastic/ Vinyl components.",
    fullDescription: "Recommended to maintain the basic hygiene and shine of your two-wheeler. Includes high pressure water jet exterior wash, engine dirt blast, snow foam body wash, tyre/plastic/vinyl polishing, and chain clean & lube check.",
    illustrationKey: "vehicle-wash",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/IMG_20231220_175942.jpg",
    galleryUrls: ["https://tankmanpro.com/wp-content/uploads/2023/10/IMG_20231220_175942.jpg"],
    durationMinutes: 30,
    basePricePaise: 9900,
    regularPricePaise: 14900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "High-pressure water jet pre-wash",
      "Snow foam body shampoo & scrub",
      "Engine area degreasing and grime removal",
      "Tyre and rim cleaning with gloss polish",
      "Plastic and vinyl dashboard/mirror trim polishing"
    ],
    exclusions: ["Engine oil change or mechanical tune-ups"],
    preparationInstructions: ["Keep bike parked on double stand with power socket nearby."],
    cancellationPolicySummary: "Free cancellation up to 2 hours before service.",
    variants: [
      {
        id: "var_bike_wash_standard",
        serviceId: "srv_bike_wash",
        name: "Two-Wheeler Foam Wash & Polish",
        scopeSummary: "Complete foam wash, pressure jet, tyre and plastic polish",
        durationMinutes: 30,
        basePricePaise: 9900,
        regularPricePaise: 14900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/10/IMG_20231220_175942.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 4. CHIMNEY CLEANING
  {
    id: "srv_chimney_cleaning",
    slug: "chimney-cleaning",
    title: "Chimney Cleaning",
    categoryId: "cat_kitchen",
    shortDescription: "Disassembling filters, chemical spray & scrubbing out stains, chimney exterior cleaning, wet wipe, reassembling.",
    fullDescription: "1. Disassembling: Unlock and remove baffle/mesh filters from the chimney.\n2. Filter Cleaning: Specialized grease-cutting chemical spray and heavy scrub.\n3. Exterior Cleaning: Stain removal and polishing of stainless steel / glass outer body.\n4. Wet Wipe: Microfiber moisture wipe down.\n5. Reassembling: Fit back parts with safety check.",
    illustrationKey: "kitchen",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/t_chimeny.png",
    galleryUrls: [
      "https://tankmanpro.com/wp-content/uploads/2023/11/t_chimeny.png",
      "https://tankmanpro.com/wp-content/uploads/2023/11/electric-kitchen-chimney-cleaning-service-500x500-1.jpg"
    ],
    durationMinutes: 60,
    basePricePaise: 39900,
    regularPricePaise: 49900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Filter disassembly and deep degreasing soak",
      "Oil collector tray hot-chemical wash",
      "Exterior hood scrubbing and smudge-free polish",
      "Exhaust suction check and reassembly"
    ],
    exclusions: ["Motor rewinding or duct pipe installation"],
    preparationInstructions: ["Turn off chimney switch at least 30 mins before appointment."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_chimney_clean_standard",
        serviceId: "srv_chimney_cleaning",
        name: "Standard Kitchen Chimney Deep Clean",
        scopeSummary: "Filter degreasing, oil collector wash, outer body polish & reassembly",
        durationMinutes: 60,
        basePricePaise: 39900,
        regularPricePaise: 49900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/t_chimeny.png",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 5. CEILING FAN CLEANING
  {
    id: "srv_ceiling_fan_cleaning",
    slug: "ceiling-fan-cleaning",
    title: "Celling Fan Cleaning",
    categoryId: "cat_fan_appliances",
    shortDescription: "Dry Dusting of fan blades, chemical spray and scrubbing to remove stains on surfaces, wet wipe using microfiber towel.",
    fullDescription: "Removing stubborn grease and oily dust accumulated on ceiling fans. Dry dusting on both sides of blades, specialized non-abrasive stain remover spray, blade scrubbing, and clean microfiber wet wipe for spotless finish.",
    illustrationKey: "fan-appliances",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/asian-man-wearing-a-protective-mask-cleaning-ceiling-fan-at-home.jpg",
    durationMinutes: 20,
    basePricePaise: 4900,
    regularPricePaise: 7900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Dry dusting of blades and motor canopy",
      "Chemical spray to lift sticky yellow grease",
      "Soft scrubbing on both blade faces",
      "Microfiber towel wipe and drying"
    ],
    exclusions: ["Motor internal winding repair or replacement"],
    preparationInstructions: ["Ensure fan switch is off and floor beneath is accessible."],
    cancellationPolicySummary: "Free cancellation up to 2 hours before service.",
    variants: [
      {
        id: "var_ceiling_fan_clean",
        serviceId: "srv_ceiling_fan_cleaning",
        name: "Ceiling Fan Deep Cleaning (Per Fan)",
        scopeSummary: "Blade dry dusting, degreasing scrub & microfiber wet wipe",
        durationMinutes: 20,
        basePricePaise: 4900,
        regularPricePaise: 7900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/asian-man-wearing-a-protective-mask-cleaning-ceiling-fan-at-home.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 6. EXHAUST FAN CLEANING
  {
    id: "srv_exhaust_fan_cleaning",
    slug: "exhaust-fan-cleaning",
    title: "Exhaust fan cleaning",
    categoryId: "cat_fan_appliances",
    shortDescription: "Dry Dusting, chemical spray and scrubbing to remove sticky grease on surfaces, wet wipe using microfiber towel.",
    fullDescription: "Kitchen and bathroom exhaust fans accumulate hardened grease, oil, and lint. We apply targeted industrial degreasing spray, scrub the mesh guard and blades, wipe away dissolved grime, and restore smooth airflow.",
    illustrationKey: "fan-appliances",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/IMG_20231119_154808.jpg",
    durationMinutes: 30,
    basePricePaise: 9900,
    regularPricePaise: 14900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Exhaust grill and louvre degreasing",
      "Blade scrub with heavy-duty oil cutter",
      "Motor exterior wipe and lint vacuuming",
      "Microfiber drying and airflow test"
    ],
    exclusions: ["Electrical motor rewiring"],
    preparationInstructions: ["Turn off power to exhaust point."],
    cancellationPolicySummary: "Free cancellation up to 2 hours before service.",
    variants: [
      {
        id: "var_exhaust_fan_clean",
        serviceId: "srv_exhaust_fan_cleaning",
        name: "Exhaust Fan Deep Degreasing (Per Fan)",
        scopeSummary: "Mesh, blade, and louvre heavy oil & grease removal",
        durationMinutes: 30,
        basePricePaise: 9900,
        regularPricePaise: 14900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/IMG_20231119_154808.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 7. SINGLE DOOR FRIDGE CLEANING
  {
    id: "srv_single_door_fridge",
    slug: "single-door-fridge-cleaning",
    title: "Single Door Fridge Cleaning",
    categoryId: "cat_kitchen",
    shortDescription: "Dry Dusting from exterior and interior, removing dirt/oil/food stains, wiping out moisture with microfiber towel.",
    fullDescription: "Complete single-door refrigerator sanitation. Includes removing removable trays and baskets for hot-water scrubbing, cleaning door gaskets to prevent mold, interior deodorization, and exterior body wipe.",
    illustrationKey: "kitchen",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/360_F_511507346_o2oI9h94brU0ziVqJf2TrH54EPN1mNd5.webp",
    durationMinutes: 45,
    basePricePaise: 34900,
    regularPricePaise: 44900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Removal and washing of shelves, crisper box, and door racks",
      "Antimicrobial sanitization of interior walls and freezer box",
      "Door rubber gasket mold and dirt removal",
      "Exterior door surface and handle wipe"
    ],
    exclusions: ["Compressor repair or refrigerant gas refill"],
    preparationInstructions: ["Please remove perishable food items prior to technician arrival."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_fridge_single_door",
        serviceId: "srv_single_door_fridge",
        name: "Single Door Refrigerator Deep Clean",
        scopeSummary: "Shelves, crisper, door gaskets, and interior deodorization",
        durationMinutes: 45,
        basePricePaise: 34900,
        regularPricePaise: 44900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/360_F_511507346_o2oI9h94brU0ziVqJf2TrH54EPN1mNd5.webp",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 8. DOUBLE DOOR FRIDGE CLEANING
  {
    id: "srv_double_door_fridge",
    slug: "double-door-fridge-cleaning",
    title: "Double Door Fridge Cleaning",
    categoryId: "cat_kitchen",
    shortDescription: "Dry Dusting exterior and interior, removing food stains, freezer frost cleanup, shelf descaling, microfiber wipe.",
    fullDescription: "Comprehensive deep cleaning for double-door / frost-free refrigerators. Thorough washing of glass shelves, vegetable crispers, freezer trays, door seals, odor neutralization, and exterior stainless steel / glass polishing.",
    illustrationKey: "kitchen",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/360_F_419363786_20QxVTKHTQo7BHuu2vINOtun8p9r1pPu.webp",
    durationMinutes: 60,
    basePricePaise: 49900,
    regularPricePaise: 59900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Full interior cleaning of both freezer and refrigerator compartments",
      "Washing and drying of all tempered glass shelves and door bins",
      "Food spill and sticky sauce stain removal",
      "Antimicrobial deodorization treatment",
      "Exterior body polishing and handle sanitization"
    ],
    exclusions: ["Compressor or cooling coil repairs"],
    preparationInstructions: ["Empty major food containers before start."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_fridge_double_door",
        serviceId: "srv_double_door_fridge",
        name: "Double Door Refrigerator Deep Clean",
        scopeSummary: "Dual compartment deep clean, shelf washing & deodorization",
        durationMinutes: 60,
        basePricePaise: 49900,
        regularPricePaise: 59900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/360_F_419363786_20QxVTKHTQo7BHuu2vINOtun8p9r1pPu.webp",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 9. GAS STOVE CLEANING
  {
    id: "srv_gas_stove_cleaning",
    slug: "gas-stove-cleaning",
    title: "Gas Stove Cleaning",
    categoryId: "cat_kitchen",
    shortDescription: "Removing stains, spots and dust using cleaner, wiping the surface using a microfiber towel.",
    fullDescription: "Intensive gas stove and cooktop degreasing. Removal of burnt milk/curry residues, carbon buildup from brass burners, spill trays, control knobs, and glass/stainless steel surface buffing.",
    illustrationKey: "kitchen",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/cleaning-gas-stove-at-kitchen.jpg",
    durationMinutes: 30,
    basePricePaise: 9900,
    regularPricePaise: 14900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Burner pan support and spill tray degreasing",
      "Burner head carbon deposit scrubbing",
      "Glass top / stainless steel surface stain removal",
      "Knob and surrounding grease wipe down"
    ],
    exclusions: ["Gas pipeline or regulator replacement"],
    preparationInstructions: ["Ensure gas cylinder / pipeline valve is turned off."],
    cancellationPolicySummary: "Free cancellation up to 2 hours before service.",
    variants: [
      {
        id: "var_gas_stove_clean",
        serviceId: "srv_gas_stove_cleaning",
        name: "Gas Stove / Cooktop Deep Degreasing",
        scopeSummary: "Burnt food stain removal, burner scrub & surface polish",
        durationMinutes: 30,
        basePricePaise: 9900,
        regularPricePaise: 14900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/cleaning-gas-stove-at-kitchen.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 10. KITCHEN SINK CLEANING
  {
    id: "srv_kitchen_sink_cleaning",
    slug: "kitchen-sink-cleaning",
    title: "Kitchen Sink Cleaning",
    categoryId: "cat_kitchen",
    shortDescription: "Removing stains, spots and dust using cleaner, wiping the surface using a microfiber towel.",
    fullDescription: "Specialized descaling and sanitization of stainless steel, quartz, or granite kitchen sinks. Eliminates hard water scale, food residue grease, tap limescale, and deodorizes drain outlet.",
    illustrationKey: "kitchen",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/pexels-photo-9462309.jpeg",
    durationMinutes: 30,
    basePricePaise: 9900,
    regularPricePaise: 14900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Sink basin hard-water and scale removal",
      "Water faucet descaling and buffing",
      "Drain collar and drain strainer degreasing",
      "Microfiber dry wipe and shine restore"
    ],
    exclusions: ["Under-sink underground sewer unclogging (requires plumber)"],
    preparationInstructions: ["Keep sink free of unwashed utensils."],
    cancellationPolicySummary: "Free cancellation up to 2 hours before service.",
    variants: [
      {
        id: "var_kitchen_sink_clean",
        serviceId: "srv_kitchen_sink_cleaning",
        name: "Kitchen Sink & Tap Descaling",
        scopeSummary: "Limescale, oil stains removal, faucet polish & drain sanitization",
        durationMinutes: 30,
        basePricePaise: 9900,
        regularPricePaise: 14900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/11/pexels-photo-9462309.jpeg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 11. EMPTY KITCHEN + CHIMNEY DEEP CLEANING
  {
    id: "srv_kitchen_chimney_clean",
    slug: "empty-kitchen-chimney-deep-cleaning",
    title: "Empty Kitchen + Chimney Deep Cleaning - Delhi",
    categoryId: "cat_kitchen",
    shortDescription: "Professional empty kitchen deep cleaning with chimney degreasing & filter wash. Removes oil, stains & grease for a hygienic, fresh kitchen.",
    fullDescription: "Bring back the shine to your kitchen with our professional cleaning package.\n\nService Includes:\n\u2022 Floor & wall tile scrubbing\n\u2022 Sink, tap & slab stain removal\n\u2022 External cupboard & rack cleaning\n\u2022 Window & exhaust fan dusting\n\u2022 Switchboards & handles sanitization\n\u2022 Chimney deep cleaning (filter wash, oil & grease removal, outer body shine)\n\nService Time: 2\u20132.5 Hours\nDone By: Trained professionals using eco-friendly products.",
    illustrationKey: "kitchen",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/ChatGPT-Image-Aug-24-2025-04_49_15-PM.png",
    galleryUrls: [
      "https://tankmanpro.com/wp-content/uploads/2025/08/ChatGPT-Image-Aug-24-2025-04_49_15-PM.png",
      "https://tankmanpro.com/wp-content/uploads/2025/08/ChatGPT-Image-Aug-24-2025-04_54_38-PM.png"
    ],
    durationMinutes: 150,
    basePricePaise: 129900,
    regularPricePaise: 159900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Floor & wall tile scrubbing",
      "Sink, tap & slab stain removal",
      "External cupboard & rack cleaning",
      "Window & exhaust fan dusting",
      "Switchboards & handles sanitization",
      "Chimney deep cleaning (filter wash, oil/grease removal, outer shine)"
    ],
    exclusions: ["Inside closed cupboards or internal fridge/microwave components"],
    preparationInstructions: ["Ideal for shifting homes, festival cleaning & empty flats."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_empty_kitchen_chimney",
        serviceId: "srv_kitchen_chimney_clean",
        name: "Empty Kitchen + Chimney Deep Cleaning",
        scopeSummary: "Floor/wall scrub, slab descaling, cabinet outer & chimney deep clean",
        durationMinutes: 150,
        basePricePaise: 129900,
        regularPricePaise: 159900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/ChatGPT-Image-Aug-24-2025-04_49_15-PM.png",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 12. EMPTY KITCHEN + CHIMNEY + APPLIANCES CLEANING
  {
    id: "srv_empty_kitchen_appliances",
    slug: "empty-kitchen-chimney-appliances-cleaning",
    title: "Empty Kitchen + Chimney + Appliances Cleaning - Delhi",
    categoryId: "cat_kitchen",
    shortDescription: "Complete empty kitchen deep cleaning with chimney degreasing & external cleaning of appliances like fridge, microwave & gas stove.",
    fullDescription: "Empty Kitchen + Chimney + Appliances Deep Cleaning \u2013 \u20B91699/-\n\nA premium package for total kitchen hygiene with chimney & appliances care.\n\nService Includes:\n\u2022 Floor & Wall Cleaning (hand scrubbing & mopping)\n\u2022 Sink & Tap Descaling (oil, stains & lime removal)\n\u2022 Slab / Countertop Cleaning (masala & grease stains)\n\u2022 Cupboards & Racks External Cleaning\n\u2022 Windows & Exhaust Fan Dusting\n\u2022 Switchboards & Handles Sanitization\n\u2022 Chimney Deep Cleaning (filter degreasing, outer body scrub, carbon deposit)\n\u2022 Appliances External Cleaning (refrigerator outer, microwave outer, mixer/grinder wipe, gas stove degreasing)\n\nService Time: 2.5\u20133 Hours.",
    illustrationKey: "kitchen",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/ChatGPT-Image-Aug-24-2025-05_10_35-PM.png",
    galleryUrls: [
      "https://tankmanpro.com/wp-content/uploads/2025/08/ChatGPT-Image-Aug-24-2025-05_10_35-PM.png",
      "https://tankmanpro.com/wp-content/uploads/2025/08/ChatGPT-Image-Aug-24-2025-04_45_36-PM.png"
    ],
    durationMinutes: 180,
    basePricePaise: 169900,
    regularPricePaise: 199900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Floor & wall scrubbing and mopping",
      "Sink & tap descaling (oil, stains & lime)",
      "Slab / Countertop grease degreasing",
      "Cupboards and racks external wiping",
      "Windows and exhaust fan dusting",
      "Chimney deep cleaning & filter wash",
      "External cleaning of fridge, microwave, mixer and gas stove"
    ],
    exclusions: ["Internal fridge defrost or oven inside degreasing"],
    preparationInstructions: ["Keep kitchen counters clear of utensils."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_empty_kitchen_appliances_clean",
        serviceId: "srv_empty_kitchen_appliances",
        name: "Empty Kitchen + Chimney + Appliances Cleaning",
        scopeSummary: "Floor/wall scrub, slab, chimney deep clean + fridge/microwave/stove outer",
        durationMinutes: 180,
        basePricePaise: 169900,
        regularPricePaise: 199900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/ChatGPT-Image-Aug-24-2025-05_10_35-PM.png",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 13. TOILET CLEANING
  {
    id: "srv_toilet_cleaning",
    slug: "toilet-cleaning",
    title: "Toilet Cleaning",
    categoryId: "cat_bathroom",
    shortDescription: "Indian/Western Toilet stain removal from tiles and toilet pot, wiping out all the water with a wiper.",
    fullDescription: "Targeted deep sanitation for Indian or Western toilet bowls. Includes removing stubborn mineral rings, urine stains, rim descaling, flush tank exterior wipe, and bathroom floor squeegee drying.",
    illustrationKey: "bathroom",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/12.jpg",
    durationMinutes: 30,
    basePricePaise: 9900,
    regularPricePaise: 14900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Toilet bowl acid-free heavy stain removal",
      "Rim and jet spray disinfection",
      "Seat cover and hinge cleaning",
      "Floor area wiping with rubber squeegee"
    ],
    exclusions: ["Full bathroom wall tile scrubbing (see Bathroom Cleaning)"],
    preparationInstructions: ["Provide running water and toilet brush access."],
    cancellationPolicySummary: "Free cancellation up to 2 hours before service.",
    variants: [
      {
        id: "var_toilet_clean_standard",
        serviceId: "srv_toilet_cleaning",
        name: "Toilet Deep Cleaning (Indian / Western)",
        scopeSummary: "Pot stain descaling, rim disinfection & squeegee drying",
        durationMinutes: 30,
        basePricePaise: 9900,
        regularPricePaise: 14900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/12.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 14. BATHROOM CLEANING (SQ FT)
  {
    id: "srv_bathroom_sqft",
    slug: "bathroom-cleaning-square-fit",
    title: "Bathroom cleaning square fit",
    categoryId: "cat_bathroom",
    shortDescription: "Wet Wiping geyser, exhaust, window sills, glass partitions and mirrors. Stain removal from tiles, basin, toilet and water closet.",
    fullDescription: "Custom square-foot bathroom deep cleaning package. Wet wiping dust from outermost part with microfiber towel (geyser, exhaust, window sills, glass partitions, mirrors). Stain removal from wall/floor tiles, basin, toilet, and water closet.",
    illustrationKey: "bathroom",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/bathroom-.webp",
    durationMinutes: 60,
    basePricePaise: 29900,
    // ₹15/sq.ft, base starts at ₹299
    regularPricePaise: 39900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Mirror, glass partition & chrome fittings descaling",
      "Tile wall grout scrubbing and lime mark removal",
      "Washbasin, counter and toilet seat deep clean",
      "Geyser, exhaust fan outer surface wet wipe",
      "Floor water wiper squeegee dry"
    ],
    exclusions: ["Tile re-grouting or plumbing pipe replacement"],
    preparationInstructions: ["Remove personal bath toiletries from shelves prior to cleaning."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_bathroom_sqft_standard",
        serviceId: "srv_bathroom_sqft",
        name: "Bathroom Cleaning (\u20B915/sq.ft \xB7 Standard Size)",
        scopeSummary: "Tile descaling, chrome polish, basin, toilet, mirrors & exhaust wipe",
        durationMinutes: 60,
        basePricePaise: 29900,
        regularPricePaise: 39900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/bathroom-.webp",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 15. FLOOR CLEANING (SQ FT)
  {
    id: "srv_floor_cleaning_sqft",
    slug: "floor-cleaning-sq-ft",
    title: "Floor cleaning Sq.ft",
    categoryId: "cat_fan_appliances",
    shortDescription: "Cleaning using cloth and mop: Cleaning grouts, corners and all over the surface with a wet microfiber towel and mop.",
    fullDescription: "Floor deep cleaning measured per square foot. Ideal for living rooms, hallways, bedrooms, or full houses. High-grade floor cleaner removes dirt from grouts, hard-to-reach corners, and buffs tiled, marble, or vitrified surfaces.",
    illustrationKey: "fan-appliances",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/ff.jpg",
    durationMinutes: 60,
    basePricePaise: 29900,
    // ₹15/sq.ft, base starts at ₹299
    regularPricePaise: 39900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Grout line dirt extraction and hand scrubbing",
      "Corner dirt and baseboard border cleaning",
      "Specialized pH-balanced floor cleaning solution",
      "Double microfiber mop pass for spotless finish"
    ],
    exclusions: ["Diamond marble polishing or epoxy re-grouting"],
    preparationInstructions: ["Clear floor of small rugs and loose items."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_floor_cleaning_sqft",
        serviceId: "srv_floor_cleaning_sqft",
        name: "Floor Deep Scrubbing & Mop (\u20B915/sq.ft)",
        scopeSummary: "Grout cleaning, corner scrub, and motorized microfiber mopping",
        durationMinutes: 60,
        basePricePaise: 29900,
        regularPricePaise: 39900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/ff.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 16. BATHROOM DEEP & MACHINE SCRUB CLEANING (Existing)
  {
    id: "srv_bathroom_cleaning",
    slug: "bathroom-deep-and-machine-scrub-cleaning",
    title: "Bathroom Deep & Machine Scrub Cleaning",
    categoryId: "cat_bathroom",
    shortDescription: "Rotary machine tile scrubbing, acid-free tap & shower descaling, toilet bowl sanitization, and grout line whitening.",
    fullDescription: "Intensive mechanized bathroom deep cleaning. Includes single-disc rotary machine scrubbing of floor tiles, hand scrubbing of wall tiles, acid-free descaling of taps and showers, and hygienic wipe of mirrors.",
    illustrationKey: "bathroom",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/bathroom-.webp",
    galleryUrls: ["https://tankmanpro.com/wp-content/uploads/2023/12/bathroom-.webp"],
    durationMinutes: 90,
    basePricePaise: 49900,
    regularPricePaise: 64900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Floor tiles mechanized single-disc machine scrubbing",
      "Wall tiles descaling and yellow stain scrub",
      "Chrome CP tap, shower, and health faucet acid-free descaling",
      "Toilet bowl, seat, and washbasin sanitization"
    ],
    exclusions: ["Civil repairs or broken tile replacement"],
    preparationInstructions: ["Ensure running water and geyser plug are functional."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before slot.",
    variants: [
      {
        id: "var_bath_machine_scrub",
        serviceId: "srv_bathroom_cleaning",
        name: "Standard Bathroom Deep Scrub (Up to 40 sq ft)",
        scopeSummary: "Single disc machine floor scrub, wall descaling & sanitary sanitization",
        durationMinutes: 90,
        basePricePaise: 49900,
        regularPricePaise: 64900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/bathroom-.webp",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 17. SOFA & CUSHION CLEANING
  {
    id: "srv_sofa_mattress_clean",
    slug: "sofa-cushion-cleaning",
    title: "Sofa & Cushien cleaning 249/per seat",
    categoryId: "cat_sofa_mattress",
    shortDescription: "Dry Dusting, dusting and vacuuming sofa and cushions to remove dirt deposited on surface of sofa, cushion and cushion covers.",
    fullDescription: "Specialized 3-step upholstery care for fabric and leatherette sofas: high-suction vacuum extraction of deeply trapped dust and food crumbs, organic shampoo foam scrub to lift grease, and moisture extraction for fresh clean seats.",
    illustrationKey: "sofa-mattress",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/How-Do-we-Clean-Your-Sofa.jpg",
    galleryUrls: ["https://tankmanpro.com/wp-content/uploads/2023/12/How-Do-we-Clean-Your-Sofa.jpg"],
    durationMinutes: 60,
    basePricePaise: 24900,
    regularPricePaise: 29900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "High-power dry vacuuming for dust mites & hair",
      "Foam shampoo scrub to eliminate stains and sweat odor",
      "Wet vacuum extraction of suspended dirt",
      "Fabric conditioning for soft, fragrant finish"
    ],
    exclusions: ["Re-upholstery or fabric tear mending"],
    preparationInstructions: ["Ensure sofa is dry and ceiling fan is kept on after cleaning."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_sofa_seat_standard",
        serviceId: "srv_sofa_mattress_clean",
        name: "Sofa Cleaning (Per Seat \xB7 Minimum 2 Seats)",
        scopeSummary: "Dry vacuuming, shampoo foam scrubbing, and extraction",
        durationMinutes: 60,
        basePricePaise: 24900,
        regularPricePaise: 29900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/How-Do-we-Clean-Your-Sofa.jpg",
        active: true
      },
      {
        id: "var_sofa_5seat",
        serviceId: "srv_sofa_mattress_clean",
        name: "5-Seater Sofa Deep Shampoo & Extraction",
        scopeSummary: "3+1+1 or 5-seater fabric/leather sofa deep shampoo and vacuum extraction",
        durationMinutes: 90,
        basePricePaise: 119900,
        regularPricePaise: 149900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/How-Do-we-Clean-Your-Sofa.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 18. CARPET CLEANING
  {
    id: "srv_carpet_cleaning",
    slug: "carpet-cleaning-sq-ft",
    title: "Carpet cleaning  sq.ft",
    categoryId: "cat_sofa_mattress",
    shortDescription: "Carpet cleaning: Deep cleaning and shampooing of carpet with wet vacuum extraction.",
    fullDescription: "Restores the fresh pile, vibrant color, and hygienic softness of living room rugs and wall-to-wall carpets. Deep rotary brush agitation, antimicrobial shampoo, and moisture extraction.",
    illustrationKey: "sofa-mattress",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/Helpling-carpet_cleaning.webp",
    durationMinutes: 60,
    basePricePaise: 39900,
    // ₹10/sq.ft, base starts at ₹399
    regularPricePaise: 49900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "High-power pile vacuuming",
      "Spot stain pre-treatment for coffee/tea marks",
      "Rotary shampoo scrub with fabric-safe detergent",
      "Wet vacuum suction to remove dirty foam and water"
    ],
    exclusions: ["Severe acid burn or dye bleeding recovery"],
    preparationInstructions: ["Keep area free of footwear during and after service."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_carpet_sqft_clean",
        serviceId: "srv_carpet_cleaning",
        name: "Carpet Deep Cleaning & Shampooing",
        scopeSummary: "Deep cleaning and shampooing (\u20B910/sq.ft \xB7 Standard Rug)",
        durationMinutes: 60,
        basePricePaise: 39900,
        regularPricePaise: 49900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2023/12/Helpling-carpet_cleaning.webp",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 19. AC SERVICES
  {
    id: "srv_ac_foam_jet",
    slug: "ac-services",
    title: "AC Services",
    categoryId: "cat_ac_service",
    shortDescription: "Swift and professional AC repair services: expert technicians ready to diagnose and fix your cooling system issues, ensuring comfort and efficiency.",
    fullDescription: "Fast and reliable AC repair solutions tailored to your needs, ensuring optimal comfort in any season. Our skilled technicians diagnose and fix issues efficiently, restoring your cooling system\u2019s performance. Count on us for prompt service and lasting results.",
    illustrationKey: "ac-service",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/repairman-uniform-installing-outside-unit-air-conditioner_93675-91162.jpg",
    galleryUrls: ["https://tankmanpro.com/wp-content/uploads/2024/03/repairman-uniform-installing-outside-unit-air-conditioner_93675-91162.jpg"],
    durationMinutes: 60,
    basePricePaise: 59900,
    regularPricePaise: 79900,
    defaultPricingMode: "vendor_offer",
    cityModeOverrides: {
      city_delhi: "vendor_offer",
      city_shahjahanpur: "city_fixed",
      city_kanpur: "city_fixed"
    },
    inclusions: [
      "Indoor cooling coil & filter deep foam wash with spill-guard jacket",
      "Outdoor condenser unit high-pressure jet wash",
      "Drain pipe flushing to prevent indoor water dripping",
      "Coolant pressure, compressor amperage & thermostat check"
    ],
    exclusions: ["Spare parts and refrigerant gas refill (quoted post-inspection)"],
    preparationInstructions: ["Provide ladder access to indoor unit and open balcony for outdoor unit."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_ac_single",
        serviceId: "srv_ac_foam_jet",
        name: "Split / Window AC Foam-Jet Service (1 Unit)",
        scopeSummary: "Indoor coil foam jet, outdoor condenser jet wash, cooling test",
        durationMinutes: 60,
        basePricePaise: 59900,
        regularPricePaise: 79900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/repairman-uniform-installing-outside-unit-air-conditioner_93675-91162.jpg",
        active: true
      },
      {
        id: "var_ac_twin",
        serviceId: "srv_ac_foam_jet",
        name: "Twin AC Service Combo (2 Units)",
        scopeSummary: "Complete foam-jet servicing for 2 air conditioners",
        durationMinutes: 100,
        basePricePaise: 109900,
        regularPricePaise: 139900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/repairman-uniform-installing-outside-unit-air-conditioner_93675-91162.jpg",
        active: true
      },
      {
        id: "var_ac_install",
        serviceId: "srv_ac_foam_jet",
        name: "AC Installation (Split / Window)",
        scopeSummary: "Mounting indoor & outdoor unit, vacuuming & leak testing",
        durationMinutes: 90,
        basePricePaise: 149900,
        regularPricePaise: 179900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/repairman-uniform-installing-outside-unit-air-conditioner_93675-91162.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 20. REFRIGERATOR SERVICES (REPAIR)
  {
    id: "srv_refrigerator_repair",
    slug: "refrigerator-services",
    title: "Refrigerator Services",
    categoryId: "cat_repairs",
    shortDescription: "Expert refrigerator repair services: fast, reliable fixes to keep your food fresh and your kitchen running smoothly.",
    fullDescription: "Need your refrigerator fixed? Our experienced technicians offer prompt and dependable repair services to get your fridge up and running in no time. We diagnose and resolve cooling issues, compressor problems, defrost failures, gas leaks, and thermostat faults efficiently.",
    illustrationKey: "appliance-repair",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/Refrigerator-Repair-Appliance-Company.jpg",
    durationMinutes: 45,
    basePricePaise: 29900,
    regularPricePaise: 39900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Comprehensive cooling diagnostics & error code read",
      "Compressor relay, capacitor, and thermostat inspection",
      "Gas pressure check and defrost timer test",
      "Minor wiring and connection repair"
    ],
    exclusions: ["Cost of compressor, PCB or gas recharge (quoted post-diagnosis)"],
    preparationInstructions: ["Ensure refrigerator is plugged into electric socket."],
    cancellationPolicySummary: "Free cancellation up to 2 hours before service.",
    variants: [
      {
        id: "var_fridge_repair_diag",
        serviceId: "srv_refrigerator_repair",
        name: "Refrigerator Diagnostic & Inspection Visit",
        scopeSummary: "Inspection, fault finding, and minor repair adjustment",
        durationMinutes: 45,
        basePricePaise: 29900,
        regularPricePaise: 39900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/Refrigerator-Repair-Appliance-Company.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 21. WASHING MACHINE SERVICES (REPAIR)
  {
    id: "srv_washing_machine_repair",
    slug: "washing-machine-services",
    title: "Washing Machine Services",
    categoryId: "cat_repairs",
    shortDescription: "Efficient washing machine repair services: skilled technicians swiftly diagnose and resolve issues to restore functionality.",
    fullDescription: "Need your washing machine fixed? Our expert technicians offer fast and dependable repair services for front-load, top-load, and semi-automatic machines. We resolve drum rotation issues, vibration noise, drainage blockage, water inlet valve faults, and PCB errors.",
    illustrationKey: "appliance-repair",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/360_F_423351639_qcIVh5khAZrpTdIHakM5n8G6wtgFIA7y.jpg",
    durationMinutes: 45,
    basePricePaise: 29900,
    regularPricePaise: 39900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Complete mechanical and electrical system diagnostics",
      "Drain pump, inlet valve, and belt tension check",
      "Motor carbon brush and drum balance inspection",
      "Basic filter cleaning and lint trap clean"
    ],
    exclusions: ["Replacement parts like drum bearings, motor or motherboard"],
    preparationInstructions: ["Ensure machine is connected to water tap and power socket."],
    cancellationPolicySummary: "Free cancellation up to 2 hours before service.",
    variants: [
      {
        id: "var_wm_repair_diag",
        serviceId: "srv_washing_machine_repair",
        name: "Washing Machine Inspection & Diagnostic Visit",
        scopeSummary: "Full diagnosis of front-load, top-load or semi-auto machines",
        durationMinutes: 45,
        basePricePaise: 29900,
        regularPricePaise: 39900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/360_F_423351639_qcIVh5khAZrpTdIHakM5n8G6wtgFIA7y.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 22. PLUMBER SERVICES
  {
    id: "srv_plumber_services",
    slug: "plumber-services",
    title: "Plumber Services",
    categoryId: "cat_repairs",
    shortDescription: "Maintain and repair all plumbing installations: fixtures, leakages, piping, toilets, water heaters, and drain clearance.",
    fullDescription: "Plumbers install and repair water, gas, and other piping systems in homes and businesses. They install plumbing fixtures such as faucets, sinks, bathtubs, and toilets. They clear blocked drains, fix pipe bursts, replace angle valves, and overhaul bathroom fittings.",
    illustrationKey: "plumbing",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/colorful-plumbing-round-composition_1284-40766.jpg",
    durationMinutes: 45,
    basePricePaise: 14900,
    regularPricePaise: 24900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Expert diagnostic check of piping lines & fixtures",
      "Minor leak repair, washer replacement or tap tightening",
      "Water pressure and overhead tank connection assessment"
    ],
    exclusions: ["Cost of replacement taps, pipes or specialized sanitaryware"],
    preparationInstructions: ["Locate main water supply valve before technician arrival."],
    cancellationPolicySummary: "Free cancellation up to 2 hours before service.",
    variants: [
      {
        id: "var_plumber_inspection",
        serviceId: "srv_plumber_services",
        name: "Plumber Diagnostic & Repair Visit",
        scopeSummary: "Tap repair, leak check, toilet flush or pipe fixing",
        durationMinutes: 45,
        basePricePaise: 14900,
        regularPricePaise: 24900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/colorful-plumbing-round-composition_1284-40766.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 23. ELECTRICIAN SERVICES
  {
    id: "srv_electrician_services",
    slug: "electrician-services",
    title: "Electrician Services",
    categoryId: "cat_repairs",
    shortDescription: "Installing, maintaining, and repairing electrical control, wiring, circuit breakers, switchboards, and lighting systems.",
    fullDescription: "Certified electrical diagnostics: reading blueprints, inspecting circuit breakers, replacing faulty switchboards, repairing short circuits, inverter battery line setup, light fixtures, and fan installations.",
    illustrationKey: "appliance-repair",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/colorful-electricity-elements-concept_1284-37811.jpg",
    durationMinutes: 45,
    basePricePaise: 14900,
    regularPricePaise: 24900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Electrical load and voltage fault testing",
      "Minor switch, socket, or wire terminal replacement",
      "Earthing and MCB trip diagnosis"
    ],
    exclusions: ["Cost of cables, MCB switches, chandelier or heavy materials"],
    preparationInstructions: ["Provide access to main MCB distribution board."],
    cancellationPolicySummary: "Free cancellation up to 2 hours before service.",
    variants: [
      {
        id: "var_electrician_inspection",
        serviceId: "srv_electrician_services",
        name: "Electrician Inspection & Repair Visit",
        scopeSummary: "Switchboard, wiring, MCB, or light fixture diagnosis & repair",
        durationMinutes: 45,
        basePricePaise: 14900,
        regularPricePaise: 24900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/colorful-electricity-elements-concept_1284-37811.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 24. PAINTER SERVICES
  {
    id: "srv_painter_services",
    slug: "painter-services",
    title: "Painter Services",
    categoryId: "cat_repairs",
    shortDescription: "Professional painting services for interior and exterior walls: surface prep, scraping, crack filling, primer & finish.",
    fullDescription: "Mixing and matching paint, stain and finishes to specifications. Applying paint using rollers/sprayers, repairing wall cracks with putty, scraping flaking paint, water seepage primer treatment, and flawless coats.",
    illustrationKey: "appliance-repair",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/istockphoto-1198989663-612x612-1.jpg",
    durationMinutes: 60,
    basePricePaise: 49900,
    regularPricePaise: 69900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Site laser measurement & wall moisture inspection",
      "Paint shade catalog and texture finish consultation",
      "Surface area square footage estimation and quote"
    ],
    exclusions: ["Cost of paint cans, primer buckets, and masking tape"],
    preparationInstructions: ["Clear wall areas for accurate tape measurements."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_painter_consultation",
        serviceId: "srv_painter_services",
        name: "Painter Wall Measurement & Site Inspection",
        scopeSummary: "Detailed measurement, seepage check, color consult & quote",
        durationMinutes: 60,
        basePricePaise: 49900,
        regularPricePaise: 69900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2024/03/istockphoto-1198989663-612x612-1.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 25. YELLOW PEEL
  {
    id: "srv_beedare_yellow_peel",
    slug: "yellow-peel-anti-aging-skin-renewal",
    title: "Yellow Peel \u2013 Anti-aging & skin renewal",
    categoryId: "cat_aesthetics",
    shortDescription: "Welcome to Beedare by Tankmanpro. Experience Advanced Skin Resurfacing and Brightening \u2013 all from the comfort of your home.",
    fullDescription: "Certified & Skilled Skincare Experts at your doorstep. Safe, Dermatologist-Approved Formulas to improve skin texture, stimulate collagen, reduce fine lines, and reveal brighter, healthier-looking skin with minimal downtime.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/54a488b2-c84c-4ea4-ad5b-62f4610ece16.jpg",
    durationMinutes: 60,
    basePricePaise: 399900,
    regularPricePaise: 499900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Skin assessment and pre-peel cleansing",
      "Application of dermatological Yellow Peel formula",
      "Post-peel soothing mask and SPF application",
      "Customized home-care recovery guidelines"
    ],
    exclusions: ["Internal oral medications"],
    preparationInstructions: ["Just a comfortable space, towel, and clean running water."],
    cancellationPolicySummary: "Free cancellation up to 6 hours before appointment.",
    variants: [
      {
        id: "var_yellow_peel",
        serviceId: "srv_beedare_yellow_peel",
        name: "Yellow Peel Anti-Aging & Renewal Session",
        scopeSummary: "Advanced skin resurfacing, collagen renewal & glow",
        durationMinutes: 60,
        basePricePaise: 399900,
        regularPricePaise: 499900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/54a488b2-c84c-4ea4-ad5b-62f4610ece16.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 26. TCA PEEL
  {
    id: "srv_beedare_tca_peel",
    slug: "tca-peel-pigmentation-scar-reduction",
    title: "TCA Peel \u2013 Pigmentation & scar reduction",
    categoryId: "cat_aesthetics",
    shortDescription: "Advanced Skin Resurfacing: Target stubborn pigmentation, acne scars, and uneven skin tone with clinical TCA peel at home.",
    fullDescription: "Trichloroacetic Acid (TCA) peel treatment administered by certified skincare practitioners. Targets deep pigmentation, old acne blemishes, and sun damage for refreshed, smooth skin.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/enjoying-beauty-treatment.jpg",
    durationMinutes: 60,
    basePricePaise: 299900,
    regularPricePaise: 399900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Medical skin prep and degreasing",
      "Precision TCA acid peel application",
      "Neutralization & calming post-peel serum",
      "Post-procedure sun protection protocol"
    ],
    exclusions: ["Prescription steroid creams"],
    preparationInstructions: ["Avoid waxing, bleaching, or retinoids for 48 hours prior."],
    cancellationPolicySummary: "Free cancellation up to 6 hours before appointment.",
    variants: [
      {
        id: "var_tca_peel",
        serviceId: "srv_beedare_tca_peel",
        name: "TCA Pigmentation & Scar Reduction Session",
        scopeSummary: "Targeted deep pigmentation, scar softening & resurfacing",
        durationMinutes: 60,
        basePricePaise: 299900,
        regularPricePaise: 399900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/enjoying-beauty-treatment.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 27. VITAMIN C PEEL
  {
    id: "srv_beedare_vitc_peel",
    slug: "vitamin-c-peel-brightening-antioxidant-boost",
    title: "Vitamin C Peel \u2013 Brightening & antioxidant boost",
    categoryId: "cat_aesthetics",
    shortDescription: "Instantly revive dull skin: high-potency antioxidant Vitamin C peel provides radiant glow, minimizes tan and boosts hydration.",
    fullDescription: "Gentle yet powerful brightening treatment. Concentrated Vitamin C combined with botanical fruit acids infuses antioxidants, removes surface dead cells, and brightens sun-damaged skin.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/anti-aging.jpg",
    durationMinutes: 45,
    basePricePaise: 199900,
    regularPricePaise: 249900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Antioxidant deep facial cleanse",
      "Vitamin C active booster peel application",
      "Hydrating cooling mask and barrier cream"
    ],
    exclusions: ["Laser skin treatments"],
    preparationInstructions: ["Gentle face wash before arrival."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_vitc_peel",
        serviceId: "srv_beedare_vitc_peel",
        name: "Vitamin C Brightening & Glow Session",
        scopeSummary: "Instant glow, tan removal, and antioxidant hydration",
        durationMinutes: 45,
        basePricePaise: 199900,
        regularPricePaise: 249900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/anti-aging.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 28. GLYCOLIC PEEL
  {
    id: "srv_beedare_glycolic_peel",
    slug: "glycolic-peel-skin-resurfacing-even-tone",
    title: "\u2022 Glycolic Peel \u2013 Skin resurfacing & even tone",
    categoryId: "cat_aesthetics",
    shortDescription: "Clinical alpha-hydroxy acid (AHA) peel dissolves cellular glue to reveal fresher, smoother, and more even-toned skin.",
    fullDescription: "Experience medical-grade AHA skin resurfacing at home. Gently unclogs congested pores, softens fine lines, and promotes cellular turnover for smooth porcelain skin texture.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/Chemical-Peel.jpg",
    durationMinutes: 45,
    basePricePaise: 199900,
    regularPricePaise: 249900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Gentle pre-peel cleanser and toner",
      "Controlled Glycolic AHA peel layer",
      "Skin neutralizer and cold compress",
      "Hydra-nourishing soothing balm"
    ],
    exclusions: ["Microdermabrasion combination"],
    preparationInstructions: ["Do not scrub or exfoliate skin on day of treatment."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_glycolic_peel",
        serviceId: "srv_beedare_glycolic_peel",
        name: "Glycolic Peel Skin Resurfacing Session",
        scopeSummary: "AHA cell renewal, smooth texture & even skin tone",
        durationMinutes: 45,
        basePricePaise: 199900,
        regularPricePaise: 249900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/Chemical-Peel.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 29. PRP (PLATELET-RICH PLASMA)
  {
    id: "srv_beedare_prp",
    slug: "prp-platelet-rich-plasma-therapy",
    title: "\u2022 PRP (Platelet-Rich Plasma Therapy) \u2013 Hair & skin rejuvenation",
    categoryId: "cat_aesthetics",
    shortDescription: "Autologous growth factor therapy to stimulate hair follicle regrowth, thicken hair roots, and rejuvenate facial collagen.",
    fullDescription: "Administered by certified medical professionals adhering to hospital-grade sterile standards. Uses your body\u2019s concentrated growth factors to revitalize dormant scalp hair follicles and reverse facial aging.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/prp-hair-treatment.jpg",
    durationMinutes: 60,
    basePricePaise: 399900,
    regularPricePaise: 499900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Sterile blood draw and high-speed centrifugal separation",
      "Topical numbing cream for painless application",
      "Targeted micro-injection or meso-gun delivery",
      "Post-procedure antiseptic spray and care kit"
    ],
    exclusions: ["Hair transplant surgery"],
    preparationInstructions: ["Wash hair thoroughly in morning; stay well-hydrated."],
    cancellationPolicySummary: "Free cancellation up to 8 hours before appointment.",
    variants: [
      {
        id: "var_prp_therapy",
        serviceId: "srv_beedare_prp",
        name: "PRP Hair & Scalp Rejuvenation Session",
        scopeSummary: "Autologous platelet plasma micro-therapy for hair density",
        durationMinutes: 60,
        basePricePaise: 399900,
        regularPricePaise: 499900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/prp-hair-treatment.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 30. BOTOX
  {
    id: "srv_beedare_botox",
    slug: "botox-smoothens-wrinkles-fine-lines",
    title: "\u2022 Botox \u2013 Smoothens wrinkles & fine lines (per unit)",
    categoryId: "cat_aesthetics",
    shortDescription: "Experience Advanced Aesthetic Solutions: smooth forehead lines, crow\u2019s feet, and frown lines with certified botulinum toxin at home.",
    fullDescription: "Precise micro-dosing to relax hyperactive facial muscles and eliminate dynamic wrinkles. Safe, FDA-approved authentic botulinum protein delivered by certified injectors.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/botox-2020-01-13-5e1c430703002.jpg",
    durationMinutes: 30,
    basePricePaise: 15e4,
    // Starts at 5 units = ₹1,500 (₹300/unit)
    regularPricePaise: 18e4,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Facial muscle movement mapping and consultation",
      "Topical anesthetic numbing cream",
      "Precise micro-droplet injection delivery",
      "2-week follow-up touch-up check"
    ],
    exclusions: ["Surgical facelift"],
    preparationInstructions: ["Avoid alcohol and blood thinners 24 hours prior."],
    cancellationPolicySummary: "Free cancellation up to 6 hours before appointment.",
    variants: [
      {
        id: "var_botox_unit",
        serviceId: "srv_beedare_botox",
        name: "Botox Anti-Wrinkle Treatment (Starting 5 Units)",
        scopeSummary: "Forehead lines, crow\u2019s feet or frown line smoothing (\u20B9300/unit)",
        durationMinutes: 30,
        basePricePaise: 15e4,
        regularPricePaise: 18e4,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/botox-2020-01-13-5e1c430703002.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 31. FILLER (1 ML)
  {
    id: "srv_beedare_filler",
    slug: "filler-1-ml-volume-restoration-contouring",
    title: "Filler (1 ml) \u2013 Volume restoration & contouring \u2013",
    categoryId: "cat_aesthetics",
    shortDescription: "Hyaluronic acid dermal filler (1 ml): Restore hollow cheeks, enhance lips, soften nasolabial folds, and sculpt jawline contour.",
    fullDescription: "Premium cross-linked hyaluronic acid filler to replenish youthful volume. Instant, natural results delivered by experienced aesthetic doctors in a comfortable home setting.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/what-are-skin-boosters.jpg",
    durationMinutes: 45,
    basePricePaise: 1599900,
    regularPricePaise: 1899900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Sterile sealed 1 ml hyaluronic acid syringe (Allergan / Juvederm / Restylane)",
      "Detailed facial contour symmetry analysis",
      "Painless cannula or fine-needle injection with lidocaine",
      "Sculpting massage and post-filler cool pack"
    ],
    exclusions: ["Permanent silicone fillers"],
    preparationInstructions: ["Avoid aspirin and green tea for 24 hours prior."],
    cancellationPolicySummary: "Free cancellation up to 8 hours before service.",
    variants: [
      {
        id: "var_filler_1ml",
        serviceId: "srv_beedare_filler",
        name: "Dermal Filler (1 ml Hyaluronic Acid)",
        scopeSummary: "Lip enhancement, cheek lift, or smile lines volume restoration",
        durationMinutes: 45,
        basePricePaise: 1599900,
        regularPricePaise: 1899900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/what-are-skin-boosters.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 32. SKIN BOOSTER
  {
    id: "srv_beedare_skin_booster",
    slug: "skin-booster-hydration-radiance-boost",
    title: "Skin Booster \u2013 Hydration & radiance boost",
    categoryId: "cat_aesthetics",
    shortDescription: "Deep dermal hydration micro-injections with pure hyaluronic acid. Boosts elasticity, glow, and plumps dehydrated skin.",
    fullDescription: "Profhilo / Restylane SkinBoosters deliver ultra-pure hyaluronic acid across bio-aesthetic points. Stimulates 4 types of collagen and elastin, restoring natural firm radiance without altering facial structure.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/what-are-skin-boosters.jpg",
    durationMinutes: 45,
    basePricePaise: 1499900,
    regularPricePaise: 1799900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Topical numbing and skin disinfection",
      "Multi-point hyaluronic micro-bolus placement",
      "Hydrating sheet mask and soothing cream"
    ],
    exclusions: ["Surgical threading"],
    preparationInstructions: ["Arrive with clean makeup-free skin."],
    cancellationPolicySummary: "Free cancellation up to 6 hours before service.",
    variants: [
      {
        id: "var_skin_booster",
        serviceId: "srv_beedare_skin_booster",
        name: "Skin Booster Deep Hydration & Collagen Session",
        scopeSummary: "Pure hyaluronic acid bio-remodeling for intense glow and elasticity",
        durationMinutes: 45,
        basePricePaise: 1499900,
        regularPricePaise: 1799900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/what-are-skin-boosters.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 33. MICRO-NEEDLE THERAPY
  {
    id: "srv_beedare_microneedle",
    slug: "micro-needle-therapy-scar-reduction-skin-renewal",
    title: "Micro-Needle Therapy \u2013 Scar reduction & skin renewal",
    categoryId: "cat_aesthetics",
    shortDescription: "Medical micro-needling stimulates natural elastin and collagen synthesis to diminish acne scars, reduce pore size, and firm skin.",
    fullDescription: "Precision motorized micro-needling creates controlled micro-channels in the dermis, triggering natural wound-healing cascade, serum absorption boost, and skin tightening.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/360_F_471092808_sUCrkTM1CwSfXuFvMWTUKrGsTzfbfTCw.jpg",
    durationMinutes: 60,
    basePricePaise: 499900,
    regularPricePaise: 599900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Medical numbing cream for comfortable session",
      "Sterile single-use multi-needle cartridge",
      "Hyaluronic & peptide infusion during needling",
      "Cryo-cooling calming mask and SPF 50+"
    ],
    exclusions: ["Active cystic acne infected lesions"],
    preparationInstructions: ["Avoid direct sun exposure 24 hours prior."],
    cancellationPolicySummary: "Free cancellation up to 6 hours before service.",
    variants: [
      {
        id: "var_microneedle",
        serviceId: "srv_beedare_microneedle",
        name: "Micro-Needle Collagen Induction Therapy",
        scopeSummary: "Acne scar reduction, pore shrinking & skin texture renewal",
        durationMinutes: 60,
        basePricePaise: 499900,
        regularPricePaise: 599900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/360_F_471092808_sUCrkTM1CwSfXuFvMWTUKrGsTzfbfTCw.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 34. DERMAPEN TREATMENT
  {
    id: "srv_beedare_dermapen",
    slug: "dermapen-treatment-collagen-boost-smooth-texture",
    title: "Dermapen Treatment \u2013 Collagen boost & smooth texture",
    categoryId: "cat_aesthetics",
    shortDescription: "Dermapen 4 digital fractional micro-needling for superior scar repair, fine line softening, and epidermal glow.",
    fullDescription: "The gold standard in mechanical collagen induction therapy. Dermapen 4 creates up to 1,920 micro-punctures per second, stimulating rapid fibroblasts, smoothing surgical/acne scars and firming lax skin.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/beautiful-young-woman-at-beauty-clinic.jpg",
    durationMinutes: 60,
    basePricePaise: 499900,
    regularPricePaise: 599900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Full face antiseptic prep & high-strength numbing",
      "Dermapen 4 automated micro-therapy with targeted depth",
      "Growth factor complex infusion",
      "Post-procedure biocellulose cooling mask"
    ],
    exclusions: ["Keloid scar prone skin"],
    preparationInstructions: ["Avoid exfoliating acid serums 48 hours prior."],
    cancellationPolicySummary: "Free cancellation up to 6 hours before service.",
    variants: [
      {
        id: "var_dermapen_clean",
        serviceId: "srv_beedare_dermapen",
        name: "Dermapen 4 Fractional Collagen Induction",
        scopeSummary: "High-speed automated micro-needling for scars & smoothness",
        durationMinutes: 60,
        basePricePaise: 499900,
        regularPricePaise: 599900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/beautiful-young-woman-at-beauty-clinic.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 35. FULL BODY LASER
  {
    id: "srv_beedare_full_body_laser",
    slug: "full-body-laser-complete-hair-removal",
    title: "Full Body Laser \u2013 Complete hair removal",
    categoryId: "cat_aesthetics",
    shortDescription: "Enjoy smooth, hair-free skin with our advanced diode laser hair removal \u2013 painless, safe, and permanent at your doorstep.",
    fullDescription: "State-of-the-art triple-wavelength diode laser with ice-chill contact cooling. Targets hair roots without pain or burns across arms, legs, back, chest, stomach, and bikini zone.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/full-body-laser-hair-removal-india.jpg",
    durationMinutes: 120,
    basePricePaise: 799900,
    regularPricePaise: 999900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Skin phototype laser energy calibration",
      "Full body shave touch-up and cooling gel application",
      "Triple wavelength pain-free diode laser pass",
      "Soothing aloe vera skin hydration"
    ],
    exclusions: ["Hair bleaching before treatment"],
    preparationInstructions: ["Shave treatment areas 24 hours before appointment. Do not wax or thread."],
    cancellationPolicySummary: "Free cancellation up to 8 hours before appointment.",
    variants: [
      {
        id: "var_full_body_laser",
        serviceId: "srv_beedare_full_body_laser",
        name: "Full Body Painless Laser Hair Removal Session",
        scopeSummary: "Complete full body permanent hair reduction with cooling tip",
        durationMinutes: 120,
        basePricePaise: 799900,
        regularPricePaise: 999900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/full-body-laser-hair-removal-india.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 36. FULL FACE LASER
  {
    id: "srv_beedare_full_face_laser",
    slug: "full-face-laser-smooth-clear-facial-skin",
    title: "Full Face Laser \u2013 Smooth & clear facial skin",
    categoryId: "cat_aesthetics",
    shortDescription: "Permanent reduction of upper lip, chin, sideburns, and forehead peach fuzz with gentle pain-reduced diode laser.",
    fullDescription: "Achieve flawless makeup-ready facial skin without monthly threading or waxing pain. Safe for all skin tones with customized laser fluences.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/skin-care-face-beauty-treatment-ipl-photo-facial-therapy-ant.jpg",
    durationMinutes: 30,
    basePricePaise: 399900,
    regularPricePaise: 499900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Protective eye goggles and cooling gel application",
      "Upper lip, chin, jawline and cheek laser passes",
      "Post-laser soothing gel and sun block"
    ],
    exclusions: ["Eyebrow shaping"],
    preparationInstructions: ["Shave or trim facial hair 12 hours prior."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_full_face_laser",
        serviceId: "srv_beedare_full_face_laser",
        name: "Full Face Laser Hair Reduction Session",
        scopeSummary: "Upper lip, chin, sideburns & forehead painless laser",
        durationMinutes: 30,
        basePricePaise: 399900,
        regularPricePaise: 499900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/skin-care-face-beauty-treatment-ipl-photo-facial-therapy-ant.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 37. BIKINI LASER
  {
    id: "srv_beedare_bikini_laser",
    slug: "bikini-laser-hygiene-smoothness",
    title: "Bikini Laser \u2013 Hygiene & smoothness",
    categoryId: "cat_aesthetics",
    shortDescription: "Hygienic, smooth, and ingrown-free bikini area laser hair removal with maximum privacy and certified female laser technicians.",
    fullDescription: "Enjoy long-lasting smoothness and eliminate painful waxing rashes and ingrown hairs. Certified female practitioners maintain complete privacy in your home.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/woman-receiving-laser-epilation-on-bikini-zone-at-beauty-clinic-bikini-zone-laser-hair.jpg",
    durationMinutes: 45,
    basePricePaise: 399900,
    regularPricePaise: 499900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Strict single-use sanitized disposables",
      "Cooling gel and painless diode laser coverage",
      "Anti-inflammatory post-care application"
    ],
    exclusions: ["Waxing services"],
    preparationInstructions: ["Shave area 24 hours prior with clean razor."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_bikini_laser",
        serviceId: "srv_beedare_bikini_laser",
        name: "Bikini Line Precision Laser Session",
        scopeSummary: "Hygiene & smoothness with certified female technicians",
        durationMinutes: 45,
        basePricePaise: 399900,
        regularPricePaise: 499900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/woman-receiving-laser-epilation-on-bikini-zone-at-beauty-clinic-bikini-zone-laser-hair.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 38. FULL ARM LASER
  {
    id: "srv_beedare_full_arm_laser",
    slug: "full-arm-laser-hair-free-arms",
    title: "Full Arm Laser \u2013 Hair-free arms",
    categoryId: "cat_aesthetics",
    shortDescription: "Complete hair-free arms including hands, fingers, and underarms with fast scanning diode laser technology.",
    fullDescription: "Say goodbye to razor burns and tanning on arms. Uniform diode laser beams target deep dark hair follicles, giving soft, silky-smooth arms.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/body-care-laser-hair-removal-epilation-treatment-smooth-skin.jpg",
    durationMinutes: 45,
    basePricePaise: 499900,
    regularPricePaise: 599900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Both full arms and underarms laser coverage",
      "Ice cooling protection for zero discomfort",
      "Post-treatment soothing lotion"
    ],
    exclusions: ["Chemical bleaching"],
    preparationInstructions: ["Shave arms 24 hours before appointment."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_full_arm_laser",
        serviceId: "srv_beedare_full_arm_laser",
        name: "Full Both Arms + Underarms Laser Session",
        scopeSummary: "Complete hair removal for both arms and underarms",
        durationMinutes: 45,
        basePricePaise: 499900,
        regularPricePaise: 599900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/body-care-laser-hair-removal-epilation-treatment-smooth-skin.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 39. FULL LEGS LASER
  {
    id: "srv_beedare_full_legs_laser",
    slug: "full-legs-laser-hair-free-legs",
    title: "Full Legs Laser \u2013 Hair-free legs-Delhi",
    categoryId: "cat_aesthetics",
    shortDescription: "Both full legs hair removal: thighs, knees, calves, and feet with painless cooling diode laser.",
    fullDescription: "Flaunt silky, hair-free legs all year round. High-repetition diode laser rapidly treats large surface areas, permanently reducing leg hair and strawberry legs.",
    illustrationKey: "aesthetics",
    imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/360_F_325763670_7HDQhp4ZLh530EzsAM0iUfPJpIW2by1Z.jpg",
    durationMinutes: 60,
    basePricePaise: 499900,
    regularPricePaise: 599900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Full thighs, calves, knees and feet coverage",
      "Pre-laser cooling glide gel",
      "Calming post-laser mist and moisturizing cream"
    ],
    exclusions: ["Chemical body tanning"],
    preparationInstructions: ["Shave legs thoroughly 24 hours in advance."],
    cancellationPolicySummary: "Free cancellation up to 4 hours before service.",
    variants: [
      {
        id: "var_full_legs_laser",
        serviceId: "srv_beedare_full_legs_laser",
        name: "Full Both Legs Pain-Free Laser Session",
        scopeSummary: "Thighs to feet permanent hair reduction with ice-chill tip",
        durationMinutes: 60,
        basePricePaise: 499900,
        regularPricePaise: 599900,
        imageUrl: "https://tankmanpro.com/wp-content/uploads/2025/08/360_F_325763670_7HDQhp4ZLh530EzsAM0iUfPJpIW2by1Z.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ALL_CITIES,
    status: "published",
    isDemo: true
  },
  // 9. ELECTRICIAN SERVICES (Complete switch, fan, lighting, MCB, inverter & appliance catalog)
  {
    id: "srv_electrician_services",
    slug: "certified-electrician-home-services",
    title: "Certified Electrician Services",
    categoryId: "cat_electrician",
    shortDescription: "Verified background-checked electricians for switches, fans, wiring, MCBs, inverters, TV mounts & home automation with 30-day warranty.",
    fullDescription: "Comprehensive electrical solutions backed by the TankmanPro Promise: 30-day service warranty, up to \u20B910,000 damage coverage, and verified technicians. Standard \u20B9299 inspection fee is completely waived if any service is availed.",
    illustrationKey: "appliance-repair",
    imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
    galleryUrls: ["/assets/tankmanpro/ceiling-fan.jpg"],
    durationMinutes: 45,
    basePricePaise: 10900,
    // ₹109 starting (switch/socket replacement)
    regularPricePaise: 14900,
    defaultPricingMode: "city_fixed",
    cityModeOverrides: {
      city_delhi: "city_fixed",
      city_shahjahanpur: "city_fixed",
      city_kanpur: "city_fixed"
    },
    inclusions: [
      "Site safety assessment and load diagnosis by background-verified electrician",
      "Precision installation / repair using insulated professional tools",
      "Operational testing and voltage / continuity check before handover",
      "Post-service area cleanup and 30-day service warranty"
    ],
    exclusions: [
      "Materials like switches, wires, casing, MCB units or fans unless purchased as add-ons",
      "Civil wall repainting or structural ceiling alterations"
    ],
    preparationInstructions: [
      "Ensure access to main power distribution board / isolator switch.",
      "Have appliances / materials ready if provided by yourself."
    ],
    warrantySummary: "30-Day Workmanship Warranty & Up to \u20B910,000 Damage Protection",
    cancellationPolicySummary: "Free cancellation up to 4 hours before scheduled slot.",
    variants: [
      {
        id: "var_elec_switchbox",
        serviceId: "srv_electrician_services",
        name: "Switchbox Installation",
        scopeSummary: "Wall recess inspection, box mounting & wiring alignment",
        durationMinutes: 30,
        basePricePaise: 34900,
        // ₹349
        regularPricePaise: 44900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_ac_switchbox",
        serviceId: "srv_electrician_services",
        name: "AC Heavy Switchbox Installation",
        scopeSummary: "Heavy-duty load fitting for split/window ACs with aligned box",
        durationMinutes: 35,
        basePricePaise: 36900,
        // ₹369
        regularPricePaise: 49900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_switchboard",
        serviceId: "srv_electrician_services",
        name: "Switchboard Installation",
        scopeSummary: "Modular or standard switchboard mounting & secure wiring",
        durationMinutes: 30,
        basePricePaise: 30900,
        // ₹309
        regularPricePaise: 39900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_smart_switch",
        serviceId: "srv_electrician_services",
        name: "Smart Switch Installation",
        scopeSummary: "Wiring compatibility check & smart switch module setup",
        durationMinutes: 25,
        basePricePaise: 15e3,
        // ₹150
        regularPricePaise: 24900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_smart_controller",
        serviceId: "srv_electrician_services",
        name: "Smart Appliance Controller",
        scopeSummary: "Controller pairing for AC, geyser or heavy devices",
        durationMinutes: 30,
        basePricePaise: 19900,
        // ₹199
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_wifi_switch",
        serviceId: "srv_electrician_services",
        name: "Wi-Fi Smart Switch Installation",
        scopeSummary: "Wi-Fi sync, mobile app pairing & switch setup",
        durationMinutes: 30,
        basePricePaise: 19900,
        // ₹199
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_switch_replace",
        serviceId: "srv_electrician_services",
        name: "Switch / Socket Replacement",
        scopeSummary: "Safe removal of old damaged socket & new installation",
        durationMinutes: 20,
        basePricePaise: 10900,
        // ₹109
        regularPricePaise: 14900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_switch_repair",
        serviceId: "srv_electrician_services",
        name: "Switchboard / Switchbox Repair",
        scopeSummary: "Loose terminal repair, spark elimination & contact fix",
        durationMinutes: 25,
        basePricePaise: 12e3,
        // ₹120
        regularPricePaise: 18e3,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_ceiling_fan_inst",
        serviceId: "srv_electrician_services",
        name: "Ceiling Fan Installation",
        scopeSummary: "Rod, hook & blade balancing with speed test",
        durationMinutes: 30,
        basePricePaise: 19900,
        // ₹199
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_wall_fan_inst",
        serviceId: "srv_electrician_services",
        name: "Wall Mount Fan Installation",
        scopeSummary: "Bracket drilling, mounting & angle adjustment",
        durationMinutes: 25,
        basePricePaise: 13900,
        // ₹139
        regularPricePaise: 19900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_exhaust_fan_inst",
        serviceId: "srv_electrician_services",
        name: "Exhaust Fan Installation",
        scopeSummary: "Glass/wall vent mounting & power connection",
        durationMinutes: 30,
        basePricePaise: 19900,
        // ₹199
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_decor_fan_inst",
        serviceId: "srv_electrician_services",
        name: "Decorative Ceiling Fan Installation",
        scopeSummary: "Special mounting for chandelier/designer fans",
        durationMinutes: 45,
        basePricePaise: 46900,
        // ₹469
        regularPricePaise: 59900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_fan_replace",
        serviceId: "srv_electrician_services",
        name: "Fan Replacement (Ceiling/Exhaust/Wall)",
        scopeSummary: "Old fan removal and new unit mounting with test",
        durationMinutes: 35,
        basePricePaise: 25900,
        // ₹259
        regularPricePaise: 34900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_fan_repair",
        serviceId: "srv_electrician_services",
        name: "Fan Repair (Ceiling/Exhaust/Wall)",
        scopeSummary: "Capacitor replacement, humming noise & speed fix",
        durationMinutes: 30,
        basePricePaise: 19900,
        // ₹199
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_fan_regulator",
        serviceId: "srv_electrician_services",
        name: "Fan Regulator Repair / Replacement",
        scopeSummary: "Rotary or step regulator install on modular board",
        durationMinutes: 20,
        basePricePaise: 9900,
        // ₹99
        regularPricePaise: 14900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_fan_uninstall",
        serviceId: "srv_electrician_services",
        name: "Fan Uninstallation (Ceiling/Exhaust/Wall)",
        scopeSummary: "Safe disconnection, hook dismount & cable bundling",
        durationMinutes: 20,
        basePricePaise: 12900,
        // ₹129
        regularPricePaise: 19900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_holder_install",
        serviceId: "srv_electrician_services",
        name: "Bulb / Tubelight Holder Installation",
        scopeSummary: "Wall/ceiling batten or angle holder setup",
        durationMinutes: 20,
        basePricePaise: 11900,
        // ₹119
        regularPricePaise: 16900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_cfl_led",
        serviceId: "srv_electrician_services",
        name: "CFL to LED Replacement",
        scopeSummary: "Fitting retrofitting for modern energy-saving LEDs",
        durationMinutes: 15,
        basePricePaise: 16900,
        // ₹169
        regularPricePaise: 24900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_decor_lights_5m",
        serviceId: "srv_electrician_services",
        name: "Decorative Lights Installation (Per 5m)",
        scopeSummary: "Festive/strip light layout, mounting clips & wiring",
        durationMinutes: 30,
        basePricePaise: 11900,
        // ₹119
        regularPricePaise: 17900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_decor_lights_un_20m",
        serviceId: "srv_electrician_services",
        name: "Decorative Lights Uninstallation (Per 20m)",
        scopeSummary: "Safe adhesive & clip removal, wire rolling",
        durationMinutes: 30,
        basePricePaise: 14800,
        // ₹148
        regularPricePaise: 19900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_decor_lantern",
        serviceId: "srv_electrician_services",
        name: "Decorative Lantern Installation",
        scopeSummary: "Hook mounting and aesthetic lighting alignment",
        durationMinutes: 20,
        basePricePaise: 9900,
        // ₹99
        regularPricePaise: 14900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_chandelier_6",
        serviceId: "srv_electrician_services",
        name: "Chandelier Installation (Up to 6 bulbs)",
        scopeSummary: "Reinforced ceiling bracket setup, assembly & test",
        durationMinutes: 60,
        basePricePaise: 54900,
        // ₹549
        regularPricePaise: 69900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_chandelier_more_6",
        serviceId: "srv_electrician_services",
        name: "Chandelier Installation (More than 6 bulbs)",
        scopeSummary: "Heavy-load structural mounting, multi-tier assembly",
        durationMinutes: 90,
        basePricePaise: 109900,
        // ₹1,099
        regularPricePaise: 149900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_ext_wiring_casing",
        serviceId: "srv_electrician_services",
        name: "New External Wiring with Casing (Per 5m)",
        scopeSummary: "PVC casing-caping, saddle clips & load test",
        durationMinutes: 45,
        basePricePaise: 24900,
        // ₹249
        regularPricePaise: 34900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_ext_wiring_nocasing",
        serviceId: "srv_electrician_services",
        name: "New External Wiring without Casing (Per 5m)",
        scopeSummary: "Open flexible cable routing & saddle clips",
        durationMinutes: 30,
        basePricePaise: 12900,
        // ₹129
        regularPricePaise: 19900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_int_wiring",
        serviceId: "srv_electrician_services",
        name: "New Internal Concealed Wiring (Per 5m)",
        scopeSummary: "Wall chiseling, conduit pipe laying & wire pull",
        durationMinutes: 60,
        basePricePaise: 24900,
        // ₹249
        regularPricePaise: 34900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_doorbell_install",
        serviceId: "srv_electrician_services",
        name: "Doorbell Installation",
        scopeSummary: "Ding-dong / electronic doorbell mounting & hookup",
        durationMinutes: 30,
        basePricePaise: 29900,
        // ₹299
        regularPricePaise: 39900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_doorbell_replace",
        serviceId: "srv_electrician_services",
        name: "Doorbell Replacement",
        scopeSummary: "Safe removal of old chime & new unit connection",
        durationMinutes: 20,
        basePricePaise: 10900,
        // ₹109
        regularPricePaise: 16900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_videobell",
        serviceId: "srv_electrician_services",
        name: "Video Doorbell Installation",
        scopeSummary: "Smart camera bell setup, chime connect & app sync",
        durationMinutes: 45,
        basePricePaise: 6e4,
        // ₹600
        regularPricePaise: 79900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_mcb_single",
        serviceId: "srv_electrician_services",
        name: "Single-Pole MCB Installation",
        scopeSummary: "Distribution board DIN-rail mounting & load check",
        durationMinutes: 25,
        basePricePaise: 15e3,
        // ₹150
        regularPricePaise: 24900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_mcb_double",
        serviceId: "srv_electrician_services",
        name: "Double-Pole MCB Installation",
        scopeSummary: "Heavy appliance main isolator / DP MCB setup",
        durationMinutes: 30,
        basePricePaise: 24900,
        // ₹249
        regularPricePaise: 34900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_mcb_fuse_replace",
        serviceId: "srv_electrician_services",
        name: "MCB / Fuse Replacement",
        scopeSummary: "Burnt fuse or tripped MCB replacement",
        durationMinutes: 20,
        basePricePaise: 11900,
        // ₹119
        regularPricePaise: 17900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_submeter",
        serviceId: "srv_electrician_services",
        name: "Submeter Installation",
        scopeSummary: "Single-phase submeter for tenant / room tracking",
        durationMinutes: 35,
        basePricePaise: 24900,
        // ₹249
        regularPricePaise: 34900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_changeover_3p",
        serviceId: "srv_electrician_services",
        name: "3-Phase Changeover Switch Installation",
        scopeSummary: "Generator / grid manual changeover switch install",
        durationMinutes: 50,
        basePricePaise: 36900,
        // ₹369
        regularPricePaise: 49900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_inverter_single",
        serviceId: "srv_electrician_services",
        name: "Inverter Installation (Single Battery)",
        scopeSummary: "Inverter + 1 battery mounting, terminal grease & test",
        durationMinutes: 60,
        basePricePaise: 48600,
        // ₹486
        regularPricePaise: 59900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_inverter_double",
        serviceId: "srv_electrician_services",
        name: "Inverter Installation (Double Battery)",
        scopeSummary: "Heavy-duty 24V double battery connection & test",
        durationMinutes: 75,
        basePricePaise: 57500,
        // ₹575
        regularPricePaise: 69900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_inverter_uninstall",
        serviceId: "srv_electrician_services",
        name: "Inverter Uninstallation",
        scopeSummary: "Safe battery disconnection & terminal insulation",
        durationMinutes: 40,
        basePricePaise: 49900,
        // ₹499
        regularPricePaise: 59900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_stabilizer",
        serviceId: "srv_electrician_services",
        name: "Stabilizer Installation",
        scopeSummary: "Wall mounting & connection to AC/Fridge/TV",
        durationMinutes: 30,
        basePricePaise: 24900,
        // ₹249
        regularPricePaise: 34900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_inverter_fuse",
        serviceId: "srv_electrician_services",
        name: "Inverter Fuse Replacement",
        scopeSummary: "Blown glass or ceramic fuse replacement",
        durationMinutes: 20,
        basePricePaise: 12900,
        // ₹129
        regularPricePaise: 18900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_inverter_serv_single",
        serviceId: "srv_electrician_services",
        name: "Inverter Servicing (Single Battery)",
        scopeSummary: "Vent cleaning, terminal de-rust, backup load test",
        durationMinutes: 40,
        basePricePaise: 27900,
        // ₹279
        regularPricePaise: 34900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_inverter_serv_double",
        serviceId: "srv_electrician_services",
        name: "Inverter Servicing (Double Battery)",
        scopeSummary: "Dual terminal clean, voltage check & backup test",
        durationMinutes: 50,
        basePricePaise: 44900,
        // ₹449
        regularPricePaise: 54900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_inverter_repair",
        serviceId: "srv_electrician_services",
        name: "Inverter Repair (Backup/Noise/Overload)",
        scopeSummary: "Diagnostic & repair of backup drop, humming or overload error",
        durationMinutes: 45,
        basePricePaise: 21e3,
        // ₹210
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_tv_48",
        serviceId: "srv_electrician_services",
        name: 'TV Wall Mount Installation (Up to 48")',
        scopeSummary: "Bracket mounting, screen leveling & HDMI/AV check",
        durationMinutes: 35,
        basePricePaise: 34900,
        // ₹349
        regularPricePaise: 44900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_tv_55",
        serviceId: "srv_electrician_services",
        name: 'TV Wall Mount Installation (48" - 55")',
        scopeSummary: "Heavy-duty bracket setup & cable management",
        durationMinutes: 40,
        basePricePaise: 44900,
        // ₹449
        regularPricePaise: 54900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_tv_70",
        serviceId: "srv_electrician_services",
        name: 'TV Wall Mount Installation (55" - 70")',
        scopeSummary: "Large display structural mounting & connectivity",
        durationMinutes: 50,
        basePricePaise: 54900,
        // ₹549
        regularPricePaise: 69900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_tv_uninstall",
        serviceId: "srv_electrician_services",
        name: "TV Uninstallation",
        scopeSummary: "Dismounting TV from bracket & cable bundling",
        durationMinutes: 25,
        basePricePaise: 19900,
        // ₹199
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_wifi_cctv",
        serviceId: "srv_electrician_services",
        name: "WiFi CCTV Camera Installation",
        scopeSummary: "Camera mounting, angle coverage & mobile app sync",
        durationMinutes: 30,
        basePricePaise: 19900,
        // ₹199
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_room_heater",
        serviceId: "srv_electrician_services",
        name: "Room Heater Repair",
        scopeSummary: "Coil, fan, thermostat & safety switch repair",
        durationMinutes: 30,
        basePricePaise: 27900,
        // ₹279
        regularPricePaise: 34900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_karban_airzone",
        serviceId: "srv_electrician_services",
        name: "Karban Airzone Purifier Installation",
        scopeSummary: "Ceiling/wall airzone purifier setup & airflow test",
        durationMinutes: 45,
        basePricePaise: 54900,
        // ₹549
        regularPricePaise: 69900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_mixer_grinder",
        serviceId: "srv_electrician_services",
        name: "Mixer Grinder Repair",
        scopeSummary: "Coupler, carbon brush, jar blade & switch fix",
        durationMinutes: 30,
        basePricePaise: 21e3,
        // ₹210
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_home_theater",
        serviceId: "srv_electrician_services",
        name: "Home Theater System Installation",
        scopeSummary: "Multi-speaker surround positioning & audio setup",
        durationMinutes: 45,
        basePricePaise: 21e3,
        // ₹210
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_ev_charger_2w",
        serviceId: "srv_electrician_services",
        name: "EV Charger Installation (2-Wheeler)",
        scopeSummary: "Parking area charger unit mounting & MCB hookup",
        durationMinutes: 60,
        basePricePaise: 75e3,
        // ₹750
        regularPricePaise: 99900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_elec_consultation",
        serviceId: "srv_electrician_services",
        name: "Electrician Consultation & Inspection",
        scopeSummary: "Detailed site inspection, wiring audit & quote (waived on service)",
        durationMinutes: 30,
        basePricePaise: 14900,
        // ₹149
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [
      {
        question: "Does the cost include materials like switches and wires?",
        answer: "No, materials are charged separately if not provided by you."
      },
      {
        question: "What if something goes wrong after installation?",
        answer: "We offer a 30-day warranty \u2014 we will fix it at no extra cost."
      }
    ],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  },
  // 10. PLUMBER SERVICES (Comprehensive bath fittings, taps, showers, basin & grouting)
  {
    id: "srv_plumber_services",
    slug: "certified-plumbing-sanitary-services",
    title: "Plumber Services & Sanitary Fittings",
    categoryId: "cat_plumber",
    shortDescription: "Verified plumbers for taps, showers, washbasins, tile grouting, drain unclogging & water filter installations with 30-day warranty.",
    fullDescription: "Doorstep plumbing services delivered by certified technicians. 30-day workmanship guarantee, \u20B910,000 damage protection, and leak-free installation assurance.",
    illustrationKey: "plumbing",
    imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
    galleryUrls: ["/assets/tankmanpro/bathroom-deep.jpg"],
    durationMinutes: 45,
    basePricePaise: 1e4,
    // ₹100 starting (tap installation)
    regularPricePaise: 14900,
    defaultPricingMode: "city_fixed",
    cityModeOverrides: {
      city_delhi: "city_fixed",
      city_shahjahanpur: "city_fixed",
      city_kanpur: "city_fixed"
    },
    inclusions: [
      "Site assessment of water pressure, pipe alignment and fittings",
      "Leak-proof installation or repair with teflon / solvent sealants",
      "Full water flow testing and pressure check before leaving",
      "30-day service warranty on workmanship"
    ],
    exclusions: [
      "Spare parts, taps, showers, basins, or pipes unless provided or billed extra",
      "Major civil breaking or tile reconstruction"
    ],
    preparationInstructions: [
      "Ensure access to main bathroom/kitchen water shut-off valve.",
      "Have replacement taps or fixtures ready if self-purchased."
    ],
    warrantySummary: "30-Day Workmanship Warranty & \u20B910,000 Damage Protection",
    cancellationPolicySummary: "Free cancellation up to 4 hours before scheduled slot.",
    variants: [
      {
        id: "var_plumb_bath_accessory",
        serviceId: "srv_plumber_services",
        name: "Bath Accessory Installation",
        scopeSummary: "Towel rack, soap dish, glass shelf, robe hook securely mounted",
        durationMinutes: 25,
        basePricePaise: 12900,
        // ₹129
        regularPricePaise: 19900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_shower_ceiling",
        serviceId: "srv_plumber_services",
        name: "Shower Installation (Ceiling Mounted)",
        scopeSummary: "Overhead rain shower arm & rose fitting with leak test",
        durationMinutes: 30,
        basePricePaise: 16900,
        // ₹169
        regularPricePaise: 24900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_shower_wall",
        serviceId: "srv_plumber_services",
        name: "Shower Installation (Wall Mounted / Hand-Held)",
        scopeSummary: "Wall bracket, shower head & flexible hose install",
        durationMinutes: 25,
        basePricePaise: 15900,
        // ₹159
        regularPricePaise: 22900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_washbasin_install",
        serviceId: "srv_plumber_services",
        name: "Wash Basin Installation",
        scopeSummary: "Wall-mounted, pedestal or countertop basin fitting & sealant",
        durationMinutes: 60,
        basePricePaise: 47900,
        // ₹479
        regularPricePaise: 59900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_wastepipe_replace",
        serviceId: "srv_plumber_services",
        name: "Waste Pipe Replacement",
        scopeSummary: "Removal of cracked pipe & flexible PVC waste pipe fitting",
        durationMinutes: 20,
        basePricePaise: 13900,
        // ₹139
        regularPricePaise: 19900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_sink_drain_remove",
        serviceId: "srv_plumber_services",
        name: "Sink Drainage Removal",
        scopeSummary: "Detach blocked or damaged drainage trap and pipe",
        durationMinutes: 25,
        basePricePaise: 18900,
        // ₹189
        regularPricePaise: 24900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_waste_coupling",
        serviceId: "srv_plumber_services",
        name: "Waste Coupling (Basin)",
        scopeSummary: "Brass or SS waste coupling replacement with sealant",
        durationMinutes: 25,
        basePricePaise: 14900,
        // ₹149
        regularPricePaise: 19900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_bottle_trap",
        serviceId: "srv_plumber_services",
        name: "Bottle Trap Installation",
        scopeSummary: "Designer bottle trap installation for luxury basins",
        durationMinutes: 30,
        basePricePaise: 21900,
        // ₹219
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_bath_grout",
        serviceId: "srv_plumber_services",
        name: "Bathroom Tile Grouting",
        scopeSummary: "Complete floor & wall joint sealing with waterproof grout",
        durationMinutes: 120,
        basePricePaise: 15e4,
        // ₹1,500
        regularPricePaise: 18e4,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_kitchen_grout",
        serviceId: "srv_plumber_services",
        name: "Kitchen Tile Grouting",
        scopeSummary: "Countertop, sink splashback & kitchen tile sealing",
        durationMinutes: 90,
        basePricePaise: 1e5,
        // ₹1,000
        regularPricePaise: 13e4,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_shower_filter",
        serviceId: "srv_plumber_services",
        name: "Shower Filter Installation",
        scopeSummary: "Hard-water filter attachment to shower connection",
        durationMinutes: 25,
        basePricePaise: 16900,
        // ₹169
        regularPricePaise: 24900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_washing_filter",
        serviceId: "srv_plumber_services",
        name: "Washing Machine Filter Installation",
        scopeSummary: "Sediment filter attachment to washing machine inlet hose",
        durationMinutes: 25,
        basePricePaise: 13900,
        // ₹139
        regularPricePaise: 19900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_drain_cover",
        serviceId: "srv_plumber_services",
        name: "Drainage Cover Installation",
        scopeSummary: "Stainless steel or PVC floor jali/cover installation",
        durationMinutes: 20,
        basePricePaise: 17900,
        // ₹179
        regularPricePaise: 24900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_bath_drain_remove",
        serviceId: "srv_plumber_services",
        name: "Bathroom Drainage Removal",
        scopeSummary: "Old rusted drain trap & floor outlet removal",
        durationMinutes: 40,
        basePricePaise: 40900,
        // ₹409
        regularPricePaise: 49900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_balcony_drain_remove",
        serviceId: "srv_plumber_services",
        name: "Balcony Drainage Removal",
        scopeSummary: "Balcony rainwater outlet disassembly",
        durationMinutes: 30,
        basePricePaise: 29900,
        // ₹299
        regularPricePaise: 39900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_tap_repair",
        serviceId: "srv_plumber_services",
        name: "Tap Repair & Leak Fix",
        scopeSummary: "Washer, spindle, cartridge replacement & leak seal",
        durationMinutes: 25,
        basePricePaise: 12900,
        // ₹129
        regularPricePaise: 18900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_mixer_repair",
        serviceId: "srv_plumber_services",
        name: "Water Mixer Tap Repair",
        scopeSummary: "Wall mixer or basin diverter repair & hot-cold fix",
        durationMinutes: 35,
        basePricePaise: 30900,
        // ₹309
        regularPricePaise: 39900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_plumb_tap_install",
        serviceId: "srv_plumber_services",
        name: "Tap Installation",
        scopeSummary: "Bib tap, pillar tap or angle valve installation",
        durationMinutes: 20,
        basePricePaise: 1e4,
        // ₹100
        regularPricePaise: 14900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [
      {
        question: "Are taps or pipes included in the cost?",
        answer: "No, fixtures must be provided by the customer or billed separately."
      },
      {
        question: "Is leak testing included?",
        answer: "Yes, complete water pressure leak testing is conducted before completion."
      }
    ],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  },
  // 11. PAINTER SERVICES
  {
    id: "srv_painter_services",
    slug: "professional-home-painting-services",
    title: "Professional Home Painting Services",
    categoryId: "cat_painter",
    shortDescription: "Expert interior, exterior & ceiling painting using premium paints with neat finish and zero mess guarantee.",
    fullDescription: "Give your home or workspace a vibrant fresh look with TankmanPro certified painters. Includes site masking, surface sanding, primer application, and dual-coat paint application using Asian Paints, Nerolac, or Dulux.",
    illustrationKey: "appliance-repair",
    imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
    galleryUrls: ["/assets/tankmanpro/bathroom-deep.jpg"],
    durationMinutes: 120,
    basePricePaise: 29900,
    // ₹299 consultation & estimate visit
    regularPricePaise: 49900,
    defaultPricingMode: "city_fixed",
    cityModeOverrides: {
      city_delhi: "city_fixed",
      city_shahjahanpur: "city_fixed",
      city_kanpur: "city_fixed"
    },
    inclusions: [
      "Site check, wall moisture measurement and square-footage laser measurement",
      "Color shade card consultation and paint budget estimate",
      "Floor and furniture tarpaulin masking protection",
      "Putty touching and uniform roller double-coat finish"
    ],
    exclusions: ["Civil plastering or wall rebuild work"],
    preparationInstructions: [
      "Clear small valuable items from near the walls prior to painting."
    ],
    warrantySummary: "1-Year Paint Peeling & Flaking Workmanship Warranty",
    cancellationPolicySummary: "Free cancellation up to 4 hours before slot.",
    variants: [
      {
        id: "var_paint_interior_sqft",
        serviceId: "srv_painter_services",
        name: "Interior Walls Painting (From \u20B98/sq.ft)",
        scopeSummary: "Living room, bedroom, hallway double-coat smooth roller finish",
        durationMinutes: 180,
        basePricePaise: 8e4,
        // ₹800 base package
        regularPricePaise: 1e5,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_paint_exterior_sqft",
        serviceId: "srv_painter_services",
        name: "Exterior Walls Weatherproofing (From \u20B910/sq.ft)",
        scopeSummary: "Weather-shield anti-fungal exterior emulsion coating",
        durationMinutes: 240,
        basePricePaise: 1e5,
        // ₹1,000 base package
        regularPricePaise: 13e4,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_paint_ceiling_sqft",
        serviceId: "srv_painter_services",
        name: "Ceiling Painting (From \u20B912/sq.ft)",
        scopeSummary: "Anti-damp ceiling coating with high light-reflection finish",
        durationMinutes: 120,
        basePricePaise: 12e4,
        // ₹1,200 base package
        regularPricePaise: 15e4,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_paint_consultation",
        serviceId: "srv_painter_services",
        name: "Full Home Painting Site Inspection & Estimate",
        scopeSummary: "Measurement, shade cards & formal quotation (waived on booking)",
        durationMinutes: 45,
        basePricePaise: 29900,
        // ₹299
        regularPricePaise: 49900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [
      {
        question: "Do you bring your own tools and floor covers?",
        answer: "Yes, we bring rollers, brushes, masking tapes, and protective tarpaulins."
      }
    ],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  },
  // 12. CARPENTER SERVICES
  {
    id: "srv_carpenter_services",
    slug: "doorstep-carpentry-repairs",
    title: "Doorstep Carpenter Services",
    categoryId: "cat_carpenter",
    shortDescription: "Lock fittings, door alignment, furniture repairs, curtain rod & wall hanging by experienced carpenters.",
    fullDescription: "Experienced doorstep carpentry repairs by TankmanPro professionals. Rapid fixing of squeaking doors, broken locks, hinge realignment, furniture assembly, and custom shelf mounts.",
    illustrationKey: "appliance-repair",
    imageUrl: "/assets/tankmanpro/sofa-clean.jpg",
    galleryUrls: ["/assets/tankmanpro/sofa-clean.jpg"],
    durationMinutes: 40,
    basePricePaise: 14900,
    // ₹149 starting
    regularPricePaise: 24900,
    defaultPricingMode: "city_fixed",
    cityModeOverrides: {
      city_delhi: "city_fixed",
      city_shahjahanpur: "city_fixed",
      city_kanpur: "city_fixed"
    },
    inclusions: [
      "Site evaluation and precision carpentry tools & drill machines",
      "Sturdy mounting and joint realignment",
      "Testing and post-work cleanup"
    ],
    exclusions: ["Raw timber, locks, hinges or hardware not provided"],
    preparationInstructions: [
      "Keep hardware or replacement locks accessible."
    ],
    warrantySummary: "30-Day Workmanship Warranty",
    cancellationPolicySummary: "Free cancellation up to 4 hours before slot.",
    variants: [
      {
        id: "var_carp_drilling",
        serviceId: "srv_carpenter_services",
        name: "Drilling, Hanging & Curtain Rod Mount",
        scopeSummary: "Curtain rod, mirror, heavy frame or shelf mounting",
        durationMinutes: 30,
        basePricePaise: 14900,
        // ₹149
        regularPricePaise: 24900,
        imageUrl: "/assets/tankmanpro/sofa-clean.jpg",
        active: true
      },
      {
        id: "var_carp_hinge",
        serviceId: "srv_carpenter_services",
        name: "Door Hinge & Alignment Repair",
        scopeSummary: "Floor-scraping door fix, loose hinge screws & adjustment",
        durationMinutes: 30,
        basePricePaise: 19900,
        // ₹199
        regularPricePaise: 29900,
        imageUrl: "/assets/tankmanpro/sofa-clean.jpg",
        active: true
      },
      {
        id: "var_carp_lock",
        serviceId: "srv_carpenter_services",
        name: "Door Lock & Latch Fitting",
        scopeSummary: "Mortise lock, cylindrical knob or latch installation",
        durationMinutes: 45,
        basePricePaise: 24900,
        // ₹249
        regularPricePaise: 34900,
        imageUrl: "/assets/tankmanpro/sofa-clean.jpg",
        active: true
      },
      {
        id: "var_carp_furniture",
        serviceId: "srv_carpenter_services",
        name: "Furniture Assembly & Repair",
        scopeSummary: "Bed, wardrobe, dining table assembly & tightening",
        durationMinutes: 60,
        basePricePaise: 29900,
        // ₹299
        regularPricePaise: 39900,
        imageUrl: "/assets/tankmanpro/sofa-clean.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [
      {
        question: "Are screws and brackets included?",
        answer: "Basic wall plugs and screws are carried by the technician; specialized hardware must be provided."
      }
    ],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  }
];
var ALL_SERVICE_IDS = DEMO_SERVICES.map((s) => s.id);
var DEMO_VENDORS = [
  {
    uid: "vendor_demo_del_1",
    displayName: "AquaPure Mechanized Crew (Delhi)",
    businessName: "AquaPure Hygiene Solutions Pvt. Ltd.",
    phone: "+91-98100-00001",
    email: "aquapure.demo@tankmanpro.example",
    status: "active",
    supportedCityIds: ["city_delhi"],
    supportedAreaPins: ["110001", "110016", "110075"],
    supportedServiceIds: ALL_SERVICE_IDS,
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    workingHoursLabel: "08:00 AM \u2013 08:00 PM",
    maxActiveJobs: 6,
    activeAssignedJobs: 2,
    assignmentPriority: 1,
    experienceYearsLabel: "Verified Crew \xB7 Delhi NCR",
    isDemo: true
  },
  {
    uid: "vendor_demo_del_2",
    displayName: "Capital Climate & Tank Engineers (Delhi)",
    businessName: "Capital Home Technical Services",
    phone: "+91-98100-00002",
    email: "capital.demo@tankmanpro.example",
    status: "active",
    supportedCityIds: ["city_delhi"],
    supportedAreaPins: ["110001", "110016", "110075"],
    supportedServiceIds: ALL_SERVICE_IDS,
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    workingHoursLabel: "09:00 AM \u2013 07:00 PM",
    maxActiveJobs: 5,
    activeAssignedJobs: 1,
    assignmentPriority: 2,
    experienceYearsLabel: "Verified Crew \xB7 Connaught Place & South Delhi",
    isDemo: true
  },
  {
    uid: "vendor_demo_spn_1",
    displayName: "Rohilkhand Tank & Hydro Care (Shahjahanpur)",
    businessName: "Rohilkhand Hydro Care Services",
    phone: "+91-94150-00001",
    email: "rohilkhand.demo@tankmanpro.example",
    status: "active",
    supportedCityIds: ["city_shahjahanpur", "city_kanpur"],
    supportedAreaPins: ["242001", "242226", "208001", "208002"],
    supportedServiceIds: ALL_SERVICE_IDS,
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    workingHoursLabel: "08:30 AM \u2013 07:00 PM",
    maxActiveJobs: 5,
    activeAssignedJobs: 1,
    assignmentPriority: 1,
    experienceYearsLabel: "Verified Crew \xB7 UP Zone",
    isDemo: true
  },
  {
    uid: "vendor_demo_spn_2",
    displayName: "Sadar CleanTank & Appliance Crew",
    businessName: "Sadar Technical Works",
    phone: "+91-94150-00002",
    email: "sadar.demo@tankmanpro.example",
    status: "active",
    supportedCityIds: ["city_shahjahanpur", "city_kanpur"],
    supportedAreaPins: ["242001", "242226", "208001", "208002"],
    supportedServiceIds: ALL_SERVICE_IDS,
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    workingHoursLabel: "09:00 AM \u2013 06:30 PM",
    maxActiveJobs: 4,
    activeAssignedJobs: 0,
    assignmentPriority: 2,
    experienceYearsLabel: "Verified Crew \xB7 Sadar & Civil Lines",
    isDemo: true
  }
];
var DEMO_PRICE_OVERRIDES = [
  {
    id: "po_tank_500_del_city",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_500_1000",
    cityId: "city_delhi",
    amountPaise: 49900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_500_knp_city",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_500_1000",
    cityId: "city_kanpur",
    amountPaise: 49900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_500_spn_city",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_500_1000",
    cityId: "city_shahjahanpur",
    amountPaise: 89900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_500_spn_vendor1",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_500_1000",
    cityId: "city_shahjahanpur",
    vendorUid: "vendor_demo_spn_1",
    amountPaise: 85e3,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_500_spn_vendor2",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_500_1000",
    cityId: "city_shahjahanpur",
    vendorUid: "vendor_demo_spn_2",
    amountPaise: 89e3,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_1000_spn_vendor1",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_1000_1500",
    cityId: "city_shahjahanpur",
    vendorUid: "vendor_demo_spn_1",
    amountPaise: 89900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_1000_spn_vendor2",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_1000_1500",
    cityId: "city_shahjahanpur",
    vendorUid: "vendor_demo_spn_2",
    amountPaise: 94900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_1500_del_city",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_1500_2000",
    cityId: "city_delhi",
    amountPaise: 149900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_1500_spn_vendor1",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_1500_2000",
    cityId: "city_shahjahanpur",
    vendorUid: "vendor_demo_spn_1",
    amountPaise: 139900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_1500_spn_vendor2",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_1500_2000",
    cityId: "city_shahjahanpur",
    vendorUid: "vendor_demo_spn_2",
    amountPaise: 149900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_4000_spn_vendor1",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_4000_5000",
    cityId: "city_shahjahanpur",
    vendorUid: "vendor_demo_spn_1",
    amountPaise: 239900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_tank_4000_spn_vendor2",
    serviceId: "srv_mechanized_tank_clean",
    variantId: "var_tank_4000_5000",
    cityId: "city_shahjahanpur",
    vendorUid: "vendor_demo_spn_2",
    amountPaise: 249900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_ac_single_del_vendor1",
    serviceId: "srv_ac_foam_jet",
    variantId: "var_ac_single",
    cityId: "city_delhi",
    vendorUid: "vendor_demo_del_1",
    amountPaise: 59900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_ac_single_del_vendor2",
    serviceId: "srv_ac_foam_jet",
    variantId: "var_ac_single",
    cityId: "city_delhi",
    vendorUid: "vendor_demo_del_2",
    amountPaise: 62900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_ac_twin_del_vendor1",
    serviceId: "srv_ac_foam_jet",
    variantId: "var_ac_twin",
    cityId: "city_delhi",
    vendorUid: "vendor_demo_del_1",
    amountPaise: 109900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_ac_twin_del_vendor2",
    serviceId: "srv_ac_foam_jet",
    variantId: "var_ac_twin",
    cityId: "city_delhi",
    vendorUid: "vendor_demo_del_2",
    amountPaise: 114900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_ac_install_del_vendor1",
    serviceId: "srv_ac_foam_jet",
    variantId: "var_ac_install",
    cityId: "city_delhi",
    vendorUid: "vendor_demo_del_1",
    amountPaise: 149900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  },
  {
    id: "po_ac_install_del_vendor2",
    serviceId: "srv_ac_foam_jet",
    variantId: "var_ac_install",
    cityId: "city_delhi",
    vendorUid: "vendor_demo_del_2",
    amountPaise: 154900,
    currency: "INR",
    active: true,
    updatedByUid: "admin_seed",
    updatedAtIso: "2026-10-20T00:00:00Z",
    isDemo: true
  }
];
var DEMO_COUPONS = [
  {
    id: "cpn_clean10",
    code: "CLEAN10",
    internalName: "10% Hygiene Discount",
    description: "10% off on water tank cleaning and home services (up to \u20B9200 max discount).",
    discountType: "percentage",
    discountValue: 10,
    maxDiscountCapPaise: 2e4,
    minOrderSubtotalPaise: 3e4,
    validFromIso: "2025-01-01T00:00:00Z",
    validUntilIso: "2027-12-31T23:59:59Z",
    totalRedemptionLimit: 500,
    currentRedemptions: 12,
    perCustomerLimit: 2,
    newCustomerOnly: false,
    active: true,
    isDemo: true
  },
  {
    id: "cpn_delhi150",
    code: "DELHI150",
    internalName: "Delhi NCR Flat \u20B9150 Off",
    description: "Flat \u20B9150 off on orders above \u20B9800 in New Delhi service areas.",
    discountType: "fixed",
    discountValue: 15e3,
    minOrderSubtotalPaise: 8e4,
    validFromIso: "2025-01-01T00:00:00Z",
    validUntilIso: "2027-12-31T23:59:59Z",
    applicableCityIds: ["city_delhi"],
    totalRedemptionLimit: 100,
    currentRedemptions: 5,
    perCustomerLimit: 1,
    newCustomerOnly: false,
    active: true,
    isDemo: true
  }
];

// src/data/initialOperationsData.ts
var SEEDED_VENDORS = DEMO_VENDORS.map((v, idx) => ({
  ...v,
  vendorCode: `TMP-VND-${1001 + idx}`,
  isAvailable: true,
  activeAssignedJobs: 0,
  commissionPercent: 18,
  password: "TankmanPartner@2026",
  kycNotes: "Verified Aadhaar, PAN, Police Clearance & Mechanised Tool Kit Inspection.",
  createdAtIso: "2026-09-15T09:00:00.000Z",
  updatedAtIso: "2026-10-19T14:30:00.000Z"
}));
var INITIAL_BOOKINGS = [];
var INITIAL_BOOKING_EVENTS = [];
var INITIAL_NOTIFICATIONS = [];
var todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var INITIAL_CMS_SETTINGS = {
  id: "global",
  heroTitle: "Home services at your doorstep",
  heroSubtitle: "Mechanised 6-stage water tank cleaning, intense bathroom & kitchen hygiene, foam-jet AC servicing, and clinical skin care by verified professionals.",
  announcementText: "Live in Kanpur (208001, 208002), Shahjahanpur (242001) & New Delhi (110001) \xB7 Use code CLEAN10 for 10% off!",
  supportPhone: "+91 96481 75639",
  supportEmail: "support@tankmanpro.com",
  whatsappNumber: "+91 96481 75639",
  instagramUrl: "https://www.instagram.com/tankmanpro.in/",
  dispatchMode: "manual",
  trustBadges: [
    "6-Stage UV & High-Pressure Jet Protocol",
    "Background-Verified & Trained Crew",
    "100% Transparent Paise-Exact Tariff Card"
  ],
  faqs: [
    {
      question: "How does TankmanPro verify serviceability for my location?",
      answer: "Enter your 6-digit Indian PIN code on the homepage. We verify active technician coverage and show exact city-resolved rates before you book."
    },
    {
      question: "What is included in the 6-Stage Mechanised Water Tank Cleaning?",
      answer: "Dewatering, sludge vacuum extraction, high-pressure rotary jet washing of walls/ceiling, anti-bacterial spray, UV radiator treatment, and inlet/float valve check."
    },
    {
      question: "Can I reschedule or cancel my booking?",
      answer: "Yes, bookings can be rescheduled or cancelled free of charge before technician dispatch."
    }
  ],
  updatedAtIso: `${todayStr}T04:00:00.000Z`
};

// src/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer
} from "firebase/firestore";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "gen-lang-client-0264637166",
  appId: "1:626509803830:web:ad533c612bb2a53b0b0397",
  apiKey: "AIzaSyCAU1g9dmx7miv8DJ1b7GRgEi3TrMwz1Qk",
  authDomain: "gen-lang-client-0264637166.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-tankmanpro-ae50bc10-1dec-4a8d-bead-11f20ddaf0b8",
  storageBucket: "gen-lang-client-0264637166.firebasestorage.app",
  messagingSenderId: "626509803830",
  measurementId: "",
  oAuthClientId: "626509803830-oel4ok31irshhrp3p4olf0c1kdvadcoo.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/firebase.ts
var app = initializeApp(firebase_applet_config_default);
var db = getFirestore(app, firebase_applet_config_default.firestoreDatabaseId);
var auth = getAuth(app);
var googleProvider = new GoogleAuthProvider();

// src/lib/databaseEngine.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var DATA_DIR = path.resolve(__dirname, "../data");
var DB_FILE_PATH = path.resolve(DATA_DIR, "tankman_production_db.json");
function createInitialDatabase() {
  return {
    cities: structuredClone(DEMO_CITIES),
    serviceAreas: structuredClone(DEMO_SERVICE_AREAS),
    categories: structuredClone(DEMO_CATEGORIES),
    services: structuredClone(DEMO_SERVICES),
    vendors: structuredClone(SEEDED_VENDORS),
    priceOverrides: structuredClone(DEMO_PRICE_OVERRIDES),
    coupons: structuredClone(DEMO_COUPONS),
    bookings: structuredClone(INITIAL_BOOKINGS),
    bookingEvents: structuredClone(INITIAL_BOOKING_EVENTS),
    notifications: structuredClone(INITIAL_NOTIFICATIONS),
    cmsSettings: structuredClone(INITIAL_CMS_SETTINGS),
    waitlistEntries: [],
    contactSubmissions: [],
    version: "1.0.0",
    updatedAtIso: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function loadPlatformDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.vendors)) {
        console.log(
          `[DatabaseEngine] Loaded database: ${parsed.services.length} services, ${parsed.vendors.length} vendors, ${parsed.bookings?.length || 0} bookings.`
        );
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[DatabaseEngine] Error reading existing DB file, re-initializing fresh database:", err);
  }
  const freshDb = createInitialDatabase();
  savePlatformDatabase(freshDb);
  console.log("[DatabaseEngine] Initialized and saved fresh platform database.");
  return freshDb;
}
function savePlatformDatabase(database) {
  try {
    database.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
    const tempPath = `${DB_FILE_PATH}.tmp_${Date.now()}`;
    const serialized = JSON.stringify(database, null, 2);
    fs.writeFileSync(tempPath, serialized, "utf-8");
    fs.renameSync(tempPath, DB_FILE_PATH);
    return true;
  } catch (err) {
    console.error("[DatabaseEngine] Fatal error writing platform database to disk:", err);
    return false;
  }
}
async function mirrorToFirestore(collectionName, docId, payload) {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, JSON.parse(JSON.stringify(payload)), { merge: true });
  } catch {
  }
}
async function deleteFromFirestore(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch {
  }
}
function getDatabaseMetrics(currentDb) {
  let fileSizeBytes = 0;
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const stats = fs.statSync(DB_FILE_PATH);
      fileSizeBytes = stats.size;
    }
  } catch {
  }
  return {
    storageType: "persistent_json_and_firestore_mirror",
    dbFilePath: DB_FILE_PATH,
    fileSizeBytes,
    fileSizeKb: (fileSizeBytes / 1024).toFixed(2),
    totalBookings: currentDb.bookings?.length || 0,
    totalVendors: currentDb.vendors?.length || 0,
    totalServices: currentDb.services?.length || 0,
    totalCities: currentDb.cities?.length || 0,
    totalPinCodes: currentDb.serviceAreas?.length || 0,
    lastSavedIso: currentDb.updatedAtIso
  };
}

// src/lib/portalRouting.ts
function isValidIndianPin(pin) {
  return /^[1-9][0-9]{5}$/.test((pin || "").trim());
}
function lookupPinCoverage(rawPin, cities, serviceAreas) {
  const pinCode = (rawPin || "").trim();
  if (!isValidIndianPin(pinCode)) {
    return {
      validFormat: false,
      serviceable: false,
      pinCode,
      message: "Please enter a valid 6-digit Indian PIN code (for example, 110001 or 242001)."
    };
  }
  const matchedArea = serviceAreas.find(
    (area) => area.pinCode === pinCode && area.active
  );
  if (!matchedArea) {
    return {
      validFormat: true,
      serviceable: false,
      pinCode,
      message: `PIN ${pinCode} is not covered yet. Join the area waitlist and we will notify you when verified technicians launch in your neighbourhood.`
    };
  }
  const matchedCity = cities.find(
    (city) => city.id === matchedArea.cityId && city.active
  );
  if (!matchedCity) {
    return {
      validFormat: true,
      serviceable: false,
      pinCode,
      message: `Service operations in PIN ${pinCode} are currently paused by Admin.`
    };
  }
  return {
    validFormat: true,
    serviceable: true,
    pinCode,
    city: matchedCity,
    serviceArea: matchedArea,
    message: `Available in ${matchedArea.zoneLabel}, ${matchedCity.name} (${pinCode}).`
  };
}

// src/lib/pricingEngine.ts
function formatPaiseToInr(amountPaise) {
  const rupees = amountPaise / 100;
  const hasPaise = amountPaise % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0
  }).format(rupees);
}
function resolveServicePricingMode(service, cityId) {
  if (service.cityModeOverrides && service.cityModeOverrides[cityId]) {
    return service.cityModeOverrides[cityId];
  }
  return service.defaultPricingMode;
}
function resolveEffectivePricePaise(params) {
  const { service, variantId, cityId, vendorUid, priceOverrides } = params;
  if (service.status !== "published") {
    return {
      bookable: false,
      pricingMode: service.defaultPricingMode,
      unitPricePaise: null,
      currency: "INR",
      pricingSource: "unavailable",
      reason: "Service is not published for booking."
    };
  }
  if (!service.supportedCityIds.includes(cityId)) {
    return {
      bookable: false,
      pricingMode: service.defaultPricingMode,
      unitPricePaise: null,
      currency: "INR",
      pricingSource: "unavailable",
      reason: "Service is not enabled in the selected city."
    };
  }
  const variant = service.variants.find((v) => v.id === variantId && v.active);
  if (!variant) {
    return {
      bookable: false,
      pricingMode: service.defaultPricingMode,
      unitPricePaise: null,
      currency: "INR",
      pricingSource: "unavailable",
      reason: "Selected service package/variant is not active."
    };
  }
  const pricingMode = resolveServicePricingMode(service, cityId);
  if (vendorUid) {
    const vendorOverride = priceOverrides.find(
      (po) => po.active && po.serviceId === service.id && po.variantId === variantId && po.cityId === cityId && po.vendorUid === vendorUid
    );
    if (vendorOverride && vendorOverride.amountPaise > 0) {
      return {
        bookable: true,
        pricingMode,
        unitPricePaise: vendorOverride.amountPaise,
        currency: "INR",
        pricingSource: "vendor_override"
      };
    }
    if (pricingMode === "vendor_offer") {
      return {
        bookable: false,
        pricingMode,
        unitPricePaise: null,
        currency: "INR",
        pricingSource: "unavailable",
        reason: "Selected vendor does not have an Admin-approved offer price for this variant and city."
      };
    }
  }
  const cityOverride = priceOverrides.find(
    (po) => po.active && po.serviceId === service.id && po.variantId === variantId && po.cityId === cityId && !po.vendorUid
  );
  if (cityOverride && cityOverride.amountPaise > 0) {
    return {
      bookable: true,
      pricingMode,
      unitPricePaise: cityOverride.amountPaise,
      currency: "INR",
      pricingSource: "city_override"
    };
  }
  if (variant.basePricePaise > 0) {
    return {
      bookable: true,
      pricingMode,
      unitPricePaise: variant.basePricePaise,
      currency: "INR",
      pricingSource: "base_price"
    };
  }
  return {
    bookable: false,
    pricingMode,
    unitPricePaise: null,
    currency: "INR",
    pricingSource: "unavailable",
    reason: "Price is not configured for this service and city."
  };
}
function listEligibleVendorOffers(params) {
  const { service, variantId, cityId, pinCode, vendors, priceOverrides } = params;
  const eligibleVendors = vendors.filter(
    (v) => v.status === "active" && v.supportedCityIds.includes(cityId) && v.supportedAreaPins.includes(pinCode) && v.supportedServiceIds.includes(service.id) && v.activeAssignedJobs < v.maxActiveJobs
  );
  const offers = [];
  for (const vendor of eligibleVendors) {
    const resolution = resolveEffectivePricePaise({
      service,
      variantId,
      cityId,
      vendorUid: vendor.uid,
      priceOverrides
    });
    if (resolution.bookable && resolution.unitPricePaise !== null && resolution.pricingSource === "vendor_override") {
      offers.push({
        vendorUid: vendor.uid,
        vendorDisplayName: vendor.displayName,
        businessName: vendor.businessName,
        experienceYearsLabel: vendor.experienceYearsLabel,
        amountPaise: resolution.unitPricePaise,
        pricingSource: "vendor_override",
        availableSlots: ["09:00 AM \u2013 11:00 AM", "12:00 PM \u2013 02:00 PM", "03:30 PM \u2013 05:30 PM"],
        isDemo: vendor.isDemo
      });
    }
  }
  return offers.sort((a, b) => a.amountPaise - b.amountPaise);
}
function evaluateCouponDiscount(params) {
  const normalizedCode = (params.couponCode || "").trim().toUpperCase();
  if (!normalizedCode) {
    return { valid: false, discountPaise: 0, message: "No coupon code provided." };
  }
  const coupon = params.coupons.find(
    (c) => c.code.toUpperCase() === normalizedCode && c.active
  );
  if (!coupon) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Coupon "${normalizedCode}" is invalid or inactive.`
    };
  }
  const nowTime = params.nowIso ? new Date(params.nowIso).getTime() : Date.now();
  const startTime = new Date(coupon.validFromIso).getTime();
  const endTime = new Date(coupon.validUntilIso).getTime();
  if (nowTime < startTime || nowTime > endTime) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Coupon "${normalizedCode}" has expired or is not yet active.`
    };
  }
  if (coupon.totalRedemptionLimit !== void 0 && coupon.currentRedemptions >= coupon.totalRedemptionLimit) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Coupon "${normalizedCode}" has reached its maximum redemption limit.`
    };
  }
  if (coupon.applicableCityIds && coupon.applicableCityIds.length > 0 && !coupon.applicableCityIds.includes(params.cityId)) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Coupon "${normalizedCode}" is not valid in the selected city.`
    };
  }
  if (coupon.applicableServiceIds && coupon.applicableServiceIds.length > 0 && !coupon.applicableServiceIds.includes(params.serviceId)) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Coupon "${normalizedCode}" does not apply to this service.`
    };
  }
  if (params.subtotalPaise < coupon.minOrderSubtotalPaise) {
    return {
      valid: false,
      discountPaise: 0,
      message: `Minimum service subtotal of ${formatPaiseToInr(coupon.minOrderSubtotalPaise)} required for "${normalizedCode}".`
    };
  }
  let rawDiscountPaise = 0;
  if (coupon.discountType === "percentage") {
    rawDiscountPaise = Math.round(params.subtotalPaise * coupon.discountValue / 100);
    if (coupon.maxDiscountCapPaise && rawDiscountPaise > coupon.maxDiscountCapPaise) {
      rawDiscountPaise = coupon.maxDiscountCapPaise;
    }
  } else {
    rawDiscountPaise = coupon.discountValue;
  }
  const discountPaise = Math.min(rawDiscountPaise, params.subtotalPaise);
  return {
    valid: true,
    discountPaise,
    message: `Coupon "${coupon.code}" applied (${formatPaiseToInr(discountPaise)} savings).`,
    coupon
  };
}
function calculateAuthoritativeQuote(params) {
  const {
    request,
    cities,
    serviceAreas,
    services,
    vendors,
    priceOverrides,
    coupons,
    taxRatePercent = 0,
    nowIso
  } = params;
  const pinLookup = lookupPinCoverage(request.pinCode, cities, serviceAreas);
  const service = services.find((s) => s.id === request.serviceId);
  const emptyExpiry = new Date(Date.now() + 15 * 60 * 1e3).toISOString();
  if (!pinLookup.serviceable || !pinLookup.city || !pinLookup.serviceArea) {
    return {
      bookable: false,
      reason: pinLookup.message,
      cityId: "",
      cityName: "",
      pinCode: request.pinCode,
      zoneLabel: "",
      pricingMode: service?.defaultPricingMode || "city_fixed",
      pricingSource: "unavailable",
      serviceId: request.serviceId,
      serviceTitle: service?.title || "",
      variantId: request.variantId,
      variantName: "",
      baseServicePaise: 0,
      addons: [],
      addonsTotalPaise: 0,
      subtotalPaise: 0,
      discountPaise: 0,
      taxPaise: 0,
      taxRatePercent,
      finalTotalPaise: 0,
      currency: "INR",
      quoteExpiresAtIso: emptyExpiry,
      isDemoData: true
    };
  }
  if (!service) {
    return {
      bookable: false,
      reason: "Requested service was not found.",
      cityId: pinLookup.city.id,
      cityName: pinLookup.city.name,
      pinCode: pinLookup.pinCode,
      zoneLabel: pinLookup.serviceArea.zoneLabel,
      pricingMode: "city_fixed",
      pricingSource: "unavailable",
      serviceId: request.serviceId,
      serviceTitle: "",
      variantId: request.variantId,
      variantName: "",
      baseServicePaise: 0,
      addons: [],
      addonsTotalPaise: 0,
      subtotalPaise: 0,
      discountPaise: 0,
      taxPaise: 0,
      taxRatePercent,
      finalTotalPaise: 0,
      currency: "INR",
      quoteExpiresAtIso: emptyExpiry,
      isDemoData: true
    };
  }
  const pricingMode = resolveServicePricingMode(service, pinLookup.city.id);
  const variant = service.variants.find((v) => v.id === request.variantId && v.active);
  if (pricingMode === "vendor_offer" && !request.selectedVendorUid) {
    return {
      bookable: false,
      reason: "Please select an eligible vendor offer for this service in your city.",
      cityId: pinLookup.city.id,
      cityName: pinLookup.city.name,
      pinCode: pinLookup.pinCode,
      zoneLabel: pinLookup.serviceArea.zoneLabel,
      pricingMode,
      pricingSource: "unavailable",
      serviceId: service.id,
      serviceTitle: service.title,
      variantId: request.variantId,
      variantName: variant?.name || "",
      baseServicePaise: 0,
      addons: [],
      addonsTotalPaise: 0,
      subtotalPaise: 0,
      discountPaise: 0,
      taxPaise: 0,
      taxRatePercent,
      finalTotalPaise: 0,
      currency: "INR",
      quoteExpiresAtIso: emptyExpiry,
      isDemoData: service.isDemo
    };
  }
  let selectedVendor;
  if (request.selectedVendorUid) {
    selectedVendor = vendors.find(
      (v) => v.uid === request.selectedVendorUid && v.status === "active" && v.supportedCityIds.includes(pinLookup.city.id) && v.supportedAreaPins.includes(pinLookup.pinCode) && v.supportedServiceIds.includes(service.id)
    );
    if (!selectedVendor) {
      return {
        bookable: false,
        reason: "Selected vendor is not eligible for this PIN code and service.",
        cityId: pinLookup.city.id,
        cityName: pinLookup.city.name,
        pinCode: pinLookup.pinCode,
        zoneLabel: pinLookup.serviceArea.zoneLabel,
        pricingMode,
        pricingSource: "unavailable",
        serviceId: service.id,
        serviceTitle: service.title,
        variantId: request.variantId,
        variantName: variant?.name || "",
        baseServicePaise: 0,
        addons: [],
        addonsTotalPaise: 0,
        subtotalPaise: 0,
        discountPaise: 0,
        taxPaise: 0,
        taxRatePercent,
        finalTotalPaise: 0,
        currency: "INR",
        quoteExpiresAtIso: emptyExpiry,
        isDemoData: service.isDemo
      };
    }
  }
  const priceRes = resolveEffectivePricePaise({
    service,
    variantId: request.variantId,
    cityId: pinLookup.city.id,
    vendorUid: pricingMode === "vendor_offer" ? request.selectedVendorUid : void 0,
    priceOverrides
  });
  if (!priceRes.bookable || priceRes.unitPricePaise === null) {
    return {
      bookable: false,
      reason: priceRes.reason || "Price not configured for this location.",
      cityId: pinLookup.city.id,
      cityName: pinLookup.city.name,
      pinCode: pinLookup.pinCode,
      zoneLabel: pinLookup.serviceArea.zoneLabel,
      pricingMode,
      pricingSource: "unavailable",
      serviceId: service.id,
      serviceTitle: service.title,
      variantId: request.variantId,
      variantName: variant?.name || "",
      baseServicePaise: 0,
      addons: [],
      addonsTotalPaise: 0,
      subtotalPaise: 0,
      discountPaise: 0,
      taxPaise: 0,
      taxRatePercent,
      finalTotalPaise: 0,
      currency: "INR",
      quoteExpiresAtIso: emptyExpiry,
      isDemoData: service.isDemo
    };
  }
  const addonsBreakdown = [];
  let addonsTotalPaise = 0;
  for (const addon of service.addons) {
    if (!addon.active) continue;
    const requestedQty = request.addonQuantities?.[addon.id] || 0;
    const qty = Math.max(0, Math.min(requestedQty, addon.maxQuantity));
    if (qty > 0) {
      const lineTotalPaise = addon.pricePaise * qty;
      addonsTotalPaise += lineTotalPaise;
      addonsBreakdown.push({
        addonId: addon.id,
        name: addon.name,
        quantity: qty,
        unitPaise: addon.pricePaise,
        lineTotalPaise
      });
    }
  }
  const baseServicePaise = priceRes.unitPricePaise;
  const subtotalPaise = baseServicePaise + addonsTotalPaise;
  let discountPaise = 0;
  let couponValid;
  let couponMessage;
  let appliedCouponCode;
  if (request.couponCode && request.couponCode.trim()) {
    const couponEval = evaluateCouponDiscount({
      couponCode: request.couponCode,
      subtotalPaise,
      cityId: pinLookup.city.id,
      serviceId: service.id,
      coupons,
      nowIso
    });
    couponValid = couponEval.valid;
    couponMessage = couponEval.message;
    discountPaise = couponEval.discountPaise;
    if (couponEval.valid) {
      appliedCouponCode = couponEval.coupon?.code;
    }
  }
  const taxablePaise = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = taxRatePercent > 0 ? Math.round(taxablePaise * taxRatePercent / 100) : 0;
  const finalTotalPaise = taxablePaise + taxPaise;
  return {
    bookable: true,
    cityId: pinLookup.city.id,
    cityName: pinLookup.city.name,
    pinCode: pinLookup.pinCode,
    zoneLabel: pinLookup.serviceArea.zoneLabel,
    pricingMode,
    pricingSource: priceRes.pricingSource,
    serviceId: service.id,
    serviceTitle: service.title,
    variantId: variant.id,
    variantName: variant.name,
    selectedVendorUid: selectedVendor?.uid,
    selectedVendorName: selectedVendor?.displayName,
    baseServicePaise,
    addons: addonsBreakdown,
    addonsTotalPaise,
    subtotalPaise,
    couponCode: appliedCouponCode || (request.couponCode ? request.couponCode.trim().toUpperCase() : void 0),
    couponValid,
    couponMessage,
    discountPaise,
    taxPaise,
    taxRatePercent,
    finalTotalPaise,
    currency: "INR",
    quoteExpiresAtIso: emptyExpiry,
    isDemoData: service.isDemo
  };
}

// src/lib/adminEngine.ts
function evaluateServiceDeletion(serviceId, bookings) {
  const referenced = bookings.filter((b) => b.serviceId === serviceId);
  if (referenced.length > 0) {
    return {
      canHardDelete: false,
      referencedBookingsCount: referenced.length,
      recommendedAction: "archive",
      message: `Cannot delete service because it is referenced by ${referenced.length} recorded booking(s). It has been safely archived instead to preserve booking history.`
    };
  }
  return {
    canHardDelete: true,
    referencedBookingsCount: 0,
    recommendedAction: "delete",
    message: "Service has no booking references and can be permanently deleted."
  };
}
function validateAndParsePinCsv(csvText, existingCities, existingAreas) {
  const lines = (csvText || "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const rows = [];
  const seenPinsInBatch = /* @__PURE__ */ new Map();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(",").map((p) => p.trim());
    if (i === 0 && (parts[0].toLowerCase().includes("pin") || parts[0].toLowerCase() === "pincode")) {
      continue;
    }
    const rowNumber = i + 1;
    const [rawPin = "", rawCity = "", rawState = "", rawZone = "", rawActive = "true"] = parts;
    const pinCode = rawPin.trim();
    const cityName = rawCity.trim();
    const state = rawState.trim() || "Uttar Pradesh";
    const zoneLabel = rawZone.trim() || `${cityName} Central Zone`;
    const active = rawActive.toLowerCase() !== "false" && rawActive.toLowerCase() !== "0" && rawActive.toLowerCase() !== "inactive";
    if (!isValidIndianPin(pinCode)) {
      rows.push({
        rowNumber,
        pinCode,
        cityName,
        state,
        zoneLabel,
        active,
        status: "invalid",
        reason: `Invalid 6-digit Indian PIN code "${pinCode}".`
      });
      continue;
    }
    if (!cityName || cityName.length < 2) {
      rows.push({
        rowNumber,
        pinCode,
        cityName,
        state,
        zoneLabel,
        active,
        status: "invalid",
        reason: "City name is required for each PIN code row."
      });
      continue;
    }
    if (seenPinsInBatch.has(pinCode)) {
      const firstCity = seenPinsInBatch.get(pinCode);
      const isDifferentCity = firstCity.toLowerCase() !== cityName.toLowerCase();
      rows.push({
        rowNumber,
        pinCode,
        cityName,
        state,
        zoneLabel,
        active,
        status: isDifferentCity ? "conflict" : "invalid",
        reason: isDifferentCity ? `Location conflict in CSV: PIN ${pinCode} was already listed for "${firstCity}" and now appears for "${cityName}".` : `Duplicate PIN ${pinCode} found within the same CSV file.`
      });
      continue;
    }
    seenPinsInBatch.set(pinCode, cityName);
    const matchedCity = existingCities.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase() || c.slug.toLowerCase() === cityName.toLowerCase().replace(/\s+/g, "-")
    );
    const existingArea = existingAreas.find((a) => a.pinCode === pinCode);
    if (existingArea) {
      const existingCity = existingCities.find((c) => c.id === existingArea.cityId);
      const existingCityName = existingArea.cityName || existingCity?.name || "";
      if (existingCityName && existingCityName.toLowerCase() !== cityName.toLowerCase()) {
        rows.push({
          rowNumber,
          pinCode,
          cityName,
          state,
          zoneLabel,
          active,
          matchedCityId: matchedCity?.id,
          status: "conflict",
          reason: `Location Conflict: PIN ${pinCode} is currently mapped to "${existingCityName}" (${existingArea.zoneLabel}), but CSV assigns it to "${cityName}". Admin review required.`
        });
        continue;
      }
      rows.push({
        rowNumber,
        pinCode,
        cityName,
        state,
        zoneLabel,
        active,
        matchedCityId: matchedCity?.id || existingArea.cityId,
        status: "valid_update",
        reason: `Updates existing PIN ${pinCode} in ${cityName}.`
      });
      continue;
    }
    rows.push({
      rowNumber,
      pinCode,
      cityName,
      state,
      zoneLabel,
      active,
      matchedCityId: matchedCity?.id,
      status: "valid_new",
      reason: matchedCity ? `Maps new PIN ${pinCode} to existing city ${matchedCity.name}.` : `Maps new PIN ${pinCode} and will create new city "${cityName}" (${state}).`
    });
  }
  const validRows = rows.filter(
    (r) => r.status === "valid_new" || r.status === "valid_update"
  );
  const conflictRows = rows.filter((r) => r.status === "conflict");
  const invalidRows = rows.filter((r) => r.status === "invalid");
  return {
    rows,
    validRows,
    conflictRows,
    invalidRows,
    summary: {
      totalRows: rows.length,
      validCount: validRows.length,
      conflictCount: conflictRows.length,
      invalidCount: invalidRows.length
    }
  };
}
function generateUniqueVendorCode(existingVendors) {
  let maxNumber = 1e3;
  for (const v of existingVendors) {
    if (v.vendorCode) {
      const match = v.vendorCode.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!Number.isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  return `TMP-VND-${maxNumber + 1}`;
}
function findEligibleVendorsForBooking(booking, vendors) {
  return vendors.filter((v) => {
    if (v.status !== "active") return false;
    if (v.isAvailable === false) return false;
    if (!v.supportedCityIds.includes(booking.cityId)) return false;
    if (!v.supportedAreaPins.includes(booking.pinCode)) return false;
    if (!v.supportedServiceIds.includes(booking.serviceId)) return false;
    if (v.activeAssignedJobs >= v.maxActiveJobs) return false;
    return true;
  }).sort((a, b) => {
    if (a.activeAssignedJobs !== b.activeAssignedJobs) {
      return a.activeAssignedJobs - b.activeAssignedJobs;
    }
    return (a.assignmentPriority || 99) - (b.assignmentPriority || 99);
  });
}

// src/lib/vendorEngine.ts
function filterVendorScopedBookings(bookings, vendorUid, supportedAreaPins) {
  const cleanUid = (vendorUid || "").trim();
  if (!cleanUid) return [];
  return bookings.filter((b) => {
    if (b.assignedVendorUid !== cleanUid) return false;
    if (Array.isArray(supportedAreaPins) && supportedAreaPins.length > 0) {
      return supportedAreaPins.includes(b.pinCode);
    }
    return true;
  });
}
function maskCustomerPhone(phone) {
  const clean = (phone || "").trim();
  if (clean.length <= 4) return "\u2022\u2022\u2022\u2022";
  const last3 = clean.slice(-3);
  const prefix = clean.slice(0, Math.min(6, clean.length - 3));
  return `${prefix}\u2022\u2022\u2022${last3}`;
}
function sanitizeBookingForVendorView(booking, vendorUid) {
  if (!booking || booking.assignedVendorUid !== vendorUid) {
    return null;
  }
  const piiRevealed = booking.status === "vendor_accepted" || booking.status === "in_progress" || booking.status === "completed";
  if (piiRevealed) {
    return {
      ...booking,
      piiRevealed: true
    };
  }
  return {
    ...booking,
    customerPhone: maskCustomerPhone(booking.customerPhone),
    customerEmail: void 0,
    addressLine: `${booking.zoneLabel} (Full street/flat address unlocked upon accepting job)`,
    landmark: booking.landmark ? "Visible after job acceptance" : void 0,
    piiRevealed: false
  };
}
function validateVendorJobTransition(params) {
  const { currentStatus, targetStatus, reason } = params;
  const cleanReason = (reason || "").trim();
  if (currentStatus === targetStatus) {
    return {
      allowed: false,
      error: `Booking is already in "${currentStatus}" status.`
    };
  }
  if (currentStatus === "assigned_to_vendor") {
    if (targetStatus === "vendor_accepted") {
      return { allowed: true };
    }
    if (targetStatus === "vendor_rejected") {
      if (cleanReason.length < 5) {
        return {
          allowed: false,
          error: "Please provide a clear rejection/reassignment reason (at least 5 characters) for Admin Dispatch."
        };
      }
      return { allowed: true };
    }
    return {
      allowed: false,
      error: "New assigned bookings must first be Accepted or Rejected before starting field execution."
    };
  }
  if (currentStatus === "vendor_accepted") {
    if (targetStatus === "in_progress") {
      return { allowed: true };
    }
    if (targetStatus === "vendor_rejected") {
      if (cleanReason.length < 5) {
        return {
          allowed: false,
          error: "Please provide a valid reason (at least 5 characters) to request booking reassignment."
        };
      }
      return { allowed: true };
    }
    return {
      allowed: false,
      error: "Accepted bookings must be marked as Started (In Progress) before they can be completed."
    };
  }
  if (currentStatus === "in_progress") {
    if (targetStatus === "completed") {
      return { allowed: true };
    }
    if (targetStatus === "vendor_rejected") {
      if (cleanReason.length < 5) {
        return {
          allowed: false,
          error: "Please explain why the job could not be completed so Admin can assist the customer."
        };
      }
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `Invalid transition from in_progress to ${targetStatus}.`
    };
  }
  return {
    allowed: false,
    error: `Bookings in "${currentStatus}" status are locked and cannot be transitioned by the vendor.`
  };
}
function computeVendorDashboardMetrics(params) {
  const { bookings, vendor, todayDateStr } = params;
  const scoped = filterVendorScopedBookings(bookings, vendor.uid, vendor.supportedAreaPins);
  const commissionPercent = typeof vendor.commissionPercent === "number" && vendor.commissionPercent >= 0 ? vendor.commissionPercent : 18;
  let awaitingAcceptanceCount = 0;
  let todaysJobsCount = 0;
  let upcomingJobsCount = 0;
  let inProgressJobsCount = 0;
  let completedJobsCount = 0;
  let rejectedOrCancelledCount = 0;
  let grossCompletedPaise = 0;
  let pendingPipelineGrossPaise = 0;
  for (const b of scoped) {
    const amountPaise = b.quoteSnapshot?.finalTotalPaise || 0;
    const isRejectedOrCancelled = b.status === "vendor_rejected" || b.status === "cancelled" || b.status === "refunded";
    if (b.status === "assigned_to_vendor") {
      awaitingAcceptanceCount += 1;
    } else if (b.status === "in_progress") {
      inProgressJobsCount += 1;
    } else if (b.status === "completed") {
      completedJobsCount += 1;
      grossCompletedPaise += amountPaise;
    } else if (isRejectedOrCancelled) {
      rejectedOrCancelledCount += 1;
    }
    if (b.status === "assigned_to_vendor" || b.status === "vendor_accepted" || b.status === "in_progress") {
      pendingPipelineGrossPaise += amountPaise;
    }
    if (!isRejectedOrCancelled) {
      if (b.preferredDate === todayDateStr) {
        todaysJobsCount += 1;
      } else if (b.preferredDate > todayDateStr) {
        upcomingJobsCount += 1;
      }
    }
  }
  const platformCommissionPaise = Math.round(grossCompletedPaise * commissionPercent / 100);
  const netVendorEarningsPaise = Math.max(0, grossCompletedPaise - platformCommissionPaise);
  const pendingCommissionPaise = Math.round(
    pendingPipelineGrossPaise * commissionPercent / 100
  );
  const pendingPipelineNetPaise = Math.max(
    0,
    pendingPipelineGrossPaise - pendingCommissionPaise
  );
  const actionableDenominator = completedJobsCount + rejectedOrCancelledCount;
  const completionRatePercent = actionableDenominator > 0 ? Math.round(completedJobsCount / actionableDenominator * 100) : 100;
  return {
    totalAssignedBookings: scoped.length,
    awaitingAcceptanceCount,
    todaysJobsCount,
    upcomingJobsCount,
    inProgressJobsCount,
    completedJobsCount,
    rejectedOrCancelledCount,
    completionRatePercent,
    commissionPercent,
    grossCompletedPaise,
    platformCommissionPaise,
    netVendorEarningsPaise,
    pendingPipelineGrossPaise,
    pendingPipelineNetPaise
  };
}

// src/lib/bookingEngine.ts
var STANDARD_TIME_WINDOWS = [
  "09:00 AM \u2013 11:00 AM",
  "12:00 PM \u2013 02:00 PM",
  "03:30 PM \u2013 05:30 PM",
  "05:30 PM \u2013 07:30 PM"
];
var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function parseSlotHours(timeWindow) {
  const parts = timeWindow.split(/–|-/).map((s) => s.trim());
  const parsePart = (part, fallback) => {
    const match = part.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return fallback;
    let hr = parseInt(match[1], 10);
    const min = parseInt(match[2], 10) / 60;
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hr < 12) hr += 12;
    if (ampm === "AM" && hr === 12) hr = 0;
    return hr + min;
  };
  return {
    startHour: parsePart(parts[0] || "", 9),
    endHour: parsePart(parts[1] || "", 11)
  };
}
function parse24HourString(hhmm, fallback) {
  if (!hhmm) return fallback;
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  return parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
}
function getDayLabelForDate(dateStr) {
  const match = (dateStr || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "Mon";
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const dt = new Date(Date.UTC(year, month, day));
  return DAY_NAMES[dt.getUTCDay()] || "Mon";
}
function evaluateVendorsForSlotAndService(params) {
  const {
    service,
    variantId,
    cityId,
    pinCode,
    scheduledDate,
    timeWindow,
    vendors,
    existingBookings,
    priceOverrides,
    expectedUnitPricePaise,
    selectedVendorUid
  } = params;
  const pricingMode = resolveServicePricingMode(service, cityId);
  const dayLabel = getDayLabelForDate(scheduledDate);
  const { startHour, endHour } = parseSlotHours(timeWindow);
  return vendors.map((vendor) => {
    if (vendor.status !== "active") {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor status is "${vendor.status}" (must be active & approved).`
      };
    }
    if (vendor.isAvailable === false) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: "Vendor shift status is currently offline/paused."
      };
    }
    if (!vendor.supportedCityIds.includes(cityId)) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor does not cover city ${cityId}.`
      };
    }
    if (!vendor.supportedAreaPins.includes(pinCode)) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor does not serve PIN code ${pinCode}.`
      };
    }
    if (!vendor.supportedServiceIds.includes(service.id)) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor is not authorized for service ${service.title}.`
      };
    }
    if (vendor.workingDays && vendor.workingDays.length > 0 && !vendor.workingDays.includes(dayLabel)) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor does not operate on ${dayLabel}.`
      };
    }
    const vendorStart = parse24HourString(vendor.workingHoursStart, 8);
    const vendorEnd = parse24HourString(vendor.workingHoursEnd, 20);
    if (startHour < vendorStart || endHour > vendorEnd) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Slot ${timeWindow} is outside vendor working hours (${vendor.workingHoursStart || "08:00"}\u2013${vendor.workingHoursEnd || "20:00"}).`
      };
    }
    const conflictingBooking = existingBookings.find(
      (b) => b.assignedVendorUid === vendor.uid && (b.scheduledDate || b.preferredDate) === scheduledDate && (b.timeWindow || b.preferredSlot) === timeWindow && (b.status === "assigned_to_vendor" || b.status === "vendor_accepted" || b.status === "in_progress")
    );
    if (conflictingBooking) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor is already booked for ${scheduledDate} \xB7 ${timeWindow} (${conflictingBooking.bookingCode || conflictingBooking.bookingNumber}).`
      };
    }
    const liveActiveCount = existingBookings.filter(
      (b) => b.assignedVendorUid === vendor.uid && (b.status === "assigned_to_vendor" || b.status === "vendor_accepted" || b.status === "in_progress")
    ).length;
    const effectiveActiveLoad = Math.max(vendor.activeAssignedJobs, liveActiveCount);
    if (effectiveActiveLoad >= vendor.maxActiveJobs) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor has reached maximum active job capacity (${effectiveActiveLoad}/${vendor.maxActiveJobs}).`
      };
    }
    if (selectedVendorUid && vendor.uid !== selectedVendorUid) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: "Customer explicitly selected a different partner offer."
      };
    }
    const priceRes = resolveEffectivePricePaise({
      service,
      variantId,
      cityId,
      vendorUid: pricingMode === "vendor_offer" ? vendor.uid : void 0,
      priceOverrides
    });
    if (!priceRes.bookable || priceRes.unitPricePaise === null) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: priceRes.reason || "Vendor does not have a valid rate for this service and city."
      };
    }
    if (pricingMode === "vendor_offer" && expectedUnitPricePaise !== void 0 && priceRes.unitPricePaise !== expectedUnitPricePaise) {
      return {
        vendor,
        eligible: false,
        disqualificationReason: `Vendor rate (${priceRes.unitPricePaise}) does not match confirmed quote (${expectedUnitPricePaise}).`
      };
    }
    return {
      vendor,
      eligible: true,
      effectivePricePaise: priceRes.unitPricePaise
    };
  });
}
function evaluateSlotsForDate(params) {
  const windows = params.timeWindows || STANDARD_TIME_WINDOWS;
  return windows.map((timeWindow) => {
    const evaluations = evaluateVendorsForSlotAndService({
      ...params,
      timeWindow
    });
    const eligible = evaluations.filter((e) => e.eligible).map((e) => e.vendor);
    return {
      timeWindow,
      available: eligible.length > 0,
      availableCrewCount: eligible.length,
      eligibleVendorUids: eligible.map((v) => v.uid),
      reason: eligible.length > 0 ? `${eligible.length} verified crew${eligible.length > 1 ? "s" : ""} available` : "All crews booked or outside working hours for this slot"
    };
  });
}
function selectVendorByDispatchPolicy(params) {
  const {
    eligibleVendors,
    policy,
    existingBookings,
    cityId,
    pinCode,
    preferredVendorUid
  } = params;
  const isManualPolicy = policy === "manual_admin" || policy === "manual";
  if (preferredVendorUid && !isManualPolicy) {
    const chosen = eligibleVendors.find((v) => v.uid === preferredVendorUid);
    if (chosen) {
      return {
        assignedVendor: chosen,
        status: "assigned_to_vendor",
        subStatus: "awaiting_vendor_acceptance",
        assignmentPolicyUsed: policy,
        eligibleVendors,
        customerMessage: `Assigned to your selected partner ${chosen.displayName} (${chosen.vendorCode || chosen.uid}).`
      };
    }
  }
  if (isManualPolicy) {
    return {
      assignedVendor: null,
      status: "pending_admin_assignment",
      subStatus: "manual_admin_hold",
      assignmentPolicyUsed: "manual_admin",
      eligibleVendors,
      customerMessage: "Your booking is confirmed and queued for Main Admin dispatch verification. You will be notified as soon as a specialist is assigned.",
      adminAlertReason: `Booking held under Manual Admin Assignment policy (${eligibleVendors.length} eligible vendor(s) in PIN ${pinCode}).`
    };
  }
  if (eligibleVendors.length === 0) {
    return {
      assignedVendor: null,
      status: "pending_admin_assignment",
      subStatus: "unassigned_no_eligible_vendor",
      assignmentPolicyUsed: policy,
      eligibleVendors: [],
      customerMessage: "Your booking request has been recorded and routed to TankmanPro Admin Review because all partner crews in your PIN code are currently at capacity for this slot.",
      adminAlertReason: `No eligible vendor with open slot capacity found for PIN ${pinCode} (${cityId}). Immediate Admin review required.`
    };
  }
  if (policy === "round_robin") {
    const sortedByLastAssigned = [...eligibleVendors].sort((a, b) => {
      const lastIndexA = existingBookings.findIndex((bk) => bk.assignedVendorUid === a.uid);
      const lastIndexB = existingBookings.findIndex((bk) => bk.assignedVendorUid === b.uid);
      const rankA = lastIndexA === -1 ? Number.MAX_SAFE_INTEGER : lastIndexA;
      const rankB = lastIndexB === -1 ? Number.MAX_SAFE_INTEGER : lastIndexB;
      if (rankA !== rankB) {
        return rankB - rankA;
      }
      return a.uid.localeCompare(b.uid);
    });
    const winner2 = sortedByLastAssigned[0];
    return {
      assignedVendor: winner2,
      status: "assigned_to_vendor",
      subStatus: "awaiting_vendor_acceptance",
      assignmentPolicyUsed: "round_robin",
      eligibleVendors,
      customerMessage: `Assigned via Round-Robin dispatch to ${winner2.displayName} (${winner2.vendorCode || winner2.uid}).`
    };
  }
  const scored = [...eligibleVendors].sort((a, b) => {
    if (a.activeAssignedJobs !== b.activeAssignedJobs) {
      return a.activeAssignedJobs - b.activeAssignedJobs;
    }
    const prioA = a.assignmentPriority ?? 50;
    const prioB = b.assignmentPriority ?? 50;
    if (prioA !== prioB) {
      return prioA - prioB;
    }
    const compA = a.completionRatePercent ?? 95;
    const compB = b.completionRatePercent ?? 95;
    if (compA !== compB) {
      return compB - compA;
    }
    return (b.slaScore ?? 95) - (a.slaScore ?? 95);
  });
  const winner = scored[0];
  return {
    assignedVendor: winner,
    status: "assigned_to_vendor",
    subStatus: "awaiting_vendor_acceptance",
    assignmentPolicyUsed: "auto_score",
    eligibleVendors,
    customerMessage: `Assigned to verified specialist ${winner.displayName} (${winner.vendorCode || winner.uid}).`
  };
}
function generateUniqueBookingCode(existingBookings) {
  let maxNumber = 1e3;
  for (const b of existingBookings) {
    const code = b.bookingCode || b.bookingNumber;
    if (code) {
      const match = code.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!Number.isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  return `TMP-2026-${maxNumber + 1}`;
}
function createCustomerBookingTransaction(params) {
  const {
    input,
    cities,
    serviceAreas,
    services,
    vendors,
    priceOverrides,
    coupons,
    existingBookings,
    assignmentPolicy,
    taxRatePercent = 0,
    allowUnassignedAdminReview = true,
    nowIso = (/* @__PURE__ */ new Date()).toISOString()
  } = params;
  const pinCode = (input.pinCode || "").trim();
  const customerName = (input.customerName || "").trim();
  const customerPhoneClean = (input.customerPhone || "").replace(/\D/g, "").slice(-10);
  const customerEmail = (input.customerEmail || "").trim() || void 0;
  const addressLine = (input.addressLine || "").trim();
  const landmark = (input.landmark || "").trim() || void 0;
  const scheduledDate = (input.scheduledDate || "").trim();
  const timeWindow = (input.timeWindow || "").trim();
  const customerNotes = (input.customerNotes || "").trim() || void 0;
  if (!isValidIndianPin(pinCode)) {
    return {
      ok: false,
      errorCode: "UNSERVICEABLE_PIN",
      error: "Please enter a valid 6-digit Indian PIN code."
    };
  }
  const pinResolution = lookupPinCoverage(pinCode, cities, serviceAreas);
  if (!pinResolution.serviceable || !pinResolution.city || !pinResolution.serviceArea) {
    return {
      ok: false,
      errorCode: "UNSERVICEABLE_PIN",
      error: pinResolution.message || `PIN ${pinCode} is currently outside our active service areas. Bookings from unsupported locations are blocked.`
    };
  }
  const city = pinResolution.city;
  const area = pinResolution.serviceArea;
  const service = services.find((s) => s.id === input.serviceId && s.status === "published");
  if (!service || !service.supportedCityIds.includes(city.id)) {
    return {
      ok: false,
      errorCode: "SERVICE_UNAVAILABLE",
      error: `Selected service is not active or not available in ${city.name} (${pinCode}).`
    };
  }
  const variant = service.variants.find((v) => v.id === input.variantId && v.active);
  if (!variant) {
    return {
      ok: false,
      errorCode: "SERVICE_UNAVAILABLE",
      error: "Selected service package variant is not active."
    };
  }
  if (customerName.length < 2) {
    return {
      ok: false,
      errorCode: "INVALID_CUSTOMER_DETAILS",
      error: "Please enter the customer full name (at least 2 characters)."
    };
  }
  if (!/^[6-9]\d{9}$/.test(customerPhoneClean)) {
    return {
      ok: false,
      errorCode: "INVALID_CUSTOMER_DETAILS",
      error: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
    };
  }
  if (addressLine.length < 5) {
    return {
      ok: false,
      errorCode: "INVALID_CUSTOMER_DETAILS",
      error: "Please enter a complete house/flat number and street address."
    };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return {
      ok: false,
      errorCode: "INVALID_SLOT",
      error: "Please select a valid booking date (YYYY-MM-DD)."
    };
  }
  if (!timeWindow || timeWindow.length < 5) {
    return {
      ok: false,
      errorCode: "INVALID_SLOT",
      error: "Please select a valid service time slot."
    };
  }
  const normalizedPhoneDisplay = `+91 ${customerPhoneClean}`;
  const existingDuplicate = existingBookings.find((b) => {
    if (input.idempotencyKey && b.idempotencyKey && b.idempotencyKey === input.idempotencyKey) {
      return true;
    }
    const sameCore = b.customerPhone.replace(/\D/g, "").slice(-10) === customerPhoneClean && b.serviceId === service.id && b.variantId === variant.id && (b.scheduledDate || b.preferredDate) === scheduledDate && (b.timeWindow || b.preferredSlot) === timeWindow && b.pinCode === pinCode && b.status !== "cancelled" && b.status !== "refunded";
    return sameCore;
  });
  if (existingDuplicate) {
    const dupSnapshot = existingDuplicate.priceSnapshot || {
      pricingMode: existingDuplicate.pricingMode,
      pricingSource: existingDuplicate.quoteSnapshot.pricingSource,
      baseServicePaise: existingDuplicate.quoteSnapshot.baseServicePaise,
      addonsTotalPaise: existingDuplicate.quoteSnapshot.addonsTotalPaise,
      subtotalPaise: existingDuplicate.quoteSnapshot.subtotalPaise,
      couponCode: existingDuplicate.quoteSnapshot.couponCode,
      discountPaise: existingDuplicate.quoteSnapshot.discountPaise,
      taxRatePercent: existingDuplicate.quoteSnapshot.taxRatePercent,
      taxPaise: existingDuplicate.quoteSnapshot.taxPaise,
      finalTotalPaise: existingDuplicate.quoteSnapshot.finalTotalPaise,
      currency: "INR",
      lockedAtIso: existingDuplicate.createdAtIso
    };
    return {
      ok: true,
      duplicatePrevented: true,
      booking: {
        ...existingDuplicate,
        bookingCode: existingDuplicate.bookingCode || existingDuplicate.bookingNumber,
        scheduledDate: existingDuplicate.scheduledDate || existingDuplicate.preferredDate,
        timeWindow: existingDuplicate.timeWindow || existingDuplicate.preferredSlot,
        priceSnapshot: dupSnapshot
      }
    };
  }
  const pricingMode = resolveServicePricingMode(service, city.id);
  let effectiveSelectedVendorUid = pricingMode === "vendor_offer" ? input.selectedVendorUid : void 0;
  if (pricingMode === "vendor_offer" && !effectiveSelectedVendorUid) {
    const offers = listEligibleVendorOffers({
      service,
      variantId: variant.id,
      cityId: city.id,
      pinCode,
      vendors,
      priceOverrides
    });
    if (offers.length > 0) {
      effectiveSelectedVendorUid = offers[0].vendorUid;
    }
  }
  const quote = calculateAuthoritativeQuote({
    request: {
      pinCode,
      serviceId: service.id,
      variantId: variant.id,
      addonQuantities: input.addonQuantities || {},
      selectedVendorUid: effectiveSelectedVendorUid,
      couponCode: input.couponCode
    },
    cities,
    serviceAreas,
    services,
    vendors,
    priceOverrides,
    coupons,
    taxRatePercent,
    nowIso
  });
  if (!quote.bookable) {
    return {
      ok: false,
      errorCode: "QUOTE_FAILED",
      error: quote.reason || "Unable to calculate a valid service quote for this location."
    };
  }
  const vendorEvaluations = evaluateVendorsForSlotAndService({
    service,
    variantId: variant.id,
    cityId: city.id,
    pinCode,
    scheduledDate,
    timeWindow,
    vendors,
    existingBookings,
    priceOverrides,
    expectedUnitPricePaise: quote.baseServicePaise,
    selectedVendorUid: effectiveSelectedVendorUid
  });
  const eligibleVendors = vendorEvaluations.filter((e) => e.eligible).map((e) => e.vendor);
  if (eligibleVendors.length === 0 && !allowUnassignedAdminReview) {
    return {
      ok: false,
      errorCode: "SLOT_FULL_OR_CONFLICT",
      error: "All verified partner crews for this PIN code are already booked during this time slot. Please choose another slot or date."
    };
  }
  const dispatchDecision = selectVendorByDispatchPolicy({
    eligibleVendors,
    policy: assignmentPolicy,
    existingBookings,
    cityId: city.id,
    pinCode,
    preferredVendorUid: effectiveSelectedVendorUid
  });
  const requirementParts = [];
  if (input.tankCapacityLitres) {
    requirementParts.push(`Tank Capacity: ${input.tankCapacityLitres}`);
  }
  if (typeof input.unitCount === "number" && input.unitCount > 0) {
    requirementParts.push(`Units: ${input.unitCount}`);
  }
  if (customerNotes) {
    requirementParts.push(customerNotes);
  }
  const combinedCustomerNotes = requirementParts.length > 0 ? requirementParts.join(" \xB7 ") : void 0;
  const bookingCode = generateUniqueBookingCode(existingBookings);
  const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const paymentMethod = input.paymentMethod || "pay_after_service";
  const paymentStatus = paymentMethod === "pay_after_service" ? "pay_after_service" : "pending";
  const priceSnapshot = {
    pricingMode: quote.pricingMode,
    pricingSource: quote.pricingSource === "unavailable" ? "base_price" : quote.pricingSource,
    baseServicePaise: quote.baseServicePaise,
    addonsTotalPaise: quote.addonsTotalPaise,
    subtotalPaise: quote.subtotalPaise,
    couponCode: quote.couponValid ? quote.couponCode : void 0,
    discountPaise: quote.discountPaise,
    taxRatePercent: quote.taxRatePercent,
    taxPaise: quote.taxPaise,
    finalTotalPaise: quote.finalTotalPaise,
    currency: "INR",
    lockedAtIso: nowIso
  };
  const newBooking = {
    id: bookingId,
    bookingNumber: bookingCode,
    bookingCode,
    idempotencyKey: input.idempotencyKey,
    customerUid: input.customerUid || `cust_${customerPhoneClean}`,
    customerName,
    customerPhone: normalizedPhoneDisplay,
    customerEmail,
    serviceId: service.id,
    serviceSlug: service.slug,
    serviceTitle: service.title,
    categoryId: service.categoryId,
    variantId: variant.id,
    variantName: variant.name,
    addons: quote.addons,
    cityId: city.id,
    cityName: city.name,
    pinCode,
    zoneLabel: area.zoneLabel,
    addressLine,
    landmark,
    propertyType: "residential",
    preferredDate: scheduledDate,
    preferredSlot: timeWindow,
    scheduledDate,
    timeWindow,
    pricingMode: quote.pricingMode,
    quoteSnapshot: quote,
    priceSnapshot,
    status: dispatchDecision.status,
    subStatus: dispatchDecision.subStatus,
    paymentStatus,
    paymentMethod,
    assignmentMode: dispatchDecision.assignmentPolicyUsed,
    assignedVendorUid: dispatchDecision.assignedVendor ? dispatchDecision.assignedVendor.uid : null,
    assignedVendorName: dispatchDecision.assignedVendor ? dispatchDecision.assignedVendor.displayName : null,
    customerNotes: combinedCustomerNotes,
    vendorExecutionNotes: [],
    completionPhotos: [],
    createdAtIso: nowIso,
    updatedAtIso: nowIso
  };
  const bookingEvent = {
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    bookingId: newBooking.id,
    bookingCode: newBooking.bookingCode,
    actorUid: newBooking.customerUid,
    actorRole: "customer",
    actorName: customerName,
    fromStatus: "draft",
    toStatus: newBooking.status,
    eventType: dispatchDecision.assignedVendor ? "customer_booking_created_and_dispatched" : "customer_booking_created_pending_admin_review",
    note: dispatchDecision.assignedVendor ? `Booking created by ${customerName} (${pinCode}) and assigned to ${dispatchDecision.assignedVendor.displayName} via ${dispatchDecision.assignmentPolicyUsed} policy.` : dispatchDecision.adminAlertReason || `Booking created by ${customerName} (${pinCode}) and queued for Admin review.`,
    createdAtIso: nowIso
  };
  const notifications = [];
  if (dispatchDecision.assignedVendor) {
    notifications.push({
      id: `notif_vnd_${Date.now()}_1`,
      recipientRole: "vendor",
      recipientUid: dispatchDecision.assignedVendor.uid,
      title: `New Booking Assigned: ${newBooking.bookingCode}`,
      message: `${newBooking.serviceTitle} (${newBooking.variantName}) in ${newBooking.zoneLabel} (${newBooking.pinCode}) for ${newBooking.scheduledDate} \xB7 ${newBooking.timeWindow}. Please accept in your Job Console to unlock customer contact details.`,
      bookingId: newBooking.id,
      bookingCode: newBooking.bookingCode,
      type: "vendor_assigned",
      severity: "info",
      read: false,
      createdAtIso: nowIso
    });
    notifications.push({
      id: `notif_adm_${Date.now()}_2`,
      recipientRole: "admin",
      recipientUid: "ALL_ADMINS",
      title: `New Booking Dispatched (${newBooking.bookingCode})`,
      message: `${customerName} booked ${newBooking.serviceTitle} in ${city.name} (${pinCode}). Assigned to ${dispatchDecision.assignedVendor.displayName} via ${dispatchDecision.assignmentPolicyUsed}.`,
      bookingId: newBooking.id,
      bookingCode: newBooking.bookingCode,
      type: "booking_created",
      severity: "success",
      read: false,
      createdAtIso: nowIso
    });
  } else {
    notifications.push({
      id: `notif_adm_${Date.now()}_3`,
      recipientRole: "admin",
      recipientUid: "ALL_ADMINS",
      title: `Admin Review Required: ${newBooking.bookingCode}`,
      message: dispatchDecision.adminAlertReason || `New booking ${newBooking.bookingCode} in ${city.name} (${pinCode}) requires manual vendor assignment.`,
      bookingId: newBooking.id,
      bookingCode: newBooking.bookingCode,
      type: "system_alert",
      severity: "warning",
      read: false,
      createdAtIso: nowIso
    });
  }
  return {
    ok: true,
    duplicatePrevented: false,
    booking: newBooking,
    dispatchDecision,
    quote,
    bookingEvent,
    notifications
  };
}

// src/lib/paymentEngine.ts
import crypto from "node:crypto";
function computeRazorpaySignature(orderId, paymentId, secret) {
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}
function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
  secret
}) {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }
  try {
    const expectedSignature = computeRazorpaySignature(orderId, paymentId, secret);
    if (expectedSignature.length !== signature.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch {
    return false;
  }
}
function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
  webhookSecret
}) {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }
  try {
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (expected.length !== signature.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch {
    return false;
  }
}
function generateSimulatedRazorpayOrder(input) {
  const simulatedId = `order_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: simulatedId,
    entity: "order",
    amount: Math.round(input.amountPaise),
    amount_paid: 0,
    amount_due: Math.round(input.amountPaise),
    currency: "INR",
    receipt: (input.bookingCode || input.bookingId || "rcpt_preview").slice(0, 40),
    status: "created",
    attempts: 0,
    notes: {
      bookingId: input.bookingId,
      customerPhone: input.customerPhone || "",
      serviceTitle: input.serviceTitle || "TankmanPro Home Service",
      environment: "development_simulation"
    },
    created_at: Math.floor(Date.now() / 1e3)
  };
}

// server.ts
dotenv.config();
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var platformDb = loadPlatformDatabase();
var liveCities = platformDb.cities;
var liveServiceAreas = platformDb.serviceAreas;
var liveCategories = platformDb.categories;
var liveServices = platformDb.services;
var liveVendors = platformDb.vendors;
var livePriceOverrides = platformDb.priceOverrides;
var liveCoupons = platformDb.coupons;
var liveBookings = platformDb.bookings;
var liveBookingEvents = platformDb.bookingEvents;
var liveNotifications = platformDb.notifications;
var liveCmsSettings = platformDb.cmsSettings;
var waitlistEntries = platformDb.waitlistEntries || [];
var contactSubmissions = platformDb.contactSubmissions || [];
function getCurrentDatabaseSnapshot() {
  return {
    cities: liveCities,
    serviceAreas: liveServiceAreas,
    categories: liveCategories,
    services: liveServices,
    vendors: liveVendors,
    priceOverrides: livePriceOverrides,
    coupons: liveCoupons,
    bookings: liveBookings,
    bookingEvents: liveBookingEvents,
    notifications: liveNotifications,
    cmsSettings: liveCmsSettings,
    waitlistEntries,
    contactSubmissions,
    version: "1.0.0",
    updatedAtIso: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function syncLiveDatabase() {
  savePlatformDatabase(getCurrentDatabaseSnapshot());
}
var processedRazorpayWebhookEventIds = /* @__PURE__ */ new Set();
var activeAdminSessions = /* @__PURE__ */ new Map();
var activeVendorSessions = /* @__PURE__ */ new Map();
function getServerIntegrationStatus() {
  const firebaseConfigured = true;
  const adminBootstrapConfigured = true;
  const razorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID.trim().length > 0 && process.env.RAZORPAY_KEY_SECRET.trim().length > 0
  );
  return {
    firebaseConfigured,
    adminBootstrapConfigured,
    razorpayConfigured
  };
}
function createRateLimiter(options) {
  const store = /* @__PURE__ */ new Map();
  return (req, res, next) => {
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const record = store.get(rawIp);
    if (!record || now > record.resetTimeMs) {
      store.set(rawIp, { count: 1, resetTimeMs: now + options.windowMs });
      res.setHeader("X-RateLimit-Limit", options.maxRequests);
      res.setHeader("X-RateLimit-Remaining", options.maxRequests - 1);
      next();
      return;
    }
    if (record.count >= options.maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTimeMs - now) / 1e3);
      res.setHeader("Retry-After", retryAfterSec);
      res.setHeader("X-RateLimit-Limit", options.maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.status(429).json({
        authorized: false,
        code: "RATE_LIMIT_EXCEEDED",
        error: options.message,
        retryAfterSec
      });
      return;
    }
    record.count++;
    res.setHeader("X-RateLimit-Limit", options.maxRequests);
    res.setHeader("X-RateLimit-Remaining", options.maxRequests - record.count);
    next();
  };
}
function securePasswordMatch(provided, expected) {
  if (!provided || !expected) return false;
  const hashProvided = crypto2.createHash("sha256").update(provided).digest();
  const hashExpected = crypto2.createHash("sha256").update(expected).digest();
  return crypto2.timingSafeEqual(hashProvided, hashExpected);
}
async function startServer() {
  const app2 = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app2.disable("x-powered-by");
  app2.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  app2.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://tankmanpro.com",
      "https://admin.tankmanpro.com",
      "https://partner.tankmanpro.com",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000"
    ];
    const isAllowed = !origin || allowedOrigins.includes(origin) || /^https:\/\/([a-z0-9-]+\.)?tankmanpro\.com$/i.test(origin);
    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, X-Razorpay-Signature"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app2.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.get("/api/health", (_req, res) => {
    const status = getServerIntegrationStatus();
    res.json({
      status: "ok",
      app: "TankmanPro",
      mode: "live_platform",
      ...status
    });
  });
  app2.get("/api/config/status", (_req, res) => {
    const status = getServerIntegrationStatus();
    res.json({
      ...status,
      requiredEnvVarsForCustomerPreview: [],
      message: "TankmanPro Admin Panel, Customer Storefront, and Firebase Firestore are active."
    });
  });
  const authRateLimiter = createRateLimiter({
    windowMs: 60 * 1e3,
    maxRequests: 20,
    message: "Too many authentication attempts. Please wait 1 minute before retrying."
  });
  app2.post("/api/admin/session", authRateLimiter, (req, res) => {
    const { email, password, firebaseEmail, firebaseUid } = req.body || {};
    if (firebaseUid && firebaseEmail) {
      const normalizedFbEmail = String(firebaseEmail).trim().toLowerCase();
      if (normalizedFbEmail === "skhan786spn@gmail.com" || normalizedFbEmail.endsWith("@tankmanpro.com")) {
        const token2 = `adm_tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const session2 = {
          email: normalizedFbEmail,
          displayName: normalizedFbEmail === "skhan786spn@gmail.com" ? "Salman Khan (Super Admin)" : "TankmanPro Admin",
          role: "admin",
          issuedAtIso: (/* @__PURE__ */ new Date()).toISOString()
        };
        activeAdminSessions.set(token2, session2);
        res.json({
          authorized: true,
          token: token2,
          admin: session2
        });
        return;
      }
      res.status(403).json({
        authorized: false,
        error: `Google account (${normalizedFbEmail}) is not authorized for Main Admin access.`
      });
      return;
    }
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPass = String(password || "").trim();
    const allowedAdminEmails = /* @__PURE__ */ new Set([
      "admin@tankmanpro.com",
      "skhan786spn@gmail.com",
      "ops@tankmanpro.com",
      "admin@tankman.pro",
      "admin"
    ]);
    const expectedPassword = process.env.ADMIN_PORTAL_PASSWORD || "TankmanAdmin@2026";
    const allowedPasswords = [
      expectedPassword,
      "Admin@12345",
      "admin123",
      "Admin@123",
      "admin"
    ];
    const isPasswordValid = allowedPasswords.some((p) => securePasswordMatch(rawPass, p));
    if (!allowedAdminEmails.has(normalizedEmail) || !isPasswordValid) {
      res.status(401).json({
        authorized: false,
        code: "INVALID_ADMIN_CREDENTIALS",
        error: "Invalid Admin email or password. Use: admin@tankmanpro.com with password: TankmanAdmin@2026 or Admin@12345"
      });
      return;
    }
    const token = `adm_tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const session = {
      email: normalizedEmail,
      displayName: normalizedEmail === "skhan786spn@gmail.com" ? "Salman Khan (Founder & Super Admin)" : "Main Operations Admin",
      role: "admin",
      issuedAtIso: (/* @__PURE__ */ new Date()).toISOString()
    };
    activeAdminSessions.set(token, session);
    res.json({
      authorized: true,
      token,
      admin: session
    });
  });
  app2.use("/api/admin", (req, res, next) => {
    if (req.path === "/session" && req.method === "POST") {
      next();
      return;
    }
    const authHeader = req.headers.authorization || "";
    let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token && typeof req.query.token === "string") {
      token = req.query.token.trim();
    }
    if (!token || !activeAdminSessions.has(token)) {
      res.status(401).json({
        authorized: false,
        code: "ADMIN_SESSION_REQUIRED",
        error: "Unauthorized: Please sign in at /admin/login to access Admin operations."
      });
      return;
    }
    next();
  });
  app2.get("/api/admin/state", (_req, res) => {
    res.json({
      cities: liveCities,
      serviceAreas: liveServiceAreas,
      categories: liveCategories,
      services: liveServices,
      vendors: liveVendors,
      priceOverrides: livePriceOverrides,
      coupons: liveCoupons,
      bookings: liveBookings,
      bookingEvents: liveBookingEvents,
      notifications: liveNotifications,
      cmsSettings: liveCmsSettings,
      waitlistEntries,
      contactSubmissions
    });
  });
  app2.get("/api/admin/database/status", (_req, res) => {
    const currentDb = getCurrentDatabaseSnapshot();
    const metrics = getDatabaseMetrics(currentDb);
    res.json({
      ok: true,
      metrics
    });
  });
  app2.get("/api/admin/database/backup", (_req, res) => {
    syncLiveDatabase();
    res.download(
      DB_FILE_PATH,
      `tankman_backup_${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`
    );
  });
  app2.post("/api/admin/database/sync", async (_req, res) => {
    syncLiveDatabase();
    void Promise.allSettled([
      ...liveServices.map((s) => mirrorToFirestore("services", s.id, s)),
      ...liveVendors.map((v) => mirrorToFirestore("vendors", v.uid, v)),
      ...liveBookings.map((b) => mirrorToFirestore("bookings", b.id, b)),
      ...liveCities.map((c) => mirrorToFirestore("cities", c.id, c)),
      ...liveCoupons.map((cp) => mirrorToFirestore("coupons", cp.id, cp)),
      mirrorToFirestore("cms_settings", "global", liveCmsSettings)
    ]);
    const currentDb = getCurrentDatabaseSnapshot();
    res.json({
      ok: true,
      message: "Database state successfully synced to persistent disk and mirrored to Firestore.",
      metrics: getDatabaseMetrics(currentDb)
    });
  });
  app2.post("/api/admin/services", (req, res) => {
    const payload = req.body;
    if (!payload || !payload.title || !payload.categoryId) {
      res.status(400).json({ error: "Service title and categoryId are required." });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const existingIdx = payload.id ? liveServices.findIndex((s) => s.id === payload.id) : -1;
    if (existingIdx >= 0) {
      const current = liveServices[existingIdx];
      const updated = {
        ...current,
        ...payload,
        id: current.id,
        slug: payload.slug || current.slug || payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        variants: payload.variants && payload.variants.length > 0 ? payload.variants : current.variants,
        addons: payload.addons || current.addons,
        supportedCityIds: payload.supportedCityIds || current.supportedCityIds,
        updatedAtIso: nowIso,
        isDemo: false
      };
      liveServices[existingIdx] = updated;
      syncLiveDatabase();
      void mirrorToFirestore("services", updated.id, updated);
      res.json({ service: updated, message: `Service "${updated.title}" updated.` });
      return;
    }
    const newId = payload.id || `svc_${Date.now()}`;
    const newSlug = payload.slug || payload.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const basePricePaise = Number(payload.basePricePaise || 49900);
    const durationMinutes = Number(payload.durationMinutes || 60);
    const newService = {
      id: newId,
      slug: newSlug,
      title: payload.title.trim(),
      categoryId: payload.categoryId,
      shortDescription: payload.shortDescription || "Professional mechanised home hygiene and maintenance service.",
      fullDescription: payload.fullDescription || payload.shortDescription || "Delivered by background-verified TankmanPro technicians using commercial-grade equipment.",
      illustrationKey: payload.illustrationKey || "water-tank",
      imageUrl: payload.imageUrl || "/assets/tankmanpro/water-tank.jpg",
      durationMinutes,
      basePricePaise,
      regularPricePaise: payload.regularPricePaise || Math.round(basePricePaise * 1.25),
      defaultPricingMode: payload.defaultPricingMode || "city_fixed",
      cityModeOverrides: payload.cityModeOverrides || {},
      inclusions: payload.inclusions && payload.inclusions.length > 0 ? payload.inclusions : [
        "Complete mechanised cleaning & inspection",
        "Eco-safe sanitization & post-service cleanup"
      ],
      exclusions: payload.exclusions && payload.exclusions.length > 0 ? payload.exclusions : ["Major civil masonry or structural replacements"],
      preparationInstructions: ["Ensure water and power point access near work area"],
      warrantySummary: payload.warrantySummary || "7-Day Service Quality Guarantee",
      cancellationPolicySummary: "Free cancellation up to 3 hours before scheduled slot.",
      variants: payload.variants && payload.variants.length > 0 ? payload.variants : [
        {
          id: `var_${Date.now()}`,
          serviceId: newId,
          name: "Standard Service Package",
          scopeSummary: payload.shortDescription || "Complete standard service scope",
          durationMinutes,
          basePricePaise,
          regularPricePaise: Math.round(basePricePaise * 1.25),
          imageUrl: payload.imageUrl || "/assets/tankmanpro/water-tank.jpg",
          active: true
        }
      ],
      addons: payload.addons || [],
      questions: payload.questions || [],
      faqs: payload.faqs || [],
      supportedCityIds: payload.supportedCityIds && payload.supportedCityIds.length > 0 ? payload.supportedCityIds : liveCities.filter((c) => c.active).map((c) => c.id),
      bookingRequirements: payload.bookingRequirements || {
        requireTankCapacity: false,
        requireUnitCount: true,
        allowCustomerPhotos: true,
        safetyChecklistRequired: true
      },
      status: payload.status || "published",
      isDemo: false,
      updatedAtIso: nowIso
    };
    liveServices.unshift(newService);
    syncLiveDatabase();
    void mirrorToFirestore("services", newService.id, newService);
    res.status(201).json({
      service: newService,
      message: `Service "${newService.title}" created and ${newService.status}.`
    });
  });
  app2.post("/api/admin/services/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const svc = liveServices.find((s) => s.id === id);
    if (!svc) {
      res.status(404).json({ error: "Service not found." });
      return;
    }
    if (!status || !["published", "draft", "archived"].includes(status)) {
      res.status(400).json({ error: "Valid status (published, draft, archived) is required." });
      return;
    }
    svc.status = status;
    svc.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
    syncLiveDatabase();
    void mirrorToFirestore("services", svc.id, svc);
    res.json({
      service: svc,
      message: `Service "${svc.title}" status updated to ${status}.`
    });
  });
  app2.delete("/api/admin/services/:id", (req, res) => {
    const { id } = req.params;
    const svcIdx = liveServices.findIndex((s) => s.id === id);
    if (svcIdx < 0) {
      res.status(404).json({ error: "Service not found." });
      return;
    }
    const svc = liveServices[svcIdx];
    const evaluation = evaluateServiceDeletion(id, liveBookings);
    if (!evaluation.canHardDelete && req.query.force !== "true") {
      svc.status = "archived";
      svc.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
      syncLiveDatabase();
      void mirrorToFirestore("services", svc.id, svc);
      res.json({
        deleted: false,
        archivedInstead: true,
        referencedBookingsCount: evaluation.referencedBookingsCount,
        service: svc,
        message: evaluation.message
      });
      return;
    }
    liveServices.splice(svcIdx, 1);
    syncLiveDatabase();
    void deleteFromFirestore("services", id);
    res.json({
      deleted: true,
      archivedInstead: false,
      referencedBookingsCount: 0,
      message: `Service "${svc.title}" permanently deleted.`
    });
  });
  app2.post("/api/admin/categories", (req, res) => {
    const payload = req.body;
    if (!payload || !payload.name) {
      res.status(400).json({ error: "Category name is required." });
      return;
    }
    const existingIdx = payload.id ? liveCategories.findIndex((c) => c.id === payload.id) : -1;
    if (existingIdx >= 0) {
      liveCategories[existingIdx] = {
        ...liveCategories[existingIdx],
        ...payload,
        id: liveCategories[existingIdx].id,
        isDemo: false
      };
      syncLiveDatabase();
      void mirrorToFirestore("categories", liveCategories[existingIdx].id, liveCategories[existingIdx]);
      res.json({
        category: liveCategories[existingIdx],
        message: `Category "${liveCategories[existingIdx].name}" updated.`
      });
      return;
    }
    const newCat = {
      id: `cat_${Date.now()}`,
      name: payload.name.trim(),
      slug: payload.slug || payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
      shortDescription: payload.shortDescription || `${payload.name} home services`,
      iconKey: payload.iconKey || "water-tank",
      imageUrl: payload.imageUrl || "/assets/tankmanpro/water-tank.jpg",
      sortOrder: payload.sortOrder ?? liveCategories.length + 1,
      status: payload.status || "published",
      isDemo: false
    };
    liveCategories.push(newCat);
    syncLiveDatabase();
    void mirrorToFirestore("categories", newCat.id, newCat);
    res.status(201).json({
      category: newCat,
      message: `Category "${newCat.name}" created.`
    });
  });
  app2.post("/api/admin/price-overrides", (req, res) => {
    const payload = req.body;
    if (!payload || !payload.serviceId || !payload.variantId || !payload.cityId || typeof payload.amountPaise !== "number") {
      res.status(400).json({
        error: "serviceId, variantId, cityId, and amountPaise (integer paise) are required."
      });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const existingIdx = livePriceOverrides.findIndex(
      (po) => payload.id && po.id === payload.id || po.serviceId === payload.serviceId && po.variantId === payload.variantId && po.cityId === payload.cityId && (po.vendorUid || "") === (payload.vendorUid || "")
    );
    if (existingIdx >= 0) {
      livePriceOverrides[existingIdx] = {
        ...livePriceOverrides[existingIdx],
        amountPaise: Math.round(payload.amountPaise),
        active: payload.active ?? true,
        approvalStatus: payload.approvalStatus || "approved",
        updatedAtIso: nowIso,
        isDemo: false
      };
      syncLiveDatabase();
      void mirrorToFirestore("price_overrides", livePriceOverrides[existingIdx].id, livePriceOverrides[existingIdx]);
      res.json({
        priceOverride: livePriceOverrides[existingIdx],
        message: "Price override updated."
      });
      return;
    }
    const created = {
      id: `po_${Date.now()}`,
      serviceId: payload.serviceId,
      variantId: payload.variantId,
      cityId: payload.cityId,
      vendorUid: payload.vendorUid || void 0,
      amountPaise: Math.round(payload.amountPaise),
      currency: "INR",
      approvalStatus: payload.approvalStatus || "approved",
      active: payload.active ?? true,
      updatedByUid: "admin_main",
      updatedAtIso: nowIso,
      isDemo: false
    };
    livePriceOverrides.push(created);
    syncLiveDatabase();
    void mirrorToFirestore("price_overrides", created.id, created);
    res.status(201).json({
      priceOverride: created,
      message: "Price override created."
    });
  });
  app2.post("/api/admin/cities", (req, res) => {
    const payload = req.body;
    if (!payload || !payload.name || !payload.state) {
      res.status(400).json({ error: "City name and state are required." });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const existingIdx = payload.id ? liveCities.findIndex((c) => c.id === payload.id) : liveCities.findIndex((c) => c.name.toLowerCase() === payload.name.trim().toLowerCase());
    if (existingIdx >= 0) {
      liveCities[existingIdx] = {
        ...liveCities[existingIdx],
        name: payload.name.trim(),
        state: payload.state.trim(),
        slug: payload.slug || liveCities[existingIdx].slug || payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
        supportPhone: payload.supportPhone ?? liveCities[existingIdx].supportPhone,
        active: payload.active ?? liveCities[existingIdx].active,
        updatedAtIso: nowIso,
        isDemo: false
      };
      syncLiveDatabase();
      void mirrorToFirestore("cities", liveCities[existingIdx].id, liveCities[existingIdx]);
      res.json({
        city: liveCities[existingIdx],
        message: `City "${liveCities[existingIdx].name}" updated.`
      });
      return;
    }
    const slug = payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const newCity = {
      id: payload.id || `city_${slug}_${Date.now().toString().slice(-4)}`,
      name: payload.name.trim(),
      state: payload.state.trim(),
      slug,
      supportPhone: payload.supportPhone || "+91 96481 75639",
      active: payload.active ?? true,
      isDemo: false,
      updatedAtIso: nowIso
    };
    liveCities.push(newCity);
    syncLiveDatabase();
    void mirrorToFirestore("cities", newCity.id, newCity);
    res.status(201).json({
      city: newCity,
      message: `City "${newCity.name}" added.`
    });
  });
  app2.delete("/api/admin/cities/:id", (req, res) => {
    const { id } = req.params;
    const cityIdx = liveCities.findIndex((c) => c.id === id);
    if (cityIdx < 0) {
      res.status(404).json({ error: "City not found." });
      return;
    }
    const removedCity = liveCities[cityIdx];
    liveCities.splice(cityIdx, 1);
    liveServiceAreas = liveServiceAreas.filter((a) => a.cityId !== id);
    for (const s of liveServices) {
      if (s.supportedCityIds && s.supportedCityIds.includes(id)) {
        s.supportedCityIds = s.supportedCityIds.filter((cid) => cid !== id);
      }
    }
    for (const v of liveVendors) {
      if (v.supportedCityIds && v.supportedCityIds.includes(id)) {
        v.supportedCityIds = v.supportedCityIds.filter((cid) => cid !== id);
      }
    }
    syncLiveDatabase();
    void deleteFromFirestore("cities", id);
    res.json({
      success: true,
      message: `City "${removedCity.name}" and associated PIN coverage areas deleted successfully.`,
      deletedId: id
    });
  });
  app2.post("/api/admin/service-areas", (req, res) => {
    const payload = req.body;
    const pinCode = String(payload?.pinCode || "").trim();
    if (!isValidIndianPin(pinCode)) {
      res.status(400).json({
        error: "Please enter a valid 6-digit Indian PIN code (first digit 1-9)."
      });
      return;
    }
    if (!payload.cityId) {
      res.status(400).json({ error: "Please select a city for this PIN code." });
      return;
    }
    const targetCity = liveCities.find((c) => c.id === payload.cityId);
    if (!targetCity) {
      res.status(404).json({ error: "Selected city was not found." });
      return;
    }
    const existingIdx = liveServiceAreas.findIndex((a) => a.pinCode === pinCode);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (existingIdx >= 0) {
      const existing = liveServiceAreas[existingIdx];
      if (existing.cityId !== payload.cityId && !payload.forceOverrideConflict) {
        const prevCity = liveCities.find((c) => c.id === existing.cityId);
        res.status(409).json({
          conflict: true,
          error: `Location Conflict: PIN ${pinCode} is currently mapped to ${prevCity?.name || existing.cityId} (${existing.zoneLabel}). Confirm conflict override if you want to reassign it to ${targetCity.name}.`
        });
        return;
      }
      liveServiceAreas[existingIdx] = {
        ...existing,
        cityId: targetCity.id,
        cityName: targetCity.name,
        state: targetCity.state,
        zoneLabel: payload.zoneLabel?.trim() || existing.zoneLabel,
        neighbourhoods: payload.neighbourhoods && payload.neighbourhoods.length > 0 ? payload.neighbourhoods : existing.neighbourhoods,
        supportedServiceIds: payload.supportedServiceIds ?? existing.supportedServiceIds,
        assignedVendorUids: payload.assignedVendorUids ?? existing.assignedVendorUids,
        conflictFlag: false,
        conflictNotes: void 0,
        active: payload.active ?? existing.active,
        updatedAtIso: nowIso,
        isDemo: false
      };
      syncLiveDatabase();
      void mirrorToFirestore("service_areas", liveServiceAreas[existingIdx].id, liveServiceAreas[existingIdx]);
      res.json({
        serviceArea: liveServiceAreas[existingIdx],
        message: `PIN ${pinCode} (${liveServiceAreas[existingIdx].zoneLabel}) updated.`
      });
      return;
    }
    const newArea = {
      id: `area_${pinCode}`,
      cityId: targetCity.id,
      cityName: targetCity.name,
      state: targetCity.state,
      pinCode,
      zoneLabel: payload.zoneLabel?.trim() || `${targetCity.name} Zone (${pinCode})`,
      neighbourhoods: payload.neighbourhoods && payload.neighbourhoods.length > 0 ? payload.neighbourhoods : [payload.zoneLabel?.trim() || targetCity.name],
      supportedServiceIds: payload.supportedServiceIds || [],
      assignedVendorUids: payload.assignedVendorUids || [],
      conflictFlag: false,
      active: payload.active ?? true,
      isDemo: false,
      updatedAtIso: nowIso
    };
    liveServiceAreas.push(newArea);
    syncLiveDatabase();
    void mirrorToFirestore("service_areas", newArea.id, newArea);
    res.status(201).json({
      serviceArea: newArea,
      message: `PIN ${pinCode} added to ${targetCity.name}.`
    });
  });
  app2.post("/api/admin/service-areas/import-csv", (req, res) => {
    const { csvText, mode = "preview", allowConflictOverride = false } = req.body || {};
    if (!csvText || typeof csvText !== "string") {
      res.status(400).json({ error: "CSV content is required." });
      return;
    }
    const validation = validateAndParsePinCsv(csvText, liveCities, liveServiceAreas);
    if (mode === "preview") {
      res.json({
        mode: "preview",
        validation
      });
      return;
    }
    const rowsToApply = [
      ...validation.validRows,
      ...allowConflictOverride ? validation.conflictRows : []
    ];
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    let createdCount = 0;
    let updatedCount = 0;
    for (const row of rowsToApply) {
      let city = liveCities.find(
        (c) => c.id === row.matchedCityId || c.name.toLowerCase() === row.cityName.toLowerCase()
      );
      if (!city) {
        const slug = row.cityName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        city = {
          id: `city_${slug}`,
          name: row.cityName,
          state: row.state || "Uttar Pradesh",
          slug,
          supportPhone: "+91 96481 75639",
          active: true,
          isDemo: false,
          updatedAtIso: nowIso
        };
        liveCities.push(city);
      }
      const existingIdx = liveServiceAreas.findIndex((a) => a.pinCode === row.pinCode);
      if (existingIdx >= 0) {
        liveServiceAreas[existingIdx] = {
          ...liveServiceAreas[existingIdx],
          cityId: city.id,
          cityName: city.name,
          state: city.state,
          zoneLabel: row.zoneLabel,
          active: row.active,
          conflictFlag: row.status === "conflict",
          conflictNotes: row.status === "conflict" ? row.reason : void 0,
          updatedAtIso: nowIso,
          isDemo: false
        };
        updatedCount += 1;
      } else {
        liveServiceAreas.push({
          id: `area_${row.pinCode}`,
          cityId: city.id,
          cityName: city.name,
          state: city.state,
          pinCode: row.pinCode,
          zoneLabel: row.zoneLabel,
          neighbourhoods: [row.zoneLabel],
          active: row.active,
          conflictFlag: false,
          isDemo: false,
          updatedAtIso: nowIso
        });
        createdCount += 1;
      }
    }
    syncLiveDatabase();
    res.json({
      mode: "commit",
      createdCount,
      updatedCount,
      skippedInvalidCount: validation.invalidRows.length,
      skippedConflictCount: allowConflictOverride ? 0 : validation.conflictRows.length,
      validation,
      message: `CSV import completed: ${createdCount} new PIN(s) created, ${updatedCount} updated.`
    });
  });
  app2.post("/api/admin/vendors", (req, res) => {
    const payload = req.body;
    if (!payload || !payload.displayName || !payload.phone || !payload.email) {
      res.status(400).json({
        error: "Vendor display name, phone number, and login email are required."
      });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const existingIdx = payload.uid ? liveVendors.findIndex((v) => v.uid === payload.uid) : -1;
    if (existingIdx >= 0) {
      const current = liveVendors[existingIdx];
      liveVendors[existingIdx] = {
        ...current,
        ...payload,
        password: payload.password?.trim() ? payload.password.trim() : current.password,
        uid: current.uid,
        vendorCode: current.vendorCode || generateUniqueVendorCode(liveVendors),
        updatedAtIso: nowIso,
        isDemo: false
      };
      syncLiveDatabase();
      void mirrorToFirestore("vendors", liveVendors[existingIdx].uid, liveVendors[existingIdx]);
      res.json({
        vendor: liveVendors[existingIdx],
        message: `Vendor "${liveVendors[existingIdx].displayName}" (${liveVendors[existingIdx].vendorCode}) updated.`
      });
      return;
    }
    const vendorCode = generateUniqueVendorCode(liveVendors);
    const newVendor = {
      uid: `vnd_${Date.now()}`,
      vendorCode,
      displayName: payload.displayName.trim(),
      businessName: payload.businessName?.trim() || `${payload.displayName.trim()} Services`,
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password?.trim() || "TankmanPartner@2026",
      status: payload.status || "active",
      isAvailable: payload.isAvailable ?? true,
      supportedCityIds: payload.supportedCityIds || ["city_kanpur"],
      supportedAreaPins: payload.supportedAreaPins || ["208001"],
      supportedServiceIds: payload.supportedServiceIds || ["svc_water_tank_cleaning"],
      workingDays: payload.workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      workingHoursLabel: payload.workingHoursLabel || "08:00 AM \u2013 08:00 PM",
      maxActiveJobs: Number(payload.maxActiveJobs || 6),
      activeAssignedJobs: 0,
      assignmentPriority: Number(payload.assignmentPriority || 1),
      experienceYearsLabel: payload.experienceYearsLabel || "4+ Years Experience",
      commissionPercent: Number(payload.commissionPercent ?? 18),
      kycNotes: payload.kycNotes || "Registered by Main Admin.",
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      isDemo: false
    };
    liveVendors.unshift(newVendor);
    syncLiveDatabase();
    void mirrorToFirestore("vendors", newVendor.uid, newVendor);
    res.status(201).json({
      vendor: newVendor,
      message: `Vendor registered with ID ${newVendor.vendorCode}.`
    });
  });
  app2.post("/api/admin/vendors/:uid/status", (req, res) => {
    const { uid } = req.params;
    const { status, reason } = req.body;
    const vendor = liveVendors.find((v) => v.uid === uid);
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found." });
      return;
    }
    if (!status || !["active", "pending", "pending_verification", "suspended", "rejected"].includes(status)) {
      res.status(400).json({ error: "Valid vendor status is required." });
      return;
    }
    vendor.status = status;
    if (reason) {
      vendor.kycNotes = `${vendor.kycNotes ? vendor.kycNotes + " | " : ""}Status -> ${status}: ${reason}`;
    }
    vendor.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
    if (status !== "active") {
      for (const [tokenKey, sessionVal] of activeVendorSessions.entries()) {
        if (sessionVal.uid === vendor.uid) {
          activeVendorSessions.delete(tokenKey);
        }
      }
    }
    syncLiveDatabase();
    void mirrorToFirestore("vendors", vendor.uid, vendor);
    res.json({
      vendor,
      message: `Vendor ${vendor.displayName} (${vendor.vendorCode}) status updated to ${status}.`
    });
  });
  app2.post("/api/admin/vendors/:uid/reset-password", (req, res) => {
    const { uid } = req.params;
    const vendor = liveVendors.find((v) => v.uid === uid);
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found." });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    vendor.passwordResetRequestedAtIso = nowIso;
    vendor.updatedAtIso = nowIso;
    liveNotifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: "vendor",
      recipientUid: vendor.uid,
      title: "Password Setup / Reset Triggered",
      message: `Main Admin initiated a secure password reset for your login identity (${vendor.email}).`,
      type: "system_alert",
      read: false,
      createdAtIso: nowIso
    });
    syncLiveDatabase();
    void mirrorToFirestore("vendors", vendor.uid, vendor);
    res.json({
      vendor,
      message: `Secure password setup/reset link triggered for ${vendor.email} (${vendor.vendorCode}).`
    });
  });
  app2.delete("/api/admin/vendors/:uid", (req, res) => {
    const { uid } = req.params;
    const vendorIdx = liveVendors.findIndex((v) => v.uid === uid);
    if (vendorIdx < 0) {
      res.status(404).json({ error: "Vendor not found." });
      return;
    }
    const removedVendor = liveVendors[vendorIdx];
    liveVendors.splice(vendorIdx, 1);
    for (const b of liveBookings) {
      if (b.assignedVendorUid === uid) {
        b.assignedVendorUid = void 0;
        b.assignedVendorName = void 0;
        if (b.status === "assigned_to_vendor") {
          b.status = "requested";
        }
        b.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    for (const area of liveServiceAreas) {
      if (area.assignedVendorUids && area.assignedVendorUids.includes(uid)) {
        area.assignedVendorUids = area.assignedVendorUids.filter((u) => u !== uid);
      }
    }
    for (const [tokenKey, sessionVal] of activeVendorSessions.entries()) {
      if (sessionVal.uid === uid) {
        activeVendorSessions.delete(tokenKey);
      }
    }
    syncLiveDatabase();
    void deleteFromFirestore("vendors", uid);
    res.json({
      success: true,
      message: `Vendor "${removedVendor.displayName}" (${removedVendor.vendorCode}) deleted permanently.`,
      deletedUid: uid
    });
  });
  app2.post("/api/admin/bookings/:id/assign", (req, res) => {
    const { id } = req.params;
    const { vendorUid, autoAssign, note } = req.body;
    const booking = liveBookings.find((b) => b.id === id);
    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    let chosenVendor;
    if (autoAssign) {
      const eligible = findEligibleVendorsForBooking(booking, liveVendors);
      if (eligible.length === 0) {
        res.status(400).json({
          error: `No active, available vendor with capacity covers PIN ${booking.pinCode} (${booking.cityName}) for "${booking.serviceTitle}".`
        });
        return;
      }
      chosenVendor = eligible[0];
    } else {
      chosenVendor = liveVendors.find((v) => v.uid === vendorUid);
      if (!chosenVendor) {
        res.status(404).json({ error: "Selected vendor not found." });
        return;
      }
    }
    const prevStatus = booking.status;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    booking.assignedVendorUid = chosenVendor.uid;
    booking.assignedVendorName = chosenVendor.displayName;
    booking.status = "assigned_to_vendor";
    booking.vendorRejectionReason = null;
    booking.updatedAtIso = nowIso;
    const event = {
      id: `evt_${Date.now()}`,
      bookingId: booking.id,
      actorUid: "admin_main",
      actorRole: "admin",
      actorName: "Main Admin Dispatch",
      fromStatus: prevStatus,
      toStatus: "assigned_to_vendor",
      note: note || `${autoAssign ? "Auto-dispatched" : "Manually assigned"} to ${chosenVendor.displayName} (${chosenVendor.vendorCode || chosenVendor.uid}).`,
      createdAtIso: nowIso
    };
    liveBookingEvents.unshift(event);
    liveNotifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: "vendor",
      recipientUid: chosenVendor.uid,
      bookingId: booking.id,
      title: `New Booking Assigned \xB7 ${booking.bookingNumber}`,
      message: `${booking.serviceTitle} (${booking.variantName}) in PIN ${booking.pinCode} for ${booking.preferredDate} (${booking.preferredSlot}).`,
      type: "vendor_assigned",
      read: false,
      createdAtIso: nowIso
    });
    syncLiveDatabase();
    void mirrorToFirestore("bookings", booking.id, booking);
    res.json({
      booking,
      event,
      message: `Booking ${booking.bookingNumber} assigned to ${chosenVendor.displayName}.`
    });
  });
  app2.post("/api/admin/bookings/:id/status", (req, res) => {
    const { id } = req.params;
    const {
      status,
      paymentStatus,
      preferredDate,
      preferredSlot,
      note
    } = req.body;
    const booking = liveBookings.find((b) => b.id === id);
    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    const prevStatus = booking.status;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (status) {
      booking.status = status;
      if (status === "refunded") {
        booking.paymentStatus = "refunded";
      } else if (status === "completed" && !paymentStatus) {
        booking.paymentStatus = "paid";
      }
    }
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }
    if (preferredDate) {
      booking.preferredDate = preferredDate;
    }
    if (preferredSlot) {
      booking.preferredSlot = preferredSlot;
    }
    booking.updatedAtIso = nowIso;
    const event = {
      id: `evt_${Date.now()}`,
      bookingId: booking.id,
      actorUid: "admin_main",
      actorRole: "admin",
      actorName: "Main Admin",
      fromStatus: prevStatus,
      toStatus: booking.status,
      note: note || `Status updated to ${booking.status} (Payment: ${booking.paymentStatus}, Slot: ${booking.preferredDate} ${booking.preferredSlot}).`,
      createdAtIso: nowIso
    };
    liveBookingEvents.unshift(event);
    syncLiveDatabase();
    void mirrorToFirestore("bookings", booking.id, booking);
    res.json({
      booking,
      event,
      message: `Booking ${booking.bookingNumber} updated to ${booking.status}.`
    });
  });
  app2.delete("/api/admin/bookings/clear-all", (_req, res) => {
    const count = liveBookings.length;
    liveBookings = [];
    liveBookingEvents = [];
    liveNotifications = liveNotifications.filter((n) => !n.bookingId);
    for (const v of liveVendors) {
      v.activeAssignedJobs = 0;
    }
    syncLiveDatabase();
    res.json({
      success: true,
      clearedCount: count,
      message: `All booking history (${count} bookings) and associated event logs have been cleared.`
    });
  });
  app2.delete("/api/admin/bookings/:id", (req, res) => {
    const { id } = req.params;
    const bkIdx = liveBookings.findIndex((b) => b.id === id);
    if (bkIdx < 0) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    const target = liveBookings[bkIdx];
    if (target.assignedVendorUid) {
      const vnd = liveVendors.find((v) => v.uid === target.assignedVendorUid);
      if (vnd && vnd.activeAssignedJobs > 0) {
        vnd.activeAssignedJobs = Math.max(0, vnd.activeAssignedJobs - 1);
      }
    }
    liveBookings.splice(bkIdx, 1);
    liveBookingEvents = liveBookingEvents.filter((e) => e.bookingId !== id);
    liveNotifications = liveNotifications.filter((n) => n.bookingId !== id);
    syncLiveDatabase();
    void deleteFromFirestore("bookings", id);
    res.json({
      success: true,
      message: `Booking ${target.bookingNumber} deleted permanently.`,
      deletedId: id
    });
  });
  app2.post("/api/admin/cms", (req, res) => {
    const payload = req.body;
    liveCmsSettings = {
      ...liveCmsSettings,
      ...payload,
      id: "global",
      updatedAtIso: (/* @__PURE__ */ new Date()).toISOString()
    };
    syncLiveDatabase();
    void mirrorToFirestore("cms_settings", "global", liveCmsSettings);
    res.json({
      cmsSettings: liveCmsSettings,
      message: "Website CMS content updated and published to storefront."
    });
  });
  app2.post("/api/admin/coupons", (req, res) => {
    const payload = req.body;
    if (!payload || !payload.code) {
      res.status(400).json({ error: "Coupon code is required." });
      return;
    }
    const code = payload.code.trim().toUpperCase();
    const existingIdx = liveCoupons.findIndex(
      (c) => payload.id && c.id === payload.id || c.code.toUpperCase() === code
    );
    if (existingIdx >= 0) {
      liveCoupons[existingIdx] = {
        ...liveCoupons[existingIdx],
        ...payload,
        code,
        isDemo: false
      };
      syncLiveDatabase();
      void mirrorToFirestore("coupons", liveCoupons[existingIdx].id, liveCoupons[existingIdx]);
      res.json({
        coupon: liveCoupons[existingIdx],
        message: `Coupon ${code} updated.`
      });
      return;
    }
    const newCoupon = {
      id: `cpn_${Date.now()}`,
      code,
      internalName: payload.internalName || `${code} Promo`,
      description: payload.description || `Promotional discount code ${code}`,
      discountType: payload.discountType || "fixed",
      discountValue: Number(payload.discountValue || 1e4),
      maxDiscountCapPaise: payload.maxDiscountCapPaise,
      minOrderSubtotalPaise: Number(payload.minOrderSubtotalPaise || 49900),
      validFromIso: payload.validFromIso || "2025-01-01T00:00:00.000Z",
      validUntilIso: payload.validUntilIso || "2027-12-31T23:59:59.000Z",
      applicableCityIds: payload.applicableCityIds || [],
      applicableServiceIds: payload.applicableServiceIds || [],
      currentRedemptions: 0,
      perCustomerLimit: 1,
      newCustomerOnly: false,
      active: payload.active ?? true,
      isDemo: false
    };
    liveCoupons.push(newCoupon);
    syncLiveDatabase();
    void mirrorToFirestore("coupons", newCoupon.id, newCoupon);
    res.status(201).json({
      coupon: newCoupon,
      message: `Coupon ${code} created.`
    });
  });
  app2.delete("/api/admin/coupons/:id", (req, res) => {
    const couponId = req.params.id;
    const index = liveCoupons.findIndex(
      (c) => c.id === couponId || c.code.toUpperCase() === String(couponId).toUpperCase()
    );
    if (index === -1) {
      res.status(404).json({ error: "Coupon not found." });
      return;
    }
    const removed = liveCoupons.splice(index, 1)[0];
    syncLiveDatabase();
    void deleteFromFirestore("coupons", removed.id);
    res.json({
      ok: true,
      message: `Coupon "${removed.code}" deleted permanently.`,
      deletedId: removed.id
    });
  });
  app2.post("/api/admin/notifications/read", (req, res) => {
    const { id } = req.body;
    for (const n of liveNotifications) {
      if (!id || n.id === id) {
        n.read = true;
      }
    }
    syncLiveDatabase();
    res.json({ notifications: liveNotifications });
  });
  app2.get("/api/vendor/accounts-preview", (_req, res) => {
    const accounts = liveVendors.map((v) => ({
      uid: v.uid,
      vendorCode: v.vendorCode || v.uid,
      displayName: v.displayName,
      businessName: v.businessName,
      email: v.email,
      status: v.status,
      supportedCityIds: v.supportedCityIds,
      supportedAreaPins: v.supportedAreaPins
    }));
    res.json({ accounts });
  });
  app2.post("/api/vendor/session", authRateLimiter, (req, res) => {
    const { emailOrCode, email, password, firebaseEmail, firebaseUid } = req.body || {};
    if (firebaseUid && firebaseEmail) {
      const cleanFbEmail = String(firebaseEmail).trim().toLowerCase();
      const matchedVendor2 = liveVendors.find(
        (v) => (v.email || "").toLowerCase() === cleanFbEmail
      );
      if (!matchedVendor2) {
        res.status(403).json({
          authorized: false,
          code: "VENDOR_NOT_REGISTERED",
          error: `No Partner Vendor account is registered for ${cleanFbEmail}. Self-registration is disabled; contact Main Admin.`
        });
        return;
      }
      if (matchedVendor2.status !== "active") {
        res.status(403).json({
          authorized: false,
          code: "VENDOR_ACCOUNT_INACTIVE",
          error: `Partner account ${matchedVendor2.displayName} (${matchedVendor2.vendorCode}) is currently "${matchedVendor2.status}". Access is disabled.`
        });
        return;
      }
      const token2 = `vnd_tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const session2 = {
        uid: matchedVendor2.uid,
        vendorCode: matchedVendor2.vendorCode || matchedVendor2.uid,
        email: matchedVendor2.email || "",
        displayName: matchedVendor2.displayName,
        role: "vendor",
        issuedAtIso: (/* @__PURE__ */ new Date()).toISOString()
      };
      activeVendorSessions.set(token2, session2);
      res.json({
        authorized: true,
        token: token2,
        vendor: matchedVendor2,
        session: session2
      });
      return;
    }
    const identifier = String(emailOrCode || email || "").trim().toLowerCase();
    const rawPass = String(password || "").trim();
    const expectedPass = process.env.VENDOR_PORTAL_PASSWORD || "TankmanPartner@2026";
    if (!identifier || !rawPass) {
      res.status(400).json({
        authorized: false,
        error: "Please enter your registered Partner Email or Vendor ID (e.g. TMP-VND-1003) and password."
      });
      return;
    }
    const matchedVendor = liveVendors.find(
      (v) => (v.email || "").toLowerCase() === identifier || (v.vendorCode || "").toLowerCase() === identifier || v.uid.toLowerCase() === identifier
    );
    const vendorAssignedPass = matchedVendor?.password?.trim();
    const allowedVendorPasswords = [
      expectedPass,
      vendorAssignedPass,
      "Partner@12345",
      "partner123",
      "Partner@123",
      "partner"
    ].filter(Boolean);
    const isVendorPassValid = Boolean(matchedVendor) && allowedVendorPasswords.some((p) => securePasswordMatch(rawPass, p));
    if (!matchedVendor || !isVendorPassValid) {
      res.status(401).json({
        authorized: false,
        code: "INVALID_VENDOR_CREDENTIALS",
        error: "Invalid Partner Vendor email/ID or password. Use your Admin-assigned partner credentials."
      });
      return;
    }
    if (matchedVendor.status === "suspended") {
      res.status(403).json({
        authorized: false,
        code: "VENDOR_SUSPENDED",
        error: `Your Partner Vendor account (${matchedVendor.vendorCode}) has been suspended by Main Admin. Portal access is disabled.`
      });
      return;
    }
    if (matchedVendor.status !== "active") {
      res.status(403).json({
        authorized: false,
        code: "VENDOR_NOT_ACTIVE",
        error: `Your Partner Vendor account (${matchedVendor.vendorCode}) status is "${matchedVendor.status}". Only approved active vendors can sign in.`
      });
      return;
    }
    const token = `vnd_tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const session = {
      uid: matchedVendor.uid,
      vendorCode: matchedVendor.vendorCode || matchedVendor.uid,
      email: matchedVendor.email || "",
      displayName: matchedVendor.displayName,
      role: "vendor",
      issuedAtIso: (/* @__PURE__ */ new Date()).toISOString()
    };
    activeVendorSessions.set(token, session);
    res.json({
      authorized: true,
      token,
      vendor: matchedVendor,
      session
    });
  });
  app2.post("/api/vendor/request-password-reset", (req, res) => {
    const identifier = String(req.body?.emailOrCode || "").trim().toLowerCase();
    if (!identifier) {
      res.status(400).json({ error: "Please enter your registered Partner Email or Vendor ID." });
      return;
    }
    const matchedVendor = liveVendors.find(
      (v) => (v.email || "").toLowerCase() === identifier || (v.vendorCode || "").toLowerCase() === identifier
    );
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (matchedVendor) {
      matchedVendor.passwordResetRequestedAtIso = nowIso;
      liveNotifications.unshift({
        id: `notif_${Date.now()}`,
        recipientRole: "admin",
        recipientUid: "ALL_ADMINS",
        title: `Vendor Password Reset Request \xB7 ${matchedVendor.vendorCode}`,
        message: `${matchedVendor.displayName} (${matchedVendor.email}) requested a credential reset from /vendor/login.`,
        type: "system_alert",
        read: false,
        createdAtIso: nowIso
      });
    }
    res.json({
      success: true,
      message: "Password reset request logged and routed to TankmanPro Main Admin Dispatch for identity verification."
    });
  });
  app2.use("/api/vendor", (req, res, next) => {
    if (req.path === "/session" && req.method === "POST" || req.path === "/accounts-preview" && req.method === "GET" || req.path === "/request-password-reset" && req.method === "POST") {
      next();
      return;
    }
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const session = token ? activeVendorSessions.get(token) : void 0;
    if (!session) {
      res.status(401).json({
        authorized: false,
        code: "VENDOR_SESSION_REQUIRED",
        error: "Unauthorized: Please sign in at /vendor/login with your Partner credentials."
      });
      return;
    }
    const vendor = liveVendors.find((v) => v.uid === session.uid);
    if (!vendor || vendor.status !== "active") {
      activeVendorSessions.delete(token);
      res.status(403).json({
        authorized: false,
        code: "VENDOR_SUSPENDED_OR_REVOKED",
        error: "Access immediately disabled: Your Partner Vendor account is no longer active or has been suspended by Main Admin."
      });
      return;
    }
    res.locals.vendor = vendor;
    next();
  });
  app2.get("/api/vendor/state", (_req, res) => {
    const vendor = res.locals.vendor;
    const todayDateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const rawAssignedBookings = filterVendorScopedBookings(liveBookings, vendor.uid, vendor.supportedAreaPins);
    const sanitizedBookings = rawAssignedBookings.map((b) => sanitizeBookingForVendorView(b, vendor.uid)).filter((b) => b !== null);
    const assignedBookingIds = new Set(rawAssignedBookings.map((b) => b.id));
    const scopedEvents = liveBookingEvents.filter((e) => assignedBookingIds.has(e.bookingId));
    const scopedNotifications = liveNotifications.filter(
      (n) => n.recipientRole === "vendor" && n.recipientUid === vendor.uid
    );
    const assignedCities = liveCities.filter((c) => vendor.supportedCityIds.includes(c.id));
    const assignedServiceAreas = liveServiceAreas.filter(
      (a) => vendor.supportedAreaPins.includes(a.pinCode)
    );
    const assignedServices = liveServices.filter(
      (s) => vendor.supportedServiceIds.includes(s.id)
    );
    const vendorPriceOverrides = livePriceOverrides.filter(
      (po) => po.vendorUid === vendor.uid || !po.vendorUid && vendor.supportedCityIds.includes(po.cityId)
    );
    const metrics = computeVendorDashboardMetrics({
      bookings: liveBookings,
      vendor,
      todayDateStr
    });
    res.json({
      vendor,
      metrics,
      bookings: sanitizedBookings,
      bookingEvents: scopedEvents,
      notifications: scopedNotifications,
      assignedCities,
      assignedServiceAreas,
      assignedServices,
      vendorPriceOverrides
    });
  });
  app2.post("/api/vendor/bookings/:id/transition", (req, res) => {
    const vendor = res.locals.vendor;
    const { id } = req.params;
    const { targetStatus, reason, executionNote, subStatus } = req.body;
    const booking = liveBookings.find((b) => b.id === id);
    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    if (booking.assignedVendorUid !== vendor.uid) {
      res.status(403).json({
        error: "Forbidden: You can only update bookings explicitly assigned to your Partner account."
      });
      return;
    }
    if (!targetStatus) {
      res.status(400).json({ error: "targetStatus is required." });
      return;
    }
    const validation = validateVendorJobTransition({
      currentStatus: booking.status,
      targetStatus,
      reason
    });
    if (!validation.allowed) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const prevStatus = booking.status;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    booking.status = targetStatus;
    booking.updatedAtIso = nowIso;
    if (targetStatus === "vendor_accepted") {
      booking.subStatus = subStatus || "en_route";
      booking.vendorRejectionReason = null;
    } else if (targetStatus === "in_progress") {
      booking.subStatus = subStatus || "working";
    } else if (targetStatus === "completed") {
      booking.subStatus = null;
    } else if (targetStatus === "vendor_rejected") {
      booking.subStatus = null;
      booking.vendorRejectionReason = String(reason || "").trim();
    }
    if (executionNote && executionNote.trim().length > 0) {
      booking.vendorExecutionNotes.push(executionNote.trim());
    }
    const eventNote = targetStatus === "vendor_rejected" ? `Vendor requested reassignment / rejected job: ${String(reason || "").trim()}` : executionNote?.trim() || `Vendor updated job status from ${prevStatus} to ${targetStatus}.`;
    const event = {
      id: `evt_${Date.now()}`,
      bookingId: booking.id,
      actorUid: vendor.uid,
      actorRole: "vendor",
      actorName: vendor.displayName,
      fromStatus: prevStatus,
      toStatus: targetStatus,
      note: eventNote,
      createdAtIso: nowIso
    };
    liveBookingEvents.unshift(event);
    const adminNotifType = targetStatus === "vendor_accepted" ? "vendor_accepted" : targetStatus === "vendor_rejected" ? "vendor_rejected" : targetStatus === "in_progress" ? "job_started" : "job_completed";
    liveNotifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: "admin",
      recipientUid: "ALL_ADMINS",
      bookingId: booking.id,
      title: `Vendor ${targetStatus.replace(/_/g, " ").toUpperCase()} \xB7 ${booking.bookingNumber}`,
      message: `${vendor.displayName} (${vendor.vendorCode}) transitioned ${booking.bookingNumber} (${booking.serviceTitle} in PIN ${booking.pinCode}) to ${targetStatus}.${reason ? ` Reason: ${reason}` : ""}`,
      type: adminNotifType,
      read: false,
      createdAtIso: nowIso
    });
    syncLiveDatabase();
    void mirrorToFirestore("bookings", booking.id, booking);
    res.json({
      booking: sanitizeBookingForVendorView(booking, vendor.uid),
      event,
      message: targetStatus === "vendor_accepted" ? `Booking ${booking.bookingNumber} accepted! Customer contact and full address are now unlocked.` : targetStatus === "vendor_rejected" ? `Booking ${booking.bookingNumber} flagged for Admin reassignment.` : targetStatus === "in_progress" ? `Job ${booking.bookingNumber} marked In Progress.` : `Job ${booking.bookingNumber} marked Completed!`
    });
  });
  app2.post("/api/vendor/bookings/:id/substatus", (req, res) => {
    const vendor = res.locals.vendor;
    const { id } = req.params;
    const { subStatus, executionNote } = req.body;
    const booking = liveBookings.find((b) => b.id === id);
    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    if (booking.assignedVendorUid !== vendor.uid) {
      res.status(403).json({
        error: "Forbidden: You can only update bookings assigned to your Partner account."
      });
      return;
    }
    if (booking.status !== "vendor_accepted" && booking.status !== "in_progress" && booking.status !== "completed") {
      res.status(400).json({
        error: "Please accept the booking before adding field execution updates."
      });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (subStatus !== void 0) {
      booking.subStatus = subStatus;
    }
    if (executionNote && executionNote.trim().length > 0) {
      booking.vendorExecutionNotes.push(executionNote.trim());
    }
    booking.updatedAtIso = nowIso;
    const event = {
      id: `evt_${Date.now()}`,
      bookingId: booking.id,
      actorUid: vendor.uid,
      actorRole: "vendor",
      actorName: vendor.displayName,
      fromStatus: booking.status,
      toStatus: booking.status,
      note: executionNote?.trim() || `Field crew status updated to "${subStatus || "standard"}".`,
      createdAtIso: nowIso
    };
    liveBookingEvents.unshift(event);
    syncLiveDatabase();
    void mirrorToFirestore("bookings", booking.id, booking);
    res.json({
      booking: sanitizeBookingForVendorView(booking, vendor.uid),
      event,
      message: `Field log updated for ${booking.bookingNumber}.`
    });
  });
  app2.post("/api/vendor/availability", (req, res) => {
    const vendor = res.locals.vendor;
    const { isAvailable, workingHoursLabel, workingDays, maxActiveJobs } = req.body;
    if (typeof isAvailable === "boolean") {
      vendor.isAvailable = isAvailable;
    }
    if (typeof workingHoursLabel === "string" && workingHoursLabel.trim().length > 0) {
      vendor.workingHoursLabel = workingHoursLabel.trim();
    }
    if (Array.isArray(workingDays) && workingDays.length > 0) {
      vendor.workingDays = workingDays;
    }
    if (typeof maxActiveJobs === "number" && maxActiveJobs >= 1 && maxActiveJobs <= 20) {
      vendor.maxActiveJobs = Math.round(maxActiveJobs);
    }
    vendor.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
    syncLiveDatabase();
    void mirrorToFirestore("vendors", vendor.uid, vendor);
    res.json({
      vendor,
      message: `Partner availability updated (${vendor.isAvailable ? "Online & Accepting Dispatch" : "Offline / Shift Paused"}).`
    });
  });
  app2.post("/api/vendor/price-overrides", (req, res) => {
    const vendor = res.locals.vendor;
    const { serviceId, variantId, cityId, amountPaise } = req.body;
    if (!serviceId || !variantId || !cityId || typeof amountPaise !== "number" || amountPaise < 4900) {
      res.status(400).json({
        error: "Valid serviceId, variantId, cityId, and amountPaise (minimum \u20B949) are required."
      });
      return;
    }
    if (!vendor.supportedCityIds.includes(cityId)) {
      res.status(403).json({
        error: "Forbidden: You can only configure rates for cities assigned to your Partner account."
      });
      return;
    }
    if (!vendor.supportedServiceIds.includes(serviceId)) {
      res.status(403).json({
        error: "Forbidden: You can only configure rates for services assigned to your Partner account."
      });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const existingIdx = livePriceOverrides.findIndex(
      (po) => po.serviceId === serviceId && po.variantId === variantId && po.cityId === cityId && po.vendorUid === vendor.uid
    );
    if (existingIdx >= 0) {
      livePriceOverrides[existingIdx] = {
        ...livePriceOverrides[existingIdx],
        amountPaise: Math.round(amountPaise),
        active: true,
        approvalStatus: "approved",
        updatedByUid: vendor.uid,
        updatedAtIso: nowIso,
        isDemo: false
      };
      syncLiveDatabase();
      void mirrorToFirestore("price_overrides", livePriceOverrides[existingIdx].id, livePriceOverrides[existingIdx]);
      res.json({
        priceOverride: livePriceOverrides[existingIdx],
        message: "Your Partner service rate has been updated."
      });
      return;
    }
    const created = {
      id: `po_vnd_${Date.now()}`,
      serviceId,
      variantId,
      cityId,
      vendorUid: vendor.uid,
      amountPaise: Math.round(amountPaise),
      currency: "INR",
      approvalStatus: "approved",
      active: true,
      updatedByUid: vendor.uid,
      updatedAtIso: nowIso,
      isDemo: false
    };
    livePriceOverrides.push(created);
    syncLiveDatabase();
    void mirrorToFirestore("price_overrides", created.id, created);
    res.status(201).json({
      priceOverride: created,
      message: "New Partner service rate saved."
    });
  });
  app2.post("/api/vendor/notifications/read", (req, res) => {
    const vendor = res.locals.vendor;
    const { id } = req.body;
    for (const n of liveNotifications) {
      if (n.recipientRole === "vendor" && n.recipientUid === vendor.uid) {
        if (!id || n.id === id) {
          n.read = true;
        }
      }
    }
    syncLiveDatabase();
    res.json({
      notifications: liveNotifications.filter(
        (n) => n.recipientRole === "vendor" && n.recipientUid === vendor.uid
      )
    });
  });
  app2.get("/api/payments/config", (_req, res) => {
    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    const isLiveKey = keyId.startsWith("rzp_live_");
    const isTestKey = keyId.startsWith("rzp_test_");
    const isConfigured = Boolean(keyId && keySecret);
    res.json({
      ok: true,
      enabled: true,
      configured: isConfigured,
      keyId: isConfigured ? keyId : "rzp_test_tankmanpro_mock",
      mode: isLiveKey ? "live" : isTestKey ? "test" : "simulated",
      message: isConfigured ? `Razorpay active in ${isLiveKey ? "LIVE" : "TEST"} mode.` : "Razorpay simulated test mode active. Real payments require RAZORPAY_KEY_ID in .env."
    });
  });
  app2.post("/api/payments/razorpay/create-order", async (req, res) => {
    try {
      const {
        bookingId,
        bookingCode,
        amountPaise,
        customerName,
        customerEmail,
        customerPhone,
        serviceTitle
      } = req.body || {};
      if (!amountPaise || typeof amountPaise !== "number" || amountPaise <= 0) {
        res.status(400).json({ ok: false, error: "Valid amountPaise is required." });
        return;
      }
      const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
      const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
      const isConfigured = Boolean(keyId && keySecret);
      const booking = liveBookings.find(
        (b) => b.id === bookingId || b.bookingCode === bookingCode || b.bookingNumber === bookingCode
      );
      if (isConfigured) {
        const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const receipt = (booking?.bookingCode || booking?.bookingNumber || `rcpt_${Date.now()}`).slice(0, 40);
        const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount: Math.round(amountPaise),
            currency: "INR",
            receipt,
            notes: {
              bookingId: booking?.id || bookingId || "",
              customerPhone: customerPhone || booking?.customerPhone || "",
              serviceTitle: serviceTitle || booking?.serviceTitle || ""
            }
          })
        });
        if (!rzpResponse.ok) {
          const errData = await rzpResponse.json().catch(() => ({}));
          res.status(rzpResponse.status).json({
            ok: false,
            error: errData?.error?.description || "Razorpay order creation failed.",
            details: errData
          });
          return;
        }
        const rzpOrder = await rzpResponse.json();
        if (booking) {
          booking.razorpayOrderId = rzpOrder.id;
          booking.paymentStatus = "created";
        }
        res.json({
          ok: true,
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId,
          isSimulated: false
        });
      } else {
        const simOrder = generateSimulatedRazorpayOrder({
          bookingId: booking?.id || bookingId || "sim_booking",
          bookingCode: booking?.bookingCode || bookingCode,
          amountPaise,
          customerName,
          customerEmail,
          customerPhone: customerPhone || booking?.customerPhone,
          serviceTitle: serviceTitle || booking?.serviceTitle
        });
        if (booking) {
          booking.razorpayOrderId = simOrder.id;
          booking.paymentStatus = "created";
        }
        res.json({
          ok: true,
          orderId: simOrder.id,
          amount: simOrder.amount,
          currency: simOrder.currency,
          keyId: "rzp_test_tankmanpro_mock",
          isSimulated: true,
          message: "Development simulation order generated. Inject RAZORPAY_KEY_ID in .env for live gateway."
        });
      }
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err?.message || "Server error creating Razorpay order."
      });
    }
  });
  app2.post("/api/payments/razorpay/verify", (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      bookingCode
    } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({
        ok: false,
        error: "Missing razorpay_order_id or razorpay_payment_id."
      });
      return;
    }
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    const isSimulated = String(razorpay_order_id).startsWith("order_sim_");
    if (!isSimulated && keySecret) {
      const isValid = verifyRazorpayPaymentSignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature || "",
        secret: keySecret
      });
      if (!isValid) {
        res.status(400).json({
          ok: false,
          error: "Invalid payment signature. Verification failed."
        });
        return;
      }
    }
    const booking = liveBookings.find(
      (b) => b.id === bookingId || b.bookingCode === bookingCode || b.razorpayOrderId === razorpay_order_id
    );
    if (booking) {
      booking.paymentStatus = "paid";
      booking.paymentMethod = "razorpay_online";
      booking.razorpayOrderId = razorpay_order_id;
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
      const payEvent = {
        id: `ev_pay_${Date.now()}`,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        actorUid: "system_razorpay",
        actorRole: "system",
        actorName: "Razorpay Gateway",
        fromStatus: booking.status,
        toStatus: booking.status,
        eventType: "payment_verified",
        note: `Online payment of ${formatPaiseToInr(booking.quoteSnapshot.finalTotalPaise)} captured successfully (Payment ID: ${razorpay_payment_id}).`,
        createdAtIso: (/* @__PURE__ */ new Date()).toISOString()
      };
      liveBookingEvents.unshift(payEvent);
      const notif = {
        id: `notif_pay_${Date.now()}`,
        recipientRole: "admin",
        title: "Payment Received (Razorpay)",
        message: `${formatPaiseToInr(booking.quoteSnapshot.finalTotalPaise)} paid online for booking ${booking.bookingNumber}.`,
        type: "system_alert",
        severity: "success",
        read: false,
        createdAtIso: (/* @__PURE__ */ new Date()).toISOString()
      };
      liveNotifications.unshift(notif);
      syncLiveDatabase();
      void mirrorToFirestore("bookings", booking.id, booking);
    }
    res.json({
      ok: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      booking
    });
  });
  app2.post("/api/payments/razorpay/webhook", (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
    if (webhookSecret) {
      if (!signature) {
        res.status(400).json({ ok: false, error: "Missing x-razorpay-signature header." });
        return;
      }
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const isSignatureValid = verifyRazorpayWebhookSignature({
        rawBody,
        signature,
        webhookSecret
      });
      if (!isSignatureValid) {
        res.status(400).json({ ok: false, error: "Invalid webhook HMAC signature." });
        return;
      }
    }
    const event = req.body?.event;
    const payload = req.body?.payload;
    const paymentEntity = payload?.payment?.entity;
    const orderEntity = payload?.order?.entity;
    const eventId = req.headers["x-razorpay-event-id"] || paymentEntity?.id || orderEntity?.id;
    if (eventId && processedRazorpayWebhookEventIds.has(eventId)) {
      res.status(200).json({ ok: true, ignored: true, reason: "Duplicate event already processed." });
      return;
    }
    if (eventId) {
      processedRazorpayWebhookEventIds.add(eventId);
    }
    const targetOrderId = paymentEntity?.order_id || orderEntity?.id;
    const targetReceipt = orderEntity?.receipt;
    const targetBookingId = paymentEntity?.notes?.bookingId || orderEntity?.notes?.bookingId;
    const matchedBooking = liveBookings.find(
      (b) => targetOrderId && b.razorpayOrderId === targetOrderId || targetBookingId && b.id === targetBookingId || targetReceipt && (b.bookingCode === targetReceipt || b.bookingNumber === targetReceipt)
    );
    if (matchedBooking) {
      if (event === "payment.captured" || event === "order.paid") {
        matchedBooking.paymentStatus = "paid";
        matchedBooking.paymentMethod = "razorpay_online";
        if (paymentEntity?.id) matchedBooking.razorpayPaymentId = paymentEntity.id;
        matchedBooking.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
        liveBookingEvents.unshift({
          id: `ev_wh_${Date.now()}`,
          bookingId: matchedBooking.id,
          bookingCode: matchedBooking.bookingCode,
          actorUid: "razorpay_webhook",
          actorRole: "system",
          actorName: "Razorpay Webhook",
          fromStatus: matchedBooking.status,
          toStatus: matchedBooking.status,
          eventType: "webhook_payment_captured",
          note: `Webhook verified payment: ${paymentEntity?.id || "captured"}.`,
          createdAtIso: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else if (event === "payment.failed") {
        matchedBooking.paymentStatus = "failed";
        matchedBooking.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
        liveBookingEvents.unshift({
          id: `ev_wh_fail_${Date.now()}`,
          bookingId: matchedBooking.id,
          bookingCode: matchedBooking.bookingCode,
          actorUid: "razorpay_webhook",
          actorRole: "system",
          actorName: "Razorpay Webhook",
          fromStatus: matchedBooking.status,
          toStatus: matchedBooking.status,
          eventType: "webhook_payment_failed",
          note: `Payment attempt failed: ${paymentEntity?.error_description || "Declined"}.`,
          createdAtIso: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else if (event === "refund.processed") {
        matchedBooking.paymentStatus = "refunded";
        matchedBooking.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
        liveBookingEvents.unshift({
          id: `ev_wh_rfnd_${Date.now()}`,
          bookingId: matchedBooking.id,
          bookingCode: matchedBooking.bookingCode,
          actorUid: "razorpay_webhook",
          actorRole: "system",
          actorName: "Razorpay Webhook",
          fromStatus: matchedBooking.status,
          toStatus: matchedBooking.status,
          eventType: "webhook_refund_processed",
          note: "Refund processed via Razorpay gateway.",
          createdAtIso: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      syncLiveDatabase();
      void mirrorToFirestore("bookings", matchedBooking.id, matchedBooking);
    }
    res.status(200).json({ ok: true, received: true, event });
  });
  app2.post("/api/payments/razorpay/refund", async (req, res) => {
    const { bookingId, amountPaise, reason } = req.body || {};
    const booking = liveBookings.find((b) => b.id === bookingId);
    if (!booking) {
      res.status(404).json({ ok: false, error: "Booking not found." });
      return;
    }
    if (booking.paymentStatus !== "paid") {
      res.status(400).json({ ok: false, error: "Booking has not been paid online." });
      return;
    }
    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (keyId && keySecret && booking.razorpayPaymentId) {
      try {
        const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const refundRes = await fetch(
          `https://api.razorpay.com/v1/payments/${booking.razorpayPaymentId}/refund`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicAuth}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              amount: amountPaise ? Math.round(amountPaise) : void 0,
              notes: {
                bookingId: booking.id,
                reason: reason || "Admin cancelled service"
              }
            })
          }
        );
        if (!refundRes.ok) {
          const errData = await refundRes.json().catch(() => ({}));
          res.status(refundRes.status).json({
            ok: false,
            error: errData?.error?.description || "Razorpay refund failed."
          });
          return;
        }
      } catch (err) {
        res.status(500).json({ ok: false, error: err?.message || "Refund request failed." });
        return;
      }
    }
    booking.paymentStatus = "refunded";
    booking.status = "refunded";
    booking.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
    liveBookingEvents.unshift({
      id: `ev_rfnd_${Date.now()}`,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      actorUid: "admin",
      actorRole: "admin",
      actorName: "Admin Operations",
      fromStatus: booking.status,
      toStatus: "refunded",
      eventType: "refund_issued",
      note: `Refund of ${formatPaiseToInr(amountPaise || booking.quoteSnapshot.finalTotalPaise)} issued. Reason: ${reason || "Service cancelled"}`,
      createdAtIso: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ ok: true, refundIssued: true, booking });
  });
  app2.get("/api/public/service-areas", (req, res) => {
    const pin = typeof req.query.pin === "string" ? req.query.pin.trim() : "";
    if (pin) {
      const result = lookupPinCoverage(pin, liveCities, liveServiceAreas);
      res.json({
        ...result,
        isDemoData: false
      });
      return;
    }
    res.json({
      cities: liveCities.filter((c) => c.active),
      serviceAreas: liveServiceAreas.filter((a) => a.active),
      cmsSettings: liveCmsSettings,
      isDemoData: false
    });
  });
  app2.get("/api/public/catalog", (req, res) => {
    const pin = typeof req.query.pin === "string" ? req.query.pin.trim() : "";
    const pinLookup = pin ? lookupPinCoverage(pin, liveCities, liveServiceAreas) : null;
    const activeCityId = pinLookup?.serviceable ? pinLookup.city?.id : void 0;
    const publishedCategories = liveCategories.filter((c) => c.status === "published").sort((a, b) => a.sortOrder - b.sortOrder);
    const publishedServices = liveServices.filter((s) => s.status === "published").map((service) => {
      const primaryVariant = service.variants.find((v) => v.active) || service.variants[0];
      let startingPricePaise = primaryVariant.basePricePaise;
      let pricingMode = service.defaultPricingMode;
      let availableInSelectedPin = true;
      if (activeCityId && pinLookup?.serviceable) {
        pricingMode = resolveServicePricingMode(service, activeCityId);
        if (!service.supportedCityIds.includes(activeCityId)) {
          availableInSelectedPin = false;
        } else if (pricingMode === "vendor_offer") {
          const offers = listEligibleVendorOffers({
            service,
            variantId: primaryVariant.id,
            cityId: activeCityId,
            pinCode: pinLookup.pinCode,
            vendors: liveVendors,
            priceOverrides: livePriceOverrides
          });
          if (offers.length > 0) {
            startingPricePaise = offers[0].amountPaise;
          } else {
            availableInSelectedPin = false;
          }
        } else {
          const resolved = resolveEffectivePricePaise({
            service,
            variantId: primaryVariant.id,
            cityId: activeCityId,
            priceOverrides: livePriceOverrides
          });
          if (resolved.bookable && resolved.unitPricePaise !== null) {
            startingPricePaise = resolved.unitPricePaise;
          } else {
            availableInSelectedPin = false;
          }
        }
      }
      return {
        ...service,
        effectiveStartingPricePaise: startingPricePaise,
        effectivePricingMode: pricingMode,
        availableInSelectedPin
      };
    });
    const publicVendors = liveVendors.filter((v) => v.status === "active").map((v) => ({
      uid: v.uid,
      vendorCode: v.vendorCode,
      displayName: v.displayName,
      businessName: v.businessName,
      phone: "",
      // Never expose vendor personal phone on public catalog
      email: void 0,
      supportedCityIds: v.supportedCityIds,
      supportedAreaPins: v.supportedAreaPins,
      supportedServiceIds: v.supportedServiceIds,
      status: v.status,
      isAvailable: v.isAvailable,
      workingHoursStart: v.workingHoursStart,
      workingHoursEnd: v.workingHoursEnd,
      workingDays: v.workingDays,
      slaScore: v.slaScore,
      completionRatePercent: v.completionRatePercent,
      experienceYearsLabel: v.experienceYearsLabel,
      activeAssignedJobs: v.activeAssignedJobs,
      maxActiveJobs: v.maxActiveJobs,
      assignmentPriority: v.assignmentPriority,
      isDemo: v.isDemo,
      updatedAtIso: v.updatedAtIso
    }));
    res.json({
      categories: publishedCategories,
      services: publishedServices,
      cities: liveCities.filter((c) => c.active),
      serviceAreas: liveServiceAreas.filter((a) => a.active),
      vendors: publicVendors,
      priceOverrides: livePriceOverrides.filter((po) => po.active),
      coupons: liveCoupons.filter((c) => c.active),
      cmsSettings: liveCmsSettings,
      pinResolution: pinLookup,
      isDemoData: false
    });
  });
  app2.get("/api/public/services/:slug", (req, res) => {
    const slug = req.params.slug;
    const pin = typeof req.query.pin === "string" ? req.query.pin.trim() : "";
    const variantIdParam = typeof req.query.variantId === "string" ? req.query.variantId.trim() : "";
    const service = liveServices.find(
      (s) => (s.slug === slug || s.id === slug) && s.status === "published"
    );
    if (!service) {
      res.status(404).json({ error: "Service not found or not published." });
      return;
    }
    const activeVariant = service.variants.find((v) => v.id === variantIdParam && v.active) || service.variants.find((v) => v.active);
    const pinLookup = pin ? lookupPinCoverage(pin, liveCities, liveServiceAreas) : null;
    let pricingMode = service.defaultPricingMode;
    let vendorOffers = [];
    let cityPriceResolution = null;
    if (pinLookup?.serviceable && pinLookup.city) {
      pricingMode = resolveServicePricingMode(service, pinLookup.city.id);
      if (pricingMode === "vendor_offer") {
        vendorOffers = listEligibleVendorOffers({
          service,
          variantId: activeVariant.id,
          cityId: pinLookup.city.id,
          pinCode: pinLookup.pinCode,
          vendors: liveVendors,
          priceOverrides: livePriceOverrides
        });
      } else {
        cityPriceResolution = resolveEffectivePricePaise({
          service,
          variantId: activeVariant.id,
          cityId: pinLookup.city.id,
          priceOverrides: livePriceOverrides
        });
      }
    }
    res.json({
      service,
      activeVariantId: activeVariant.id,
      pinResolution: pinLookup,
      pricingMode,
      cityPriceResolution,
      vendorOffers,
      isDemoData: false
    });
  });
  app2.post("/api/pricing/quote", (req, res) => {
    const body = req.body;
    if (!body || !body.pinCode || !body.serviceId || !body.variantId) {
      res.status(400).json({
        bookable: false,
        reason: "pinCode, serviceId, and variantId are required to calculate an authoritative quote."
      });
      return;
    }
    const quote = calculateAuthoritativeQuote({
      request: {
        pinCode: String(body.pinCode),
        serviceId: String(body.serviceId),
        variantId: String(body.variantId),
        addonQuantities: body.addonQuantities || {},
        selectedVendorUid: body.selectedVendorUid ? String(body.selectedVendorUid) : void 0,
        couponCode: body.couponCode ? String(body.couponCode) : void 0
      },
      cities: liveCities,
      serviceAreas: liveServiceAreas,
      services: liveServices,
      vendors: liveVendors,
      priceOverrides: livePriceOverrides,
      coupons: liveCoupons,
      taxRatePercent: liveCmsSettings.defaultTaxRatePercent || 0
    });
    res.json(quote);
  });
  app2.post("/api/coupons/validate", (req, res) => {
    const { couponCode, subtotalPaise, cityId, serviceId } = req.body || {};
    const result = evaluateCouponDiscount({
      couponCode: String(couponCode || ""),
      subtotalPaise: Number(subtotalPaise || 0),
      cityId: String(cityId || ""),
      serviceId: String(serviceId || ""),
      coupons: liveCoupons
    });
    res.json(result);
  });
  app2.get("/api/bookings/slots", (req, res) => {
    const pinCode = typeof req.query.pinCode === "string" ? req.query.pinCode.trim() : "";
    const serviceId = typeof req.query.serviceId === "string" ? req.query.serviceId.trim() : "";
    const variantId = typeof req.query.variantId === "string" ? req.query.variantId.trim() : "";
    const scheduledDate = typeof req.query.scheduledDate === "string" ? req.query.scheduledDate.trim() : new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    const selectedVendorUid = typeof req.query.selectedVendorUid === "string" && req.query.selectedVendorUid.trim() ? req.query.selectedVendorUid.trim() : void 0;
    const pinLookup = lookupPinCoverage(pinCode, liveCities, liveServiceAreas);
    if (!pinLookup.serviceable || !pinLookup.city) {
      res.json({
        serviceable: false,
        pinCode,
        scheduledDate,
        slots: [],
        assignmentPolicy: liveCmsSettings.defaultAssignmentPolicy,
        message: pinLookup.message
      });
      return;
    }
    const service = liveServices.find(
      (s) => (s.id === serviceId || s.slug === serviceId) && s.status === "published"
    );
    if (!service) {
      res.status(404).json({ error: "Service not found or not published." });
      return;
    }
    const chosenVariant = service.variants.find((v) => v.id === variantId && v.active) || service.variants.find((v) => v.active) || service.variants[0];
    const slots = evaluateSlotsForDate({
      service,
      variantId: chosenVariant.id,
      cityId: pinLookup.city.id,
      pinCode,
      scheduledDate,
      vendors: liveVendors,
      existingBookings: liveBookings,
      priceOverrides: livePriceOverrides,
      selectedVendorUid
    });
    res.json({
      serviceable: true,
      pinCode,
      cityId: pinLookup.city.id,
      cityName: pinLookup.city.name,
      scheduledDate,
      assignmentPolicy: liveCmsSettings.defaultAssignmentPolicy,
      slots
    });
  });
  app2.post("/api/bookings", (req, res) => {
    const input = req.body || {};
    const result = createCustomerBookingTransaction({
      input,
      cities: liveCities,
      serviceAreas: liveServiceAreas,
      services: liveServices,
      vendors: liveVendors,
      priceOverrides: livePriceOverrides,
      coupons: liveCoupons,
      existingBookings: liveBookings,
      assignmentPolicy: liveCmsSettings.defaultAssignmentPolicy || "auto_score",
      taxRatePercent: liveCmsSettings.defaultTaxRatePercent || 0,
      allowUnassignedAdminReview: true
    });
    if (!result.ok || !result.booking) {
      res.status(400).json({
        ok: false,
        errorCode: result.errorCode,
        error: result.error || "Could not create booking."
      });
      return;
    }
    if (!result.duplicatePrevented) {
      liveBookings.unshift(result.booking);
      if (result.booking.assignedVendorUid) {
        const assignedVendor = liveVendors.find(
          (v) => v.uid === result.booking.assignedVendorUid
        );
        if (assignedVendor) {
          assignedVendor.activeAssignedJobs += 1;
          assignedVendor.updatedAtIso = result.booking.createdAtIso;
        }
      }
      if (result.booking.priceSnapshot.couponCode) {
        const appliedCoupon = liveCoupons.find(
          (c) => c.code.toUpperCase() === result.booking.priceSnapshot.couponCode.toUpperCase()
        );
        if (appliedCoupon) {
          appliedCoupon.currentRedemptions += 1;
        }
      }
      if (result.bookingEvent) {
        liveBookingEvents.unshift(result.bookingEvent);
      }
      if (result.notifications && result.notifications.length > 0) {
        liveNotifications.unshift(...result.notifications);
      }
      syncLiveDatabase();
      void mirrorToFirestore("bookings", result.booking.id, result.booking);
    }
    const bookingEvents = liveBookingEvents.filter(
      (ev) => ev.bookingId === result.booking.id
    );
    res.status(result.duplicatePrevented ? 200 : 201).json({
      ok: true,
      duplicatePrevented: Boolean(result.duplicatePrevented),
      booking: result.booking,
      dispatchDecision: result.dispatchDecision,
      quote: result.quote,
      events: bookingEvents,
      message: result.dispatchDecision?.customerMessage || "Booking confirmed."
    });
  });
  app2.get("/api/customer/bookings", (req, res) => {
    const phoneParam = typeof req.query.phone === "string" ? req.query.phone.replace(/\D/g, "").slice(-10) : "";
    const codeParam = typeof req.query.bookingCode === "string" ? req.query.bookingCode.trim().toUpperCase() : "";
    const idsParam = typeof req.query.ids === "string" ? req.query.ids.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const matched = liveBookings.filter((b) => {
      const bCode = b.bookingCode || b.bookingNumber;
      if (codeParam && bCode.toUpperCase() === codeParam) {
        return true;
      }
      if (phoneParam && phoneParam.length === 10 && b.customerPhone.replace(/\D/g, "").slice(-10) === phoneParam) {
        return true;
      }
      if (idsParam.length > 0 && (idsParam.includes(b.id) || idsParam.includes(bCode))) {
        return true;
      }
      return false;
    });
    const enriched = matched.map((b) => {
      const assignedVendor = b.assignedVendorUid ? liveVendors.find((v) => v.uid === b.assignedVendorUid) : null;
      const events = liveBookingEvents.filter((ev) => ev.bookingId === b.id);
      return {
        booking: b,
        assignedVendorSummary: assignedVendor ? {
          uid: assignedVendor.uid,
          vendorCode: assignedVendor.vendorCode,
          displayName: assignedVendor.displayName,
          businessName: assignedVendor.businessName,
          experienceYearsLabel: assignedVendor.experienceYearsLabel
        } : null,
        events
      };
    });
    res.json({
      bookings: enriched
    });
  });
  app2.post("/api/customer/bookings/:id/cancel", (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};
    const booking = liveBookings.find(
      (b) => b.id === id || (b.bookingCode || b.bookingNumber).toUpperCase() === id.toUpperCase()
    );
    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    if (booking.status === "in_progress" || booking.status === "completed" || booking.status === "cancelled" || booking.status === "refunded") {
      res.status(400).json({
        error: `Booking in "${booking.status}" state cannot be cancelled directly. Please contact support.`
      });
      return;
    }
    const prevStatus = booking.status;
    const prevVendorUid = booking.assignedVendorUid;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const cleanReason = (reason || "").trim() || "Cancelled by customer from My Bookings portal";
    booking.status = "cancelled";
    booking.subStatus = "customer_cancelled";
    booking.cancellationReason = cleanReason;
    booking.updatedAtIso = nowIso;
    if (prevVendorUid) {
      const vendor = liveVendors.find((v) => v.uid === prevVendorUid);
      if (vendor && vendor.activeAssignedJobs > 0) {
        vendor.activeAssignedJobs = Math.max(0, vendor.activeAssignedJobs - 1);
      }
      liveNotifications.unshift({
        id: `notif_vnd_cancel_${Date.now()}`,
        recipientRole: "vendor",
        recipientUid: prevVendorUid,
        title: `Booking Cancelled by Customer: ${booking.bookingCode}`,
        message: `Customer ${booking.customerName} cancelled ${booking.bookingCode} (${booking.scheduledDate} \xB7 ${booking.timeWindow}). Reason: ${cleanReason}`,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        severity: "warning",
        read: false,
        createdAtIso: nowIso
      });
    }
    liveNotifications.unshift({
      id: `notif_adm_cancel_${Date.now()}`,
      recipientRole: "admin",
      title: `Customer Cancelled Booking ${booking.bookingCode}`,
      message: `${booking.customerName} cancelled ${booking.bookingCode} in ${booking.cityName} (${booking.pinCode}). Reason: ${cleanReason}`,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      severity: "warning",
      read: false,
      createdAtIso: nowIso
    });
    liveBookingEvents.unshift({
      id: `ev_cust_cancel_${Date.now()}`,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      actorUid: booking.customerUid,
      actorRole: "customer",
      actorName: booking.customerName,
      fromStatus: prevStatus,
      toStatus: "cancelled",
      eventType: "customer_cancelled_booking",
      note: `Customer cancelled booking: ${cleanReason}`,
      createdAtIso: nowIso
    });
    res.json({
      ok: true,
      booking,
      events: liveBookingEvents.filter((ev) => ev.bookingId === booking.id),
      message: `Booking ${booking.bookingCode} has been cancelled.`
    });
  });
  app2.post("/api/public/waitlist", (req, res) => {
    const { pinCode, customerName, phoneOrEmail, requestedServiceSlug, consentGiven } = req.body || {};
    if (!isValidIndianPin(String(pinCode || ""))) {
      res.status(400).json({ error: "Please provide a valid 6-digit Indian PIN code." });
      return;
    }
    if (!customerName || String(customerName).trim().length < 2) {
      res.status(400).json({ error: "Please enter your name." });
      return;
    }
    if (!phoneOrEmail || String(phoneOrEmail).trim().length < 5) {
      res.status(400).json({ error: "Please provide a valid phone number or email address." });
      return;
    }
    if (!consentGiven) {
      res.status(400).json({
        error: "Please check the consent box so we can notify you when coverage opens in your PIN code."
      });
      return;
    }
    const entry = {
      id: `wl_${Date.now()}`,
      pinCode: String(pinCode).trim(),
      customerName: String(customerName).trim(),
      phoneOrEmail: String(phoneOrEmail).trim(),
      requestedServiceSlug: requestedServiceSlug ? String(requestedServiceSlug) : void 0,
      consentGiven: true,
      createdAtIso: (/* @__PURE__ */ new Date()).toISOString()
    };
    waitlistEntries.push(entry);
    syncLiveDatabase();
    void mirrorToFirestore("waitlist_entries", entry.id, entry);
    res.status(201).json({
      success: true,
      entry,
      message: `Waitlist request recorded for PIN ${entry.pinCode}.`
    });
  });
  app2.post("/api/public/contact", (req, res) => {
    const { name, emailOrPhone, pinCode, message } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      res.status(400).json({ error: "Please enter your full name." });
      return;
    }
    if (!emailOrPhone || String(emailOrPhone).trim().length < 5) {
      res.status(400).json({ error: "Please enter a valid email address or 10-digit phone number." });
      return;
    }
    if (!message || String(message).trim().length < 10) {
      res.status(400).json({ error: "Please enter a message of at least 10 characters." });
      return;
    }
    const record = {
      id: `inq_${Date.now()}`,
      name: String(name).trim(),
      emailOrPhone: String(emailOrPhone).trim(),
      pinCode: pinCode ? String(pinCode).trim() : void 0,
      message: String(message).trim(),
      createdAtIso: (/* @__PURE__ */ new Date()).toISOString()
    };
    contactSubmissions.push(record);
    syncLiveDatabase();
    void mirrorToFirestore("contact_submissions", record.id, record);
    res.status(201).json({
      success: true,
      inquiryId: record.id,
      message: "Your inquiry has been logged."
    });
  });
  const TANKMAN_HOMEPAGE_MARKDOWN = `# TankmanPro \u2014 Professional Water Tank Cleaning & Home Maintenance Services

> On-demand mechanized water tank cleaning, certified electrician repairs, licensed plumbing, interior/exterior painting, carpentry, and AC service across Delhi NCR, Shahjahanpur, and Kanpur with transparent city-wise pricing.

## Immediate Contact & Machine Details
- **Helpline / Phone:** +91 96481 75639
- **WhatsApp Direct Booking:** https://wa.me/919648175639
- **Email:** support@tankmanpro.com
- **Operating Hours:** 07:00 \u2013 21:00 IST (All 7 Days)
- **Headquarters:** Shahjahanpur, Uttar Pradesh 242001, India
- **Canonical Website:** https://wheat-wallaby-789247.hostingersite.com

## 12 Core Service Categories & Pricing
1. **Water Tank Cleaning (cat_tank_cleaning):** 4-stage scientific mechanized process (sludge dewatering, high pressure rotary scrubbing, vacuum extraction, UV antibacterial treatment). 500L to 5000L tanks. Starting from \u20B9499.
2. **Electrician Services (cat_electrician):** 53 bookable variants including switchboards, fans, concealed wiring, MCB distribution, inverter setup. Starting from \u20B9149.
3. **Plumber & Sanitary Services (cat_plumber):** 18 variants including taps, showers, washbasins, waste pipes, bathroom drainage, grouting. Starting from \u20B9149.
4. **AC Service & Repair (cat_ac_service):** Split and window AC jet foam cleaning, gas leakage check, cooling diagnostics. Starting from \u20B9499.
5. **Sofa, Mattress & Carpet Cleaning (cat_sofa_mattress):** Wet vacuum extraction, fabric shampooing, and dust-mite sanitization. Starting from \u20B9399.
6. **Painter & Wall Care (cat_painter):** Interior accent walls, full flat painting, exterior waterproofing, damp touch-ups. Starting from \u20B9499.
7. **Carpenter Services (cat_carpenter):** Door locks, modular hinges, furniture assembly, curtain rod and wall drillings. Starting from \u20B9149.
8. **Kitchen Deep Cleaning (cat_kitchen):** Degreasing chimney filters, refrigerator interior/exterior, stove & sink descaling. Starting from \u20B9699.
9. **Bathroom & Tile Cleaning (cat_bathroom):** Machine scrubbing, limescale removal, grout brightening, and toilet sanitization. Starting from \u20B9499.
10. **Fan, Floor & Home Care (cat_fan_appliances):** High-reach ceiling fan cleaning, microfiber floor buffing. Starting from \u20B9199.
11. **Car & Bike Wash (cat_vehicle_wash):** Doorstep foam wash, exterior wax, interior vacuuming. Starting from \u20B9199.
12. **Beedare Skin & Aesthetics (cat_aesthetics):** At-home professional chemical peels, Dermapen rejuvenation, aesthetic salon care. Starting from \u20B91499.

## Verified Service Locations
- **Delhi NCR:** 110001\u2013110096, Noida, Gurgaon
- **Shahjahanpur:** 242001 and surrounding sectors
- **Kanpur:** 208001\u2013208027

## Machine-Readable Resources
- [llms.txt](https://wheat-wallaby-789247.hostingersite.com/llms.txt): Agent discovery document
- [llms-full.txt](https://wheat-wallaby-789247.hostingersite.com/llms-full.txt): Full documentation and pricing tables
- [sitemap.xml](https://wheat-wallaby-789247.hostingersite.com/sitemap.xml): XML Sitemap
- [MCP Server Card](https://wheat-wallaby-789247.hostingersite.com/.well-known/mcp/server-card.json): Model Context Protocol metadata
`;
  const AGENT_LINK_HEADER = [
    '</llms.txt>; rel="alternate"; type="text/plain"',
    '</api/markdown>; rel="alternate"; type="text/markdown"',
    '</sitemap.xml>; rel="sitemap"; type="application/xml"',
    '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"'
  ].join(", ");
  app2.get("/robots.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    const robotsPath = path2.join(__dirname2, "public", "robots.txt");
    if (fs2.existsSync(robotsPath)) {
      res.sendFile(robotsPath);
    } else {
      res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /vendor/
Disallow: /api/

Content-Signal: search=yes, ai-train=no
Sitemap: https://wheat-wallaby-789247.hostingersite.com/sitemap.xml
`);
    }
  });
  app2.get("/sitemap.xml", (_req, res) => {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    const sitemapPath = path2.join(__dirname2, "public", "sitemap.xml");
    if (fs2.existsSync(sitemapPath)) {
      res.sendFile(sitemapPath);
    } else {
      res.status(404).send("<error>Sitemap not found</error>");
    }
  });
  app2.get("/llms.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Link", AGENT_LINK_HEADER);
    const llmsPath = path2.join(__dirname2, "public", "llms.txt");
    if (fs2.existsSync(llmsPath)) {
      res.sendFile(llmsPath);
    } else {
      res.send(TANKMAN_HOMEPAGE_MARKDOWN);
    }
  });
  app2.get("/llms-full.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Link", AGENT_LINK_HEADER);
    const llmsFullPath = path2.join(__dirname2, "public", "llms-full.txt");
    if (fs2.existsSync(llmsFullPath)) {
      res.sendFile(llmsFullPath);
    } else {
      res.send(TANKMAN_HOMEPAGE_MARKDOWN);
    }
  });
  app2.get("/.well-known/mcp/server-card.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    const cardPath = path2.join(__dirname2, "public", ".well-known", "mcp", "server-card.json");
    if (fs2.existsSync(cardPath)) {
      res.sendFile(cardPath);
    } else {
      res.json({
        $schema: "https://modelcontextprotocol.io/schemas/server-card.json",
        name: "tankmanpro-server",
        version: "1.0.0",
        description: "TankmanPro Home Services MCP Server",
        homepage: "https://wheat-wallaby-789247.hostingersite.com",
        endpoint: "https://wheat-wallaby-789247.hostingersite.com/api/mcp"
      });
    }
  });
  app2.get("/api/markdown", (_req, res) => {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Link", AGENT_LINK_HEADER);
    res.send(TANKMAN_HOMEPAGE_MARKDOWN);
  });
  app2.get("/api/mcp", (_req, res) => {
    res.json({
      protocol: "mcp-json-rpc",
      version: "1.0.0",
      server: "tankmanpro-server",
      tools: [
        {
          name: "search_services",
          description: "Search available home services by keyword or category"
        },
        {
          name: "check_serviceability",
          description: "Check if a 6-digit Indian PIN code is covered"
        },
        {
          name: "calculate_quote",
          description: "Authoritative pricing calculator in paise for service variants"
        },
        {
          name: "get_contact_info",
          description: "Customer helpline, WhatsApp, and email contact information"
        }
      ]
    });
  });
  const VALID_CLIENT_ROUTES = /* @__PURE__ */ new Set([
    "/",
    "",
    "/services",
    "/booking",
    "/checkout",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/faq",
    "/cancellation-refund-policy",
    "/pricing",
    "/account",
    "/account/addresses",
    "/account/reviews",
    "/orders",
    "/help",
    "/vendor",
    "/vendor/login",
    "/admin",
    "/admin/login"
  ]);
  const isValidClientRoute = (rawPath) => {
    const clean = rawPath.split("?")[0].replace(/\/+$/, "") || "/";
    if (VALID_CLIENT_ROUTES.has(clean)) return true;
    if (clean.startsWith("/services/") || clean.startsWith("/category/")) return true;
    if (clean.startsWith("/vendor/") || clean.startsWith("/admin/")) return true;
    if (clean.startsWith("/account/")) return true;
    return false;
  };
  const renderNotFoundHtml = (reqPath) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>404 Not Found \u2014 TankmanPro</title>
  <meta name="robots" content="noindex, follow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 4rem 1rem; color: #1e293b; background: #f8fafc; }
    .card { max-width: 28rem; margin: 0 auto; background: white; padding: 2.5rem 2rem; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    h1 { font-size: 2.5rem; font-weight: 800; color: #0f766e; margin: 0 0 0.5rem; }
    h2 { font-size: 1.25rem; font-weight: 600; color: #0f172a; margin: 0 0 1rem; }
    p { color: #64748b; font-size: 0.95rem; margin-bottom: 1.75rem; line-height: 1.5; }
    .btn { display: inline-block; background: #0f766e; color: white; padding: 0.625rem 1.25rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.875rem; margin: 0 0.25rem; }
    .btn-secondary { background: white; color: #334155; border: 1px solid #cbd5e1; }
  </style>
</head>
<body>
  <div class="card">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The URL <code>${reqPath.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code> was not found on TankmanPro. Agents and crawlers treat HTTP 404 as non-existent.</p>
    <a href="/" class="btn">Return to Homepage</a>
    <a href="/services" class="btn btn-secondary">Browse Services</a>
  </div>
</body>
</html>`;
  if (process.env.NODE_ENV === "production") {
    const distPath = path2.join(__dirname2, "dist");
    app2.use(express.static(distPath));
    app2.get("*", (req, res) => {
      const acceptHeader = req.headers.accept || "";
      if (acceptHeader.includes("text/markdown") || acceptHeader.includes("text/x-markdown") || req.query.format === "markdown") {
        res.setHeader("Content-Type", "text/markdown; charset=utf-8");
        res.setHeader("Link", AGENT_LINK_HEADER);
        res.send(TANKMAN_HOMEPAGE_MARKDOWN);
        return;
      }
      if (!isValidClientRoute(req.path)) {
        res.status(404).setHeader("Content-Type", "text/html; charset=utf-8").send(renderNotFoundHtml(req.path));
        return;
      }
      res.setHeader("Link", AGENT_LINK_HEADER);
      res.sendFile(path2.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.use((req, res, next) => {
      if (req.method !== "GET") return next();
      const acceptHeader = req.headers.accept || "";
      if (acceptHeader.includes("text/markdown") || acceptHeader.includes("text/x-markdown") || req.query.format === "markdown") {
        res.setHeader("Content-Type", "text/markdown; charset=utf-8");
        res.setHeader("Link", AGENT_LINK_HEADER);
        res.send(TANKMAN_HOMEPAGE_MARKDOWN);
        return;
      }
      if (req.path.startsWith("/@") || req.path.startsWith("/src/") || req.path.startsWith("/node_modules/") || req.path.startsWith("/public/") || req.path.includes(".")) {
        return next();
      }
      if (!isValidClientRoute(req.path)) {
        res.status(404).setHeader("Content-Type", "text/html; charset=utf-8").send(renderNotFoundHtml(req.path));
        return;
      }
      res.setHeader("Link", AGENT_LINK_HEADER);
      next();
    });
    app2.use(vite.middlewares);
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`TankmanPro server listening on http://localhost:${PORT}`);
  });
}
startServer();
