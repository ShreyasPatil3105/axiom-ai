from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from shared.schema import Verdict


def render_verdict_pdf(verdict: Verdict, output_path: str) -> str:
    """Generate a Verdict Certificate PDF from a Verdict object.
    Returns the output file path."""
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=12,
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor='#555555',
        spaceAfter=24,
    )
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=16,
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=4,
    )

    story = []
    story.append(Paragraph("AXIOM AI — Verdict Certificate", title_style))
    story.append(Paragraph("Universal Verification Oracle — Reproducible Audit Trail", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color="#000000"))
    story.append(Spacer(1, 12))

    # Core info
    story.append(Paragraph("Verdict Summary", section_style))
    story.append(Paragraph(f"<b>Audit Trail ID:</b> {verdict.audit_trail_id}", body_style))
    story.append(Paragraph(f"<b>Artefact Type:</b> {verdict.artefact_type}", body_style))
    story.append(Paragraph(f"<b>Overall Trust Score:</b> {verdict.overall_trust_score:.1f} / 100", body_style))
    story.append(Paragraph(f"<b>Generated At:</b> {verdict.generated_at.isoformat()}", body_style))
    story.append(Paragraph(f"<b>Verdict Hash:</b> {verdict.verdict_hash or 'N/A'}", body_style))
    story.append(Spacer(1, 12))

    # Items
    story.append(Paragraph("Verification Items", section_style))
    for item in verdict.items:
        story.append(Paragraph(f"<b>ID:</b> {item.id} | <b>Status:</b> {item.status}", body_style))

        counterexample = getattr(item, 'counterexample', None)
        if counterexample:
            story.append(Paragraph(f"<b>Counterexample:</b> {counterexample}", body_style))

        cited_passage = getattr(item, 'cited_passage', None)
        if cited_passage:
            story.append(Paragraph(f"<b>Cited Passage:</b> {cited_passage[:200]}...", body_style))

        source_name = getattr(item, 'source_name', None)
        if source_name:
            story.append(Paragraph(f"<b>Source:</b> {source_name}", body_style))

        story.append(Spacer(1, 8))

    story.append(HRFlowable(width="100%", thickness=1, color="#000000"))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "This certificate can be independently re-run using the reproducible_command on each item. "
        "Any change to the artefact or its evidence produces a different verdict hash.",
        body_style,
    ))

    doc.build(story)
    return output_path
