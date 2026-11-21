import os
import zipfile
import html

def escape_xml(s):
    if not s:
        return ""
    return (s.replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;")
             .replace('"', "&quot;")
             .replace("'", "&apos;"))

class DocxBuilder:
    def __init__(self):
        self.paragraphs = []
        self.rels = []
        
    def add_title(self, text):
        xml = f'''<w:p>
          <w:pPr>
            <w:pStyle w:val="Title"/>
            <w:jc w:val="center"/>
            <w:spacing w:before="240" w:after="120"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
              <w:color w:val="0D9488"/>
              <w:sz w:val="56"/>
            </w:rPr>
            <w:t>{escape_xml(text)}</w:t>
          </w:r>
        </w:p>'''
        self.paragraphs.append(xml)

    def add_subtitle(self, text):
        xml = f'''<w:p>
          <w:pPr>
            <w:jc w:val="center"/>
            <w:spacing w:before="0" w:after="360"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:i/>
              <w:color w:val="475569"/>
              <w:sz w:val="24"/>
            </w:rPr>
            <w:t>{escape_xml(text)}</w:t>
          </w:r>
        </w:p>'''
        self.paragraphs.append(xml)

    def add_heading1(self, text):
        xml = f'''<w:p>
          <w:pPr>
            <w:pStyle w:val="Heading1"/>
            <w:spacing w:before="360" w:after="120"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
              <w:color w:val="0F766E"/>
              <w:sz w:val="36"/>
            </w:rPr>
            <w:t>{escape_xml(text)}</w:t>
          </w:r>
        </w:p>'''
        self.paragraphs.append(xml)

    def add_heading2(self, text):
        xml = f'''<w:p>
          <w:pPr>
            <w:pStyle w:val="Heading2"/>
            <w:spacing w:before="240" w:after="80"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
              <w:color w:val="1E293B"/>
              <w:sz w:val="28"/>
            </w:rPr>
            <w:t>{escape_xml(text)}</w:t>
          </w:r>
        </w:p>'''
        self.paragraphs.append(xml)

    def add_heading3(self, text):
        xml = f'''<w:p>
          <w:pPr>
            <w:pStyle w:val="Heading3"/>
            <w:spacing w:before="160" w:after="60"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
              <w:color w:val="334155"/>
              <w:sz w:val="24"/>
            </w:rPr>
            <w:t>{escape_xml(text)}</w:t>
          </w:r>
        </w:p>'''
        self.paragraphs.append(xml)

    def add_paragraph(self, text, bold=False, italic=False, color="334155"):
        b_tag = "<w:b/>" if bold else ""
        i_tag = "<w:i/>" if italic else ""
        xml = f'''<w:p>
          <w:pPr>
            <w:spacing w:before="40" w:after="80" w:line="276" w:lineRule="auto"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              {b_tag}
              {i_tag}
              <w:color w:val="{color}"/>
              <w:sz w:val="22"/>
            </w:rPr>
            <w:t xml:space="preserve">{escape_xml(text)}</w:t>
          </w:r>
        </w:p>'''
        self.paragraphs.append(xml)

    def add_bullet(self, text, bold_prefix="", level=0):
        bp_xml = ""
        if bold_prefix:
            bp_xml = f'''<w:r>
              <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="22"/></w:rPr>
              <w:t xml:space="preserve">{escape_xml(bold_prefix)} </w:t>
            </w:r>'''
        xml = f'''<w:p>
          <w:pPr>
            <w:ind w:left="{360 * (level + 1)}" w:hanging="240"/>
            <w:spacing w:before="40" w:after="60"/>
          </w:pPr>
          <w:r>
            <w:rPr><w:color w:val="0D9488"/><w:sz w:val="22"/></w:rPr>
            <w:t xml:space="preserve">▪ </w:t>
          </w:r>
          {bp_xml}
          <w:r>
            <w:rPr><w:color w:val="334155"/><w:sz w:val="22"/></w:rPr>
            <w:t xml:space="preserve">{escape_xml(text)}</w:t>
          </w:r>
        </w:p>'''
        self.paragraphs.append(xml)

    def add_table(self, headers, rows):
        tbl_xml = ['<w:tbl>',
          '''<w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
              <w:insideV w:val="none"/>
              <w:left w:val="none"/>
              <w:right w:val="none"/>
            </w:tblBorders>
            <w:tblCellMar>
              <w:top w:w="120" w:type="dxa"/>
              <w:bottom w:w="120" w:type="dxa"/>
              <w:left w:w="160" w:type="dxa"/>
              <w:right w:w="160" w:type="dxa"/>
            </w:tblCellMar>
          </w:tblPr>''']
        
        # Header Row
        tbl_xml.append('<w:tr><w:trPr><w:tblHeader/></w:trPr>')
        for h in headers:
            tbl_xml.append(f'''<w:tc>
              <w:tcPr>
                <w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>
              </w:tcPr>
              <w:p>
                <w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>
                <w:r>
                  <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="22"/></w:rPr>
                  <w:t>{escape_xml(h)}</w:t>
                </w:r>
              </w:p>
            </w:tc>''')
        tbl_xml.append('</w:tr>')

        # Data Rows
        for r_idx, row in enumerate(rows):
            bg = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
            tbl_xml.append('<w:tr>')
            for c_idx, cell in enumerate(row):
                is_first = (c_idx == 0)
                is_last = (c_idx == len(row) - 1)
                b_tag = "<w:b/>" if is_first or is_last else ""
                col_val = "0D9488" if is_last else "1E293B"
                tbl_xml.append(f'''<w:tc>
                  <w:tcPr>
                    <w:shd w:val="clear" w:color="auto" w:fill="{bg}"/>
                  </w:tcPr>
                  <w:p>
                    <w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>
                    <w:r>
                      <w:rPr>{b_tag}<w:color w:val="{col_val}"/><w:sz w:val="22"/></w:rPr>
                      <w:t>{escape_xml(cell)}</w:t>
                    </w:r>
                  </w:p>
                </w:tc>''')
            tbl_xml.append('</w:tr>')
            
        tbl_xml.append('</w:tbl>')
        self.paragraphs.append("".join(tbl_xml))

    def save(self, filepath):
        content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>'''

        rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

        doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

        styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="334155"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>'''

        doc_body = "".join(self.paragraphs)
        doc = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {doc_body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>'''

        with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as z:
            z.writestr('[Content_Types].xml', content_types)
            z.writestr('_rels/.rels', rels)
            z.writestr('word/_rels/document.xml.rels', doc_rels)
            z.writestr('word/styles.xml', styles)
            z.writestr('word/document.xml', doc)
        print(f"Docx file created successfully at: {filepath} (Size: {os.path.getsize(filepath)} bytes)")

def build_catalog():
    doc = DocxBuilder()
    
    # Title & Subtitle
    doc.add_title("TankmanPro — Official Master Services & Price Catalog")
    doc.add_subtitle("Complete Operational Guide, Package Inclusions, Step-by-Step SOPs, Customer FAQs & Pricing")
    doc.add_paragraph("Tagline: No stress, no mess – just one call and we handle the rest!", italic=True, color="0D9488")
    doc.add_paragraph("Coverage: New Delhi, Kanpur, Shahjahanpur & Expanding across India")
    doc.add_paragraph("Platform Architecture: Integrated Admin Console, Customer Storefront & Verified Partner Portal")
    doc.add_paragraph("------------------------------------------------------------------------------------------------------------------------", color="CBD5E1")

    # 1. WATER TANK CLEANING
    doc.add_heading1("1. Mechanized Water Tank Cleaning")
    doc.add_paragraph("Ensure 100% clean, safe, and hygienic water storage with TankmanPro's professional water tank cleaning service. Our specialized 5-step mechanized deep-cleaning process removes dirt, algae, mud, and harmful bacterial contaminants without damaging tank surfaces.")
    doc.add_heading3("Pricing Matrix")
    doc.add_table(["Tank Capacity / Size", "Scope & Technology", "Standard Rate (₹)"], [
        ["500 Liter to 750 Liter", "Mechanized 5-Stage Dewatering, Jet Wash & Vacuum", "₹499/-"],
        ["1000 Liter to 1500 Liter", "Mechanized 5-Stage Dewatering, Jet Wash & Vacuum", "₹899/-"],
        ["2000 Liter to 3000 Liter", "Mechanized 5-Stage Dewatering, Jet Wash & Vacuum", "₹1,499/-"],
        ["4000 Liter to 5000 Liter", "Mechanized 5-Stage Dewatering, Jet Wash & Vacuum", "₹2,499/-"]
    ])
    doc.add_heading3("Step-by-Step Cleaning Process:")
    doc.add_bullet("Cleaning dirt, mud, and algae around the tank manhole opening.", bold_prefix="Stage 1: Manhole & Surrounding Cleaning -")
    doc.add_bullet("Water below the foot-valve level is pumped out using industrial dewatering pumps.", bold_prefix="Stage 2: Mechanized De-watering -")
    doc.add_bullet("Tank walls and base are scrubbed to lift algae, sediments, and biofilm safely.", bold_prefix="Stage 3: Gentle Scrubbing -")
    doc.add_bullet("Rotary high-pressure spray cleans internal walls, ceiling, and joints.", bold_prefix="Stage 4: High-Pressure Jet Washing -")
    doc.add_bullet("Sludge, dirty water, and residue are extracted with heavy-duty wet vacuums.", bold_prefix="Stage 5: Sludge Vacuuming & Sanitization -")
    doc.add_heading3("Customer FAQs:")
    doc.add_bullet("Yes, we service PVC/plastic overhead tanks, loft tanks, and underground concrete sumps.", bold_prefix="Q: Is it suitable for all tank types?")
    doc.add_bullet("Around 45 to 90 minutes depending on capacity and silt thickness.", bold_prefix="Q: How long does the service take?")

    # 2. FLOOR & TILE CLEANING
    doc.add_heading1("2. Floor & Tile Deep Cleaning")
    doc.add_heading3("Pricing Matrix")
    doc.add_table(["Service Variant", "Measurement / Condition", "Rate (₹)"], [
        ["Floor Cleaning (Small Area)", "Up to 100 sq. ft", "₹15/- per sq. ft"],
        ["Floor Cleaning (Large Area)", "More than 100 sq. ft", "₹8/- per sq. ft"],
        ["Tiles Cleaning (Floor / Wall)", "Gap & Grout Focused scrubbing", "₹15/- per sq. ft"]
    ])
    doc.add_bullet("Surface evaluation and loose dirt sweep.", bold_prefix="Step 1: Dry Dusting -")
    doc.add_bullet("Application of safe, tile-friendly chemicals for hard water marks & grout stains.", bold_prefix="Step 2: Chemical Scrubbing -")
    doc.add_bullet("Microfiber polish for streak-free shine and restored glaze.", bold_prefix="Step 3: Wet Wipe & Buffing -")

    # 3. CARPET CLEANING
    doc.add_heading1("3. Deep Carpet Cleaning")
    doc.add_paragraph("Pricing: ₹10/- per sq. ft (Calculated based on actual measured area)")
    doc.add_bullet("Surface and fiber inspection for pet stains and heavy traffic spots.")
    doc.add_bullet("High-power dry vacuuming to lift settled dust and hair.")
    doc.add_bullet("Shampooing with fabric-safe eco-friendly cleaners.")
    doc.add_bullet("Wet extraction and natural air-drying (dry within 3–4 hours).")

    # 4. SOFA & CUSHION CLEANING
    doc.add_heading1("4. Sofa & Cushion Sanitization")
    doc.add_paragraph("Pricing: ₹149/- to ₹299/- per seat (Standard Fabric ₹199/seat, Deep Recliner ₹299/seat)")
    doc.add_bullet("Inspection of fabric type and stain nature.")
    doc.add_bullet("Dry vacuuming of crevices, under-cushion gaps, and rear seams.")
    doc.add_bullet("Foam shampooing with anti-allergen compounds.")
    doc.add_bullet("Spot stain treatment for ink, food, or grease spots.")
    doc.add_bullet("Moisture extraction and mild fragrance deodorizer spray.")

    # 5. MATTRESS CLEANING
    doc.add_heading1("5. Deep Mattress Cleaning")
    doc.add_table(["Mattress Variant", "Scope", "Rate (₹)"], [
        ["Single Bed Mattress", "Complete 2-side vacuum, spot stain & deodorize", "₹349/-"],
        ["Double / King Bed Mattress", "Complete 2-side vacuum, spot stain & deodorize", "₹649/-"]
    ])
    doc.add_bullet("Dust mite, dead skin cell, and deep allergen vacuum extraction.")
    doc.add_bullet("Special treatment for sweat, pet, and beverage stains.")
    doc.add_bullet("Controlled moisture foam shampooing; dries completely within 3–5 hours.")

    # 6. BATHROOM CLEANING
    doc.add_heading1("6. Bathroom Deep Cleaning & Sanitization")
    doc.add_paragraph("Starting from ₹499/- (Standard Deep Clean ₹499, Luxury Full Scrub ₹899)")
    doc.add_bullet("Floor and wall tile scrubbing with hard water limescale removal.")
    doc.add_bullet("Washbasin, commode, and tap/fixture descaling and chrome polishing.")
    doc.add_bullet("Mirror polishing, exhaust vent wiping, and anti-bacterial floor sanitization.")

    # 7. KITCHEN CLEANING & APPLIANCES
    doc.add_heading1("7. Kitchen Deep Cleaning & Appliance Care")
    doc.add_table(["Package / Item", "Includes", "Rate (₹)"], [
        ["Empty Kitchen Deep Cleaning", "Cabinets, tiles, countertops, sink, floor", "₹499/- to ₹999/-"],
        ["Chimney Deep Cleaning", "Baffle filter degreasing, motor housing, outer scrub", "₹349/- to ₹899/-"],
        ["Empty Kitchen + Chimney", "Full kitchen deep clean + complete chimney degreasing", "₹899/-"],
        ["Empty Kitchen + Appliances", "Kitchen + Gas Stove + Fridge + Microwave + Fan", "₹899/- to ₹1,499/-"],
        ["Empty Kitchen + Chimney + Appliances", "All-in-one comprehensive kitchen package", "₹1,199/- to ₹1,999/-"],
        ["Single Door Refrigerator", "Interior trays, freezer defrost, exterior shine", "₹349/- to ₹399/-"],
        ["Double Door Refrigerator", "Interior compartments, deodorize, exterior buffing", "₹499/-"],
        ["Gas Stove Deep Cleaning", "Burners, knobs, glass/steel surface degreasing", "₹99/-"],
        ["Kitchen Sink / Washbasin", "Drain mouth scrubbing, tap descaling, basin shine", "₹99/-"],
        ["Ceiling Fan Cleaning", "Blades & motor dusting, stain wipe (no uninstall)", "₹49/-"],
        ["Exhaust Fan Cleaning", "Heavy grease removal, motor housing chemical scrub", "₹99/-"]
    ])

    # 8. VEHICLE WASH
    doc.add_heading1("8. Doorstep Vehicle Foam Wash & Interior Polish")
    doc.add_table(["Vehicle Type", "Scope of Work", "Rate (₹)"], [
        ["Two-Wheeler / Bike Wash", "Full foam wash, vinyl polish & microfiber dry", "₹99/-"],
        ["Car Wash (5-Seater Hatchback/Sedan)", "Exterior foam + interior vacuum + dashboard polish", "₹299/-"],
        ["Car Wash (7-Seater SUV/MUV)", "Exterior foam + 3-row vacuum + dashboard/trim polish", "₹399/-"]
    ])

    # 9. AC SERVICE & REPAIR
    doc.add_heading1("9. AC Service, Repair & Installation")
    doc.add_table(["AC Service Item", "Key Highlights", "Rate (₹)"], [
        ["Window AC Service", "Filter, coil & tray cleaning, airflow test", "₹499/-"],
        ["Split AC Service", "Indoor unit foam wash, blower scrub, drain flush", "₹599/-"],
        ["Foam-Jet AC Deep Cleaning", "High-pressure jet wash, blower chamber sanitation", "₹599/- to ₹799/-"],
        ["AC Less / No Cooling Repair", "Gas pressure check, sensor/coil diagnosis", "From ₹599/-"],
        ["AC Power / Tripping Repair", "Capacitor, PCB, relay, MCB & fuse check", "From ₹299/-"],
        ["AC Noise & Smell Elimination", "Blower alignment, motor lubrication, mold treatment", "From ₹299/-"],
        ["AC Water Leakage Repair", "Drain pipe unclogging, tray leveling & sealing", "From ₹299/-"],
        ["Gas Refill & Leak Detection", "Nitrogen pressure test, leak brazing, R32/R410A/R22", "From ₹1,499/-"],
        ["Split AC Installation", "Indoor + outdoor mounting, copper pipe fitting", "₹1,499/-"],
        ["Split AC Uninstallation", "Safe gas lock, unit dismounting & pipe packing", "₹499/-"],
        ["Window AC Installation / Uninstallation", "Bracket fixing / removal & window gap sealing", "₹999/- / ₹399/-"]
    ])
    doc.add_paragraph("Note: ₹299 technician inspection fee applies ONLY if no service is booked post-diagnosis.", italic=True)

    # 10. GEYSER SERVICE & APPLIANCE REPAIR
    doc.add_heading1("10. Geyser & Home Appliance Repair")
    doc.add_table(["Appliance Service", "Scope", "Rate (₹)"], [
        ["Geyser Installation", "Wall mounting, inlet/outlet plumbing & power hookup", "₹499/-"],
        ["Geyser Deep Service & Descaling", "Heating element descaling, thermostat testing", "₹699/-"],
        ["Washing Machine Basic Inspection", "Drum check, error code diagnosis, filter unclog", "₹299/-"],
        ["Washing Machine Motor Repair", "Belt, capacitor, motor coil or bearing fix", "From ₹499/-"],
        ["Washing Machine Drain/Inlet Fix", "Valve replacement, pipe leak repair", "From ₹449/-"],
        ["Mixer Grinder Repair", "Coupler, carbon brush, jar blade & switch fix", "₹210/-"],
        ["Room Heater Repair", "Coil, fan, thermostat & safety switch repair", "₹279/-"]
    ])

    # 11. ELECTRICIAN SERVICES
    doc.add_heading1("11. Certified Electrician Services")
    doc.add_paragraph("TankmanPro Electrician Promise: 30-Day Service Warranty | Up to ₹10,000 Damage Protection | Verified & Certified Technicians | ₹299 visit fee waived when any service is availed.", bold=True, color="0D9488")
    
    doc.add_heading2("A. Switch, Socket & Smart Home Automation")
    doc.add_table(["Service Title", "Description", "Rate (₹)"], [
        ["Switchbox Installation", "Wall recess inspection, box mounting & wiring alignment", "₹349/-"],
        ["AC Heavy Switchbox Installation", "Heavy-duty load fitting for split/window ACs", "₹369/-"],
        ["Switchboard Installation", "Modular or standard switchboard mounting & connection", "₹309/-"],
        ["Smart Switch Installation", "Wiring compatibility check & smart switch module setup", "₹150/-"],
        ["Smart Appliance Controller", "Controller pairing for AC, geyser or heavy devices", "₹199/-"],
        ["Wi-Fi Smart Switch Installation", "Wi-Fi sync, mobile app pairing & switch setup", "₹199/-"],
        ["Switch / Socket Replacement", "Safe removal of old damaged socket & new installation", "₹109/-"],
        ["Switchboard / Switchbox Repair", "Loose terminal repair, spark elimination & contact fix", "₹120/-"]
    ])

    doc.add_heading2("B. Fan Installation & Repairs")
    doc.add_table(["Fan Service Title", "Details", "Rate (₹)"], [
        ["Ceiling Fan Installation", "Rod, hook & blade balancing with speed test", "₹199/-"],
        ["Wall Mount Fan Installation", "Bracket drilling, mounting & angle adjustment", "₹139/-"],
        ["Exhaust Fan Installation", "Glass/wall vent mounting & power connection", "₹199/-"],
        ["Decorative / Heavy Ceiling Fan", "Special mounting for chandelier/designer fans", "₹469/-"],
        ["Fan Replacement", "Old fan removal and new unit mounting", "₹259/-"],
        ["Fan Repair (Ceiling / Wall / Exhaust)", "Capacitor replacement, humming noise & speed fix", "₹199/-"],
        ["Fan Regulator Replacement", "Rotary or step regulator install on modular board", "₹99/-"],
        ["Fan Uninstallation", "Safe disconnection, hook dismount & cable bundling", "₹129/-"]
    ])

    doc.add_heading2("C. Lighting & Decorative Fixtures")
    doc.add_table(["Lighting Service", "Details", "Rate (₹)"], [
        ["Bulb / Tubelight Holder Installation", "Wall/ceiling batten or angle holder setup", "₹119/-"],
        ["CFL to LED Conversion", "Fitting retrofitting for modern energy-saving LEDs", "₹169/-"],
        ["Wall / Ceiling Light Fitting", "Up to 5 LED/CFL bulbs: ₹139 | Tubelight: ₹120 | Ceiling: ₹290 | Wall: ₹199", "₹99/- to ₹290/-"],
        ["Decorative Lantern Installation", "Hook mounting and aesthetic lighting alignment", "₹99/-"],
        ["Decorative Lights (Per 5m)", "Festive/strip light layout, mounting clips & wiring", "₹119/-"],
        ["Decorative Lights Uninstallation (Per 20m)", "Safe adhesive & clip removal, wire rolling", "₹148/-"],
        ["Chandelier Installation (Up to 6 bulbs)", "Reinforced ceiling bracket setup, assembly & test", "₹549/-"],
        ["Chandelier Installation (Over 6 bulbs)", "Heavy-load structural mounting, multi-tier assembly", "₹1,099/-"]
    ])

    doc.add_heading2("D. Electrical Wiring")
    doc.add_table(["Wiring Service", "Details", "Rate (₹)"], [
        ["New External Wiring with Casing (Per 5m)", "PVC casing-caping, saddle clips & load test", "₹249/-"],
        ["New External Wiring without Casing (Per 5m)", "Open flexible cable routing & saddle clips", "₹129/-"],
        ["New Internal Concealed Wiring (Per 5m)", "Wall chiseling, conduit pipe laying & wire pull", "₹249/-"]
    ])

    doc.add_heading2("E. Power Distribution: MCB & Submeters")
    doc.add_table(["Distribution Service", "Scope", "Rate (₹)"], [
        ["Single-Pole MCB Installation", "Distribution board DIN-rail mounting & load check", "₹150/-"],
        ["Double-Pole MCB Installation", "Heavy appliance main isolator / DP MCB setup", "₹249/-"],
        ["MCB / Fuse Replacement", "Burnt fuse or tripped MCB replacement", "₹119/-"],
        ["Submeter Installation", "Single-phase submeter for tenant / room tracking", "₹249/-"],
        ["3-Phase Changeover Switch", "Generator / grid manual changeover switch install", "₹369/-"]
    ])

    doc.add_heading2("F. Inverter & Stabilizer Setup")
    doc.add_table(["Inverter / Stabilizer Service", "Details", "Rate (₹)"], [
        ["Inverter Installation (Single Battery)", "Inverter + 1 battery mounting, terminal grease & test", "₹486/-"],
        ["Inverter Installation (Double Battery)", "Heavy-duty 24V double battery connection & test", "₹575/-"],
        ["Inverter Servicing (Single Battery)", "Vent cleaning, terminal de-rust, backup load test", "₹279/-"],
        ["Inverter Servicing (Double Battery)", "Dual terminal clean, voltage check & backup test", "₹449/-"],
        ["Inverter Repair", "Power backup, noise, overload or no-charge issue", "₹210/-"],
        ["Inverter Fuse Replacement", "Blown glass or ceramic fuse replacement", "₹129/-"],
        ["Inverter Uninstallation", "Safe battery disconnection & terminal insulation", "₹499/-"],
        ["Stabilizer Installation", "Wall mounting & connection to AC/Fridge/TV", "₹249/-"]
    ])

    doc.add_heading2("G. Advanced Appliances & Smart Devices")
    doc.add_table(["Device Service", "Details", "Rate (₹)"], [
        ["TV Wall Mount Installation (Up to 48\")", "Bracket mounting, screen leveling & HDMI/AV check", "₹349/-"],
        ["TV Wall Mount Installation (48\" to 55\")", "Heavy-duty bracket setup & cable management", "₹449/-"],
        ["TV Wall Mount Installation (55\" to 70\")", "Large display structural mounting & connectivity", "₹549/-"],
        ["TV Uninstallation", "Dismounting TV from bracket & cable bundling", "₹199/-"],
        ["Doorbell Installation / Replacement", "Ding-dong / electronic doorbell mounting & hookup", "₹299/- / ₹109/-"],
        ["Video Doorbell Installation", "Smart camera bell setup, chime connect & app sync", "₹600/-"],
        ["Wi-Fi CCTV Camera Installation", "Camera mounting, angle coverage & mobile app sync", "₹199/-"],
        ["Karban Airzone Air Purifier Install", "Ceiling/wall airzone purifier setup & airflow test", "₹549/-"],
        ["Home Theater Sound System Install", "Multi-speaker surround positioning & audio setup", "₹210/-"],
        ["EV 2-Wheeler Charger Installation", "Parking area charger unit mounting & MCB hookup", "₹750/-"],
        ["Electrician Expert Consultation", "Detailed site inspection, wiring audit & quote", "₹149/-"]
    ])

    # 12. PLUMBER SERVICES
    doc.add_heading1("12. Certified Plumber Services")
    doc.add_paragraph("TankmanPro Plumbing Promise: 30-Day Workmanship Warranty | ₹10,000 Damage Protection | Leak-Free Assurance | Trained & Background-Verified Specialists.", bold=True, color="0D9488")
    
    doc.add_table(["Plumbing Category & Service", "Details & Scope", "Rate (₹)"], [
        ["Bath Accessory Installation", "Towel ring, soap dish, glass shelf, robe hook", "₹129/-"],
        ["Ceiling Mounted Shower Installation", "Overhead rain shower arm & rose fitting", "₹169/-"],
        ["Wall Mounted / Hand-Held Shower", "Wall bracket, shower head & flexible hose install", "₹159/-"],
        ["Wash Basin Installation", "Wall-hung or counter basin mounting & waste connect", "₹479/-"],
        ["Waste Pipe Replacement", "Flexible PVC waste pipe for washbasin or sink", "₹139/-"],
        ["Sink Drainage Removal", "Detach blocked or damaged drainage trap and pipe", "₹189/-"],
        ["Waste Coupling (Basin)", "Brass or SS waste coupling replacement with sealant", "₹149/-"],
        ["Bottle Trap Installation", "Designer bottle trap installation for luxury basins", "₹219/-"],
        ["Bathroom Tile Grouting", "Complete floor & wall joint sealing with waterproof grout", "₹1,500/-"],
        ["Kitchen Tile Grouting", "Countertop, sink splashback & kitchen tile sealing", "₹1,000/-"],
        ["Shower Water Softener Filter", "Hard-water filter attachment to shower connection", "₹169/-"],
        ["Washing Machine Inlet Filter", "Sediment filter attachment to washing machine tap", "₹139/-"],
        ["Drainage Cover Installation", "Stainless steel or PVC jali/cover installation", "₹179/-"],
        ["Bathroom Drainage Pipe Removal", "Old rusted drain trap & floor outlet removal", "₹409/-"],
        ["Balcony Drainage Pipe Removal", "Balcony rainwater outlet disassembly", "₹299/-"],
        ["Tap Repair", "Washer, spindle, cartridge replacement & leak seal", "₹129/-"],
        ["Water Mixer Tap Repair", "Wall mixer or basin diverter repair & hot-cold fix", "₹309/-"],
        ["New Tap Installation", "Bib tap, pillar tap or angle valve installation", "₹100/-"]
    ])

    # 13. PAINTER SERVICES
    doc.add_heading1("13. Professional Painting Services")
    doc.add_paragraph("Neat, even finishes using premium paints (Asian Paints, Berger, Nerolac, Dulux). Includes surface sanding, primer, putty coat, double paint finish, and post-work cleanup.")
    doc.add_table(["Painting Scope", "Surface & Execution", "Starting Rate (₹)"], [
        ["Interior Walls Painting", "Living rooms, bedrooms, hallways with smooth roller finish", "From ₹8/- per sq. ft"],
        ["Exterior Walls Weatherproofing", "All-weather anti-fungal exterior emulsion coating", "From ₹10/- per sq. ft"],
        ["Ceiling Painting", "Anti-damp ceiling coat with bright white reflective finish", "From ₹12/- per sq. ft"],
        ["Touch-up & Accent Wall", "Geometric textures, stencil patterns, feature wall", "Custom Quote"],
        ["Full Home Painting Package", "Comprehensive inspection, masking, putty & 2 coats", "Inspection Based"]
    ])

    # 14. CARPENTER SERVICES
    doc.add_heading1("14. Doorstep Carpenter Services")
    doc.add_table(["Carpentry Service", "Description", "Starting Rate (₹)"], [
        ["Door Lock & Handle Fitting", "Mortise lock, cylindrical lock, latch installation", "From ₹249/-"],
        ["Door Hinge & Alignment Fix", "Fixing loose doors, creaking hinges, floor scrape", "From ₹199/-"],
        ["Furniture Assembly / Repair", "Bed, wardrobe, dining table assembly & tightening", "From ₹299/-"],
        ["Drilling, Hanging & Mounts", "Curtain rods, wall art, mirror & shelf fixing", "From ₹149/-"],
        ["Custom Woodwork & Cabinets", "Kitchen shelf repair, drawer channel replacement", "Inspection Based"]
    ])

    # 15. BEEDARE BY TANKMANPRO (BEAUTY & AESTHETICS)
    doc.add_heading1("15. Beedare by TankmanPro — Salon & Aesthetic Care at Home")
    doc.add_paragraph("Premium beauty, salon, clinical skin peel and aesthetic services delivered at home by certified beauticians & licensed aesthetic therapists with 100% sanitized single-use kits.", bold=True, color="0D9488")
    
    doc.add_heading2("A. Facials & Skincare")
    doc.add_table(["Treatment Name", "Target Skin Benefit", "Rate (₹)"], [
        ["Fruit Facial", "Natural hydration and glow for dull skin", "₹399/-"],
        ["Gold Facial", "Radiance boost, anti-aging & golden sheen", "₹699/-"],
        ["O3+ Bridal Glow Facial", "Deep pigmentation correction & photo-ready shine", "₹999/-"],
        ["Detan Clean-Up", "Sun damage, tan and dead skin cell removal", "₹499/-"],
        ["Charcoal Detox Facial", "Sebum regulation & pore detox for acne-prone skin", "₹799/-"],
        ["Face Bleach", "Instant brightness and even skin tone", "₹299/-"],
        ["Hydra Facial Treatment", "Deep vacuum pore cleanse, serum infusion & hydration", "₹1,999/-"],
        ["Oxygen Facial Treatment", "Hyperbaric oxygen skin revitalization & cellular repair", "₹2,499/-"],
        ["Whitening Peel Facial", "Targeted melanin inhibition & pigmentation fading", "₹1,999/-"],
        ["Korean Glass Facial", "Multi-step ampoule hydration for glass-smooth skin", "₹1,999/-"],
        ["Rice Milk Whitening Facial", "Traditional brightening, softening & tone correction", "₹1,999/-"]
    ])

    doc.add_heading2("B. Haircare & Styling")
    doc.add_table(["Hair Service", "Products Used & Scope", "Rate (₹)"], [
        ["Women's Haircut", "Modern layer, feather, bob or precision styling", "₹249/-"],
        ["Hair Spa Treatment", "L'Oreal / Matrix deep nourishment mask & massage", "₹799/-"],
        ["Root Touch-Up", "100% grey coverage with ammonia-free formulation", "₹499/-"],
        ["Global Hair Coloring", "Full hair transformation with premium color pigments", "₹1,299/-"],
        ["Blow Dry / Soft Curls", "Occasion styling, thermal protection & volume bounce", "₹399/-"],
        ["Stress-Relief Head Massage", "Warm herb-infused oil massage for hair root strength", "₹299/-"]
    ])

    doc.add_heading2("C. Hand & Foot Care")
    doc.add_table(["Service Title", "Includes", "Rate (₹)"], [
        ["Basic Manicure", "Nail trimming, shaping, cuticle care & hand massage", "₹399/-"],
        ["Spa Manicure", "Aromatherapy soak, dead skin scrub, brightening mask", "₹599/-"],
        ["Basic Pedicure", "Warm herbal soak, heel scrub, nail buff & massage", "₹499/-"],
        ["Spa Pedicure", "Intensive callus softening, scrub, mud pack & polish", "₹699/-"],
        ["Designer Nail Art", "Gel polish, chrome shine, french tips, glitter art", "₹199/- onwards"]
    ])

    doc.add_heading2("D. Hygienic Waxing Services")
    doc.add_table(["Body Area", "Honey Wax (₹)", "Chocolate Wax (₹)", "Roll-On Wax (₹)"], [
        ["Full Arms", "₹249/-", "₹349/-", "₹299/-"],
        ["Underarms", "₹129/-", "₹149/-", "₹129/-"],
        ["Full Legs", "₹349/-", "₹449/-", "₹399/-"],
        ["Half Legs", "₹249/-", "₹299/-", "₹269/-"],
        ["Full Body Waxing Package", "₹1,999/-", "₹1,499/- (Promo)", "₹1,299/-"]
    ])

    doc.add_heading2("E. Make-up, Draping & Celebration Combos")
    doc.add_table(["Make-up & Styling Service", "Includes", "Rate (₹)"], [
        ["Party Glam Make-up", "HD base, eye drama, contouring & lipstick for events", "₹1,499/-"],
        ["Engagement Make-up", "Airbrush/HD finish, false lashes, hairdo & draping", "₹2,499/-"],
        ["Bridal HD Make-up Package", "Complete wedding day luxury bridal look with jewelry set", "₹6,999/- onwards"],
        ["Haldi / Mehendi Fresh Look", "Dewy, lightweight glowing makeup & floral hairstyle", "₹999/-"],
        ["Saree Draping + Hairstyling", "Pleat setting, styling, bobby pins & quick curls", "₹599/-"],
        ["All-in-One Glow Package", "Facial + Full Arms/Legs Waxing + Threading combo", "₹1,199/-"],
        ["Monthly Complete Grooming Pack", "Regular self-care head-to-toe bundle", "₹1,499/-"],
        ["Pre-Bridal 3-Day Package", "3-Day holistic skin, body polish & hair ritual", "₹4,999/-"],
        ["Men's Quick Grooming Pack", "Haircut, beard trim, detan pack & face clean-up", "₹899/-"],
        ["Festival Ready Look", "Full skin prep, hair styling & party touch-up", "₹1,499/-"]
    ])

    doc.add_heading2("F. Advanced Chemical Peels & Clinical Aesthetics")
    doc.add_table(["Clinical Treatment", "Active Ingredients / Mechanism", "Rate (₹)"], [
        ["Lactic Acid Peel", "Gentle milk-derived exfoliation for sensitive skin", "₹1,999/-"],
        ["Salicylic Acid Peel", "BHA pore unclogging, blackhead removal & acne care", "₹1,999/-"],
        ["Yellow Peel", "Retinol & arbutin anti-aging pigment resurfacing", "₹3,999/-"],
        ["TCA Peel", "Trichloroacetic acid treatment for stubborn scars & marks", "₹2,999/-"],
        ["Vitamin C Glow Peel", "Ascorbic acid boost for sun damage & oxidation", "₹1,999/-"],
        ["Glycolic Acid Peel", "AHA micro-peeling for fine lines & texture smoothing", "₹1,999/-"],
        ["PRP (Platelet-Rich Plasma)", "Autologous growth factor infusion for hair/skin", "₹3,999/-"],
        ["Botox Treatment (Per Unit)", "Expression line relaxation & wrinkle prevention", "₹300/- per unit"],
        ["Skin Booster Treatment", "Deep hyaluronic acid mesotherapy for deep hydration", "₹14,999/-"],
        ["Micro-Needling Therapy", "Microneedle stimulation for acne scar reduction", "₹4,999/-"],
        ["Dermapen Collagen Induction", "Automated motorized pen for skin firmness & pore shrinking", "₹4,999/-"]
    ])

    doc.add_heading2("G. Permanent Laser Hair Removal")
    doc.add_table(["Laser Treatment Area", "Session Technology & Benefits", "Package Rate (₹)"], [
        ["Full Body Laser Hair Removal", "Triple-wavelength cooling laser for pain-free reduction", "₹7,999/-"],
        ["Full Face Laser", "Upper lip, chin, sideburns & forehead precision hair removal", "₹3,999/-"],
        ["Bikini Line Laser", "Gentle, hygienic & long-lasting hair removal", "₹3,999/-"],
        ["Full Arms Laser", "Complete shoulder-to-wrist hair reduction", "₹4,999/-"],
        ["Full Legs Laser", "Complete thigh-to-ankle smooth finish", "₹4,999/-"]
    ])

    # Footer Notes
    doc.add_paragraph("------------------------------------------------------------------------------------------------------------------------", color="CBD5E1")
    doc.add_paragraph("TankmanPro Platform Operational Policies:", bold=True)
    doc.add_bullet("All services are backed by TankmanPro verified partner network.")
    doc.add_bullet("Admin Console allows dynamic assignment of any vendor to any city, zone, or service category.")
    doc.add_bullet("Integer-paise pricing architecture guarantees zero billing drift.")
    doc.add_bullet("Customer contact details and address lines remain masked until job acceptance for field privacy.")
    doc.add_paragraph("Official Website: https://tankmanpro.com/ | Partner Portal: https://partner.tankmanpro.com/", italic=True, color="0D9488")
    
    output_docx = os.path.abspath("TankmanPro_Complete_Services_Catalog.docx")
    doc.save(output_docx)
    return output_docx

if __name__ == "__main__":
    build_catalog()
