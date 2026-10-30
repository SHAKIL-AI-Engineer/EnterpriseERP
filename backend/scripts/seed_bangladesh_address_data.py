"""Download the best available official Bangladesh Post postcode pages and build an idempotent SQL seed.

The source pages are maintained per district and carry different content dates. This intentionally imports
only rows with an explicit four-digit postcode; blank-code locality rows are recorded as source gaps.
"""

from __future__ import annotations

import json
import re
import urllib.request
from collections import Counter
from datetime import date
from html import unescape
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "seed-data"
CHECKED_ON = date(2026, 10, 26).isoformat()

PAGE_IDS = [
    "6922e0ac933eb65569e281f4", "6922db72933eb65569e0a2be", "6922de4f933eb65569e19bff",
    "6922dc7a933eb65569e1093e", "6922e123933eb65569e2a74c", "6922e099933eb65569e27c53",
    "6922e065933eb65569e26d8d", "6922df21933eb65569e2011d", "6922dda9933eb65569e15c94",
    "6922df8d933eb65569e22ba9", "6922e064933eb65569e26d27", "6922e009933eb65569e2522c",
    "6922df52933eb65569e21350", "6922df42933eb65569e20e89", "6922e099933eb65569e27c27",
    "6922de2b933eb65569e18bdd", "6922dc3d933eb65569e0f312", "6922e12c933eb65569e2aaaf",
    "6922df05933eb65569e1f42e", "6922dcc0933eb65569e11d77", "6922df09933eb65569e1f65d",
    "6922df53933eb65569e213b9", "6922dcdc933eb65569e126fa", "6922dd7b933eb65569e15334",
    "6922e10a933eb65569e29cd2", "6922ded4933eb65569e1dad9", "6922dd8f933eb65569e15762",
    "6922de99933eb65569e1be30", "6922dda6933eb65569e15bf2", "6922de0f933eb65569e17f03",
    "6922e022933eb65569e25a42", "6922ddb0933eb65569e15e32", "6922e10f933eb65569e29f1a",
    "6922e064933eb65569e26d35", "6922e119933eb65569e2a2e1", "6922df36933eb65569e209b6",
    "6922e0fc933eb65569e296e9", "6922de92933eb65569e1bb3e", "6922ddec933eb65569e1719b",
    "6922df3f933eb65569e20d69", "6922df70933eb65569e21fec", "6922df74933eb65569e22183",
    "6922de28933eb65569e18a7d", "6922dfa5933eb65569e2338f", "6922e11c933eb65569e2a46f",
    "6922dc5d933eb65569e0feff", "6922e117933eb65569e2a262", "6922df1f933eb65569e1fffe",
    "6922defd933eb65569e1efab", "6922de9d933eb65569e1c047", "6922df20933eb65569e200c3",
    "6922dfd2933eb65569e24250", "6922dc22933eb65569e0e957", "6922df67933eb65569e21c5c",
    # Additional official district pages found during the source search.
    "6922dc7d933eb65569e10a5f", "6922de5c933eb65569e1a1c1", "6922df58933eb65569e215a4",
    "6922dde1933eb65569e16df6", "6922e0f6933eb65569e2955c",
    # Additional official district pages found while reconciling national coverage.
    "6922df7a933eb65569e22404", "6922df48933eb65569e210aa", "6922dfcf933eb65569e24187",
]

