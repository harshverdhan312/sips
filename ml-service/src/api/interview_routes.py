from pathlib import Path
import tempfile
import wave

from fastapi import APIRouter, Form, HTTPException, UploadFile

from src.interview.service import analyze_interview_response


router = APIRouter(
    prefix="/interview",
    tags=["interview"],
)

MAX_AUDIO_BYTES = 10 * 1024 * 1024
SUPPORTED_WAV_TYPES = {
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
}


@router.post("/analyze")
def analyze_interview(
    transcript: str = Form(
        ...,
        min_length=1,
        max_length=10000,
    ),
    audio: UploadFile | None = None,
):
    if audio is None:
        raise HTTPException(
            status_code=422,
            detail="A WAV audio file is required.",
        )

    if audio.content_type not in SUPPORTED_WAV_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Only WAV audio files are supported.",
        )

    temporary_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".wav",
            delete=False,
        ) as temporary_file:
            temporary_path = Path(
                temporary_file.name
            )
            total_bytes = 0

            while chunk := audio.file.read(
                1024 * 1024
            ):
                total_bytes += len(chunk)

                if total_bytes > MAX_AUDIO_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="Audio file exceeds the 10 MB limit.",
                    )

                temporary_file.write(
                    chunk
                )

        return analyze_interview_response(
            text=transcript,
            audio_path=temporary_path,
        )
    except (
        EOFError,
        TypeError,
        ValueError,
        wave.Error,
    ) as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error
    finally:
        audio.file.close()

        if temporary_path is not None:
            temporary_path.unlink(
                missing_ok=True
            )
