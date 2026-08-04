"""Template-based shaping of matching vCard data.

The web frontend renders one of several disclosure templates (A-F). To avoid
sending data the active template never displays, this module reduces the full
list of matching cards to exactly what each template renders:

- a:    only whether any cards match
- b:    the number of matching cards
- c:    per-field card counts (presence only)
- d:    per-field values, aggregated across cards (photo as presence only)
- e, f: the cards with their fields pruned to the rendered set

Field names are vCard property names (lowercase); mapping them to display
labels is left to the frontend.
"""

from typing import Any, Dict, List

VALID_TEMPLATES = ("a", "b", "c", "d", "e", "f")

# Fields templates C (counts) and D (values) disclose.
CD_FIELDS = ("fn", "tel", "email", "org", "title", "photo", "nickname", "bday",
             "gender", "related", "adr")

# Fields templates E and F render per card.
EF_FIELDS = ("fn", "n", "nickname", "title", "org", "tel", "email", "bday",
             "gender", "related", "adr", "photo")


def shape_cards(matches: List[Dict[str, Any]], template: str) -> Dict[str, Any]:
    """Reduce matching cards to what the given template discloses.

    Args:
        matches: Card dicts as returned by get_matching_cards()
            (each with a "fields" mapping of extracted vCard properties)
        template: One of VALID_TEMPLATES

    Returns:
        The shaped payload for the template.
    """
    if template == "a":
        return {"found": bool(matches)}

    if template == "b":
        return {"count": len(matches)}

    if template == "c":
        return {"counts": {
            field: sum(1 for match in matches if field in match["fields"])
            for field in CD_FIELDS
        }}

    if template == "d":
        values: Dict[str, List[Any]] = {field: [] for field in CD_FIELDS}
        for match in matches:
            for field in CD_FIELDS:
                if field not in match["fields"]:
                    continue
                # Photo is disclosed as presence only, never as image data
                values[field].append("Photo" if field == "photo" else match["fields"][field])
        return {"values": values}

    # e, f: keep the cards, prune the fields to the rendered set
    return {"matches": [
        {**match, "fields": {
            field: value for field, value in match["fields"].items() if field in EF_FIELDS
        }}
        for match in matches
    ]}
