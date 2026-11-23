"""
Pronunciations Kokoro's phonemizer (misaki) doesn't know or gets wrong: mostly Arabic names.
Phonemes are in misaki's (US) notation; see https://github.com/hexgrad/misaki/blob/main/EN_PHONES.md
Add a word here and re-run generate.py with --force to re-record the texts that use it.
"""
LEXICON = {
    "Omar": "ˈOmɑɹ", "Omar's": "ˈOmɑɹz", "Saleh": "sˈɑlɛ", "Amira": "əmˈiɹə", "Karim": "kəɹˈim",
    "Noura": "nˈuɹə", "Tariq": "tˈɑɹɪk", "tariq": "tˈɑɹɪk", "Joud": "ʤˈud", "Sara": "sˈɑɹə",
    "Ghada": "ɡˈɑdə", "Mansour": "mænsˈʊɹ", "Yousef": "jˈusəf", "Okafor": "OkˈɑfOɹ", "Mei": "mˈA",
    "Al-Qahtani": "ˌælkɑtˈɑni", "Saeed": "sɑˈid", "Al-Nahda": "ˌælnˈɑhdə", "Huda": "hˈudə",
    "Khalid": "kˈɑlɪd", "Rana": "ɹˈɑnə", "Layla": "lˈAlə", "Laila": "lˈAlə", "Al-Shehri": "ˌælʃˈɛhɹi",
    "Rina": "ɹˈinə", "Khalil": "kəlˈil", "Yasir": "jˈɑsɪɹ", "Al-Otaibi": "ˌæləˈtIbi", "Dana": "dˈɑnə",
    "Maryam": "mˈɑɹjæm", "Dammam": "dæmˈæm", "Al-Ghamdi": "ˌælɡˈæmdi", "Reem": "ɹˈim",
    "Qasim": "kˈɑsɪm", "Ahmed": "ˈɑhmɛd", "Nouri": "nˈuɹi", "Bakr": "bˈɑkəɹ", "Noor": "nˈʊɹ",
    "Al-Noor": "ˌælnˈʊɹ", "Nawaf": "nəwˈɑf", "Yalla": "jˈɑlə", "Nassar": "nəsˈɑɹ", "Olaya": "Olˈɑjə",
    "Nadia": "nˈɑdiə", "Dalal": "dəlˈɑl", "Majid": "mˈɑʤɪd", "Dina": "dˈinə", "Abha": "ˈæbhə",
    "riyal": "ɹijˈɑl", "riyals": "ɹijˈɑlz", "Riyadh": "ɹijˈæd", "Jeddah": "ʤˈɛdə",
}
