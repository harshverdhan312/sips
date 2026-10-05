/**
 * Fisher-Yates (Knuth) Shuffle Algorithm
 *
 * Performs an unbiased in-place shuffle of an array.
 * Time complexity: O(N)
 * Space complexity: O(1)
 *
 * @param {Array} array - Array to shuffle in-place
 * @param {Function} [randomFn=Math.random] - RNG function returning float in [0, 1)
 * @returns {Array} The shuffled array
 */
function shuffleArray(array, randomFn = Math.random) {
  if (!Array.isArray(array) || array.length <= 1) {
    return array;
  }
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

module.exports = {
  shuffleArray
};
