"""
Generates the site's recorded audio with Kokoro-82M (open source, Apache-2.0) via kokoro-onnx.
Text becomes phonemes with misaki, Kokoro's own phonemizer (espeak for words it doesn't know), plus
the fixes in pronunciations.py: kokoro-onnx's built-in espeak phonemes don't match the ones Kokoro
was trained on ("bridge" came out as "ridge").

Needs Python 3.12 (spaCy has no 3.13 wheels): pip install "misaki[en]" kokoro-onnx soundfile, plus
spaCy's en_core_web_sm (huggingface.co/spacy/en_core_web_sm).

  npx tsx scripts/audio/manifest.ts > /tmp/audio-manifest.json
  python scripts/audio/generate.py /tmp/audio-manifest.json --model DIR

DIR holds kokoro-v1.0.onnx and voices-v1.0.bin (https://huggingface.co/fastrtc/kokoro-onnx).
Writes public/audio/<voice>/<hash>.mp3 (mono, 24 kHz, 40 kb/s) and skips files that already exist,
so re-running after a content change only adds what is new. Needs ffmpeg.
"""
import argparse, json, os, subprocess, sys, time

ap = argparse.ArgumentParser()
ap.add_argument("manifest")
ap.add_argument("--model", required=True)
ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "..", "public"))
ap.add_argument("--force", action="store_true", help="re-record files that already exist")
args = ap.parse_args()

import re  # noqa: E402

from kokoro_onnx import Kokoro  # noqa: E402
from misaki import en, espeak  # noqa: E402

sys.path.insert(0, os.path.dirname(__file__))
from pronunciations import LEXICON  # noqa: E402

G2P = {b: en.G2P(trf=False, british=b, fallback=espeak.EspeakFallback(british=b)) for b in (False, True)}
WORD = re.compile(r"(?<![\w'-])(" + "|".join(sorted(map(re.escape, LEXICON), key=len, reverse=True)) + r")(?![\w-])")


def phonemes(text, british):
    """misaki phonemes, with the lexicon's pronunciations as misaki [word](/phonemes/) overrides."""
    return G2P[british](WORD.sub(lambda m: f"[{m.group(1)}](/{LEXICON[m.group(1)]}/)", text))[0]


items = json.load(open(args.manifest))
todo = [x for x in items if args.force or not os.path.exists(os.path.join(args.out, x["path"].lstrip("/")))]
print(f"{len(items)} texts, {len(todo)} to generate", flush=True)
k = Kokoro(os.path.join(args.model, "kokoro-v1.0.onnx"), os.path.join(args.model, "voices-v1.0.bin"))
start = time.time()
for i, x in enumerate(todo, 1):
    dest = os.path.join(args.out, x["path"].lstrip("/"))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    audio, sr = k.create(phonemes(x["text"], x["voice"].startswith("b")), voice=x["voice"], speed=1.0, is_phonemes=True)
    pcm = (audio.clip(-1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "-", "-b:a", "40k", dest + ".tmp.mp3"],
        input=pcm, check=True,
    )
    os.replace(dest + ".tmp.mp3", dest)
    if i % 50 == 0 or i == len(todo):
        print(f"{i}/{len(todo)} done, {time.time() - start:.0f}s", flush=True)
