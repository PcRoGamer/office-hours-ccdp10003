#!/usr/bin/env python3
"""Check First Shift's *design scope*. NOT game/browser QA."""
import itertools
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
data = json.loads((HERE / "contract.json").read_text(encoding="utf-8"))

def check(cond, message):
    if not cond:
        raise AssertionError(message)

ids = [card["id"] for card in data["cards"]]
check(ids == ["I1","I3","S1","S2","P1","P4","T1","T4"], "Card order or card identity differs")
check([card["referenceMs"] for card in data["cards"]] == [18000,12000]+[14000]*6, "Reference times drifted")
check([p["after"] for p in data["promotions"]] == ["I3","S2","P4","T4"], "Four promotion points changed")
check(len(data["perks"]) == 6 and len(set(data["perks"])) == 6, "Perks invalid")
check(len(data["synergies"]) == 3, "Build families invalid")
for pair in data["synergies"]:
    check(len(pair) == 2 and all(p in data["perks"] for p in pair), "Unknown perk synergy")
for p in data["promotions"][:2]:
    check(len(p["offers"]) == 3, "First two drafts need three fixed offers")
check(len(set(data["boss"]["packetIds"])) == 4, "Four unique boss packets required")
check(data["boss"]["packetPhases"] == [1,2,3,3], "Packet placement incorrect")
check(data["boss"]["requiredCounterBolts"] == 3, "Three player-triggered bolts required")
for weights in data["scoreWeights"].values():
    check(sum(weights.values()) == 100, "Scoring weights must sum to 100")
check(data["licences"]["count"] * data["licences"]["costPerToken"] == data["licences"]["baseBudget"], "Budget invalid")
for assigned in range(3):
    saved = data["licences"]["baseBudget"] - assigned*data["licences"]["costPerToken"]
    check(saved+assigned*data["licences"]["costPerToken"] == 80, "Licence conservation broken")
for mask in itertools.product([0, 1], repeat=4):
    bonus = sum(mask)*data["boss"]["filePoints"]
    pressure = min(data["boss"]["pressureCap"],sum(mask)*data["boss"]["filePressureIncrement"])
    check(0 <= bonus <= 20 and 0 <= pressure <= 2, "Boss mask invalid")
check(data["narrativeReference"]["role"] == "philosophy-lore-only","Papers Please must not drive mechanic scope")
print("FIRST_SHIFT_DESIGN_SCOPE_OK: 8 cards, 4 promotions, 6 perks, 3 synergy families, 16 boss masks, 3 legal licence totals, score caps and narrative hierarchy")
