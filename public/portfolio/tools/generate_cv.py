#!/usr/bin/env python3
"""Generate / update the Europass-style CV PDF used by the website.

How it works
- Edit data in: tools/cv_data.json
- Run: python3 tools/generate_cv.py          (default language: meta.default_lang)
- Or:  python3 tools/generate_cv.py --lang en

Output
- Written to the path in meta.output (by default: assets/cv/Manuel_Zambelli_CV_Europass.pdf)

Dependencies
- reportlab (pip install reportlab)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, Any, List

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit


def load_data(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


class CVBuilder:
    def __init__(self, c: canvas.Canvas, pagesize=A4):
        self.c = c
        self.w, self.h = pagesize

        self.margin = 1.4 * cm
        self.gap = 0.8 * cm
        self.left_w = 6.0 * cm
        self.right_w = self.w - (2 * self.margin) - self.left_w - self.gap

        self.x_left = self.margin
        self.x_right = self.margin + self.left_w + self.gap

        self.y = self.h - self.margin
        self.page_num = 1

        # styling
        self.color_ink = colors.HexColor("#18181b")
        self.color_muted = colors.HexColor("#6e6e78")
        self.color_rule = colors.HexColor("#e6e6ea")

    def new_page(self):
        self.c.showPage()
        self.page_num += 1
        self.y = self.h - self.margin

    def rule(self, y: float, x0: float, x1: float):
        self.c.setStrokeColor(self.color_rule)
        self.c.setLineWidth(1)
        self.c.line(x0, y, x1, y)

    def text(self, x: float, y: float, s: str, size: float = 10, bold: bool = False, color=None):
        self.c.setFillColor(color or self.color_ink)
        self.c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        self.c.drawString(x, y, s)

    def para(self, x: float, y: float, width: float, s: str, size: float = 10, leading: float | None = None, color=None) -> float:
        leading = leading or (size * 1.35)
        self.c.setFillColor(color or self.color_ink)
        self.c.setFont("Helvetica", size)
        lines = simpleSplit(s, "Helvetica", size, width)
        for line in lines:
            self.c.drawString(x, y, line)
            y -= leading
        return y

    def heading(self, x: float, y: float, s: str, width: float, size: float = 11) -> float:
        self.c.setFillColor(self.color_ink)
        self.c.setFont("Helvetica-Bold", size)
        self.c.drawString(x, y, s)
        y -= size * 0.55
        self.rule(y, x, x + width)
        y -= size * 0.9
        return y

    def bullets(self, x: float, y: float, width: float, items: List[str], size: float = 9.6) -> float:
        leading = size * 1.35
        self.c.setFont("Helvetica", size)
        self.c.setFillColor(self.color_ink)

        for it in items:
            wrapped = simpleSplit(it, "Helvetica", size, width - 10)
            if not wrapped:
                continue
            self.c.drawString(x, y, "•")
            self.c.drawString(x + 10, y, wrapped[0])
            y -= leading
            for line in wrapped[1:]:
                self.c.drawString(x + 10, y, line)
                y -= leading
        return y


def build_pdf(data_path: Path, lang: str | None = None) -> Path:
    data = load_data(data_path)
    lang = lang or data.get("meta", {}).get("default_lang", "it")
    if lang not in data:
        available = [k for k in data.keys() if k != "meta"]
        raise SystemExit(f"Language '{lang}' not found in cv_data.json. Available: {', '.join(available)}")

    cdata = data[lang]
    output_rel = data.get("meta", {}).get("output", "assets/cv/Manuel_Zambelli_CV_Europass.pdf")

    root = data_path.parent.parent  # portfolio/
    out_path = (root / output_rel).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    cv = canvas.Canvas(str(out_path), pagesize=A4)
    b = CVBuilder(cv)

    # Header
    b.text(b.x_right, b.y, cdata.get("name", ""), size=20, bold=True)
    b.y -= 26
    b.text(b.x_right, b.y, cdata.get("subtitle", ""), size=10, bold=False, color=b.color_muted)
    b.y -= 18
    b.rule(b.y, b.margin, b.w - b.margin)
    b.y -= 18

    y_left = b.y
    y_right = b.y

    # LEFT: contacts
    contacts = cdata.get("contacts", [])
    if contacts:
        y_left = b.heading(b.x_left, y_left, "Contatti" if lang == "it" else "Contacts", b.left_w, size=11)
        for item in contacts:
            label = str(item.get("label", "")).strip()
            value = str(item.get("value", "")).strip()
            if not (label and value):
                continue
            b.text(b.x_left, y_left, label, size=9, bold=True, color=b.color_muted)
            y_left -= 12
            y_left = b.para(b.x_left, y_left, b.left_w, value, size=9.2, color=b.color_ink)
            y_left -= 6

    strengths = cdata.get("strengths", [])
    if strengths:
        y_left = b.heading(b.x_left, y_left, cdata.get("strengths_title", "Punti di forza"), b.left_w, size=11)
        y_left = b.bullets(b.x_left, y_left, b.left_w, [str(s) for s in strengths], size=9.4)
        y_left -= 6

    languages = cdata.get("languages", [])
    if languages:
        y_left = b.heading(b.x_left, y_left, cdata.get("languages_title", "Lingue"), b.left_w, size=11)
        for l in languages:
            name = str(l.get("name", "")).strip()
            level = str(l.get("level", "")).strip()
            if not name:
                continue
            b.text(b.x_left, y_left, name, size=9.4, bold=True)
            if level:
                b.text(b.x_left + 78, y_left, level, size=9.2, bold=False, color=b.color_muted)
            y_left -= 14
        y_left -= 6

    skills = cdata.get("skills", [])
    if skills:
        y_left = b.heading(b.x_left, y_left, cdata.get("skills_title", "Competenze"), b.left_w, size=11)
        y_left = b.bullets(b.x_left, y_left, b.left_w, [str(s) for s in skills], size=9.4)
        y_left -= 6

    # RIGHT: profile
    profile = cdata.get("profile", [])
    if profile:
        y_right = b.heading(b.x_right, y_right, cdata.get("profile_title", "Profilo"), b.right_w, size=11)
        for p in profile:
            y_right = b.para(b.x_right, y_right, b.right_w, str(p), size=10, color=b.color_ink)
            y_right -= 8

    # RIGHT: education
    education = cdata.get("education", [])
    if education:
        y_right = b.heading(b.x_right, y_right, cdata.get("education_title", "Formazione"), b.right_w, size=11)
        for e in education:
            title = str(e.get("degree", "")).strip()
            school = str(e.get("school", "")).strip()
            years = str(e.get("years", "")).strip()

            if title:
                b.text(b.x_right, y_right, title, size=10.4, bold=True)
            if years:
                b.text(b.x_right + b.right_w - 120, y_right, years, size=9.2, bold=False, color=b.color_muted)
            y_right -= 14

            if school:
                b.text(b.x_right, y_right, school, size=9.4, bold=False, color=b.color_muted)
                y_right -= 12

            bullets = e.get("bullets", [])
            if bullets:
                y_right = b.bullets(b.x_right, y_right, b.right_w, [str(x) for x in bullets], size=9.4)
            y_right -= 10

    # RIGHT: projects
    projects = cdata.get("projects", [])
    if projects:
        y_right = b.heading(b.x_right, y_right, cdata.get("projects_title", "Progetti"), b.right_w, size=11)
        for p in projects:
            title = str(p.get("title", "")).strip()
            subtitle = str(p.get("subtitle", "")).strip()
            desc = str(p.get("description", "")).strip()
            stack = str(p.get("stack", "")).strip()

            if title:
                b.text(b.x_right, y_right, title, size=10.2, bold=True)
                y_right -= 13
            if subtitle:
                y_right = b.para(b.x_right, y_right, b.right_w, subtitle, size=9.2, color=b.color_muted)
                y_right -= 2
            if desc:
                y_right = b.para(b.x_right, y_right, b.right_w, desc, size=9.6, color=b.color_ink)
                y_right -= 4
            if stack:
                y_right = b.para(b.x_right, y_right, b.right_w, f"Stack: {stack}", size=9.2, color=b.color_muted)
            y_right -= 10

            # very small page break handling
            if y_right < b.margin + 120:
                b.new_page()
                y_right = b.y
                y_left = b.y

    certs = cdata.get("certifications", [])
    if certs:
        y_right = b.heading(b.x_right, y_right, cdata.get("certifications_title", "Certificazioni"), b.right_w, size=11)
        for cert in certs:
            title = str(cert.get("title", "")).strip()
            issuer = str(cert.get("issuer", "")).strip()
            date = str(cert.get("date", "")).strip()
            note = str(cert.get("note", "")).strip()

            if title:
                b.text(b.x_right, y_right, title, size=10.0, bold=True)
                y_right -= 13
            meta = " • ".join([x for x in [issuer, date] if x])
            if meta:
                y_right = b.para(b.x_right, y_right, b.right_w, meta, size=9.2, color=b.color_muted)
                y_right -= 2
            if note:
                y_right = b.para(b.x_right, y_right, b.right_w, note, size=9.6, color=b.color_ink)
            y_right -= 10

    # Footer page number (last page only)
    b.c.setFillColor(b.color_muted)
    b.c.setFont("Helvetica", 8)
    b.c.drawRightString(b.w - b.margin, b.margin * 0.55, str(b.page_num))

    cv.save()
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", default=None, help="Language key in cv_data.json (e.g. it, en)")
    parser.add_argument("--data", default="tools/cv_data.json", help="Path to cv_data.json (relative to portfolio folder)")
    args = parser.parse_args()

    # Resolve data path relative to the portfolio root (this script lives in portfolio/tools/)
    here = Path(__file__).resolve()
    root = here.parent.parent
    data_path = (root / args.data).resolve()

    out = build_pdf(data_path, lang=args.lang)
    print(f"✅ CV generated: {out}")


if __name__ == "__main__":
    main()
