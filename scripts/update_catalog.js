import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/data/demoCatalog.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update DEMO_CATEGORIES to include cat_electrician, cat_plumber, cat_painter, cat_carpenter
const newCategoriesCode = `  {
    id: 'cat_fan_appliances',
    name: 'Fan, Floor & Door Care',
    slug: 'fan-floor-door-cleaning',
    shortDescription: 'Ceiling fan & exhaust fan degreasing, door cleaning, and microfiber floor scrubbing.',
    iconKey: 'fan-appliances',
    imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
    sortOrder: 7,
    status: 'published',
    isDemo: true,
  },
  {
    id: 'cat_electrician',
    name: 'Electrician Services',
    slug: 'electrician-services',
    shortDescription: 'Switches, wiring, fans, lighting, MCB distribution, inverters & smart appliance setup.',
    iconKey: 'appliance-repair',
    imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
    sortOrder: 8,
    status: 'published',
    isDemo: true,
  },
  {
    id: 'cat_plumber',
    name: 'Plumber & Sanitary Services',
    slug: 'plumber-services',
    shortDescription: 'Bath accessories, showers, basins, waste pipes, grouting, drainage & water filters.',
    iconKey: 'plumbing',
    imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
    sortOrder: 9,
    status: 'published',
    isDemo: true,
  },
  {
    id: 'cat_painter',
    name: 'Painter & Wall Care',
    slug: 'painter-services',
    shortDescription: 'Interior walls, exterior weatherproofing, ceiling coats & touch-up painting.',
    iconKey: 'appliance-repair',
    imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
    sortOrder: 10,
    status: 'published',
    isDemo: true,
  },
  {
    id: 'cat_carpenter',
    name: 'Carpenter Services',
    slug: 'carpenter-services',
    shortDescription: 'Door lock installation, hinge repair, furniture assembly & wall mounts.',
    iconKey: 'appliance-repair',
    imageUrl: '/assets/tankmanpro/sofa-clean.jpg',
    sortOrder: 11,
    status: 'published',
    isDemo: true,
  },
  {
    id: 'cat_aesthetics',
    name: 'Beedare Skin & Aesthetics',
    slug: 'beedare-aesthetics',
    shortDescription: 'At-home chemical peels, Dermapen, PRP rejuvenation & laser hair removal by Beedare by TankmanPro.',
    iconKey: 'aesthetics',
    imageUrl: '/assets/tankmanpro/aesthetic-facial.jpg',
    sortOrder: 12,
    status: 'published',
    isDemo: true,
  },`;

const targetCategoriesPattern = /  \{\s+id: 'cat_fan_appliances',[\s\S]+?sortOrder: 8,[\s\S]+?isDemo: true,[\s\S]+?\},/;
if (targetCategoriesPattern.test(content)) {
  content = content.replace(targetCategoriesPattern, newCategoriesCode);
  console.log('Categories updated successfully');
} else {
  console.log('Categories pattern not matched, checking alternative');
}

