"""
The Stage 0 letter sounds (/s/, /æ/, /p/ …), one clip per grapheme, generated with Kokoro from
phonemes (misaki notation), not from text: a letter typed as text is read as its name ("ess").

  python scripts/audio/sounds.py --model DIR

Continuous sounds are held a little; stop sounds can't be said without a vowel, so they get the
shortest schwa we can keep (cut and faded); vowels are said on their own. Writes
public/audio/sounds/<grapheme>.mp3 (see soundPath in lib/audio/voices.ts). These stand in for a human
recording: re-record any that a listener flags.
"""
import argparse, os, subprocess

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--model", required=True)
ap.add_argument("--voice", default="af_heart")
ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "..", "public", "audio", "sounds"))
args = ap.parse_args()

from kokoro_onnx import Kokoro  # noqa: E402

HOLD, STOP, VOWEL = "hold", "stop", "vowel"
# grapheme id -> (kind, phonemes). Stop sounds are followed by a schwa that is cut short.
SOUNDS = {
    "g:s": (HOLD, "sss"), "g:s/z": (HOLD, "zzz"), "g:z": (HOLD, "zzz"), "g:f": (HOLD, "fff"), "g:v": (HOLD, "vvv"),
    "g:m": (HOLD, "mmm"), "g:n": (HOLD, "nnn"), "g:l": (HOLD, "lll"), "g:r": (HOLD, "ɹɹɹ"), "g:sh": (HOLD, "ʃʃʃ"),
    "g:th": (HOLD, "θθθ"), "g:th/ð": (HOLD, "ððð"), "g:ng": (HOLD, "ŋŋŋ"), "g:x": (HOLD, "kss"), "g:nk": (HOLD, "ŋŋk"),
    "g:t": (STOP, "tə"), "g:p": (STOP, "pə"), "g:k": (STOP, "kə"), "g:c": (STOP, "kə"), "g:ck": (STOP, "kə"),
    "g:b": (STOP, "bə"), "g:d": (STOP, "də"), "g:g": (STOP, "ɡə"), "g:j": (STOP, "ʤə"), "g:ch": (STOP, "ʧə"),
    "g:h": (STOP, "hə"), "g:w": (STOP, "wə"), "g:y": (STOP, "jə"), "g:qu": (STOP, "kwə"),
    "g:a": (VOWEL, "ˈæ"), "g:i": (VOWEL, "ˈɪ"), "g:o": (VOWEL, "ˈɑ"), "g:e": (VOWEL, "ˈɛ"), "g:u": (VOWEL, "ˈʌ"),
    "g:ee": (VOWEL, "ˈi"), "g:oo": (VOWEL, "ˈu"), "g:a_e": (VOWEL, "ˈA"), "g:i_e": (VOWEL, "ˈI"), "g:o_e": (VOWEL, "ˈO"),
}


def slug(gid):
    """File name for a grapheme id; keep in step with soundPath() in lib/audio/voices.ts."""
    return gid[2:].replace("/ð", "-voiced").replace("/", "-")


def shape(a, sr, kind, gid):
    loud = np.abs(a) > 0.01
    on, off = np.argmax(loud), len(a) - np.argmax(loud[::-1])
    a = a[max(0, on - int(0.01 * sr)) : off + int(0.03 * sr)]
    if kind == STOP:
        # Keep the consonant and the start of the vowel only.
        keep = int((0.26 if gid in ("g:qu",) else 0.17) * sr)
        a = a[:keep]
    fade = int(0.04 * sr)
    a[-fade:] *= np.linspace(1, 0, fade)
    a = a / max(1e-6, np.abs(a).max()) * 0.8
    pad = np.zeros(int(0.05 * sr), dtype=a.dtype)
    return np.concatenate([pad, a, pad])


k = Kokoro(os.path.join(args.model, "kokoro-v1.0.onnx"), os.path.join(args.model, "voices-v1.0.bin"))
os.makedirs(args.out, exist_ok=True)
for gid, (kind, ph) in SOUNDS.items():
    a, sr = k.create(ph, voice=args.voice, speed=1.0, is_phonemes=True)
    a = shape(a.astype(np.float32), sr, kind, gid)
    pcm = (a.clip(-1, 1) * 32767).astype("<i2").tobytes()
    dest = os.path.join(args.out, slug(gid) + ".mp3")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "-", "-b:a", "64k", dest], input=pcm, check=True)
    print(f"{gid:8} {kind:5} {ph:5} {len(a) / sr * 1000:4.0f} ms -> {slug(gid)}.mp3")
