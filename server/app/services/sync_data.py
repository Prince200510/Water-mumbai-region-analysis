from __future__ import annotations
import shutil
from pathlib import Path
from typing import Iterable
from app.settings import DATA_ROOT, LOCAL_DATASETS, LOCAL_MAIN_OUTPUT, SOURCE_DATASETS, SOURCE_MAIN_OUTPUT

MAIN_OUTPUT_EXTENSIONS = {".csv", ".png"}
SHAPEFILE_EXTENSIONS = {".shp", ".dbf", ".shx", ".prj", ".cpg", ".sbn", ".sbx"}

def _iter_files(root: Path, extensions: Iterable[str]) -> list[Path]:
    if not root.exists():
        return []
    ext_set = set(extensions)
    files: list[Path] = []
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in ext_set:
            files.append(p)
    return files

def _copy_files(files: list[Path], src_root: Path, dst_root: Path) -> int:
    copied = 0
    for src in files:
        rel = src.relative_to(src_root)
        dst = dst_root / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        src_mtime = src.stat().st_mtime
        if not dst.exists() or src_mtime > dst.stat().st_mtime:
            shutil.copy2(src, dst)
            copied += 1
    return copied

def sync_all() -> dict:
    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    LOCAL_MAIN_OUTPUT.mkdir(parents=True, exist_ok=True)
    LOCAL_DATASETS.mkdir(parents=True, exist_ok=True)
    main_output_files = _iter_files(SOURCE_MAIN_OUTPUT, MAIN_OUTPUT_EXTENSIONS)
    shapefile_files = _iter_files(SOURCE_DATASETS, SHAPEFILE_EXTENSIONS)
    copied_main_output = _copy_files(main_output_files, SOURCE_MAIN_OUTPUT, LOCAL_MAIN_OUTPUT)
    copied_datasets = _copy_files(shapefile_files, SOURCE_DATASETS, LOCAL_DATASETS)

    return {
        "source_main_output_files": len(main_output_files),
        "source_dataset_files": len(shapefile_files),
        "copied_main_output_files": copied_main_output,
        "copied_dataset_files": copied_datasets,
    }