// 2. Add New Services before `export const DEMO_VENDORS`
const newServicesCode = `
  // 9. ELECTRICIAN SERVICES (Complete switch, fan, lighting, MCB, inverter & appliance catalog)
  {
    id: 'srv_electrician_services',
    slug: 'certified-electrician-home-services',
    title: 'Certified Electrician Services',
    categoryId: 'cat_electrician',
    shortDescription:
      'Verified background-checked electricians for switches, fans, wiring, MCBs, inverters, TV mounts & home automation with 30-day warranty.',
    fullDescription:
      'Comprehensive electrical solutions backed by the TankmanPro Promise: 30-day service warranty, up to ₹10,000 damage coverage, and verified technicians. Standard ₹299 inspection fee is completely waived if any service is availed.',
    illustrationKey: 'appliance-repair',
    imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
    galleryUrls: ['/assets/tankmanpro/ceiling-fan.jpg'],
    durationMinutes: 45,
    basePricePaise: 10900, // ₹109 starting (switch/socket replacement)
    regularPricePaise: 14900,
    defaultPricingMode: 'city_fixed',
    cityModeOverrides: {
      city_delhi: 'city_fixed',
      city_shahjahanpur: 'city_fixed',
      city_kanpur: 'city_fixed',
    },
    inclusions: [
      'Site safety assessment and load diagnosis by background-verified electrician',
      'Precision installation / repair using insulated professional tools',
      'Operational testing and voltage / continuity check before handover',
      'Post-service area cleanup and 30-day service warranty',
    ],
    exclusions: [
      'Materials like switches, wires, casing, MCB units or fans unless purchased as add-ons',
      'Civil wall repainting or structural ceiling alterations',
    ],
    preparationInstructions: [
      'Ensure access to main power distribution board / isolator switch.',
      'Have appliances / materials ready if provided by yourself.',
    ],
    warrantySummary: '30-Day Workmanship Warranty & Up to ₹10,000 Damage Protection',
    cancellationPolicySummary: 'Free cancellation up to 4 hours before scheduled slot.',
    variants: [
      {
        id: 'var_elec_switchbox',
        serviceId: 'srv_electrician_services',
        name: 'Switchbox Installation',
        scopeSummary: 'Wall recess inspection, box mounting & wiring alignment',
        durationMinutes: 30,
        basePricePaise: 34900, // ₹349
        regularPricePaise: 44900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_ac_switchbox',
        serviceId: 'srv_electrician_services',
        name: 'AC Heavy Switchbox Installation',
        scopeSummary: 'Heavy-duty load fitting for split/window ACs with aligned box',
        durationMinutes: 35,
        basePricePaise: 36900, // ₹369
        regularPricePaise: 49900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_switchboard',
        serviceId: 'srv_electrician_services',
        name: 'Switchboard Installation',
        scopeSummary: 'Modular or standard switchboard mounting & secure wiring',
        durationMinutes: 30,
        basePricePaise: 30900, // ₹309
        regularPricePaise: 39900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_smart_switch',
        serviceId: 'srv_electrician_services',
        name: 'Smart Switch Installation',
        scopeSummary: 'Wiring compatibility check & smart switch module setup',
        durationMinutes: 25,
        basePricePaise: 15000, // ₹150
        regularPricePaise: 24900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_smart_controller',
        serviceId: 'srv_electrician_services',
        name: 'Smart Appliance Controller',
        scopeSummary: 'Controller pairing for AC, geyser or heavy devices',
        durationMinutes: 30,
        basePricePaise: 19900, // ₹199
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_wifi_switch',
        serviceId: 'srv_electrician_services',
        name: 'Wi-Fi Smart Switch Installation',
        scopeSummary: 'Wi-Fi sync, mobile app pairing & switch setup',
        durationMinutes: 30,
        basePricePaise: 19900, // ₹199
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_switch_replace',
        serviceId: 'srv_electrician_services',
        name: 'Switch / Socket Replacement',
        scopeSummary: 'Safe removal of old damaged socket & new installation',
        durationMinutes: 20,
        basePricePaise: 10900, // ₹109
        regularPricePaise: 14900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_switch_repair',
        serviceId: 'srv_electrician_services',
        name: 'Switchboard / Switchbox Repair',
        scopeSummary: 'Loose terminal repair, spark elimination & contact fix',
        durationMinutes: 25,
        basePricePaise: 12000, // ₹120
        regularPricePaise: 18000,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_ceiling_fan_inst',
        serviceId: 'srv_electrician_services',
        name: 'Ceiling Fan Installation',
        scopeSummary: 'Rod, hook & blade balancing with speed test',
        durationMinutes: 30,
        basePricePaise: 19900, // ₹199
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_wall_fan_inst',
        serviceId: 'srv_electrician_services',
        name: 'Wall Mount Fan Installation',
        scopeSummary: 'Bracket drilling, mounting & angle adjustment',
        durationMinutes: 25,
        basePricePaise: 13900, // ₹139
        regularPricePaise: 19900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_exhaust_fan_inst',
        serviceId: 'srv_electrician_services',
        name: 'Exhaust Fan Installation',
        scopeSummary: 'Glass/wall vent mounting & power connection',
        durationMinutes: 30,
        basePricePaise: 19900, // ₹199
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_decor_fan_inst',
        serviceId: 'srv_electrician_services',
        name: 'Decorative Ceiling Fan Installation',
        scopeSummary: 'Special mounting for chandelier/designer fans',
        durationMinutes: 45,
        basePricePaise: 46900, // ₹469
        regularPricePaise: 59900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_fan_replace',
        serviceId: 'srv_electrician_services',
        name: 'Fan Replacement (Ceiling/Exhaust/Wall)',
        scopeSummary: 'Old fan removal and new unit mounting with test',
        durationMinutes: 35,
        basePricePaise: 25900, // ₹259
        regularPricePaise: 34900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_fan_repair',
        serviceId: 'srv_electrician_services',
        name: 'Fan Repair (Ceiling/Exhaust/Wall)',
        scopeSummary: 'Capacitor replacement, humming noise & speed fix',
        durationMinutes: 30,
        basePricePaise: 19900, // ₹199
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_fan_regulator',
        serviceId: 'srv_electrician_services',
        name: 'Fan Regulator Repair / Replacement',
        scopeSummary: 'Rotary or step regulator install on modular board',
        durationMinutes: 20,
        basePricePaise: 9900, // ₹99
        regularPricePaise: 14900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_fan_uninstall',
        serviceId: 'srv_electrician_services',
        name: 'Fan Uninstallation (Ceiling/Exhaust/Wall)',
        scopeSummary: 'Safe disconnection, hook dismount & cable bundling',
        durationMinutes: 20,
        basePricePaise: 12900, // ₹129
        regularPricePaise: 19900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_holder_install',
        serviceId: 'srv_electrician_services',
        name: 'Bulb / Tubelight Holder Installation',
        scopeSummary: 'Wall/ceiling batten or angle holder setup',
        durationMinutes: 20,
        basePricePaise: 11900, // ₹119
        regularPricePaise: 16900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_cfl_led',
        serviceId: 'srv_electrician_services',
        name: 'CFL to LED Replacement',
        scopeSummary: 'Fitting retrofitting for modern energy-saving LEDs',
        durationMinutes: 15,
        basePricePaise: 16900, // ₹169
        regularPricePaise: 24900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_decor_lights_5m',
        serviceId: 'srv_electrician_services',
        name: 'Decorative Lights Installation (Per 5m)',
        scopeSummary: 'Festive/strip light layout, mounting clips & wiring',
        durationMinutes: 30,
        basePricePaise: 11900, // ₹119
        regularPricePaise: 17900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_decor_lights_un_20m',
        serviceId: 'srv_electrician_services',
        name: 'Decorative Lights Uninstallation (Per 20m)',
        scopeSummary: 'Safe adhesive & clip removal, wire rolling',
        durationMinutes: 30,
        basePricePaise: 14800, // ₹148
        regularPricePaise: 19900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_decor_lantern',
        serviceId: 'srv_electrician_services',
        name: 'Decorative Lantern Installation',
        scopeSummary: 'Hook mounting and aesthetic lighting alignment',
        durationMinutes: 20,
        basePricePaise: 9900, // ₹99
        regularPricePaise: 14900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_chandelier_6',
        serviceId: 'srv_electrician_services',
        name: 'Chandelier Installation (Up to 6 bulbs)',
        scopeSummary: 'Reinforced ceiling bracket setup, assembly & test',
        durationMinutes: 60,
        basePricePaise: 54900, // ₹549
        regularPricePaise: 69900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_chandelier_more_6',
        serviceId: 'srv_electrician_services',
        name: 'Chandelier Installation (More than 6 bulbs)',
        scopeSummary: 'Heavy-load structural mounting, multi-tier assembly',
        durationMinutes: 90,
        basePricePaise: 109900, // ₹1,099
        regularPricePaise: 149900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_ext_wiring_casing',
        serviceId: 'srv_electrician_services',
        name: 'New External Wiring with Casing (Per 5m)',
        scopeSummary: 'PVC casing-caping, saddle clips & load test',
        durationMinutes: 45,
        basePricePaise: 24900, // ₹249
        regularPricePaise: 34900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_ext_wiring_nocasing',
        serviceId: 'srv_electrician_services',
        name: 'New External Wiring without Casing (Per 5m)',
        scopeSummary: 'Open flexible cable routing & saddle clips',
        durationMinutes: 30,
        basePricePaise: 12900, // ₹129
        regularPricePaise: 19900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_int_wiring',
        serviceId: 'srv_electrician_services',
        name: 'New Internal Concealed Wiring (Per 5m)',
        scopeSummary: 'Wall chiseling, conduit pipe laying & wire pull',
        durationMinutes: 60,
        basePricePaise: 24900, // ₹249
        regularPricePaise: 34900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_doorbell_install',
        serviceId: 'srv_electrician_services',
        name: 'Doorbell Installation',
        scopeSummary: 'Ding-dong / electronic doorbell mounting & hookup',
        durationMinutes: 30,
        basePricePaise: 29900, // ₹299
        regularPricePaise: 39900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_doorbell_replace',
        serviceId: 'srv_electrician_services',
        name: 'Doorbell Replacement',
        scopeSummary: 'Safe removal of old chime & new unit connection',
        durationMinutes: 20,
        basePricePaise: 10900, // ₹109
        regularPricePaise: 16900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_videobell',
        serviceId: 'srv_electrician_services',
        name: 'Video Doorbell Installation',
        scopeSummary: 'Smart camera bell setup, chime connect & app sync',
        durationMinutes: 45,
        basePricePaise: 60000, // ₹600
        regularPricePaise: 79900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_mcb_single',
        serviceId: 'srv_electrician_services',
        name: 'Single-Pole MCB Installation',
        scopeSummary: 'Distribution board DIN-rail mounting & load check',
        durationMinutes: 25,
        basePricePaise: 15000, // ₹150
        regularPricePaise: 24900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_mcb_double',
        serviceId: 'srv_electrician_services',
        name: 'Double-Pole MCB Installation',
        scopeSummary: 'Heavy appliance main isolator / DP MCB setup',
        durationMinutes: 30,
        basePricePaise: 24900, // ₹249
        regularPricePaise: 34900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_mcb_fuse_replace',
        serviceId: 'srv_electrician_services',
        name: 'MCB / Fuse Replacement',
        scopeSummary: 'Burnt fuse or tripped MCB replacement',
        durationMinutes: 20,
        basePricePaise: 11900, // ₹119
        regularPricePaise: 17900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_submeter',
        serviceId: 'srv_electrician_services',
        name: 'Submeter Installation',
        scopeSummary: 'Single-phase submeter for tenant / room tracking',
        durationMinutes: 35,
        basePricePaise: 24900, // ₹249
        regularPricePaise: 34900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_changeover_3p',
        serviceId: 'srv_electrician_services',
        name: '3-Phase Changeover Switch Installation',
        scopeSummary: 'Generator / grid manual changeover switch install',
        durationMinutes: 50,
        basePricePaise: 36900, // ₹369
        regularPricePaise: 49900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_inverter_single',
        serviceId: 'srv_electrician_services',
        name: 'Inverter Installation (Single Battery)',
        scopeSummary: 'Inverter + 1 battery mounting, terminal grease & test',
        durationMinutes: 60,
        basePricePaise: 48600, // ₹486
        regularPricePaise: 59900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_inverter_double',
        serviceId: 'srv_electrician_services',
        name: 'Inverter Installation (Double Battery)',
        scopeSummary: 'Heavy-duty 24V double battery connection & test',
        durationMinutes: 75,
        basePricePaise: 57500, // ₹575
        regularPricePaise: 69900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_inverter_uninstall',
        serviceId: 'srv_electrician_services',
        name: 'Inverter Uninstallation',
        scopeSummary: 'Safe battery disconnection & terminal insulation',
        durationMinutes: 40,
        basePricePaise: 49900, // ₹499
        regularPricePaise: 59900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_stabilizer',
        serviceId: 'srv_electrician_services',
        name: 'Stabilizer Installation',
        scopeSummary: 'Wall mounting & connection to AC/Fridge/TV',
        durationMinutes: 30,
        basePricePaise: 24900, // ₹249
        regularPricePaise: 34900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_inverter_fuse',
        serviceId: 'srv_electrician_services',
        name: 'Inverter Fuse Replacement',
        scopeSummary: 'Blown glass or ceramic fuse replacement',
        durationMinutes: 20,
        basePricePaise: 12900, // ₹129
        regularPricePaise: 18900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_inverter_serv_single',
        serviceId: 'srv_electrician_services',
        name: 'Inverter Servicing (Single Battery)',
        scopeSummary: 'Vent cleaning, terminal de-rust, backup load test',
        durationMinutes: 40,
        basePricePaise: 27900, // ₹279
        regularPricePaise: 34900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_inverter_serv_double',
        serviceId: 'srv_electrician_services',
        name: 'Inverter Servicing (Double Battery)',
        scopeSummary: 'Dual terminal clean, voltage check & backup test',
        durationMinutes: 50,
        basePricePaise: 44900, // ₹449
        regularPricePaise: 54900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_inverter_repair',
        serviceId: 'srv_electrician_services',
        name: 'Inverter Repair (Backup/Noise/Overload)',
        scopeSummary: 'Diagnostic & repair of backup drop, humming or overload error',
        durationMinutes: 45,
        basePricePaise: 21000, // ₹210
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_tv_48',
        serviceId: 'srv_electrician_services',
        name: 'TV Wall Mount Installation (Up to 48")',
        scopeSummary: 'Bracket mounting, screen leveling & HDMI/AV check',
        durationMinutes: 35,
        basePricePaise: 34900, // ₹349
        regularPricePaise: 44900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_tv_55',
        serviceId: 'srv_electrician_services',
        name: 'TV Wall Mount Installation (48" - 55")',
        scopeSummary: 'Heavy-duty bracket setup & cable management',
        durationMinutes: 40,
        basePricePaise: 44900, // ₹449
        regularPricePaise: 54900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_tv_70',
        serviceId: 'srv_electrician_services',
        name: 'TV Wall Mount Installation (55" - 70")',
        scopeSummary: 'Large display structural mounting & connectivity',
        durationMinutes: 50,
        basePricePaise: 54900, // ₹549
        regularPricePaise: 69900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_tv_uninstall',
        serviceId: 'srv_electrician_services',
        name: 'TV Uninstallation',
        scopeSummary: 'Dismounting TV from bracket & cable bundling',
        durationMinutes: 25,
        basePricePaise: 19900, // ₹199
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_wifi_cctv',
        serviceId: 'srv_electrician_services',
        name: 'WiFi CCTV Camera Installation',
        scopeSummary: 'Camera mounting, angle coverage & mobile app sync',
        durationMinutes: 30,
        basePricePaise: 19900, // ₹199
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_room_heater',
        serviceId: 'srv_electrician_services',
        name: 'Room Heater Repair',
        scopeSummary: 'Coil, fan, thermostat & safety switch repair',
        durationMinutes: 30,
        basePricePaise: 27900, // ₹279
        regularPricePaise: 34900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_karban_airzone',
        serviceId: 'srv_electrician_services',
        name: 'Karban Airzone Purifier Installation',
        scopeSummary: 'Ceiling/wall airzone purifier setup & airflow test',
        durationMinutes: 45,
        basePricePaise: 54900, // ₹549
        regularPricePaise: 69900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_mixer_grinder',
        serviceId: 'srv_electrician_services',
        name: 'Mixer Grinder Repair',
        scopeSummary: 'Coupler, carbon brush, jar blade & switch fix',
        durationMinutes: 30,
        basePricePaise: 21000, // ₹210
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_home_theater',
        serviceId: 'srv_electrician_services',
        name: 'Home Theater System Installation',
        scopeSummary: 'Multi-speaker surround positioning & audio setup',
        durationMinutes: 45,
        basePricePaise: 21000, // ₹210
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_ev_charger_2w',
        serviceId: 'srv_electrician_services',
        name: 'EV Charger Installation (2-Wheeler)',
        scopeSummary: 'Parking area charger unit mounting & MCB hookup',
        durationMinutes: 60,
        basePricePaise: 75000, // ₹750
        regularPricePaise: 99900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
      {
        id: 'var_elec_consultation',
        serviceId: 'srv_electrician_services',
        name: 'Electrician Consultation & Inspection',
        scopeSummary: 'Detailed site inspection, wiring audit & quote (waived on service)',
        durationMinutes: 30,
        basePricePaise: 14900, // ₹149
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/ceiling-fan.jpg',
        active: true,
      },
    ],
    addons: [],
    questions: [],
    faqs: [
      {
        question: 'Does the cost include materials like switches and wires?',
        answer: 'No, materials are charged separately if not provided by you.',
      },
      {
        question: 'What if something goes wrong after installation?',
        answer: 'We offer a 30-day warranty — we will fix it at no extra cost.',
      },
    ],
    supportedCityIds: ['city_delhi', 'city_shahjahanpur', 'city_kanpur'],
    status: 'published',
    isDemo: true,
  },

  // 10. PLUMBER SERVICES (Comprehensive bath fittings, taps, showers, basin & grouting)
  {
    id: 'srv_plumber_services',
    slug: 'certified-plumbing-sanitary-services',
    title: 'Plumber Services & Sanitary Fittings',
    categoryId: 'cat_plumber',
    shortDescription:
      'Verified plumbers for taps, showers, washbasins, tile grouting, drain unclogging & water filter installations with 30-day warranty.',
    fullDescription:
      'Doorstep plumbing services delivered by certified technicians. 30-day workmanship guarantee, ₹10,000 damage protection, and leak-free installation assurance.',
    illustrationKey: 'plumbing',
    imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
    galleryUrls: ['/assets/tankmanpro/bathroom-deep.jpg'],
    durationMinutes: 45,
    basePricePaise: 10000, // ₹100 starting (tap installation)
    regularPricePaise: 14900,
    defaultPricingMode: 'city_fixed',
    cityModeOverrides: {
      city_delhi: 'city_fixed',
      city_shahjahanpur: 'city_fixed',
      city_kanpur: 'city_fixed',
    },
    inclusions: [
      'Site assessment of water pressure, pipe alignment and fittings',
      'Leak-proof installation or repair with teflon / solvent sealants',
      'Full water flow testing and pressure check before leaving',
      '30-day service warranty on workmanship',
    ],
    exclusions: [
      'Spare parts, taps, showers, basins, or pipes unless provided or billed extra',
      'Major civil breaking or tile reconstruction',
    ],
    preparationInstructions: [
      'Ensure access to main bathroom/kitchen water shut-off valve.',
      'Have replacement taps or fixtures ready if self-purchased.',
    ],
    warrantySummary: '30-Day Workmanship Warranty & ₹10,000 Damage Protection',
    cancellationPolicySummary: 'Free cancellation up to 4 hours before scheduled slot.',
    variants: [
      {
        id: 'var_plumb_bath_accessory',
        serviceId: 'srv_plumber_services',
        name: 'Bath Accessory Installation',
        scopeSummary: 'Towel rack, soap dish, glass shelf, robe hook securely mounted',
        durationMinutes: 25,
        basePricePaise: 12900, // ₹129
        regularPricePaise: 19900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_shower_ceiling',
        serviceId: 'srv_plumber_services',
        name: 'Shower Installation (Ceiling Mounted)',
        scopeSummary: 'Overhead rain shower arm & rose fitting with leak test',
        durationMinutes: 30,
        basePricePaise: 16900, // ₹169
        regularPricePaise: 24900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_shower_wall',
        serviceId: 'srv_plumber_services',
        name: 'Shower Installation (Wall Mounted / Hand-Held)',
        scopeSummary: 'Wall bracket, shower head & flexible hose install',
        durationMinutes: 25,
        basePricePaise: 15900, // ₹159
        regularPricePaise: 22900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_washbasin_install',
        serviceId: 'srv_plumber_services',
        name: 'Wash Basin Installation',
        scopeSummary: 'Wall-mounted, pedestal or countertop basin fitting & sealant',
        durationMinutes: 60,
        basePricePaise: 47900, // ₹479
        regularPricePaise: 59900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_wastepipe_replace',
        serviceId: 'srv_plumber_services',
        name: 'Waste Pipe Replacement',
        scopeSummary: 'Removal of cracked pipe & flexible PVC waste pipe fitting',
        durationMinutes: 20,
        basePricePaise: 13900, // ₹139
        regularPricePaise: 19900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_sink_drain_remove',
        serviceId: 'srv_plumber_services',
        name: 'Sink Drainage Removal',
        scopeSummary: 'Detach blocked or damaged drainage trap and pipe',
        durationMinutes: 25,
        basePricePaise: 18900, // ₹189
        regularPricePaise: 24900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_waste_coupling',
        serviceId: 'srv_plumber_services',
        name: 'Waste Coupling (Basin)',
        scopeSummary: 'Brass or SS waste coupling replacement with sealant',
        durationMinutes: 25,
        basePricePaise: 14900, // ₹149
        regularPricePaise: 19900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_bottle_trap',
        serviceId: 'srv_plumber_services',
        name: 'Bottle Trap Installation',
        scopeSummary: 'Designer bottle trap installation for luxury basins',
        durationMinutes: 30,
        basePricePaise: 21900, // ₹219
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_bath_grout',
        serviceId: 'srv_plumber_services',
        name: 'Bathroom Tile Grouting',
        scopeSummary: 'Complete floor & wall joint sealing with waterproof grout',
        durationMinutes: 120,
        basePricePaise: 150000, // ₹1,500
        regularPricePaise: 180000,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_kitchen_grout',
        serviceId: 'srv_plumber_services',
        name: 'Kitchen Tile Grouting',
        scopeSummary: 'Countertop, sink splashback & kitchen tile sealing',
        durationMinutes: 90,
        basePricePaise: 100000, // ₹1,000
        regularPricePaise: 130000,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_shower_filter',
        serviceId: 'srv_plumber_services',
        name: 'Shower Filter Installation',
        scopeSummary: 'Hard-water filter attachment to shower connection',
        durationMinutes: 25,
        basePricePaise: 16900, // ₹169
        regularPricePaise: 24900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_washing_filter',
        serviceId: 'srv_plumber_services',
        name: 'Washing Machine Filter Installation',
        scopeSummary: 'Sediment filter attachment to washing machine inlet hose',
        durationMinutes: 25,
        basePricePaise: 13900, // ₹139
        regularPricePaise: 19900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_drain_cover',
        serviceId: 'srv_plumber_services',
        name: 'Drainage Cover Installation',
        scopeSummary: 'Stainless steel or PVC floor jali/cover installation',
        durationMinutes: 20,
        basePricePaise: 17900, // ₹179
        regularPricePaise: 24900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_bath_drain_remove',
        serviceId: 'srv_plumber_services',
        name: 'Bathroom Drainage Removal',
        scopeSummary: 'Old rusted drain trap & floor outlet removal',
        durationMinutes: 40,
        basePricePaise: 40900, // ₹409
        regularPricePaise: 49900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_balcony_drain_remove',
        serviceId: 'srv_plumber_services',
        name: 'Balcony Drainage Removal',
        scopeSummary: 'Balcony rainwater outlet disassembly',
        durationMinutes: 30,
        basePricePaise: 29900, // ₹299
        regularPricePaise: 39900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_tap_repair',
        serviceId: 'srv_plumber_services',
        name: 'Tap Repair & Leak Fix',
        scopeSummary: 'Washer, spindle, cartridge replacement & leak seal',
        durationMinutes: 25,
        basePricePaise: 12900, // ₹129
        regularPricePaise: 18900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_mixer_repair',
        serviceId: 'srv_plumber_services',
        name: 'Water Mixer Tap Repair',
        scopeSummary: 'Wall mixer or basin diverter repair & hot-cold fix',
        durationMinutes: 35,
        basePricePaise: 30900, // ₹309
        regularPricePaise: 39900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_plumb_tap_install',
        serviceId: 'srv_plumber_services',
        name: 'Tap Installation',
        scopeSummary: 'Bib tap, pillar tap or angle valve installation',
        durationMinutes: 20,
        basePricePaise: 10000, // ₹100
        regularPricePaise: 14900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
    ],
    addons: [],
    questions: [],
    faqs: [
      {
        question: 'Are taps or pipes included in the cost?',
        answer: 'No, fixtures must be provided by the customer or billed separately.',
      },
      {
        question: 'Is leak testing included?',
        answer: 'Yes, complete water pressure leak testing is conducted before completion.',
      },
    ],
    supportedCityIds: ['city_delhi', 'city_shahjahanpur', 'city_kanpur'],
    status: 'published',
    isDemo: true,
  },

  // 11. PAINTER SERVICES
  {
    id: 'srv_painter_services',
    slug: 'professional-home-painting-services',
    title: 'Professional Home Painting Services',
    categoryId: 'cat_painter',
    shortDescription:
      'Expert interior, exterior & ceiling painting using premium paints with neat finish and zero mess guarantee.',
    fullDescription:
      'Give your home or workspace a vibrant fresh look with TankmanPro certified painters. Includes site masking, surface sanding, primer application, and dual-coat paint application using Asian Paints, Nerolac, or Dulux.',
    illustrationKey: 'appliance-repair',
    imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
    galleryUrls: ['/assets/tankmanpro/bathroom-deep.jpg'],
    durationMinutes: 120,
    basePricePaise: 29900, // ₹299 consultation & estimate visit
    regularPricePaise: 49900,
    defaultPricingMode: 'city_fixed',
    cityModeOverrides: {
      city_delhi: 'city_fixed',
      city_shahjahanpur: 'city_fixed',
      city_kanpur: 'city_fixed',
    },
    inclusions: [
      'Site check, wall moisture measurement and square-footage laser measurement',
      'Color shade card consultation and paint budget estimate',
      'Floor and furniture tarpaulin masking protection',
      'Putty touching and uniform roller double-coat finish',
    ],
    exclusions: ['Civil plastering or wall rebuild work'],
    preparationInstructions: [
      'Clear small valuable items from near the walls prior to painting.',
    ],
    warrantySummary: '1-Year Paint Peeling & Flaking Workmanship Warranty',
    cancellationPolicySummary: 'Free cancellation up to 4 hours before slot.',
    variants: [
      {
        id: 'var_paint_interior_sqft',
        serviceId: 'srv_painter_services',
        name: 'Interior Walls Painting (From ₹8/sq.ft)',
        scopeSummary: 'Living room, bedroom, hallway double-coat smooth roller finish',
        durationMinutes: 180,
        basePricePaise: 80000, // ₹800 base package
        regularPricePaise: 100000,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_paint_exterior_sqft',
        serviceId: 'srv_painter_services',
        name: 'Exterior Walls Weatherproofing (From ₹10/sq.ft)',
        scopeSummary: 'Weather-shield anti-fungal exterior emulsion coating',
        durationMinutes: 240,
        basePricePaise: 100000, // ₹1,000 base package
        regularPricePaise: 130000,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_paint_ceiling_sqft',
        serviceId: 'srv_painter_services',
        name: 'Ceiling Painting (From ₹12/sq.ft)',
        scopeSummary: 'Anti-damp ceiling coating with high light-reflection finish',
        durationMinutes: 120,
        basePricePaise: 120000, // ₹1,200 base package
        regularPricePaise: 150000,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
      {
        id: 'var_paint_consultation',
        serviceId: 'srv_painter_services',
        name: 'Full Home Painting Site Inspection & Estimate',
        scopeSummary: 'Measurement, shade cards & formal quotation (waived on booking)',
        durationMinutes: 45,
        basePricePaise: 29900, // ₹299
        regularPricePaise: 49900,
        imageUrl: '/assets/tankmanpro/bathroom-deep.jpg',
        active: true,
      },
    ],
    addons: [],
    questions: [],
    faqs: [
      {
        question: 'Do you bring your own tools and floor covers?',
        answer: 'Yes, we bring rollers, brushes, masking tapes, and protective tarpaulins.',
      },
    ],
    supportedCityIds: ['city_delhi', 'city_shahjahanpur', 'city_kanpur'],
    status: 'published',
    isDemo: true,
  },

  // 12. CARPENTER SERVICES
  {
    id: 'srv_carpenter_services',
    slug: 'doorstep-carpentry-repairs',
    title: 'Doorstep Carpenter Services',
    categoryId: 'cat_carpenter',
    shortDescription:
      'Lock fittings, door alignment, furniture repairs, curtain rod & wall hanging by experienced carpenters.',
    fullDescription:
      'Experienced doorstep carpentry repairs by TankmanPro professionals. Rapid fixing of squeaking doors, broken locks, hinge realignment, furniture assembly, and custom shelf mounts.',
    illustrationKey: 'appliance-repair',
    imageUrl: '/assets/tankmanpro/sofa-clean.jpg',
    galleryUrls: ['/assets/tankmanpro/sofa-clean.jpg'],
    durationMinutes: 40,
    basePricePaise: 14900, // ₹149 starting
    regularPricePaise: 24900,
    defaultPricingMode: 'city_fixed',
    cityModeOverrides: {
      city_delhi: 'city_fixed',
      city_shahjahanpur: 'city_fixed',
      city_kanpur: 'city_fixed',
    },
    inclusions: [
      'Site evaluation and precision carpentry tools & drill machines',
      'Sturdy mounting and joint realignment',
      'Testing and post-work cleanup',
    ],
    exclusions: ['Raw timber, locks, hinges or hardware not provided'],
    preparationInstructions: [
      'Keep hardware or replacement locks accessible.',
    ],
    warrantySummary: '30-Day Workmanship Warranty',
    cancellationPolicySummary: 'Free cancellation up to 4 hours before slot.',
    variants: [
      {
        id: 'var_carp_drilling',
        serviceId: 'srv_carpenter_services',
        name: 'Drilling, Hanging & Curtain Rod Mount',
        scopeSummary: 'Curtain rod, mirror, heavy frame or shelf mounting',
        durationMinutes: 30,
        basePricePaise: 14900, // ₹149
        regularPricePaise: 24900,
        imageUrl: '/assets/tankmanpro/sofa-clean.jpg',
        active: true,
      },
      {
        id: 'var_carp_hinge',
        serviceId: 'srv_carpenter_services',
        name: 'Door Hinge & Alignment Repair',
        scopeSummary: 'Floor-scraping door fix, loose hinge screws & adjustment',
        durationMinutes: 30,
        basePricePaise: 19900, // ₹199
        regularPricePaise: 29900,
        imageUrl: '/assets/tankmanpro/sofa-clean.jpg',
        active: true,
      },
      {
        id: 'var_carp_lock',
        serviceId: 'srv_carpenter_services',
        name: 'Door Lock & Latch Fitting',
        scopeSummary: 'Mortise lock, cylindrical knob or latch installation',
        durationMinutes: 45,
        basePricePaise: 24900, // ₹249
        regularPricePaise: 34900,
        imageUrl: '/assets/tankmanpro/sofa-clean.jpg',
        active: true,
      },
      {
        id: 'var_carp_furniture',
        serviceId: 'srv_carpenter_services',
        name: 'Furniture Assembly & Repair',
        scopeSummary: 'Bed, wardrobe, dining table assembly & tightening',
        durationMinutes: 60,
        basePricePaise: 29900, // ₹299
        regularPricePaise: 39900,
        imageUrl: '/assets/tankmanpro/sofa-clean.jpg',
        active: true,
      },
    ],
    addons: [],
    questions: [],
    faqs: [
      {
        question: 'Are screws and brackets included?',
        answer: 'Basic wall plugs and screws are carried by the technician; specialized hardware must be provided.',
      },
    ],
    supportedCityIds: ['city_delhi', 'city_shahjahanpur', 'city_kanpur'],
    status: 'published',
    isDemo: true,
  },
`;

const vendorInsertPattern = /export const DEMO_VENDORS: Vendor\[\] = \[/;
if (content.includes('srv_electrician_services')) {
  console.log('Services already present in file, skipping append');
} else if (vendorInsertPattern.test(content)) {
  content = content.replace(vendorInsertPattern, newServicesCode + '\nexport const DEMO_VENDORS: Vendor[] = [');
  console.log('New services inserted successfully');
}

// 3. Update DEMO_VENDORS supportedServiceIds to include the 4 new services
const vendorIdsToAdd = [
  "'srv_electrician_services'",
  "'srv_plumber_services'",
  "'srv_painter_services'",
  "'srv_carpenter_services'"
];

content = content.replace(/(supportedServiceIds:\s*\[[\s\S]*?)('srv_plumbing_pipeline_care'|'srv_bathroom_cleaning')(\s*\])/g, (match, p1, p2, p3) => {
  return p1 + p2 + ',\n      ' + vendorIdsToAdd.join(',\n      ') + p3;
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('demoCatalog.ts updated successfully!');
