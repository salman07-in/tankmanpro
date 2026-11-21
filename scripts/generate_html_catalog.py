import os

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TankmanPro — Official Master Services & Price Catalog</title>
  <style>
    @media print {
      body { font-size: 11pt; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 960px;
      margin: 40px auto;
      padding: 0 24px;
      background: #ffffff;
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 3px solid #0d9488;
      margin-bottom: 32px;
    }
    .header h1 {
      color: #0f766e;
      font-size: 32px;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .tagline {
      font-size: 16px;
      font-weight: 600;
      color: #0d9488;
      margin-bottom: 12px;
    }
    .badge {
      display: inline-block;
      background: #f0fdfa;
      color: #0d9488;
      border: 1px solid #ccfbf1;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin: 2px 4px;
    }
    h2 {
      color: #0f766e;
      font-size: 22px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 36px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h3 {
      color: #334155;
      font-size: 16px;
      margin-top: 20px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0 24px 0;
      font-size: 14px;
    }
    th {
      background: #f8fafc;
      color: #0f172a;
      text-align: left;
      padding: 10px 14px;
      font-weight: 600;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .price-col {
      font-weight: 700;
      color: #0d9488;
      text-align: right;
      white-space: nowrap;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0d9488;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .faq-q {
      font-weight: 600;
      color: #0f172a;
      margin-top: 10px;
    }
    .faq-a {
      color: #475569;
      margin-left: 16px;
      margin-bottom: 10px;
    }
    .promise-strip {
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      border-radius: 8px;
      padding: 12px 18px;
      color: #115e59;
      font-weight: 500;
      font-size: 14px;
      margin: 14px 0;
    }
    ul {
      margin: 8px 0;
      padding-left: 24px;
    }
    li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <div class="header">
    <h1>TankmanPro — Official Master Services & Price Catalog</h1>
    <div class="tagline">No stress, no mess – just one call and we handle the rest!</div>
    <div>
      <span class="badge">Verified Professionals</span>
      <span class="badge">30-Day Warranty</span>
      <span class="badge">Integer-Paise Pricing Precedence</span>
      <span class="badge">6-Digit PIN Serviceability</span>
    </div>
    <div style="font-size: 13px; color: #64748b; margin-top: 10px;">
      Active Operational Zones: New Delhi, Kanpur, Shahjahanpur & Expanding across India
    </div>
  </div>

  <h2>1. Water Tank Cleaning (Mechanized 5-Stage Process)</h2>
  <p>Our mechanized deep-cleaning removes dirt, algae, mud, and harmful contaminants without damaging the plastic or concrete surfaces.</p>
  <table>
    <thead>
      <tr>
        <th>Tank Capacity / Size</th>
        <th>Scope of Work</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>500 Liter to 750 Liter</td>
        <td>Dewatering, high-pressure jet cleaning, sludge vacuum & sanitization</td>
        <td class="price-col">₹499/-</td>
      </tr>
      <tr>
        <td>1000 Liter to 1500 Liter</td>
        <td>Dewatering, high-pressure jet cleaning, sludge vacuum & sanitization</td>
        <td class="price-col">₹899/-</td>
      </tr>
      <tr>
        <td>2000 Liter to 3000 Liter</td>
        <td>Dewatering, high-pressure jet cleaning, sludge vacuum & sanitization</td>
        <td class="price-col">₹1,499/-</td>
      </tr>
      <tr>
        <td>4000 Liter to 5000 Liter</td>
        <td>Dewatering, high-pressure jet cleaning, sludge vacuum & sanitization</td>
        <td class="price-col">₹2,499/-</td>
      </tr>
    </tbody>
  </table>

  <h2>2. Floor, Tile & Carpet Cleaning</h2>
  <table>
    <thead>
      <tr>
        <th>Cleaning Category</th>
        <th>Area / Condition</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Floor Cleaning (Standard)</td>
        <td>Up to 100 sq. ft</td>
        <td class="price-col">₹15/- per sq. ft</td>
      </tr>
      <tr>
        <td>Floor Cleaning (Large Space)</td>
        <td>More than 100 sq. ft</td>
        <td class="price-col">₹8/- per sq. ft</td>
      </tr>
      <tr>
        <td>Tiles Cleaning (Floor / Wall)</td>
        <td>Deep tile grout scrubbing & hard-water mark removal</td>
        <td class="price-col">₹15/- per sq. ft</td>
      </tr>
      <tr>
        <td>Carpet Deep Cleaning</td>
        <td>High-power vacuuming, shampooing & moisture extraction</td>
        <td class="price-col">₹10/- per sq. ft</td>
      </tr>
    </tbody>
  </table>

  <h2>3. Sofa & Mattress Sanitization</h2>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Scope</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Sofa & Cushion Cleaning</td>
        <td>Fabric-safe dry dusting, crevice vacuum, foam shampoo & deodorizing</td>
        <td class="price-col">₹149/- to ₹299/- per seat</td>
      </tr>
      <tr>
        <td>Single Bed Mattress</td>
        <td>Dust mite vacuuming, sweat/stain removal & deodorizing</td>
        <td class="price-col">₹349/-</td>
      </tr>
      <tr>
        <td>Double Bed Mattress</td>
        <td>Deep 2-sided allergen extraction & fabric sanitization</td>
        <td class="price-col">₹649/-</td>
      </tr>
    </tbody>
  </table>

  <h2>4. Kitchen Deep Cleaning & Appliances</h2>
  <table>
    <thead>
      <tr>
        <th>Service / Appliance</th>
        <th>Details</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Empty Kitchen Deep Cleaning</td>
        <td>Counters, cabinets, tiles, sink, switchboards & floor scrub</td>
        <td class="price-col">₹499/- to ₹999/-</td>
      </tr>
      <tr>
        <td>Chimney Deep Cleaning</td>
        <td>Filter dismantling, caustic degreasing, motor housing & wipe</td>
        <td class="price-col">₹349/- to ₹899/-</td>
      </tr>
      <tr>
        <td>Empty Kitchen with Chimney</td>
        <td>Full kitchen deep cleaning + complete chimney degreasing</td>
        <td class="price-col">₹899/-</td>
      </tr>
      <tr>
        <td>Empty Kitchen with Appliances</td>
        <td>Kitchen + Gas Stove + Fridge + Microwave + Exhaust/Fan</td>
        <td class="price-col">₹899/- to ₹1,499/-</td>
      </tr>
      <tr>
        <td>Empty Kitchen + Chimney + Appliances</td>
        <td>Complete premium move-in kitchen cleaning combo</td>
        <td class="price-col">₹1,199/- to ₹1,999/-</td>
      </tr>
      <tr>
        <td>Single Door Fridge Cleaning</td>
        <td>Internal shelves, defrost box, door seals & exterior polish</td>
        <td class="price-col">₹349/- to ₹399/-</td>
      </tr>
      <tr>
        <td>Double Door Fridge Cleaning</td>
        <td>Multi-shelf sanitization, odor removal & exterior wipe</td>
        <td class="price-col">₹499/-</td>
      </tr>
      <tr>
        <td>Gas Stove Cleaning</td>
        <td>Burner tops, knobs, glass/steel body degreasing</td>
        <td class="price-col">₹99/-</td>
      </tr>
      <tr>
        <td>Kitchen Sink Cleaning</td>
        <td>Drain mouth scrubbing, tap descaling, stainless polish</td>
        <td class="price-col">₹99/-</td>
      </tr>
      <tr>
        <td>Washbasin Cleaning</td>
        <td>Soap scum removal, limescale treatment, tap shine</td>
        <td class="price-col">₹99/-</td>
      </tr>
      <tr>
        <td>Ceiling Fan Cleaning</td>
        <td>Blades & motor dusting, stain wipe (no uninstall)</td>
        <td class="price-col">₹49/-</td>
      </tr>
      <tr>
        <td>Exhaust Fan Cleaning</td>
        <td>Heavy oil/grease degreasing, blade & casing scrubbing</td>
        <td class="price-col">₹99/-</td>
      </tr>
      <tr>
        <td>Bathroom Deep Cleaning</td>
        <td>Full tile scrubbing, fixtures descaling, mirror & commode deep sanitize</td>
        <td class="price-col">Starting at ₹499/-</td>
      </tr>
    </tbody>
  </table>

  <h2>5. Vehicle Foam Wash & Interior Polish</h2>
  <table>
    <thead>
      <tr>
        <th>Vehicle</th>
        <th>Included In Service</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Two-Wheeler / Bike Wash</td>
        <td>Full-body foam wash, vinyl polish & streak-free wipe</td>
        <td class="price-col">₹99/-</td>
      </tr>
      <tr>
        <td>Car Wash (5-Seater Hatchback/Sedan)</td>
        <td>Exterior foam wash, interior vacuuming & dashboard polish</td>
        <td class="price-col">₹299/-</td>
      </tr>
      <tr>
        <td>Car Wash (7-Seater SUV/MUV)</td>
        <td>Exterior pressure foam wash, 3-row vacuum & trim polish</td>
        <td class="price-col">₹399/-</td>
      </tr>
    </tbody>
  </table>

  <h2>6. AC Service, Repair & Installation</h2>
  <div class="promise-strip">
    Note: Standard ₹299 technician inspection fee is completely waived if any repair or service is booked.
  </div>
  <table>
    <thead>
      <tr>
        <th>AC Service Type</th>
        <th>Key Inclusions</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Window AC General Service</td>
        <td>Filter, cooling coil & tray flush, airflow check</td>
        <td class="price-col">₹499/-</td>
      </tr>
      <tr>
        <td>Split AC General Service</td>
        <td>Indoor cooling coil wash, blower scrub, drain pipe flush</td>
        <td class="price-col">₹599/-</td>
      </tr>
      <tr>
        <td>Foam-Jet AC Deep Cleaning</td>
        <td>High-pressure foam spray, blower chamber sanitation</td>
        <td class="price-col">₹599/- to ₹799/-</td>
      </tr>
      <tr>
        <td>AC Less / No Cooling Repair</td>
        <td>Gas pressure check, sensor & capacitor diagnosis</td>
        <td class="price-col">From ₹599/-</td>
      </tr>
      <tr>
        <td>AC Power / Tripping Repair</td>
        <td>PCB, capacitor, relay, wiring & voltage check</td>
        <td class="price-col">From ₹299/-</td>
      </tr>
      <tr>
        <td>AC Noise & Foul Smell Repair</td>
        <td>Blower alignment, motor lubrication, mold treatment</td>
        <td class="price-col">From ₹299/-</td>
      </tr>
      <tr>
        <td>AC Water Leakage Repair</td>
        <td>Indoor unit drain unclogging, tray leveling</td>
        <td class="price-col">From ₹299/-</td>
      </tr>
      <tr>
        <td>Gas Refill & Leak Check</td>
        <td>Nitrogen pressure test, leak seal, R32/R410A/R22 refill</td>
        <td class="price-col">From ₹1,499/-</td>
      </tr>
      <tr>
        <td>Split AC Installation / Uninstallation</td>
        <td>Unit mounting, copper pipe fitting / safe gas recovery</td>
        <td class="price-col">₹1,499/- / ₹499/-</td>
      </tr>
      <tr>
        <td>Window AC Installation / Uninstallation</td>
        <td>Bracket mounting & window gap seal / safe dismount</td>
        <td class="price-col">₹999/- / ₹399/-</td>
      </tr>
    </tbody>
  </table>

  <h2>7. Geyser Service & Home Appliances</h2>
  <table>
    <thead>
      <tr>
        <th>Service Item</th>
        <th>Scope</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Geyser Installation</td>
        <td>Wall mounting, plumbing inlet/outlet & power connection</td>
        <td class="price-col">₹499/-</td>
      </tr>
      <tr>
        <td>Geyser Service & Descaling</td>
        <td>Heating element descaling, thermostat & safety valve check</td>
        <td class="price-col">₹699/-</td>
      </tr>
      <tr>
        <td>Washing Machine Basic Inspection</td>
        <td>Spin/drain check, error code diagnosis & filter clean</td>
        <td class="price-col">₹299/-</td>
      </tr>
      <tr>
        <td>Washing Machine Motor Repair</td>
        <td>Motor belt, capacitor, bearing or coil replacement</td>
        <td class="price-col">From ₹499/-</td>
      </tr>
      <tr>
        <td>Washing Machine Drain/Inlet Fix</td>
        <td>Water valve replacement, pipe unclogging</td>
        <td class="price-col">From ₹449/-</td>
      </tr>
      <tr>
        <td>Mixer Grinder Repair</td>
        <td>Coupler, carbon brush, jar blade & switch fix</td>
        <td class="price-col">₹210/-</td>
      </tr>
      <tr>
        <td>Room Heater Repair</td>
        <td>Coil, fan, thermostat & safety switch repair</td>
        <td class="price-col">₹279/-</td>
      </tr>
    </tbody>
  </table>

  <h2>8. Certified Electrician Services</h2>
  <div class="promise-strip">
    TankmanPro Promise: 30-Day Service Warranty | Up to ₹10,000 Damage Coverage | Verified & Certified Technicians | ₹299 visit fee waived on service.
  </div>
  <table>
    <thead>
      <tr>
        <th>Service Title</th>
        <th>Description & Scope</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Switchbox Installation</td><td>Wall recess inspection, box mounting & wiring alignment</td><td class="price-col">₹349/-</td></tr>
      <tr><td>AC Heavy Switchbox Installation</td><td>Heavy-duty load fitting for split/window ACs</td><td class="price-col">₹369/-</td></tr>
      <tr><td>Switchboard Installation</td><td>Modular or standard switchboard mounting & connection</td><td class="price-col">₹309/-</td></tr>
      <tr><td>Smart Switch Installation</td><td>Wiring compatibility check & smart switch module setup</td><td class="price-col">₹150/-</td></tr>
      <tr><td>Smart Appliance Controller</td><td>Controller pairing for AC, geyser or heavy devices</td><td class="price-col">₹199/-</td></tr>
      <tr><td>Wi-Fi Smart Switch Installation</td><td>Wi-Fi sync, mobile app pairing & switch setup</td><td class="price-col">₹199/-</td></tr>
      <tr><td>Switch / Socket Replacement</td><td>Safe removal of old damaged socket & new installation</td><td class="price-col">₹109/-</td></tr>
      <tr><td>Switchboard / Switchbox Repair</td><td>Loose terminal repair, spark elimination & contact fix</td><td class="price-col">₹120/-</td></tr>
      <tr><td>Ceiling Fan Installation</td><td>Rod, hook & blade balancing with speed test</td><td class="price-col">₹199/-</td></tr>
      <tr><td>Wall Mount Fan Installation</td><td>Bracket drilling, mounting & angle adjustment</td><td class="price-col">₹139/-</td></tr>
      <tr><td>Exhaust Fan Installation</td><td>Glass/wall vent mounting & power connection</td><td class="price-col">₹199/-</td></tr>
      <tr><td>Decorative / Heavy Ceiling Fan</td><td>Special mounting for chandelier/designer fans</td><td class="price-col">₹469/-</td></tr>
      <tr><td>Fan Replacement</td><td>Old fan removal and new unit mounting</td><td class="price-col">₹259/-</td></tr>
      <tr><td>Fan Repair (Ceiling/Wall/Exhaust)</td><td>Capacitor replacement, humming noise & speed fix</td><td class="price-col">₹199/-</td></tr>
      <tr><td>Fan Regulator Replacement</td><td>Rotary or step regulator install on modular board</td><td class="price-col">₹99/-</td></tr>
      <tr><td>Fan Uninstallation</td><td>Safe disconnection, hook dismount & cable bundling</td><td class="price-col">₹129/-</td></tr>
      <tr><td>Bulb / Tubelight Holder Installation</td><td>Wall/ceiling batten or angle holder setup</td><td class="price-col">₹119/-</td></tr>
      <tr><td>CFL to LED Replacement</td><td>Fitting retrofitting for modern energy-saving LEDs</td><td class="price-col">₹169/-</td></tr>
      <tr><td>Decorative Lights Installation (Per 5m)</td><td>Festive/strip light layout, mounting clips & wiring</td><td class="price-col">₹119/-</td></tr>
      <tr><td>Decorative Lights Uninstallation (Per 20m)</td><td>Safe adhesive & clip removal, wire rolling</td><td class="price-col">₹148/-</td></tr>
      <tr><td>Decorative Lantern Installation</td><td>Hook mounting and aesthetic lighting alignment</td><td class="price-col">₹99/-</td></tr>
      <tr><td>Chandelier Installation (Up to 6 bulbs)</td><td>Reinforced ceiling bracket setup, assembly & test</td><td class="price-col">₹549/-</td></tr>
      <tr><td>Chandelier Installation (More than 6 bulbs)</td><td>Heavy-load structural mounting, multi-tier assembly</td><td class="price-col">₹1,099/-</td></tr>
      <tr><td>New External Wiring with Casing (Per 5m)</td><td>PVC casing-caping, saddle clips & load test</td><td class="price-col">₹249/-</td></tr>
      <tr><td>New External Wiring without Casing (Per 5m)</td><td>Open flexible cable routing & saddle clips</td><td class="price-col">₹129/-</td></tr>
      <tr><td>New Internal Concealed Wiring (Per 5m)</td><td>Wall chiseling, conduit pipe laying & wire pull</td><td class="price-col">₹249/-</td></tr>
      <tr><td>Doorbell Installation / Replacement</td><td>Doorbell mounting, power hookup / old chime replacement</td><td class="price-col">₹299/- / ₹109/-</td></tr>
      <tr><td>Video Doorbell Installation</td><td>Smart camera bell setup, chime connect & app sync</td><td class="price-col">₹600/-</td></tr>
      <tr><td>Single-Pole MCB Installation</td><td>Distribution board DIN-rail mounting & load check</td><td class="price-col">₹150/-</td></tr>
      <tr><td>Double-Pole MCB Installation</td><td>Heavy appliance main isolator / DP MCB setup</td><td class="price-col">₹249/-</td></tr>
      <tr><td>MCB / Fuse Replacement</td><td>Burnt fuse or tripped MCB replacement</td><td class="price-col">₹119/-</td></tr>
      <tr><td>Submeter Installation</td><td>Single-phase submeter for tenant / room tracking</td><td class="price-col">₹249/-</td></tr>
      <tr><td>3-Phase Changeover Switch</td><td>Generator / grid manual changeover switch install</td><td class="price-col">₹369/-</td></tr>
      <tr><td>Inverter Installation (Single Battery)</td><td>Inverter + 1 battery mounting, terminal grease & test</td><td class="price-col">₹486/-</td></tr>
      <tr><td>Inverter Installation (Double Battery)</td><td>Heavy-duty 24V double battery connection & test</td><td class="price-col">₹575/-</td></tr>
      <tr><td>Inverter Servicing (Single / Double Battery)</td><td>Vent cleaning, terminal de-rust, backup load test</td><td class="price-col">₹279/- / ₹449/-</td></tr>
      <tr><td>Inverter Repair</td><td>Backup issue, humming noise, overload error</td><td class="price-col">₹210/-</td></tr>
      <tr><td>Inverter Fuse Replacement</td><td>Blown glass/ceramic fuse replacement</td><td class="price-col">₹129/-</td></tr>
      <tr><td>Inverter Uninstallation</td><td>Safe battery disconnection & terminal insulation</td><td class="price-col">₹499/-</td></tr>
      <tr><td>Stabilizer Installation</td><td>Wall mounting & connection to AC/Fridge/TV</td><td class="price-col">₹249/-</td></tr>
      <tr><td>TV Wall Mount Installation (Up to 48")</td><td>Bracket mounting, screen leveling & HDMI check</td><td class="price-col">₹349/-</td></tr>
      <tr><td>TV Wall Mount Installation (48" - 55")</td><td>Heavy-duty bracket setup & cable management</td><td class="price-col">₹449/-</td></tr>
      <tr><td>TV Wall Mount Installation (55" - 70")</td><td>Large display structural mounting & connectivity</td><td class="price-col">₹549/-</td></tr>
      <tr><td>TV Uninstallation</td><td>Dismounting TV from bracket & cable bundling</td><td class="price-col">₹199/-</td></tr>
      <tr><td>WiFi CCTV Camera Installation</td><td>Camera mounting, angle coverage & mobile app sync</td><td class="price-col">₹199/-</td></tr>
      <tr><td>Karban Airzone Air Purifier Install</td><td>Ceiling/wall airzone purifier setup & airflow test</td><td class="price-col">₹549/-</td></tr>
      <tr><td>Home Theater System Installation</td><td>Multi-speaker surround positioning & audio setup</td><td class="price-col">₹210/-</td></tr>
      <tr><td>EV 2-Wheeler Charger Installation</td><td>Parking area charger unit mounting & MCB hookup</td><td class="price-col">₹750/-</td></tr>
      <tr><td>Electrician Expert Consultation</td><td>Detailed site inspection, wiring audit & quote</td><td class="price-col">₹149/-</td></tr>
    </tbody>
  </table>

  <h2>9. Certified Plumber Services</h2>
  <div class="promise-strip">
    TankmanPro Promise: 30-Day Workmanship Warranty | ₹10,000 Damage Protection | Leak-Free Assurance | Trained & Background-Verified Specialists.
  </div>
  <table>
    <thead>
      <tr>
        <th>Plumbing Service</th>
        <th>Scope of Work</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Bath Accessory Installation</td><td>Towel rack, soap dish, glass shelf, robe hook</td><td class="price-col">₹129/-</td></tr>
      <tr><td>Shower Installation (Ceiling Mounted)</td><td>Overhead rain shower arm & rose fitting</td><td class="price-col">₹169/-</td></tr>
      <tr><td>Shower Installation (Wall / Hand-Held)</td><td>Wall bracket, shower head & flexible hose install</td><td class="price-col">₹159/-</td></tr>
      <tr><td>Wash Basin Installation</td><td>Wall-mounted, pedestal or countertop basin fitting</td><td class="price-col">₹479/-</td></tr>
      <tr><td>Waste Pipe Replacement</td><td>Removal of cracked pipe & flexible PVC waste pipe fitting</td><td class="price-col">₹139/-</td></tr>
      <tr><td>Sink Drainage Removal</td><td>Detach blocked or damaged drainage trap and pipe</td><td class="price-col">₹189/-</td></tr>
      <tr><td>Waste Coupling Installation (Basin)</td><td>Brass or SS waste coupling replacement with sealant</td><td class="price-col">₹149/-</td></tr>
      <tr><td>Bottle Trap Installation</td><td>Designer bottle trap installation for luxury basins</td><td class="price-col">₹219/-</td></tr>
      <tr><td>Bathroom Tile Grouting</td><td>Complete floor & wall joint sealing with waterproof grout</td><td class="price-col">₹1,500/-</td></tr>
      <tr><td>Kitchen Tile Grouting</td><td>Countertop, sink splashback & kitchen tile sealing</td><td class="price-col">₹1,000/-</td></tr>
      <tr><td>Shower Filter Installation</td><td>Hard-water filter attachment to shower connection</td><td class="price-col">₹169/-</td></tr>
      <tr><td>Washing Machine Filter Installation</td><td>Sediment filter attachment to washing machine inlet hose</td><td class="price-col">₹139/-</td></tr>
      <tr><td>Drainage Cover Installation</td><td>Stainless steel or PVC floor jali/cover installation</td><td class="price-col">₹179/-</td></tr>
      <tr><td>Bathroom Drainage Pipe Removal</td><td>Old rusted drain trap & floor outlet removal</td><td class="price-col">₹409/-</td></tr>
      <tr><td>Balcony Drainage Pipe Removal</td><td>Balcony rainwater outlet disassembly</td><td class="price-col">₹299/-</td></tr>
      <tr><td>Tap Repair & Leak Fix</td><td>Washer, spindle, cartridge replacement & leak seal</td><td class="price-col">₹129/-</td></tr>
      <tr><td>Water Mixer Tap Repair</td><td>Wall mixer or basin diverter repair & hot-cold fix</td><td class="price-col">₹309/-</td></tr>
      <tr><td>New Tap Installation</td><td>Bib tap, pillar tap or angle valve installation</td><td class="price-col">₹100/-</td></tr>
    </tbody>
  </table>

  <h2>10. Professional Painter Services</h2>
  <table>
    <thead>
      <tr>
        <th>Painting Category</th>
        <th>Surface & Application</th>
        <th style="text-align: right;">Starting Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Interior Walls Painting</td><td>Double-coat smooth roller finish with primer & putty touch</td><td class="price-col">From ₹8/- per sq. ft</td></tr>
      <tr><td>Exterior Walls Weatherproofing</td><td>Weather-shield anti-fungal exterior emulsion coating</td><td class="price-col">From ₹10/- per sq. ft</td></tr>
      <tr><td>Ceiling Painting</td><td>Anti-damp ceiling coat with bright white reflective finish</td><td class="price-col">From ₹12/- per sq. ft</td></tr>
      <tr><td>Full Home Inspection & Estimate</td><td>Laser measurement, color cards & detailed estimate</td><td class="price-col">₹299/- (Waived)</td></tr>
    </tbody>
  </table>

  <h2>11. Doorstep Carpenter Services</h2>
  <table>
    <thead>
      <tr>
        <th>Carpentry Job</th>
        <th>Scope of Work</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Drilling, Hanging & Curtain Rod Mount</td><td>Curtain rod, heavy wall mirror, painting or shelf mounting</td><td class="price-col">₹149/-</td></tr>
      <tr><td>Door Hinge & Alignment Repair</td><td>Floor-scraping door fix, loose hinge tightening</td><td class="price-col">₹199/-</td></tr>
      <tr><td>Door Lock & Latch Fitting</td><td>Mortise lock, cylindrical knob or tower bolt install</td><td class="price-col">₹249/-</td></tr>
      <tr><td>Furniture Assembly & Tightening</td><td>Bed, wardrobe, dining table assembly & screw tightening</td><td class="price-col">₹299/-</td></tr>
    </tbody>
  </table>

  <h2>12. Beedare by TankmanPro — Salon & Aesthetic Care at Home</h2>
  <div class="promise-strip">
    Delivered by certified beauticians and licensed aesthetic therapists with 100% sanitized, single-use disposable kits in the comfort of your home.
  </div>
  <table>
    <thead>
      <tr>
        <th>Category / Treatment</th>
        <th>Details & Active Benefit</th>
        <th style="text-align: right;">Rate (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Fruit Facial</td><td>Natural hydration and glow for dull skin</td><td class="price-col">₹399/-</td></tr>
      <tr><td>Gold Facial</td><td>Radiance boost, anti-aging & golden sheen</td><td class="price-col">₹699/-</td></tr>
      <tr><td>O3+ Bridal Glow Facial</td><td>Deep pigmentation correction & photo-ready shine</td><td class="price-col">₹999/-</td></tr>
      <tr><td>Detan Clean-Up</td><td>Sun damage, tan and dead skin cell removal</td><td class="price-col">₹499/-</td></tr>
      <tr><td>Charcoal Detox Facial</td><td>Sebum regulation & pore detox for acne-prone skin</td><td class="price-col">₹799/-</td></tr>
      <tr><td>Face Bleach</td><td>Instant brightness and even skin tone</td><td class="price-col">₹299/-</td></tr>
      <tr><td>Hydra Facial Treatment</td><td>Deep vacuum pore cleanse, serum infusion & hydration</td><td class="price-col">₹1,999/-</td></tr>
      <tr><td>Oxygen Facial Treatment</td><td>Hyperbaric oxygen skin revitalization & cellular repair</td><td class="price-col">₹2,499/-</td></tr>
      <tr><td>Korean Glass Facial Treatment</td><td>Multi-step ampoule hydration for glass-smooth skin</td><td class="price-col">₹1,999/-</td></tr>
      <tr><td>Women's Haircut</td><td>Modern layer, feather, bob or precision styling</td><td class="price-col">₹249/-</td></tr>
      <tr><td>Hair Spa Treatment (L'Oreal / Matrix)</td><td>Deep nourishment mask, steam & scalp massage</td><td class="price-col">₹799/-</td></tr>
      <tr><td>Root Touch-Up</td><td>100% grey coverage with ammonia-free formulation</td><td class="price-col">₹499/-</td></tr>
      <tr><td>Global Hair Color</td><td>Full hair transformation with premium color pigments</td><td class="price-col">₹1,299/-</td></tr>
      <tr><td>Basic / Spa Manicure</td><td>Nail grooming, cuticle soak, scrub & hand massage</td><td class="price-col">₹399/- / ₹599/-</td></tr>
      <tr><td>Basic / Spa Pedicure</td><td>Warm herbal soak, heel scrub, mask & foot massage</td><td class="price-col">₹499/- / ₹699/-</td></tr>
      <tr><td>Waxing — Full Arms (Honey / Choc / Roll-on)</td><td>Hygienic hair removal from shoulders to wrists</td><td class="price-col">₹249/- / ₹349/- / ₹299/-</td></tr>
      <tr><td>Waxing — Full Legs (Honey / Choc / Roll-on)</td><td>Flawless leg waxing from thighs to ankles</td><td class="price-col">₹349/- / ₹449/- / ₹399/-</td></tr>
      <tr><td>Waxing — Full Body Package</td><td>Arms, legs, underarms & full body grooming</td><td class="price-col">₹1,299/- to ₹1,999/-</td></tr>
      <tr><td>Party Glam Makeup</td><td>HD base, eye drama, contouring & lipstick for events</td><td class="price-col">₹1,499/-</td></tr>
      <tr><td>Engagement Makeup</td><td>Airbrush/HD finish, false lashes, hairdo & draping</td><td class="price-col">₹2,499/-</td></tr>
      <tr><td>Bridal HD Makeup Package</td><td>Complete wedding day luxury bridal look</td><td class="price-col">₹6,999/- onwards</td></tr>
      <tr><td>Lactic / Salicylic / Glycolic Acid Peel</td><td>Clinical skin resurfacing & acne control</td><td class="price-col">₹1,999/-</td></tr>
      <tr><td>Yellow Peel / TCA Peel</td><td>Anti-aging & stubborn pigmentation treatment</td><td class="price-col">₹3,999/- / ₹2,999/-</td></tr>
      <tr><td>PRP (Platelet-Rich Plasma Therapy)</td><td>Autologous growth factor infusion for hair & skin</td><td class="price-col">₹3,999/-</td></tr>
      <tr><td>Botox Anti-Wrinkle (Per Unit)</td><td>Expression line relaxation & wrinkle prevention</td><td class="price-col">₹300/- per unit</td></tr>
      <tr><td>Full Body Laser Hair Removal</td><td>Triple-wavelength cooling laser for permanent reduction</td><td class="price-col">₹7,999/-</td></tr>
      <tr><td>Full Face Laser Hair Removal</td><td>Upper lip, chin, sideburns & forehead laser removal</td><td class="price-col">₹3,999/-</td></tr>
    </tbody>
  </table>

  <div class="box" style="margin-top: 40px; text-align: center;">
    <strong>TankmanPro — Official Partner Operations & Governance</strong><br>
    Customer Portal: <a href="https://tankmanpro.com/">tankmanpro.com</a> |
    Admin Console: <a href="https://admin.tankmanpro.com/">admin.tankmanpro.com</a> |
    Vendor Portal: <a href="https://partner.tankmanpro.com/">partner.tankmanpro.com</a>
  </div>

</body>
</html>
"""

output_path = os.path.abspath("TankmanPro_Complete_Services_Catalog.html")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML Catalog generated successfully at: {output_path} (Size: {os.path.getsize(output_path)} bytes)")
