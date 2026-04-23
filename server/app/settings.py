from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = WORKSPACE_ROOT / "server"
DATA_ROOT = SERVER_ROOT / "data"
LOCAL_MAIN_OUTPUT = DATA_ROOT / "main output"
LOCAL_DATASETS = DATA_ROOT / "Datasets"
SOURCE_MAIN_OUTPUT = WORKSPACE_ROOT / "main output"
SOURCE_DATASETS = WORKSPACE_ROOT / "Datasets"
ML_ROOT = WORKSPACE_ROOT / "ML" / "output"
