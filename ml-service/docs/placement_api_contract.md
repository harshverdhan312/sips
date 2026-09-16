# Placement Prediction API Contract

## Purpose

The SIPS Placement Predictor estimates placement probability from six structured student features.

The FastAPI service performs inference only. Authentication, authorization, college isolation, persistence, and application business logic remain responsibilities of the Node/Express backend.

Predictions are estimates based on the training dataset and must not be presented as guarantees of placement.

## Service endpoints

### Health check

`GET /health`

Successful response:

~~~json
{
  "status": "ok",
  "service": "SIPS ML Service"
}
~~~

The health endpoint does not require the placement model artifact.

### Placement prediction

`POST /placement/predict`

Content type: `application/json`

The ML endpoint does not perform user authentication. Node/Express should act as the authenticated application gateway.

## Request schema

All six fields are required. Field names are case-sensitive. Extra fields are rejected.

| Field | JSON type | Allowed values | Meaning |
|---|---|---|---|
| `Age` | integer | 19 through 30 | Student age |
| `Internships` | integer | 0 through 3 | Number of internships |
| `CGPA` | number | 5 through 9 | Academic CGPA |
| `Hostel` | integer | `0` or `1` | `1` if the student lives in a hostel; otherwise `0` |
| `HistoryOfBacklogs` | integer | `0` or `1` | `1` if the student has a history of backlogs; otherwise `0` |
| `Stream` | string | Exact supported value | Academic stream |

Supported `Stream` values:

- `Civil`
- `Computer Science`
- `Electrical`
- `Electronics And Communication`
- `Information Technology`
- `Mechanical`

Example request:

~~~json
{
  "Age": 22,
  "Internships": 1,
  "CGPA": 7.5,
  "Hostel": 0,
  "HistoryOfBacklogs": 0,
  "Stream": "Computer Science"
}
~~~

## Successful response

HTTP status: `200 OK`

~~~json
{
  "placement_probability": 0.82,
  "decision_threshold": 0.5,
  "predicted_class": 1,
  "predicted_label": "placed",
  "model_version": "1.0.0"
}
~~~

| Field | Type | Meaning |
|---|---|---|
| `placement_probability` | number | Calibrated positive-class probability between 0 and 1 |
| `decision_threshold` | number | Threshold used to derive the class; currently `0.5` |
| `predicted_class` | integer | `1` for placed or `0` for not placed |
| `predicted_label` | string | `placed` or `not_placed` |
| `model_version` | string | Version of the inference model |

The probability must remain separate from the existing `readinessScore` and any future Employability Index.

## Error behavior

Invalid, missing, out-of-range, incorrectly typed, or extra fields return `422 Unprocessable Entity`.

FastAPI/Pydantic request-schema errors use structured validation details. Service validation errors, such as an unsupported stream, use a string detail.

Example:

~~~json
{
  "detail": "Invalid Stream: Biotechnology"
}
~~~

The caller must not clamp values, map unsupported streams without an agreed mapping, or invent missing data.

If `models/placement_model.joblib` is unavailable, prediction returns `503 Service Unavailable`:

~~~json
{
  "detail": "Placement model artifact is unavailable. Run the placement model training script before prediction."
}
~~~

The health endpoint remains available when the model artifact is missing.

## Model and preprocessing

- Model name: SIPS Placement Predictor
- Model version: `1.0.0`
- Algorithm: XGBoost
- Calibration: isotonic
- Decision threshold: `0.50`
- Runtime: CPU-compatible
- Caller preprocessing: none beyond supplying the exact validated fields
- Service preprocessing: handled by the persisted calibrated pipeline

The model is loaded lazily and cached after its first successful load.

## Model artifact setup

The model artifact is intentionally excluded from Git.

From the repository root, generate it with:

~~~powershell
.\ml-service\.venv\Scripts\python.exe .\ml-service\scripts\train_placement_model.py
~~~

Canonical artifact path:

`ml-service/models/placement_model.joblib`

Tracked metadata path:

`ml-service/models/placement_model_metadata.yaml`

## Backend integration requirements

Recommended flow:

`React or Flutter -> Node/Express -> FastAPI -> placement model`

The Node backend should:

1. Authenticate and authorize the caller.
2. Derive college context from the JWT, not a client-supplied college ID.
3. Obtain the six required values from validated stored data and/or an explicit form.
4. Map application fields and categories to the exact ML contract.
5. Apply a timeout when calling the ML service.
6. Preserve validation failures as clear client errors.
7. Convert connection failures and HTTP 503 responses into clear service-unavailable responses.
8. Never fabricate a prediction when inference fails.
9. Persist predictions only after the team defines a prediction-history schema.

The current Student schema does not contain `Age`, `Internships`, `Hostel`, or `HistoryOfBacklogs`. Its `branch` labels and CGPA range also do not exactly match this contract. The application team must resolve those differences explicitly.

## Deployment configuration

The Node backend should use an environment variable for the ML service base URL, for example:

`ML_SERVICE_URL=http://127.0.0.1:8000`

The actual value depends on deployment topology. `localhost` works only when Node can reach FastAPI at that address from its own runtime environment.

The model artifact must be generated or provisioned in the deployed ML environment before prediction requests are served.

## Performance

Exact end-to-end latency has not been benchmarked. Benchmarking must be performed in the target deployment environment before defining a timeout or service-level objective.

## Limitations

- Performance is specific to the available engineering placement dataset.
- Predictions are not guarantees of real-world placement.
- Only the exact six documented production features are supported.
- Gender is audit-only and must not be sent as a prediction feature.
- SHAP explanations describe model behavior and associations, not causation.
