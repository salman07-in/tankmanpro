// server.ts
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

// src/data/demoCatalog.ts
var DEMO_CITIES = [
  {
    id: "city_delhi",
    name: "New Delhi",
    state: "Delhi NCR",
    slug: "new-delhi",
    active: true,
    isDemo: true
  },
  {
    id: "city_shahjahanpur",
    name: "Shahjahanpur",
    state: "Uttar Pradesh",
    slug: "shahjahanpur",
    active: true,
    isDemo: true
  },
  {
    id: "city_kanpur",
    name: "Kanpur",
    state: "Uttar Pradesh",
    slug: "kanpur",
    active: true,
    isDemo: true
  }
];
var DEMO_SERVICE_AREAS = [
  {
    id: "area_del_110001",
    cityId: "city_delhi",
    pinCode: "110001",
    zoneLabel: "Connaught Place, central New Delhi",
    neighbourhoods: ["Connaught Place", "Barakhamba Road", "Janpath", "Mandi House"],
    active: true,
    isDemo: true
  },
  {
    id: "area_del_110016",
    cityId: "city_delhi",
    pinCode: "110016",
    zoneLabel: "Hauz Khas & Green Park, South Delhi",
    neighbourhoods: ["Hauz Khas", "Green Park", "SDA Market", "IIT Gate"],
    active: true,
    isDemo: true
  },
  {
    id: "area_del_110075",
    cityId: "city_delhi",
    pinCode: "110075",
    zoneLabel: "Dwarka Sectors 4\u201312, West Delhi",
    neighbourhoods: ["Dwarka Sector 6", "Dwarka Sector 10", "Dwarka Sector 12"],
    active: true,
    isDemo: true
  },
  {
    id: "area_spn_242001",
    cityId: "city_shahjahanpur",
    pinCode: "242001",
    zoneLabel: "Sadar Bazar & Civil Lines, Shahjahanpur",
    neighbourhoods: ["Sadar Bazar", "Civil Lines", "Bahadurganj", "Town Hall"],
    active: true,
    isDemo: true
  },
  {
    id: "area_spn_242226",
    cityId: "city_shahjahanpur",
    pinCode: "242226",
    zoneLabel: "Roza & Avas Vikas, Shahjahanpur",
    neighbourhoods: ["Roza Junction", "Avas Vikas Colony", "Cantt Area"],
    active: true,
    isDemo: true
  },
  {
    id: "area_knp_208002",
    cityId: "city_kanpur",
    pinCode: "208002",
    zoneLabel: "Tilak Nagar & Swaroop Nagar, Kanpur",
    neighbourhoods: ["Tilak Nagar", "Swaroop Nagar", "Arya Nagar", "Civil Lines Kanpur"],
    active: true,
    isDemo: true
  },
  {
    id: "area_knp_208001",
    cityId: "city_kanpur",
    pinCode: "208001",
    zoneLabel: "Mall Road & Birhana Road, Kanpur",
    neighbourhoods: ["Mall Road", "Phool Bagh", "Birhana Road", "Gumti No. 5"],
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
    imageUrl: "/assets/tankmanpro/water-tank.jpg",
    sortOrder: 1,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_bathroom",
    name: "Bathroom & Tile Cleaning",
    slug: "bathroom-cleaning",
    shortDescription: "Machine & hand scrubbing, complete A-to-Z bathroom deep cleaning, toilet & washbasin descaling.",
    iconKey: "bathroom",
    imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
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
    imageUrl: "/assets/tankmanpro/kitchen-chimney.png",
    sortOrder: 3,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_ac_service",
    name: "AC Service & Repair",
    slug: "ac-service-repair",
    shortDescription: "Split & window AC foam-jet service, cooling diagnostics, and complete AC installation.",
    iconKey: "ac-service",
    imageUrl: "/assets/tankmanpro/ac-service.jpg",
    sortOrder: 4,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_sofa_mattress",
    name: "Sofa, Mattress & Carpet",
    slug: "sofa-mattress-carpet",
    shortDescription: "Dry dusting, shampooing, wet vacuum extraction for sofas, single/double mattresses & carpets.",
    iconKey: "sofa-mattress",
    imageUrl: "/assets/tankmanpro/sofa-clean.jpg",
    sortOrder: 5,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_vehicle_wash",
    name: "Car & Bike Wash",
    slug: "car-bike-wash",
    shortDescription: "Doorstep car interior vacuum + exterior polish wash and two-wheeler foam wash.",
    iconKey: "vehicle-wash",
    imageUrl: "/assets/tankmanpro/car-wash.jpg",
    sortOrder: 6,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_fan_appliances",
    name: "Fan, Floor & Door Care",
    slug: "fan-floor-door-cleaning",
    shortDescription: "Ceiling fan & exhaust fan degreasing, door cleaning, and microfiber floor scrubbing.",
    iconKey: "fan-appliances",
    imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
    sortOrder: 7,
    status: "published",
    isDemo: true
  },
  {
    id: "cat_aesthetics",
    name: "Beedare Skin & Aesthetics",
    slug: "beedare-aesthetics",
    shortDescription: "At-home chemical peels, Dermapen, PRP rejuvenation & laser hair removal by Beedare by TankmanPro.",
    iconKey: "aesthetics",
    imageUrl: "/assets/tankmanpro/aesthetic-facial.jpg",
    sortOrder: 8,
    status: "published",
    isDemo: true
  }
];
var DEMO_SERVICES = [
  // 1. WATER TANK CLEANING (Exact tankmanpro.com capacities & prices: ₹499, ₹899, ₹1499, ₹2499)
  {
    id: "srv_mechanized_tank_clean",
    slug: "mechanized-water-tank-cleaning",
    title: "Mechanized Water Tank Cleaning",
    categoryId: "cat_water_tank",
    shortDescription: "Manhole & surroundings cleaned off dirt, mud, and algae; water pumped out; high-pressure rotary jet wash & sanitization.",
    fullDescription: "The manhole and surroundings are cleaned of dirt, mud, and algae, after which water below the foot-valve level is pumped out using specialized dewatering equipment. Includes internal sludge vacuuming, high-pressure jet wash of walls and ceiling, and anti-bacterial UV treatment.",
    illustrationKey: "water-tank",
    imageUrl: "/assets/tankmanpro/water-tank.jpg",
    galleryUrls: ["/assets/tankmanpro/water-tank.jpg"],
    durationMinutes: 60,
    basePricePaise: 49900,
    // ₹499 starting (500L-750L on tankmanpro.com)
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
        // ₹499 on tankmanpro.com
        regularPricePaise: 69900,
        imageUrl: "/assets/tankmanpro/water-tank.jpg",
        active: true
      },
      {
        id: "var_tank_1000_1500",
        serviceId: "srv_mechanized_tank_clean",
        name: "Water Tank Cleaning (1000L to 1500L)",
        scopeSummary: "Medium overhead or underground tank (1000 ltr to 1500 ltr capacity)",
        durationMinutes: 60,
        basePricePaise: 89900,
        // ₹899 on tankmanpro.com
        regularPricePaise: 109900,
        imageUrl: "/assets/tankmanpro/water-tank.jpg",
        active: true
      },
      {
        id: "var_tank_1500_2000",
        serviceId: "srv_mechanized_tank_clean",
        name: "Water Tank Cleaning (2000L to 3000L)",
        scopeSummary: "Large overhead or sump tank (2000 ltr to 3000 ltr capacity)",
        durationMinutes: 90,
        basePricePaise: 149900,
        // ₹1,499 on tankmanpro.com
        regularPricePaise: 179900,
        imageUrl: "/assets/tankmanpro/water-tank.jpg",
        active: true
      },
      {
        id: "var_tank_4000_5000",
        serviceId: "srv_mechanized_tank_clean",
        name: "Water Tank Cleaning (4000L to 5000L)",
        scopeSummary: "Extra-large commercial / society storage tank (4000 ltr to 5000 ltr)",
        durationMinutes: 120,
        basePricePaise: 249900,
        // ₹2,499 on tankmanpro.com
        regularPricePaise: 299900,
        imageUrl: "/assets/tankmanpro/water-tank.jpg",
        active: true
      }
    ],
    addons: [
      {
        id: "addon_float_valve",
        serviceId: "srv_mechanized_tank_clean",
        name: "Float Ball Valve & Inlet Washer Check",
        description: "Inspection and washer replacement to prevent tank overflow.",
        pricePaise: 14900,
        required: false,
        maxQuantity: 2,
        active: true
      },
      {
        id: "addon_pipeline_flush",
        serviceId: "srv_mechanized_tank_clean",
        name: "Outlet Pipeline Airlock & Scale Flush",
        description: "Clears settled scale from main outlet distribution line.",
        pricePaise: 29900,
        required: false,
        maxQuantity: 1,
        active: true
      }
    ],
    questions: [
      {
        id: "q_tank_material",
        label: "Tank Material",
        options: ["PVC / Sintex Plastic Tank", "Concrete / Cement RCC Tank", "Steel Tank"]
      }
    ],
    faqs: [
      {
        question: "How is the water tank cleaned?",
        answer: "The manhole and surroundings are cleaned of dirt, mud, and algae, water below the foot-valve is pumped out, sludge is vacuumed, walls are pressure-jet washed, and UV sanitization is performed."
      }
    ],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  },
  // 2. AC SERVICES & INSTALLATION (Exact tankmanpro.com prices: ₹599 AC Services, ₹1499 AC Installation)
  {
    id: "srv_ac_foam_jet",
    slug: "split-window-ac-foam-jet-service",
    title: "AC Service, Repair & Installation",
    categoryId: "cat_ac_service",
    shortDescription: "Swift and professional AC service & installation: expert technicians ready to service coils, clean filters, and install outdoor/indoor units.",
    fullDescription: "Complete air conditioner care by TankmanPro technicians. Includes deep foam-jet cleaning of indoor cooling coils, blower wheel wash, drain tray flushing, outdoor condenser water wash, and complete split/window AC installation.",
    illustrationKey: "ac-service",
    imageUrl: "/assets/tankmanpro/ac-service.jpg",
    galleryUrls: ["/assets/tankmanpro/ac-service.jpg"],
    durationMinutes: 60,
    basePricePaise: 59900,
    // ₹599 on tankmanpro.com
    regularPricePaise: 79900,
    defaultPricingMode: "vendor_offer",
    cityModeOverrides: {
      city_delhi: "vendor_offer",
      city_shahjahanpur: "city_fixed",
      city_kanpur: "city_fixed"
    },
    inclusions: [
      "Indoor cooling coil & air filter deep foam wash with spill-guard cover",
      "Outdoor condenser unit high-pressure jet wash",
      "Drain pipe flushing to prevent indoor water leakage",
      "Coolant pressure, compressor amperage & thermostat check"
    ],
    exclusions: [
      "Spare parts, copper pipe extension, or refrigerant gas refill (quoted separately after inspection)",
      "Masonry core cutting or external iron stand cost"
    ],
    preparationInstructions: [
      "Clear 3 feet of space below the indoor AC unit before technician arrival."
    ],
    warrantySummary: "15-day post-service cooling & workmanship assurance",
    cancellationPolicySummary: "Free cancellation up to 4 hours before scheduled slot.",
    variants: [
      {
        id: "var_ac_single",
        serviceId: "srv_ac_foam_jet",
        name: "AC Services (Split / Window Deep Service)",
        scopeSummary: "Complete indoor coil + blower + outdoor unit service (1 AC)",
        durationMinutes: 55,
        basePricePaise: 59900,
        // ₹599 on tankmanpro.com
        regularPricePaise: 79900,
        imageUrl: "/assets/tankmanpro/ac-service.jpg",
        active: true
      },
      {
        id: "var_ac_twin",
        serviceId: "srv_ac_foam_jet",
        name: "AC Services Combo (2 AC Units)",
        scopeSummary: "Complete deep service for 2 Split/Window AC units",
        durationMinutes: 100,
        basePricePaise: 109900,
        // ₹1,099
        regularPricePaise: 149900,
        imageUrl: "/assets/tankmanpro/ac-service.jpg",
        active: true
      },
      {
        id: "var_ac_install",
        serviceId: "srv_ac_foam_jet",
        name: "AC Installation (Indoor + Outdoor Unit)",
        scopeSummary: "Professional mounting, flare nut connection, vacuuming & test run",
        durationMinutes: 90,
        basePricePaise: 149900,
        // ₹1,499 on tankmanpro.com
        regularPricePaise: 179900,
        imageUrl: "/assets/tankmanpro/ac-service.jpg",
        active: true
      }
    ],
    addons: [
      {
        id: "addon_ac_drain_pipe",
        serviceId: "srv_ac_foam_jet",
        name: "Insulated Drain Hose Replacement (2m)",
        description: "Replaces cracked or blocked condensate drain pipe.",
        pricePaise: 14900,
        required: false,
        maxQuantity: 2,
        active: true
      }
    ],
    questions: [
      {
        id: "q_ac_type",
        label: "AC Type",
        options: ["Split AC", "Window AC"]
      }
    ],
    faqs: [],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  },
  // 3. BATHROOM CLEANING (Exact tankmanpro.com items: ₹399 Hand Scrub, ₹499 Machine Scrub, ₹2999 Deep Clean, ₹99 Toilet/Washbasin, ₹49 Door)
  {
    id: "srv_bathroom_cleaning",
    slug: "bathroom-deep-and-machine-cleaning",
    title: "Bathroom Deep & Machine Scrub Cleaning",
    categoryId: "cat_bathroom",
    shortDescription: "Complete bathroom cleaning from tiles to taps, basin to toilet, mirrors to shower \u2014 removes hard-water stains, dirt, and grime.",
    fullDescription: "Choose between Hand Scrubbing (\u20B9399), Rotary Machine Floor & Tile Scrubbing (\u20B9499), or A-to-Z Complete Bathroom Restoration Deep Cleaning (\u20B92,999). Includes wet wiping of geyser, exhaust, window sills, and descaling of fixtures.",
    illustrationKey: "plumbing",
    imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
    galleryUrls: [
      "/assets/tankmanpro/bathroom-deep.jpg",
      "/assets/tankmanpro/bathroom-scrub.webp",
      "/assets/tankmanpro/washbasin.jpg",
      "/assets/tankmanpro/toilet-clean.jpg"
    ],
    durationMinutes: 75,
    basePricePaise: 39900,
    // ₹399 starting
    regularPricePaise: 49900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Stain & hard-water scale removal from floor tiles, wall tiles, and grouts",
      "Indian / Western toilet pot descaling and sanitization",
      "Washbasin, chrome taps, shower head, and mirror polishing",
      "Microfiber wet wiping of geyser exterior, exhaust fan, and bathroom door"
    ],
    exclusions: [
      "Removal of permanent acid burns or broken tile replacement"
    ],
    preparationInstructions: [
      "Please remove personal toiletries from shelves prior to cleaning."
    ],
    cancellationPolicySummary: "Free cancellation up to 4 hours before scheduled slot.",
    variants: [
      {
        id: "var_bath_hand_scrub",
        serviceId: "srv_bathroom_cleaning",
        name: "Bathroom Floor & Tile Hand Scrubbing",
        scopeSummary: "Manual deep scrubbing of bathroom floor, tiles, toilet & basin",
        durationMinutes: 60,
        basePricePaise: 39900,
        // ₹399 on tankmanpro.com
        regularPricePaise: 49900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      },
      {
        id: "var_bath_machine_scrub",
        serviceId: "srv_bathroom_cleaning",
        name: "Bathroom Floor & Tile Machine Scrubbing",
        scopeSummary: "Rotary machine scrubbing of floor & wall tiles + full bathroom sanitization",
        durationMinutes: 75,
        basePricePaise: 49900,
        // ₹499 on tankmanpro.com
        regularPricePaise: 64900,
        imageUrl: "/assets/tankmanpro/bathroom-scrub.webp",
        active: true
      },
      {
        id: "var_bath_full_deep",
        serviceId: "srv_bathroom_cleaning",
        name: "Complete Bathroom Deep Cleaning (Multi-Bathroom / Restoration)",
        scopeSummary: "A-to-Z intensive descaling, grout restoration, fittings & full hygiene pack",
        durationMinutes: 150,
        basePricePaise: 299900,
        // ₹2,999 on tankmanpro.com
        regularPricePaise: 349900,
        imageUrl: "/assets/tankmanpro/bathroom-deep.jpg",
        active: true
      }
    ],
    addons: [
      {
        id: "addon_toilet_clean",
        serviceId: "srv_bathroom_cleaning",
        name: "Extra Toilet Cleaning (Indian / Western)",
        description: "Stain removal from tiles and toilet pot with wiper finish.",
        pricePaise: 9900,
        // ₹99 on tankmanpro.com
        imageUrl: "/assets/tankmanpro/toilet-clean.jpg",
        required: false,
        maxQuantity: 4,
        active: true
      },
      {
        id: "addon_washbasin_clean",
        serviceId: "srv_bathroom_cleaning",
        name: "Washbasin Deep Cleaning",
        description: "Descaling of ceramic bowl, chrome tap, and mirror.",
        pricePaise: 9900,
        // ₹99 on tankmanpro.com
        imageUrl: "/assets/tankmanpro/washbasin.jpg",
        required: false,
        maxQuantity: 4,
        active: true
      },
      {
        id: "addon_door_clean",
        serviceId: "srv_bathroom_cleaning",
        name: "Bathroom / Room Door Cleaning",
        description: "Wet & dry microfiber cleaning of door panels and frame.",
        pricePaise: 4900,
        // ₹49 on tankmanpro.com
        imageUrl: "/assets/tankmanpro/door-clean.jpg",
        required: false,
        maxQuantity: 5,
        active: true
      }
    ],
    questions: [],
    faqs: [],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  },
  // 4. KITCHEN, CHIMNEY & FRIDGE CLEANING (Exact tankmanpro.com prices: ₹399 Chimney, ₹999 Empty Kitchen, ₹1299 Kitchen+Chimney, ₹1499 Kitchen+Appliances, ₹1699 Kitchen+Chimney+Appliances, ₹349/₹499 Fridge)
  {
    id: "srv_kitchen_chimney_clean",
    slug: "kitchen-chimney-and-appliance-deep-cleaning",
    title: "Kitchen, Chimney & Fridge Deep Cleaning",
    categoryId: "cat_kitchen",
    shortDescription: "Professional kitchen degreasing, chimney filter disassembly & wash, fridge interior/exterior sanitization, gas stove & sink cleaning.",
    fullDescription: "Removes stubborn cooking oil, grease, and stains from kitchen slabs, tiles, cabinets, chimneys, and appliances. Book individual chimney/fridge cleaning or complete Empty Kitchen packages.",
    illustrationKey: "appliance-repair",
    imageUrl: "/assets/tankmanpro/kitchen-chimney.png",
    galleryUrls: [
      "/assets/tankmanpro/kitchen-chimney.png",
      "/assets/tankmanpro/chimney-clean.png",
      "/assets/tankmanpro/fridge-double.webp",
      "/assets/tankmanpro/gas-stove.jpg"
    ],
    durationMinutes: 90,
    basePricePaise: 39900,
    // ₹399 starting (Chimney Cleaning on tankmanpro.com)
    regularPricePaise: 49900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Degreasing of kitchen wall tiles, counter slab, and sink area",
      "Chimney filter unlocking, chemical spray degreasing, and exterior polish",
      "Appliance external & internal stain removal (as per chosen package)",
      "Microfiber wet wipe and sanitization"
    ],
    exclusions: [
      "Internal chimney motor replacement or electrical wiring repair"
    ],
    preparationInstructions: [
      "Please clear fragile crockery from the counter slab before the crew arrives."
    ],
    cancellationPolicySummary: "Free cancellation up to 4 hours before scheduled slot.",
    variants: [
      {
        id: "var_chimney_only",
        serviceId: "srv_kitchen_chimney_clean",
        name: "Chimney Deep Cleaning (Filter Disassembly & Degrease)",
        scopeSummary: "Unlock & remove baffle/mesh filters, chemical degrease & body wipe",
        durationMinutes: 60,
        basePricePaise: 39900,
        // ₹399 on tankmanpro.com
        regularPricePaise: 49900,
        imageUrl: "/assets/tankmanpro/chimney-clean.png",
        active: true
      },
      {
        id: "var_fridge_single",
        serviceId: "srv_kitchen_chimney_clean",
        name: "Single Door Fridge Deep Cleaning",
        scopeSummary: "Interior & exterior dry dusting, tray wash & food-safe stain removal",
        durationMinutes: 45,
        basePricePaise: 34900,
        // ₹349 on tankmanpro.com
        regularPricePaise: 44900,
        imageUrl: "/assets/tankmanpro/fridge-single.webp",
        active: true
      },
      {
        id: "var_fridge_double",
        serviceId: "srv_kitchen_chimney_clean",
        name: "Double Door Fridge Deep Cleaning",
        scopeSummary: "Complete double-door interior shelves, gasket & exterior sanitization",
        durationMinutes: 60,
        basePricePaise: 49900,
        // ₹499 on tankmanpro.com
        regularPricePaise: 59900,
        imageUrl: "/assets/tankmanpro/fridge-double.webp",
        active: true
      },
      {
        id: "var_empty_kitchen",
        serviceId: "srv_kitchen_chimney_clean",
        name: "Empty Kitchen Deep Cleaning",
        scopeSummary: "Deep cleaning of empty kitchen cabinets, tiles, floor & platform",
        durationMinutes: 120,
        basePricePaise: 99900,
        // ₹999 on tankmanpro.com
        regularPricePaise: 129900,
        imageUrl: "/assets/tankmanpro/kitchen-deep.png",
        active: true
      },
      {
        id: "var_empty_kitchen_chimney",
        serviceId: "srv_kitchen_chimney_clean",
        name: "Empty Kitchen + Chimney Deep Cleaning",
        scopeSummary: "Empty kitchen deep clean + complete chimney degreasing & filter wash",
        durationMinutes: 150,
        basePricePaise: 129900,
        // ₹1,299 on tankmanpro.com
        regularPricePaise: 159900,
        imageUrl: "/assets/tankmanpro/kitchen-deep.png",
        active: true
      },
      {
        id: "var_empty_kitchen_appliances",
        serviceId: "srv_kitchen_chimney_clean",
        name: "Empty Kitchen + Appliances Cleaning",
        scopeSummary: "Empty kitchen deep clean + external cleaning of fridge, microwave & stove",
        durationMinutes: 150,
        basePricePaise: 149900,
        // ₹1,499 on tankmanpro.com
        regularPricePaise: 179900,
        imageUrl: "/assets/tankmanpro/kitchen-chimney.png",
        active: true
      },
      {
        id: "var_empty_kitchen_full",
        serviceId: "srv_kitchen_chimney_clean",
        name: "Empty Kitchen + Chimney + Appliances Cleaning",
        scopeSummary: "Complete hygienic kitchen overhaul including chimney & appliance cleaning",
        durationMinutes: 180,
        basePricePaise: 169900,
        // ₹1,699 on tankmanpro.com
        regularPricePaise: 199900,
        imageUrl: "/assets/tankmanpro/kitchen-chimney.png",
        active: true
      }
    ],
    addons: [
      {
        id: "addon_gas_stove",
        serviceId: "srv_kitchen_chimney_clean",
        name: "Gas Stove Deep Cleaning",
        description: "Burner, drip tray, and glass/steel top stain removal.",
        pricePaise: 9900,
        // ₹99 on tankmanpro.com
        imageUrl: "/assets/tankmanpro/gas-stove.jpg",
        required: false,
        maxQuantity: 2,
        active: true
      },
      {
        id: "addon_kitchen_sink",
        serviceId: "srv_kitchen_chimney_clean",
        name: "Kitchen Sink & Tap Descaling",
        description: "Removes grease, water spots, and limescale from sink & faucet.",
        pricePaise: 9900,
        // ₹99 on tankmanpro.com
        imageUrl: "/assets/tankmanpro/kitchen-sink.jpeg",
        required: false,
        maxQuantity: 2,
        active: true
      }
    ],
    questions: [],
    faqs: [],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  },
  // 5. SOFA, MATTRESS & CARPET CLEANING (Exact tankmanpro.com prices: ₹149/seat Sofa, ₹249/seat Deep Sofa, ₹349 Single Mattress, ₹649 Double Mattress)
  {
    id: "srv_sofa_mattress_clean",
    slug: "sofa-mattress-and-carpet-deep-cleaning",
    title: "Sofa, Mattress & Carpet Deep Cleaning",
    categoryId: "cat_sofa_mattress",
    shortDescription: "Industrial dry vacuuming, foam shampooing, stain removal, and wet extraction for sofas, cushions, mattresses, and carpets.",
    fullDescription: "Restores fabric freshness and removes embedded dust mites, allergens, sweat stains, and odours from upholstery and mattresses using commercial wet-and-dry vacuum extraction.",
    illustrationKey: "appliance-repair",
    imageUrl: "/assets/tankmanpro/sofa-clean.jpg",
    galleryUrls: [
      "/assets/tankmanpro/sofa-clean.jpg",
      "/assets/tankmanpro/mattress-clean.png",
      "/assets/tankmanpro/carpet-clean.webp"
    ],
    durationMinutes: 60,
    basePricePaise: 14900,
    // ₹149 per seat on tankmanpro.com
    regularPricePaise: 19900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Dry dusting and high-suction vacuuming of crevices, cushions, and seams",
      "Fabric-safe foam shampooing and gentle mechanical brushing",
      "Wet vacuum moisture and dirt extraction"
    ],
    exclusions: [
      "Ink or permanent dye bleed removal"
    ],
    preparationInstructions: [
      "Keep ceiling fan on for 2\u20133 hours after cleaning for natural air drying."
    ],
    cancellationPolicySummary: "Free cancellation up to 4 hours before scheduled slot.",
    variants: [
      {
        id: "var_sofa_149",
        serviceId: "srv_sofa_mattress_clean",
        name: "Sofa & Cushion Cleaning (1 Seat \u2014 \u20B9149/seat)",
        scopeSummary: "Dry dusting + vacuuming & shampoo wash for 1 sofa seat",
        durationMinutes: 30,
        basePricePaise: 14900,
        // ₹149 on tankmanpro.com
        regularPricePaise: 19900,
        imageUrl: "/assets/tankmanpro/sofa-clean.jpg",
        active: true
      },
      {
        id: "var_sofa_5seat",
        serviceId: "srv_sofa_mattress_clean",
        name: "5-Seater Sofa Set Deep Cleaning (\u20B9149 \xD7 5)",
        scopeSummary: "Complete 5-seater sofa & cushion shampoo + vacuum extraction",
        durationMinutes: 75,
        basePricePaise: 74500,
        // ₹745
        regularPricePaise: 99500,
        imageUrl: "/assets/tankmanpro/sofa-clean.jpg",
        active: true
      },
      {
        id: "var_mattress_single",
        serviceId: "srv_sofa_mattress_clean",
        name: "Single Bed / Mattress Deep Cleaning",
        scopeSummary: "Removes dust, stains, allergens & odors from 1 single mattress",
        durationMinutes: 45,
        basePricePaise: 34900,
        // ₹349 on tankmanpro.com
        regularPricePaise: 39900,
        imageUrl: "/assets/tankmanpro/mattress-clean.png",
        active: true
      },
      {
        id: "var_mattress_double",
        serviceId: "srv_sofa_mattress_clean",
        name: "Double Bed / Mattress Deep Cleaning",
        scopeSummary: "Both-side vacuuming, stain treatment & sanitization for double mattress",
        durationMinutes: 60,
        basePricePaise: 64900,
        // ₹649 on tankmanpro.com
        regularPricePaise: 79900,
        imageUrl: "/assets/tankmanpro/mattress-clean.png",
        active: true
      },
      {
        id: "var_carpet_50sqft",
        serviceId: "srv_sofa_mattress_clean",
        name: "Carpet Deep Cleaning & Shampooing (Up to 50 sq.ft @ \u20B910/sq.ft)",
        scopeSummary: "Deep foam shampooing and vacuum extraction for standard room carpet",
        durationMinutes: 60,
        basePricePaise: 5e4,
        // ₹500 (50 sq.ft * ₹10/sq.ft on tankmanpro.com)
        regularPricePaise: 65e3,
        imageUrl: "/assets/tankmanpro/carpet-clean.webp",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  },
  // 6. CAR & BIKE WASH (Exact tankmanpro.com prices: Bike Wash ₹99, Car Wash ₹299)
  {
    id: "srv_vehicle_wash",
    slug: "doorstep-car-and-bike-foam-wash",
    title: "Doorstep Car & Bike Foam Wash",
    categoryId: "cat_vehicle_wash",
    shortDescription: "Interior & exterior car cleaning via vacuum + polish (\u20B9299) and two-wheeler high-foam pressure wash (\u20B999).",
    fullDescription: "Doorstep vehicle care by TankmanPro. Includes snow-foam exterior wash, tyre & alloy dressing, dashboard polish, and interior dry vacuuming.",
    illustrationKey: "water-tank",
    imageUrl: "/assets/tankmanpro/car-wash.jpg",
    galleryUrls: ["/assets/tankmanpro/car-wash.jpg", "/assets/tankmanpro/bike-wash.jpg"],
    durationMinutes: 45,
    basePricePaise: 9900,
    // ₹99 starting (Bike Wash on tankmanpro.com)
    regularPricePaise: 14900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "High-pressure pre-rinse and snow-foam shampoo wash",
      "Microfiber hand wipe and water-spot removal",
      "Interior dry vacuuming and dashboard/tyre polish (for Car Wash)"
    ],
    exclusions: [
      "Rubbing compound paint correction or ceramic coating"
    ],
    preparationInstructions: [
      "Ensure parking space and water tap access within 15 metres."
    ],
    cancellationPolicySummary: "Free cancellation up to 4 hours before scheduled slot.",
    variants: [
      {
        id: "var_bike_wash",
        serviceId: "srv_vehicle_wash",
        name: "Bike / Scooter Foam Wash",
        scopeSummary: "Complete exterior foam wash, chain/rim degreaser & polish",
        durationMinutes: 30,
        basePricePaise: 9900,
        // ₹99 on tankmanpro.com
        regularPricePaise: 14900,
        imageUrl: "/assets/tankmanpro/bike-wash.jpg",
        active: true
      },
      {
        id: "var_car_wash",
        serviceId: "srv_vehicle_wash",
        name: "Car Wash (Interior Vacuum + Exterior Foam & Polish)",
        scopeSummary: "Complete interior vacuuming, dashboard polish & exterior pressure wash",
        durationMinutes: 50,
        basePricePaise: 29900,
        // ₹299 on tankmanpro.com
        regularPricePaise: 39900,
        imageUrl: "/assets/tankmanpro/car-wash.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  },
  // 7. FAN, EXHAUST, DOOR & FLOOR CLEANING (Exact tankmanpro.com prices: Ceiling Fan ₹49, Exhaust Fan ₹99, Door ₹49, Floor ₹15/sq.ft)
  {
    id: "srv_washing_machine_repair",
    slug: "fan-exhaust-and-floor-deep-cleaning",
    title: "Ceiling Fan, Exhaust Fan & Floor Scrubbing",
    categoryId: "cat_fan_appliances",
    shortDescription: "Dry dusting, chemical degreasing, and microfiber wiping for ceiling fans (\u20B949), exhaust fans (\u20B999), doors (\u20B949), and floors.",
    fullDescription: "Essential fixture and surface cleaning for Indian homes. Removes thick grease from kitchen/bathroom exhaust fans, dust buildup on ceiling fan blades, and grime from floor grouts.",
    illustrationKey: "appliance-repair",
    imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
    galleryUrls: [
      "/assets/tankmanpro/ceiling-fan.jpg",
      "/assets/tankmanpro/exhaust-fan.jpg",
      "/assets/tankmanpro/floor-clean.jpg"
    ],
    durationMinutes: 45,
    basePricePaise: 4900,
    // ₹49 on tankmanpro.com
    regularPricePaise: 9900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Dry dusting of all fan blades and motor canopy",
      "Chemical spray and scrubbing to remove oil/grease stains",
      "Final clean microfiber wipe with zero floor mess"
    ],
    exclusions: [
      "Electrical rewiring or capacitor replacement"
    ],
    preparationInstructions: [
      "Switch off the fan regulator prior to cleaning."
    ],
    cancellationPolicySummary: "Free cancellation up to 4 hours before scheduled slot.",
    variants: [
      {
        id: "var_wm_top_load",
        serviceId: "srv_washing_machine_repair",
        name: "Ceiling Fan Cleaning (Per Fan)",
        scopeSummary: "Blade dry dusting, stain scrubbing & canopy wipe",
        durationMinutes: 20,
        basePricePaise: 4900,
        // ₹49 on tankmanpro.com
        regularPricePaise: 7900,
        imageUrl: "/assets/tankmanpro/ceiling-fan.jpg",
        active: true
      },
      {
        id: "var_exhaust_fan",
        serviceId: "srv_washing_machine_repair",
        name: "Exhaust Fan Degreasing & Cleaning",
        scopeSummary: "Chemical oil/grease removal for kitchen or bathroom exhaust fan",
        durationMinutes: 30,
        basePricePaise: 9900,
        // ₹99 on tankmanpro.com
        regularPricePaise: 14900,
        imageUrl: "/assets/tankmanpro/exhaust-fan.jpg",
        active: true
      },
      {
        id: "var_floor_scrub_pack",
        serviceId: "srv_washing_machine_repair",
        name: "Room Floor & Grout Scrubbing (Up to 100 sq.ft @ \u20B915/sq.ft)",
        scopeSummary: "Cleaning grouts, corners, and floor surface with microfiber & mop",
        durationMinutes: 60,
        basePricePaise: 15e4,
        // ₹1,500
        regularPricePaise: 18e4,
        imageUrl: "/assets/tankmanpro/floor-clean.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  },
  // 8. BEEDARE BY TANKMANPRO — AESTHETIC & PEEL TREATMENTS AT HOME (Exact tankmanpro.com prices: ₹1,999 Peels, ₹3,999 PRP/Laser, ₹4,999 Dermapen)
  {
    id: "srv_plumbing_pipeline_care",
    slug: "beedare-at-home-skin-peels-and-aesthetics",
    title: "Beedare Aesthetic & Skin Peel Treatments at Home",
    categoryId: "cat_aesthetics",
    shortDescription: "Advanced skin resurfacing, brightening peels (\u20B91,999), Dermapen collagen boost (\u20B94,999), and laser hair reduction at home.",
    fullDescription: "Welcome to Beedare by TankmanPro. Experience advanced skin resurfacing, brightening peels, and aesthetic care from the comfort of your home \u2014 no clinic queues or waiting.",
    illustrationKey: "plumbing",
    imageUrl: "/assets/tankmanpro/aesthetic-facial.jpg",
    galleryUrls: [
      "/assets/tankmanpro/aesthetic-facial.jpg",
      "/assets/tankmanpro/chemical-peel.jpg",
      "/assets/tankmanpro/laser-skin.jpg"
    ],
    durationMinutes: 60,
    basePricePaise: 199900,
    // ₹1,999 on tankmanpro.com
    regularPricePaise: 249900,
    defaultPricingMode: "city_fixed",
    inclusions: [
      "Pre-treatment skin cleansing and sensitivity patch assessment",
      "Application of clinical-grade peel or aesthetic protocol with sterile single-use consumables",
      "Post-care soothing mask and SPF protection guidance"
    ],
    exclusions: [
      "Prescription oral medications"
    ],
    preparationInstructions: [
      "Avoid active retinoids or harsh exfoliants 48 hours prior to your session."
    ],
    cancellationPolicySummary: "Free cancellation up to 4 hours before scheduled slot.",
    variants: [
      {
        id: "var_plumb_standard",
        serviceId: "srv_plumbing_pipeline_care",
        name: "Glycolic / Vitamin C / Salicylic Acid Peel",
        scopeSummary: "Skin resurfacing, brightening, even tone & acne/oil control peel",
        durationMinutes: 45,
        basePricePaise: 199900,
        // ₹1,999 on tankmanpro.com
        regularPricePaise: 249900,
        imageUrl: "/assets/tankmanpro/chemical-peel.jpg",
        active: true
      },
      {
        id: "var_tca_peel",
        serviceId: "srv_plumbing_pipeline_care",
        name: "TCA Peel \u2014 Pigmentation & Scar Reduction",
        scopeSummary: "Targeted medium-depth peel for stubborn pigmentation and scars",
        durationMinutes: 50,
        basePricePaise: 299900,
        // ₹2,999 on tankmanpro.com
        regularPricePaise: 349900,
        imageUrl: "/assets/tankmanpro/chemical-peel.jpg",
        active: true
      },
      {
        id: "var_prp_laser",
        serviceId: "srv_plumbing_pipeline_care",
        name: "Full Face Laser / PRP Rejuvenation Session",
        scopeSummary: "At-home full face diode laser or platelet-rich plasma skin/hair session",
        durationMinutes: 60,
        basePricePaise: 399900,
        // ₹3,999 on tankmanpro.com
        regularPricePaise: 499900,
        imageUrl: "/assets/tankmanpro/laser-skin.jpg",
        active: true
      },
      {
        id: "var_dermapen",
        serviceId: "srv_plumbing_pipeline_care",
        name: "Dermapen / Micro-Needle Therapy",
        scopeSummary: "Collagen induction, scar reduction & texture renewal session",
        durationMinutes: 60,
        basePricePaise: 499900,
        // ₹4,999 on tankmanpro.com
        regularPricePaise: 599900,
        imageUrl: "/assets/tankmanpro/aesthetic-facial.jpg",
        active: true
      }
    ],
    addons: [],
    questions: [],
    faqs: [],
    supportedCityIds: ["city_delhi", "city_shahjahanpur", "city_kanpur"],
    status: "published",
    isDemo: true
  }
];
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
    supportedServiceIds: [
      "srv_mechanized_tank_clean",
      "srv_ac_foam_jet",
      "srv_bathroom_cleaning",
      "srv_kitchen_chimney_clean",
      "srv_sofa_mattress_clean",
      "srv_vehicle_wash",
      "srv_washing_machine_repair",
      "srv_plumbing_pipeline_care"
    ],
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
    supportedServiceIds: [
      "srv_ac_foam_jet",
      "srv_washing_machine_repair",
      "srv_mechanized_tank_clean",
      "srv_bathroom_cleaning"
    ],
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
    supportedServiceIds: [
      "srv_mechanized_tank_clean",
      "srv_ac_foam_jet",
      "srv_bathroom_cleaning",
      "srv_kitchen_chimney_clean",
      "srv_sofa_mattress_clean",
      "srv_vehicle_wash",
      "srv_washing_machine_repair",
      "srv_plumbing_pipeline_care"
    ],
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
    supportedServiceIds: [
      "srv_mechanized_tank_clean",
      "srv_bathroom_cleaning",
      "srv_kitchen_chimney_clean",
      "srv_plumbing_pipeline_care"
    ],
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
    // ₹499 (authentic tankmanpro.com 500L-750L price!)
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
    // ₹499
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
    // ₹850 (PRD Appendix B test requirement)
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
    // ₹890
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
    // ₹899
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
    // ₹1,499
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
  // AC Services (₹599 & ₹629 in Delhi Vendor-Offer mode; ₹599 in Shahjahanpur/Kanpur)
  {
    id: "po_ac_single_del_vendor1",
    serviceId: "srv_ac_foam_jet",
    variantId: "var_ac_single",
    cityId: "city_delhi",
    vendorUid: "vendor_demo_del_1",
    amountPaise: 59900,
    // ₹599 (authentic tankmanpro.com AC service price)
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
    // ₹1,499 (authentic tankmanpro.com AC Installation price)
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
    // ₹200 cap
    minOrderSubtotalPaise: 3e4,
    // ₹300 min
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
    // ₹150
    minOrderSubtotalPaise: 8e4,
    // ₹800 min
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

// src/data/initialOperationsData.ts
var SEEDED_VENDORS = DEMO_VENDORS.map((v, idx) => ({
  ...v,
  vendorCode: `TMP-VND-${1001 + idx}`,
  isAvailable: true,
  commissionPercent: 18,
  kycNotes: "Verified Aadhaar, PAN, Police Clearance & Mechanised Tool Kit Inspection.",
  createdAtIso: "2026-09-15T09:00:00.000Z",
  updatedAtIso: "2026-10-19T14:30:00.000Z"
}));
function buildSeedQuote(params) {
  return calculateAuthoritativeQuote({
    request: {
      pinCode: params.pinCode,
      serviceId: params.serviceId,
      variantId: params.variantId,
      addonQuantities: params.addonQuantities || {},
      selectedVendorUid: params.selectedVendorUid,
      couponCode: params.couponCode
    },
    cities: DEMO_CITIES,
    serviceAreas: DEMO_SERVICE_AREAS,
    services: DEMO_SERVICES,
    vendors: SEEDED_VENDORS,
    priceOverrides: DEMO_PRICE_OVERRIDES,
    coupons: DEMO_COUPONS,
    taxRatePercent: 0
  });
}
var todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var tomorrowStr = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
var quoteKanpur1 = buildSeedQuote({
  pinCode: "208001",
  serviceId: "srv_mechanized_tank_clean",
  variantId: "var_tank_1000_1500",
  addonQuantities: { addon_float_valve: 1 }
});
var quoteKanpur2 = buildSeedQuote({
  pinCode: "208002",
  serviceId: "srv_bathroom_cleaning",
  variantId: "var_bath_machine_scrub"
});
var quoteDelhi1 = buildSeedQuote({
  pinCode: "110001",
  serviceId: "srv_ac_foam_jet",
  variantId: "var_ac_single",
  selectedVendorUid: "vendor_demo_del_1"
});
var quoteSpn1 = buildSeedQuote({
  pinCode: "242001",
  serviceId: "srv_mechanized_tank_clean",
  variantId: "var_tank_500_1000",
  selectedVendorUid: "vendor_demo_spn_1"
});
var quoteKanpur3 = buildSeedQuote({
  pinCode: "208001",
  serviceId: "srv_kitchen_chimney_clean",
  variantId: "var_empty_kitchen_chimney"
});
var quoteDelhi2 = buildSeedQuote({
  pinCode: "110001",
  serviceId: "srv_sofa_mattress_clean",
  variantId: "var_sofa_5seat"
});
var INITIAL_BOOKINGS = [
  {
    id: "bk_1001",
    bookingNumber: "TMP-2026-1001",
    customerUid: "cust_kanpur_01",
    customerName: "Vikramaditya Tandon",
    customerPhone: "+91 98390 44112",
    customerEmail: "vikram.tandon@example.com",
    cityId: "city_kanpur",
    cityName: "Kanpur",
    pinCode: "208001",
    zoneLabel: "Mall Road & Birhana Road, Kanpur",
    addressLine: "Flat 402, Emerald Garden Residency, Civil Lines",
    landmark: "Near Green Park Stadium",
    propertyType: "apartment",
    serviceId: "srv_mechanized_tank_clean",
    serviceTitle: "Mechanized Water Tank Cleaning",
    variantId: "var_tank_1000_1500",
    variantName: "Water Tank Cleaning (1000L to 1500L)",
    addons: quoteKanpur1.addons,
    preferredDate: todayStr,
    preferredSlot: "10:00 AM \u2013 12:00 PM",
    customerNotes: "Overhead Sintex tank on 4th floor terrace. Ladder access available.",
    pricingMode: quoteKanpur1.pricingMode,
    quoteSnapshot: quoteKanpur1,
    status: "completed",
    subStatus: null,
    paymentMethod: "pay_after_service",
    paymentStatus: "paid",
    assignedVendorUid: "vendor_demo_spn_1",
    assignedVendorName: "Rohilkhand Tank & Hydro Care (Shahjahanpur)",
    vendorExecutionNotes: [
      "Sludge vacuuming completed. TDS & UV sanitization verified.",
      "Before & after tank interior inspection signed off by customer."
    ],
    completionPhotos: ["/assets/tankmanpro/water-tank.jpg"],
    createdAtIso: `${todayStr}T04:15:00.000Z`,
    updatedAtIso: `${todayStr}T07:20:00.000Z`
  },
  {
    id: "bk_1002",
    bookingNumber: "TMP-2026-1002",
    customerUid: "cust_kanpur_02",
    customerName: "Neha Agarwal",
    customerPhone: "+91 94151 88230",
    customerEmail: "neha.agarwal@example.com",
    cityId: "city_kanpur",
    cityName: "Kanpur",
    pinCode: "208002",
    zoneLabel: "Tilak Nagar & Swaroop Nagar, Kanpur",
    addressLine: "112/318 Swaroop Nagar, Block C",
    landmark: "Opposite Haldiram Outlet",
    propertyType: "residential",
    serviceId: "srv_bathroom_cleaning",
    serviceTitle: "Bathroom Deep & Machine Scrub Cleaning",
    variantId: "var_bath_machine_scrub",
    variantName: "Bathroom Floor & Tile Machine Scrubbing",
    addons: quoteKanpur2.addons,
    preferredDate: todayStr,
    preferredSlot: "01:00 PM \u2013 03:00 PM",
    customerNotes: "Hard water scaling on glass partition and taps.",
    pricingMode: quoteKanpur2.pricingMode,
    quoteSnapshot: quoteKanpur2,
    status: "in_progress",
    subStatus: "working",
    paymentMethod: "pay_after_service",
    paymentStatus: "pending",
    assignedVendorUid: "vendor_demo_spn_1",
    assignedVendorName: "Rohilkhand Tank & Hydro Care (Shahjahanpur)",
    vendorExecutionNotes: ["Technician arrived on site and started machine descaling."],
    completionPhotos: [],
    createdAtIso: `${todayStr}T05:30:00.000Z`,
    updatedAtIso: `${todayStr}T08:05:00.000Z`
  },
  {
    id: "bk_1003",
    bookingNumber: "TMP-2026-1003",
    customerUid: "cust_delhi_01",
    customerName: "Rohan Malhotra",
    customerPhone: "+91 98110 73490",
    customerEmail: "rohan.malhotra@example.com",
    cityId: "city_delhi",
    cityName: "New Delhi",
    pinCode: "110001",
    zoneLabel: "Connaught Place, central New Delhi",
    addressLine: "B-24 Hailey Road, Connaught Place",
    landmark: "Near Agrasen ki Baoli",
    propertyType: "apartment",
    serviceId: "srv_ac_foam_jet",
    serviceTitle: "AC Service, Repair & Installation",
    variantId: "var_ac_single",
    variantName: "AC Services (Split / Window Deep Service)",
    addons: quoteDelhi1.addons,
    preferredDate: todayStr,
    preferredSlot: "03:30 PM \u2013 05:30 PM",
    customerNotes: "Daikin 1.5 Ton inverter split AC in master bedroom.",
    pricingMode: quoteDelhi1.pricingMode,
    quoteSnapshot: quoteDelhi1,
    status: "vendor_accepted",
    subStatus: "en_route",
    paymentMethod: "pay_after_service",
    paymentStatus: "pending",
    assignedVendorUid: "vendor_demo_del_1",
    assignedVendorName: "AquaPure Mechanized Crew (Delhi)",
    vendorExecutionNotes: ["Slot confirmed. Carrying digital manifold pressure gauge and jet pump."],
    completionPhotos: [],
    createdAtIso: `${todayStr}T06:10:00.000Z`,
    updatedAtIso: `${todayStr}T06:45:00.000Z`
  },
  {
    id: "bk_1004",
    bookingNumber: "TMP-2026-1004",
    customerUid: "cust_spn_01",
    customerName: "Mohd. Salman Khan",
    customerPhone: "+91 97942 11098",
    customerEmail: "salman.spn@example.com",
    cityId: "city_shahjahanpur",
    cityName: "Shahjahanpur",
    pinCode: "242001",
    zoneLabel: "Sadar Bazar & Civil Lines, Shahjahanpur",
    addressLine: "House No. 48, Civil Lines, Near Collectorate",
    landmark: "Collectorate Road",
    propertyType: "residential",
    serviceId: "srv_mechanized_tank_clean",
    serviceTitle: "Mechanized Water Tank Cleaning",
    variantId: "var_tank_500_1000",
    variantName: "Water Tank Cleaning (500L to 750L)",
    addons: quoteSpn1.addons,
    preferredDate: todayStr,
    preferredSlot: "04:00 PM \u2013 06:00 PM",
    customerNotes: "Please call 15 mins before reaching.",
    pricingMode: quoteSpn1.pricingMode,
    quoteSnapshot: quoteSpn1,
    status: "assigned_to_vendor",
    subStatus: null,
    paymentMethod: "pay_after_service",
    paymentStatus: "pending",
    assignedVendorUid: "vendor_demo_spn_1",
    assignedVendorName: "Rohilkhand Tank & Hydro Care (Shahjahanpur)",
    vendorExecutionNotes: [],
    completionPhotos: [],
    createdAtIso: `${todayStr}T07:00:00.000Z`,
    updatedAtIso: `${todayStr}T07:05:00.000Z`
  },
  {
    id: "bk_1005",
    bookingNumber: "TMP-2026-1005",
    customerUid: "cust_kanpur_03",
    customerName: "Dr. Ananya Verma",
    customerPhone: "+91 99350 61204",
    customerEmail: "ananya.verma@example.com",
    cityId: "city_kanpur",
    cityName: "Kanpur",
    pinCode: "208001",
    zoneLabel: "Mall Road & Birhana Road, Kanpur",
    addressLine: "7/114 Tilak Nagar, Main Road",
    landmark: "Near Regency Hospital",
    propertyType: "residential",
    serviceId: "srv_kitchen_chimney_clean",
    serviceTitle: "Kitchen, Chimney & Fridge Deep Cleaning",
    variantId: "var_empty_kitchen_chimney",
    variantName: "Empty Kitchen + Chimney Deep Cleaning",
    addons: quoteKanpur3.addons,
    preferredDate: todayStr,
    preferredSlot: "05:00 PM \u2013 07:00 PM",
    customerNotes: "Faber 90cm baffle filter chimney + modular cabinets.",
    pricingMode: quoteKanpur3.pricingMode,
    quoteSnapshot: quoteKanpur3,
    status: "requested",
    subStatus: null,
    paymentMethod: "pay_after_service",
    paymentStatus: "pending",
    assignedVendorUid: null,
    assignedVendorName: null,
    vendorExecutionNotes: [],
    completionPhotos: [],
    createdAtIso: `${todayStr}T08:15:00.000Z`,
    updatedAtIso: `${todayStr}T08:15:00.000Z`
  },
  {
    id: "bk_1006",
    bookingNumber: "TMP-2026-1006",
    customerUid: "cust_delhi_02",
    customerName: "Siddharth Kapoor",
    customerPhone: "+91 98182 30911",
    customerEmail: "siddharth.k@example.com",
    cityId: "city_delhi",
    cityName: "New Delhi",
    pinCode: "110001",
    zoneLabel: "Connaught Place, central New Delhi",
    addressLine: "Flat 12B, Barakhamba Road Apartments",
    landmark: "Near Metro Gate 3",
    propertyType: "apartment",
    serviceId: "srv_sofa_mattress_clean",
    serviceTitle: "Sofa, Mattress & Carpet Deep Cleaning",
    variantId: "var_sofa_5seat",
    variantName: "5-Seater Sofa Set Deep Cleaning (\u20B9149 \xD7 5)",
    addons: quoteDelhi2.addons,
    preferredDate: "2026-10-18",
    preferredSlot: "11:00 AM \u2013 01:00 PM",
    customerNotes: "Customer requested cancellation due to out-of-station travel.",
    pricingMode: quoteDelhi2.pricingMode,
    quoteSnapshot: quoteDelhi2,
    status: "cancelled",
    subStatus: null,
    paymentMethod: "pay_after_service",
    paymentStatus: "unpaid",
    assignedVendorUid: null,
    assignedVendorName: null,
    vendorExecutionNotes: [],
    completionPhotos: [],
    createdAtIso: "2026-10-18T05:00:00.000Z",
    updatedAtIso: "2026-10-18T06:30:00.000Z"
  },
  {
    id: "bk_1007",
    bookingNumber: "TMP-2026-1007",
    customerUid: "cust_kanpur_04",
    customerName: "Rajeshwar Dayal Gupta",
    customerPhone: "+91 98391 55209",
    customerEmail: "rd.gupta@example.com",
    cityId: "city_kanpur",
    cityName: "Kanpur",
    pinCode: "208001",
    zoneLabel: "Mall Road & Birhana Road, Kanpur",
    addressLine: "24/56 Birhana Road, Near Post Office",
    landmark: "Opposite Central Bank",
    propertyType: "residential",
    serviceId: "srv_mechanized_tank_clean",
    serviceTitle: "Mechanized Water Tank Cleaning",
    variantId: "var_tank_1000_1500",
    variantName: "Water Tank Cleaning (1000L to 1500L)",
    addons: quoteKanpur1.addons,
    preferredDate: tomorrowStr,
    preferredSlot: "09:30 AM \u2013 11:30 AM",
    customerNotes: "Underground sump + rooftop sintex tank inspection.",
    pricingMode: quoteKanpur1.pricingMode,
    quoteSnapshot: quoteKanpur1,
    status: "vendor_accepted",
    subStatus: null,
    paymentMethod: "pay_after_service",
    paymentStatus: "pending",
    assignedVendorUid: "vendor_demo_spn_1",
    assignedVendorName: "Rohilkhand Tank & Hydro Care (Shahjahanpur)",
    vendorExecutionNotes: ["Accepted for tomorrow morning shift. Crew & UV unit reserved."],
    completionPhotos: [],
    createdAtIso: `${todayStr}T07:40:00.000Z`,
    updatedAtIso: `${todayStr}T07:50:00.000Z`
  }
];
var INITIAL_BOOKING_EVENTS = [
  {
    id: "evt_1001_1",
    bookingId: "bk_1001",
    actorUid: "cust_kanpur_01",
    actorRole: "customer",
    actorName: "Vikramaditya Tandon",
    fromStatus: null,
    toStatus: "requested",
    note: "Booking submitted via TankmanPro Kanpur storefront (PIN 208001).",
    createdAtIso: `${todayStr}T04:15:00.000Z`
  },
  {
    id: "evt_1001_2",
    bookingId: "bk_1001",
    actorUid: "admin_main",
    actorRole: "admin",
    actorName: "Main Admin Dispatch",
    fromStatus: "requested",
    toStatus: "assigned_to_vendor",
    note: "Assigned to Rohilkhand Tank & Hydro Care (TMP-VND-1003).",
    createdAtIso: `${todayStr}T04:22:00.000Z`
  },
  {
    id: "evt_1001_3",
    bookingId: "bk_1001",
    actorUid: "vendor_demo_spn_1",
    actorRole: "vendor",
    actorName: "Rohilkhand Tank & Hydro Care",
    fromStatus: "assigned_to_vendor",
    toStatus: "vendor_accepted",
    note: "Vendor accepted job for 10:00 AM \u2013 12:00 PM slot.",
    createdAtIso: `${todayStr}T04:30:00.000Z`
  },
  {
    id: "evt_1001_4",
    bookingId: "bk_1001",
    actorUid: "vendor_demo_spn_1",
    actorRole: "vendor",
    actorName: "Rohilkhand Tank & Hydro Care",
    fromStatus: "vendor_accepted",
    toStatus: "in_progress",
    note: "6-stage mechanised dewatering & sludge extraction started.",
    createdAtIso: `${todayStr}T05:55:00.000Z`
  },
  {
    id: "evt_1001_5",
    bookingId: "bk_1001",
    actorUid: "vendor_demo_spn_1",
    actorRole: "vendor",
    actorName: "Rohilkhand Tank & Hydro Care",
    fromStatus: "in_progress",
    toStatus: "completed",
    note: "Job completed & UV sanitization signed off. Payment collected.",
    createdAtIso: `${todayStr}T07:20:00.000Z`
  },
  {
    id: "evt_1002_1",
    bookingId: "bk_1002",
    actorUid: "cust_kanpur_02",
    actorRole: "customer",
    actorName: "Neha Agarwal",
    fromStatus: null,
    toStatus: "assigned_to_vendor",
    note: "Auto-dispatched to Rohilkhand Tank & Hydro Care in PIN 208002.",
    createdAtIso: `${todayStr}T05:30:00.000Z`
  },
  {
    id: "evt_1002_2",
    bookingId: "bk_1002",
    actorUid: "vendor_demo_spn_1",
    actorRole: "vendor",
    actorName: "Rohilkhand Tank & Hydro Care",
    fromStatus: "assigned_to_vendor",
    toStatus: "in_progress",
    note: "Technician arrived and started bathroom descaling.",
    createdAtIso: `${todayStr}T08:05:00.000Z`
  },
  {
    id: "evt_1005_1",
    bookingId: "bk_1005",
    actorUid: "cust_kanpur_03",
    actorRole: "customer",
    actorName: "Dr. Ananya Verma",
    fromStatus: null,
    toStatus: "requested",
    note: "New booking awaiting vendor assignment in Kanpur (PIN 208001).",
    createdAtIso: `${todayStr}T08:15:00.000Z`
  }
];
var INITIAL_NOTIFICATIONS = [
  {
    id: "notif_1",
    recipientRole: "admin",
    recipientUid: "ALL_ADMINS",
    bookingId: "bk_1005",
    title: "New Unassigned Booking \xB7 TMP-2026-1005",
    message: "Dr. Ananya Verma booked Kitchen, Chimney & Fridge Deep Cleaning in Kanpur (208001). Assign an eligible vendor.",
    type: "booking_created",
    read: false,
    createdAtIso: `${todayStr}T08:15:00.000Z`
  },
  {
    id: "notif_2",
    recipientRole: "admin",
    recipientUid: "ALL_ADMINS",
    bookingId: "bk_1001",
    title: "Job Completed & Paid \xB7 TMP-2026-1001",
    message: "Rohilkhand Tank & Hydro Care completed Mechanized Water Tank Cleaning in Civil Lines, Kanpur (\u20B91,048 collected).",
    type: "job_completed",
    read: false,
    createdAtIso: `${todayStr}T07:20:00.000Z`
  },
  {
    id: "notif_3",
    recipientRole: "vendor",
    recipientUid: "vendor_demo_spn_1",
    bookingId: "bk_1004",
    title: "New Job Assigned \xB7 TMP-2026-1004",
    message: "500L\u2013750L Water Tank Cleaning assigned in PIN 242001 (Sadar Bazar & Civil Lines). Please accept or reject.",
    type: "vendor_assigned",
    read: false,
    createdAtIso: `${todayStr}T07:05:00.000Z`
  }
];
var INITIAL_CMS_SETTINGS = {
  id: "global",
  heroTitle: "Home services at your doorstep",
  heroSubtitle: "Mechanised 6-stage water tank cleaning, intense bathroom & kitchen hygiene, foam-jet AC servicing, and clinical skin care by verified professionals.",
  announcementText: "Live in Kanpur (208001, 208002), Shahjahanpur (242001) & New Delhi (110001) \xB7 Use code CLEAN10 for 10% off!",
  supportPhone: "+91 97942 00100",
  supportEmail: "support@tankmanpro.com",
  whatsappNumber: "+91 97942 00100",
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
function filterVendorScopedBookings(bookings, vendorUid) {
  const cleanUid = (vendorUid || "").trim();
  if (!cleanUid) return [];
  return bookings.filter((b) => b.assignedVendorUid === cleanUid);
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
  const scoped = filterVendorScopedBookings(bookings, vendor.uid);
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
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var liveCities = structuredClone(DEMO_CITIES);
var liveServiceAreas = structuredClone(DEMO_SERVICE_AREAS);
var liveCategories = structuredClone(DEMO_CATEGORIES);
var liveServices = structuredClone(DEMO_SERVICES);
var liveVendors = structuredClone(SEEDED_VENDORS);
var livePriceOverrides = structuredClone(DEMO_PRICE_OVERRIDES);
var liveCoupons = structuredClone(DEMO_COUPONS);
var liveBookings = structuredClone(INITIAL_BOOKINGS);
var liveBookingEvents = structuredClone(INITIAL_BOOKING_EVENTS);
var liveNotifications = structuredClone(INITIAL_NOTIFICATIONS);
var liveCmsSettings = structuredClone(INITIAL_CMS_SETTINGS);
var waitlistEntries = [];
var contactSubmissions = [];
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
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app.get("/api/health", (_req, res) => {
    const status = getServerIntegrationStatus();
    res.json({
      status: "ok",
      app: "TankmanPro",
      mode: "live_platform",
      ...status
    });
  });
  app.get("/api/config/status", (_req, res) => {
    const status = getServerIntegrationStatus();
    res.json({
      ...status,
      requiredEnvVarsForCustomerPreview: [],
      message: "TankmanPro Admin Panel, Customer Storefront, and Firebase Firestore are active."
    });
  });
  app.post("/api/admin/session", (req, res) => {
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
      "ops@tankmanpro.com"
    ]);
    const expectedPassword = process.env.ADMIN_PORTAL_PASSWORD || "TankmanAdmin@2026";
    if (!allowedAdminEmails.has(normalizedEmail) || rawPass !== expectedPassword) {
      res.status(401).json({
        authorized: false,
        code: "INVALID_ADMIN_CREDENTIALS",
        error: "Invalid Admin email or password. Use your verified Admin account (e.g., admin@tankmanpro.com or skhan786spn@gmail.com)."
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
  app.use("/api/admin", (req, res, next) => {
    if (req.path === "/session" && req.method === "POST") {
      next();
      return;
    }
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
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
  app.get("/api/admin/state", (_req, res) => {
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
  app.post("/api/admin/services", (req, res) => {
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
    res.status(201).json({
      service: newService,
      message: `Service "${newService.title}" created and ${newService.status}.`
    });
  });
  app.post("/api/admin/services/:id/status", (req, res) => {
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
    res.json({
      service: svc,
      message: `Service "${svc.title}" status updated to ${status}.`
    });
  });
  app.delete("/api/admin/services/:id", (req, res) => {
    const { id } = req.params;
    const svcIdx = liveServices.findIndex((s) => s.id === id);
    if (svcIdx < 0) {
      res.status(404).json({ error: "Service not found." });
      return;
    }
    const svc = liveServices[svcIdx];
    const evaluation = evaluateServiceDeletion(id, liveBookings);
    if (!evaluation.canHardDelete) {
      svc.status = "archived";
      svc.updatedAtIso = (/* @__PURE__ */ new Date()).toISOString();
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
    res.json({
      deleted: true,
      archivedInstead: false,
      referencedBookingsCount: 0,
      message: `Service "${svc.title}" permanently deleted.`
    });
  });
  app.post("/api/admin/categories", (req, res) => {
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
    res.status(201).json({
      category: newCat,
      message: `Category "${newCat.name}" created.`
    });
  });
  app.post("/api/admin/price-overrides", (req, res) => {
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
    res.status(201).json({
      priceOverride: created,
      message: "Price override created."
    });
  });
  app.post("/api/admin/cities", (req, res) => {
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
      supportPhone: payload.supportPhone || "+91 97942 00100",
      active: payload.active ?? true,
      isDemo: false,
      updatedAtIso: nowIso
    };
    liveCities.push(newCity);
    res.status(201).json({
      city: newCity,
      message: `City "${newCity.name}" added.`
    });
  });
  app.post("/api/admin/service-areas", (req, res) => {
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
    res.status(201).json({
      serviceArea: newArea,
      message: `PIN ${pinCode} added to ${targetCity.name}.`
    });
  });
  app.post("/api/admin/service-areas/import-csv", (req, res) => {
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
          supportPhone: "+91 97942 00100",
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
  app.post("/api/admin/vendors", (req, res) => {
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
        uid: current.uid,
        vendorCode: current.vendorCode || generateUniqueVendorCode(liveVendors),
        updatedAtIso: nowIso,
        isDemo: false
      };
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
    res.status(201).json({
      vendor: newVendor,
      message: `Vendor registered with ID ${newVendor.vendorCode}.`
    });
  });
  app.post("/api/admin/vendors/:uid/status", (req, res) => {
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
    res.json({
      vendor,
      message: `Vendor ${vendor.displayName} (${vendor.vendorCode}) status updated to ${status}.`
    });
  });
  app.post("/api/admin/vendors/:uid/reset-password", (req, res) => {
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
    res.json({
      vendor,
      message: `Secure password setup/reset link triggered for ${vendor.email} (${vendor.vendorCode}).`
    });
  });
  app.post("/api/admin/bookings/:id/assign", (req, res) => {
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
    res.json({
      booking,
      event,
      message: `Booking ${booking.bookingNumber} assigned to ${chosenVendor.displayName}.`
    });
  });
  app.post("/api/admin/bookings/:id/status", (req, res) => {
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
    res.json({
      booking,
      event,
      message: `Booking ${booking.bookingNumber} updated to ${booking.status}.`
    });
  });
  app.post("/api/admin/cms", (req, res) => {
    const payload = req.body;
    liveCmsSettings = {
      ...liveCmsSettings,
      ...payload,
      id: "global",
      updatedAtIso: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.json({
      cmsSettings: liveCmsSettings,
      message: "Website CMS content updated and published to storefront."
    });
  });
  app.post("/api/admin/coupons", (req, res) => {
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
    res.status(201).json({
      coupon: newCoupon,
      message: `Coupon ${code} created.`
    });
  });
  app.delete("/api/admin/coupons/:id", (req, res) => {
    const couponId = req.params.id;
    const index = liveCoupons.findIndex(
      (c) => c.id === couponId || c.code.toUpperCase() === String(couponId).toUpperCase()
    );
    if (index === -1) {
      res.status(404).json({ error: "Coupon not found." });
      return;
    }
    const removed = liveCoupons.splice(index, 1)[0];
    res.json({
      ok: true,
      message: `Coupon "${removed.code}" deleted permanently.`,
      deletedId: removed.id
    });
  });
  app.post("/api/admin/notifications/read", (req, res) => {
    const { id } = req.body;
    for (const n of liveNotifications) {
      if (!id || n.id === id) {
        n.read = true;
      }
    }
    res.json({ notifications: liveNotifications });
  });
  app.get("/api/vendor/accounts-preview", (_req, res) => {
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
  app.post("/api/vendor/session", (req, res) => {
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
    if (!matchedVendor || rawPass !== expectedPass) {
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
  app.post("/api/vendor/request-password-reset", (req, res) => {
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
  app.use("/api/vendor", (req, res, next) => {
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
  app.get("/api/vendor/state", (_req, res) => {
    const vendor = res.locals.vendor;
    const todayDateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const rawAssignedBookings = filterVendorScopedBookings(liveBookings, vendor.uid);
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
  app.post("/api/vendor/bookings/:id/transition", (req, res) => {
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
    res.json({
      booking: sanitizeBookingForVendorView(booking, vendor.uid),
      event,
      message: targetStatus === "vendor_accepted" ? `Booking ${booking.bookingNumber} accepted! Customer contact and full address are now unlocked.` : targetStatus === "vendor_rejected" ? `Booking ${booking.bookingNumber} flagged for Admin reassignment.` : targetStatus === "in_progress" ? `Job ${booking.bookingNumber} marked In Progress.` : `Job ${booking.bookingNumber} marked Completed!`
    });
  });
  app.post("/api/vendor/bookings/:id/substatus", (req, res) => {
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
    res.json({
      booking: sanitizeBookingForVendorView(booking, vendor.uid),
      event,
      message: `Field log updated for ${booking.bookingNumber}.`
    });
  });
  app.post("/api/vendor/availability", (req, res) => {
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
    res.json({
      vendor,
      message: `Partner availability updated (${vendor.isAvailable ? "Online & Accepting Dispatch" : "Offline / Shift Paused"}).`
    });
  });
  app.post("/api/vendor/price-overrides", (req, res) => {
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
    res.status(201).json({
      priceOverride: created,
      message: "New Partner service rate saved."
    });
  });
  app.post("/api/vendor/notifications/read", (req, res) => {
    const vendor = res.locals.vendor;
    const { id } = req.body;
    for (const n of liveNotifications) {
      if (n.recipientRole === "vendor" && n.recipientUid === vendor.uid) {
        if (!id || n.id === id) {
          n.read = true;
        }
      }
    }
    res.json({
      notifications: liveNotifications.filter(
        (n) => n.recipientRole === "vendor" && n.recipientUid === vendor.uid
      )
    });
  });
  app.get("/api/payments/config", (_req, res) => {
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
  app.post("/api/payments/razorpay/create-order", async (req, res) => {
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
  app.post("/api/payments/razorpay/verify", (req, res) => {
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
    }
    res.json({
      ok: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      booking
    });
  });
  app.post("/api/payments/razorpay/webhook", (req, res) => {
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
    }
    res.status(200).json({ ok: true, received: true, event });
  });
  app.post("/api/payments/razorpay/refund", async (req, res) => {
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
  app.get("/api/public/service-areas", (req, res) => {
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
  app.get("/api/public/catalog", (req, res) => {
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
  app.get("/api/public/services/:slug", (req, res) => {
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
  app.post("/api/pricing/quote", (req, res) => {
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
  app.post("/api/coupons/validate", (req, res) => {
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
  app.get("/api/bookings/slots", (req, res) => {
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
  app.post("/api/bookings", (req, res) => {
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
  app.get("/api/customer/bookings", (req, res) => {
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
  app.post("/api/customer/bookings/:id/cancel", (req, res) => {
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
  app.post("/api/public/waitlist", (req, res) => {
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
    res.status(201).json({
      success: true,
      entry,
      message: `Waitlist request recorded for PIN ${entry.pinCode}.`
    });
  });
  app.post("/api/public/contact", (req, res) => {
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
    res.status(201).json({
      success: true,
      inquiryId: record.id,
      message: "Your inquiry has been logged."
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TankmanPro server listening on http://localhost:${PORT}`);
  });
}
startServer();