# Official spelling variants seen in the published pages are mapped to the canonical English district and division.
DISTRICTS = {
    "ভোলা": ("Bhola", "Barishal", "বরিশাল"), "বরগুনা": ("Barguna", "Barishal", "বরিশাল"),
    "বরিশাল": ("Barishal", "Barishal", "বরিশাল"), "ঝালকাঠি": ("Jhalokati", "Barishal", "বরিশাল"),
    "ঝালকাঠী": ("Jhalokati", "Barishal", "বরিশাল"),
    "পটুয়াখালী": ("Patuakhali", "Barishal", "বরিশাল"), "পিরোজপুর": ("Pirojpur", "Barishal", "বরিশাল"),
    "বান্দরবান": ("Bandarban", "Chattogram", "চট্টগ্রাম"),
    "ব্রাহ্মণবাড়িয়া": ("Brahmanbaria", "Chattogram", "চট্টগ্রাম"),
    "ব্রাহ্মণবাড়িয়া": ("Brahmanbaria", "Chattogram", "চট্টগ্রাম"),
    "চাঁদপুর": ("Chandpur", "Chattogram", "চট্টগ্রাম"), "চট্টগ্রাম": ("Chattogram", "Chattogram", "চট্টগ্রাম"),
    "কক্সবাজার": ("Cox's Bazar", "Chattogram", "চট্টগ্রাম"), "কুমিল্লা": ("Cumilla", "Chattogram", "চট্টগ্রাম"),
    "ফেনী": ("Feni", "Chattogram", "চট্টগ্রাম"), "খাগড়াছড়ি": ("Khagrachhari", "Chattogram", "চট্টগ্রাম"),
    "খাগড়াছড়ি": ("Khagrachhari", "Chattogram", "চট্টগ্রাম"), "লক্ষ্মীপুর": ("Lakshmipur", "Chattogram", "চট্টগ্রাম"),
    "নোয়াখালী": ("Noakhali", "Chattogram", "চট্টগ্রাম"), "রাঙ্গামাটি": ("Rangamati", "Chattogram", "চট্টগ্রাম"),
    "ঢাকা": ("Dhaka", "Dhaka", "ঢাকা"), "ফরিদপুর": ("Faridpur", "Dhaka", "ঢাকা"),
    "গাজীপুর": ("Gazipur", "Dhaka", "ঢাকা"), "গোপালগঞ্জ": ("Gopalganj", "Dhaka", "ঢাকা"),
    "কিশোরগঞ্জ": ("Kishoreganj", "Dhaka", "ঢাকা"), "মাদারীপুর": ("Madaripur", "Dhaka", "ঢাকা"),
    "মাদারিপুর": ("Madaripur", "Dhaka", "ঢাকা"), "মানিকগঞ্জ": ("Manikganj", "Dhaka", "ঢাকা"),
    "মুন্সিগঞ্জ": ("Munshiganj", "Dhaka", "ঢাকা"), "নারায়নগঞ্জ": ("Narayanganj", "Dhaka", "ঢাকা"),
    "নারায়ণগঞ্জ": ("Narayanganj", "Dhaka", "ঢাকা"), "নরসিংদী": ("Narsingdi", "Dhaka", "ঢাকা"),
    "রাজবাড়ী": ("Rajbari", "Dhaka", "ঢাকা"), "রাজবাড়ী": ("Rajbari", "Dhaka", "ঢাকা"),
    "শরীয়তপুর": ("Shariatpur", "Dhaka", "ঢাকা"), "শরীয়তপুর": ("Shariatpur", "Dhaka", "ঢাকা"),
    "শরিয়তপুর": ("Shariatpur", "Dhaka", "ঢাকা"),
    "টাঙ্গাইল": ("Tangail", "Dhaka", "ঢাকা"),
    "বাগেরহাট": ("Bagerhat", "Khulna", "খুলনা"), "চুয়াডাঙ্গা": ("Chuadanga", "Khulna", "খুলনা"),
    "চুয়াডাঙ্গা": ("Chuadanga", "Khulna", "খুলনা"), "যশোর": ("Jashore", "Khulna", "খুলনা"),
    "ঝিনাইদহ": ("Jhenaidah", "Khulna", "খুলনা"), "খুলনা": ("Khulna", "Khulna", "খুলনা"),
    "কুষ্টিয়া": ("Kushtia", "Khulna", "খুলনা"), "কুষ্টিয়া": ("Kushtia", "Khulna", "খুলনা"),
    "কুস্টিয়া": ("Kushtia", "Khulna", "খুলনা"),
    "মাগুরা": ("Magura", "Khulna", "খুলনা"), "মাগুড়া": ("Magura", "Khulna", "খুলনা"),
    "মেহেরপুর": ("Meherpur", "Khulna", "খুলনা"),
    "নড়াইল": ("Narail", "Khulna", "খুলনা"), "নড়াইল": ("Narail", "Khulna", "খুলনা"),
    "সাতক্ষীরা": ("Satkhira", "Khulna", "খুলনা"),
    "জামালপুর": ("Jamalpur", "Mymensingh", "ময়মনসিংহ"),
    "ময়মনসিংহ": ("Mymensingh", "Mymensingh", "ময়মনসিংহ"), "ময়মনসিংহ": ("Mymensingh", "Mymensingh", "ময়মনসিংহ"),
    "নেত্রকোণা": ("Netrokona", "Mymensingh", "ময়মনসিংহ"), "নেত্রকোনা": ("Netrokona", "Mymensingh", "ময়মনসিংহ"),
    "শেরপুর": ("Sherpur", "Mymensingh", "ময়মনসিংহ"),
    "বগুড়া": ("Bogura", "Rajshahi", "রাজশাহী"), "বগুড়া": ("Bogura", "Rajshahi", "রাজশাহী"),
    "জয়পুরহাট": ("Joypurhat", "Rajshahi", "রাজশাহী"), "জয়পুরহাট": ("Joypurhat", "Rajshahi", "রাজশাহী"),
    "নওগাঁ": ("Naogaon", "Rajshahi", "রাজশাহী"), "নাটোর": ("Natore", "Rajshahi", "রাজশাহী"),
    "চাঁপাইনবাবগঞ্জ": ("Chapainawabganj", "Rajshahi", "রাজশাহী"), "পাবনা": ("Pabna", "Rajshahi", "রাজশাহী"),
    "রাজশাহী": ("Rajshahi", "Rajshahi", "রাজশাহী"), "সিরাজগঞ্জ": ("Sirajganj", "Rajshahi", "রাজশাহী"),
    "দিনাজপুর": ("Dinajpur", "Rangpur", "রংপুর"), "গাইবান্ধা": ("Gaibandha", "Rangpur", "রংপুর"),
    "গাইনান্ধা": ("Gaibandha", "Rangpur", "রংপুর"), "কুড়িগ্রাম": ("Kurigram", "Rangpur", "রংপুর"),
    "কুড়িগ্রাম": ("Kurigram", "Rangpur", "রংপুর"), "লালমনিরহাট": ("Lalmonirhat", "Rangpur", "রংপুর"),
    "নীলফামারী": ("Nilphamari", "Rangpur", "রংপুর"), "পঞ্চগড়": ("Panchagarh", "Rangpur", "রংপুর"),
    "পঞ্চগড়": ("Panchagarh", "Rangpur", "রংপুর"), "রংপুর": ("Rangpur", "Rangpur", "রংপুর"),
    "ঠাকুরগাঁও": ("Thakurgaon", "Rangpur", "রংপুর"),
    "হবিগঞ্জ": ("Habiganj", "Sylhet", "সিলেট"), "মৌলভীবাজার": ("Moulvibazar", "Sylhet", "সিলেট"),
    "সুনামগঞ্জ": ("Sunamganj", "Sylhet", "সিলেট"), "সিলেট": ("Sylhet", "Sylhet", "সিলেট"),
}

