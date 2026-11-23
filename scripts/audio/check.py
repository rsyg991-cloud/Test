"""
Round-trip check of the generated audio: Whisper (faster-whisper, MIT) transcribes every recording
of two words or more and compares it with the text it should say. Prints the worst matches.

  python scripts/audio/check.py /tmp/audio-manifest.json [--model-dir DIR] [--limit N]
"""
import argparse, json, os, re, sys
from difflib import SequenceMatcher

ap = argparse.ArgumentParser()
ap.add_argument("manifest")
ap.add_argument("--model-dir", default=None)
ap.add_argument("--limit", type=int, default=0)
ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "..", "public"))
args = ap.parse_args()

import subprocess  # noqa: E402

import numpy as np  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402


def load(path):
    """16 kHz mono float audio, decoded with ffmpeg (avoids PyAV version clashes)."""
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float32) / 32768

NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten"}
def words(s):
    s = s.lower().replace("’", "'")
    s = re.sub(r"[^a-z0-9' ]+", " ", s)
    return [NUM.get(w, w) for w in s.split()]

items = [x for x in json.load(open(args.manifest)) if len(x["text"].split()) >= 2 and not re.fullmatch(r"[A-Z](, [A-Z])+", x["text"])]
if args.limit:
    items = items[: args.limit]
m = WhisperModel("base.en", device="cpu", compute_type="int8", download_root=args.model_dir)
scores = []
for i, x in enumerate(items, 1):
    segs, _ = m.transcribe(load(os.path.join(args.out, x["path"].lstrip("/"))), beam_size=1, language="en")
    heard = " ".join(s.text for s in segs)
    r = SequenceMatcher(None, words(x["text"]), words(heard)).ratio()
    scores.append((r, x["voice"], x["text"], heard.strip()))
    if i % 200 == 0:
        print(f"{i}/{len(items)}", file=sys.stderr, flush=True)
scores.sort()
ok = sum(1 for s in scores if s[0] >= 0.9)
print(f"{len(scores)} checked: {ok} match well (>= 90%), mean {sum(s[0] for s in scores) / len(scores):.3f}")
for r, v, t, h in scores[:40]:
    print(f"{r:.2f} [{v}] SAID: {t[:120]!r}\n        HEARD: {h[:120]!r}")
