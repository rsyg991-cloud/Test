"""
Generates the site's recorded audio with Kokoro-82M (open source, Apache-2.0) via kokoro-onnx.

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
args = ap.parse_args()

from kokoro_onnx import Kokoro  # noqa: E402

items = json.load(open(args.manifest))
todo = [x for x in items if not os.path.exists(os.path.join(args.out, x["path"].lstrip("/")))]
print(f"{len(items)} texts, {len(todo)} to generate", flush=True)
k = Kokoro(os.path.join(args.model, "kokoro-v1.0.onnx"), os.path.join(args.model, "voices-v1.0.bin"))
start = time.time()
for i, x in enumerate(todo, 1):
    dest = os.path.join(args.out, x["path"].lstrip("/"))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    lang = "en-gb" if x["voice"].startswith("b") else "en-us"
    audio, sr = k.create(x["text"], voice=x["voice"], speed=1.0, lang=lang)
    pcm = (audio.clip(-1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "-", "-b:a", "40k", dest + ".tmp.mp3"],
        input=pcm, check=True,
    )
    os.replace(dest + ".tmp.mp3", dest)
    if i % 50 == 0 or i == len(todo):
        print(f"{i}/{len(todo)} done, {time.time() - start:.0f}s", flush=True)