ALL_DISTRICTS = {
    "Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj",
    "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail", "Bandarban", "Brahmanbaria", "Chandpur",
    "Chattogram", "Cumilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati",
    "Bogura", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj", "Pabna", "Rajshahi", "Sirajganj",
    "Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail",
    "Satkhira", "Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur", "Habiganj",
    "Moulvibazar", "Sunamganj", "Sylhet", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari",
    "Panchagarh", "Rangpur", "Thakurgaon", "Jamalpur", "Mymensingh", "Netrokona", "Sherpur",
}

BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
EAST_CIRCLE_URL = "https://pmgctg.bdpost.gov.bd/pages/static-pages/6922ded8933eb65569e1dca1"
EAST_POST_TYPES = {"ইউপিও", "ইডিএসও", "ইডিবিও", "এইচও", "এসও", "জিপিও", "টিএসও"}


def clean(cell) -> str:
    return " ".join(unescape(cell.get_text(" ", strip=True)).split())


def sql_string(value: str) -> str:
    return "N'" + value.replace("'", "''") + "'"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    records: list[dict] = []
    source_manifest: list[dict] = []
    errors: list[str] = []
    seen: set[tuple[str, str, str, str]] = set()
    headers = {"User-Agent": "EnterpriseERP address seed audit/1.0"}

    for page_id in dict.fromkeys(PAGE_IDS):
        url = f"https://bdpost.gov.bd/pages/static-pages/{page_id}"
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=30) as response:
                html = response.read().decode("utf-8", "replace")
            soup = BeautifulSoup(html, "html.parser")
            table = next((t for t in soup.find_all("table") if "Post Code" in t.get_text(" ", strip=True)), None)
            if table is None:
                errors.append(f"No postcode table: {url}")
                continue

            district_bn = ""
            for previous in table.find_all_previous("p"):
                candidate = clean(previous).removesuffix(" জেলা").strip()
                if "জেলা" in clean(previous):
                    district_bn = candidate
                    break
            if not district_bn or district_bn not in DISTRICTS:
                errors.append(f"Unmapped district {district_bn!r}: {url}")
                continue
            district_en, division_en, division_bn = DISTRICTS[district_bn]
            date_match = re.search(r"কনটেন্টটি শেষ হাল-নাগাদ করা হয়েছে:\s*([^<]+)", html)
            updated = clean(BeautifulSoup(date_match.group(1), "html.parser")) if date_match else "Not stated"

            rows = table.find_all("tr")
            last_upazila = ""
            valid_rows = 0
            blank_code_rows = 0
            for row in rows[1:]:
                cells = row.find_all("td")
                # Most district pages include a serial-number column; Narsingdi's current page omits it.
                if len(cells) == 4:
                    upazila_cell, office_cell, office_bn_cell, postcode_cell = cells
                elif len(cells) >= 5:
                    _, upazila_cell, office_cell, office_bn_cell, postcode_cell = cells[:5]
                else:
                    continue
                upazila = clean(upazila_cell) or last_upazila
                if clean(upazila_cell):
                    last_upazila = clean(upazila_cell)
                office_en = clean(office_cell)
                # Leave missing source translations blank; do not copy English into the Bangla field.
                office_bn = clean(office_bn_cell)
                postal_code = clean(postcode_cell).translate(BN_DIGITS).replace(" ", "")
                if not re.fullmatch(r"\d{4}", postal_code) or not upazila or not office_en:
                    blank_code_rows += 1
                    continue
                dedupe_key = (district_en.casefold(), upazila.casefold(), office_en.casefold(), postal_code)
                if dedupe_key in seen:
                    continue
                seen.add(dedupe_key)
                records.append({
                    "divisionEn": division_en,
                    "divisionBn": division_bn,
                    "districtEn": district_en,
                    "districtBn": district_bn,
                    "upazilaEn": upazila,
                    "upazilaBn": "",
                    "postOfficeEn": office_en,
                    "postOfficeBn": office_bn,
                    "postalCode": postal_code,
                    "sourceUrl": url,
                    "sourceUpdated": updated,
                })
                valid_rows += 1
            source_manifest.append({
                "url": url,
                "districtEn": district_en,
                "districtBn": district_bn,
                "divisionEn": division_en,
                "contentUpdated": updated,
                "validPostcodeRows": valid_rows,
                "rowsExcludedForMissingOrInvalidPostcode": blank_code_rows,
            })
        except Exception as exc:  # report per-page fetch/parse failures, continue to other official pages
            errors.append(f"Fetch/parse failed for {url}: {exc}")

    # The East Circle master directory is the available official Bangla source for
    # Brahmanbaria, whose individual district page is missing from the portal.
    try:
        request = urllib.request.Request(EAST_CIRCLE_URL, headers=headers)
        with urllib.request.urlopen(request, timeout=30) as response:
            east_html = response.read().decode("utf-8", "replace")
        east_soup = BeautifulSoup(east_html, "html.parser")
        east_table = next((t for t in east_soup.find_all("table") if "পোস্ট কোড" in t.get_text(" ", strip=True)), None)
        east_updated_match = re.search(r"কনটেন্টটি শেষ হাল-নাগাদ করা হয়েছে:\s*([^<]+)", east_html)
        east_updated = clean(BeautifulSoup(east_updated_match.group(1), "html.parser")) if east_updated_match else "Not stated"
        east_added = 0
        if east_table is None:
            errors.append(f"No Bengali postcode table: {EAST_CIRCLE_URL}")
        else:
            for row in east_table.find_all("tr")[1:]:
                cells = [clean(cell) for cell in row.find_all(["th", "td"])]
                if len(cells) < 7:
                    continue
                district_bn, upazila_bn, office_bn, _, _, raw_code, office_type = cells[:7]
                if district_bn not in DISTRICTS or office_type not in EAST_POST_TYPES:
                    continue
                postal_code = raw_code.translate(BN_DIGITS).replace(" ", "")
                if not re.fullmatch(r"\d{4}", postal_code) or not office_bn or not upazila_bn:
                    continue
                district_en, division_en, division_bn = DISTRICTS[district_bn]
                # This official regional table publishes Bangla office names only.
                # Preserve the source spelling in both name columns instead of inventing an English transliteration.
                key = (district_en.casefold(), upazila_bn.casefold(), office_bn.casefold(), postal_code)
                if key in seen:
                    continue
                seen.add(key)
                records.append({
                    "divisionEn": division_en, "divisionBn": division_bn,
                    "districtEn": district_en, "districtBn": district_bn,
                    "upazilaEn": "", "upazilaBn": upazila_bn,
                    "postOfficeEn": "", "postOfficeBn": office_bn,
                    "postalCode": postal_code, "sourceUrl": EAST_CIRCLE_URL,
                    "sourceUpdated": east_updated,
                })
                east_added += 1
        source_manifest.append({
            "url": EAST_CIRCLE_URL, "districtEn": "Brahmanbaria supplement",
            "divisionEn": "Chattogram", "contentUpdated": east_updated,
            "validPostcodeRows": east_added, "rowsExcludedForMissingOrInvalidPostcode": 0,
        })
    except Exception as exc:
        errors.append(f"Fetch/parse failed for East Circle source {EAST_CIRCLE_URL}: {exc}")

    found_districts = {r["districtEn"] for r in records}
    coverage_gaps = sorted(ALL_DISTRICTS - found_districts)
    (OUT / "bangladesh-postcode-seed.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "bangladesh-postcode-sources.json").write_text(json.dumps(source_manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    # Generate a rerunnable, transactional, additive SQL upsert for the app's existing hierarchy.
    sql = ["SET XACT_ABORT ON;", "BEGIN TRANSACTION;", "DECLARE @CountryId uniqueidentifier;",
           "SELECT @CountryId = Id FROM Countries WHERE Code = N'BD';",
           "IF @CountryId IS NULL BEGIN SET @CountryId = NEWID(); INSERT INTO Countries(Id,NameEn,NameBn,Code,IsActive) VALUES(@CountryId,N'Bangladesh',N'বাংলাদেশ',N'BD',1); END;"]
    divisions = sorted({(r["divisionEn"], r["divisionBn"]) for r in records})
    canonical_districts = {
        (division_en, division_bn, district_en, district_bn)
        for district_bn, (district_en, division_en, division_bn) in DISTRICTS.items()
    }
    districts = sorted(
        {(r["divisionEn"], r["divisionBn"], r["districtEn"], r["districtBn"]) for r in records}
        | canonical_districts
    )
    upazilas = sorted({(r["divisionEn"], r["districtEn"], r["upazilaEn"], r["upazilaBn"]) for r in records})
    for en, bn in divisions:
        e, b = sql_string(en), sql_string(bn)
        sql.append(f"IF NOT EXISTS (SELECT 1 FROM Divisions WHERE CountryId=@CountryId AND NameEn={e}) INSERT INTO Divisions(Id,CountryId,NameEn,NameBn,IsActive) VALUES(NEWID(),@CountryId,{e},{b},1);")
    for div_en, _, en, bn in districts:
        e, b, d = sql_string(en), sql_string(bn), sql_string(div_en)
        sql.append(f"IF NOT EXISTS (SELECT 1 FROM Districts x JOIN Divisions v ON v.Id=x.DivisionId WHERE v.CountryId=@CountryId AND v.NameEn={d} AND x.NameEn={e}) INSERT INTO Districts(Id,DivisionId,NameEn,NameBn,IsActive) SELECT NEWID(),v.Id,{e},{b},1 FROM Divisions v WHERE v.CountryId=@CountryId AND v.NameEn={d};")
    for div_en, district_en, en, bn in upazilas:
        e, b, d, v = sql_string(en), sql_string(bn), sql_string(district_en), sql_string(div_en)
        if not bn:
            sql.append(f"UPDATE u SET NameBn=N'' FROM Upazilas u JOIN Districts d ON d.Id=u.DistrictId JOIN Divisions v ON v.Id=d.DivisionId WHERE v.CountryId=@CountryId AND v.NameEn={v} AND d.NameEn={d} AND u.NameEn={e} AND u.NameBn=u.NameEn AND u.NameBn<>N'';")
        sql.append(f"IF NOT EXISTS (SELECT 1 FROM Upazilas u JOIN Districts d ON d.Id=u.DistrictId JOIN Divisions v ON v.Id=d.DivisionId WHERE v.CountryId=@CountryId AND v.NameEn={v} AND d.NameEn={d} AND u.NameEn={e} AND u.NameBn={b}) INSERT INTO Upazilas(Id,DistrictId,NameEn,NameBn,IsActive) SELECT NEWID(),d.Id,{e},{b},1 FROM Districts d JOIN Divisions v ON v.Id=d.DivisionId WHERE v.CountryId=@CountryId AND v.NameEn={v} AND d.NameEn={d};")
    for r in records:
        vals = [r[k] for k in ("postOfficeEn", "postOfficeBn", "postalCode", "upazilaEn", "upazilaBn", "districtEn", "divisionEn")]
        office, office_bn, code, up, up_bn, district, division = map(sql_string, vals)
        match = f"v.CountryId=@CountryId AND v.NameEn={division} AND d.NameEn={district} AND u.NameEn={up} AND u.NameBn={up_bn} AND p.NameEn={office} AND p.NameBn={office_bn} AND p.PostalCode={code}"
        if not r["postOfficeBn"]:
            sql.append(f"UPDATE p SET NameBn=N'' FROM PostOffices p JOIN Upazilas u ON u.Id=p.UpazilaId JOIN Districts d ON d.Id=u.DistrictId JOIN Divisions v ON v.Id=d.DivisionId WHERE v.CountryId=@CountryId AND v.NameEn={division} AND d.NameEn={district} AND u.NameEn={up} AND u.NameBn={up_bn} AND p.NameEn={office} AND p.PostalCode={code} AND p.NameBn=p.NameEn AND p.NameBn<>N'';")
        sql.append(f"IF NOT EXISTS (SELECT 1 FROM PostOffices p JOIN Upazilas u ON u.Id=p.UpazilaId JOIN Districts d ON d.Id=u.DistrictId JOIN Divisions v ON v.Id=d.DivisionId WHERE {match}) INSERT INTO PostOffices(Id,UpazilaId,NameEn,NameBn,PostalCode,IsActive) SELECT NEWID(),u.Id,{office},{office_bn},{code},1 FROM Upazilas u JOIN Districts d ON d.Id=u.DistrictId JOIN Divisions v ON v.Id=d.DivisionId WHERE v.CountryId=@CountryId AND v.NameEn={division} AND d.NameEn={district} AND u.NameEn={up} AND u.NameBn={up_bn};")
    sql.extend([
        ";WITH DuplicateUpazilas AS (SELECT Id,DistrictId,NameEn,NameBn,FIRST_VALUE(Id) OVER (PARTITION BY DistrictId,NameEn,NameBn ORDER BY Id) AS KeepId,ROW_NUMBER() OVER (PARTITION BY DistrictId,NameEn,NameBn ORDER BY Id) AS RowNum FROM Upazilas) UPDATE p SET UpazilaId=d.KeepId FROM PostOffices p JOIN DuplicateUpazilas d ON d.Id=p.UpazilaId WHERE d.RowNum>1;",
        ";WITH DuplicatePostOffices AS (SELECT Id,UpazilaId,NameEn,NameBn,PostalCode,FIRST_VALUE(Id) OVER (PARTITION BY UpazilaId,NameEn,NameBn,PostalCode ORDER BY Id) AS KeepId,ROW_NUMBER() OVER (PARTITION BY UpazilaId,NameEn,NameBn,PostalCode ORDER BY Id) AS RowNum FROM PostOffices) UPDATE a SET PostOfficeId=d.KeepId FROM Areas a JOIN DuplicatePostOffices d ON d.Id=a.PostOfficeId WHERE d.RowNum>1;",
        ";WITH DuplicatePostOffices AS (SELECT Id,ROW_NUMBER() OVER (PARTITION BY UpazilaId,NameEn,NameBn,PostalCode ORDER BY Id) AS RowNum FROM PostOffices) DELETE FROM DuplicatePostOffices WHERE RowNum>1;",
        ";WITH DuplicateUpazilas AS (SELECT Id,ROW_NUMBER() OVER (PARTITION BY DistrictId,NameEn,NameBn ORDER BY Id) AS RowNum FROM Upazilas) DELETE FROM DuplicateUpazilas WHERE RowNum>1;",
    ])
    sql.extend(["COMMIT TRANSACTION;", "SELECT 'Countries' AS Entity, COUNT_BIG(*) AS Rows FROM Countries WHERE Code=N'BD' UNION ALL",
                "SELECT 'Divisions', COUNT_BIG(*) FROM Divisions WHERE CountryId=@CountryId UNION ALL",
                "SELECT 'Districts', COUNT_BIG(*) FROM Districts d JOIN Divisions v ON v.Id=d.DivisionId WHERE v.CountryId=@CountryId UNION ALL",
                "SELECT 'Upazilas', COUNT_BIG(*) FROM Upazilas u JOIN Districts d ON d.Id=u.DistrictId JOIN Divisions v ON v.Id=d.DivisionId WHERE v.CountryId=@CountryId UNION ALL",
                "SELECT 'PostOffices', COUNT_BIG(*) FROM PostOffices p JOIN Upazilas u ON u.Id=p.UpazilaId JOIN Districts d ON d.Id=u.DistrictId JOIN Divisions v ON v.Id=d.DivisionId WHERE v.CountryId=@CountryId;"])
    (OUT / "seed_bangladesh_addresses.sql").write_text("\n".join(sql) + "\n", encoding="utf-8-sig")

    report = {
        "checkedOn": CHECKED_ON,
        "officialSourcePagesRead": len(source_manifest),
        "postalOfficeRowsPrepared": len(records),
        "districtsWithPostcodeSource": len(found_districts),
        "districtCoverageGaps": coverage_gaps,
        "divisionCountInPreparedRows": len({r["divisionEn"] for r in records}),
        "sourceContentUpdateDates": sorted({s["contentUpdated"] for s in source_manifest}),
        "missingBanglaUpazilaNameRows": sum(not r["upazilaBn"] for r in records),
        "missingBanglaPostOfficeNameRows": sum(not r["postOfficeBn"] for r in records),
        "errors": errors,
    }
    (OUT / "bangladesh-address-seed-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
