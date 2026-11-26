const placementPredictor = require('../services/placementPredictor');
const mlService = require('../services/mlService');

describe('Placement Predictor & Fallback Resilience', () => {
  const completeProfile = {
    Age: 21,
    Internships: 0,
    CGPA: 8.18,
    Hostel: 0,
    HistoryOfBacklogs: 0,
    Stream: 'Computer Science'
  };

  describe('placementPredictor.predictPlacement', () => {
    it('accurately predicts placement for high-performing student', () => {
      const result = placementPredictor.predictPlacement(completeProfile);
      expect(result).toHaveProperty('placement_probability');
      expect(result).toHaveProperty('decision_threshold', 0.50);
      expect(result).toHaveProperty('predicted_class', 1);
      expect(result).toHaveProperty('predicted_label', 'placed');
      expect(result.placement_probability).toBeGreaterThanOrEqual(0.9);
      expect(result.source).toBe('local_calibrated_model');
    });

    it('predicts lower likelihood for student with backlogs, low CGPA, and no internships', () => {
      const result = placementPredictor.predictPlacement({
        Age: 21,
        Internships: 0,
        CGPA: 6.0,
        Hostel: 0,
        HistoryOfBacklogs: 1,
        Stream: 'Mechanical'
      });
      expect(result.predicted_class).toBe(0);
      expect(result.predicted_label).toBe('not_placed');
      expect(result.placement_probability).toBeLessThan(0.50);
    });

    it('throws validation error when required fields are missing', () => {
      expect(() => {
        placementPredictor.predictPlacement({ Age: 21 });
      }).toThrow(/Missing required fields/);
    });

    it('throws validation error on invalid stream', () => {
      expect(() => {
        placementPredictor.predictPlacement({
          ...completeProfile,
          Stream: 'Biotechnology'
        });
      }).toThrow(/Invalid Stream/);
    });
  });

  describe('mlService.predictPlacement fallback on 429 / upstream errors', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('falls back to local placement predictor when upstream returns 429 Too Many Requests', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Too Many Requests' })
      });

      const prediction = await mlService.predictPlacement(completeProfile);
      expect(prediction).toBeDefined();
      expect(prediction.predicted_class).toBe(1);
      expect(prediction.predicted_label).toBe('placed');
      expect(prediction.placement_probability).toBe(1);
    });

    it('falls back to local placement predictor when upstream times out or is offline (503/ECONNREFUSED)', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed: connect ECONNREFUSED'));

      const prediction = await mlService.predictPlacement(completeProfile);
      expect(prediction).toBeDefined();
      expect(prediction.predicted_class).toBe(1);
      expect(prediction.placement_probability).toBe(1);
    });
  });
});
