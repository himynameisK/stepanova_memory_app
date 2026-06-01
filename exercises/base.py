"""Загрузка справочника картинок (номер → имя/файл).

Изображения лежат в папке img/, имя файла в формате `<номер>_<СЛОВО>.png`.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Dict


IMG_DIR = "img"
_FILENAME_RE = re.compile(r"^(\d+)_(.+)\.png$")


@dataclass(frozen=True)
class ImageEntry:
    """Запись справочника: номер ↔ слово ↔ файл картинки."""
    number: int
    name: str
    filename: str

    def as_dict(self) -> dict:
        return {"number": self.number, "name": self.name, "filename": self.filename}


def parse_image_files(img_dir: str = IMG_DIR) -> Dict[int, ImageEntry]:
    """Сканирует папку с картинками и возвращает {номер: ImageEntry}."""
    images: Dict[int, ImageEntry] = {}
    if not os.path.isdir(img_dir):
        return images

    for filename in os.listdir(img_dir):
        match = _FILENAME_RE.match(filename)
        if not match:
            continue
        number = int(match.group(1))
        name = match.group(2)
        images[number] = ImageEntry(number=number, name=name, filename=filename)
    return images
